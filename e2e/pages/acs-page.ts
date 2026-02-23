import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export class ACSPage extends BasePage {
  get path(): string {
    return '/acs'
  }

  protected get headingText(): string {
    return 'ACS'
  }

  get subtitle(): Locator {
    return this.page.getByText('Manage Alternative Content Sources')
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /Create ACS/i })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search ACS...')
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  async getACSRow(name: string): Promise<Locator> {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  async getEmptyState(): Promise<Locator> {
    return this.page.getByText('No ACS found')
  }

  async getErrorState(): Promise<Locator> {
    return this.page.getByText('Failed to load ACS')
  }
}
