import { Description } from '@heroui/react/description'
import { Label } from '@heroui/react/label'
import { ListBox } from '@heroui/react/list-box'
import type { Workspace } from '../../lib/mygo'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../ui/empty'
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
    { label: '进行中的版本', value: active.size },
    { label: '未完成的需求', value: pending },
    { label: '本地项目', value: projects.length },
  ]

  return (
    <section className="@container grid min-w-0 gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">版本工作台</h1>
        <Button type="button" size="sm" onClick={onCreate}>新建版本</Button>
      </header>

      <Card variant="secondary" className="py-2">
        <CardContent>
          <dl aria-label="工作区概况" className="grid divide-y @min-[25rem]:grid-cols-3 @min-[25rem]:divide-x @min-[25rem]:divide-y-0">
            {metrics.map(({ label, value }) => (
              <div key={label} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 py-2.5 @min-[25rem]:grid">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-2xl leading-none font-semibold tracking-tight tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="grid items-start gap-3 @min-[44rem]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DashboardVersions versions={versions} requirements={requirements} onVersion={onVersion} />
        <Card variant="secondary" aria-labelledby="dashboard-projects" className="min-w-0 gap-2 px-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 ps-3">
            <CardTitle id="dashboard-projects" role="heading" aria-level={2}>项目库</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={onProjects}>
              {projects.length ? '查看全部' : '去项目库导入'}
            </Button>
          </CardHeader>
          {projects.length ? (
            <ListBox aria-labelledby="dashboard-projects" selectionMode="none">
              {projects.slice(0, 4).map(project => (
                <ListBox.Item key={project.id} id={project.id} textValue={project.name}
                  onAction={() => onProject(project.id)}>
                  <div className="min-w-0 flex-1" title={project.name}>
                    <Label className="block max-w-full truncate font-medium">{project.name}</Label>
                  </div>
                  <Description className="shrink-0 whitespace-nowrap text-xs tabular-nums">
                    {project.directories.length} 个目录
                  </Description>
                </ListBox.Item>
              ))}
            </ListBox>
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
