import { AutoComplete, Button, Card, DatePicker, Form, Input, Select, Space, Typography, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import { useCreateSangerRun, useSangerRun, useUpdateSangerRun } from '../hooks/useSangerRuns'
import { useUsers } from '../hooks/useUsers'
import { useProjects } from '../hooks/useProjects'
import { useAllProtocols } from '../hooks/useProtocols'
import { usePrimers } from '../hooks/usePrimers'
import { SangerRunCreate } from '../types'

export default function SangerRunFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const { data: run } = useSangerRun(isEdit ? Number(id) : 0)
  const { data: usersData } = useUsers({ limit: 200 })
  const { data: projects } = useProjects()
  const { data: protocols } = useAllProtocols()
  const { data: primers } = usePrimers()

  const primerOptions = (primers ?? []).map(p => ({
    label: `${p.name}${p.direction ? ` (${p.direction})` : ''}${p.target_gene ? ` — ${p.target_gene}` : ''}`,
    value: p.name,
  }))
  const createRun = useCreateSangerRun()
  const updateRun = useUpdateSangerRun()

  useEffect(() => {
    if (run && isEdit) {
      form.setFieldsValue({ ...run, run_date: run.run_date ? dayjs(run.run_date) : null })
    }
  }, [run, isEdit, form])

  const onFinish = async (values: SangerRunCreate & { run_date: dayjs.Dayjs }) => {
    const payload: SangerRunCreate = { ...values, run_date: values.run_date ? values.run_date.format('YYYY-MM-DD') : undefined }
    if (isEdit) {
      const result = await updateRun.mutateAsync({ id: Number(id), payload })
      message.success('Run updated')
      navigate(`/sanger-runs/${result.id}`)
    } else {
      const result = await createRun.mutateAsync(payload)
      message.success('Run created')
      navigate(`/sanger-runs/${result.id}`)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{isEdit ? 'Edit Sanger Run' : 'New Sanger Run'}</Typography.Title>
      </Space>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Run Date" name="run_date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Operator" name="operator_id" rules={[{ required: true, message: 'Operator is required' }]}>
            <Select placeholder="Select operator"
              options={usersData?.items.map(u => ({ label: u.full_name || u.username, value: u.id })) ?? []} />
          </Form.Item>
          <Form.Item label="Project" name="project_id" rules={[{ required: true, message: 'Project is required' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Select project"
              options={projects?.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id })) ?? []} />
          </Form.Item>
          <Form.Item label="Protocol (SOP)" name="protocol_id">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Select protocol (optional)"
              options={protocols?.map(p => ({
                label: `${p.name}${p.version ? ` ${p.version}` : ''}${p.category ? ` [${p.category}]` : ''}`,
                value: p.id,
              })) ?? []}
            />
          </Form.Item>
          <Form.Item label="Primer" name="primer">
            <AutoComplete
              allowClear
              placeholder="Search primer library or type name…"
              options={primerOptions}
              filterOption={(input, option) => option?.label.toLowerCase().includes(input.toLowerCase()) ?? false}
            />
          </Form.Item>
          <Form.Item label="Direction" name="direction">
            <Select allowClear options={[
              { label: 'Forward', value: 'forward' },
              { label: 'Reverse', value: 'reverse' },
              { label: 'Both', value: 'both' },
            ]} />
          </Form.Item>
          <Form.Item label="Service Provider" name="service_provider"><Input placeholder="e.g. Genewiz, Eurofins" /></Form.Item>
          <Form.Item label="Order ID" name="order_id"><Input placeholder="Provider order reference" /></Form.Item>
          <Form.Item label="Notes" name="notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createRun.isPending || updateRun.isPending}>
                {isEdit ? 'Save Changes' : 'Create Run'}
              </Button>
              <Button onClick={() => navigate(-1)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
