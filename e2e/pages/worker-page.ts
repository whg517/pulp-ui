import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export class WorkerPage extends BasePage {
  get path(): string {
    return '/workers'
  }

  protected get headingText(): string {
    return 'Workers'
  }

  get subtitle(): Locator {
    return this.page.getByText('Manage Pulp workers')
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search workers...')
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  async getWorkerRow(name: string): Promise<Locator> {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  async getEmptyState(): Promise<Locator> {
    return this.page.getByText('No workers found')
  }

  async getErrorState(): Promise<Locator> {
    return this.page.getByText('Failed to load workers')
  }

  async clickWorker(name: string): Promise<void> {
    const row = await this.getWorkerRow(name)
    const link = row.getByRole('link', { name })
    await link.click()
  }
}
