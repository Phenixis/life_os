import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"

export default function WorkoutPage() {
    return (
        <div className="size-full mx-auto p-8 space-y-8">
            <section className={`size-full grid grid-cols-1 xl:grid-cols-3 gap-4 *:size-full`}>
                <article>
                    <h2 className={`text-lg lg:text-xl leading-loose text-gray-900 dark:text-gray-100`}>
                        Historique
                    </h2>
                </article>
                <article>
                    <h2 className={`text-lg lg:text-xl leading-loose text-gray-900 dark:text-gray-100`}>
                        New workout + Presaved workout
                    </h2>
                </article>
                <article>
                    <h2 className={`text-lg lg:text-xl leading-loose text-gray-900 dark:text-gray-100`}>
                        Statistiques
                    </h2>
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