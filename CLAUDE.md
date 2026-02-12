# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web UI for [Pulp](https://pulpproject.org/) - an open source platform for managing software packages. Pulp is used to fetch, upload, organize, and distribute software packages on-premises or in the cloud.

### Pulp Architecture

Pulp is a plugin-based system with:
- **pulpcore**: Core functionality including task queuing, high-performance downloading, and repository versioning
- **Content plugins**: Support for various package types (Ansible, Container/OCI, Debian, File, Gem, Maven, NPM, OSTree, Python, RPM)
- **REST API**: All interactions go through the Pulp REST API (typically at `/pulp/api/v3/`)
- **Domains**: Multi-tenancy support for isolating content
- **RBAC**: Role-based access control for permissions

The UI communicates with Pulp's REST API and provides a user-friendly interface for:
- Creating and managing repositories
- Syncing content from remote sources
- Uploading and organizing content
- Distributing content through various publication types
- Monitoring tasks and operations

## Development Commands

### Core Development
```bash
# Install dependencies
bun install

# Start development server (Vite dev server with HMR)
bun dev

# Type checking
tsc -b

# Build for production
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint
```

### Bun as Runtime
This project uses [Bun](https://bun.sh/) as the JavaScript runtime and package manager. Key differences from npm/node:
- `bun install` - Install dependencies (faster than npm install)
- `bun dev` - Run development commands
- `bun run <script>` - Run npm scripts
- `bunx <package>` - Execute packages (like npx)

## Technology Stack

- **Runtime**: Bun (JavaScript runtime/package manager)
- **Build Tool**: Vite (fast dev server, HMR, optimized builds)
- **Framework**: React 19 with TypeScript
- **Styling**: CSS (can be extended with CSS modules, Tailwind, or other solutions)

## Project Structure

```
src/
├── main.tsx       # React entry point
├── App.tsx        # Root component
├── index.css      # Global styles
└── assets/        # Static assets
```

## Pulp API Integration

The UI will need to integrate with the Pulp REST API:

### API Base Path
- Default: `/pulp/api/v3/`
- Configurable via environment variable or post-build configuration

### Key API Concepts
- **Repositories**: Storage for content
- **Remotes**: Configuration for syncing from upstream sources
- **Distributions**: Published content served at specific URLs
- **Tasks**: Async operations (sync, publish, upload)
- **Content Guards**: Access control for distributions

### Authentication
Pulp supports multiple authentication methods:
- Basic Auth
- JSON Header authentication
- External services (Keycloak, etc.)

## Configuration

### Development Proxy
For development, you'll need to proxy API requests to a running Pulp instance. Configure in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/pulp': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

### Post-Build Configuration
The built UI can be configured by serving `/pulp-ui-config.json`:
- `API_BASE_PATH` - Pulp API base path (default: `/pulp/api/v3/`)
- `UI_BASE_PATH` - UI base path (default: `/ui/`)
- `UI_EXTERNAL_LOGIN_URI` - External login URI for SSO
- `EXTRA_VERSION` - Additional version string to display

## Content Type Plugins

Pulp supports multiple content types through plugins. Each plugin extends the API with:
- Content-specific models and serializers
- Repository variants (e.g., `ansible.AnsibleRepository`)
- Publication types (e.g., `ansible.AnsiblePublication`)
- Distribution types (e.g., `ansible.AnsibleDistribution`)

Common content types to support in the UI:
- **Ansible**: Collections, roles, and playbooks
- **Container/OCI**: Docker images, Helm charts, Flatpak images
- **Debian**: Debian packages
- **File**: Generic file storage
- **Python**: PyPI packages
- **RPM**: RPM packages and repositories
