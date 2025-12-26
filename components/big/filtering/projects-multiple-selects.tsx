import { cn } from "@/lib/utils";
import { simplifiedProject } from "@/components/big/tasks/tasks-card";
import { useRef } from "react";

function isInList(list: simplifiedProject[], project: simplifiedProject) {
    return list.some(p => p.id === project.id);
}

export function ProjectsMultipleSelects({
    projects,
    selectedProjects,
    removedProjects,
    onChange,
    loading = false,
}: {
    projects: simplifiedProject[];
    selectedProjects: simplifiedProject[];
    removedProjects: simplifiedProject[];
    onChange: (projects: simplifiedProject) => void;
    loading: boolean;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

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

    return (
        <div
            ref={containerRef}
            onWheel={handleWheel}
            className="border rounded-md p-2 flex gap-2 w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
            style={{ scrollBehavior: "smooth" }}
        >
            {loading ? (
                <div className="w-full text-sm text-center text-muted-foreground">
                    Loading projects...
                </div>
            ) : projects?.length > 0 ? (
                projects
                    .sort((a, b) => {
                        if (isInList(selectedProjects, a) && !isInList(selectedProjects, b)) return -1;
                        if (!isInList(selectedProjects, a) && isInList(selectedProjects, b)) return 1;
                        if (isInList(removedProjects, a) && !isInList(removedProjects, b)) return -1;
                        if (!isInList(removedProjects, a) && isInList(removedProjects, b)) return 1;
                        return a.title.localeCompare(b.title);
                    })
                    .map((project) => {
                        const isSelected = selectedProjects.some(p => p.id === project.id);
                        const isRemoved = removedProjects.some(p => p.id === project.id);

                        return (
                            <div
                                key={`project-${project.id}`}
                                className={cn(
                                    "text-sm cursor-pointer flex items-center px-2 py-1 rounded-md border border-transparent flex-shrink-0",
                                    (isSelected || isRemoved) && "border-border bg-primary/10",
                                    isRemoved && "line-through text-muted-foreground"
                                )}
                                onClick={() => onChange(project)}
                            >
                                {project.title}
                            </div>
                        );
                    })
            ) : (
                <div className="w-full text-sm text-center text-muted-foreground">
                    No projects found
                </div>
            )}
        </div>
    );
}
