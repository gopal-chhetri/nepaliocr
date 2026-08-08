import { useEffect } from 'react'
import { RegisterForm } from '@/features/auth/register-form'

export function RegisterPage() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="min-h-[100dvh] flex justify-center bg-background overflow-hidden">
      <div className="w-full max-w-md pt-12">
        <RegisterForm />
      </div>
    </div>
  )
}