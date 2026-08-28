import { useDroppable } from '@dnd-kit/core';

export function SidebarDropZone({ children }: Readonly<{ children: React.ReactNode }>) {
    const { setNodeRef } = useDroppable({
        id: 'sidebar',
        data: { type: 'sidebar' }
    });

    return (
        <section
            ref={setNodeRef}
            aria-label="Meals list"
            className="group/meals-sidebar w-full md:w-2/11 p-2 flex flex-col gap-2 border-r border-b md:border-b-0 overflow-x-hidden"
        >
            {children}
        </section>
    );
}
