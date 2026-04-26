'use client'

import { useState } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export interface CaseStudyData {
  id?: string
  title: string
  industry: string
  problemStatement: string
  outcome: string
  metrics: string
  testimonial: string | null
}

interface CaseStudyCardProps {
  data: CaseStudyData
  index: number
  onChange: (index: number, data: CaseStudyData) => void
  onDelete: (index: number) => void
}

export function CaseStudyCard({ data, index, onChange, onDelete }: CaseStudyCardProps) {
  const [open, setOpen] = useState(!data.title)

  function update(field: keyof CaseStudyData, value: string) {
    onChange(index, { ...data, [field]: value })
  }

  return (
    <Card>
      <CardBody className="space-y-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex-1 flex items-center gap-2 text-left"
          >
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-medium text-gray-800">
              {data.title || `Case Study ${index + 1}`}
            </span>
            {data.industry && (
              <span className="text-xs text-gray-400">— {data.industry}</span>
            )}
          </button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
            Delete
          </Button>
        </div>

        {open && (
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Title" value={data.title} onChange={(e) => update('title', e.target.value)} placeholder="Ops efficiency project" />
              <Input label="Industry" value={data.industry} onChange={(e) => update('industry', e.target.value)} placeholder="SaaS" />
            </div>
            <Textarea label="Problem Statement" rows={2} value={data.problemStatement} onChange={(e) => update('problemStatement', e.target.value)} placeholder="Client struggled with..." />
            <Textarea label="Outcome" rows={2} value={data.outcome} onChange={(e) => update('outcome', e.target.value)} placeholder="We delivered..." />
            <Input label="Metrics" value={data.metrics} onChange={(e) => update('metrics', e.target.value)} placeholder="30% cost reduction in 8 weeks" />
            <Input label="Testimonial (optional)" value={data.testimonial ?? ''} onChange={(e) => update('testimonial', e.target.value)} placeholder="&ldquo;They transformed our ops...&rdquo;" />
          </div>
        )}
      </CardBody>
    </Card>
  )
}
