import { AlertTriangle, FolderGit2, GitBranch } from 'lucide-react'
import { GROUPS } from '../../lib/constants'
import type { Delivery } from '../../lib/mygo'
import type { GitByDirectory, GitRequest } from '../../lib/types'
import { deliveryIssues } from '../../lib/workspace-data'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Status } from './status'

interface DeliveryGroupProps {
  deliveries: Delivery[]
  snapshots: GitByDirectory
  onGit: (request: GitRequest) => void
  showPath?: boolean
}

export function DeliveryGroups({ deliveries, snapshots, onGit, showPath = false }: DeliveryGroupProps) {
  return (
    <Table className="table-fixed" aria-label="关联项目">
      <colgroup>
        <col className="w-[42%]" />
        <col className="w-21" />
        <col />
      </colgroup>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col" className="h-7 ps-2.5 text-xs text-muted-foreground">项目</TableHead>
          <TableHead scope="col" className="h-7 text-xs text-muted-foreground">交付状态</TableHead>
          <TableHead scope="col" className="h-7 text-xs text-muted-foreground">开发分支</TableHead>
        </TableRow>
      </TableHeader>
      {GROUPS.map(group => {
        const projects = deliveries.filter(delivery => delivery.group === group.id)
        if (!projects.length) return null

        return (
          <TableBody key={group.id} aria-label={group.label} className="border-b last:border-b-0">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead scope="rowgroup" colSpan={3} className="h-6 ps-2.5 text-xs font-semibold text-muted-foreground">
                {group.label}
              </TableHead>
            </TableRow>
            {projects.map(delivery => (
              <DeliveryRow key={delivery.directoryId} delivery={delivery} snapshots={snapshots} onGit={onGit} showPath={showPath} />
            ))}
          </TableBody>
        )
      })}
    </Table>
  )
}

function DeliveryRow({ delivery, snapshots, onGit, showPath }: Omit<DeliveryGroupProps, 'deliveries'> & { delivery: Delivery }) {
  const issues = deliveryIssues(delivery, snapshots[delivery.directoryId])
  const openGit = () => onGit({
    directoryId: delivery.directoryId,
    name: delivery.projectName,
    path: delivery.path,
    delivery,
  })

  return (
    <TableRow>
      <TableCell className="py-1.5 ps-2.5 align-top whitespace-normal">
        <Button type="button" variant="link" size="sm" aria-label={`核对 ${delivery.projectName} 的 Git 状态`}
          className="h-auto min-h-5 max-w-full justify-start p-0 text-start whitespace-normal" onClick={event => { event.currentTarget.focus({ preventScroll: true }); openGit() }}>
          <FolderGit2 aria-hidden="true" className="size-3.5 text-muted-foreground" />
          <span className="[overflow-wrap:anywhere]">{delivery.projectName}</span>
        </Button>
        {showPath && <p className="mt-1 truncate text-xs text-muted-foreground" title={delivery.path}>{delivery.path}</p>}
        {issues.length > 0 && (
          <div>
            <Button type="button" variant="link" size="xs" className="h-auto p-0 text-destructive"
              aria-label={`${delivery.projectName} 有 ${issues.length} 项异常，查看 Git`}
              title={issues.join('；')} onClick={event => { event.currentTarget.focus({ preventScroll: true }); openGit() }}>
              <AlertTriangle aria-hidden="true" />{issues.length} 项异常
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell className="py-1.5 align-top"><Status state={delivery.state} /></TableCell>
      <TableCell className="py-1.5 align-top whitespace-normal">
        <div className="flex items-start gap-1.5 text-muted-foreground">
          <GitBranch aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
          <span className="font-mono text-xs leading-5 [overflow-wrap:anywhere]">{delivery.branch || '分支待绑定'}</span>
        </div>
      </TableCell>
    </TableRow>
  )
}
