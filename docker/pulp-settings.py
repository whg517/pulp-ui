# Pulp Settings for Docker Development
# This file is mounted into the Pulp container

from pathlib import Path

# MEDIA_ROOT - use the standard Pulp data directory
# Don't derive from settings.py location as it changes when mounted in Docker
MEDIA_ROOT = Path("/var/lib/pulp/media")
MEDIA_URL = "/media/"

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "your-secret-key-change-in-production"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]

# Database - overridden by environment variables in docker-compose
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "pulp",
        "USER": "pulp",
        "PASSWORD": "pulp",
        "HOST": "postgres",
        "PORT": "5432",
    }
}

# Redis - for task queuing
REDIS_HOST = "redis"
REDIS_PORT = 6379

# Cache
CACHE_ENABLED = True

# Content origin
CONTENT_ORIGIN = "http://localhost:8080"

# Domain (multi-tenancy) - disabled for simple setup
DOMAIN_ENABLED = False

# Static files
STATIC_URL = "/static/"

# Authentication - Basic auth for development
REST_FRAMEWORK__DEFAULT_AUTHENTICATION_CLASSES = [
    "rest_framework.authentication.BasicAuthentication",
    "rest_framework.authentication.SessionAuthentication",
]

# CORS - allow all for development
CORS_ORIGIN_ALLOW_ALL = True

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "%(levelname)s %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "loggers": {
        "": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "pulp": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# Optional: Enable API root view
ROOT_URLCONF = "pulpcore.app.urls"
