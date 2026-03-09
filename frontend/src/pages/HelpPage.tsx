import { Typography, Card, Steps, Tag, Divider, Table, Space } from 'antd'
import {
  ExperimentOutlined,
  ThunderboltOutlined,
  AlignLeftOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  RetweetOutlined,
  DownloadOutlined,
  LinkOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

const permissionsData = [
  { action: 'View all runs and samples', user: '✓', admin: '✓' },
  { action: 'Create and edit runs', user: '✓', admin: '✓' },
  { action: 'Add and edit samples within runs', user: '✓', admin: '✓' },
  { action: 'Upload attachments', user: '✓', admin: '✓' },
  { action: 'Delete samples from runs', user: '✓', admin: '✓' },
  { action: 'Delete runs', user: '', admin: '✓' },
  { action: 'Manage users', user: '', admin: '✓' },
  { action: 'Manage protocols and primers', user: '✓', admin: '✓' },
  { action: 'Configure Tessera integration', user: '', admin: '✓' },
  { action: 'Export data', user: '✓', admin: '✓' },
]

const permColumns = [
  { title: 'Action', dataIndex: 'action', key: 'action' },
  { title: 'User', dataIndex: 'user', key: 'user', width: 80, align: 'center' as const },
  { title: 'Admin', dataIndex: 'admin', key: 'admin', width: 80, align: 'center' as const },
]

export default function HelpPage() {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <Title level={3}>Quick Start Guide</Title>
      <Paragraph type="secondary">
        Everything you need to start recording molecular laboratory workflows in Elementa.
      </Paragraph>

      {/* ── Workflow overview ─────────────────────────────────────────── */}
      <Card style={{ marginBottom: 24, background: '#f0f5ff', border: '1px solid #bfdbfe' }}>
        <Title level={5} style={{ marginTop: 0 }}>Typical workflow</Title>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Extraction', color: '#1677ff' },
            { label: '→', color: '#888' },
            { label: 'PCR', color: '#0ea5e9' },
            { label: '→', color: '#888' },
            { label: 'Sanger', color: '#7c3aed' },
          ].map((s, i) => (
            <span key={i} style={{ color: s.color, fontWeight: s.label === '→' ? 400 : 600, fontSize: 14 }}>{s.label}</span>
          ))}
          <span style={{ color: '#888', marginLeft: 8 }}>or</span>
          {[
            { label: 'Library Prep', color: '#ea580c' },
            { label: '→', color: '#888' },
            { label: 'NGS Run', color: '#db2777' },
          ].map((s, i) => (
            <span key={i} style={{ color: s.color, fontWeight: s.label === '→' ? 400 : 600, fontSize: 14, marginLeft: 8 }}>{s.label}</span>
          ))}
        </div>
        <Paragraph style={{ marginTop: 8, marginBottom: 0 }} type="secondary">
          Each step is a <Text strong>Run</Text> (the batch event) containing <Text strong>Samples</Text> (per-specimen results). Runs are independent — you don't have to follow the full pipeline.
        </Paragraph>
      </Card>

      {/* ── 1. Extractions ───────────────────────────────────────────── */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          <ExperimentOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          1 — Extraction runs
        </Title>
        <Paragraph>
          An extraction run is a batch DNA/RNA extraction event. Each sample within the run corresponds to one specimen tube from Tessera.
        </Paragraph>
        <Steps
          direction="vertical"
          size="small"
          items={[
            { title: 'Go to Extractions', description: 'Click Extractions in the sidebar, then + New Run.' },
            { title: 'Fill in run details', description: 'Set the date, operator, extraction kit, protocol, and container type (plate or strip tubes).' },
            { title: 'Add samples', description: 'Paste specimen codes from Tessera into the bulk paste box, or add them one at a time. Each sample records elution volume, yield (ng/µL), and QC status.' },
            { title: 'Save', description: 'The run is now listed and linked back to Tessera automatically.' },
          ]}
        />
      </Card>

      {/* ── 2. PCR ───────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8, color: '#0ea5e9' }} />
          2 — PCR runs
        </Title>
        <Paragraph>
          Record PCR amplification batches. Samples reference an extraction from a previous run.
        </Paragraph>
        <Steps
          direction="vertical"
          size="small"
          items={[
            { title: 'Go to PCR', description: 'Click PCR in the sidebar, then + New Run.' },
            { title: 'Set run parameters', description: 'Date, operator, primers used, annealing temperature, cycle count, and protocol.' },
            { title: 'Add samples', description: 'Select the source extraction for each sample. Record band size (bp) and QC status (Pass / Fail / Weak).' },
          ]}
        />
      </Card>

      {/* ── 3. Sanger ────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          <AlignLeftOutlined style={{ marginRight: 8, color: '#7c3aed' }} />
          3 — Sanger runs
        </Title>
        <Paragraph>
          Record Sanger sequencing submissions and results.
        </Paragraph>
        <Steps
          direction="vertical"
          size="small"
          items={[
            { title: 'Go to Sanger', description: 'Click Sanger in the sidebar, then + New Run.' },
            { title: 'Set run details', description: 'Sequencing facility, submission date, primer used, and protocol.' },
            { title: 'Add samples', description: 'Select the source PCR sample. Once results are back, paste or upload the sequence and set QC status.' },
          ]}
        />
      </Card>

      {/* ── 4. Library Prep ──────────────────────────────────────────── */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          <DatabaseOutlined style={{ marginRight: 8, color: '#ea580c' }} />
          4 — Library prep runs
        </Title>
        <Paragraph>
          Record library preparation batches for NGS. Each prep references a source extraction.
        </Paragraph>
        <Steps
          direction="vertical"
          size="small"
          items={[
            { title: 'Go to Library Prep', description: 'Click Library Prep in the sidebar, then + New Run.' },
            { title: 'Set run details', description: 'Date, operator, library kit, target insert size, and protocol.' },
            { title: 'Add preps', description: 'Select source extractions. Record index/barcode, concentration (nM), and QC status.' },
          ]}
        />
      </Card>

      {/* ── 5. NGS ───────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          <CloudServerOutlined style={{ marginRight: 8, color: '#db2777' }} />
          5 — NGS runs
        </Title>
        <Paragraph>
          Record sequencing runs (Illumina, Nanopore, etc.) and pool the libraries submitted.
        </Paragraph>
        <Steps
          direction="vertical"
          size="small"
          items={[
            { title: 'Go to NGS Runs', description: 'Click NGS Runs in the sidebar, then + New Run.' },
            { title: 'Set run details', description: 'Platform, run date, flow cell ID, and sequencing facility.' },
            { title: 'Add libraries', description: 'Select prepared libraries from previous library prep runs. Record reads (millions) and QC status once data is returned.' },
          ]}
        />
      </Card>

      <Divider />
      <Title level={4}>Other features</Title>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          Protocols
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Store lab protocols as structured documents (written in Typst markup). Go to <Text strong>Protocols</Text> in the sidebar to create, edit, and download protocols as PDFs. Protocols can be attached to runs so the exact method used is recorded alongside the data.
        </Paragraph>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          <RetweetOutlined style={{ marginRight: 8 }} />
          Primer library
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Store and search your lab's primer sequences. Go to <Text strong>Primers</Text> in the sidebar. Each primer records the sequence (5′→3′), direction, target gene/region, target taxa, annealing temperature, and product size. Sequences can be copied to clipboard directly from the table.
        </Paragraph>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          <LinkOutlined style={{ marginRight: 8 }} />
          Tessera integration
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Elementa links back to Tessera automatically when you add specimens to a run — a usage log entry is created in Tessera recording the run type and reference. When you remove a sample from a run, the link in Tessera is cleared. The Tessera URL and API token are configured by an admin in <Text strong>Settings → Tessera</Text>.
        </Paragraph>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          <DownloadOutlined style={{ marginRight: 8 }} />
          Export
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Go to <Text strong>Export</Text> in the sidebar to download run data as CSV — extractions, PCR, Sanger, library preps, or NGS libraries. Admins can also download a full database backup or restore from a previous backup.
        </Paragraph>
      </Card>

      <Divider />
      <Title level={4}>Attachments</Title>
      <Paragraph>
        Any run can have files attached — gel images, QC reports, sequencing output files, etc. Open a run and use the <Text strong>Attachments</Text> tab. Accepted formats include images, PDFs, spreadsheets, and common bioinformatics formats (<Text code>.fasta</Text>, <Text code>.fastq</Text>, <Text code>.ab1</Text>, <Text code>.vcf</Text>, <Text code>.bam</Text>, <Text code>.gz</Text>, and more). Maximum file size is 50 MB.
      </Paragraph>

      <Divider />
      <Title level={4}>Permissions</Title>
      <Table
        dataSource={permissionsData}
        columns={permColumns}
        rowKey="action"
        size="small"
        pagination={false}
        style={{ marginBottom: 24 }}
      />

      <Divider />
      <Title level={4}>Tips</Title>
      <ul>
        <li>Click any run ID in a list to open its detail page.</li>
        <li>Use the bulk paste box on extraction runs to add many specimen codes at once — one per line.</li>
        <li>Samples within a run show their QC status as a colour-coded tag: <Tag color="green">Pass</Tag> <Tag color="orange">Weak</Tag> <Tag color="red">Fail</Tag>.</li>
        <li>Protocols attached to runs are version-snapshotted — editing a protocol later won't change what was recorded on past runs.</li>
        <li>Export a CSV backup before any server update.</li>
      </ul>
    </div>
  )
}
