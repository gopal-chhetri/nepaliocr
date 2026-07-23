import { Navbar } from '@/components/navbar'
import { RegisterForm } from '@/features/auth/register-form'

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <RegisterForm />
      </div>
    </div>
  )
}