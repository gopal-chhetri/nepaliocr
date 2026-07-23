import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useAuth } from './use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate({ to: '/upload' })
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-3xl font-serif-display font-bold text-center mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-center mb-8">Sign in to continue using NepaliOCR</p>

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
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}