import type { Delivery, GitSnapshot, Requirement, Version } from './mygo'

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
  return matchesQuery(query, requirement.title, requirement.direction, requirement.background,
    ...requirement.projects.flatMap(d => [d.projectName, d.path, d.branch]))
}

export function deliveryIssues(delivery: Delivery, git?: GitSnapshot): string[] {
  const issues: string[] = []
  if (delivery.conflicts.length) issues.push(`绑定分支 ${delivery.branch} 也关联到版本 ${delivery.conflicts.join('、')}`)
  if (!git) return issues
  if (git.issue) return [...issues, git.issue]
  if (delivery.branch && delivery.branch.replace(/^refs\/heads\//, '') !== git.branch) {
    issues.push(`本地检出 ${git.branch || '分离 HEAD'}，需求绑定 ${delivery.branch}`)
  }
  if (delivery.pushTarget && git.pushTarget && delivery.pushTarget !== git.pushTarget) {
    issues.push(`默认推送目标为 ${git.pushTarget}，预期为 ${delivery.pushTarget}`)
  }
  if (git.conflicted) issues.push(`工作区有 ${git.conflicted} 个冲突项`)
  return issues
}
