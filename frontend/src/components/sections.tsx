import { ReactNode } from 'react'

export function SectionLayout({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <main className={`${compact ? 'pt-8 pb-16' : 'pt-16 sm:pt-20 py-10'} container mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-4xl`}>
        {children}
      </main>
    </div>
  )
}
