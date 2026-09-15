import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/theme-context'
import { ToastProvider } from '@/context/toast-context'
import { AuthProvider } from '@/context/auth-context'
import { AppRoutes } from '@/routes'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
