import { useState } from 'react'
import { Typography, Card, Steps, Tag, Divider, Table, Space, Input } from 'antd'
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
  FolderOutlined,
  LockOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

const permissionsData = [
  { action: 'View runs and samples (unprotected projects)', user: '✓', admin: '✓' },
  { action: 'View runs in protected projects (if a member)', user: '✓', admin: '✓' },
  { action: 'View runs in protected projects (any)', user: '', admin: '✓' },
  { action: 'Create and edit runs', user: '✓', admin: '✓' },
  { action: 'Add and edit samples within runs', user: '✓', admin: '✓' },
  { action: 'Upload attachments', user: '✓', admin: '✓' },
  { action: 'Delete samples from runs', user: '✓', admin: '✓' },
  { action: 'Delete runs', user: '', admin: '✓' },
  { action: 'Create and manage projects', user: '', admin: '✓' },
  { action: 'Add / remove project members', user: '', admin: '✓' },
  { action: 'Toggle project protection', user: '', admin: '✓' },
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

function matches(text: string, query: string): boolean {
  if (!query.trim()) return true
  return text.toLowerCase().includes(query.toLowerCase().trim())
}

export default function HelpPage() {
  const [query, setQuery] = useState('')

  const groups = [
    {
      sections: [
        {
          key: 'workflow-overview',
          searchText: 'typical workflow overview pipeline extraction PCR sanger library prep NGS run batch operator project how it works start steps',
          node: (
            <Card style={{ marginBottom: 24, background: '#f0f5ff', border: '1px solid #bfdbfe' }}>
              <Title level={5} style={{ marginTop: 0 }}>Typical workflow</Title>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                <Tag color="blue">Project</Tag>
                <span style={{ color: '#888' }}>→</span>
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
              <Paragraph style={{ marginBottom: 0 }} type="secondary">
                Every run must be assigned to a <Text strong>Project</Text> and an <Text strong>Operator</Text> before it can be saved. Each step is a <Text strong>Run</Text> (the batch event) containing <Text strong>Samples</Text> (per-specimen results). Runs are independent — you don't have to follow the full pipeline.
              </Paragraph>
            </Card>
          ),
        },
        {
          key: 'projects',
          searchText: 'set up project admin create project code AMPH2024 short code members access control protect how do i start new project sidebar manage',
          node: (
            <Card style={{ marginBottom: 24 }}>
              <Title level={4} style={{ marginTop: 0 }}>
                <FolderOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
                0 — Set up a project (admin)
              </Title>
              <Paragraph>
                Every run must belong to a project. Projects let you group and filter all workflow runs across the app, and optionally restrict access to members only.
              </Paragraph>
              <Steps
                direction="vertical"
                size="small"
                items={[
                  { title: 'Go to Projects', description: 'Click Projects in the sidebar (under Manage).' },
                  { title: 'Create a project', description: 'Enter a short code (e.g. AMPH2024, 1–20 uppercase alphanumeric) and a name. The code is used as a label on all list pages.' },
                  {
                    title: 'Add members',
                    description: 'Click Members next to the project and add users. Members are used for access control on protected projects.',
                  },
                  {
                    title: 'Optionally protect the project',
                    description: (
                      <span>
                        Enable the <Text strong>Protected</Text> toggle (lock icon) to restrict all runs in this project to members only. Admins always have access. Non-members cannot view, edit, or export any run assigned to a protected project.
                      </span>
                    ),
                  },
                ]}
              />
            </Card>
          ),
        },
        {
          key: 'extractions',
          searchText: 'extraction run DNA RNA extract batch specimen tube Tessera elution volume yield ng/µL QC status kit protocol plate strip tube bulk paste how to add extraction',
          node: (
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
                  { title: 'Go to Extractions', description: 'Click Extractions in the sidebar (under Workflows), then + New Run.' },
                  { title: 'Fill in run details', description: 'Project and operator are required (operator autofills to the logged-in user). Also set the date, extraction kit, protocol, and container type (plate or strip tubes).' },
                  { title: 'Additional projects', description: 'Optionally tag the run to extra projects beyond the primary one — useful when a run spans multiple collections.' },
                  { title: 'Add samples', description: 'Paste specimen codes from Tessera into the bulk paste box, or add them one at a time. Each sample records input quantity (with unit: mg, g, µl, ml, or pieces), elution volume, yield (ng/µL), and QC status.' },
                  { title: 'Save', description: 'The run is now listed and linked back to Tessera automatically.' },
                  { title: 'Lock the run', description: 'Once data entry is complete, click Lock to prevent further edits or sample deletions. Use Unlock to reopen.' },
                ]}
              />
            </Card>
          ),
        },
        {
          key: 'pcr',
          searchText: 'PCR run amplification batch primer annealing temperature cycles protocol band size bp QC pass fail weak source extraction how to record PCR amplify',
          node: (
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
                  { title: 'Set run parameters', description: 'Project and operator are required (operator autofills). Also set date, annealing temperature, cycle count, and protocol.' },
                  { title: 'Primer pairs', description: 'Attach one or more primer pairs from the library — supports multiplexed runs with multiple primer pairs per batch.' },
                  { title: 'Additional projects', description: 'Optionally tag to extra projects beyond the primary.' },
                  { title: 'Add samples', description: 'Select the source extraction for each sample. Record band size (bp) and QC status (Pass / Fail / Weak).' },
                  { title: 'Lock the run', description: 'Click Lock on the run detail page to freeze the record once data entry is complete.' },
                ]}
              />
            </Card>
          ),
        },
        {
          key: 'sanger',
          searchText: 'sanger sequencing run submission results sequencing facility direction primer sequence QC status paste upload how to submit for sequencing',
          node: (
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
                  { title: 'Set run details', description: 'Project and operator are required (operator autofills). Also set sequencing facility, submission date, primer, and direction.' },
                  { title: 'Additional projects', description: 'Optionally tag to extra projects beyond the primary.' },
                  { title: 'Add samples', description: 'Select the source PCR sample. Once results are back, paste or upload the sequence and set QC status.' },
                  { title: 'Lock the run', description: 'Click Lock once sequences are finalised to prevent further changes.' },
                ]}
              />
            </Card>
          ),
        },
        {
          key: 'library-prep',
          searchText: 'library prep preparation NGS library kit target region protocol index barcode concentration nM QC status source extraction how to prepare a library',
          node: (
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
                  { title: 'Set run details', description: 'Project and operator are required (operator autofills). Also set date, library kit, and protocol.' },
                  { title: 'Primer pairs', description: 'Attach one or more primer pairs — supports multiplexed library prep runs.' },
                  { title: 'Additional projects', description: 'Optionally tag to extra projects beyond the primary.' },
                  { title: 'Add preps', description: 'Select source extractions. Record index/barcode, concentration (nM), and QC status.' },
                  { title: 'Lock the run', description: 'Click Lock once prep data is finalised.' },
                ]}
              />
            </Card>
          ),
        },
        {
          key: 'ngs',
          searchText: 'NGS run next generation sequencing Illumina Nanopore PacBio platform flow cell instrument pool libraries reads millions QC how to record a sequencing run',
          node: (
            <Card style={{ marginBottom: 24 }}>
              <Title level={4} style={{ marginTop: 0 }}>
                <CloudServerOutlined style={{ marginRight: 8, color: '#db2777' }} />
                5 — NGS runs
              </Title>
              <Paragraph>
                Record sequencing runs (Illumina, Nanopore, PacBio, etc.) and pool the libraries submitted.
              </Paragraph>
              <Steps
                direction="vertical"
                size="small"
                items={[
                  { title: 'Go to NGS Runs', description: 'Click NGS Runs in the sidebar, then + New Run.' },
                  { title: 'Set run details', description: 'Project, operator (autofills), and platform are required. Also set run date, flow cell ID, instrument, and storage host/path for raw data.' },
                  { title: 'Additional projects', description: 'Optionally tag to extra projects beyond the primary.' },
                  { title: 'Add libraries', description: 'Select prepared libraries from previous library prep runs. Record reads (millions) and QC status once data is returned.' },
                  { title: 'Lock the run', description: 'Click Lock to freeze the run record once sequencing output is confirmed.' },
                ]}
              />
            </Card>
          ),
        },
      ],
    },
    {
      header: (
        <>
          <Divider />
          <Title level={4}>Other features</Title>
        </>
      ),
      sections: [
        {
          key: 'run-locking',
          searchText: 'lock unlock run freeze prevent edit delete protect finalise close run locked badge warning admin operator',
          node: (
            <Card style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                <LockOutlined style={{ marginRight: 8 }} />
                Run locking
              </Title>
              <Paragraph style={{ marginBottom: 0 }}>
                Any run can be locked once data entry is complete. Open the run detail page and click <Text strong>Lock</Text> — the run will display a <Text strong>Locked</Text> badge and all edit, add-sample, and delete-sample actions will be disabled. The operator who created the run or any admin can lock or unlock a run. Deleting a locked run requires admin access.
              </Paragraph>
            </Card>
          ),
        },
        {
          key: 'filtering',
          searchText: 'filter by project operator dropdown narrow results list extractions PCR sanger library prep NGS runs search find specific runs',
          node: (
            <Card style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                <FolderOutlined style={{ marginRight: 8 }} />
                Filtering by project and operator
              </Title>
              <Paragraph style={{ marginBottom: 0 }}>
                Every workflow list page (Extractions, PCR, Sanger, Library Prep, NGS Runs) has <Text strong>Filter by project</Text> and <Text strong>Filter by operator</Text> dropdowns at the top. Use these to quickly narrow down runs to a specific project or team member. Filters can be combined.
              </Paragraph>
            </Card>
          ),
        },
        {
          key: 'protected',
          searchText: 'protected projects lock access control members admin hidden restricted visibility confidential restrict access non-member cannot view',
          node: (
            <Card style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                <LockOutlined style={{ marginRight: 8 }} />
                Protected projects
              </Title>
              <Paragraph style={{ marginBottom: 0 }}>
                Admins can mark any project as <Text strong>Protected</Text> from the Projects page (toggle the lock switch in the Create or Edit modal). When protected, only project members and admins can view, edit, or export runs assigned to that project. Non-members will not see those runs in any list or be able to access them directly. A lock icon next to the project code in the Projects table indicates it is protected.
              </Paragraph>
            </Card>
          ),
        },
        {
          key: 'protocols',
          searchText: 'protocols lab methods documents PDF thermocycling steps attach to run version snapshot cycle denaturation annealing extension export import txt share backup',
          node: (
            <Card style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                <FileTextOutlined style={{ marginRight: 8 }} />
                Protocols
              </Title>
              <Paragraph style={{ marginBottom: 0 }}>
                Store lab protocols as structured documents. Go to <Text strong>Protocols</Text> in the sidebar (under Reference) to create, edit, and download protocols as PDFs. Protocols can be attached to runs so the exact method used is recorded alongside the data. Protocols support a <Text strong>Thermocycling</Text> step type with structured fields for cycle count, denaturation, annealing, extension temperatures and times — these render as a formatted table in the PDF. Protocols also support <Text strong>References</Text> (title + URL links), which appear in the detail view, PDF, and text export. Protocols can be exported as importable text files (<Text code>.txt</Text>) for sharing or backup.
              </Paragraph>
            </Card>
          ),
        },
        {
          key: 'primers',
          searchText: "primer library sequences 5' 3' direction target gene region taxa annealing temperature product size copy clipboard bulk add TSV CSV paste",
          node: (
            <Card style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                <RetweetOutlined style={{ marginRight: 8 }} />
                Primer library
              </Title>
              <Paragraph style={{ marginBottom: 0 }}>
                Store and search your lab's primer sequences under <Text strong>Primers</Text> in the sidebar (under Reference). Each primer records the sequence (5′→3′), direction, target gene/region, target taxa, annealing temperature, and product size. Sequences can be copied to clipboard directly from the table. Use <Text strong>Bulk Add</Text> to paste a TSV/CSV table of primers at once.
              </Paragraph>
            </Card>
          ),
        },
        {
          key: 'tessera',
          searchText: 'Tessera integration link specimens usage log entry run type reference remove sample clear link settings admin token URL configure',
          node: (
            <Card style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                <LinkOutlined style={{ marginRight: 8 }} />
                Tessera integration
              </Title>
              <Paragraph style={{ marginBottom: 0 }}>
                Elementa links back to Tessera automatically when you add specimens to a run — a usage log entry is created in Tessera recording the run type and reference. When you remove a sample from a run, the link in Tessera is cleared. The Tessera URL and API token are configured by an admin in <Text strong>Settings → Tessera</Text>.
              </Paragraph>
            </Card>
          ),
        },
        {
          key: 'export',
          searchText: 'export CSV download run data extractions PCR sanger library prep NGS backup restore database admin how to download my data',
          node: (
            <Card style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                <DownloadOutlined style={{ marginRight: 8 }} />
                Export
              </Title>
              <Paragraph style={{ marginBottom: 0 }}>
                Go to <Text strong>Export</Text> in the sidebar (under Manage) to download run data as CSV — extractions, PCR, Sanger, library preps, or NGS libraries. Individual runs also have a per-run CSV export button on their detail page. Admins can download a full database backup or restore from a previous backup.
              </Paragraph>
            </Card>
          ),
        },
      ],
    },
    {
      header: (
        <>
          <Divider />
          <Title level={4}>Attachments</Title>
        </>
      ),
      sections: [
        {
          key: 'attachments',
          searchText: 'attachments files gel images QC reports sequencing output fasta fastq ab1 vcf bam gz images PDF spreadsheets upload 50 MB file size limit tab',
          node: (
            <Paragraph>
              Any run can have files attached — gel images, QC reports, sequencing output files, etc. Open a run and use the <Text strong>Attachments</Text> tab. Accepted formats include images, PDFs, spreadsheets, and common bioinformatics formats (<Text code>.fasta</Text>, <Text code>.fastq</Text>, <Text code>.ab1</Text>, <Text code>.vcf</Text>, <Text code>.bam</Text>, <Text code>.gz</Text>, and more). Maximum file size is 50 MB.
            </Paragraph>
          ),
        },
      ],
    },
    {
      header: (
        <>
          <Divider />
          <Title level={4}>Permissions</Title>
        </>
      ),
      sections: [
        {
          key: 'permissions',
          searchText: 'permissions user admin role view runs samples create edit delete upload attachments manage users projects members protect toggle Tessera export what can I do',
          node: (
            <Table
              dataSource={permissionsData}
              columns={permColumns}
              rowKey="action"
              size="small"
              pagination={false}
              style={{ marginBottom: 24 }}
            />
          ),
        },
      ],
    },
    {
      header: (
        <>
          <Divider />
          <Title level={4}>Tips</Title>
        </>
      ),
      sections: [
        {
          key: 'tips',
          searchText: 'tips project must exist admin dropdown click run list detail page project operator filter bulk paste specimen codes one per line QC colour tag pass weak fail protocols version snapshotted export backup update shortcuts',
          node: (
            <ul>
              <li>A project must exist before you can create any run — ask an admin to set one up if none appear in the dropdown.</li>
              <li>Click any run in a list to open its detail page.</li>
              <li>Use the project and operator filters on any workflow list page to narrow down results.</li>
              <li>Use the bulk paste box on extraction runs to add many specimen codes at once — one per line.</li>
              <li>Samples within a run show their QC status as a colour-coded tag: <Tag color="green">Pass</Tag> <Tag color="orange">Weak</Tag> <Tag color="red">Fail</Tag>.</li>
              <li>The operator field autofills to the logged-in user when creating a new run — change it if entering data on behalf of someone else.</li>
              <li>Protocols attached to runs are version-snapshotted — editing a protocol later won't change what was recorded on past runs.</li>
              <li>Lock runs once data entry is complete to protect them from accidental edits.</li>
              <li>Tag runs to additional projects when specimens from multiple collections are processed together.</li>
              <li>Export a CSV backup before any server update.</li>
            </ul>
          ),
        },
      ],
    },
  ]

  const hasResults = groups.some(g => g.sections.some(s => matches(s.searchText, query)))

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <Title level={3}>Quick Start Guide</Title>
      <Paragraph type="secondary">
        Everything you need to start recording molecular laboratory workflows in Elementa.
      </Paragraph>

      <Input.Search
        placeholder="Search help topics…"
        allowClear
        onChange={e => setQuery(e.target.value)}
        style={{ marginBottom: 24 }}
      />

      {!hasResults && (
        <Paragraph type="secondary" style={{ textAlign: 'center', paddingTop: 16 }}>
          No results for "<Text>{query}</Text>"
        </Paragraph>
      )}

      {groups.map((group, gi) => {
        const visible = group.sections.filter(s => matches(s.searchText, query))
        if (visible.length === 0) return null
        return (
          <div key={gi}>
            {group.header}
            {visible.map(s => (
              <div key={s.key}>{s.node}</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
