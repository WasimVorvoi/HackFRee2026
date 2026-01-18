"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_SLOTS = [
  { key: "morning", label: "Morning", time: "6am-12pm" },
  { key: "afternoon", label: "Afternoon", time: "12pm-5pm" },
  { key: "evening", label: "Evening", time: "5pm-9pm" },
]

type AvailabilityData = {
  days: string[]
  timeSlots: string[]
}

interface AvailabilityPickerProps {
  value: AvailabilityData
  onChange: (value: AvailabilityData) => void
  className?: string
}

export function AvailabilityPicker({ value, onChange, className }: AvailabilityPickerProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(value?.days || [])
  const [selectedSlots, setSelectedSlots] = useState<string[]>(value?.timeSlots || [])

  useEffect(() => {
    if (value) {
      setSelectedDays(value.days || [])
      setSelectedSlots(value.timeSlots || [])
    }
  }, [value])

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day]
    setSelectedDays(newDays)
    onChange({ days: newDays, timeSlots: selectedSlots })
  }

  const toggleSlot = (slot: string) => {
    const newSlots = selectedSlots.includes(slot)
      ? selectedSlots.filter((s) => s !== slot)
      : [...selectedSlots, slot]
    setSelectedSlots(newSlots)
    onChange({ days: selectedDays, timeSlots: newSlots })
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Available Days</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full border transition-colors",
                selectedDays.includes(day)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Preferred Time Slots</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.key}
              type="button"
              onClick={() => toggleSlot(slot.key)}
              className={cn(
                "p-3 rounded-lg border transition-colors text-left",
                selectedSlots.includes(slot.key)
                  ? "bg-primary/10 border-primary"
                  : "bg-background border-border hover:border-primary/50"
              )}
            >
              <div className="font-medium text-sm">{slot.label}</div>
              <div className="text-xs text-muted-foreground">{slot.time}</div>
            </button>
          ))}
        </div>
      </div>

      {(selectedDays.length > 0 || selectedSlots.length > 0) && (
        <Card className="p-3 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Your availability: </span>
            {selectedDays.length > 0 && selectedSlots.length > 0 ? (
              <>
                {selectedDays.map((d) => d.slice(0, 3)).join(", ")} during{" "}
                {selectedSlots
                  .map((s) => TIME_SLOTS.find((ts) => ts.key === s)?.label.toLowerCase())
                  .join(", ")}
              </>
            ) : selectedDays.length > 0 ? (
              <>{selectedDays.map((d) => d.slice(0, 3)).join(", ")}</>
            ) : (
              <>
                {selectedSlots
                  .map((s) => TIME_SLOTS.find((ts) => ts.key === s)?.label)
                  .join(", ")}
              </>
            )}
          </p>
        </Card>
      )}
    </div>
  )
}
