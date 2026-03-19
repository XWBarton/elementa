import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  message,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useCreateProtocol, useProtocol, useUpdateProtocol } from '../hooks/useProtocols'
import type { ProtocolCreate, ProtocolStep } from '../types'

const CATEGORY_OPTIONS = [
  { label: 'Extraction', value: 'extraction' },
  { label: 'PCR', value: 'pcr' },
  { label: 'Sanger', value: 'sanger' },
  { label: 'Library Prep', value: 'library_prep' },
  { label: 'NGS', value: 'ngs' },
  { label: 'General', value: 'general' },
]

const STEP_TYPE_OPTIONS = [
  { label: 'Standard', value: 'standard' },
  { label: 'Thermocycling', value: 'thermocycling' },
]

function ThermocyclingFields({ fieldName }: { fieldName: number }) {
  return (
    <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
      <Typography.Text strong style={{ fontSize: 12, color: '#d46b08', display: 'block', marginBottom: 8 }}>
        Thermocycling Parameters
      </Typography.Text>
      <Space wrap>
        <Form.Item label="Cycles" name={[fieldName, 'cycles']} style={{ marginBottom: 8 }}>
          <InputNumber min={1} style={{ width: 90 }} />
        </Form.Item>
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Initial Denaturation</Typography.Text>
      <Space wrap>
        <Form.Item label="Temp (°C)" name={[fieldName, 'initial_denat_temp_c']} style={{ marginBottom: 8 }}>
          <InputNumber style={{ width: 110 }} />
        </Form.Item>
        <Form.Item label="Time (s)" name={[fieldName, 'initial_denat_time_s']} style={{ marginBottom: 8 }}>
          <InputNumber min={0} style={{ width: 110 }} />
        </Form.Item>
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Denaturation (per cycle)</Typography.Text>
      <Space wrap>
        <Form.Item label="Temp (°C)" name={[fieldName, 'denat_temp_c']} style={{ marginBottom: 8 }}>
          <InputNumber style={{ width: 110 }} />
        </Form.Item>
        <Form.Item label="Time (s)" name={[fieldName, 'denat_time_s']} style={{ marginBottom: 8 }}>
          <InputNumber min={0} style={{ width: 110 }} />
        </Form.Item>
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Annealing (per cycle)</Typography.Text>
      <Space wrap>
        <Form.Item label="Temp (°C)" name={[fieldName, 'anneal_temp_c']} style={{ marginBottom: 8 }}>
          <InputNumber style={{ width: 110 }} />
        </Form.Item>
        <Form.Item label="Time (s)" name={[fieldName, 'anneal_time_s']} style={{ marginBottom: 8 }}>
          <InputNumber min={0} style={{ width: 110 }} />
        </Form.Item>
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Extension (per cycle)</Typography.Text>
      <Space wrap>
        <Form.Item label="Temp (°C)" name={[fieldName, 'extend_temp_c']} style={{ marginBottom: 8 }}>
          <InputNumber style={{ width: 110 }} />
        </Form.Item>
        <Form.Item label="Time (s)" name={[fieldName, 'extend_time_s']} style={{ marginBottom: 8 }}>
          <InputNumber min={0} style={{ width: 110 }} />
        </Form.Item>
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Final Extension</Typography.Text>
      <Space wrap>
        <Form.Item label="Temp (°C)" name={[fieldName, 'final_extend_temp_c']} style={{ marginBottom: 8 }}>
          <InputNumber style={{ width: 110 }} />
        </Form.Item>
        <Form.Item label="Time (s)" name={[fieldName, 'final_extend_time_s']} style={{ marginBottom: 8 }}>
          <InputNumber min={0} style={{ width: 110 }} />
        </Form.Item>
      </Space>
    </div>
  )
}

export default function ProtocolFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()

  const { data: protocol } = useProtocol(isEdit ? Number(id) : 0)
  const createProtocol = useCreateProtocol()
  const updateProtocol = useUpdateProtocol(Number(id))

  const importedProtocol = (location.state as { importedProtocol?: ProtocolCreate } | null)?.importedProtocol

  useEffect(() => {
    if (protocol && isEdit) {
      form.setFieldsValue({
        ...protocol,
        materials: protocol.materials?.join('\n') ?? '',
      })
    } else if (importedProtocol && !isEdit) {
      form.setFieldsValue({
        ...importedProtocol,
        materials: importedProtocol.materials?.join('\n') ?? '',
      })
    }
  }, [protocol, isEdit, importedProtocol, form])

  const onFinish = async (values: Record<string, unknown>) => {
    const steps: ProtocolStep[] = ((values.steps as ProtocolStep[] | undefined) ?? []).map(
      (s, idx) => ({ ...s, order: idx + 1 }),
    )
    const materials = typeof values.materials === 'string'
      ? (values.materials as string).split('\n').map((m) => m.trim()).filter(Boolean)
      : []

    const payload: ProtocolCreate = {
      name: values.name as string,
      category: values.category as ProtocolCreate['category'],
      version: values.version as string | undefined,
      description: values.description as string | undefined,
      notes: values.notes as string | undefined,
      steps,
      materials,
    }

    if (isEdit) {
      await updateProtocol.mutateAsync(payload)
      message.success('Protocol updated')
      navigate(`/protocols/${id}`)
    } else {
      const result = await createProtocol.mutateAsync(payload)
      message.success('Protocol created')
      navigate(`/protocols/${result.id}`)
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {isEdit ? 'Edit Protocol' : 'New Protocol'}
        </Typography.Title>
      </Space>
      {importedProtocol && !isEdit && (
        <Alert
          type="info"
          showIcon
          message="Pre-filled from imported text — review all fields before saving."
          style={{ marginBottom: 16 }}
        />
      )}
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. DNeasy Plant Mini Kit Extraction v2" />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item label="Category" name="category" style={{ flex: 1, minWidth: 200 }}>
              <Select allowClear options={CATEGORY_OPTIONS} />
            </Form.Item>
            <Form.Item label="Version" name="version" style={{ flex: 1, minWidth: 150 }}>
              <Input placeholder="e.g. v1.2" />
            </Form.Item>
          </Space>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Brief summary of this protocol" />
          </Form.Item>

          {/* Steps editor */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Steps</Typography.Text>
          <Form.List name="steps">
            {(fields, { add, remove, move }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 12, background: '#f9f9ff' }}
                    title={<span style={{ color: '#666' }}>Step {index + 1}</span>}
                    extra={
                      <Space>
                        <Button
                          size="small"
                          icon={<ArrowUpOutlined />}
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                        />
                        <Button
                          size="small"
                          icon={<ArrowDownOutlined />}
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                        />
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Space>
                    }
                  >
                    <Form.Item
                      label="Step Type"
                      name={[field.name, 'step_type']}
                      style={{ marginBottom: 8 }}
                    >
                      <Select options={STEP_TYPE_OPTIONS} placeholder="Standard" allowClear style={{ width: 180 }} />
                    </Form.Item>
                    <Form.Item
                      label="Title"
                      name={[field.name, 'title']}
                      rules={[{ required: true, message: 'Title required' }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="e.g. Tissue disruption" />
                    </Form.Item>
                    <Form.Item
                      label="Description"
                      name={[field.name, 'description']}
                      style={{ marginBottom: 8 }}
                    >
                      <Input.TextArea rows={2} placeholder="Step details..." />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate>
                      {({ getFieldValue }) => {
                        const stepType = getFieldValue(['steps', index, 'step_type'])
                        if (stepType === 'thermocycling') {
                          return <ThermocyclingFields fieldName={field.name} />
                        }
                        return (
                          <Space wrap>
                            <Form.Item label="Duration (min)" name={[field.name, 'duration_min']} style={{ marginBottom: 8 }}>
                              <InputNumber min={0} style={{ width: 120 }} />
                            </Form.Item>
                            <Form.Item label="Temp (°C)" name={[field.name, 'temp_c']} style={{ marginBottom: 8 }}>
                              <InputNumber style={{ width: 120 }} />
                            </Form.Item>
                            <Form.Item label="RPM" name={[field.name, 'rpm']} style={{ marginBottom: 8 }}>
                              <InputNumber min={0} style={{ width: 120 }} />
                            </Form.Item>
                          </Space>
                        )
                      }}
                    </Form.Item>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ title: '', order: fields.length + 1 })}
                  icon={<PlusOutlined />}
                  style={{ width: '100%', marginBottom: 16 }}
                >
                  Add Step
                </Button>
              </>
            )}
          </Form.List>

          {/* Materials */}
          <Form.Item
            label="Materials (one per line)"
            name="materials"
            tooltip="Enter each material on a new line"
          >
            <Input.TextArea rows={4} placeholder="e.g.&#10;DNeasy Plant Mini Kit&#10;1.5 mL microtubes&#10;Liquid nitrogen" />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createProtocol.isPending || updateProtocol.isPending}
              >
                {isEdit ? 'Save Changes' : 'Create Protocol'}
              </Button>
              <Button onClick={() => navigate(-1)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
