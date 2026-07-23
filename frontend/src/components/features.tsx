import { FileText, Cpu, Sparkle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: FileText,
    step: '01',
    title: 'Smart Upload',
    description: 'Drag & drop image files, scans, or photos of Devanagari manuscripts.',
    tag: 'Instant Input',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'AI Processing',
    description: 'Gemini AI extracts Devanagari character glyphs with contextual grammar accuracy.',
    tag: 'Neural OCR',
  },
  {
    icon: Sparkle,
    step: '03',
    title: 'Editable Text',
    description: 'Copy, refine, and export digital Devanagari text ready for document workflows.',
    tag: '1-Click Export',
  },
]

export function Features() {
  return (
    <section className="py-28 bg-background relative overflow-hidden" id="features">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center space-y-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-accent/40 bg-accent/8 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Seamless Workflow
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif-display font-bold text-foreground chalk-text">
            Simple 3-Step Digitization
          </h2>
          <span className="chalk-underline block mx-auto w-24 h-1 mt-2" />
          <p className="text-lg text-muted-foreground max-w-[600px] mx-auto leading-relaxed">
            Transform physical Nepali printed documents into copyable text in seconds.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="notebook-card flex flex-col p-8 rounded-b-2xl"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="absolute top-3 right-5 text-3xl font-serif-display font-bold text-accent/30 select-none">
                {feature.step}
              </div>

              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-dashed border-accent/30 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6" />
              </div>

              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {feature.tag}
              </span>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
