import { differenceInCalendarDays, format, parseISO } from 'date-fns'

export function formatDate(d: string | Date): string {
  return format(typeof d === 'string' ? parseISO(d) : d, 'dd.MM.yyyy')
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(0, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)))
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
