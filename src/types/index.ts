export type UserRole = 'admin' | 'doctor' | 'registrar'
export type BedStatus = 'free' | 'reserved' | 'occupied' | 'maintenance'
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'expired'
  | 'checked_in'
export type AdmissionStatus = 'active' | 'discharged' | 'transferred'
export type Gender = 'male' | 'female'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  department_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  description: string | null
  floor: number | null
  is_active: boolean
}

export interface Room {
  id: string
  department_id: string
  room_number: string
  room_type: string
  floor: number | null
  is_active: boolean
}

export interface Bed {
  id: string
  room_id: string
  bed_number: string
  status: BedStatus
  daily_price: number
  notes: string | null
}

export interface BedWithRoom extends Bed {
  room: Room & { department: Department }
}

export interface Patient {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  birth_date: string
  gender: Gender
  passport_number: string | null
  phone: string
  phone_secondary: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  blood_type: string | null
  allergies: string | null
  chronic_conditions: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  patient_id: string
  bed_id: string
  department_id: string
  doctor_id: string | null
  reserved_by: string
  check_in_date: string
  check_out_date: string
  status: ReservationStatus
  diagnosis_preliminary: string | null
  referral_number: string | null
  notes: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface Admission {
  id: string
  reservation_id: string | null
  patient_id: string
  bed_id: string
  department_id: string
  attending_doctor_id: string | null
  admitted_by: string
  status: AdmissionStatus
  admitted_at: string
  discharged_at: string | null
  discharged_by: string | null
  diagnosis: string | null
  treatment_notes: string | null
  discharge_summary: string | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_beds: number
  free_beds: number
  reserved_beds: number
  occupied_beds: number
  maintenance_beds: number
  pending_reservations: number
  today_checkins: number
  today_checkouts: number
  active_admissions: number
  occupancy_rate: number | null
}
