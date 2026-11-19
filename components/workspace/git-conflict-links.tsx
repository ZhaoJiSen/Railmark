import { ArrowUpRight } from 'lucide-react'
import type { Requirement } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { localBranchName } from '../../lib/workspace-data'
import { useWorkspace } from '../../lib/workspace-store'
import { Button } from '../ui/button'

export function GitConflictLinks({ request, onOpen }: { request: GitRequest, onOpen: (requirement: Requirement) => void }) {
  const data = useWorkspace(state => state.data)
  const delivery = request.delivery
  if (!data || !delivery?.conflicts.length) return null

  const branch = localBranchName(delivery.branch)
  const conflictedVersions = new Map(data.versions.filter(version => version.state === 'open'
    && delivery.conflicts.includes(version.name)).map(version => [version.id, version.name]))
  const conflicts = data.requirements.filter(item => item.id !== request.requirementId && conflictedVersions.has(item.versionId)
    && item.projects.some(project => project.projectId === delivery.projectId && localBranchName(project.branch) === branch))
  if (!conflicts.length) return null

  return (
    <ul aria-label="绑定同一分支的需求" className="mt-2 flex flex-wrap gap-1">
      {conflicts.map(item => (
        <li key={item.id} className="min-w-0 max-w-full">
          <Button type="button" id={`git-conflict-${item.id}`} variant="outline" size="xs"
            className="max-w-full justify-start text-start whitespace-normal"
            onClick={() => onOpen(item)}>
            <span className="min-w-0 wrap-anywhere">
              <span className="me-1.5 font-mono text-muted-foreground">{conflictedVersions.get(item.versionId)}</span>
              {item.title}
            </span>
            <ArrowUpRight aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />
          </Button>
        </li>
      ))}
    </ul>
  )
}
