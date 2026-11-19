'use client'

import { ArrowLeft, Check, RefreshCw, Terminal } from 'lucide-react'
import { useState } from 'react'
import { ProjectIconAction } from '../workspace/project-icon-action'
import { aiSettingsHeadingId } from '../workspace/use-ai-settings-route'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '../ui/item'
import { Spinner } from '../ui/spinner'
import { PROVIDERS, providerIds, useAutomationConfiguration } from './automation-settings-state'

export function AISettingsPage({ onBack }: { onBack: () => void }) {
  const settings = useAutomationConfiguration()
  const { capabilities, provider, saving, detecting, loading, detectionError, preferenceError, saveError, load, detect, setProvider } = settings
  const [feedback, setFeedback] = useState('')

  return (
    <section aria-labelledby={aiSettingsHeadingId} className="max-w-176 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
      <header className="mb-5 flex items-start gap-2">
        <ProjectIconAction label="返回工作区" onClick={onBack} className="mt-0.5 text-muted-foreground">
          <ArrowLeft aria-hidden="true" />
        </ProjectIconAction>
        <div className="min-w-0 space-y-1">
          <h1 id={aiSettingsHeadingId} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">AI 设置</h1>
          <p className="text-sm text-muted-foreground">需求文档导入和代码自动化共用同一个默认工具。</p>
        </div>
      </header>
      <section aria-labelledby="ai-providers-heading" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="ai-providers-heading" className="text-sm font-semibold">执行工具</h2>
          <Button type="button" variant="ghost" size="sm"
            aria-disabled={detecting || loading}
            onClick={() => {
              if (detecting || loading) return
              setFeedback('')
              void load()
              void detect()
            }}>
            {detecting ? <Spinner aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}重新检测
          </Button>
        </div>
        {preferenceError && <ErrorLine message={`无法读取 AI 设置：${preferenceError}`} />}
        {detectionError && <ErrorLine message={`无法检测 CLI：${detectionError}`} />}
        {saveError && <ErrorLine message={`无法保存默认工具：${saveError}`} />}
        <ItemGroup className="divide-y overflow-hidden rounded-lg border">
          {providerIds.map(id => {
            const tool = capabilities?.providers.find(item => item.id === id)
            const selected = id === provider
            const pending = saving === id
            const description = id === 'claude' ? '使用本机 Claude Code 的模型和网关配置' : '使用本机 Codex CLI 的登录凭据'
            return (
              <Item key={id} role="listitem" size="sm" tabIndex={-1} id={`ai-tool-${id}`}
                className="gap-2.5 rounded-none border-x-0 border-t-0 px-3 py-2.5 transition-colors motion-reduce:transition-none data-[active=true]:bg-default/40"
                data-active={selected}>
                <ItemMedia className="self-start pt-0.5 text-muted-foreground"><Terminal aria-hidden="true" className="size-4" /></ItemMedia>
                <ItemContent className="min-w-36 gap-0.5">
                  <ItemTitle>{PROVIDERS[id]}</ItemTitle>
                  <ItemDescription className="line-clamp-none [text-wrap:pretty]">{description}</ItemDescription>
                  {(tool?.model || tool?.customGateway) && (
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {tool.model && <span className="min-w-0 wrap-anywhere">模型 <code className="text-foreground">{tool.model}</code></span>}
                      {tool.customGateway && <span>{tool.model && <span aria-hidden="true" className="me-2">·</span>}自定义网关</span>}
                    </div>
                  )}
                </ItemContent>
                <ItemActions className="ms-auto flex-wrap justify-end gap-1.5">
                  <Badge variant="outline">
                    {detecting ? '检测中' : tool ? tool.available ? '已安装' : '未找到 CLI' : '待检测'}
                  </Badge>
                  {selected ? (
                    <Badge variant="secondary" className="w-19 motion-safe:fade-in"><Check aria-hidden="true" />默认</Badge>
                  ) : (
                    <Button type="button" size="xs" className="min-w-19 aria-disabled:opacity-50 motion-safe:active:scale-95"
                      aria-label={pending ? '正在保存' : `将 ${PROVIDERS[id]} 设为默认`}
                      aria-disabled={!provider || !tool?.available || detecting || !!saving}
                      onClick={async () => {
                        if (!provider || !tool?.available || detecting || saving) return
                        setFeedback('')
                        if (await setProvider(id)) {
                          setFeedback(`默认工具已切换为 ${PROVIDERS[id]}`)
                          document.getElementById(`ai-tool-${id}`)?.focus({ preventScroll: true })
                        }
                      }}>{pending ? <Spinner aria-hidden="true" /> : '设为默认'}</Button>
                  )}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
        <p role="status" className="sr-only">{feedback}</p>
      </section>
    </section>
  )
}
