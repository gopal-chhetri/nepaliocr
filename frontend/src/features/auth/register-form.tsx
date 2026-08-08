import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useAuth } from './use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { DEV_REGISTER_SHUFFLED } from '@/lib/devanagari'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(email, password)
      navigate({ to: '/upload' })
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center px-4 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="notebook-card rounded-xl shadow-lg p-8">
          <div className="devanagari-frieze text-xs mb-4 opacity-20 justify-center">
            {DEV_REGISTER_SHUFFLED.map((ch, i) => <span key={i}>{ch}</span>)}
          </div>
          <h2 className="text-3xl font-serif-display font-bold text-center mb-2 chalk-text">
            Create Account
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Get 25 OCR requests per day: sign up free
          </p>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm border border-destructive/20">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                ruled
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                ruled
              />
            </div>
            <Button type="submit" variant="chalk" className="w-full font-semibold" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Anonymous users get 10 OCR requests/day per IP.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
