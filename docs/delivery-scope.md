# Sci-Fi Novel Introduction 1.0 Delivery Scope

## Included

- bilingual story section APIs
- image and text block CRUD APIs
- admin analytics APIs with table-friendly responses
- backend request logging and recent log browsing
- cookie session login/logout
- backup script for PostgreSQL and SQLite
- React reading site and admin login/editor UI
- pytest smoke coverage
- Docker and environment templates

## Not Yet Included

- reader comments / discussion system
- multi-editor review workflow
- recommendation models
- enterprise IAM / SSO
- object storage abstraction
- scheduled ETL jobs

## Recommended 1.1 Roadmap

1. Add Alembic migrations and tenant-aware configuration.
2. Integrate object storage for production-grade image hosting.
3. Add chapter sorting, richer search, and editorial drafts.
4. Connect metrics to Grafana and alerting.
5. Add CI pipeline for lint, tests, and static asset publishing.
