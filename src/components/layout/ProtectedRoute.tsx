import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'

interface Props {
  children: ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { session, loading } = useAuthStore()

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Yuklanmoqda…</div>
  }
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
