import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

export function VersionDatePicker({ id, value, min, onChange }: {
  id: string
  value: string
  min?: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined
  const earliest = min ? parseISO(min) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline"
          className={cn("w-full justify-start tabular-nums", !value && "")}>
          <CalendarDays />{value || '选择日期'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={8}
        className="max-h-(--available-height) w-auto overflow-y-auto overscroll-none p-0"
        onOpenAutoFocus={event => event.preventDefault()}>
        <Calendar
          mode="single"
          autoFocus
          locale={zhCN}
          selected={selected}
          defaultMonth={selected ?? earliest}
          disabled={earliest && { before: earliest }}
          onSelect={day => {
            onChange(day ? format(day, 'yyyy-MM-dd') : '')
            setOpen(false)
          }}
        />
        {value && (
          <div className="border-t px-2 py-1">
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => { onChange(''); setOpen(false) }}>
              清除日期
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
