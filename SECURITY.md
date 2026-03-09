# Elementa — Security Overview

This document describes the security controls implemented in Elementa and is intended to provide assurance to stakeholders that sensitive molecular laboratory data is handled responsibly.

---

## Authentication & Access Control

| Control | Detail |
|---|---|
| **Authentication** | All API endpoints require a valid JSON Web Token (JWT). Unauthenticated requests are rejected with HTTP 401. |
| **Passwords** | Stored as bcrypt hashes (work factor 12). Plain-text passwords are never stored or logged. |
| **Token lifetime** | Tokens expire after 60 minutes. Users must re-authenticate to obtain a new token. |
| **Login rate limiting** | Login attempts are limited to **10 per minute per IP address**. Exceeding this limit returns HTTP 429, protecting against brute-force attacks. |
| **Role-based access** | Two roles exist: **Admin** and **User**. Destructive operations (delete runs, user management, settings) are restricted to Admins. |

---

## Transport Security

| Control | Detail |
|---|---|
| **HTTPS** | Elementa is designed to be deployed behind a reverse proxy (nginx) that terminates TLS. HTTPS is strongly recommended for all production deployments. |
| **CORS** | Cross-Origin Resource Sharing is restricted to explicitly configured origins via the `CORS_ORIGINS` environment variable. If not set, only `localhost` origins are permitted. |
| **Security headers** | The nginx frontend serves the following headers on every response: |
| | `X-Frame-Options: SAMEORIGIN` — prevents clickjacking |
| | `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing |
| | `X-XSS-Protection: 1; mode=block` — activates browser XSS filter |
| | `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage |
| | `Content-Security-Policy` — restricts resource origins; no external script sources |
| | `Permissions-Policy` — disables geolocation, camera, microphone APIs |
| | `Server` header suppressed — nginx version not disclosed |

---

## Data Integrity

| Control | Detail |
|---|---|
| **Input validation** | All API request bodies are validated by Pydantic v2 with strict type checking. Invalid inputs are rejected before reaching the database. |
| **SQL injection** | All database queries use SQLAlchemy ORM with parameterised queries. Raw SQL is only used in startup migrations with no user-controlled input. |
| **File uploads — attachments** | Uploaded attachments are validated by file extension (allowlist: `.pdf`, `.xlsx`, `.xls`, `.csv`, `.txt`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.docx`, `.doc`, `.zip`, `.fasta`, `.fastq`, `.fna`, `.fq`, `.fa`, `.ab1`, `.gbk`, `.gff`, `.vcf`, `.bam`, `.sam`, `.nwk`, `.newick`, `.tree`, `.bed`, `.gz`, `.tar`, `.tgz`). File size is capped at **50 MB**. Files are stored with a random UUID filename. |
| **File uploads — avatars** | Avatar uploads are restricted to image formats (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`) and capped at **5 MB**. |
| **Error messages** | Internal error details (subprocess output, connection exceptions) are logged server-side only and never returned to the client. |

---

## Tessera Integration

Elementa communicates with Tessera (specimen tracking LIMS) via a server-to-server API call — not through the browser. This means:

- The Tessera API token is stored in the Elementa database (not exposed to browser clients).
- Communication between the two systems uses the internal Docker network and does not traverse the public internet.
- If Tessera is unreachable, Elementa operations continue normally — the integration is non-blocking.

---

## Infrastructure

| Control | Detail |
|---|---|
| **Isolated containers** | Backend and frontend run in separate Docker containers. The database and uploaded files are stored in a named Docker volume, isolated from the host filesystem. |
| **No external dependencies at runtime** | Elementa does not call any external APIs during normal operation (Tessera integration is optional and internal). |
| **Environment-based secrets** | `SECRET_KEY`, `FIRST_ADMIN_PASSWORD`, and other sensitive values are configured via environment variables / `.env` file, not hardcoded in source. |

---

## Recommended Production Checklist

Before deploying to a production environment with sensitive data, verify the following:

- [ ] **HTTPS is enabled** — configure your reverse proxy or load balancer to terminate TLS with a valid certificate.
- [ ] **`SECRET_KEY` is changed** — set a long (32+ character) random string in your `.env` file. Example: `openssl rand -hex 32`.
- [ ] **`FIRST_ADMIN_PASSWORD` is changed** — update the default admin password immediately after first login, or set a strong password via environment variable before first run.
- [ ] **`CORS_ORIGINS` is set** — configure the allowed frontend origin(s), e.g. `CORS_ORIGINS=https://elementa.my-org.com,https://tessera.my-org.com`.
- [ ] **Regular backups** — the SQLite database and `/data` directory should be backed up regularly. The Docker volume (`elementa_data`) can be backed up with `docker run --rm -v elementa_data:/data -v $(pwd):/backup alpine tar czf /backup/elementa-backup.tar.gz /data`.

---

## Known Limitations

| Limitation | Notes |
|---|---|
| **JWT in browser localStorage** | The authentication token is stored in `localStorage`, which is accessible to JavaScript. This is a common pattern but is vulnerable if an XSS attack occurs. The Content-Security-Policy header significantly reduces XSS risk. |
| **No audit log** | There is currently no persistent audit trail of who accessed or modified which records. |
| **SQLite single-writer concurrency** | SQLite in WAL mode is used for simplicity. For high-concurrency deployments, migrating to PostgreSQL is recommended. |
| **Token revocation** | JWTs cannot be invalidated before expiry (e.g. on logout or password change). The 60-minute expiry window limits the impact of token theft. |
| **Tessera API token plaintext** | The Tessera integration token is stored in the database without encryption. Physical database access would expose this token. |

---

*Last updated: March 2026*
