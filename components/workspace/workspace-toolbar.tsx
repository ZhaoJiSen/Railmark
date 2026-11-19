import { Bot, ChevronRight } from 'lucide-react'
import { Breadcrumbs } from '@heroui/react/breadcrumbs'
import { buttonVariants } from '../ui/button'
import { Separator } from '../ui/separator'
import { SidebarTrigger } from '../ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { AppearancePicker } from './appearance-picker'
import { aiSettingsRoute, aiSettingsTriggerId } from './use-ai-settings-route'
import styles from './workspace.module.scss'

export function WorkspaceToolbar({ area, context, details, onHome, onContext, loaded, onActionError, aiSettingsOpen, onAISettings }: {
  area?: string
  context?: string
  details: boolean
  onHome: () => void
  onContext?: () => void
  loaded: boolean
  onActionError: (message: string) => void
  aiSettingsOpen: boolean
  onAISettings: () => void
}) {
  return (
    <header className={`${styles.toolbar} shrink-0`}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="hidden font-semibold select-none min-[650px]:inline">Railmark</span>
        <SidebarTrigger aria-label="切换侧栏" />
        {area && <>
          <Separator orientation="vertical" isDecorative className="h-4 self-center" />
          <Breadcrumbs aria-label="当前位置" className="min-w-0" separator={<ChevronRight aria-hidden="true" />}>
            <Breadcrumbs.Item id="area" onPress={context ? onHome : undefined}>{area}</Breadcrumbs.Item>
            {context && <Breadcrumbs.Item id="context" onPress={onContext}>{context}</Breadcrumbs.Item>}
            {details && <Breadcrumbs.Item id="detail">需求详情</Breadcrumbs.Item>}
          </Breadcrumbs>
        </>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <a id={aiSettingsTriggerId} href={aiSettingsRoute} aria-label="AI 设置" aria-current={aiSettingsOpen ? 'page' : undefined}
              className={buttonVariants({ variant: aiSettingsOpen ? 'secondary' : 'ghost', size: 'icon-sm' })} onClick={event => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                onAISettings()
              }}><Bot aria-hidden="true" /></a>
          </TooltipTrigger>
          <TooltipContent side="bottom">AI 设置</TooltipContent>
        </Tooltip>
        <AppearancePicker loaded={loaded} onError={onActionError} />
      </div>
    </header>
  )
}
