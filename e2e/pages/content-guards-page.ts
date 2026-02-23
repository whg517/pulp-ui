import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export class ContentGuardsPage extends BasePage {
  get path(): string {
    return '/content-guards'
  }

  protected get headingText(): string {
    return 'Content Guards'
  }

  get subtitle(): Locator {
    return this.page.getByText('Configure content access control')
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /Create Content Guard/i })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search content guards...')
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  async getContentGuardRow(name: string): Promise<Locator> {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  async getEmptyState(): Promise<Locator> {
    return this.page.getByText('No content guards found')
  }

  async getErrorState(): Promise<Locator> {
    return this.page.getByText('Failed to load content guards')
  }
}
