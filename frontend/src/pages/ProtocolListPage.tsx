import { useState, useMemo } from 'react'
import { Button, Space, Table, Tag, Typography, Modal, Input, Alert, Descriptions } from 'antd'
import { PlusOutlined, ImportOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useProtocols } from '../hooks/useProtocols'
import type { Protocol, ProtocolCreate, ProtocolStep, ProtocolCategory } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  extraction: 'green',
  pcr: 'blue',
  sanger: 'purple',
  library_prep: 'orange',
  ngs: 'cyan',
  general: 'default',
}

const CATEGORY_VALUES: ProtocolCategory[] = ['extraction', 'pcr', 'sanger', 'library_prep', 'ngs', 'general']

// ── Parser ────────────────────────────────────────────────────────────────────

function parseStepTitle(raw: string): { title: string; duration_min?: number; temp_c?: number; rpm?: number } {
  let title = raw
  let duration_min: number | undefined
  let temp_c: number | undefined
  let rpm: number | undefined

  title = title.replace(/\[(\d+(?:\.\d+)?)\s*min(?:utes?)?\]/gi, (_, n) => {
    duration_min = parseFloat(n); return ''
  })
  title = title.replace(/\[(\d+(?:\.\d+)?)\s*°?[Cc]\]/g, (_, n) => {
    temp_c = parseFloat(n); return ''
  })
  title = title.replace(/\[(\d[\d,]*)\s*rpm\]/gi, (_, n) => {
    rpm = parseInt(n.replace(/,/g, ''), 10); return ''
  })

  return { title: title.trim(), duration_min, temp_c, rpm }
}

function parseStepLines(lines: string[]): ProtocolStep[] {
  const steps: ProtocolStep[] = []
  const STEP_RE = /^\s*(\d+)[.)]\s+(.+)/

  let current: Partial<ProtocolStep> | null = null
  let descLines: string[] = []

  const flush = () => {
    if (current?.title) {
      steps.push({
        order: steps.length + 1,
        ...current,
        description: descLines.join('\n').trim() || undefined,
      } as ProtocolStep)
    }
  }

  for (const line of lines) {
    const m = line.match(STEP_RE)
    if (m) {
      flush()
      const { title, duration_min, temp_c, rpm } = parseStepTitle(m[2])
      current = { title, duration_min, temp_c, rpm }
      descLines = []
    } else if (current) {
      const stripped = line.replace(/^\s{2,}/, '').trim()
      if (stripped) descLines.push(stripped)
    }
  }
  flush()
  return steps
}

function parseProtocolText(text: string): Partial<ProtocolCreate> & { _errors: string[] } {
  const HEADER_RE = /^(protocol|name|category|version|description|materials?|steps?|procedure|notes?):\s*(.*)/i
  const sections: Record<string, string[]> = {}
  let section = '__preamble__'

  for (const raw of text.split('\n')) {
    const m = raw.match(HEADER_RE)
    if (m) {
      section = m[1].toLowerCase()
        .replace(/s$/, '')
        .replace('procedure', 'step')
        .replace('name', 'protocol')
      if (!sections[section]) sections[section] = []
      if (m[2].trim()) sections[section].push(m[2].trim())
    } else {
      if (!sections[section]) sections[section] = []
      sections[section].push(raw)
    }
  }

  const errors: string[] = []

  const name = (sections['protocol']?.[0] || sections['__preamble__']?.find(l => l.trim()) || '').trim()
  if (!name) errors.push('Could not find a protocol name — make sure your text includes "PROTOCOL: Name"')

  const catRaw = sections['category']?.join(' ').toLowerCase().trim() ?? ''
  const category = CATEGORY_VALUES.find(c => catRaw.replace('_', ' ').includes(c.replace('_', ' '))) as ProtocolCategory | undefined

  const version = sections['version']?.join(' ').trim() || undefined
  const description = sections['description']?.join('\n').trim() || undefined
  const notes = sections['note']?.join('\n').trim() || undefined

  const materials = (sections['material'] ?? [])
    .map(l => l.replace(/^[\s\-*•\d.]+/, '').trim())
    .filter(Boolean)

  const steps = parseStepLines(sections['step'] ?? [])

  return { name: name || '', category, version, description, materials, steps, notes, _errors: errors }
}

// ── Import Modal ──────────────────────────────────────────────────────────────

const PLACEHOLDER = `PROTOCOL: DNeasy Plant Mini Kit Extraction
CATEGORY: extraction
VERSION: v2.1
DESCRIPTION:
Extracts high-quality DNA from plant tissue.

MATERIALS:
- DNeasy Plant Mini Kit
- 1.5 mL microtubes
- Liquid nitrogen

STEPS:
1. Tissue disruption [5 min]
   Grind 20–100 mg of plant tissue to a fine powder in liquid nitrogen.

2. Lysis [10 min] [65°C]
   Add 400 µL Buffer AP1 and vortex vigorously.

3. Centrifuge [5 min] [11000 RPM]

NOTES:
Ensure tissue is fully disrupted before lysis.`

function ImportProtocolModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState('')
  const navigate = useNavigate()

  const parsed = useMemo(() => (text.trim() ? parseProtocolText(text) : null), [text])

  const handleImport = () => {
    if (!parsed || !parsed.name) return
    const { _errors: _, ...protocol } = parsed
    navigate('/protocols/new', { state: { importedProtocol: protocol } })
    setText('')
    onClose()
  }

  return (
    <Modal
      title="Import Protocol from Text"
      open={open}
      onCancel={() => { setText(''); onClose() }}
      width={760}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={() => { setText(''); onClose() }}>Cancel</Button>
          <Button
            type="primary"
            icon={<ImportOutlined />}
            disabled={!parsed?.name}
            onClick={handleImport}
          >
            Open in Form
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Paste a plain text protocol using the format below. It will be parsed and pre-filled into the protocol form for review before saving.
        </Typography.Text>

        <Typography.Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre', display: 'block', background: '#f5f5f5', padding: '8px 12px', borderRadius: 4 }}>
          {`PROTOCOL: Name\nCATEGORY: extraction | pcr | sanger | library_prep | ngs | general\nVERSION: v1.0\nDESCRIPTION:\n...\n\nMATERIALS:\n- item\n\nSTEPS:\n1. Step title [X min] [X°C] [X RPM]\n   Step description.\n\nNOTES:\n...`}
        </Typography.Text>

        <Input.TextArea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={12}
          placeholder={PLACEHOLDER}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />

        {parsed && (
          <>
            {parsed._errors.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message="Parsing issues"
                description={
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {parsed._errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                }
              />
            )}

            {parsed.name && (
              <div>
                <Typography.Text style={{ fontSize: 12 }} type="secondary">Preview:</Typography.Text>
                <Descriptions size="small" column={2} bordered style={{ marginTop: 6 }}>
                  <Descriptions.Item label="Name" span={2}><strong>{parsed.name}</strong></Descriptions.Item>
                  {parsed.category && (
                    <Descriptions.Item label="Category">
                      <Tag color={CATEGORY_COLORS[parsed.category]}>{parsed.category}</Tag>
                    </Descriptions.Item>
                  )}
                  {parsed.version && <Descriptions.Item label="Version">{parsed.version}</Descriptions.Item>}
                  {parsed.description && (
                    <Descriptions.Item label="Description" span={2}>{parsed.description}</Descriptions.Item>
                  )}
                  <Descriptions.Item label="Materials">
                    {parsed.materials?.length ? `${parsed.materials.length} item${parsed.materials.length !== 1 ? 's' : ''}` : <span style={{ color: '#bbb' }}>none</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Steps">
                    {parsed.steps?.length ? `${parsed.steps.length} step${parsed.steps.length !== 1 ? 's' : ''}` : <span style={{ color: '#bbb' }}>none</span>}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </>
        )}
      </Space>
    </Modal>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProtocolListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useProtocols(0, 200)
  const [importOpen, setImportOpen] = useState(false)

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, record: Protocol) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/protocols/${record.id}`)}>
          {v}
        </Button>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => v ? <Tag color={CATEGORY_COLORS[v] ?? 'default'}>{v}</Tag> : '—',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (v: string) => v ?? '—',
    },
    {
      title: '# Steps',
      key: 'steps',
      render: (_: unknown, record: Protocol) => (
        <Tag color="blue">{record.steps?.length ?? 0}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Protocol) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/protocols/${record.id}`)}>View</Button>
          <Button type="link" onClick={() => navigate(`/protocols/${record.id}/edit`)}>Edit</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Protocols</Typography.Title>
        <Space>
          <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
            Import from Text
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/protocols/new')}>
            New Protocol
          </Button>
        </Space>
      </Space>
      <Table
        dataSource={data?.items ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        onRow={(record) => ({ onClick: () => navigate(`/protocols/${record.id}`) })}
        style={{ cursor: 'pointer' }}
      />

      <ImportProtocolModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
