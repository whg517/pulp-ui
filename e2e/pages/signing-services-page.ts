import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export class SigningServicesPage extends BasePage {
  get path(): string {
    return '/signing-services'
  }

  protected get headingText(): string {
    return 'Signing Services'
  }

  get subtitle(): Locator {
    return this.page.getByText('Manage code signing services')
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /Create Signing Service/i })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search signing services...')
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  async getSigningServiceRow(name: string): Promise<Locator> {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  async getEmptyState(): Promise<Locator> {
    return this.page.getByText('No signing services found')
  }

  async getErrorState(): Promise<Locator> {
    return this.page.getByText('Failed to load signing services')
  }
}
