# Elementa

Elementa is a molecular biology laboratory information management system (LIMS) for tracking multi-step genomic workflows. It manages extraction, PCR, Sanger sequencing, library preparation, and NGS runs — linking each step in the chain from raw specimen through to sequencing output.

> **Work in Progress** — Elementa has not yet been formally deployed or validated in a laboratory environment. Use at your own risk. Always back up your data regularly using the Export page before updates or changes.

---

## Features

- **Extraction runs** — DNA/RNA/Total Nucleic Acid extractions with kit, elution volume, yield (ng/µL), A260/280, A260/230, and RIN score per sample
- **PCR runs** — Target region, forward/reverse primers, annealing temperature, cycle count, polymerase, and amplicon size; gel result (pass/fail/weak/multiple bands) per sample
- **Sanger runs** — Service provider, order ID, primer, and direction; per-sample sequences with colour-coded base visualisation (A/T/C/G), GC% readout, and drag-and-drop FASTA/FASTQ import directly onto sample rows
- **Library prep runs** — i7/i5 index barcodes, input mass (ng), average fragment size, and library concentration per sample
- **NGS runs** — Illumina / ONT / PacBio / Other; flow cell, reagent kit, total reads, Q30%, and mean read length; libraries linked back to prep samples
- **Sample chaining** — PCR samples link to extractions; Sanger samples link to PCR samples; library preps link to extractions; NGS libraries link to library preps
- **Protocols / SOPs** — Reusable standard operating procedures with numbered steps (title, description, duration, temperature, RPM), materials list, and a printable view optimised for bench use
- **QC status tracking** — Pass / Fail / Repeat / Pending tags per sample across all workflow steps
- **Sample types** — Specimen / Positive control / Extraction blank / NTC auto-detected from specimen codes
- **Attachments** — File attachments per run
- **Data export** — CSV export of runs and samples
- **Tessera integration** — Specimen code autocomplete from a companion Tessera instance; "Record usage in Tessera" notification when a specimen is added, opening the Tessera specimen page with the Elementa run ID pre-filled in the usage log
- **First-run setup wizard** — Creates a real admin account on first startup
- **User management** — Admin-controlled user accounts with avatars

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12 + FastAPI + SQLAlchemy 2 |
| Database | SQLite (WAL mode) |
| Auth | JWT (HS256) + bcrypt |
| Frontend | React 18 + TypeScript + Vite |
| UI | Ant Design 5 |
| Deployment | Docker Compose |

---

## Getting Started

### Requirements

- Docker and Docker Compose

### Run

```bash
git clone https://github.com/XWBarton/elementa.git
cd elementa
docker compose up --build
```

Open [http://localhost:8231](http://localhost:8231) in your browser.

On first launch the setup wizard will prompt you to create an administrator account. The default `admin/changeme123` account is removed once setup is complete.

### Environment Variables

Create a `.env` file in the project root to override defaults:

```env
SECRET_KEY=change-this-to-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=60
FIRST_ADMIN_USERNAME=admin
FIRST_ADMIN_PASSWORD=changeme123
FIRST_ADMIN_EMAIL=admin@elementa.local

# Optional: URL of a companion Tessera specimen tracking instance.
# When set, specimen code autocomplete is available in run forms,
# and adding a sample triggers a prompt to log usage in Tessera.
TESSERA_URL=http://your-server:8520
```

`SECRET_KEY` should be a long random string in production. Generate one with:

```bash
openssl rand -hex 32
```

### Data Persistence

Run data is stored in a named Docker volume (`elementa_data`). The database will survive container restarts and rebuilds. To wipe all data:

```bash
docker compose down -v
```

---

## Workflow

Elementa models a linear molecular biology pipeline. Each step produces samples that can be linked forward into the next step:

```
Extraction Run
  └─ Extractions (per specimen)
       └─ PCR Run
            └─ PCR Samples (linked to extractions)
                 ├─ Sanger Run
                 │    └─ Sanger Samples (linked to PCR samples)
                 └─ Library Prep Run
                      └─ Library Preps (linked to extractions)
                           └─ NGS Run
                                └─ NGS Libraries (linked to library preps)
```

### Adding Samples

Each run detail page has an **Add Sample** button. For extractions, samples can be added one at a time or via bulk paste (one specimen code per line). For downstream steps, a searchable dropdown lists available upstream samples to link against.

### Sanger Sequences

Sequences can be entered manually or loaded by dragging a `.fasta`, `.fa`, `.fastq`, or `.fq` file directly onto a sample row in the table. For multi-record files, a picker modal lets you select which record to assign. Sequences are displayed with colour-coded bases (A = green, T = red, C = blue, G = dark) and a GC% readout.

### Protocols

SOPs are created once under **Protocols** and selected when creating any run. Each protocol has numbered steps with optional duration (min), temperature (°C), and RPM fields. The protocol detail page has a **Print** view that hides the application chrome and formats steps as a numbered list for bench use.

---

## Permissions

| Action | User | Admin |
|---|---|---|
| View all runs and samples | ✓ | ✓ |
| Create and edit runs | ✓ | ✓ |
| Add, edit, and delete samples | ✓ | ✓ |
| Create and edit protocols | ✓ | ✓ |
| Delete runs | | ✓ |
| Delete protocols | | ✓ |
| Manage users | | ✓ |
| Export data | ✓ | ✓ |

---

## Tessera Integration

Elementa can connect to a [Tessera](https://github.com/XWBarton/tessera) specimen tracking instance. Configure the Tessera URL under **Admin → Integrations**.

Once configured:

- Specimen code fields in run forms offer autocomplete against the Tessera specimen database
- Adding a specimen to an extraction, PCR, Sanger, or library prep run triggers a notification with an **Open Tessera** button that navigates directly to the specimen's page with the Record Usage modal pre-opened and the Elementa run reference pre-filled

---

## Development

The backend API runs on port `8000` inside Docker, exposed on `8232`. The frontend is served by nginx on `8231`. To develop locally without Docker:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs) when running the backend directly.
