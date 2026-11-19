import { ChevronDown, FileText } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import type { Ref } from 'react'
import type { Draft } from '../../lib/mygo-automation'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ScrollArea } from '../ui/scroll-area'

export function DocumentSourcePreview({ title, text, headingRef, onChangeSource }: {
  title: string
  text: string
  headingRef: Ref<HTMLHeadingElement>
  onChangeSource: () => void
}) {
  return (
    <Collapsible className="min-w-0 rounded-md border">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 p-2.5">
        <FileText aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
        <h3 ref={headingRef} tabIndex={-1} className="min-w-0 flex-1 text-sm font-medium wrap-anywhere outline-none">{title}</h3>
        <Button type="button" size="xs" variant="ghost" onClick={onChangeSource}>更换链接</Button>
        <CollapsibleTrigger asChild>
          <Button type="button" size="xs" variant="ghost" className="group">
            查看原文 <ChevronDown aria-hidden="true" className="motion-safe:transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <ScrollArea type="hover" scrollbarSize="thin" className="h-32 min-w-0 overflow-hidden border-t"
          viewportProps={{ tabIndex: 0, 'aria-label': '钉钉文档原文', className: '[&>div]:block!' }}>
          <pre className="px-3 py-2 font-sans text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-muted-foreground">{text}</pre>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function DocumentDraftPreview({ draft, changes }: {
  draft: Draft
  changes: Partial<Draft & { sourceUrl: string }>
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => { heading.current?.focus() }, [])

  const fields = [
    { id: 'background', label: '需求背景' },
    { id: 'scope', label: '交付范围' },
    { id: 'acceptance', label: '验收条件' },
  ] as const
  const visibleFields = fields.filter(field => draft[field.id].trim())
  const canApply = Object.keys(changes).length > 0

  return (
    <section aria-labelledby="document-draft-heading" className="min-w-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150">
      <h3 id="document-draft-heading" ref={heading} tabIndex={-1} className="border-b pb-3 text-sm font-medium outline-none">草稿预览</h3>
      {!canApply && <p role="status" className="pt-3 text-sm text-muted-foreground">对应字段均已填写，可以从草稿复制需要的内容。</p>}
      <div className="space-y-1 py-3">
        <h4 className="text-lg leading-snug font-semibold wrap-anywhere">{draft.title}</h4>
        {canApply && !changes.title && <p className="text-xs text-muted-foreground">保留已填标题</p>}
      </div>
      {visibleFields.length > 0 && (
        <dl className="space-y-3">
          {visibleFields.map(({ id, label }) => (
            <div key={id} className="space-y-1">
              <dt className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
                {label}
                {canApply && !changes[id] && <span className="text-xs font-normal text-muted-foreground">保留已填内容</span>}
              </dt>
              <dd className="text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-muted-foreground">{draft[id]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
