import {cn} from "@/lib/utils";


export function ProjectsMultipleSelects(
    {
        projects,
        selectedProjects,
        removedProjects,
        onChange,
        loading = false,
    }: {
        projects: string[],
        selectedProjects: string[],
        removedProjects: string[],
        onChange: (projects: string) => void,
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
                    if (selectedProjects.includes(a) && !selectedProjects.includes(b)) return -1;
                    if (!selectedProjects.includes(a) && selectedProjects.includes(b)) return 1;
                    if (removedProjects.includes(a) && !removedProjects.includes(b)) return -1;
                    if (!removedProjects.includes(a) && removedProjects.includes(b)) return 1;
                    return a.localeCompare(b);
                }).map((project) =>
                    <div key={"task_" + project}
                         className="flex items-center space-x-2 flex-shrink-0">
                        <input
                            type="checkbox"
                            className="hidden"
                            id={`task_project-${project}`}
                            // Show checked only when project is selected
                            checked={selectedProjects.includes(project)}
                            onChange={() => onChange(project)}
                        />
                        <label
                            htmlFor={`task_project-${project}`}
                            className={cn(
                                "text-sm cursor-pointer flex items-center px-2 py-1 rounded-md border border-transparent",
                                (selectedProjects.includes(project) || removedProjects.includes(project)) && "border-border bg-primary/10",
                                removedProjects.includes(project) && "line-through text-muted-foreground"
                            )}
                        >
                            {project}
                        </label>
                    </div>
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