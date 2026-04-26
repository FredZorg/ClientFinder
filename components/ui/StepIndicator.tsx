import { cn } from '@/lib/utils'

const STEPS = ['Discover', 'Select', 'Generate']

interface StepIndicatorProps {
  currentStep: 0 | 1 | 2
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep

        return (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                  done && 'bg-indigo-600 text-white',
                  active && 'bg-indigo-600 text-white ring-4 ring-indigo-100',
                  !done && !active && 'bg-gray-200 text-gray-500'
                )}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-indigo-600' : done ? 'text-gray-700' : 'text-gray-400'
                )}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-3',
                  i < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
