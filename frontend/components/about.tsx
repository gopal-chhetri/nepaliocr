import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Globe, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function About() {
  const missions = [
    {
      icon: BookOpen,
      title: 'Preserve Heritage',
      description:
        "Digitize and safeguard Nepal's rich literary and cultural heritage for future generations.",
    },
    {
      icon: Globe,
      title: 'Enhance Accessibility',
      description:
        'Make Nepali content more accessible to a global audience through digital transformation.',
    },
    {
      icon: Users,
      title: 'Support Community',
      description:
        'Build a collaborative environment for improving Nepali language technology.',
    },
  ]

  return (
    <section
      id="about"
      className="py-24 bg-gradient-to-br from-primary-50 via-white to-secondary-50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Supporting Nepali language preservation and accessibility through
              modern technology
            </p>
          </motion.div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {missions.map((mission, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-6 shadow-soft hover:shadow-lg transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary mb-4">
                <mission.icon size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{mission.title}</h3>
              <p className="text-gray-600">{mission.description}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">Join Our Mission</h3>
              <p className="text-lg mb-6">
                Be part of the revolution in Nepali language technology.
                Together, we can bridge the gap between handwritten Nepali
                documents and the digital world.
              </p>
              <Button className="bg-white text-primary hover:bg-primary-50 font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105">
                Get Involved <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-xl -rotate-6 scale-95" />
              <Image
                src="/placeholder.svg?height=300&width=400"
                alt="Nepali OCR Community"
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
