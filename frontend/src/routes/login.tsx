import { Navbar } from '@/components/navbar'
import { LoginForm } from '@/features/auth/login-form'

export function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <LoginForm />
      </div>
    </div>
  )
}