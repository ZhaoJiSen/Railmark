import { requirementCategoryLabel } from './constants'
import type { Delivery, Requirement, Version, Workspace } from './mygo'
import type { GitRequest, GitStatus } from './types'

const shortDate = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' })
const logDate = new Intl.DateTimeFormat('zh-CN', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
})

export function displayDate(value: string, format: 'short' | 'time' = 'short'): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return (format === 'short' ? shortDate : logDate).format(date)
}

export function versionDates(version: Version): string {
  return [version.startDate, version.releaseDate].filter(Boolean).join(' 至 ')
}

export function matchesQuery(query: string, ...values: string[]): boolean {
  const needle = query.trim().toLocaleLowerCase()
  return !needle || values.some(value => value.toLocaleLowerCase().includes(needle))
}

export function requirementMatches(requirement: Requirement, query: string): boolean {
  return matchesQuery(query, requirement.title, requirement.direction, requirement.background, requirementCategoryLabel(requirement.category),
    ...requirement.projects.flatMap(d => [d.projectName, d.path, d.branch]))
}

export function pushTargetNeedsReview(delivery: Delivery, git?: GitStatus): boolean {
  return Boolean(delivery.pushTarget && git && !git.issue && !git.pushTarget)
}

export function localBranchName(value: string): string {
  return value.trim().replace(/^refs\/heads\//, '')
}

export function resolveGitRequest(data: Workspace | null, request?: GitRequest): GitRequest | undefined {
  if (!data || !request) return undefined
  if (request.requirementId !== undefined) {
    const delivery = data.requirements.find(item => item.id === request.requirementId)?.projects.find(item =>
      item.directoryId === request.directoryId && item.group === request.delivery?.group)
    if (delivery) return { ...request, name: delivery.projectName, path: delivery.path, delivery }
    return undefined
  }

  const project = data.projects.find(item => item.directories.some(dir => dir.id === request.directoryId))
  const directory = project?.directories.find(item => item.id === request.directoryId)
  if (project && directory) return { ...request, name: project.name, path: directory.path }
  return undefined
}

export function deliveryIssues(delivery: Delivery, git?: GitStatus): string[] {
  const issues: string[] = []
  if (delivery.conflicts.length) issues.push(`绑定分支 ${delivery.branch} 也关联到版本 ${delivery.conflicts.join('、')}`)
  if (!git) return issues
  if (git.issue) return [...issues, git.issue]
  if (delivery.branch && localBranchName(delivery.branch) !== git.branch) {
    issues.push(`本地检出 ${git.branch || '分离 HEAD'}，需求绑定 ${delivery.branch}`)
  }
  if (pushTargetNeedsReview(delivery, git)) {
    issues.push(`推送目标待确认，预期为 ${delivery.pushTarget}`)
  } else if (delivery.pushTarget && git.pushTarget && delivery.pushTarget !== git.pushTarget) {
    issues.push(`默认推送目标为 ${git.pushTarget}，预期为 ${delivery.pushTarget}`)
  }
  if (git.conflicted) issues.push(`工作区有 ${git.conflicted} 个冲突项`)
  return issues
}
