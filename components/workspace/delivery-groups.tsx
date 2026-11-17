import { AlertTriangle, FolderGit2, GitBranch } from 'lucide-react'
import { GROUPS } from '../../lib/constants'
import { useGitChecks } from '../../lib/git-checks'
import type { Delivery } from '../../lib/mygo'
import { deliveryDirectoryLabels } from '../../lib/project-directory-groups'
import type { GitRequest } from '../../lib/types'
import { deliveryIssues, pushTargetNeedsReview } from '../../lib/workspace-data'
import { useWorkspace } from '../../lib/workspace-store'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { DeliveryBranchEditor } from './delivery-branch-editor'
import { InlineStatus } from './inline-status'
import { ProjectIconAction } from './project-icon-action'
import { StateLabel } from './status'

interface DeliveryGroupProps {
  scope: 'version' | 'requirement'
  requirementId: number
  deliveries: Delivery[]
  onProject?: (id: number, triggerId: string) => void
  onGit?: (request: GitRequest) => void
  editable?: boolean
}

export function DeliveryGroups({ scope, requirementId, deliveries, onProject, onGit, editable = true }: DeliveryGroupProps) {
  return (
    <div role="group" className="space-y-2.5" aria-label="关联项目">
      {GROUPS.map(group => {
        const projects = deliveries.filter(delivery => delivery.group === group.id)
        if (!projects.length) return null
        const directoryLabels = deliveryDirectoryLabels(projects)

        return (
          <div key={group.id} className="overflow-hidden rounded-md border">
            <Table className="table-fixed" aria-label={`${group.label}项目`}>
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-24" />
                <col />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/45 hover:bg-muted/45">
                  <TableHead scope="col" className="h-8 px-2.5 text-xs font-semibold">{group.label}项目</TableHead>
                  <TableHead scope="col" className="h-8 px-2.5 text-xs text-muted-foreground">交付状态</TableHead>
                  <TableHead scope="col" className="h-8 px-2.5 text-xs text-muted-foreground">开发分支</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map(delivery => (
                  <DeliveryRow key={delivery.directoryId} scope={scope} requirementId={requirementId}
                    delivery={delivery} directoryLabel={directoryLabels.get(delivery.directoryId)}
                    onProject={onProject} onGit={onGit} editable={editable} />
                ))}
              </TableBody>
            </Table>
          </div>
        )
      })}
    </div>
  )
}

function DeliveryRow({ scope, requirementId, delivery, directoryLabel, onProject, onGit, editable }: Omit<DeliveryGroupProps, 'deliveries'> & {
  delivery: Delivery, directoryLabel?: string,
}) {
  const update = useWorkspace(state => state.updateDeliveryField)
  const status = useGitChecks(state => state.checks[delivery.directoryId]?.status)
  const issues = deliveryIssues(delivery, status)
  const unresolvedPush = pushTargetNeedsReview(delivery, status)
  const showPath = scope === 'requirement' || !!directoryLabel
  const directoryHint = directoryLabel ? `（${directoryLabel}）` : ''
  const projectLinkId = `${scope}-delivery-${requirementId}-${delivery.group}-${delivery.directoryId}`
  const openGit = () => onGit?.({
    directoryId: delivery.directoryId,
    name: delivery.projectName,
    path: delivery.path,
    requirementId,
    delivery,
  })

  const projectLabel = (
    <>
      <FolderGit2 aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 wrap-anywhere">{delivery.projectName}</span>
    </>
  )

  return (
    <TableRow className="hover:bg-muted/35 focus-within:bg-muted/35 has-aria-expanded:bg-muted/35">
      <TableCell className="px-2 py-1 whitespace-normal">
        <div className="flex items-center gap-1">
          {onProject ? (
            <Button id={projectLinkId} type="button" variant="ghost" size="xs"
              aria-label={`打开项目 ${delivery.projectName}${directoryHint}`}
              aria-description={showPath ? delivery.path : undefined}
              className="h-auto min-h-6 min-w-0 justify-start px-0.5 py-0.5 text-start whitespace-normal"
              onClick={() => onProject(delivery.projectId, projectLinkId)}>
              {projectLabel}
            </Button>
          ) : <span className="inline-flex min-h-6 items-center gap-1 px-0.5 text-xs font-medium">{projectLabel}</span>}
          {onGit ? (
            <ProjectIconAction label={`核对 ${delivery.projectName} 的 Git 状态${issues.length ? `（${issues.length} 项异常）` : ''}${directoryHint}`}
              size={issues.length > 0 ? 'xs' : 'icon-sm'}
              aria-description={[directoryLabel ? delivery.path : '', ...issues].filter(Boolean).join('；') || undefined}
              className={issues.length ? 'shrink-0 text-destructive' : 'shrink-0 text-muted-foreground'}
              onClick={event => { event.currentTarget.focus({ preventScroll: true }); openGit() }}>
              {issues.length > 0 ? <><AlertTriangle aria-hidden="true" />{issues.length}</> : <GitBranch aria-hidden="true" />}
            </ProjectIconAction>
          ) : issues.length > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-destructive">
              <AlertTriangle aria-hidden="true" className="size-3" />{issues.length}<span className="sr-only"> 项异常</span>
            </span>
          )}
        </div>
        {unresolvedPush && <p className="px-0.5 text-xs text-destructive">推送目标待确认</p>}
        {directoryLabel ? (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <p tabIndex={0} className="truncate rounded-sm px-0.5 text-xs text-muted-foreground focus-visible:outline-ring">{directoryLabel}</p>
            </TooltipTrigger>
            <TooltipContent className="max-w-80 wrap-anywhere">{delivery.path}</TooltipContent>
          </Tooltip>
        ) : showPath && <p className="truncate px-0.5 text-xs text-muted-foreground" title={delivery.path}>{delivery.path}</p>}
      </TableCell>
      <TableCell className="px-1 py-1">
        {editable ? (
          <InlineStatus label={`修改 ${delivery.projectName} 的交付状态${directoryHint}`} state={delivery.state}
            onSave={value => update(requirementId, delivery, 'state', value)} />
        ) : <span className="px-1.5 text-xs"><StateLabel state={delivery.state} /></span>}
      </TableCell>
      <TableCell className="px-1 py-1 whitespace-normal">
        {editable ? (
          <DeliveryBranchEditor requirementId={requirementId} delivery={delivery} currentBranch={status?.branch} directoryHint={directoryHint} />
        ) : (
          <span className="inline-flex items-center gap-1.5 px-1.5 text-xs text-muted-foreground" title={delivery.branch}>
            <GitBranch aria-hidden="true" className="size-3 shrink-0" />
            <span className="line-clamp-2 font-mono wrap-anywhere">{delivery.branch || '分支待绑定'}</span>
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}
