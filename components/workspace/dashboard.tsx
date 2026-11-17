import { ChevronRight, ClipboardList, FolderGit2, Layers3, Plus } from 'lucide-react'
import type { Workspace } from '../../lib/mygo'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../ui/empty'
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '../ui/item'
import { Separator } from '../ui/separator'
import { DashboardVersions } from './dashboard-versions'

interface DashboardProps {
  data: Workspace
  onCreate: () => void
  onVersion: (id: number) => void
  onProjects: () => void
  onProject: (id: number) => void
}

export function Dashboard({ data, onCreate, onVersion, onProjects, onProject }: DashboardProps) {
  const { versions, requirements, projects } = data
  const active = new Set(versions.filter(version => version.state === 'open').map(version => version.id))
  const pending = requirements.filter(requirement => requirement.state !== 'done').length
  const metrics = [
    { label: '进行中的版本', value: active.size, icon: Layers3 },
    { label: '未完成的需求', value: pending, icon: ClipboardList },
    { label: '本地项目', value: projects.length, icon: FolderGit2 },
  ]

  return (
    <section className="@container min-w-0">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">版本工作台</h1>
        <Button type="button" size="sm" onClick={onCreate}><Plus />新建版本</Button>
      </header>

      <Card className="mb-3 gap-0 py-0">
        <CardContent className="px-0">
          <dl aria-label="工作区概况" className="grid divide-y @min-[25rem]:grid-cols-3 @min-[25rem]:divide-x @min-[25rem]:divide-y-0">
            {metrics.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 py-2.5 @min-[25rem]:grid">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon aria-hidden="true" className="size-4 shrink-0" />{label}
                </dt>
                <dd className="text-2xl leading-none font-semibold tracking-tight tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="grid items-start gap-3 @min-[44rem]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DashboardVersions versions={versions} requirements={requirements} onVersion={onVersion} />
        <Card aria-labelledby="dashboard-projects" className="gap-0 py-0">
          <CardHeader className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-3 py-1.5">
            <CardTitle id="dashboard-projects" role="heading" aria-level={2}>项目库</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={onProjects} className="-me-1.5 text-muted-foreground">
              {projects.length ? '查看全部' : '去项目库导入'}<ChevronRight aria-hidden="true" className="size-3" />
            </Button>
          </CardHeader>
          <Separator />
          {projects.length ? (
            <ItemGroup className="divide-y px-1">
              {projects.slice(0, 4).map(project => (
                <div role="listitem" key={project.id}>
                  <Item size="sm" asChild>
                    <Button type="button" variant="ghost" className="h-auto min-h-9 w-full gap-2 px-2 py-1.5 text-start" onClick={() => onProject(project.id)}>
                      <ItemMedia><FolderGit2 aria-hidden="true" className="size-3.5 text-muted-foreground" /></ItemMedia>
                      <ItemContent className="min-w-0 gap-0">
                        <ItemTitle className="block truncate" title={project.name}>{project.name}</ItemTitle>
                      </ItemContent>
                      <ItemActions className="text-xs font-normal tabular-nums text-muted-foreground">
                        {project.directories.length} 个目录
                      </ItemActions>
                    </Button>
                  </Item>
                </div>
              ))}
            </ItemGroup>
          ) : (
            <Empty className="items-start p-3 text-start text-pretty md:p-3">
              <EmptyHeader className="items-start gap-1 text-start">
                <EmptyTitle className="text-sm">暂无本地项目</EmptyTitle>
                <EmptyDescription>导入目录后，即可在新建需求时关联。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </Card>
      </div>
    </section>
  )
}
