import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createBrowserHistory,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { RootLayout } from '@/routes/__root'
import { HomePage } from '@/routes/index'
import { LoginPage } from '@/routes/login'
import { RegisterPage } from '@/routes/register'
import { UploadPage } from '@/routes/upload'
import { ContributePage } from '@/routes/contribute'
import { OcrUpload } from '@/features/ocr/ocr-upload'
import { About } from '@/components/about'
import { Privacy } from '@/components/privacy'
import { SectionLayout } from '@/components/sections'
import '@/styles/globals.css'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
})

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/upload',
  component: UploadPage,
})

const contributeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contribute',
  component: ContributePage,
})

const ocrRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ocr',
  component: () => (
    <SectionLayout>
      <div className="space-y-8">
        <h2 className="text-3xl font-serif-display font-bold text-foreground chalk-text">Nepali OCR Converter</h2>
        <p className="text-muted-foreground">
          Upload your document and watch as it's transformed into digital text in seconds.
        </p>
        <OcrUpload />
      </div>
    </SectionLayout>
  ),
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: () => (
    <SectionLayout compact>
      <About page />
    </SectionLayout>
  ),
})

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy',
  component: () => (
    <SectionLayout compact>
      <Privacy page />
    </SectionLayout>
  ),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  uploadRoute,
  contributeRoute,
  ocrRoute,
  aboutRoute,
  privacyRoute,
])

const router = createRouter({ routeTree, history: createBrowserHistory() })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
