'use client'

import { FolderOpen, GitBranch } from 'lucide-react'
import { useState } from 'react'
import { GROUPS } from '../../lib/constants'
import { deliveryDirectoryLabels } from '../../lib/project-directory-groups'
import { Automation } from '../../lib/mygo-automation'
import type { RunResult } from '../../lib/mygo-automation'
import type { Delivery, Requirement } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { EditorSheet } from '../editors/editor-sheet'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ErrorLine, Field } from '../ui/form-parts'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select'
import { ScrollArea } from '../ui/scroll-area'
import { Item, ItemContent, ItemGroup, ItemTitle } from '../ui/item'
import { AutomationProgress } from './automation-progress'
import { useAutomationConfiguration } from './automation-settings-state'
import { ExecutionProvider } from './execution-provider'
import { useAutomationRun } from './use-automation'

function deliveryKey(delivery: Delivery): string {
  return `${delivery.directoryId}:${delivery.group}`
}

export function RequirementAutomation({ requirement, onClose }: { requirement: Requirement; onClose: () => void }) {
  const projects = requirement.projects.filter(item => item.branch)
  const [selected, setSelected] = useState(() => projects.length === 1 ? deliveryKey(projects[0]) : '')
  const [result, setResult] = useState<RunResult>()
  const settings = useAutomationConfiguration()
  const { provider, providerLabel, available } = settings
  const task = useAutomationRun()
  const target = projects.find(item => deliveryKey(item) === selected)
  const running = Boolean(task.status)
  const submitLabel = running ? '正在执行…' : providerLabel ? `运行 ${providerLabel}` : '运行自动化'

  return (
    <EditorSheet title="CLI 自动化" description={requirement.title} submitLabel={submitLabel}
      busy={false} cancelLabel={running ? '停止' : '关闭'} submitDisabled={!target || !available || running} dirty={false}
      error={task.error} onClose={onClose} onInterrupt={running ? task.cancel : undefined}
      onSubmit={async event => {
        event.preventDefault()
        if (!target || !available || !provider || running) return
        setResult(undefined)
        const run = await task.run(channel => Automation.runRequirementAutomation(requirement.id, target.directoryId, target.group,
          target.branch, provider, channel), '正在准备分支副本…')
        if (run) setResult(run)
      }}>
      <fieldset disabled={running} className="min-w-0 space-y-3">
        <Field id="automation-project" label="执行项目">
          {projects.length ? <DeliveryPicker projects={projects} value={target ? selected : ''}
            onChange={value => { setSelected(value); setResult(undefined); task.clearFeedback() }} /> : (
              <p className="text-xs text-muted-foreground">关闭面板后，在「关联项目」里绑定开发分支。</p>
            )}
          {target && (
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><GitBranch aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="font-mono wrap-anywhere">{target.branch}</span></div>
              <p className="wrap-anywhere">{target.path}</p>
            </div>
          )}
        </Field>
        <ExecutionProvider settings={settings} />
      </fieldset>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {providerLabel ?? '执行工具'}会读取已保存的需求和项目代码。改动保存在所选分支的独立副本，供你检查和验证。
      </p>
      {task.status && <AutomationProgress status={task.status} />}
      {task.notice && <p className="text-xs text-muted-foreground" role="status">{task.notice}</p>}
      {result && <AutomationResult result={result} />}
    </EditorSheet>
  )
}

function DeliveryPicker({ projects, value, onChange }: { projects: Delivery[]; value: string; onChange: (value: string) => void }) {
  return (
    <Select aria-label="执行项目" value={value} onValueChange={onChange}>
      <SelectTrigger id="automation-project" className="w-full"><SelectValue placeholder="选择执行项目" /></SelectTrigger>
      <SelectContent position="popper" align="start" className="max-w-[calc(100vw-2rem)]">
        {GROUPS.map(group => {
          const members = projects.filter(item => item.group === group.id)
          if (!members.length) return null
          const labels = deliveryDirectoryLabels(members)
          return <SelectGroup key={group.id}>
            <SelectLabel>{group.label}</SelectLabel>
            {members.map(item => <SelectItem key={deliveryKey(item)} value={deliveryKey(item)}>
              <span className="min-w-0 truncate">{item.projectName}</span>
              {labels.has(item.directoryId) && <span className="min-w-0 truncate text-xs text-muted-foreground">{labels.get(item.directoryId)}</span>}
            </SelectItem>)}
          </SelectGroup>
        })}
      </SelectContent>
    </Select>
  )
}

function AutomationResult({ result }: { result: RunResult }) {
  const [error, setError] = useState('')
  return (
    <Card aria-live="polite">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle role="heading" aria-level={2}>执行结果</CardTitle>
        {result.directory && <Button type="button" size="sm" variant="outline" onClick={() => {
          setError('')
          void Automation.openAutomationDirectory(result.directory).catch(error => setError(readableError(error)))
        }}><FolderOpen aria-hidden="true" />打开副本</Button>}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">基于 <code>{result.baseCommit.slice(0, 8)}</code></p>
        {result.summary && <p className="text-sm wrap-anywhere whitespace-pre-wrap">{result.summary}</p>}
        {result.changes.length > 0 ? (
          <ScrollArea type="hover" scrollbarSize="thin" className="max-h-48 min-w-0 overflow-hidden rounded-md border"
            viewportProps={{ tabIndex: 0, 'aria-label': '变更文件', className: 'max-h-48 [&>div]:block!' }}>
            <ItemGroup className="divide-y">
              {result.changes.map(change => <Item key={change.path} role="listitem" size="sm" className="gap-2 rounded-none px-2.5 py-1.5">
                <Badge variant="outline" className="font-mono">{change.status}</Badge>
                <ItemContent className="min-w-0"><ItemTitle className="w-full font-mono text-xs wrap-anywhere">{change.path}</ItemTitle></ItemContent>
              </Item>)}
            </ItemGroup>
          </ScrollArea>
        ) : <p className="text-xs text-muted-foreground">没有产生文件变更。</p>}
        {result.moreChanges && <p className="text-xs text-muted-foreground">打开副本可查看其余变更。</p>}
        {error && <ErrorLine message={error} />}
      </CardContent>
    </Card>
  )
}
