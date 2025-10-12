"use client"

import React, {createContext, ReactNode, useContext, useState} from 'react'
import {Note, Task} from '@/lib/db/schema'

// Define the context interface
interface ModalCommandsContextType {
    taskModal: {
        isOpen: boolean
        openModal: () => void
        closeModal: () => void
        task?: Task.Task.TaskWithRelations
        setTask: (task?: Task.Task.TaskWithRelations) => void
    }
    noteModal: {
        isOpen: boolean
        openModal: () => void
        closeModal: () => void
        setNote: (noteModalData: { note?: Note.Note.Select | null, password?: string | null }) => void,
        note?: Note.Note.Select | null,
        password?: string | null
    }

    dailyMoodModal: {
        isOpen: boolean
        openModal: (date?: Date) => void
        closeModal
            :
            () => void
        date?: Date
    }
}

// Create the context
const ModalCommandsContext = createContext<ModalCommandsContextType | undefined>(undefined)

// Create the provider component
export function ModalCommandsProvider({children}: { children: ReactNode }) {
    // Task modal state
    const [taskModalOpen, setTaskModalOpen] = useState(false)
    const [taskModalData, setTaskModalData] = useState<Task.Task.TaskWithRelations | undefined>(undefined)

    // Note modal state
    const [noteModalOpen, setNoteModalOpen] = useState(false)
    const [noteModalData, setNoteModalData] = useState<{ note?: Note.Note.Select | null; password?: string | null }>({})

    // Daily mood modal state
    const [dailyMoodModalOpen, setDailyMoodModalOpen] = useState(false)
    const [dailyMoodModalDate, setDailyMoodModalDate] = useState<Date>()

    const value: ModalCommandsContextType = {
        taskModal: {
            isOpen: taskModalOpen,
            openModal: () => {
                setTaskModalOpen(true)
            },
            closeModal: () => {
                setTaskModalOpen(false)
                setTaskModalData(undefined)
            },
            task: taskModalData,
            setTask: setTaskModalData
        },
        noteModal: {
            isOpen: noteModalOpen,
            openModal: () => {
                setNoteModalOpen(true)
            },
            closeModal: () => {
                setNoteModalData({
                    note: null,
                    password: null,
                })
                setNoteModalOpen(false)
            },
            setNote: setNoteModalData,
            note: noteModalData.note,
            password: noteModalData.password,
        },
        dailyMoodModal: {
            isOpen: dailyMoodModalOpen,
            openModal: (date?: Date) => {
                setDailyMoodModalDate(date)
                setDailyMoodModalOpen(true)
            },
            closeModal: () => {
                setDailyMoodModalOpen(false)
                setDailyMoodModalDate(undefined)
            },
            date: dailyMoodModalDate,
        },
    }

    return (
        <ModalCommandsContext.Provider value={value}>
            {children}
        </ModalCommandsContext.Provider>
    )
}

// Custom hooks to use the modal context
export const useTaskModal = () => {
    const context = useContext(ModalCommandsContext)
    if (!context) {
        throw new Error('useTaskModal must be used within a ModalCommandsProvider')
    }
    return context.taskModal
}

export const useNoteModal = () => {
    const context = useContext(ModalCommandsContext)
    if (!context) {
        throw new Error('useNoteModal must be used within a ModalCommandsProvider')
    }
    return context.noteModal
}

export const useDailyMoodModal = () => {
    const context = useContext(ModalCommandsContext)
    if (!context) {
        throw new Error('useDailyMoodModal must be used within a ModalCommandsProvider')
    }
    return context.dailyMoodModal
}
