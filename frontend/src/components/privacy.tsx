import { motion } from 'framer-motion'
import { Lock, Eye, Trash, FileLock } from '@phosphor-icons/react'

const items = [
  {
    icon: Lock,
    title: 'Encrypted Transmission',
    description: 'All uploaded documents are transferred over TLS 1.3 encrypted connections.',
  },
  {
    icon: Eye,
    title: 'No Human Access',
    description: 'Automated processing only. No human reviews or stores your document contents.',
  },
  {
    icon: Trash,
    title: 'Automatic Deletion',
    description: 'Uploaded images and extracted text are permanently deleted within 24 hours.',
  },
  {
    icon: FileLock,
    title: 'No Training Data',
    description: 'Your documents are never used to train or fine-tune AI models.',
  },
]

export function Privacy({ page = false }: { page?: boolean }) {
  return (
    <section id="privacy" className={`${page ? 'py-10 sm:py-12' : 'py-28'} bg-background relative overflow-hidden`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center space-y-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-accent/40 bg-accent/8 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Your Privacy
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif-display font-bold text-foreground chalk-text">
            Private by Design
          </h2>
          <span className="chalk-underline block mx-auto w-24 h-1 mt-2" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your documents stay yours. Built-in privacy at every layer of the stack.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {items.map((item, index) => (
            <motion.div
              key={index}
              className="notebook-card rounded-2xl p-8 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-dashed border-accent/30 flex items-center justify-center text-accent mb-6">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
