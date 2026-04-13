import type { BedStatus } from '@/types'

const labels: Record<BedStatus, string> = {
  free: 'Bo\u2018sh',
  reserved: 'Band qilingan',
  occupied: 'Yotqizilgan',
  maintenance: 'Ta\u2019mirda',
}

const classes: Record<BedStatus, string> = {
  free: 'bg-green-100 text-green-800 border-green-300',
  reserved: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  occupied: 'bg-red-100 text-red-800 border-red-300',
  maintenance: 'bg-slate-100 text-slate-700 border-slate-300',
}

export function BedStatusBadge({ status }: { status: BedStatus }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs ${classes[status]}`}>
      {labels[status]}
    </span>
  )
}
