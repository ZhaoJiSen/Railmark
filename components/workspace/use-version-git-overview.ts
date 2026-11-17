import { useEffect, useState } from 'react'
import { beginGitCheck, publishGitChecks, useGitChecks } from '../../lib/git-checks'
import { Desk } from '../../lib/mygo'
import type { Requirement } from '../../lib/mygo'
import { readableError } from '../../lib/utils'

export function useVersionGitOverview(versionId: number, requirements: Requirement[]) {
  const checks = useGitChecks(state => state.checks)
  const directories = new Set(requirements.flatMap(item => item.projects.map(project => project.directoryId)))
  const directoryKey = [...directories].sort((a, b) => a - b).join(',')
  const [revision, setRevision] = useState(0)
  const [acknowledged, setAcknowledged] = useState(0)
  const [result, setResult] = useState<{ directoryKey: string, revision: number, error?: string }>()
  const checking = !!directoryKey && (result?.directoryKey !== directoryKey || result.revision !== revision)
  const inspectionError = checking || !directoryKey ? '' : result?.error
  const hasPrevious = [...directories].some(id => checks[id])
  const recentlyChecked = !!directoryKey && !checking && !inspectionError && revision > acknowledged

  useEffect(() => {
    if (!directoryKey) return
    const order = beginGitCheck()
    let active = true
    Desk.gitOverview(versionId).then(values => {
      if (!active) return
      publishGitChecks(order, values)
      setResult({ directoryKey, revision })
    }).catch(error => {
      if (active) setResult({ directoryKey, revision, error: readableError(error) })
    })
    return () => { active = false }
  }, [versionId, directoryKey, revision])

  useEffect(() => {
    if (!recentlyChecked) return
    const timer = window.setTimeout(() => setAcknowledged(revision), 1800)
    return () => window.clearTimeout(timer)
  }, [recentlyChecked, revision])

  return {
    checks,
    checking,
    recentlyChecked,
    error: inspectionError ? `Git 核对失败，${hasPrevious ? '显示上次核对结果' : '暂时无法判断工作区异常'}。 ${inspectionError}` : '',
    refresh: () => setRevision(current => current + 1),
  }
}
