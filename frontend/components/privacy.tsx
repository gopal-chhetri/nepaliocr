import { motion } from 'framer-motion'
import { Shield, Lock, Eye, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function Privacy() {
  const privacyPoints = [
    {
      icon: Shield,
      title: 'Data Protection',
      description:
        'We employ industry-standard security measures to safeguard your data during transmission and processing.',
    },
    {
      icon: Lock,
      title: 'Secure Storage',
      description:
        'All data is encrypted at rest and in transit, ensuring the highest level of protection for your documents.',
    },
    {
      icon: Eye,
      title: 'No Data Retention',
      description:
        'We do not store uploaded images or extracted text beyond the processing time required to deliver results.',
    },
    {
      icon: FileCheck,
      title: 'Compliance',
      description:
        'Our practices are in line with global data protection regulations to ensure your privacy rights.',
    },
  ]

  return (
    <section
      id="privacy"
      className="py-24 bg-gradient-to-br from-primary-50 via-white to-secondary-50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            Your Privacy, Our Priority
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            At NepaliOCR, we are committed to protecting your privacy and
            ensuring the security of your data. Our robust privacy measures are
            designed to give you peace of mind.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {privacyPoints.map((point, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary mr-4">
                  <point.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold">{point.title}</h3>
              </div>
              <p className="text-gray-600">{point.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="bg-white rounded-2xl p-8 shadow-xl border border-primary/10"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4 text-foreground">
                Your Data, Your Control
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                We believe in transparency and giving you full control over your
                data. You have the right to request access, correction, or
                deletion of your information at any time.
              </p>
              <Button className="bg-primary hover:bg-primary-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg">
                Read Full Policy
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl rotate-3 scale-105" />
              <Image
                src="/placeholder.svg?height=300&width=400"
                alt="Data Privacy Illustration"
                width={500}
                height={500}
                className="relative rounded-xl shadow-lg"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
