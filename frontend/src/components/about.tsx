import { ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { DEV_FRIEZE_SHUFFLED } from '@/lib/devanagari'

const uses = [
  {
    who: 'Archivists and libraries',
    what: 'turning old printed books and gazettes into searchable text before the paper falls apart.',
  },
  {
    who: 'Students and researchers',
    what: 'quoting from Nepali sources without retyping them.',
  },
  {
    who: 'Offices and legal work',
    what: 'pulling text out of scanned letters, notices and forms.',
  },
]

export function About({ page = false }: { page?: boolean }) {
  return (
    <section id="about" className={`${page ? 'py-12' : 'py-24'} bg-secondary/40`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-foreground">
              Why we built it
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A lot of Nepali writing only exists on paper or as image scans. You can't search it,
              quote it or translate it until someone types it out. We wanted that to take seconds,
              not afternoons.
            </p>
          </div>

          <ul className="lg:col-span-3 space-y-6 self-center">
            {uses.map((use) => (
              <li key={use.who} className="text-lg leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-foreground">{use.who}</strong>, {use.what}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-blackboard-dark text-chalk-white p-8 sm:p-12">
          <div className="devanagari-frieze text-sm mb-6 justify-start">
            {DEV_FRIEZE_SHUFFLED.slice(0, 18).map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <h3 className="text-2xl sm:text-4xl font-serif-display font-bold">
                Try it on a page you have right now
              </h3>
              <p className="text-chalk-white/80 leading-relaxed">
                No account needed. Sign up for free if you need more pages per day.
              </p>
            </div>
            <Link to="/upload">
              <Button variant="chalk" size="lg" className="px-8 bg-chalk-yellow text-blackboard-dark hover:bg-chalk-white">
                Upload a page
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
