import type { Page, Locator } from '@playwright/test'

export interface BasePageOptions {
  page: Page
}

export abstract class BasePage {
  readonly page: Page

  constructor({ page }: BasePageOptions) {
    this.page = page
  }

  abstract get path(): string

  async goto(): Promise<void> {
    await this.page.goto(this.path)
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: this.headingText })
  }

  protected abstract get headingText(): string

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search/i)
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: /refresh/i })
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create/i })
  }

  get table(): Locator {
    return this.page.getByRole('table')
  }

  get rows(): Locator {
    return this.page.getByRole('row')
  }

  async waitForPageLoad(): Promise<void> {
    await this.heading.waitFor({ timeout: 10000 })
  }

  async waitForTableLoad(): Promise<void> {
    await this.table.waitFor({ timeout: 10000 })
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text)
  }

  async refresh(): Promise<void> {
    await this.refreshButton.click()
  }

  getRowByName(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  async clickRowAction(name: string, action: string): Promise<void> {
    const row = this.getRowByName(name)
    const actionButton = row.getByRole('button', { name: new RegExp(action, 'i') })
    await actionButton.click()
  }
}
