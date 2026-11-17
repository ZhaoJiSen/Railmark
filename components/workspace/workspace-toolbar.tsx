import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { SidebarTrigger } from '../ui/sidebar'
import { AppearancePicker } from './appearance-picker'
import styles from './workspace.module.scss'

export function WorkspaceToolbar({ area, context, details, onHome, onContext, loaded, onActionError }: {
  area: string
  context?: string
  details: boolean
  onHome: () => void
  onContext?: () => void
  loaded: boolean
  onActionError: (message: string) => void
}) {
  return (
    <header className={`${styles.toolbar} shrink-0 border-b bg-background`}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="hidden font-semibold select-none min-[650px]:inline">Railmark</span>
        <SidebarTrigger aria-label="切换侧栏" />
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
        <Breadcrumb aria-label="当前位置" className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              {context ? (
                <Button type="button" variant="link" className="h-auto shrink-0 p-0 font-normal text-muted-foreground" onClick={onHome}>
                  {area}
                </Button>
              ) : <BreadcrumbPage>{area}</BreadcrumbPage>}
            </BreadcrumbItem>
            {context && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  {onContext ? (
                    <Button type="button" variant="link" className="h-auto min-w-0 p-0 font-normal text-muted-foreground" onClick={onContext}>
                      <span className="truncate">{context}</span>
                    </Button>
                  ) : <BreadcrumbPage className="truncate font-medium">{context}</BreadcrumbPage>}
                </BreadcrumbItem>
              </>
            )}
            {details && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>需求详情</BreadcrumbPage></BreadcrumbItem></>}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="shrink-0">
        <AppearancePicker loaded={loaded} onError={onActionError} />
      </div>
    </header>
  )
}
