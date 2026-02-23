import type { Locator } from '@playwright/test'
import { BasePage } from './base-page'

export interface LoginCredentials {
  username: string
  password: string
}

export class LoginPage extends BasePage {
  get path(): string {
    return '/login'
  }

  protected get headingText(): string {
    return 'Pulp UI'
  }

  get usernameInput(): Locator {
    return this.page.getByLabel('Username')
  }

  get passwordInput(): Locator {
    return this.page.getByLabel('Password')
  }

  get signInButton(): Locator {
    return this.page.getByRole('button', { name: 'Sign in' })
  }

  get subtitle(): Locator {
    return this.page.getByText('Sign in to manage your Pulp repositories')
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await this.usernameInput.fill(credentials.username)
    await this.passwordInput.fill(credentials.password)
    await this.signInButton.click()
  }

  async loginAndWaitForRedirect(credentials: LoginCredentials): Promise<void> {
    await this.login(credentials)
    await this.page.waitForURL('/')
    await this.page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 10000 })
  }

  async getValidationError(): Promise<string | null> {
    const errorElement = this.page.locator('[class*="error"], [class*="invalid"], text=/required/i').first()
    const isVisible = await errorElement.isVisible().catch(() => false)
    if (isVisible) {
      return errorElement.textContent()
    }
    return null
  }
}
