'use client'

import { Check, FileText, Link2, RotateCw, Sparkles } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Automation } from '../../lib/mygo-automation'
import type { Document, Draft } from '../../lib/mygo-automation'
import { Button } from '../ui/button'
import { ErrorLine, Field } from '../ui/form-parts'
import { Input } from '../ui/input'
import { Spinner } from '../ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Textarea } from '../ui/textarea'
import { AutomationProgress } from './automation-progress'
import { useAutomationConfiguration } from './automation-settings-state'
import { DocumentDraftPreview, DocumentSourcePreview } from './document-import-preview'
import { ExecutionProvider } from './execution-provider'
import { useAutomationRun } from './use-automation'

type SourceKind = 'link' | 'text'
type ImportFields = Draft & { sourceUrl: string }
const importFields = ['title', 'background', 'scope', 'acceptance', 'sourceUrl'] as const

export function DocumentImport({ current, footer, onApply }: {
  current: ImportFields
  footer: HTMLElement | null
  onApply: (fields: Partial<ImportFields>) => void
}) {
  const task = useAutomationRun()
  const settings = useAutomationConfiguration()
  const { capabilities, detecting, detect, provider, available, detectionError } = settings
  const [selectedKind, setSelectedKind] = useState<SourceKind>()
  const [url, setURL] = useState('')
  const [text, setText] = useState('')
  const [document, setDocument] = useState<Document>()
  const [draft, setDraft] = useState<Draft>()
  const [reviewing, setReviewing] = useState(false)
  const sourceSection = useRef<HTMLDivElement>(null)
  const linkInput = useRef<HTMLInputElement>(null)
  const documentHeading = useRef<HTMLHeadingElement>(null)
  const focusLinkStage = useRef(false)
  const focusSource = useRef(false)
  const running = Boolean(task.status)
  const checkingProvider = !draft && (detecting || settings.loading || !!settings.saving)
  const linkUnavailable = !detecting && (Boolean(detectionError) || capabilities?.dingTalk === false)
  const kind = selectedKind ?? (linkUnavailable ? 'text' : 'link')
  const canRead = !detecting && !!capabilities?.dingTalk && !!url.trim()
  const source = kind === 'link' ? document
    : text.trim() ? { title: '', markdown: text, sourceUrl: '' } : undefined
  const changes: Partial<ImportFields> = {}
  if (reviewing && draft && source) {
    const suggested = { ...draft, sourceUrl: source.sourceUrl }
    for (const field of importFields) {
      if (!current[field].trim() && suggested[field].trim()) changes[field] = suggested[field]
    }
  }

  useLayoutEffect(() => {
    if (reviewing || !focusSource.current) return
    focusSource.current = false
    sourceSection.current?.focus()
  }, [reviewing])

  useLayoutEffect(() => {
    if (!focusLinkStage.current) return
    focusLinkStage.current = false
    const target = document ? documentHeading : linkInput
    target.current?.focus()
  }, [document])

  function resetDraft(): void {
    setDraft(undefined)
    setReviewing(false)
    task.clearFeedback()
  }

  async function fetchDocument(): Promise<void> {
    if (!canRead || running) return
    setSelectedKind('link')
    resetDraft()
    const result = await task.run(channel => Automation.readRequirementDocument(url, channel), '正在读取钉钉文档…')
    if (result) {
      focusLinkStage.current = true
      setDocument(result)
    }
  }

  async function generate(): Promise<void> {
    if (!source || !available || !provider || running) return
    const result = await task.run(channel => Automation.generateRequirementDraft(provider, source, channel), '正在整理需求草稿…')
    if (result) {
      setDraft(result)
      setReviewing(true)
    }
  }

  return (
    <>
      <div ref={sourceSection} hidden={reviewing} tabIndex={-1} role="group" aria-label="文档来源" className="outline-none">
        <div className="space-y-3">
          <fieldset disabled={running} className="min-w-0 space-y-3">
            <Tabs value={kind} className="gap-3" onValueChange={value => {
              setSelectedKind(value === 'text' ? 'text' : 'link')
              resetDraft()
            }}>
              <TabsList aria-label="文档来源">
                <TabsTrigger value="link" disabled={running}><Link2 aria-hidden="true" className="size-3.5" />钉钉链接</TabsTrigger>
                <TabsTrigger value="text" disabled={running}><FileText aria-hidden="true" className="size-3.5" />粘贴正文</TabsTrigger>
              </TabsList>
              <TabsContent value="link" className="space-y-3">
                {document ? (
                  <DocumentSourcePreview title={document.title || '钉钉文档'} text={document.markdown} headingRef={documentHeading}
                    onChangeSource={() => { focusLinkStage.current = true; setDocument(undefined); resetDraft() }} />
                ) : linkUnavailable ? (
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-md border p-3 text-sm">
                    <p className="min-w-0 text-muted-foreground">{detectionError ? '无法检测钉钉 DWS。' : '未找到钉钉 DWS。'}你也可以直接粘贴正文。</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => void detect()}>
                      <RotateCw aria-hidden="true" />重新检测
                    </Button>
                  </div>
                ) : (
                  <Field id="requirement-document-url" label="钉钉文档链接">
                    <div className="flex items-center gap-2">
                      <Input ref={linkInput} id="requirement-document-url" inputMode="url" placeholder="https://alidocs.dingtalk.com/…"
                        value={url} onChange={event => { setSelectedKind('link'); setURL(event.target.value); resetDraft() }}
                        onKeyDown={event => {
                          if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.nativeEvent.isComposing) return
                          event.preventDefault()
                          void fetchDocument()
                        }} />
                      <Button type="button" disabled={!canRead || running} onClick={fetchDocument}>读取文档</Button>
                    </div>
                  </Field>
                )}
              </TabsContent>
              <TabsContent value="text">
                <Field id="requirement-document-paste" label="文档正文">
                  <Textarea id="requirement-document-paste" className="resize-y" value={text} placeholder="粘贴 Markdown 或纯文本"
                    onChange={event => { setSelectedKind('text'); setText(event.target.value); resetDraft() }} />
                </Field>
              </TabsContent>
            </Tabs>
            {source && !checkingProvider && <ExecutionProvider settings={settings} />}
          </fieldset>
          {task.error && <ErrorLine message={task.error} />}
          {running && <AutomationProgress status={task.status} />}
          {task.notice && <p className="text-sm text-muted-foreground" role="status">{task.notice}</p>}
        </div>
      </div>
      {reviewing && draft && source && <DocumentDraftPreview draft={draft} changes={changes} />}
      {footer && createPortal(reviewing ? (
        <>
          <Button type="button" variant="outline" onClick={() => {
            focusSource.current = true
            setReviewing(false)
          }}>调整来源</Button>
          <Button type="button" disabled={Object.keys(changes).length === 0} onClick={() => onApply(changes)}>
            <Check aria-hidden="true" />填入空白字段
          </Button>
        </>
      ) : (
        <>
          {running && <Button type="button" variant="outline" onClick={task.cancel}>停止</Button>}
          <Button type="button" disabled={!source || running || checkingProvider || (!draft && !available)}
            onClick={draft ? () => setReviewing(true) : generate}>
            {running || source && checkingProvider ? <Spinner aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            {source && checkingProvider ? '正在检查执行工具…' : draft ? '查看草稿' : '生成需求草稿'}
          </Button>
        </>
      ), footer)}
    </>
  )
}
