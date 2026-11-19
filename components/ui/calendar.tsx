'use client'
import { Calendar as HeroCalendar } from '@heroui/react/calendar'
import { parseDate } from '@internationalized/date'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const calendarDate = (date?: Date) => date ? parseDate([
  date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0'),
].join('-')) : undefined

export function Calendar({ selected, defaultMonth, disabled, autoFocus, onSelect }: {
  mode?: 'single', selected?: Date, defaultMonth?: Date, disabled?: { before: Date }, autoFocus?: boolean,
  locale?: unknown, onSelect: (date: Date | undefined) => void,
}) {
  return <HeroCalendar aria-label="选择日期" autoFocus={autoFocus} value={calendarDate(selected) ?? null}
    minValue={calendarDate(disabled?.before)} defaultFocusedValue={calendarDate(defaultMonth)}
    onChange={date => onSelect(date ? new Date(date.year, date.month - 1, date.day) : undefined)}>
    <HeroCalendar.Header>
      <HeroCalendar.NavButton slot="previous">
        <ChevronLeft aria-hidden="true" className="calendar__nav-button-icon" />
      </HeroCalendar.NavButton>
      <HeroCalendar.Heading />
      <HeroCalendar.NavButton slot="next">
        <ChevronRight aria-hidden="true" className="calendar__nav-button-icon" />
      </HeroCalendar.NavButton>
    </HeroCalendar.Header>
    <HeroCalendar.Grid>
      <HeroCalendar.GridHeader>{day => <HeroCalendar.HeaderCell>{day}</HeroCalendar.HeaderCell>}</HeroCalendar.GridHeader>
      <HeroCalendar.GridBody>{date => <HeroCalendar.Cell date={date} />}</HeroCalendar.GridBody>
    </HeroCalendar.Grid>
  </HeroCalendar>
}
