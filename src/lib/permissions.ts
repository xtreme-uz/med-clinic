import type { UserRole } from '@/types'

export const can = {
  manageStaff: (role: UserRole | null) => role === 'admin',
  manageDepartments: (role: UserRole | null) => role === 'admin',
  bookBed: (role: UserRole | null) => role === 'admin' || role === 'registrar',
  createReferral: (role: UserRole | null) => role === 'doctor',
  viewAuditLog: (role: UserRole | null) => role === 'admin',
  checkInOut: (role: UserRole | null) => role === 'admin' || role === 'registrar',
}
