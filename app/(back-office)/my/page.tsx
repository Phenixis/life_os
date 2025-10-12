import {TasksCard} from "@/components/big/tasks/tasks-card"
import Calendar from "@/components/big/calendar/calendar"
import {NotesCard} from "@/components/big/notes/notes-card"

export default async function DashboardPage() {

    return (
        <div className="flex flex-col md:flex-row md:justify-between w-full h-full">
            <div className="flex flex-col order-2 md:order-0 md:max-h-screen w-full h-full lg:w-1/4">
                <TasksCard
                    className="w-full h-full lg:m-4"
                    limit={5}
                />
                <NotesCard className="w-full lg:m-4" limit={5}/>
                {/* <HabitsCard className="order-3 md:order-0 md:w-1/3 lg:w-1/4 lg:m-4" /> */}
            </div>
            <Calendar className="order-1 md:order-0"/>
        </div>
    )
}