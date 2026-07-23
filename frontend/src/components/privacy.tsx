import { motion } from 'framer-motion'
import { ShieldCheck, Lock, EyeClosed, CheckCircle } from '@phosphor-icons/react'

export function Privacy() {
  const points = [
    {
      icon: ShieldCheck,
      title: 'Data Encryption',
      description: 'TLS 1.3 encryption for data in transit with secure API endpoints.',
    },
    {
      icon: Lock,
      title: 'Protected Access',
      description: 'Strict authentication protocols safeguarding your account and usage history.',
    },
    {
      icon: EyeClosed,
      title: 'Zero Storage Guarantee',
      description: 'Uploaded images are processed in-memory and discarded after OCR extraction.',
    },
    {
      icon: CheckCircle,
      title: 'Privacy First',
      description: 'Full compliance with global data privacy and user safety standards.',
    },
  ]

  return (
    <section id="privacy" className="py-28 bg-background relative border-t border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center space-y-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Security Guarantee
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif-display font-bold text-foreground">
            Your Privacy, Our Priority
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We are committed to absolute data confidentiality and secure document processing.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {points.map((point, index) => (
            <motion.div
              key={index}
              className="group bg-card rounded-2xl p-8 border border-border/60 hover:border-accent/40 shadow-sm hover:shadow-xl transition-all duration-300 flex items-start gap-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                <point.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}