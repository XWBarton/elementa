import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, Typography, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import { useCreateExtractionRun, useExtractionRun, useUpdateExtractionRun } from '../hooks/useExtractionRuns'
import { useUsers } from '../hooks/useUsers'
import { ExtractionRunCreate } from '../types'

export default function ExtractionRunFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const { data: run } = useExtractionRun(isEdit ? Number(id) : 0)
  const { data: usersData } = useUsers({ limit: 200 })
  const createRun = useCreateExtractionRun()
  const updateRun = useUpdateExtractionRun()

  useEffect(() => {
    if (run && isEdit) {
      form.setFieldsValue({
        ...run,
        run_date: run.run_date ? dayjs(run.run_date) : null,
      })
    }
  }, [run, isEdit, form])

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
      message.success('Run created')
      navigate(`/extraction-runs/${result.id}`)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {isEdit ? 'Edit Extraction Run' : 'New Extraction Run'}
        </Typography.Title>
      </Space>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Run Date" name="run_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Operator" name="operator_id">
            <Select allowClear placeholder="Select operator" options={
              usersData?.items.map(u => ({ label: u.full_name || u.username, value: u.id })) ?? []
            } />
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
