import Tooltip from '@/components/big/tooltip';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskModal } from '@/contexts/modal-commands-context';
import { useDeleteTask, useToggleTask, useUpdateTask } from '@/hooks/queries/use-task-mutations';
import { useUser } from '@/hooks/use-user';
import type { Task } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { ChevronsDownUp, ChevronsUpDown, PenIcon, TrashIcon } from 'lucide-react';
import React from 'react';
import { startTransition, useOptimistic, useRef, useState } from 'react';

// Quick action type definition
/**
 * Represents a quick action in the task context menu
 * @property label - The display text for the menu item
 * @property action - The function to execute when the action is selected
 * @property shouldShow - Optional condition to determine if the action should be visible
 * @property separator - If true, adds a visual separator before this action
 */
type QuickAction = {
  label: string;
  action: (task: Task.Task.TaskWithRelations) => void;
  shouldShow?: (task: Task.Task.TaskWithRelations) => boolean;
  separator?: boolean;
};

export default function TaskDisplay({
  task,
  orderedBy,
  className,
  currentLimit,
  currentDueBefore,
  otherId
}: {
  task?: Task.Task.TaskWithRelations;
  orderedBy?: keyof Task.Task.Select;
  className?: string;
  currentLimit?: number;
  currentDueBefore?: Date;
  otherId?: number;
}) {
  const user = useUser().user;
  const taskModal = useTaskModal();

  // Mutation hooks
  const toggleTaskMutation = useToggleTask();
  const deleteTaskMutation = useDeleteTask();
  const updateTaskMutation = useUpdateTask();

  const [isToggled, setIsToggled] = useState(task ? task.completed_at !== null : false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [optimisticState, toggleOptimistic] = useOptimistic(isToggled, prev => !prev);
  const containerRef = useRef<HTMLDivElement>(null);
  const skeleton = task !== undefined;
  const daysBeforeDue = task
    ? Math.ceil(
      (new Date(task.due).getTime() - (task.completed_at ? new Date(task.completed_at).getTime() : Date.now())) /
      (1000 * 60 * 60 * 24)
    )
    : 4;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false);
  const [dependencyToDelete, setDependencyToDelete] = useState<number | null>(null);

  // Context menu action handlers
  const handleUpdateDueToday = () => {
    if (!task) return;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day
    updateTaskMutation.mutate({
      id: task.id,
      data: {
        title: task.title,
        importance: task.importance ?? 0,
        dueDate: today.toISOString(),
        duration: task.duration ?? 0,
        project: task.project_id 
          ? { id: task.project_id, title: task.project?.title ?? '' }
          : { id: -1, title: '' },
        state: task.state ?? 'to do'
      }
    });
  };

  const handleMarkComplete = () => {
    if (!task || task.completed_at) return;
    toggle();
  };

  const handleMarkIncomplete = () => {
    if (!task || !task.completed_at) return;
    toggle();
  };

  const handleEdit = () => {
    if (!task) return;
    setIsCollapsibleOpen(false);
    setIsHovering(false);
    taskModal.setTask(task);
    taskModal.openModal();
  };

  const handleDelete = () => {
    deleteTask();
  };

  // Quick actions list - easily maintainable
  const quickActions: QuickAction[] = [
    {
      label: 'Update due date to today',
      action: handleUpdateDueToday,
      shouldShow: (t) => !t.completed_at && daysBeforeDue < 0, // Only for late tasks
    },
    {
      label: 'Mark as completed',
      action: handleMarkComplete,
      shouldShow: (t) => !t.completed_at,
    },
    {
      label: 'Mark as incomplete',
      action: handleMarkIncomplete,
      shouldShow: (t) => !!t.completed_at,
    },
    {
      label: 'Edit',
      action: handleEdit,
      separator: true,
    },
    {
      label: 'Delete',
      action: handleDelete,
    },
  ];


  // Modify the toggle function to check for prerequisite tasks
  async function toggle() {
    if (!task) return;

    const newIsToggled = !isToggled;

    // Immediately update local state for instant UI feedback
    setIsToggled(newIsToggled);

    // Also update optimistic state for consistent UI
    startTransition(() => {
      toggleOptimistic(newIsToggled);
    });

    // Use mutation hook - handles optimistic updates, API call, and rollback
    toggleTaskMutation.mutate(
      { id: task.id, completed: newIsToggled },
      {
        onError: () => {
          // Revert local state if API fails
          setIsToggled(!newIsToggled);
          startTransition(() => {
            toggleOptimistic(!newIsToggled);
          });
        },
      }
    );
  }

  // Fonction améliorée pour supprimer une task avec React Query
  async function deleteTask(e?: React.MouseEvent) {
    if (e) e.stopPropagation(); // Empêche le clic de se propager

    if (!task) return;

    // If called without confirmation, show the dialog
    if (!isDeleteDialogOpen) {
      setIsDeleteDialogOpen(true);
      return;
    }

    // Close the dialog
    setIsDeleteDialogOpen(false);

    setIsDeleting(true);

    // Use mutation hook - handles optimistic updates, API call, and rollback
    deleteTaskMutation.mutate(task.id, {
      onSettled: () => {
        setIsDeleting(false);
      },
    });
  }

  async function deleteDependency(id: number) {
    if (!task) return;

    // If called without confirmation, show the dialog
    if (!isDependencyDialogOpen) {
      setDependencyToDelete(id);
      setIsDependencyDialogOpen(true);
      return;
    }

    // Close the dialog
    setIsDependencyDialogOpen(false);

    // Reset the dependency to delete
    const idToDelete = dependencyToDelete;
    setDependencyToDelete(null);

    if (idToDelete === null) return;

    setIsDeleting(true);
  }

  function handleMouseEnter() {
    if (window.innerWidth >= 1024) {
      setIsHovering(true);
    }
  }

  function handleMouseLeave() {
    if (window.innerWidth >= 1024) {
      setIsHovering(false);
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={containerRef}
          className={cn(
            `flex flex-col group/task p-1 duration-300 text-xs xl:text-sm rounded mb-1 ${daysBeforeDue < 0
              ? 'bg-red-500/10 dark:bg-red-500/15 lg:hover:bg-red-500/25'
              : daysBeforeDue <= 3
                ? 'bg-orange-500/10 dark:bg-orange-500/15 lg:hover:bg-orange-500/25'
                : 'lg:hover:bg-primary/10'
            } ${isDeleting ? 'opacity-50' : ''}`,
            className
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
    >
      {skeleton ? (
        <>
          <div className="flex items-center justify-between w-full text-xs md:text-sm">
            <div className="flex items-center w-full">
              <div
                className={cn(
                  'overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-center ',
                  isHovering
                    ? 'w-fit xl:w-full xl:max-w-[18px] xl:opacity-100 mx-1'
                    : 'w-fit xl:w-0 xl:max-w-0 xl:opacity-0'
                )}
              >
                {/* Only this div is clickable for toggling */}
                <div
                  className={`relative p-2 ml-1 lg:ml-0 mr-2 lg:mr-0 size-1 border bg-background border-neutral-400 dark:border-neutral-600 rounded cursor-pointer group/Clickable ${optimisticState ? 'bg-primary' : ''
                    }`}
                  onClick={() => toggle()}
                  role="checkbox"
                  aria-checked={optimisticState}
                  tabIndex={0}
                >
                  <div
                    className={`absolute inset-0 w-1/2 h-1/2 z-20 m-auto duration-300 rounded-xs ${optimisticState ? 'lg:group-hover/Clickable:bg-background' : 'lg:group-hover/Clickable:bg-primary'
                      }`}
                  />
                </div>
              </div>
              <p
                className={`w-full hyphens-auto text-xs md:text-sm ${optimisticState ? 'line-through text-muted-foreground' : ''
                  }`}
                lang="en"
              >
                {task.title}
              </p>
            </div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-center hover:bg-background rounded cursor-pointer',
                isHovering
                  ? 'w-fit xl:w-full xl:max-w-[24px] xl:opacity-100 ml-1'
                  : 'w-fit xl:w-0 xl:max-w-0 xl:opacity-0'
              )}
              onClick={() => setIsCollapsibleOpen(!isCollapsibleOpen)}
            >
              {
                isCollapsibleOpen ? (
                  <Tooltip tooltip="Collapse">
                    <ChevronsDownUp className="min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] text-black dark:text-white cursor-pointer" />
                  </Tooltip>
                ) : (
                  <Tooltip tooltip="Expand">
                    <ChevronsUpDown className="min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] text-black dark:text-white cursor-pointer" />
                  </Tooltip>
                )
              }
            </div>
          </div>
          <div className={`flex flex-col space-y-1 ${!isCollapsibleOpen && 'hidden'}`}>
            <div className={`flex space-x-4 justify-between`}>
              <div className="space-y-1">
                {task.project && task.project.title !== '' && (
                  <p className="text-muted-foreground">
                    Project: <span className="text-black dark:text-white">{task.project.title}</span>
                  </p>
                )}
                {task.importance !== null && (
                  <p className="text-muted-foreground">
                    Importance: <span className="text-black dark:text-white">{task.importanceDetails.name}</span>
                  </p>
                )}
                {task.due && (
                  <Tooltip tooltip={`${new Date(task.due).toLocaleDateString()}`} cursor="cursor-auto">
                    <p className="text-muted-foreground">
                      {task.completed_at ? (
                        <>
                          {/* Show completion date and difference between completion date and due date */}
                          Completed:{' '}
                          <span className="text-black dark:text-white">
                            {new Date(task.completed_at).toLocaleDateString()}
                            {(() => {
                              const due = new Date(task.due);
                              const completed = new Date(task.completed_at);
                              // Difference in days (positive = completed after due, negative = completed before due)
                              const diffDays = Math.floor(
                                (completed.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
                              );
                              if (diffDays === 0) return ' (on time)';
                              const abs = Math.abs(diffDays);
                              return ` (${abs} day${abs > 1 ? 's' : ''} ${diffDays < 0 ? 'early' : 'late'})`;
                            })()}
                          </span>
                        </>
                      ) : (
                        <>
                          {/* Show relative time until due when not completed */}
                          Due:{' '}
                          <span className="text-black dark:text-white">
                            {(() => {
                              const daysDifference = Math.ceil(
                                (new Date(task.due).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                              );
                              const formatter = new Intl.RelativeTimeFormat(navigator.language || 'fr-FR', {
                                numeric: 'auto'
                              });
                              return formatter.format(daysDifference, 'day');
                            })()}
                          </span>
                        </>
                      )}
                    </p>
                  </Tooltip>
                )}
                {task.duration !== undefined && (
                  <p className="text-muted-foreground">
                    Duration: <span className="text-black dark:text-white">{task.durationDetails.name}</span>
                  </p>
                )}
              </div>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-300 ease-in-out flex flex-col items-center justify-between',
                  isHovering
                    ? 'w-fit xl:w-full xl:max-w-[24px] xl:opacity-100 ml-1'
                    : 'w-fit xl:w-0 xl:max-w-0 xl:opacity-0'
                )}
              >
                <div
                  className="duration-300 hover:bg-background rounded size-6 px-1 cursor-pointer"
                  onClick={() => {
                    setIsCollapsibleOpen(false);
                    setIsHovering(false);
                    taskModal.setTask(task);
                    taskModal.openModal();
                  }}
                >
                  <Tooltip tooltip="Edit task">
                    <PenIcon className="w-4 h-6 cursor-pointer" />
                  </Tooltip>
                </div>

                <div
                  className="duration-300 hover:bg-destructive/75 text-destructive lg:hover:text-foreground/80 rounded size-6 px-1 cursor-pointer"
                  onClick={deleteTask}
                >
                  <Tooltip tooltip="Delete task">
                    <TrashIcon className="min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] cursor-pointer" />
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex space-x-2 items-center w-full">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-full h-4" />
        </div>
      )}
      {/* Delete Task Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" maxHeight="max-h-64">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task?
              <br />
              <br />
              You will be able to find it back in your Trash (Settings &gt; Trash &gt; Tasks).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteTask()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dependency Confirmation Dialog */}
      <Dialog open={isDependencyDialogOpen} onOpenChange={setIsDependencyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Dependency</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this dependency?
              <br />
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsDependencyDialogOpen(false);
                setDependencyToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteDependency(dependencyToDelete || -1)}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {!skeleton && task && quickActions.map((action, index) => {
          const shouldShow = action.shouldShow ? action.shouldShow(task) : true;
          if (!shouldShow) return null;
          
          return (
            <React.Fragment key={index}>
              {action.separator && <ContextMenuSeparator />}
              <ContextMenuItem onClick={() => action.action(task)}>
                {action.label}
              </ContextMenuItem>
            </React.Fragment>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}
