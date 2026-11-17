import type { GROUPS } from './constants'
import type { Delivery, GitSnapshot } from './mygo'

export type Group = typeof GROUPS[number]['id']
export type View = 'dashboard' | 'version' | 'requirement' | 'projects' | 'project'

export interface GitRequest {
  directoryId: number
  name: string
  path: string
  delivery?: Delivery
}

export type GitByDirectory = Record<number, GitSnapshot | undefined>
