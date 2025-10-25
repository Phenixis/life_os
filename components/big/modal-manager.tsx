"use client"

import TaskModal from "@/components/big/tasks/task-modal"
import NoteModal from "@/components/big/notes/note-modal"
import DailyMoodModal from "@/components/big/dailyMood/dailyMood-modal"
import {useDailyMoodModal} from "@/contexts/modal-commands-context"

export default function ModalManager() {
    const dailyMoodModal = useDailyMoodModal()

    return (
        <>
            <TaskModal/>
            <NoteModal/>
            <DailyMoodModal
                isOpen={dailyMoodModal.isOpen}
                onOpenChange={(open) => open ? dailyMoodModal.openModal() : dailyMoodModal.closeModal()}
                date={dailyMoodModal.date}
            >
                <div className="hidden"/>
            </DailyMoodModal>
        </>
    )
}
