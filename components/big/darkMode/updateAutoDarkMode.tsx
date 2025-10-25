"use client"

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { type DarkModeCookie } from "@/lib/flags"
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useDarkMode } from '@/hooks/use-dark-mode'

export default function UpdateAutoDarkMode({
    darkModeCookie
}: {
    darkModeCookie: DarkModeCookie
}) {
    const [autoDarkMode, setAutoDarkMode] = useState(darkModeCookie.auto_dark_mode)
    const [startTime, setStartTime] = useState((darkModeCookie.startHour < 10 ? "0" + darkModeCookie.startHour : darkModeCookie.startHour) + ":" + (darkModeCookie.startMinute < 10 ? "0" + darkModeCookie.startMinute : darkModeCookie.startMinute) + ":00")
    const [endTime, setEndTime] = useState((darkModeCookie.endHour < 10 ? "0" + darkModeCookie.endHour : darkModeCookie.endHour) + ":" + (darkModeCookie.endMinute < 10 ? "0" + darkModeCookie.endMinute : darkModeCookie.endMinute) + ":00")
    
    const { updateDarkModeSettings } = useDarkMode()

    const updateCookie = useDebouncedCallback(async () => {
        const newCookie = {
            ...darkModeCookie,
            startHour: parseInt(startTime.split(':')[0]),
            startMinute: parseInt(startTime.split(':')[1]),
            endHour: parseInt(endTime.split(':')[0]),
            endMinute: parseInt(endTime.split(':')[1]),
            auto_dark_mode: autoDarkMode,
        }

        // Only update if there are actual changes
        const hasChanges = 
            newCookie.startHour !== darkModeCookie.startHour ||
            newCookie.startMinute !== darkModeCookie.startMinute ||
            newCookie.endHour !== darkModeCookie.endHour ||
            newCookie.endMinute !== darkModeCookie.endMinute ||
            newCookie.auto_dark_mode !== darkModeCookie.auto_dark_mode

        if (!hasChanges) return

        await updateDarkModeSettings(newCookie, () => {
            // Update the initial cookie reference for future comparisons
            Object.assign(darkModeCookie, newCookie)
        })
    }, 1000)

    return (
        <Card className="w-fit">
            <CardHeader className={`flex flex-row items-center gap-2 space-y-0 ${!autoDarkMode && "xl:pb-6"}`}>
                <Checkbox
                    id="auto-dark-mode"
                    checked={autoDarkMode}
                    onCheckedChange={(checked) => {
                        const newValue = checked === true
                        setAutoDarkMode(newValue)
                        updateCookie()
                    }}
                />
                <CardTitle className="text-base xl:text-lg">Auto Dark Mode</CardTitle>
            </CardHeader>
            {
                autoDarkMode && (
                    <CardContent className="flex flex-row items-center gap-2">
                        <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => {
                                setStartTime(e.target.value)
                                updateCookie()
                            }}
                        />
                        <Label className="text-base xl:text-lg">to</Label>
                        <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => {
                                setEndTime(e.target.value)
                                updateCookie()
                            }}
                        />
                    </CardContent>
                )
            }
        </Card>
    )
}