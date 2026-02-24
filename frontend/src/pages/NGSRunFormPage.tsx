import { useEffect } from 'react'
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, message } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useNGSRun, useCreateNGSRun, useUpdateNGSRun } from '../hooks/useNGSRuns'
import { useAllLibraryPreps } from '../hooks/useLibraryPrepRuns'
import { useUsers } from '../hooks/useUsers'
import { LibraryPrep, NGSPlatform } from '../types'

const PLATFORMS: NGSPlatform[] = ['Illumina', 'ONT', 'PacBio', 'Other']

export default function NGSRunFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const { data: existing } = useNGSRun(isEdit ? Number(id) : 0)
  const { data: users } = useUsers()
  const { data: libraryPreps } = useAllLibraryPreps()
  const createMutation = useCreateNGSRun()
  const updateMutation = useUpdateNGSRun()

  useEffect(() => {
    if (existing) {
      form.setFieldsValue({
        ...existing,
        libraries: existing.libraries.map((l) => ({ library_prep_id: l.library_prep_id, specimen_code: l.specimen_code, sample_name: l.sample_name })),
      })
    }
  }, [existing, form])

  async function onFinish(values: Record<string, unknown>) {
    const payload = { ...values, libraries: (values.libraries as any[]) ?? [] }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload: payload as any })
        message.success('NGS run updated')
      } else {
        await createMutation.mutateAsync(payload as any)
        message.success('NGS run created')
      }
      navigate('/ngs-runs')
    } catch {
      message.error('Failed to save NGS run')
    }
  }

  const userOptions = users?.items.map((u) => ({ label: u.username, value: u.id })) ?? []
  const prepMap: Record<number, LibraryPrep> = {}
  libraryPreps?.forEach(p => { prepMap[p.id] = p })

  const prepOptions = libraryPreps?.map((p) => {
    const code = p.specimen_code ?? p.extraction?.specimen_code
    return {
      label: code
        ? `${code} — ${p.sample_name ?? `Prep #${p.id}`}`
        : `Prep #${p.id}${p.sample_name ? ` — ${p.sample_name}` : ''}`,
      value: p.id,
    }
  }) ?? []

  return (
    <div>
      <h2>{isEdit ? 'Edit NGS Run' : 'New NGS Run'}</h2>
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 1000 }}>
        <Card title="Run Details" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
                <Select options={PLATFORMS.map((p) => ({ label: p, value: p }))} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="instrument" label="Instrument">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="run_id" label="Run ID">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="date" label="Date">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="operator_id" label="Operator">
                <Select options={userOptions} allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="flow_cell_id" label="Flow Cell ID">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="reagent_kit" label="Reagent Kit">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="output_path" label="Output Path">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="total_reads" label="Total Reads">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="q30_percent" label="Q30 %">
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="mean_read_length_bp" label="Mean Read Length (bp)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Card>

        <Card title="Libraries" style={{ marginBottom: 16 }}>
          <Form.List name="libraries">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline" wrap>
                    <Form.Item {...restField} name={[name, 'library_prep_id']} style={{ marginBottom: 0 }}>
                      <Select
                        options={prepOptions}
                        style={{ width: 300 }}
                        placeholder="Library Prep (optional)"
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        onChange={(val: number | undefined) => {
                          if (val && prepMap[val]) {
                            const p = prepMap[val]
                            form.setFieldValue(
                              ['libraries', name, 'specimen_code'],
                              p.specimen_code ?? p.extraction?.specimen_code ?? undefined
                            )
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'specimen_code']} style={{ marginBottom: 0 }}>
                      <Input placeholder="Specimen code / control ID" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'sample_name']} style={{ marginBottom: 0 }}>
                      <Input placeholder="Sample name" style={{ width: 180 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  Add Library
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? 'Update' : 'Create'}
          </Button>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </Form>
    </div>
  )
}
