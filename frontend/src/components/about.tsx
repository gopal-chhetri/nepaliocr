import { motion } from 'framer-motion'
import { BookOpen, Globe, Users, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { DEV_FRIEZE_SHUFFLED } from '@/lib/devanagari'

const missions = [
  {
    icon: BookOpen,
    title: 'Preserve Heritage',
    description: "Digitize and safeguard Nepal's rich literary and cultural heritage for future generations.",
  },
  {
    icon: Globe,
    title: 'Enhance Accessibility',
    description: 'Make Nepali content readable, searchable, and globally accessible.',
  },
  {
    icon: Users,
    title: 'Empower Researchers',
    description: 'Accelerate scholarly, legal, and academic translation and archival work.',
  },
]

export function About() {
  return (
    <section id="about" className="py-28 bg-secondary/20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center space-y-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-accent/40 bg-accent/8 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Our Purpose
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif-display font-bold text-foreground chalk-text">
            Our Mission & Impact
          </h2>
          <span className="chalk-underline block mx-auto w-24 h-1 mt-2" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Bridging historic Devanagari literature into the digital era with intelligent OCR.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {missions.map((mission, index) => (
            <motion.div
              key={index}
              className="notebook-card rounded-2xl p-8 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-dashed border-accent/30 flex items-center justify-center text-accent mb-6">
                <mission.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{mission.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{mission.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="relative rounded-3xl bg-accent/90 p-8 sm:p-12 text-accent-foreground shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-blackboard/10 rounded-full blur-3xl pointer-events-none" />

          <div className="devanagari-frieze text-sm opacity-20 mb-4 justify-center">
            {DEV_FRIEZE_SHUFFLED.map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-3 max-w-xl">
              <h3 className="text-2xl sm:text-4xl font-serif-display font-bold chalk-text">
                Start Digitizing Documents Today
              </h3>
              <p className="text-accent-foreground/80 text-sm sm:text-base leading-relaxed">
                Try NepaliOCR right now without registration, or create a free account for higher daily extraction limits.
              </p>
            </div>
            <Link to="/upload">
              <Button
                variant="chalk"
                size="lg"
                className="font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all bg-blackboard text-chalk-white hover:bg-blackboard-dark"
              >
                Try Free Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="devanagari-frieze text-sm opacity-20 mt-4 justify-center">
            {DEV_FRIEZE_SHUFFLED.map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
