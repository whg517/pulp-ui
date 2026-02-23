import { LoginPage } from './login-page'
import { DashboardPage } from './dashboard-page'
import { RepositoryPage } from './repository-page'
import { RemotePage } from './remote-page'
import { DistributionPage } from './distribution-page'
import { ArtifactPage } from './artifact-page'
import { TaskPage } from './task-page'
import { WorkerPage } from './worker-page'
import { ACSPage } from './acs-page'
import { ContentGuardsPage } from './content-guards-page'
import { SigningServicesPage } from './signing-services-page'
import { DomainsPage } from './domains-page'
import { GroupsPage } from './groups-page'
import { UsersPage } from './users-page'
import type { Page } from '@playwright/test'

export class PageObjects {
  readonly login: LoginPage
  readonly dashboard: DashboardPage
  readonly repositories: RepositoryPage
  readonly remotes: RemotePage
  readonly distributions: DistributionPage
  readonly artifacts: ArtifactPage
  readonly tasks: TaskPage
  readonly workers: WorkerPage
  readonly acs: ACSPage
  readonly contentGuards: ContentGuardsPage
  readonly signingServices: SigningServicesPage
  readonly domains: DomainsPage
  readonly groups: GroupsPage
  readonly users: UsersPage

  constructor(page: Page) {
    this.login = new LoginPage({ page })
    this.dashboard = new DashboardPage({ page })
    this.repositories = new RepositoryPage({ page })
    this.remotes = new RemotePage({ page })
    this.distributions = new DistributionPage({ page })
    this.artifacts = new ArtifactPage({ page })
    this.tasks = new TaskPage({ page })
    this.workers = new WorkerPage({ page })
    this.acs = new ACSPage({ page })
    this.contentGuards = new ContentGuardsPage({ page })
    this.signingServices = new SigningServicesPage({ page })
    this.domains = new DomainsPage({ page })
    this.groups = new GroupsPage({ page })
    this.users = new UsersPage({ page })
  }
}
