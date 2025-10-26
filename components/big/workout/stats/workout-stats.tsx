import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"

export function WorkoutStats() {
    return (
        <>
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
        </>
    )
}