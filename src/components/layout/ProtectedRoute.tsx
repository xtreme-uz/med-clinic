import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

interface Props {
  children: ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: Props) {
  const { session, profile, loading } = useAuthStore()

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Yuklanmoqda…</div>
  }
  if (!session) {
    return <Navigate to="/login" replace />
  }
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
