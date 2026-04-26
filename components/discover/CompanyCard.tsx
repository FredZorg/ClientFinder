'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface Company {
  id: string
  name: string
  industry?: string | null
  employeeCount?: number | null
  location?: string | null
  description?: string | null
  linkedinUrl?: string | null
  estimatedRevenue?: string | null
}

export interface Enrichment {
  id: string
  fitScore: number
  fitReason: string
  whatTheyDo: string
  officeNote: string
}

interface CompanyCardProps {
  company: Company
  onShortlist: (id: string) => void
  isShortlisted: boolean
  shortlisting: boolean
  enrichment?: Enrichment
  enriching?: boolean
}

function FitScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? 'bg-green-100 text-green-700 ring-green-200' :
    score >= 6 ? 'bg-indigo-100 text-indigo-700 ring-indigo-200' :
    score >= 4 ? 'bg-yellow-100 text-yellow-700 ring-yellow-200' :
                 'bg-red-100 text-red-700 ring-red-200'

  const label =
    score >= 8 ? 'Strong fit' :
    score >= 6 ? 'Good fit' :
    score >= 4 ? 'Weak fit' : 'Poor fit'

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ring-1', color)}>
      <span className="text-base leading-none" style={{ lineHeight: 1 }}>
        {score >= 8 ? '●' : score >= 6 ? '◕' : score >= 4 ? '◑' : '○'}
      </span>
      {score}/10 · {label}
    </span>
  )
}

export function CompanyCard({
  company,
  onShortlist,
  isShortlisted,
  shortlisting,
  enrichment,
  enriching,
}: CompanyCardProps) {
  return (
    <Card className={cn(enrichment && enrichment.fitScore >= 7 && 'border-indigo-200')}>
      <CardBody className="space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900">{company.name}</h3>
              {company.industry && <Badge variant="indigo">{company.industry}</Badge>}
              {enrichment && <FitScoreBadge score={enrichment.fitScore} />}
              {enriching && !enrichment && <Skeleton className="h-5 w-24 rounded-full" />}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
              {enrichment?.officeNote
                ? <span>📍 {enrichment.officeNote}</span>
                : company.location && <span>📍 {company.location}</span>}
              {company.employeeCount && <span>{company.employeeCount.toLocaleString()} employees</span>}
              {company.estimatedRevenue && <span>{company.estimatedRevenue}</span>}
            </div>
          </div>
          <Button
            size="sm"
            variant={isShortlisted ? 'secondary' : 'primary'}
            onClick={() => onShortlist(company.id)}
            loading={shortlisting}
            disabled={isShortlisted}
          >
            {isShortlisted ? 'Added ✓' : '+ Shortlist'}
          </Button>
        </div>

        {/* What they do */}
        {enriching && !enrichment ? (
          <Skeleton className="h-4 w-3/4" />
        ) : enrichment?.whatTheyDo ? (
          <p className="text-xs text-gray-600">{enrichment.whatTheyDo}</p>
        ) : company.description ? (
          <p className="text-xs text-gray-600 line-clamp-2">{company.description}</p>
        ) : null}

        {/* Why a fit */}
        {enriching && !enrichment ? (
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ) : enrichment?.fitReason ? (
          <div className="bg-indigo-50 rounded-lg px-3 py-2">
            <p className="text-xs text-indigo-800">
              <span className="font-semibold">Why a fit: </span>{enrichment.fitReason}
            </p>
          </div>
        ) : null}

        {/* LinkedIn */}
        {company.linkedinUrl && (
          <a
            href={company.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            LinkedIn
          </a>
        )}
      </CardBody>
    </Card>
  )
}
