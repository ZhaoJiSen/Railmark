import { Description } from '@heroui/react/description'
import { Label } from '@heroui/react/label'
import { ListBox } from '@heroui/react/list-box'
import { ArrowLeft, ChevronRight, Folder, FolderPlus, GitBranch, Pencil, Tag } from 'lucide-react'
import { STATES } from '../../lib/constants'
import type { Project, Requirement, Version } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { ProjectIconAction } from './project-icon-action'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '../ui/item'
import { Status } from './status'

interface ProjectDetailProps {
  project: Project
  requirements: Requirement[]
  versions: Version[]
  onBack: () => void
  backLabel: string
  activeDirectoryId?: number
  onRename: () => void
  onAddDirectory: () => void
  onRequirement: (req: Requirement) => void
  onGit: (request: GitRequest) => void
  importing: boolean
}

export function ProjectDetail(props: ProjectDetailProps) {
  const { project, requirements, versions, onBack, backLabel, activeDirectoryId, onRename, onAddDirectory, onRequirement, onGit, importing } = props
  const associations = Map.groupBy(requirements.filter(req => req.projects.some(item => item.projectId === project.id)),
    req => req.versionId)

  return (
    <article className="space-y-3">
      <header className="flex items-center gap-2">
        <ProjectIconAction label={backLabel} className="shrink-0 text-muted-foreground" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
        </ProjectIconAction>
        <h1 data-detail-heading tabIndex={-1} className="min-w-0 flex-1 text-2xl font-semibold tracking-tight wrap-anywhere outline-none">{project.name}</h1>
        <div role="group" aria-label="项目操作" className="flex shrink-0 items-center gap-1 pe-2">
          <ProjectIconAction label="重命名项目" tooltipSide="bottom" className="text-muted-foreground" onClick={onRename}>
            <Pencil aria-hidden="true" />
          </ProjectIconAction>
          <ProjectIconAction label="添加目录" tooltipSide="bottom" className="text-muted-foreground" onClick={onAddDirectory} disabled={importing}>
            <FolderPlus aria-hidden="true" />
          </ProjectIconAction>
        </div>
      </header>
      <section aria-labelledby="project-directories">
        <h2 id="project-directories" className="mb-1.5 text-base font-semibold">本地目录</h2>
        <ItemGroup className="divide-y border-y">
          {project.directories.map(dir => (
            <div role="listitem" key={dir.id}>
              <Item size="sm" className="flex-nowrap gap-2 px-2 py-1.5">
                <ItemMedia><Folder aria-hidden="true" className="size-3.5 text-muted-foreground" /></ItemMedia>
                <ItemContent className="min-w-0 gap-0">
                  <ItemTitle className="block select-text font-normal [overflow-wrap:anywhere]">{dir.path}</ItemTitle>
                  {dir.remote && (
                    <ItemDescription className="line-clamp-none select-text font-mono text-wrap [overflow-wrap:anywhere]">
                      {dir.remote}
                    </ItemDescription>
                  )}
                </ItemContent>
                <ItemActions>
                  <ProjectIconAction label={activeDirectoryId === dir.id ? '聚焦 Git 面板' : '查看 Git'}
                    tooltipSide="left"
                    variant={activeDirectoryId === dir.id ? 'secondary' : 'ghost'}
                    aria-expanded={activeDirectoryId === dir.id}
                    aria-controls={activeDirectoryId === dir.id ? 'git-panel' : undefined}
                    onClick={event => {
                      if (activeDirectoryId === dir.id) {
                        document.getElementById('git-panel-title')?.focus({ preventScroll: true })
                      } else {
                        event.currentTarget.focus({ preventScroll: true })
                        onGit({ directoryId: dir.id, name: project.name, path: dir.path })
                      }
                    }}>
                    <GitBranch aria-hidden="true" />
                  </ProjectIconAction>
                </ItemActions>
              </Item>
            </div>
          ))}
        </ItemGroup>
      </section>
      <section aria-labelledby="project-requirements">
        <h2 id="project-requirements" className="mb-1.5 text-base font-semibold">关联版本与需求</h2>
        {associations.size ? (
          <div className="space-y-2">
            {versions.filter(version => associations.has(version.id)).map(version => (
              <section key={version.id}>
                <h3 id={`project-version-${version.id}`} className="flex items-center gap-1.5 py-1.5 ps-1 font-mono text-xs font-medium text-muted-foreground">
                  <Tag aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="min-w-0 wrap-anywhere">{version.name}</span>
                </h3>
                <ListBox aria-labelledby={`project-version-${version.id}`} selectionMode="none">
                  {associations.get(version.id)?.map(req => {
                    const links = req.projects.filter(link => link.projectId === project.id)
                    const branches = [...new Set(links.map(link => link.branch || '分支待绑定'))].join(' · ')
                    return (
                      <ListBox.Item key={req.id} id={req.id} textValue={req.title} onAction={() => onRequirement(req)}>
                        <div id={`project-requirement-${req.id}`} className="min-w-0 flex-1">
                          <Label className="block max-w-full wrap-anywhere font-medium">{req.title}</Label>
                          <Description className="block font-mono wrap-anywhere" title={branches}>
                            <span className="sr-only">{STATES.find(state => state.id === req.state)?.label ?? req.state}，</span>
                            {branches}
                          </Description>
                        </div>
                        <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
                          <Status state={req.state} />
                          <ChevronRight aria-hidden="true" className="size-3 text-muted-foreground" />
                        </span>
                      </ListBox.Item>
                    )
                  })}
                </ListBox>
              </section>
            ))}
          </div>
        ) : <p className="text-muted-foreground">暂无关联需求</p>}
      </section>
    </article>
  )
}
