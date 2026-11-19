import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Desk } from '../../lib/mygo'
import type { Requirement } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'

export function RequirementContent({ requirement, onEdit }: { requirement: Requirement, onEdit?: () => void }) {
  const [error, setError] = useState('')
  const content = [
    ['需求背景', requirement.background],
    ['实现逻辑', requirement.implementation],
    ['交付范围', requirement.scope],
    ['验收条件', requirement.acceptance],
  ]
  const hasContent = content.some(([, value]) => value.trim())

  return (
    <>
      {hasContent ? (
        <dl className="divide-y">
          {content.filter(([, value]) => value.trim()).map(([label, value]) => (
            <div key={label} className="py-2 first:pt-0 last:pb-0">
              <dt className="mb-1 font-medium">{label}</dt>
              <dd className="text-sm whitespace-pre-wrap wrap-anywhere text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      ) : onEdit ? (
        <Button type="button" variant="ghost" size="sm"
          className="-ms-1.5" onClick={onEdit}>
          添加需求内容
        </Button>
      ) : <p className="text-xs text-muted-foreground">暂无需求内容</p>}
      {requirement.sourceUrl && (
        <div className="pt-2">
          <Button type="button" variant="outline" size="sm"
            onClick={() => { setError(''); void Desk.openLink(requirement.sourceUrl).catch(problem => setError(readableError(problem))) }}>
            <ExternalLink />打开原始需求
          </Button>
        </div>
      )}
      <ErrorLine message={error} />
    </>
  )
}
