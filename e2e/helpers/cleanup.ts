import type { PulpAPIClient } from './api.js'
import { PulpAPIError } from './api.js'

type EntityType = 'distribution' | 'remote' | 'repository'

interface CleanupEntity {
  type: EntityType
  href: string
}

/**
 * Manager for cleaning up test entities in the correct dependency order.
 * Handles safe deletion with retry logic for transient conflicts.
 */
export class CleanupManager {
  private entities: CleanupEntity[] = []
  private apiClient: PulpAPIClient | null = null

  /**
   * Set the API client to use for cleanup operations
   * @param client - The PulpAPIClient instance
   */
  setApiClient(client: PulpAPIClient): void {
    this.apiClient = client
  }

  /**
   * Register an entity for cleanup
   * @param type - The type of entity (distribution, remote, or repository)
   * @param href - The Pulp href of the entity
   */
  register(type: EntityType, href: string): void {
    // Avoid duplicates
    if (!this.entities.some((e) => e.href === href)) {
      this.entities.push({ type, href })
    }
  }

  /**
   * Clear all registered entities without deleting them
   */
  clear(): void {
    this.entities = []
  }

  /**
   * Delete a single entity with retry logic
   * @param href - The href of the entity to delete
   * @param retries - Number of retries for 409 conflicts (default: 3)
   * @returns true if deleted successfully, false if already deleted (404)
   */
  private async safeDelete(href: string, retries = 3): Promise<boolean> {
    if (!this.apiClient) {
      console.warn(`CleanupManager: No API client set, cannot delete ${href}`)
      return false
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.apiClient.delete(href)
        return true
      } catch (error) {
        if (error instanceof PulpAPIError) {
          // 404 - already deleted, this is fine
          if (error.status === 404) {
            return false
          }

          // 409 - conflict, retry after delay
          if (error.status === 409 && attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            continue
          }
        }

        lastError = error instanceof Error ? error : new Error(String(error))

        // Log warning but continue with other entities
        console.warn(
          `CleanupManager: Failed to delete ${href} (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}`
        )

        // For non-409 errors, don't retry
        if (!(error instanceof PulpAPIError) || error.status !== 409) {
          break
        }
      }
    }

    return false
  }

  /**
   * Clean up all registered entities in dependency order.
   * Order: distributions first (depend on repositories),
   *        then remotes (no dependencies),
   *        finally repositories (may have distributions pointing to them)
   */
  async cleanupAll(): Promise<void> {
    if (!this.apiClient) {
      console.warn('CleanupManager: No API client set, skipping cleanup')
      return
    }

    // Group entities by type for ordered deletion
    const distributions = this.entities.filter((e) => e.type === 'distribution')
    const remotes = this.entities.filter((e) => e.type === 'remote')
    const repositories = this.entities.filter((e) => e.type === 'repository')

    // Delete in dependency order
    // 1. Distributions first (they depend on repositories)
    for (const entity of distributions) {
      await this.safeDelete(entity.href)
    }

    // 2. Remotes (no dependencies)
    for (const entity of remotes) {
      await this.safeDelete(entity.href)
    }

    // 3. Repositories last (distributions may point to them)
    for (const entity of repositories) {
      await this.safeDelete(entity.href)
    }

    // Clear the list after cleanup
    this.entities = []
  }

  /**
   * Clean up entities matching a pattern by their href.
   * Useful for cleaning up orphaned test entities.
   * @param pattern - RegExp pattern to match against entity hrefs
   */
  async cleanupByPattern(pattern: RegExp): Promise<void> {
    const matching = this.entities.filter((e) => pattern.test(e.href))
    const nonMatching = this.entities.filter((e) => !pattern.test(e.href))

    // Replace entities list with non-matching ones
    this.entities = nonMatching

    // Delete matching entities in dependency order
    const distributions = matching.filter((e) => e.type === 'distribution')
    const remotes = matching.filter((e) => e.type === 'remote')
    const repositories = matching.filter((e) => e.type === 'repository')

    // Delete in dependency order
    for (const entity of distributions) {
      await this.safeDelete(entity.href)
    }

    for (const entity of remotes) {
      await this.safeDelete(entity.href)
    }

    for (const entity of repositories) {
      await this.safeDelete(entity.href)
    }
  }

  /**
   * Get the count of registered entities
   */
  get count(): number {
    return this.entities.length
  }

  /**
   * Get all registered entities (for debugging)
   */
  get registeredEntities(): ReadonlyArray<CleanupEntity> {
    return [...this.entities]
  }
}

/**
 * Singleton instance of CleanupManager for use across tests
 */
export const cleanupManager = new CleanupManager()
