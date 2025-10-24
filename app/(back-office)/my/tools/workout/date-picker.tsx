"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Minus, Plus } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"

export function DatePicker({
    value,
    onChange,
    minDate,
}: {
    value: Date
    onChange: (date: Date) => void
    minDate?: Date
}) {
    const [showCalendar, setShowCalendar] = useState(false)

    const handleDateChange = (newDate: Date | undefined) => {
        if (newDate) {
            onChange(newDate)
            setShowCalendar(false)
        }
    }

    return (
        <div className="flex gap-1 items-center">
            <Button
                type="button"
                variant="outline"
                className="px-2"
                onClick={() => {
                    const newDate = new Date(value.getTime() - 24 * 60 * 60 * 1000)
                    if (minDate) {
                        const min = new Date(minDate)
                        min.setHours(0, 0, 0, 0)
                        if (newDate >= min) {
                            onChange(newDate)
                        } else {
                            onChange(min)
                        }
                    } else {
                        onChange(newDate)
                    }
                }}
            >
                <Minus />
            </Button>

            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                    >
                        {format(value, "dd/MM/yyyy")}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start" side="bottom">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateChange}
                        disabled={(date) => {
                            if (minDate) {
                                const min = new Date(minDate)
                                min.setHours(0, 0, 0, 0)
                                return date < min
                            }
                            return false
                        }}
                    />
                </PopoverContent>
            </Popover>

            <Button
                type="button"
                variant="outline"
                className="px-2"
                onClick={() => {
                    const nextDate = new Date(value.getTime() + 24 * 60 * 60 * 1000)
                    onChange(nextDate)
                }}
            >
                <Plus />
            </Button>
        </div>
    )
}
