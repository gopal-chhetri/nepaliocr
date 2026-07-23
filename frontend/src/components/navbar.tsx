import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { List, X, SignOut, Sun, Moon } from '@phosphor-icons/react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { Link, useNavigate } from '@tanstack/react-router'
import { DEV_FRIEZE_SHUFFLED } from '@/lib/devanagari'

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
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 border-b border-border shadow-sm'
          : 'bg-background'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Devanagari frieze strip */}
      <div className="devanagari-frieze text-[0.65rem] sm:text-[0.75rem] leading-none h-5 sm:h-6 overflow-hidden">
        {DEV_FRIEZE_SHUFFLED.map((ch, i) => <span key={i}>{ch}</span>)}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => goHome()}>
            <img src="/nepaliocr.png" alt="NepaliOCR" className="h-8 w-8 rounded-full object-cover ring-2 ring-accent/40" />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground chalk-text">
              NepaliOCR
            </span>
            <span className="font-devanagari text-xs text-accent/60 hidden sm:inline">ने</span>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {[{ label: 'Home', hash: undefined }, { label: 'OCR', hash: 'ocr' }, { label: 'About', hash: 'about' }, { label: 'Privacy', hash: 'privacy' }].map(({ label, hash }) => (
              <button
                key={label}
                onClick={() => goHome(hash)}
                className="relative px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50 group"
              >
                {label}
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-accent/60 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors border border-border/40"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/upload">
                  <Button variant="chalk" size="sm" className="rounded-lg px-4">
                    OCR Tool
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-muted-foreground hover:text-destructive font-medium"
                >
                  <SignOut size={14} className="mr-1" />
                  Logout
                </Button>
                <span className="text-xs text-muted-foreground hidden lg:block truncate max-w-[120px]">
                  {user?.email}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-medium rounded-lg">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="chalk" size="sm" className="rounded-lg px-4">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground border border-border/40"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
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
          <div className="devanagari-frieze text-[0.6rem] leading-none h-4">
            {DEV_FRIEZE_SHUFFLED.map((ch, i) => <span key={i}>{ch}</span>)}
          </div>
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
                    className="block px-3 py-2 text-sm font-medium text-accent"
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
                    className="block px-3 py-2 text-sm font-medium text-accent"
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
