import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export class DomainsPage extends BasePage {
  get path(): string {
    return '/domains'
  }

  protected get headingText(): string {
    return 'Domains'
  }

  get subtitle(): Locator {
    return this.page.getByText('Manage multi-tenancy domains')
  }

  get createDomainButton(): Locator {
    return this.page.getByRole('button', { name: /Create Domain/i })
  }

  getEmptyState(): Locator {
    return this.page.getByText('No domains found')
  }

  getErrorState(): Locator {
    return this.page.getByText('Failed to load domains')
  }
}
