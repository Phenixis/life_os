"use client"

import { ProjectsTasksAndNotesFilterBar } from "@/components/big/projects/projects-tasks-and-notes";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useProjects } from "@/hooks/use-projects";
import { useUser } from "@/hooks/use-user";
import { Project } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { Pen, Trash } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ProjectsPage() {
    const [selectedProject, setSelectedProject] = useState<Project.Select | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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
        if (selectedProject && selectedProject.id === project.id) {
            setSelectedProject(null);
        } else {
            setSelectedProject(project);
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

    return (
        <section className="page max-h-screen overflow-hidden flex flex-col">
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
                    ) : projects?.length > 0 ? (
                        projects
                            .sort((a, b) => {
                                if (a.id === -1) return -1;
                                if (b.id === -1) return 1;
                                return a.title.localeCompare(b.title);
                            })
                            .map((project) => (
                                <div
                                    key={`project-${project.id}`}
                                    className={cn(
                                        "text-sm cursor-pointer flex items-center px-2 py-1 rounded-md border shrink-0",
                                        selectedProject?.id === project.id && "border-border bg-primary/10"
                                    )}
                                    onClick={clickOnProject.bind(null, project)}
                                >
                                    {project.title}
                                </div>
                            ))
                    ) : (
                        <div className="w-full text-sm text-center text-muted-foreground">
                            No projects found
                        </div>
                    )}
                </div>
                <article className="p-4">
                    <header className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-medium">{selectedProject ? selectedProject.title : "Project"}'s Details</h2>
                            <p className="opacity-50">{selectedProject ? selectedProject.description !== null && selectedProject.description !== "" ? selectedProject.description : "No description provided." : "No project selected."}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                disabled={selectedProject === null || selectedProject.id === -1}
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    // TODO: Implement edit functionality
                                    toast.info("Edit functionality coming soon");
                                }}
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
                        </div>
                    </header>
                    {
                        isLoading ? (
                            <div>
                                Skeleton
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
        </section>
    )
}