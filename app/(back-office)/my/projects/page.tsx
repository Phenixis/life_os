"use client"

import { ProjectsTasksAndNotesFilterBar } from "@/components/big/projects/projects-tasks-and-notes";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useProjects } from "@/hooks/use-projects";
import { useUser } from "@/hooks/use-user";
import { Project } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { Pen, Trash, Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Help from "@/components/big/help";

export default function ProjectsPage() {
    const [selectedProject, setSelectedProject] = useState<Project.Select | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedDescription, setEditedDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState("");
    const [newProjectDescription, setNewProjectDescription] = useState("");
    const [isSubmittingNew, setIsSubmittingNew] = useState(false);
    const [showMergeDialog, setShowMergeDialog] = useState(false);
    const [conflictingProject, setConflictingProject] = useState<Project.Select | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { projects, isLoading, mutate } = useProjects();
    const { user } = useUser();

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const handleWheelNative = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // Convert vertical scrolling to horizontal
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                element.scrollBy({
                    left: e.deltaY,
                    behavior: "smooth",
                });
            } else {
                element.scrollBy({
                    left: e.deltaX,
                    behavior: "smooth",
                });
            }
        };

        element.addEventListener('wheel', handleWheelNative, { passive: false });
        return () => element.removeEventListener('wheel', handleWheelNative);
    }, []);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        // Prevent default scrolling behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();

        // Convert vertical scrolling to horizontal
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            containerRef.current.scrollBy({
                left: e.deltaY,
                behavior: "smooth",
            });
        } else {
            // Handle horizontal scrolling normally
            containerRef.current.scrollBy({
                left: e.deltaX,
                behavior: "smooth",
            });
        }
    };

    const clickOnProject = useCallback((project: Project.Select) => {
        // Check if it's the special "create new" project
        if (project.id === -2) {
            setIsCreatingProject(true);
            setSelectedProject(null);
            setIsEditingProject(false);
            return;
        }

        if (selectedProject && selectedProject.id === project.id) {
            setSelectedProject(null);
        } else {
            setSelectedProject(project);
            setIsCreatingProject(false);
        }
    }, [selectedProject]);

    const handleDeleteProject = async () => {
        if (!selectedProject || !user) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/project?id=${selectedProject.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${user.api_key}`,
                },
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error("Failed to delete project: " + errorBody.error);
            }

            toast.success("Project deleted successfully");
            setSelectedProject(null);
            await mutate();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : String(error));
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleStartEdit = () => {
        if (!selectedProject) return;
        setEditedTitle(selectedProject.title);
        setEditedDescription(selectedProject.description || "");
        setIsEditingProject(true);
    };

    const handleCancelEdit = () => {
        setIsEditingProject(false);
        setEditedTitle("");
        setEditedDescription("");
    };

    const handleSaveEdit = async () => {
        if (!selectedProject || !user || !editedTitle.trim()) {
            toast.error("Project title cannot be empty");
            return;
        }

        // Check if the new title matches an existing project
        const existingProject = projects?.find(
            p => p.title.toLowerCase() === editedTitle.trim().toLowerCase() && p.id !== selectedProject.id
        );

        if (existingProject) {
            // Show merge confirmation dialog
            setConflictingProject(existingProject);
            setShowMergeDialog(true);
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/project", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.api_key}`,
                },
                body: JSON.stringify({
                    id: selectedProject.id,
                    title: editedTitle.trim(),
                    description: editedDescription.trim(),
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error("Failed to update project: " + errorBody.error);
            }

            toast.success("Project updated successfully");

            // Update the selected project locally
            setSelectedProject({
                ...selectedProject,
                title: editedTitle.trim(),
                description: editedDescription.trim(),
            });

            setIsEditingProject(false);
            await mutate();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : String(error));
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            handleCancelEdit();
        } else if (e.key === "Enter" && e.ctrlKey) {
            handleSaveEdit();
        }
    };

    const handleCreateProject = async () => {
        if (!user || !newProjectTitle.trim()) {
            toast.error("Project title cannot be empty");
            return;
        }

        setIsSubmittingNew(true);
        try {
            const response = await fetch("/api/project", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.api_key}`,
                },
                body: JSON.stringify({
                    title: newProjectTitle.trim(),
                    description: newProjectDescription.trim(),
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error("Failed to create project: " + errorBody.error);
            }

            const result = await response.json();
            toast.success("Project created successfully");

            // Reset form
            setNewProjectTitle("");
            setNewProjectDescription("");
            setIsCreatingProject(false);

            // Refresh the project list
            await mutate();

            // Optionally select the newly created project
            const projects = await mutate();
            const newProject = projects?.find((p: Project.Select) => p.id === result.id);
            if (newProject) {
                setSelectedProject(newProject);
            }
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : String(error));
        } finally {
            setIsSubmittingNew(false);
        }
    };

    const handleCancelCreate = () => {
        setIsCreatingProject(false);
        setNewProjectTitle("");
        setNewProjectDescription("");
    };

    const handleCreateKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            handleCancelCreate();
        } else if (e.key === "Enter" && e.ctrlKey) {
            handleCreateProject();
        }
    };

    return (
        <section className="page max-h-screen overflow-hidden flex flex-col pb-20! lg:pb-8!">
            <header className="flex items-center gap-6 shrink-0">
                <h1 className="page-title">My Projects</h1>
                <p className="page-description text-gray-500">Manage your projects.</p>
            </header>
            <div className="border rounded-md flex-1 min-h-0 overflow-auto scrollbar-hide">
                <div
                    ref={containerRef}
                    onWheel={handleWheel}
                    className="py-4 px-2 flex gap-2 w-full overflow-x-auto overflow-y-hidden scrollbar-hide sticky top-0 bg-background border-b z-10"
                    style={{ scrollBehavior: "smooth" }}
                >
                    {isLoading ? (
                        <div className="w-full text-sm text-center text-muted-foreground">
                            Loading projects...
                        </div>
                    ) : (
                        <>
                            {(() => {
                                // Helper to render a project item (DRY)
                                const renderProjectItem = (project: Project.Select) => (
                                    <div
                                        key={`project-${project.id}`}
                                        className={cn(
                                            "text-sm cursor-pointer flex items-center px-2 py-1 rounded-md border shrink-0",
                                            project.id === -2 && "gap-1 font-medium",
                                            (selectedProject?.id === project.id || (isCreatingProject && project.id === -2)) && "border-border bg-primary/10"
                                        )}
                                        onClick={clickOnProject.bind(null, project)}
                                    >
                                        {project.id === -2 ? (
                                            <>
                                                <span className="text-lg">+</span>
                                                <span className="sr-only">New Project</span>
                                            </>
                                        ) : (
                                            project.title
                                        )}
                                    </div>
                                );

                                // Prepare all projects with "Create New" button
                                const allProjects = [
                                    { id: -2, title: "+", description: null, completed: false, created_at: new Date(), updated_at: new Date(), deleted_at: null, user_id: "" } as Project.Select,
                                    ...(projects || [])
                                ];

                                // Separate special items (negative IDs) from regular projects (positive IDs)
                                const specialItems = allProjects.filter(p => p.id < 0).sort((a, b) => a.id - b.id); // -2 comes before -1
                                const regularProjects = allProjects.filter(p => p.id > 0).sort((a, b) => a.title.localeCompare(b.title));

                                return (
                                    <>
                                        {/* Special items (Create New, No Project, etc.) */}
                                        {specialItems.map(renderProjectItem)}

                                        {/* Separator */}
                                        {regularProjects.length > 0 && (
                                            <div className="h-8 w-px bg-border shrink-0" />
                                        )}

                                        {/* Regular projects */}
                                        {regularProjects.length > 0 ? (
                                            regularProjects.map(renderProjectItem)
                                        ) : (
                                            <div className="text-sm text-center text-muted-foreground pl-2">
                                                No projects found
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </>
                    )}
                </div>
                <article className="p-4">
                    <header className="flex justify-between items-start gap-4">
                        {isCreatingProject ? (
                            <div className="flex-1 space-y-3 pb-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Title *
                                    </label>
                                    <Input
                                        value={newProjectTitle}
                                        onChange={(e) => setNewProjectTitle(e.target.value)}
                                        onKeyDown={handleCreateKeyDown}
                                        placeholder="Project title"
                                        className="text-sm lg:text-base font-medium"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Description
                                    </label>
                                    <Textarea
                                        value={newProjectDescription}
                                        onChange={(e) => setNewProjectDescription(e.target.value)}
                                        onKeyDown={handleCreateKeyDown}
                                        placeholder="Project description (optional)"
                                        rows={2}
                                        className="text-sm lg:text-base resize-none"
                                    />
                                </div>
                            </div>
                        ) : isEditingProject ? (
                            <div className="flex-1 space-y-3 pb-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Title
                                        <Help className="ml-1" size="sm">
                                            <span className="font-medium">Pro tip: </span>
                                            <span>
                                                Enter the title of another project to merge them together
                                            </span>
                                        </Help>
                                    </label>
                                    <Input
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Project title"
                                        className="text-sm lg:text-base font-medium"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Description
                                    </label>
                                    <Textarea
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Project description (optional)"
                                        rows={2}
                                        className="text-sm lg:text-base resize-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 flex-1">
                                <h2 className="text-lg font-medium">
                                    {
                                        selectedProject ?
                                            selectedProject.title :
                                            "Project"
                                    }'s Details
                                </h2>
                                <p className="opacity-50">
                                    {
                                        selectedProject ?
                                            selectedProject.description !== null && selectedProject.description !== "" ?
                                                selectedProject.description
                                                : "No description provided."
                                            : "No project selected."
                                    }
                                </p>
                            </div>
                        )}
                        <div className={`flex ${(isEditingProject || isCreatingProject) ? "flex-col justify-center self-stretch" : "flex-col lg:flex-row"} items-center gap-2 shrink-0`}>
                            {isCreatingProject ? (
                                <>
                                    <Button
                                        variant="default"
                                        size="icon"
                                        onClick={handleCreateProject}
                                        loading={isSubmittingNew}
                                        disabled={isSubmittingNew || !newProjectTitle.trim()}
                                        tooltip="Pro tip: Press Ctrl+Enter to submit"
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCancelCreate}
                                        disabled={isSubmittingNew}
                                        tooltip="Pro tip: Press Esc to cancel"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : isEditingProject ? (
                                <>
                                    <Button
                                        variant="default"
                                        size="icon"
                                        onClick={handleSaveEdit}
                                        loading={isSaving}
                                        disabled={isSaving || !editedTitle.trim()}
                                        tooltip="Pro tip: Press Ctrl+Enter to submit"
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                        tooltip="Pro tip: Press Esc to cancel"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        disabled={selectedProject === null || selectedProject.id === -1}
                                        variant="outline"
                                        size="icon"
                                        onClick={handleStartEdit}
                                    >
                                        <Pen className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        disabled={selectedProject === null || selectedProject.id === -1}
                                        variant="destructive"
                                        size="icon"
                                        loading={isDeleting}
                                        onClick={() => setShowDeleteDialog(true)}
                                    >
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </header>
                    {
                        isLoading ? (
                            <div>
                                Skeleton
                            </div>
                        ) : isCreatingProject ? (
                            <div className="text-sm text-muted-foreground pt-4">
                                Fill in the form above to create a new project. Press Ctrl+Enter to submit or Esc to cancel.
                            </div>
                        ) : selectedProject === null ? (
                            <div>
                                No project selected
                            </div>
                        ) : (
                            <ProjectsTasksAndNotesFilterBar project={selectedProject} />
                        )
                    }
                </article>
            </div>

            <ConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Project"
                description={
                    selectedProject
                        ? `Are you sure you want to delete "${selectedProject.title}"? This action cannot be undone.\n\nAll tasks and notes associated with this project will remain but will no longer be linked to a project.`
                        : "Are you sure you want to delete this project?"
                }
                confirmText="Delete Project"
                cancelText="Cancel"
                onConfirm={handleDeleteProject}
                variant="destructive"
            />

            <ConfirmationDialog
                open={showMergeDialog}
                onOpenChange={setShowMergeDialog}
                title="Merge Projects"
                description={
                    conflictingProject && selectedProject
                        ? `A project named "${conflictingProject.title}" already exists.\n\nDo you want to merge "${selectedProject.title}" into "${conflictingProject.title}"?\n\nAll tasks and notes from "${selectedProject.title}" will be transferred to "${conflictingProject.title}", and "${selectedProject.title}" will be deleted.`
                        : "Do you want to merge these projects?"
                }
                confirmText="Merge Projects"
                cancelText="Cancel"
                onConfirm={async () => {
                    if (!selectedProject || !conflictingProject || !user) return;

                    setIsSaving(true);
                    try {
                        const response = await fetch("/api/project", {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${user.api_key}`,
                            },
                            body: JSON.stringify({
                                id: selectedProject.id,
                                merge: true,
                                targetProjectId: conflictingProject.id,
                            }),
                        });

                        if (!response.ok) {
                            const errorBody = await response.json();
                            throw new Error("Failed to merge projects: " + errorBody.error);
                        }

                        toast.success(`Projects merged successfully into "${conflictingProject.title}"`);

                        // Select the target project and reset states
                        setSelectedProject(conflictingProject);
                        setIsEditingProject(false);
                        setShowMergeDialog(false);
                        await mutate();
                    } catch (error) {
                        console.error(error);
                        toast.error(error instanceof Error ? error.message : String(error));
                    } finally {
                        setIsSaving(false);
                    }
                }}
                variant="default"
            />
        </section>
    )
}