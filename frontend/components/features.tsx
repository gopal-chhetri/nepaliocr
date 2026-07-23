import { Bot, FileText, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export function Features() {
  const features = [
    {
      icon: FileText,
      title: 'Upload Documents',
      description:
        'Share your handwritten Nepali documents to help train our system',
      color: 'bg-primary-100 text-primary',
    },
    {
      icon: Bot,
      title: 'AI Processing',
      description:
        'Our AI model analyzes and converts the handwriting to digital text',
      color: 'bg-secondary-100 text-primary-100',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description:
        'Join our community effort to improve Nepali language processing',
      color: 'bg-accent-100 text-primary',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Simple Three Step Process
          </h2>
          <p className="text-xl text-gray-600 max-w-[600px] mx-auto">
            NepaliOCR uses advanced AI to recognize and digitize Nepali
            handwritten text
          </p>
        </motion.div>
        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-white shadow-soft hover:shadow-lg transition-shadow duration-300"
              variants={itemVariants}
            >
              <div
                className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center mb-4`}
              >
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
