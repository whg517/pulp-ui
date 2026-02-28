import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export class GroupsPage extends BasePage {
  get path(): string {
    return '/access/groups'
  }

  protected get headingText(): string {
    return 'Groups'
  }

  get subtitle(): Locator {
    return this.page.getByText('Manage user groups')
  }

  get createGroupButton(): Locator {
    return this.page.getByRole('button', { name: /Create Group/i })
  }

  getEmptyState(): Locator {
    return this.page.getByText('No groups found')
  }

  getErrorState(): Locator {
    return this.page.getByText('Failed to load groups')
  }
}
