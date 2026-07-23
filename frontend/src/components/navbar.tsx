import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { List, X, SignIn, User, Sun, Moon } from '@phosphor-icons/react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { Link, useNavigate } from '@tanstack/react-router'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()
  const { isAuthenticated, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50)
  })

  const goHome = (hash?: string) => {
    navigate({ to: '/', hash })
    setIsMenuOpen(false)
  }

  return (
    <motion.header
      className={`w-full backdrop-blur-lg sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => goHome()}>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              NepaliOCR
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {[{ label: 'Home', hash: undefined }, { label: 'OCR', hash: 'ocr' }, { label: 'About', hash: 'about' }, { label: 'Privacy', hash: 'privacy' }].map(({ label, hash }) => (
              <button
                key={label}
                onClick={() => goHome(hash)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/upload">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90 font-medium rounded-lg px-4">
                    OCR Tool
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-muted-foreground hover:text-destructive font-medium"
                >
                  Logout
                </Button>
                <span className="text-xs text-muted-foreground hidden lg:block truncate max-w-[120px]">
                  {user?.email}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90 font-medium rounded-lg px-4">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-foreground"
            >
              {isMenuOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-4 py-3 space-y-1">
            {[{ label: 'Home', hash: undefined }, { label: 'OCR', hash: 'ocr' }, { label: 'About', hash: 'about' }, { label: 'Privacy', hash: 'privacy' }].map(({ label, hash }) => (
              <button
                key={label}
                onClick={() => goHome(hash)}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/upload"
                    className="block px-3 py-2 text-sm font-medium text-primary"
                  >
                    OCR Tool
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-destructive"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-sm font-medium text-primary"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.header>
  )
}