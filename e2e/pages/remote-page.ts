import type { Locator } from '@playwright/test'
import { BasePage } from './base-page.js'

export class RemotePage extends BasePage {
  get path(): string {
    return '/remotes'
  }

  protected get headingText(): string {
    return 'Remotes'
  }

  get subtitle(): Locator {
    return this.page.getByText('Configure remote sources for syncing content')
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /Create Remote/i })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search remotes...')
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  getRemoteRow(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  async clickRemote(name: string): Promise<void> {
    const row = this.getRemoteRow(name)
    const link = row.getByRole('link', { name, exact: true })
    await link.click()
  }

  getEmptyState(): Locator {
    return this.page.getByText('No remotes found')
  }

  getErrorState(): Locator {
    return this.page.getByText('Failed to load remotes')
  }
}
