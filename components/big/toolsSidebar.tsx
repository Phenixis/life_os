"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { tools } from "@/lib/tools-data"

export function ToolsSidebar() {
  return (
    <Sidebar collapsible="icon" variant="floating" className="rounded-full">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((tool) => (
                <SidebarMenuItem key={tool.name}>
                  <SidebarMenuButton
                    className="flex items-center space-x-2 text-wrap"
                    asChild
                    tooltip={tool.description}
                  >
                    <Link href={tool.href}>
                      {tool.icon}
                      <span>{tool.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarTrigger className="w-full [&_svg]:size-4" />
      </SidebarFooter>
    </Sidebar>
  )
}
