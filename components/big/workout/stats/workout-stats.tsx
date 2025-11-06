'use client';

import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePersonalRecords } from "@/hooks/use-workouts"
import Help from "@/components/big/help";

export function WorkoutStats() {
    const { personalRecords, isLoading } = usePersonalRecords()

    if (isLoading) {
        return (
            <>
                <h3 className={`text-gray-600 dark:text-gray-400`}>Personal Records</h3>
                <Table className="w-full mx-auto max-w-full">
                    <TableCaption>Your best sets by weight for each exercise</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Exercise</TableHead>
                            {/* <TableHead>Date</TableHead> */}
                            <TableHead>Reps</TableHead>
                            <TableHead>Weight (kg)</TableHead>
                            <TableHead>Progress</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="animate-pulse">
                        {
                            Array.from({ length: 3 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-center py-4 w-2/3">
                                        <Skeleton className="h-4 w-3/4 mx-auto" />
                                    </TableCell>
                                    {/* <TableCell className="text-center py-4 w-full">
                                        <Skeleton className="h-4 w-3/4 mx-auto" />
                                    </TableCell> */}
                                    <TableCell className="text-center py-4 w-full">
                                        <Skeleton className="h-4 w-3/4 mx-auto" />
                                    </TableCell>
                                    <TableCell className="text-center py-4 w-full">
                                        <Skeleton className="h-4 w-3/4 mx-auto" />
                                    </TableCell>
                                    <TableCell className="text-center py-4 w-full">
                                        <Skeleton className="h-4 w-3/4 mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </>
        )
    }

    if (personalRecords.length === 0) {
        return (
            <>
                <h3 className={`text-gray-600 dark:text-gray-400`}>Personal Records</h3>
                <div className="flex flex-col items-center justify-center my-4 h-32 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400">No personal records yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Start tracking workouts to see your records here.</p>
                </div>
            </>
        )
    }

    return (
        <>
            <h3 className={`text-gray-600 dark:text-gray-400`}>Personal Records</h3>
            <Table className="w-full mx-auto">
                <TableCaption>Your best sets by weight for each exercise</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Exercise</TableHead>
                        {/* <TableHead>Date</TableHead> */}
                        <TableHead>Reps</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead className="flex items-center gap-1">
                            Progress
                            <Help size="sm">
                                Compared to 2nd best set
                            </Help>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {personalRecords.map((record) => {
                        const hasPrevious = record.previous_weight !== null
                        let progressContent: ReactNode

                        if (!hasPrevious) {
                            progressContent = <span className="text-gray-400 dark:text-gray-600">First record</span>
                        } else {
                            const isWeightChange = record.progress_metric === 'weight'
                            const isRepChange = record.progress_metric === 'reps'
                            const changeValue = isWeightChange
                                ? record.weight_diff ?? 0
                                : isRepChange
                                    ? record.nb_reps_diff ?? 0
                                    : 0

                            if (!isWeightChange && !isRepChange) {
                                progressContent = <span className="text-gray-600 dark:text-gray-400">No change</span>
                            } else {
                                const colorClass = changeValue > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : changeValue < 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-gray-400'
                                const unit = isWeightChange ? ' kg' : ' reps'
                                const formattedValue = `${changeValue > 0 ? '+' : ''}${changeValue}${unit}`

                                progressContent = <span className={colorClass}>{formattedValue}</span>
                            }
                        }

                        return (
                            <TableRow key={record.exercice_name}>
                                <TableCell>{record.exercice_name}</TableCell>
                                {/* <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell> */}
                                <TableCell>{record.nb_reps}</TableCell>
                                <TableCell>{record.weight}</TableCell>
                                <TableCell>{progressContent}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </>
    )
}