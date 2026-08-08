import { Outlet } from '@tanstack/react-router'
import { Navbar } from '@/components/navbar'

export function RootLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
