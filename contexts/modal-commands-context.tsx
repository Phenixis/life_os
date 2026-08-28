'use client';

import { NoteWithProject } from '@/lib/db/queries/note';
import { MealPlanner, Task } from '@/lib/db/schema';
import { createContext, ReactNode, useContext, useState } from 'react';

// Define the context interface
interface ModalCommandsContextType {
  taskModal: {
    isOpen: boolean;
    openModal: (dueDate?: Date) => void;
    closeModal: () => void;
    task?: Task.Task.TaskWithRelations;
    setTask: (task?: Task.Task.TaskWithRelations) => void;
    dueDate?: Date;
  };
  noteModal: {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
    setNote: (noteModalData: { note?: NoteWithProject | null; password?: string | null }) => void;
    note?: NoteWithProject | null;
    password?: string | null;
  };

  dailyMoodModal: {
    isOpen: boolean;
    openModal: (date?: Date) => void;
    closeModal: () => void;
    date?: Date;
  };

  relapseRecorderModal: {
    isOpen: boolean;
    openModal: (date?: Date) => void;
    closeModal: () => void;
    date?: Date;
  };

  addictionCreatorModal: {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
  };

  entryLoggerModal: {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
  };

  ingredientModal: {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
    ingredient?: MealPlanner.Ingredient.Select | null;
    setIngredient: (ingredient?: MealPlanner.Ingredient.Select | null) => void;
  };

  mealModal: {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
    meal?: MealPlanner.Meal.Select | null;
    setMeal: (meal?: MealPlanner.Meal.Select | null) => void;
  };

  someModalOpen: () => boolean;
}

// Create the context
const ModalCommandsContext = createContext<ModalCommandsContextType | undefined>(undefined);

// Create the provider component
export function ModalCommandsProvider({ children }: { children: ReactNode }) {
  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalData, setTaskModalData] = useState<Task.Task.TaskWithRelations | undefined>(undefined);
  const [taskModalDueDate, setTaskModalDueDate] = useState<Date>();

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteModalData, setNoteModalData] = useState<{ note?: NoteWithProject | null; password?: string | null }>({});

  // Daily mood modal state
  const [dailyMoodModalOpen, setDailyMoodModalOpen] = useState(false);
  const [dailyMoodModalDate, setDailyMoodModalDate] = useState<Date>();

  // Relapse recorder modal state
  const [relapseRecorderModalOpen, setRelapseRecorderModalOpen] = useState(false);
  const [relapseRecorderModalDate, setRelapseRecorderModalDate] = useState<Date>();

  // Addiction creator modal state
  const [addictionCreatorModalOpen, setAddictionCreatorModalOpen] = useState(false);

  // Entry logger modal state
  const [entryLoggerModalOpen, setEntryLoggerModalOpen] = useState(false);

  // Ingredient modal state
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [ingredientModalData, setIngredientModalData] = useState<MealPlanner.Ingredient.Select | null | undefined>(undefined);

  // Meal modal state
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [mealModalData, setMealModalData] = useState<MealPlanner.Meal.Select | null | undefined>(undefined);

  const modalsOpenState = [taskModalOpen, noteModalOpen, dailyMoodModalOpen, relapseRecorderModalOpen, addictionCreatorModalOpen, entryLoggerModalOpen, ingredientModalOpen, mealModalOpen];
  const someModalOpen = () => modalsOpenState.some(modalState => modalState === true);

  const value: ModalCommandsContextType = {
    taskModal: {
      isOpen: taskModalOpen,
      openModal: (dueDate?: Date) => {
        if (!someModalOpen()) {
          setTaskModalDueDate(dueDate);
          setTaskModalOpen(true);
        }
      },
      closeModal: () => {
        setTaskModalOpen(false);
        setTaskModalData(undefined);
        setTaskModalDueDate(undefined);
      },
      task: taskModalData,
      setTask: setTaskModalData,
      dueDate: taskModalDueDate
    },
    noteModal: {
      isOpen: noteModalOpen,
      openModal: () => {
        if (!someModalOpen()) {
          setNoteModalOpen(true);
        }
      },
      closeModal: () => {
        setNoteModalData({
          note: null,
          password: null
        });
        setNoteModalOpen(false);
      },
      setNote: setNoteModalData,
      note: noteModalData.note,
      password: noteModalData.password
    },
    dailyMoodModal: {
      isOpen: dailyMoodModalOpen,
      openModal: (date?: Date) => {
        if (!someModalOpen()) {
          setDailyMoodModalDate(date);
          setDailyMoodModalOpen(true);
        }
      },
      closeModal: () => {
        setDailyMoodModalOpen(false);
        setDailyMoodModalDate(undefined);
      },
      date: dailyMoodModalDate
    },
    relapseRecorderModal: {
      isOpen: relapseRecorderModalOpen,
      openModal: (date?: Date) => {
        if (!someModalOpen()) {
          setRelapseRecorderModalDate(date);
          setRelapseRecorderModalOpen(true);
        }
      },
      closeModal: () => {
        setRelapseRecorderModalOpen(false);
      },
      date: relapseRecorderModalDate
    },
    addictionCreatorModal: {
      isOpen: addictionCreatorModalOpen,
      openModal: () => {
        if (!someModalOpen()) {
          setAddictionCreatorModalOpen(true);
        }
      },
      closeModal: () => {
        setAddictionCreatorModalOpen(false);
      }
    },
    entryLoggerModal: {
      isOpen: entryLoggerModalOpen,
      openModal: () => {
        if (!someModalOpen()) {
          setEntryLoggerModalOpen(true);
        }
      },
      closeModal: () => {
        setEntryLoggerModalOpen(false);
      }
    },
    ingredientModal: {
      isOpen: ingredientModalOpen,
      openModal: () => {
        if (!someModalOpen()) {
          setIngredientModalOpen(true);
        }
      },
      closeModal: () => {
        setIngredientModalOpen(false);
        setIngredientModalData(undefined);
      },
      ingredient: ingredientModalData,
      setIngredient: setIngredientModalData
    },
    mealModal: {
      isOpen: mealModalOpen,
      openModal: () => {
        if (!someModalOpen()) {
          setMealModalOpen(true);
        }
      },
      closeModal: () => {
        setMealModalOpen(false);
        setMealModalData(undefined);
      },
      meal: mealModalData,
      setMeal: setMealModalData
    },
    someModalOpen: someModalOpen
  };

  return <ModalCommandsContext.Provider value={value}>{children}</ModalCommandsContext.Provider>;
}

// Custom hooks to use the modal context
export const useTaskModal = () => {
  const context = useContext(ModalCommandsContext);
  if (!context) {
    throw new Error('useTaskModal must be used within a ModalCommandsProvider');
  }
  return context.taskModal;
};

export const useNoteModal = () => {
  const context = useContext(ModalCommandsContext);
  if (!context) {
    throw new Error('useNoteModal must be used within a ModalCommandsProvider');
  }
  return context.noteModal;
};

export const useDailyMoodModal = () => {
  const context = useContext(ModalCommandsContext);
  if (!context) {
    throw new Error('useDailyMoodModal must be used within a ModalCommandsProvider');
  }
  return context.dailyMoodModal;
};

export const useRelapseRecorderModal = () => {
  const context = useContext(ModalCommandsContext);
  if (!context) {
    throw new Error('useRelapseRecorderModal must be used within a ModalCommandsProvider');
  }
  return context.relapseRecorderModal;
};

export const useAddictionCreatorModal = () => {
  const context = useContext(ModalCommandsContext);
  if (!context) {
    throw new Error('useAddictionCreatorModal must be used within a ModalCommandsProvider');
  }
  return context.addictionCreatorModal;
};

export const useEntryLoggerModal = () => {
  const context = useContext(ModalCommandsContext);
  if (!context) {
    throw new Error('useEntryLoggerModal must be used within a ModalCommandsProvider');
  }
  return context.entryLoggerModal;
};

export const useIngredientModal = () => {
  const context = useContext(ModalCommandsContext);
  if (!context) {
    throw new Error('useIngredientModal must be used within a ModalCommandsProvider');
  }
  return context.ingredientModal;
};

export const useMealModal = () => {
  const context = useContext(ModalCommandsContext);
  if (!context) {
    throw new Error('useMealModal must be used within a ModalCommandsProvider');
  }
  return context.mealModal;
};

export const useModalsState = () => {
  const context = useContext(ModalCommandsContext);
    if (!context) {
        throw new Error('useModalsState must be used within a ModalCommandsProvider');
    }
    return {
        someModalOpen: context.someModalOpen,
    };
}