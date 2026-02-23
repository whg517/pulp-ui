import type { Locator } from '@playwright/test'
import { BasePage } from './base-page.js'

export class DistributionPage extends BasePage {
  get path(): string {
    return '/distributions'
  }

  protected get headingText(): string {
    return 'Distributions'
  }

  get subtitle(): Locator {
    return this.page.getByText('Publish and serve your content')
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /Create Distribution/i })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search distributions...')
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  getDistributionRow(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  async clickDistribution(name: string): Promise<void> {
    const row = this.getDistributionRow(name)
    const link = row.getByRole('link', { name, exact: true })
    await link.click()
  }

  getEmptyState(): Locator {
    return this.page.getByText('No distributions found')
  }

  getErrorState(): Locator {
    return this.page.getByText('Failed to load distributions')
  }
}
