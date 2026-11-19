import { AlertTriangle, FolderGit2, GitBranch } from 'lucide-react'
import { GROUPS } from '../../lib/constants'
import { useGitChecks } from '../../lib/git-checks'
import type { Delivery } from '../../lib/mygo'
import { deliveryDirectoryLabels } from '../../lib/project-directory-groups'
import type { GitRequest } from '../../lib/types'
import { deliveryIssues, pushTargetNeedsReview } from '../../lib/workspace-data'
import { useWorkspace } from '../../lib/workspace-store'
import { Button } from '../ui/button'
import { Table } from '@heroui/react/table'
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
  const groups = GROUPS.map(group => ({
    ...group,
    projects: deliveries.filter(delivery => delivery.group === group.id),
  })).filter(group => group.projects.length > 0)
  if (!groups.length) return null
  const grouped = groups.length > 1

  return (
    <Table className="@container/deliveries min-w-0">
      <Table.ScrollContainer>
        <Table.Content aria-label="关联项目"
          className="table-fixed [&_[data-slot=table-cell]]:px-2 [&_[data-slot=table-cell]]:py-1.5 [&_[data-slot=table-column]]:ps-3 [&_[data-slot=table-column]]:pe-2">
          <Table.Header>
            <Table.Column isRowHeader className="w-[36%]">{grouped ? '项目' : `${groups[0].label}项目`}</Table.Column>
            <Table.Column className="w-22 @min-[32rem]/deliveries:w-26">交付状态</Table.Column>
            <Table.Column>开发分支</Table.Column>
            {onGit && <Table.Column className="w-14 text-end"><span className="sr-only">Git 操作</span></Table.Column>}
          </Table.Header>
          <Table.Body>
            {groups.flatMap(group => {
              const directoryLabels = deliveryDirectoryLabels(group.projects)
              return [
                grouped && <Table.Row id={`group-${group.id}`} key={`group-${group.id}`}>
                  <Table.Cell colSpan={onGit ? 4 : 3} className="text-xs font-medium text-muted-foreground">
                    <span className="ps-1">{group.label}</span>
                  </Table.Cell>
                </Table.Row>,
                ...group.projects.map(delivery => (
                  <DeliveryRow key={`${delivery.group}-${delivery.directoryId}`} scope={scope}
                    requirementId={requirementId} delivery={delivery} editable={editable}
                    directoryLabel={directoryLabels.get(delivery.directoryId)} onProject={onProject} onGit={onGit} />
                )),
              ]
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
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
      <FolderGit2 aria-hidden="true" className="mx-0 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 wrap-anywhere">{delivery.projectName}</span>
    </>
  )

  return (
    <Table.Row id={`${delivery.group}-${delivery.directoryId}`} textValue={delivery.projectName}>
      <Table.Cell>
        <div className="flex items-center gap-1">
          {onProject ? (
            <Button id={projectLinkId} type="button" variant="ghost" size="xs"
              aria-label={`打开项目 ${delivery.projectName}${directoryHint}`}
              aria-description={showPath ? delivery.path : undefined}
              className="-ms-1 min-w-0 justify-start px-2 text-start whitespace-normal"
              onClick={() => onProject(delivery.projectId, projectLinkId)}>
              {projectLabel}
            </Button>
          ) : <span className="inline-flex min-h-6 items-center gap-1 px-1 text-xs font-medium">{projectLabel}</span>}
          {!onGit && issues.length > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-destructive">
              <AlertTriangle aria-hidden="true" className="size-3" />{issues.length}<span className="sr-only"> 项异常</span>
            </span>
          )}
        </div>
        {unresolvedPush && <p className="px-1 text-xs text-destructive">推送目标待确认</p>}
        {showPath && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <p tabIndex={0} className="truncate rounded-sm px-1 text-xs text-muted-foreground focus-visible:outline-ring">
                {directoryLabel || delivery.path}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-80 wrap-anywhere">{delivery.path}</TooltipContent>
          </Tooltip>
        )}
      </Table.Cell>
      <Table.Cell className="[&_[data-slot=button]]:px-1">
        {editable ? (
          <InlineStatus label={`修改 ${delivery.projectName} 的交付状态${directoryHint}`} state={delivery.state}
            onSave={value => update(requirementId, delivery, 'state', value)} />
        ) : <span className="px-1 text-xs"><StateLabel state={delivery.state} /></span>}
      </Table.Cell>
      <Table.Cell>
        {editable ? (
          <DeliveryBranchEditor requirementId={requirementId} delivery={delivery} currentBranch={status?.branch} directoryHint={directoryHint} />
        ) : (
          <span className="inline-flex items-center gap-1.5 px-1 text-xs text-muted-foreground" title={delivery.branch}>
            <GitBranch aria-hidden="true" className="size-3 shrink-0" />
            <span className="line-clamp-2 font-mono wrap-anywhere">{delivery.branch || '分支待绑定'}</span>
          </span>
        )}
      </Table.Cell>
      {onGit && (
        <Table.Cell className="text-end">
          <ProjectIconAction label={`核对 ${delivery.projectName} 的 Git 状态${issues.length ? `（${issues.length} 项异常）` : ''}${directoryHint}`}
            size={issues.length ? 'xs' : 'icon-sm'}
            aria-description={[directoryLabel ? delivery.path : '', ...issues].filter(Boolean).join('；') || undefined}
            className={issues.length
              ? 'w-full gap-1 px-0 text-xs tabular-nums text-destructive'
              : 'text-muted-foreground'}
            onClick={event => { event.currentTarget.focus({ preventScroll: true }); openGit() }}>
            {issues.length ? <><AlertTriangle aria-hidden="true" /><span className="max-w-5 truncate">{issues.length}</span></> : <GitBranch aria-hidden="true" />}
          </ProjectIconAction>
        </Table.Cell>
      )}
    </Table.Row>
  )
}
