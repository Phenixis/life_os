import {cn} from "@/lib/utils";
import {simplifiedProject} from "@/components/big/tasks/tasks-card";

function isInList(list: simplifiedProject[], project: simplifiedProject) {
    return list.some(p => p.id === project.id);
}

export function ProjectsMultipleSelects(
    {
        projects,
        selectedProjects,
        removedProjects,
        onChange,
        loading = false,
    }: {
        projects: simplifiedProject[],
        selectedProjects: simplifiedProject[],
        removedProjects: simplifiedProject[],
        onChange: (projects: simplifiedProject) => void,
        loading: boolean,
    }
) {
    return (
        <div
            className="border rounded-md p-2 flex gap-2 w-full overflow-x-auto scrollbar-hide">
            {loading ? (
                <div
                    className="w-full text-sm text-center text-muted-foreground col-span-2">Loading
                    projects...</div>
            ) : projects?.length > 0 ? (
                projects.sort((a, b) => {
                    if (isInList(selectedProjects, a) && !isInList(selectedProjects, b)) return -1;
                    if (!isInList(selectedProjects, a) && isInList(selectedProjects, b)) return 1;
                    if (isInList(removedProjects, a) && !isInList(removedProjects, b)) return -1;
                    if (!isInList(removedProjects, a) && isInList(removedProjects, b)) return 1;
                    return a.title.localeCompare(b.title);
                }).map((project) => {
                        const isSelected = selectedProjects.filter(p => p.id === project.id).length > 0;
                        const isRemoved = removedProjects.filter(p => p.id === project.id).length > 0;

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
                        )
                    }
                )
            ) : (
                <div
                    className="w-full text-sm text-center text-muted-foreground col-span-2">
                    No projects found
                </div>
            )}
        </div>
    )
}