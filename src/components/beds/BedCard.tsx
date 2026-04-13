import type { BedStatus, BedWithRoom } from '@/types'

const colorByStatus: Record<BedStatus, string> = {
  free: 'bg-bed-free hover:brightness-110',
  reserved: 'bg-bed-reserved hover:brightness-110',
  occupied: 'bg-bed-occupied hover:brightness-110',
  maintenance: 'bg-bed-maintenance hover:brightness-110',
}

interface Props {
  bed: BedWithRoom
  onClick: (bed: BedWithRoom) => void
}

export function BedCard({ bed, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(bed)}
      className={`flex h-20 w-full flex-col items-start justify-between rounded-md p-2 text-left text-white shadow-sm transition ${colorByStatus[bed.status]}`}
    >
      <div className="text-xs opacity-90">Karavot</div>
      <div className="text-2xl font-semibold leading-none">#{bed.bed_number}</div>
      <div className="text-[11px] opacity-90">
        {bed.daily_price.toLocaleString('uz-UZ')} so'm
      </div>
    </button>
  )
}
