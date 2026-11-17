import { Pencil, Tag, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import type { Version } from '../../lib/mygo'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../ui/context-menu'
import { SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar-items'

export function SidebarVersionItem({ version, active, onOpen, onEdit, onDelete }: {
  version: Version
  active: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: (trigger: HTMLButtonElement | null) => void
}) {
  const trigger = useRef<HTMLButtonElement>(null)
  const afterClose = useRef<(() => void) | null>(null)

  return (
    <SidebarMenuItem>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuButton ref={trigger} type="button" isActive={active} aria-current={active ? 'page' : undefined}
            className="select-none data-[state=open]:bg-sidebar-accent" onClick={onOpen}>
            <Tag aria-hidden="true" />
            <span className="font-mono" title={version.name}>{version.name}</span>
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <ContextMenuContent aria-label={`版本 ${version.name} 的操作`} className="data-[state=closed]:animate-none! motion-reduce:animate-none!"
          onCloseAutoFocus={event => {
            event.preventDefault()
            trigger.current?.focus({ preventScroll: true })
            const action = afterClose.current
            afterClose.current = null
            action?.()
          }}>
          <ContextMenuItem onSelect={() => { afterClose.current = onEdit }}>
            <Pencil aria-hidden="true" />编辑版本
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={() => { afterClose.current = () => onDelete(trigger.current) }}>
            <Trash2 aria-hidden="true" />删除版本
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </SidebarMenuItem>
  )
}
