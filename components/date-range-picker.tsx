"use client"

import * as React from "react"
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  isValid,
} from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type { DateRange }

export const DATE_RANGE_PRESETS = [
  {
    label: "Today",
    getRange: (): DateRange => ({ from: new Date(), to: new Date() }),
  },
  {
    label: "Last 7 days",
    getRange: (): DateRange => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: "Last 30 days",
    getRange: (): DateRange => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: "This month",
    getRange: (): DateRange => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last month",
    getRange: (): DateRange => {
      const last = subMonths(new Date(), 1)
      return { from: startOfMonth(last), to: endOfMonth(last) }
    },
  },
  {
    label: "This year",
    getRange: (): DateRange => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
]

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
  align?: "start" | "center" | "end"
}

export function DateRangePicker({
  value,
  onChange,
  className,
  align = "start",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [activePreset, setActivePreset] = React.useState<string>("This month")
  const [pendingRange, setPendingRange] = React.useState<DateRange>(value)

  const handlePreset = (preset: (typeof DATE_RANGE_PRESETS)[0]) => {
    const range = preset.getRange()
    setActivePreset(preset.label)
    setPendingRange(range)
    onChange(range)
    setOpen(false)
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range) {
      setActivePreset("")
      setPendingRange(range)
    }
  }

  const handleApply = () => {
    if (pendingRange?.from) {
      onChange(pendingRange)
    }
    setOpen(false)
  }

  const formatLabel = () => {
    if (activePreset) return activePreset
    if (!value?.from) return "Select range"
    if (!value.to || !isValid(value.to))
      return format(value.from, "MMM d, yyyy")
    return `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 text-sm font-normal", className)}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span>{formatLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {/* Preset sidebar */}
          <div className="flex w-36 flex-col gap-0.5 border-r border-border p-2">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Presets
            </p>
            {DATE_RANGE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={activePreset === preset.label ? "secondary" : "ghost"}
                size="sm"
                className="h-8 justify-start text-xs"
                onClick={() => handlePreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar panel */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={pendingRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">
                {pendingRange?.from && pendingRange?.to
                  ? `${format(pendingRange.from, "MMM d")} – ${format(pendingRange.to, "MMM d, yyyy")}`
                  : pendingRange?.from
                  ? `${format(pendingRange.from, "MMM d, yyyy")} – pick end date`
                  : "Pick a start date"}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPendingRange(value)
                    setOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!pendingRange?.from || !pendingRange?.to}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
