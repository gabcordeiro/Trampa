import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface AdminRouteProps {
  allowedRoles?: Array<'admin' | 'reviewer'>
}

export function AdminRoute({ allowedRoles = ['admin', 'reviewer'] }: AdminRouteProps) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile || !allowedRoles.includes(profile.role as 'admin' | 'reviewer')) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
