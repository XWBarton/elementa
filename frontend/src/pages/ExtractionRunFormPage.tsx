import { Alert, Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, Typography, message } from 'antd'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import { useCreateExtractionRun, useExtractionRun, useUpdateExtractionRun } from '../hooks/useExtractionRuns'
import { useUsers } from '../hooks/useUsers'
import { useProjects } from '../hooks/useProjects'
import { useAllProtocols } from '../hooks/useProtocols'
import { useAuth } from '../context/AuthContext'
import { addExtractionSample } from '../api/extraction_runs'
import { ExtractionRunCreate } from '../types'

export default function ExtractionRunFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const specimenCode = searchParams.get('specimen')
  const [form] = Form.useForm()

  const { user } = useAuth()
  const { data: run } = useExtractionRun(isEdit ? Number(id) : 0)
  const { data: usersData } = useUsers({ limit: 200 })
  const { data: projects } = useProjects()
  const { data: protocols } = useAllProtocols()
  const createRun = useCreateExtractionRun()
  const updateRun = useUpdateExtractionRun()

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
      })
    }
  }, [run, isEdit, form])

  const returnTo = searchParams.get('return_to')
  const usageId = searchParams.get('usage_id')

  const onFinish = async (values: ExtractionRunCreate & { run_date: dayjs.Dayjs }) => {
    const payload: ExtractionRunCreate = {
      ...values,
      run_date: values.run_date ? values.run_date.format('YYYY-MM-DD') : undefined,
    }
    if (isEdit) {
      const result = await updateRun.mutateAsync({ id: Number(id), payload })
      message.success('Run updated')
      navigate(`/extraction-runs/${result.id}`)
    } else {
      const result = await createRun.mutateAsync(payload)
      if (specimenCode) {
        await addExtractionSample(result.id, { specimen_code: specimenCode })
      }
      message.success('Run created')
      // If launched from Tessera, post the new run ID back to the opener tab then close
      if (returnTo && usageId) {
        try {
          const targetOrigin = new URL(returnTo).origin
          if (window.opener) {
            window.opener.postMessage(
              { type: 'ELEMENTA_RUN_CREATED', run_id: result.id, usage_id: usageId },
              targetOrigin,
            )
            window.close()
            return
          }
        } catch (_) { /* fall through */ }
        // Fallback: navigate in-place if opener is unavailable
        window.location.href = `${returnTo}?linked_run=${result.id}&usage_id=${usageId}`
        return
      }
      navigate(`/extraction-runs/${result.id}${specimenCode ? `?specimen=${encodeURIComponent(specimenCode)}` : ''}`)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {isEdit ? 'Edit Extraction Run' : 'New Extraction Run'}
        </Typography.Title>
      </Space>
      {specimenCode && (
        <Alert
          message={`Specimen ${specimenCode} will be added to this run automatically.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Run Date" name="run_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Operator" name="operator_id" rules={[{ required: true, message: 'Operator is required' }]}>
            <Select placeholder="Select operator" options={
              usersData?.items.map(u => ({ label: u.full_name || u.username, value: u.id })) ?? []
            } />
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
          <Form.Item label="Kit" name="kit">
            <Input placeholder="e.g. DNeasy Plant Mini Kit" />
          </Form.Item>
          <Form.Item label="Extraction Type" name="extraction_type">
            <Select allowClear options={[
              { label: 'DNA', value: 'DNA' },
              { label: 'RNA', value: 'RNA' },
              { label: 'Total Nucleic Acid', value: 'Total Nucleic Acid' },
            ]} />
          </Form.Item>
          <Form.Item label="Container Type" name="container_type">
            <Select allowClear placeholder="Tubes or plate format" options={[
              { label: 'Tubes', value: 'tubes' },
              { label: '96-well plate', value: '96-well plate' },
              { label: '384-well plate', value: '384-well plate' },
            ]} />
          </Form.Item>
          <Form.Item label="Elution Volume (µl)" name="elution_volume_ul">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Protocol Notes" name="protocol_notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
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
