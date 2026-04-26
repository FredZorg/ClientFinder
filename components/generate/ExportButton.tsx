'use client'

import { Button } from '@/components/ui/Button'

interface Draft {
  id: string
  type: 'EMAIL' | 'LINKEDIN'
  subject?: string | null
  body: string
  status: 'PENDING' | 'APPROVED' | 'EDITED'
  contact: { firstName: string; lastName: string; email?: string | null }
  company: { name: string }
}

interface ExportButtonProps {
  drafts: Draft[]
}

export function ExportButton({ drafts }: ExportButtonProps) {
  const approved = drafts.filter((d) => d.status === 'APPROVED')

  function exportCSV() {
    const headers = ['Company', 'Contact Name', 'Contact Email', 'Type', 'Subject', 'Body']
    const rows = approved.map((d) => [
      d.company.name,
      `${d.contact.firstName} ${d.contact.lastName}`,
      d.contact.email ?? '',
      d.type,
      d.subject ?? '',
      d.body.replace(/\n/g, ' '),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pipelineiq-drafts.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={exportCSV}
      disabled={approved.length === 0}
    >
      Export {approved.length} Approved →
    </Button>
  )
}
