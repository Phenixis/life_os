'use client';

import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {usePersonalRecords} from "@/hooks/use-workouts"

export function WorkoutStats() {
    const {personalRecords, isLoading} = usePersonalRecords()

    if (isLoading) {
        return (
            <>
                <h3 className={`text-gray-600 dark:text-gray-400`}>Personal Records</h3>
                <div className="flex items-center justify-center h-32">
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
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
            <Table className="mx-auto">
                <TableCaption>Your best sets by weight for each exercise</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Exercise</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Reps</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {personalRecords.map((record) => (
                        <TableRow key={record.exercice_name}>
                            <TableCell>{record.exercice_name}</TableCell>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.weight}</TableCell>
                            <TableCell>{record.nb_reps}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}