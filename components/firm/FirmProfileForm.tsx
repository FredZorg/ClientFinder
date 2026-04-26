'use client'

import { useState } from 'react'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { CaseStudyCard, CaseStudyData } from './CaseStudyCard'
import { useToast } from '@/components/ui/Toast'

interface FirmProfileData {
  id?: string
  name: string
  description: string
  serviceAreas: string[]
  icpIndustries: string[]
  icpCompanySizeMin: number
  icpCompanySizeMax: number
  icpGeographies: string[]
  caseStudies: CaseStudyData[]
}

interface Props {
  initial?: FirmProfileData | null
}

function emptyCase(): CaseStudyData {
  return { title: '', industry: '', problemStatement: '', outcome: '', metrics: '', testimonial: '' }
}

export function FirmProfileForm({ initial }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<FirmProfileData>({
    id: initial?.id,
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    serviceAreas: initial?.serviceAreas ?? [],
    icpIndustries: initial?.icpIndustries ?? [],
    icpCompanySizeMin: initial?.icpCompanySizeMin ?? 10,
    icpCompanySizeMax: initial?.icpCompanySizeMax ?? 500,
    icpGeographies: initial?.icpGeographies ?? [],
    caseStudies: initial?.caseStudies ?? [],
  })

  function updateField<K extends keyof FirmProfileData>(k: K, v: FirmProfileData[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function updateCase(i: number, data: CaseStudyData) {
    const updated = [...form.caseStudies]
    updated[i] = data
    updateField('caseStudies', updated)
  }

  function deleteCase(i: number) {
    updateField('caseStudies', form.caseStudies.filter((_, idx) => idx !== i))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast('Firm name is required', 'error')

    setSaving(true)
    try {
      const res = await fetch('/api/firm-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm((f) => ({ ...f, id: data.profile.id }))
      toast('Firm profile saved!')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Firm Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Firm Name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Apex Consulting Group"
            required
          />
        </div>
        <Textarea
          label="Description"
          rows={3}
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="We're a student-run consulting firm specializing in..."
        />
        <TagInput
          label="Service Areas"
          value={form.serviceAreas}
          onChange={(v) => updateField('serviceAreas', v)}
          placeholder="Operations, Marketing, Finance..."
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Ideal Customer Profile (ICP)</h2>
        <TagInput
          label="Target Industries"
          value={form.icpIndustries}
          onChange={(v) => updateField('icpIndustries', v)}
          placeholder="SaaS, Healthcare, E-commerce..."
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Employees"
            type="number"
            value={form.icpCompanySizeMin}
            onChange={(e) => updateField('icpCompanySizeMin', Number(e.target.value))}
          />
          <Input
            label="Max Employees"
            type="number"
            value={form.icpCompanySizeMax}
            onChange={(e) => updateField('icpCompanySizeMax', Number(e.target.value))}
          />
        </div>
        <TagInput
          label="Geographies"
          value={form.icpGeographies}
          onChange={(v) => updateField('icpGeographies', v)}
          placeholder="Denver CO, Austin TX, Remote..."
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Case Studies</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => updateField('caseStudies', [...form.caseStudies, emptyCase()])}
          >
            + Add Case Study
          </Button>
        </div>

        {form.caseStudies.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-lg">
            No case studies yet — add one to power personalized outreach
          </p>
        ) : (
          <div className="space-y-3">
            {form.caseStudies.map((cs, i) => (
              <CaseStudyCard key={i} data={cs} index={i} onChange={updateCase} onDelete={deleteCase} />
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end pt-2 border-t border-gray-200">
        <Button type="submit" loading={saving}>
          Save Profile
        </Button>
      </div>
    </form>
  )
}
