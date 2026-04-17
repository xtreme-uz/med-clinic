import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { BedsPage } from '@/pages/BedsPage'
import { PatientsPage } from '@/pages/PatientsPage'
import { PatientDetailPage } from '@/pages/PatientDetailPage'
import { ReservationsPage } from '@/pages/ReservationsPage'
import { AdmissionsPage } from '@/pages/AdmissionsPage'
import { DischargePrintPage } from '@/pages/DischargePrintPage'
import { DepartmentsPage } from '@/pages/DepartmentsPage'
import { RoomsPage } from '@/pages/RoomsPage'
import { BedsManagePage } from '@/pages/BedsManagePage'
import { StaffPage } from '@/pages/StaffPage'
import { AuditLogPage } from '@/pages/AuditLogPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => {
    void init()
  }, [init])

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="beds" element={<BedsPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:id" element={<PatientDetailPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="admissions" element={<AdmissionsPage />} />
            <Route path="admissions/:id/print" element={<DischargePrintPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="beds-manage" element={<BedsManagePage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
