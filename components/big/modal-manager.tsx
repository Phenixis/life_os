"use client"

import TaskModal from "@/components/big/tasks/task-modal"
import NoteModal from "@/components/big/notes/note-modal"
import DailyMoodModal from "@/components/big/daily-mood/daily-mood-modal"
import RelapseRecorderModal from "@/components/big/addiction-tracker/relapse-recorder-modal"
import AddictionCreatorModal from "@/components/big/addiction-tracker/addiction-creator-modal"
import EntryLoggerModal from "@/components/big/addiction-tracker/entry-logger-modal"
import { IngredientModal } from "@/components/big/meal-planner/ingredient/ingredient-modal"
import { MealModal } from "@/components/big/meal-planner/meal/meal-modal"

export default function ModalManager() {
    return (
        <>
            <TaskModal/>
            <NoteModal/>
            <DailyMoodModal/>
            <RelapseRecorderModal/>
            <AddictionCreatorModal/>
            <EntryLoggerModal/>
            <IngredientModal/>
            <MealModal/>
        </>
    )
}
