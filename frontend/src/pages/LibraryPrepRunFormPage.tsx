import { Button, Card, DatePicker, Form, Input, Select, Space, Typography, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import { useCreateLibraryPrepRun, useLibraryPrepRun, useUpdateLibraryPrepRun } from '../hooks/useLibraryPrepRuns'
import { useUsers } from '../hooks/useUsers'
import { LibraryPrepRunCreate } from '../types'

export default function LibraryPrepRunFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const { data: run } = useLibraryPrepRun(isEdit ? Number(id) : 0)
  const { data: usersData } = useUsers({ limit: 200 })
  const createRun = useCreateLibraryPrepRun()
  const updateRun = useUpdateLibraryPrepRun()

  useEffect(() => {
    if (run && isEdit) {
      form.setFieldsValue({ ...run, run_date: run.run_date ? dayjs(run.run_date) : null })
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
          <Form.Item label="Operator" name="operator_id">
            <Select allowClear placeholder="Select operator"
              options={usersData?.items.map(u => ({ label: u.full_name || u.username, value: u.id })) ?? []} />
          </Form.Item>
          <Form.Item label="Kit" name="kit"><Input placeholder="e.g. NEBNext Ultra II" /></Form.Item>
          <Form.Item label="Target Region" name="target_region"><Input placeholder="e.g. ITS2, 16S" /></Form.Item>
          <Form.Item label="Forward Primer" name="primer_f"><Input /></Form.Item>
          <Form.Item label="Reverse Primer" name="primer_r"><Input /></Form.Item>
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
