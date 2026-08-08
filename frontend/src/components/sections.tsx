import { ReactNode } from 'react'

export function SectionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16 sm:pt-20 container mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-4xl py-10">
        {children}
      </main>
    </div>
  )
}
