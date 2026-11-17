'use client'

import { create } from 'zustand'
import type { GitStatus } from './types'

interface GitCheck {
  order: number
  status: GitStatus
}

export type GitChecksByDirectory = Partial<Record<number, GitCheck>>

interface GitChecks {
  checks: GitChecksByDirectory
}

export const useGitChecks = create<GitChecks>(() => ({ checks: {} }))

let readOrder = 0

export function beginGitCheck(): number {
  return ++readOrder
}

export function publishGitChecks(order: number, values: GitStatus[]): void {
  useGitChecks.setState(state => {
    const fresh = values.filter(({ directoryId }) => (state.checks[directoryId]?.order ?? 0) < order)
    if (!fresh.length) return state

    const checks = { ...state.checks }
    for (const value of fresh) {
      const { directoryId, checkedAt, issue, branch, head, upstream, pushTarget, trackingKnown,
        ahead, behind, staged, unstaged, untracked, conflicted } = value
      checks[directoryId] = {
        order, status: { directoryId, checkedAt, issue, branch, head, upstream, pushTarget, trackingKnown,
          ahead, behind, staged, unstaged, untracked, conflicted },
      }
    }
    return { checks }
  })
}
