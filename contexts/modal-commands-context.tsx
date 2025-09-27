"use client"

import React, { createContext, useContext, ReactNode, useState } from 'react'
import { Note, Habit } from '@/lib/db/schema'

// Define the context interface
interface ModalCommandsContextType {
    taskModal: {
        isOpen: boolean
        openModal: () => void
        closeModal: () => void
    }
    noteModal: {
        isOpen: boolean
        openModal: (note?: Note.Note.Select, password?: string) => void
        closeModal: () => void
        note?: Note.Note.Select
        password?: string
    }
    dailyMoodModal: {
        isOpen: boolean
        openModal: (date?: Date) => void
        closeModal: () => void
        date?: Date
    }
}

// Create the context
const ModalCommandsContext = createContext<ModalCommandsContextType | undefined>(undefined)

// Create the provider component
export function ModalCommandsProvider({ children }: { children: ReactNode }) {
    // Task modal state
    const [taskModalOpen, setTaskModalOpen] = useState(false)
    
    // Note modal state
    const [noteModalOpen, setNoteModalOpen] = useState(false)
    const [noteModalData, setNoteModalData] = useState<{ note?: Note.Note.Select; password?: string }>({})
    
    // Daily mood modal state
    const [dailyMoodModalOpen, setDailyMoodModalOpen] = useState(false)
    const [dailyMoodModalDate, setDailyMoodModalDate] = useState<Date>()

    const value: ModalCommandsContextType = {
        taskModal: {
            isOpen: taskModalOpen,
            openModal: () => setTaskModalOpen(true),
            closeModal: () => setTaskModalOpen(false),
        },
        noteModal: {
            isOpen: noteModalOpen,
            openModal: (note?: Note.Note.Select, password?: string) => {
                setNoteModalData({ note, password })
                setNoteModalOpen(true)
            },
            closeModal: () => {
                setNoteModalOpen(false)
                setNoteModalData({})
            },
            ...noteModalData,
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
