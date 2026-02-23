import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export class UsersPage extends BasePage {
  get path(): string {
    return '/users'
  }

  protected get headingText(): string {
    return 'Users'
  }

  get subtitle(): Locator {
    return this.page.getByText('Manage user accounts')
  }

  get createUserButton(): Locator {
    return this.page.getByRole('button', { name: /Create User/i })
  }

  getUserLink(username: string): Locator {
    return this.page.getByRole('link', { name: username })
  }

  getEmptyState(): Locator {
    return this.page.getByText('No users found')
  }

  getErrorState(): Locator {
    return this.page.getByText('Failed to load users')
  }
}
