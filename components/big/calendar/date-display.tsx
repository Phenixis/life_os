"use client"

import DailyMoodModal from "@/components/big/dailyMood/dailyMood-modal"
import type {DailyMood} from "@/lib/db/schema"

interface DateDisplayProps {
    date?: Date
    currentMood?: DailyMood.Select | null
}

export function DateDisplay({date, currentMood}: DateDisplayProps) {
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
                <DailyMoodModal date={date} />
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
