"use client"

import { useDailyMoodModal } from "@/contexts/modal-commands-context"
import { Angry, Frown, Laugh, Meh, Smile, SmilePlus } from "lucide-react"
import type {DailyMood} from "@/lib/db/schema"

interface DateDisplayProps {
    date?: Date
    currentMood?: DailyMood.Select | null
}

export function DateDisplay({date, currentMood}: DateDisplayProps) {
    const dailyMoodModal = useDailyMoodModal()
    
    // Function to get mood icon based on mood value
    const getMoodIcon = (mood: number | null | undefined) => {
        switch (mood) {
            case 0:
                return <Angry className="min-w-6 max-w-6 min-h-6 text-red-700" />
            case 1:
                return <Frown className="min-w-6 max-w-6 min-h-6 text-blue-400" />
            case 2:
                return <Meh className="min-w-6 max-w-6 min-h-6 text-amber-300" />
            case 3:
                return <Smile className="min-w-6 max-w-6 min-h-6 text-green-400" />
            case 4:
                return <Laugh className="min-w-6 max-w-6 min-h-6 text-green-800" />
            default:
                return <SmilePlus className="min-w-6 max-w-6 min-h-6" />
        }
    }
    
    return (
        <>
            <div className="flex items-center justify-center w-full text-2xl">
                <div className="flex flex-col items-center justify-center w-fit text-xl p-2">{date?.getDate()}</div>
                <div className="flex flex-col items-center justify-center w-full text-xl">
                    <div className="w-full">
                        {date?.toLocaleDateString(undefined, {
                            weekday: 'short'
                        })}
                    </div>
                    <div className="w-full text-base flex flex-row gap-2">
                        <div>
                            {date?.toLocaleDateString(undefined, {
                                month: 'long',
                                year: 'numeric'
                            })}
                        </div>
                        <div>
                            {(() => {
                                if (!date) return ''
                                const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
                                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
                                const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
                                const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
                                return (
                                    <span>
                                        W<span className="hidden lg:inline">eek </span>
                                        {weekNumber}
                                    </span>
                                )
                            })()}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => dailyMoodModal.openModal(date)}
                    className="h-10 px-2 flex items-center border-none w-fit text-xs hover:opacity-70 transition-opacity cursor-pointer"
                >
                    {getMoodIcon(currentMood?.mood)}
                </button>
            </div>
            {currentMood && currentMood.comment && (
                <div className="w-full mt-2 px-2 pb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 italic break-words text-justify">
                        &quot;{currentMood.comment}&quot;
                    </div>
                </div>
            )}
        </>
    )
}
