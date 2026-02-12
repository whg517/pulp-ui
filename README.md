# Pulp UI

A modern web UI for [Pulp](https://pulpproject.org/) - an open source platform for managing software packages.

## About Pulp

Pulp is a platform for managing software packages that makes it easy to:
- **Fetch** content from remote sources
- **Upload** custom content
- **Organize** content in versioned repositories
- **Distribute** content through various protocols

Pulp supports multiple content types including: Ansible, Container/OCI, Debian, File, Gem, Maven, NPM, OSTree, Python, and RPM.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Framework**: [React 19](https://react.dev/) with TypeScript

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime and package manager)
- A running Pulp instance (for development)

### Installation

```bash
# Install dependencies
bun install
```

### Development

1. Configure your Pulp backend URL in `.env.local`:
```bash
cp .env.example .env.local
# Edit .env.local with your Pulp instance configuration
```

2. Start the development server:
```bash
bun dev
```

The UI will be available at `http://localhost:5173/`

### Building for Production

```bash
bun run build
```

Build artifacts will be in the `dist/` directory.

### Preview Production Build

```bash
bun run preview
```

## Configuration

### Environment Variables

See `.env.example` for available configuration options:
- `VITE_PULP_API_URL` - Pulp API base URL
- `VITE_PULP_API_BASE_PATH` - API base path
- `VITE_DEBUG` - Enable debug logging

### Post-Build Configuration

The built UI can be further configured by serving a `/pulp-ui-config.json` file:
- `API_BASE_PATH` - Override Pulp API path
- `UI_BASE_PATH` - Override UI base path
- `UI_EXTERNAL_LOGIN_URI` - External SSO login URI
- `EXTRA_VERSION` - Additional version info

## Pulp Backend Setup

For local development, you can run Pulp using:

### Using Docker

```bash
mkdir -p ~/pulp-backend/{settings/certs,pulp_storage,pgsql}
cd ~/pulp-backend
echo "CONTENT_ORIGIN='http://localhost:8080'" >> settings/settings.py

docker run --publish 8080:80 \
           --replace --name pulp \
           --volume "$(pwd)/settings":/etc/pulp \
           --volume "$(pwd)/pulp_storage":/var/lib/pulp \
           --volume "$(pwd)/pgsql":/var/lib/pgsql \
           docker.io/pulp/pulp
```

### Reset Admin Password

```bash
docker exec -it pulp pulpcore-manager reset-admin-password --password admin
```

## License

Apache-2.0

## Resources

- [Pulp Documentation](https://docs.pulpproject.org/)
- [Pulp Project](https://pulpproject.org/)
- [Pulp on GitHub](https://github.com/pulp/pulpcore)
