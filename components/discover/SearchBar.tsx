'use client'

import { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'

interface SearchBarProps {
  onSearch: (query: string) => void
  loading: boolean
  value: string
  onChange: (v: string) => void
}

export function SearchBar({ onSearch, loading, value, onChange }: SearchBarProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Find SaaS companies in Denver with 10-50 employees in operations or finance…"
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <Button type="submit" loading={loading} disabled={!value.trim()}>
        Search
      </Button>
    </form>
  )
}
