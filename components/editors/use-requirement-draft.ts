import { useRef, useState } from 'react'
import type { Project, Requirement, SaveRequirementInput } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { fromDelivery } from './link-draft'
import type { LinkDraft } from './link-draft'

export type RequirementFieldsDraft = Omit<SaveRequirementInput, 'projects'>

export function useRequirementDraft(versionId: number, projects: Project[], requirement?: Requirement) {
  const [draft, setDraft] = useState<RequirementFieldsDraft>(() => requirement ?? {
    id: 0, versionId, title: '', category: 'business', direction: '', state: 'todo', background: '', scope: '', acceptance: '', sourceUrl: '',
  })
  const [links, setLinks] = useState<LinkDraft[]>(() => requirement?.projects.map(fromDelivery) ?? [])
  const [initial, setInitial] = useState(() => ({ draft, links }))
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [error, setError] = useState('')

  function reset(requirement: Requirement): void {
    const currentLinks = requirement.projects.map(fromDelivery)
    setDraft(requirement)
    setLinks(currentLinks)
    setInitial({ draft: requirement, links: currentLinks })
    setError('')
  }

  function update(changes: Partial<RequirementFieldsDraft>): void {
    setDraft(current => ({ ...current, ...changes }))
  }

  function setProjects(items: LinkDraft[]): void {
    setLinks(items)
    setError('')
  }

  async function save(commit: (input: SaveRequirementInput) => Promise<number>): Promise<number | undefined> {
    if (pending.current) return
    if (!links.length) {
      setError(projects.length
        ? '请点击候选目录右侧的「关联」，或导入目录，将它加入当前需求。'
        : '请在前端或后端导入一个本地目录。')
      document.getElementById('request-projects')?.focus()
      return
    }
    pending.current = true
    setBusy(true)
    setError('')
    try {
      return await commit({ ...draft, projects: links })
    } catch (error) {
      setError(readableError(error))
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  const dirty = JSON.stringify({ draft, links }) !== JSON.stringify(initial)
  return { draft, links, initialState: initial.draft.state, update, setProjects, reset, busy, dirty, error, save }
}
