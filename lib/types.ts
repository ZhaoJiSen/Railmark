import type { GROUPS } from './constants'
import type { Delivery, GitSnapshot } from './mygo'

export type Group = typeof GROUPS[number]['id']
export type View = 'dashboard' | 'version' | 'requirement' | 'projects' | 'project'

export interface GitRequest {
  directoryId: number
  name: string
  path: string
  requirementId?: number
  delivery?: Delivery
  resume?: { branchRef?: string, scrollTop: number, focusId: string }
}

export type GitStatus = Pick<GitSnapshot, 'directoryId' | 'checkedAt' | 'issue' | 'branch' | 'head' |
  'upstream' | 'pushTarget' | 'trackingKnown' | 'ahead' | 'behind' | 'staged' | 'unstaged' | 'untracked' | 'conflicted'>
