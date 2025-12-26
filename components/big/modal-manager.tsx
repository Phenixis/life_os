"use client"

import TaskModal from "@/components/big/tasks/task-modal"
import NoteModal from "@/components/big/notes/note-modal"
import DailyMoodModal from "@/components/big/dailyMood/dailyMood-modal"

export default function ModalManager() {
    return (
        <>
            <TaskModal/>
            <NoteModal/>
            <DailyMoodModal/>
        </>
    )
}
