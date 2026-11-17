import { ArrowLeft, ChevronRight, Folder, FolderPlus, GitBranch, Pencil } from 'lucide-react'
import type { Project, Requirement, Version } from '../../lib/mygo'
import type { GitRequest } from '../../lib/types'
import { Button } from '../ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '../ui/item'
import { Status } from './status'

interface ProjectDetailProps {
  project: Project
  requirements: Requirement[]
  versions: Version[]
  onBack: () => void
  activeDirectoryId?: number
  onRename: () => void
  onAddDirectory: () => void
  onRequirement: (req: Requirement) => void
  onGit: (request: GitRequest) => void
  importing: boolean
}

export function ProjectDetail(props: ProjectDetailProps) {
  const { project, requirements, versions, onBack, activeDirectoryId, onRename, onAddDirectory, onRequirement, onGit, importing } = props
  const associations = Map.groupBy(requirements.filter(req => req.projects.some(item => item.projectId === project.id)),
    req => req.versionId)

  return (
    <article className="space-y-3">
      <header>
        <Button type="button" variant="ghost" size="sm" className="-ms-1.5 mb-1 text-muted-foreground" onClick={onBack}>
          <ArrowLeft />返回本地项目
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <h1 data-detail-heading tabIndex={-1} className="min-w-0 text-2xl font-semibold tracking-tight wrap-anywhere outline-none">{project.name}</h1>
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onRename}><Pencil />重命名</Button>
        </div>
      </header>
      <section aria-labelledby="project-directories">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h2 id="project-directories" className="text-base font-semibold">本地目录</h2>
          <Button type="button" size="sm" variant="outline" onClick={onAddDirectory} disabled={importing}><FolderPlus />添加目录</Button>
        </div>
        <ItemGroup className="divide-y border-y">
          {project.directories.map(dir => (
            <div role="listitem" key={dir.id}>
              <Item size="sm" className="gap-2 px-2 py-1.5">
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
                  <Button type="button" variant={activeDirectoryId === dir.id ? 'secondary' : 'ghost'} size="sm"
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
                    <GitBranch />查看 Git
                  </Button>
                </ItemActions>
              </Item>
            </div>
          ))}
        </ItemGroup>
      </section>
      <section aria-labelledby="project-requirements">
        <h2 id="project-requirements" className="mb-1.5 text-base font-semibold">关联版本与需求</h2>
        {associations.size ? (
          <div className="divide-y border-y">
            {versions.filter(version => associations.has(version.id)).map(version => (
              <section key={version.id}>
                <h3 className="bg-muted/50 px-2 py-1.5 font-mono text-xs font-medium [overflow-wrap:anywhere]">{version.name}</h3>
                <ul className="divide-y">
                  {associations.get(version.id)?.map(req => {
                    const links = req.projects.filter(link => link.projectId === project.id)
                    const branches = [...new Set(links.map(link => link.branch || '分支待绑定'))]
                    return (
                      <li key={req.id}>
                        <Button id={`project-requirement-${req.id}`} type="button" variant="ghost" size="sm" className="h-auto min-h-8 w-full gap-2 px-2 py-1.5 whitespace-normal text-start"
                          onClick={() => onRequirement(req)}>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium [overflow-wrap:anywhere]">{req.title}</span>
                            <span className="font-mono text-xs [overflow-wrap:anywhere] block text-muted-foreground">{branches.join(' · ')}</span>
                          </span>
                          <Status state={req.state} />
                          <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : <p className="text-muted-foreground">暂无关联需求</p>}
      </section>
    </article>
  )
}
