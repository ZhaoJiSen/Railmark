"use client"

import * as React from "react"
import { Button } from "./button"
import * as Slot from "@radix-ui/react-slot"
import { cn } from "../../lib/utils"
import { Separator } from "./separator"
import { useSidebar } from "./sidebar-provider"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 data-[orientation=horizontal]:w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70 transition-[margin,opacity] duration-200 ease-linear [&>svg]:size-3.5 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({ asChild = false, className, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  return <Button asChild={asChild} variant="ghost" size="icon-sm" data-slot="sidebar-group-action" data-sidebar="group-action"
    className={cn('absolute top-2 right-2 group-data-[collapsible=icon]:hidden', className)} {...props} />
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuButton({ asChild = false, isActive = false, variant, size, tooltip, className, ...props }:
  React.ComponentProps<"button"> & {
    asChild?: boolean, isActive?: boolean, variant?: string, size?: string,
    tooltip?: string | React.ComponentProps<typeof TooltipContent>,
  }) {
  const { isMobile, state } = useSidebar()
  const collapsed = state === 'collapsed'
  const button = <Button asChild={asChild} variant={isActive ? 'secondary' : 'ghost'}
    size={collapsed ? 'icon-sm' : 'sm'} data-slot="sidebar-menu-button" data-sidebar="menu-button" data-active={isActive}
    className={cn('w-full justify-start [&>svg]:size-4 [&>svg]:shrink-0 [&>span:last-child]:truncate',
      collapsed && 'justify-center [&>span]:hidden', className)} {...props} />
  if (!tooltip || !collapsed || isMobile) return button
  const content = typeof tooltip === 'string' ? { children: tooltip } : tooltip
  return <Tooltip><TooltipTrigger asChild>{button}</TooltipTrigger><TooltipContent side="right" {...content} /></Tooltip>
}


export {
  SidebarHeader, SidebarSeparator, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupAction, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
}
