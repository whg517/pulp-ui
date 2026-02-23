import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export class DashboardPage extends BasePage {
  get path(): string {
    return '/'
  }

  protected get headingText(): string {
    return 'Dashboard'
  }

  get subtitle(): Locator {
    return this.page.getByText('Overview of your Pulp instance')
  }

  get systemStatusCard(): Locator {
    return this.page.getByText('System Status')
  }

  get statisticsCards(): Locator {
    return this.page.locator('[data-testid*="stat"], [class*="stat"]').first()
  }

  get recentTasksSection(): Locator {
    return this.page.getByText('Recent Tasks')
  }

  get recentTasksSubtitle(): Locator {
    return this.page.getByText('Latest operations in your Pulp instance')
  }

  get connectionErrorCard(): Locator {
    return this.page.getByText('Connection Error')
  }

  async getStatCardByName(name: string): Promise<Locator> {
    return this.page.getByText(new RegExp(name, 'i'))
  }

  async getTaskByState(state: string): Promise<Locator> {
    return this.page.locator(`[data-state="${state}"], [class*="${state}"]`).first()
  }
}
