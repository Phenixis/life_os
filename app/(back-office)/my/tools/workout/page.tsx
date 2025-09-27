import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {SavedWorkout} from "./saved-workout/saved-workout";
import {PastWorkouts} from "@/app/(back-office)/my/tools/workout/past-workout/past-workouts";
import {NewWorkout} from "./new-workout";

export default async function WorkoutPage() {
    return (
        <div className="size-full mx-auto p-8 space-y-8">
            <section className={`size-full grid grid-cols-1 xl:grid-cols-3 gap-4 *:size-full`}>
                <article>
                    <h2 className={`text-lg lg:text-xl leading-loose text-gray-900 dark:text-gray-100`}>
                        Historique
                    </h2>
                    <PastWorkouts />
                </article>
                <article>
                    <header className={`flex justify-between items-center space-x-4`}>
                        <h2 className={`text-lg lg:text-xl leading-loose text-gray-900 dark:text-gray-100`}>
                            New workout
                        </h2>
                        <NewWorkout />
                    </header>
                    <SavedWorkout/>
                </article>
                <article>
                    <h2 className={`text-lg lg:text-xl leading-loose text-gray-900 dark:text-gray-100`}>
                        Statistiques
                    </h2>
                    <h3 className={`text-gray-600 dark:text-gray-400`}>Personal Records</h3>
                    <Table className="mx-auto">
                        <TableCaption>Exercice Statistics</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exercice</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Weight</TableHead>
                                <TableHead>Nb Set</TableHead>
                                <TableHead>Nb Rep</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Squat</TableCell>
                                <TableCell>2024-01-01</TableCell>
                                <TableCell>100</TableCell>
                                <TableCell>3</TableCell>
                                <TableCell>10</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Bench Press</TableCell>
                                <TableCell>2024-01-02</TableCell>
                                <TableCell>120</TableCell>
                                <TableCell>5</TableCell>
                                <TableCell>8</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </article>
            </section>
        </div>
    )
}