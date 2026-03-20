import { AutoComplete, Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, Typography, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useCreatePCRRun, usePCRRun, useUpdatePCRRun } from '../hooks/usePCRRuns'
import { useUsers } from '../hooks/useUsers'
import { useProjects } from '../hooks/useProjects'
import { useAllProtocols } from '../hooks/useProtocols'
import { usePrimers, usePrimerPairs } from '../hooks/usePrimers'
import { PCRRunCreate } from '../types'

export default function PCRRunFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [selectedPairId, setSelectedPairId] = useState<number | null>(null)

  const { data: run } = usePCRRun(isEdit ? Number(id) : 0)
  const { data: usersData } = useUsers({ limit: 200 })
  const { data: projects } = useProjects()
  const { data: protocols } = useAllProtocols()
  const { data: primers } = usePrimers()
  const { data: primerPairs } = usePrimerPairs()

  const fPrimerOptions = (primers ?? []).filter(p => p.direction === 'F').map(p => ({ label: `${p.name} — ${p.target_gene ?? ''}`, value: p.name }))
  const rPrimerOptions = (primers ?? []).filter(p => p.direction === 'R').map(p => ({ label: `${p.name} — ${p.target_gene ?? ''}`, value: p.name }))

  const pairOptions = (primerPairs ?? []).map(p => ({
    label: p.name
      ? `${p.name}${p.amplicon_size_bp ? ` (~${p.amplicon_size_bp} bp)` : ''}`
      : [p.forward_primer?.name, p.reverse_primer?.name].filter(Boolean).join(' / ') + (p.amplicon_size_bp ? ` (~${p.amplicon_size_bp} bp)` : ''),
    value: p.id,
  }))

  const createRun = useCreatePCRRun()
  const updateRun = useUpdatePCRRun()

  useEffect(() => {
    if (run && isEdit) {
      form.setFieldsValue({ ...run, run_date: run.run_date ? dayjs(run.run_date) : null })
    }
  }, [run, isEdit, form])

  const handlePairSelect = (pairId: number | null) => {
    setSelectedPairId(pairId)
    if (pairId == null) return
    const pair = (primerPairs ?? []).find(p => p.id === pairId)
    if (!pair) return
    form.setFieldsValue({
      primer_f: pair.forward_primer?.name ?? form.getFieldValue('primer_f'),
      primer_r: pair.reverse_primer?.name ?? form.getFieldValue('primer_r'),
      ...(pair.amplicon_size_bp != null ? { amplicon_size_bp: pair.amplicon_size_bp } : {}),
      ...(pair.annealing_temp_c != null ? { annealing_temp_c: pair.annealing_temp_c } : {}),
      ...(pair.target_gene ? { target_region: pair.target_gene } : {}),
    })
  }

  const onFinish = async (values: PCRRunCreate & { run_date: dayjs.Dayjs }) => {
    const payload: PCRRunCreate = { ...values, run_date: values.run_date ? values.run_date.format('YYYY-MM-DD') : undefined }
    if (isEdit) {
      const result = await updateRun.mutateAsync({ id: Number(id), payload })
      message.success('Run updated')
      navigate(`/pcr-runs/${result.id}`)
    } else {
      const result = await createRun.mutateAsync(payload)
      message.success('Run created')
      navigate(`/pcr-runs/${result.id}`)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{isEdit ? 'Edit PCR Run' : 'New PCR Run'}</Typography.Title>
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
          <Form.Item label="Target Region" name="target_region"><Input placeholder="e.g. 16S rRNA" /></Form.Item>

          {/* Primer pair picker — auto-fills primer fields below */}
          <Form.Item label="Primer Pair (optional — auto-fills primers and amplicon size)">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Select a known primer pair…"
              options={pairOptions}
              value={selectedPairId}
              onChange={v => handlePairSelect(v ?? null)}
            />
          </Form.Item>

          <Form.Item label="Forward Primer" name="primer_f">
            <AutoComplete
              allowClear
              placeholder="Search primer library or type name…"
              options={fPrimerOptions}
              filterOption={(input, option) => option?.label.toLowerCase().includes(input.toLowerCase()) ?? false}
            />
          </Form.Item>
          <Form.Item label="Reverse Primer" name="primer_r">
            <AutoComplete
              allowClear
              placeholder="Search primer library or type name…"
              options={rPrimerOptions}
              filterOption={(input, option) => option?.label.toLowerCase().includes(input.toLowerCase()) ?? false}
            />
          </Form.Item>
          <Form.Item label="Polymerase" name="polymerase"><Input placeholder="e.g. Taq, Q5, Phusion" /></Form.Item>
          <Form.Item label="Amplicon Size (bp)" name="amplicon_size_bp">
            <InputNumber min={0} style={{ width: '100%' }} />
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
