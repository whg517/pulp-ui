import type { Locator } from '@playwright/test'
import { BasePage } from './base-page.js'

export class RepositoryPage extends BasePage {
  get path(): string {
    return '/repositories'
  }

  protected get headingText(): string {
    return 'Repositories'
  }

  get subtitle(): Locator {
    return this.page.getByText('Manage your Pulp repositories')
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /Create Repository/i })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search repositories...')
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  getRepositoryRow(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  async clickRepository(name: string): Promise<void> {
    const row = this.getRepositoryRow(name)
    const link = row.getByRole('link', { name, exact: true })
    await link.click()
  }

  getEmptyState(): Locator {
    return this.page.getByText('No repositories found')
  }

  getErrorState(): Locator {
    return this.page.getByText('Failed to load repositories')
  }
}
