import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export class TaskPage extends BasePage {
  get path(): string {
    return '/tasks'
  }

  protected get headingText(): string {
    return 'Tasks'
  }

  get subtitle(): Locator {
    return this.page.getByText('Monitor and manage Pulp tasks')
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search tasks...')
  }

  get filterButton(): Locator {
    return this.page.getByRole('button', { name: /filter/i })
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: /refresh/i })
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  async getTaskRow(taskName: string): Promise<Locator> {
    return this.page.getByRole('row').filter({ hasText: taskName })
  }

  async getTaskByState(state: string): Promise<Locator> {
    return this.page.locator(`[data-state="${state}"]`).first()
  }

  async getEmptyState(): Promise<Locator> {
    return this.page.getByText('No tasks found')
  }

  async getErrorState(): Promise<Locator> {
    return this.page.getByText('Failed to load tasks')
  }

  async clickTask(name: string): Promise<void> {
    const row = await this.getTaskRow(name)
    const link = row.getByRole('link', { name })
    await link.click()
  }
}
