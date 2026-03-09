<p align="center">
  <img src="elementa-logo.png" alt="Elementa" height="120" />
</p>

# Elementa

Elementa is a molecular biology LIMS for tracking multi-step genomic workflows. It manages extraction, PCR, Sanger sequencing, library preparation, and NGS runs — linking each step from raw specimen through to sequencing output, with direct integration into [Tessera](https://github.com/XWBarton/tessera) for specimen tracking.

---

## Features

### Workflow steps
- **Extraction runs** — DNA/RNA extractions with kit, elution volume, yield (ng/µL), A260/280, A260/230, and RIN score per sample
- **PCR runs** — Target region, primers, annealing temperature, cycle count, polymerase, and amplicon size; gel result (Pass / Fail / Weak / Multiple bands) per sample
- **Sanger runs** — Service provider, order ID, primer and direction; per-sample sequences with colour-coded base visualisation (A/T/C/G), GC% readout, and drag-and-drop FASTA/FASTQ import onto sample rows
- **Library prep runs** — i7/i5 index barcodes, input mass (ng), average fragment size, and library concentration per sample
- **NGS runs** — Illumina / ONT / PacBio / Other; flow cell, reagent kit, total reads, Q30%, mean read length; libraries linked back to prep samples
- **Sample chaining** — each step links forward: Extraction → PCR → Sanger or Library Prep → NGS

### Supporting features
- **Protocols / SOPs** — reusable standard operating procedures with numbered steps, materials list, and a printable bench view; attached to runs to record the exact method used
- **Primer library** — searchable primer database with sequence, direction, target gene/taxa, annealing temp, and product size; one-click sequence copy
- **QC status tracking** — Pass / Fail / Repeat / Pending tags per sample across all steps
- **Attachments** — files attached per run (images, PDFs, spreadsheets, `.fasta`, `.fastq`, `.ab1`, `.vcf`, `.bam`, `.gz`, and more; 50 MB limit)
- **Data export** — CSV export of runs and samples for each workflow step
- **Tessera integration** — specimen autocomplete from Tessera; adding a sample auto-creates a usage log entry in Tessera; removing a sample clears the link

---

## Workflow

```
Extraction Run
  └─ Extractions (per specimen)
       └─ PCR Run
            └─ PCR Samples
                 ├─ Sanger Run
                 │    └─ Sanger Samples
                 └─ Library Prep Run
                      └─ Library Preps
                           └─ NGS Run
                                └─ NGS Libraries
```

---

## Deployment

### Requirements

- Docker and Docker Compose

### Run

```bash
git clone https://github.com/XWBarton/elementa.git
cd elementa
docker compose up --build
```

Open [http://localhost:8231](http://localhost:8231). On first launch the setup wizard creates an administrator account.

### Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your-long-random-secret            # generate with: openssl rand -hex 32
CORS_ORIGINS=https://elementa.example.com,https://tessera.example.com
FIRST_ADMIN_USERNAME=admin
FIRST_ADMIN_PASSWORD=changeme123
FIRST_ADMIN_EMAIL=admin@elementa.local

# Internal URL used by the backend to notify Tessera of run linkages.
# Use host.docker.internal if Tessera runs on the same machine.
TESSERA_INTERNAL_URL=http://host.docker.internal:8520
```

### Data Persistence

All data and uploaded files are stored in the `elementa_data` Docker volume and survive container restarts and rebuilds.

```bash
# Wipe all data (irreversible)
docker compose down -v
```

### Server Updates

```bash
git pull
docker compose up --build -d
```

---

## Tessera Integration

Configure the Tessera URL and API token under **Settings → Tessera** in the admin panel. Once configured:

- Specimen code fields offer autocomplete against the Tessera specimen database
- Adding a specimen to any run creates a usage log entry in Tessera automatically
- Removing a sample from a run clears the link in Tessera

The Tessera API token is a long-lived JWT generated from the Tessera user account used for the integration.

---

## Permissions

| Action | User | Admin |
|---|---|---|
| View all runs and samples | ✓ | ✓ |
| Create and edit runs | ✓ | ✓ |
| Add, edit, and delete samples | ✓ | ✓ |
| Manage protocols and primers | ✓ | ✓ |
| Upload attachments | ✓ | ✓ |
| Export data | ✓ | ✓ |
| Delete runs | | ✓ |
| Manage users | | ✓ |
| Configure Tessera integration | | ✓ |

---

## Security

See [SECURITY.md](SECURITY.md) for a full security overview including authentication controls, transport security, file upload validation, and the production deployment checklist.
