import { Terminal } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { ErrorLine } from '../ui/form-parts'
import type { useAutomationConfiguration } from './automation-settings-state'

export function ExecutionProvider({ settings }: { settings: ReturnType<typeof useAutomationConfiguration> }) {
  const { providerLabel, available, detecting, loading, saving, preferenceError, detectionError, load, detect } = settings
  const busy = detecting || loading || !!saving
  const error = preferenceError || detectionError

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex min-h-6 items-center gap-2 text-xs text-muted-foreground">
        <span>执行工具</span>
        {providerLabel
          ? <Badge variant="outline"><Terminal aria-hidden="true" />{providerLabel}</Badge>
          : <span>{error ? '不可用' : '正在读取…'}</span>}
      </div>
      {error ? (
        <div className="space-y-1">
          <ErrorLine message={preferenceError ? `无法读取 AI 设置：${preferenceError}` : `无法检测 CLI：${detectionError}`} />
          <Button type="button" variant="outline" size="xs" disabled={busy} onClick={() => { void load(); void detect() }}>重试</Button>
        </div>
      ) : providerLabel && !available && (
        busy ? <p className="text-xs text-muted-foreground" role="status">正在检查执行工具…</p>
          : <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-xs text-muted-foreground">未找到 {providerLabel}。安装后可重新检测，也可在顶部「AI 设置」切换。</p>
              <Button type="button" variant="outline" size="xs" onClick={() => void detect()}>重新检测</Button>
            </div>
      )}
    </div>
  )
}
