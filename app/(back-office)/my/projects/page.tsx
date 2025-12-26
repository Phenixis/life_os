"use client"

import { ProjectsTasksAndNotesFilterBar } from "@/components/big/projects/projects-tasks-and-notes";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/use-projects";
import { Project } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { Pen, Trash } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export default function ProjectsPage() {
    const [selectedProject, setSelectedProject] = useState<Project.Select | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { projects, isLoading } = useProjects();

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        // Only hijack vertical scrolling
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            containerRef.current.scrollBy({
                left: e.deltaY,
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

    return (
        <section className="page max-h-screen overflow-hidden flex flex-col">
            <header className="flex items-center gap-6 shrink-0">
                <h1 className="page-title">My Projects</h1>
                <p className="page-description text-gray-500">Manage your projects.</p>
            </header>
            <div className="py-4 border rounded-md flex-1 min-h-0 overflow-auto scrollbar-hide">
                <div
                    ref={containerRef}
                    onWheel={handleWheel}
                    className="px-2 flex gap-2 w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
                    style={{ scrollBehavior: "smooth" }}
                >
                    {isLoading ? (
                        <div className="w-full text-sm text-center text-muted-foreground">
                            Loading projects...
                        </div>
                    ) : projects?.length > 0 ? (
                        projects
                            .sort((a, b) => {
                                if (a.id === selectedProject?.id) return -1;
                                if (b.id === selectedProject?.id) return 1;
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
                <div className="border-b w-full my-4" />
                <article className="px-4">
                    <header className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-medium">{selectedProject ? selectedProject.title : "Project"}'s Details</h2>
                            <p className="opacity-50">{selectedProject ? selectedProject.description !== null && selectedProject.description !== "" ? selectedProject.description : "No description provided." : "No project selected."}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                disabled={selectedProject === null}
                                variant="outline"
                                size="icon"
                            >
                                <Pen className="w-4 h-4" />
                            </Button>
                            <Button
                                disabled={selectedProject === null}
                                variant="destructive"
                                size="icon"
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
        </section>
    )
}