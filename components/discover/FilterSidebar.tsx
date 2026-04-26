'use client'

import { Input } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'

export interface Filters {
  industries: string[]
  location: string
  employeeMin: string
  employeeMax: string
  keywords: string
}

interface FilterSidebarProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  function update<K extends keyof Filters>(k: K, v: Filters[K]) {
    onChange({ ...filters, [k]: v })
  }

  return (
    <aside className="w-60 flex-shrink-0 space-y-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filters</h3>

      <TagInput
        label="Industries"
        value={filters.industries}
        onChange={(v) => update('industries', v)}
        placeholder="SaaS, Retail…"
      />

      <Input
        label="Location"
        value={filters.location}
        onChange={(e) => update('location', e.target.value)}
        placeholder="Denver CO"
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Employees</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.employeeMin}
            onChange={(e) => update('employeeMin', e.target.value)}
            placeholder="Min"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number"
            value={filters.employeeMax}
            onChange={(e) => update('employeeMax', e.target.value)}
            placeholder="Max"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <Input
        label="Keywords"
        value={filters.keywords}
        onChange={(e) => update('keywords', e.target.value)}
        placeholder="operations, logistics…"
      />
    </aside>
  )
}
