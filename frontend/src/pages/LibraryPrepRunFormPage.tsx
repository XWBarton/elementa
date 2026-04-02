import { Button, Card, DatePicker, Form, Input, Select, Space, Typography, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import { useCreateLibraryPrepRun, useLibraryPrepRun, useUpdateLibraryPrepRun } from '../hooks/useLibraryPrepRuns'
import { useUsers } from '../hooks/useUsers'
import { useProjects } from '../hooks/useProjects'
import { useAllProtocols } from '../hooks/useProtocols'
import { usePrimerPairs } from '../hooks/usePrimers'
import { useAuth } from '../context/AuthContext'
import { LibraryPrepRunCreate } from '../types'

export default function LibraryPrepRunFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const { user } = useAuth()
  const { data: run } = useLibraryPrepRun(isEdit ? Number(id) : 0)
  const { data: usersData } = useUsers({ limit: 200 })
  const { data: projects } = useProjects()
  const { data: protocols } = useAllProtocols()
  const { data: primerPairs } = usePrimerPairs()
  const createRun = useCreateLibraryPrepRun()
  const updateRun = useUpdateLibraryPrepRun()

  const pairOptions = (primerPairs ?? []).map(p => ({
    label: p.name
      ? `${p.name}${p.amplicon_size_bp ? ` (~${p.amplicon_size_bp} bp)` : ''}`
      : [p.forward_primer?.name, p.reverse_primer?.name].filter(Boolean).join(' / ') + (p.amplicon_size_bp ? ` (~${p.amplicon_size_bp} bp)` : ''),
    value: p.id,
  }))

  useEffect(() => {
    if (!isEdit && user) {
      form.setFieldValue('operator_id', user.id)
    }
  }, [user, isEdit, form])

  useEffect(() => {
    if (run && isEdit) {
      form.setFieldsValue({
        ...run,
        run_date: run.run_date ? dayjs(run.run_date) : null,
        primer_pair_ids: (run.primer_pairs ?? []).map(p => p.id),
      })
    }
  }, [run, isEdit, form])

  const onFinish = async (values: LibraryPrepRunCreate & { run_date: dayjs.Dayjs }) => {
    const payload: LibraryPrepRunCreate = { ...values, run_date: values.run_date ? values.run_date.format('YYYY-MM-DD') : undefined }
    if (isEdit) {
      const result = await updateRun.mutateAsync({ id: Number(id), payload })
      message.success('Run updated')
      navigate(`/library-prep-runs/${result.id}`)
    } else {
      const result = await createRun.mutateAsync(payload)
      message.success('Run created')
      navigate(`/library-prep-runs/${result.id}`)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{isEdit ? 'Edit Library Prep Run' : 'New Library Prep Run'}</Typography.Title>
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
          <Form.Item label="Kit" name="kit"><Input placeholder="e.g. NEBNext Ultra II" /></Form.Item>
          <Form.Item label="Target Region" name="target_region"><Input placeholder="e.g. ITS2, 16S" /></Form.Item>
          {/* Primer pair multi-select for multiplexing */}
          <Form.Item label="Primer Pairs" name="primer_pair_ids">
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Select one or more primer pairs…"
              options={pairOptions}
            />
          </Form.Item>
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
