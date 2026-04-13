import { Inbox, type LucideIcon } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  title: string
  hint?: string
  cols?: number
}

export function EmptyState({ icon: Icon = Inbox, title, hint }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-2 rounded-full bg-slate-100 p-3 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  )
}

export function EmptyRow({ cols, title, icon }: Props & { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-0">
        <EmptyState title={title} icon={icon} />
      </td>
    </tr>
  )
}
