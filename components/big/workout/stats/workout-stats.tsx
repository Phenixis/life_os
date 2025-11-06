'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePersonalRecords } from "@/hooks/use-workouts"

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
                            <TableHead>Date</TableHead>
                            <TableHead>Reps</TableHead>
                            <TableHead>Weight (kg)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="animate-pulse">
                        {
                            Array.from({ length: 3 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-center py-4 w-2/3">
                                        <Skeleton className="h-4 w-3/4 mx-auto" />
                                    </TableCell>
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
                        <TableHead>Date</TableHead>
                        <TableHead>Reps</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {personalRecords.map((record) => (
                        <TableRow key={record.exercice_name}>
                            <TableCell>{record.exercice_name}</TableCell>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.nb_reps}</TableCell>
                            <TableCell>{record.weight}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}