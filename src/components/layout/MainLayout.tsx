import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  DoorOpen,
  Wrench,
  Users,
  ClipboardList,
  Hospital,
  ScrollText,
  UserCog,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { can } from '@/lib/permissions'

const navItem =
  'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-700'
const activeItem = 'bg-slate-700 text-white'

export function MainLayout() {
  const { profile, signOut } = useAuthStore()
  const role = profile?.role ?? null

  return (
    <div className="flex h-screen">
      <aside className="w-60 shrink-0 bg-slate-800 p-4 text-slate-100">
        <h1 className="mb-6 text-lg font-semibold">Klinika Booking</h1>
        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/beds" className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
            <BedDouble size={18} /> Karavotlar
          </NavLink>
          <NavLink to="/patients" className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
            <Users size={18} /> Bemorlar
          </NavLink>
          <NavLink to="/reservations" className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
            <ClipboardList size={18} /> Bandlov
          </NavLink>
          <NavLink to="/admissions" className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
            <Hospital size={18} /> Yotqizish
          </NavLink>
          {can.manageDepartments(role) && (
            <>
              <NavLink to="/departments" className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
                <Building2 size={18} /> Bo'limlar
              </NavLink>
              <NavLink to="/rooms" className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
                <DoorOpen size={18} /> Xonalar
              </NavLink>
              <NavLink to="/beds-manage" className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
                <Wrench size={18} /> Karavot boshqaruvi
              </NavLink>
            </>
          )}
          {can.manageStaff(role) && (
            <NavLink to="/staff" className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
              <UserCog size={18} /> Xodimlar
            </NavLink>
          )}
          {can.viewAuditLog(role) && (
            <NavLink to="/audit-log" className={({ isActive }) => `${navItem} ${isActive ? activeItem : ''}`}>
              <ScrollText size={18} /> Audit Log
            </NavLink>
          )}
        </nav>
        <div className="mt-auto pt-6">
          <div className="mb-2 text-xs text-slate-400">
            {profile?.full_name} · {profile?.role}
          </div>
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2 rounded-md bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
          >
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50 p-6">
        <Outlet />
      </main>
    </div>
  )
}
