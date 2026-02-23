import type { Locator } from '@playwright/test'
import { BasePage } from './base-page.js'

export class ArtifactPage extends BasePage {
  get path(): string {
    return '/artifacts'
  }

  protected get headingText(): string {
    return 'Artifacts'
  }

  get subtitle(): Locator {
    return this.page.getByText('Manage uploaded artifacts in your Pulp instance')
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search by file path...')
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  getArtifactRow(sha256: string): Locator {
    return this.page.getByRole('row').filter({ hasText: sha256.substring(0, 16) })
  }

  getEmptyState(): Locator {
    return this.page.getByText('No artifacts found')
  }

  getErrorState(): Locator {
    return this.page.getByText('Failed to load')
  }
}
