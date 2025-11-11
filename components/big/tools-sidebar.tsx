'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { isToolCard, isToolsCategorie, tools } from '@/lib/tools-data';
import { usePathname } from 'next/navigation';

export function ToolsSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="floating" className="rounded-full">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools
                .sort((a, b) => Number(isToolCard(b)) - Number(isToolCard(a)))
                .map((tool, index) => {
                  if (isToolsCategorie(tool)) {
                    return (
                      <>
                        {tool.tools.map(toolItem => (
                          <SidebarMenuItem key={toolItem.name}>
                            <SidebarMenuButton
                              className={`flex items-center space-x-2 text-wrap ${
                                pathname === toolItem.href ? 'bg-gray-200/70 dark:bg-gray-800/70' : ''
                              }`}
                              asChild
                              tooltip={toolItem.name + ': ' + toolItem.description}
                            >
                              {tool.name === 'Coming soon' ? (
                                <p>
                                  {toolItem.icon}
                                  <span>{toolItem.name}</span>
                                </p>
                              ) : (
                                <Link href={toolItem.href}>
                                  {toolItem.icon}
                                  <span>{toolItem.name}</span>
                                </Link>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                        {index < tools.length - 1 ? <SidebarSeparator /> : null}
                      </>
                    );
                  }

                  return (
                    <>
                      <SidebarMenuItem key={tool.name}>
                        <SidebarMenuButton
                          className={`flex items-center space-x-2 text-wrap ${
                            pathname === tool.href ? 'bg-gray-200/70 dark:bg-gray-800/70' : ''
                          }`}
                          asChild
                          tooltip={tool.name + ': ' + tool.description}
                        >
                          <Link href={tool.href}>
                            {tool.icon}
                            <span>{tool.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {tool.name == 'All Tools' && index < tools.length - 1 ? <SidebarSeparator /> : null}
                    </>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
