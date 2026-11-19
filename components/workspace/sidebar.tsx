'use client'

import { useRef, useState } from 'react'
import { FolderGit2, LayoutDashboard, Plus } from 'lucide-react'
import type { Version } from '../../lib/mygo'
import type { View } from '../../lib/types'
import { Sidebar as UISidebar } from '../ui/sidebar'
import {
  SidebarContent, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator,
} from '../ui/sidebar-items'
import { useSidebar } from '../ui/sidebar-provider'

import { DeleteVersionDialog } from './delete-version-dialog'
import { SidebarVersionItem } from './sidebar-version-item'
import styles from './workspace.module.scss'

interface SidebarProps {
  versions: Version[]
  versionId: number
  view?: View
  onDashboard: () => void
  onVersion: (id: number) => void
  onNewVersion: () => void
  onEditVersion: (id: number) => void
  onProjects: () => void
}

export function Sidebar({ versions, versionId, view, onDashboard, onVersion, onNewVersion, onEditVersion, onProjects }: SidebarProps) {
  const { isMobile, setOpenMobile, state: sidebarState } = useSidebar()
  const dashboard = useRef<HTMLButtonElement>(null)
  const [deletion, setDeletion] = useState<{ version: Version, trigger: HTMLButtonElement | null }>()
  const versionView = view === 'version' || view === 'requirement'
  const workspaceActive = view === 'dashboard' || (versionView && !isMobile && sidebarState === 'collapsed')
  const projectsActive = view === 'projects' || view === 'project'

  function openVersion(id: number): void {
    setOpenMobile(false)
    onVersion(id)
  }

  return (
    <>
      <UISidebar collapsible="icon" aria-label="工作区导航" className={`${styles.island} absolute h-full`}>
        <SidebarHeader className="shrink-0">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton ref={dashboard} isActive={workspaceActive} tooltip="版本工作台" aria-current={view === 'dashboard' ? 'page' : undefined}
                    onClick={() => { setOpenMobile(false); onDashboard() }}>
                    <LayoutDashboard /><span>版本工作台</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={projectsActive} tooltip="本地项目" aria-current={projectsActive ? 'page' : undefined}
                    onClick={() => { setOpenMobile(false); onProjects() }}>
                    <FolderGit2 /><span>本地项目</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent className="overscroll-none">
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="font-medium">版本</SidebarGroupLabel>
            <SidebarGroupAction title="新建版本" aria-label="新建版本"
              onClick={() => { setOpenMobile(false); onNewVersion() }}>
              <Plus />
            </SidebarGroupAction>
            <SidebarGroupContent>
              {!versions.length && <p className="px-2 py-2 text-xs text-muted-foreground">暂无版本</p>}
              {['open', 'released'].map(state => {
                const group = versions.filter(version => version.state === state)
                if (!group.length) return null
                return (
                  <section key={state} className="pb-1.5">
                    <h2 className="px-2 pb-1 text-xs text-muted-foreground">{state === 'open' ? '进行中' : '已发布'}</h2>
                    <SidebarMenu className="gap-0.5">
                      {group.map(version => (
                        <SidebarVersionItem key={version.id} version={version} active={versionView && versionId === version.id}
                          onOpen={() => openVersion(version.id)}
                          onEdit={() => { setOpenMobile(false); onEditVersion(version.id) }}
                          onDelete={trigger => setDeletion({ version, trigger })} />
                      ))}
                    </SidebarMenu>
                  </section>
                )
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </UISidebar>
      {deletion && (
        <DeleteVersionDialog version={deletion.version} onClose={() => setDeletion(undefined)}
          restoreFocus={() => {
            const target = deletion.trigger?.isConnected ? deletion.trigger : dashboard.current
            target?.focus({ preventScroll: true })
          }} />
      )}
    </>
  )
}
