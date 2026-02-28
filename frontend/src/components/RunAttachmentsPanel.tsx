import { useState } from 'react'
import { Button, Upload, Input, Modal, Space, Typography, Image, message, Popconfirm, Spin } from 'antd'
import { PaperClipOutlined, UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

interface Attachment {
  id: number
  run_type: string
  run_id: number
  filename: string
  original_filename: string
  mime_type: string | null
  caption: string | null
  uploaded_by_id: number | null
  uploaded_at: string
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff']

function isImage(a: Attachment) {
  return a.mime_type && IMAGE_TYPES.includes(a.mime_type)
}

function AttachmentThumbnail({
  runType, runId, attachment, onDelete, token,
}: {
  runType: string; runId: number; attachment: Attachment; onDelete: () => void; token: string
}) {
  const url = `/api/attachments/${runType}/${runId}/${attachment.id}/file`
  const fullUrl = `${url}?token=${token}`

  return (
    <div style={{ display: 'inline-block', marginRight: 12, marginBottom: 12, verticalAlign: 'top', maxWidth: 140 }}>
      {isImage(attachment) ? (
        <Image
          src={fullUrl}
          width={120}
          height={100}
          style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #e8e8e8' }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      ) : (
        <div style={{
          width: 120, height: 100, borderRadius: 4, border: '1px solid #e8e8e8',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#fafafa', cursor: 'pointer',
        }} onClick={() => window.open(fullUrl, '_blank')}>
          <PaperClipOutlined style={{ fontSize: 28, color: '#888', marginBottom: 4 }} />
          <span style={{ fontSize: 11, color: '#888', textAlign: 'center', padding: '0 6px', wordBreak: 'break-all' }}>
            {attachment.original_filename}
          </span>
        </div>
      )}
      <div style={{ fontSize: 11, color: '#888', marginTop: 4, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {attachment.caption || attachment.original_filename}
      </div>
      <Space size={4} style={{ marginTop: 4 }}>
        <Button size="small" icon={<DownloadOutlined />} onClick={() => window.open(fullUrl, '_blank')} />
        <Popconfirm title="Delete this attachment?" onConfirm={onDelete} okText="Delete" okType="danger">
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    </div>
  )
}

export default function RunAttachmentsPanel({ runType, runId }: { runType: string; runId: number }) {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const token = localStorage.getItem('token') ?? ''

  const { data: attachments = [], isLoading } = useQuery<Attachment[]>({
    queryKey: ['attachments', runType, runId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/attachments/${runType}/${runId}`)
      return data
    },
  })

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) return
      const fd = new FormData()
      fd.append('file', file)
      fd.append('caption', caption)
      await apiClient.post(`/attachments/${runType}/${runId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', runType, runId] })
      message.success('Attachment uploaded')
      setModalOpen(false)
      setFile(null)
      setCaption('')
    },
    onError: () => message.error('Upload failed'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/attachments/${runType}/${runId}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', runType, runId] }),
  })

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          <PaperClipOutlined style={{ marginRight: 8 }} />Attachments
        </Typography.Title>
        <Button icon={<UploadOutlined />} onClick={() => setModalOpen(true)}>Add</Button>
      </div>

      {isLoading ? <Spin /> : attachments.length === 0 ? (
        <div style={{ color: '#bbb', fontSize: 13 }}>No attachments yet — gel photos, plate scans, etc.</div>
      ) : (
        <div>
          {attachments.map(a => (
            <AttachmentThumbnail
              key={a.id}
              runType={runType}
              runId={runId}
              attachment={a}
              token={token}
              onDelete={() => remove.mutate(a.id)}
            />
          ))}
        </div>
      )}

      <Modal
        title="Upload Attachment"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setFile(null); setCaption('') }}
        onOk={() => upload.mutate()}
        okText="Upload"
        confirmLoading={upload.isPending}
        okButtonProps={{ disabled: !file }}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload
            beforeUpload={f => { setFile(f); return false }}
            onRemove={() => setFile(null)}
            maxCount={1}
            fileList={file ? [{ uid: '-1', name: file.name, status: 'done' }] : []}
          >
            <Button icon={<UploadOutlined />}>Select file</Button>
          </Upload>
          <Input
            placeholder="Caption (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  )
}
