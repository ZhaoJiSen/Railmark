import { ChevronRight, Copy, Folder, GitBranch, History, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { GitBranch as Branch, GitSnapshot } from '../../lib/mygo'
import { cn } from '../../lib/utils'
import { matchesQuery } from '../../lib/workspace-data'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../ui/context-menu'
import { ErrorLine } from '../ui/form-parts'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { GitScrollArea } from './git-scroll-area'

interface BranchFolder {
  branches: Branch[]
  folders: Map<string, BranchFolder>
}

function buildBranchTree(branches: Branch[]): BranchFolder {
  const root: BranchFolder = { branches: [], folders: new Map() }
  for (const branch of branches) {
    let node = root
    for (const segment of branch.name.split('/').slice(0, -1)) {
      let folder = node.folders.get(segment)
      if (!folder) {
        folder = { branches: [], folders: new Map() }
        node.folders.set(segment, folder)
      }
      node = folder
    }
    node.branches.push(branch)
  }
  return root
}

interface BranchActions {
  onSelect: (ref: string) => void
  onCopy: (value: string) => void
}

export function GitBranches({ snapshot, selectedRef, boundRef, onSelect, onCopy }: BranchActions & {
  snapshot: GitSnapshot
  selectedRef: string
  boundRef?: string
}) {
  const [query, setQuery] = useState('')
  const currentRef = snapshot.branch ? 'refs/heads/' + snapshot.branch : ''
  const activeRef = selectedRef || currentRef
  const filtered = snapshot.branches.filter(branch => matchesQuery(query, branch.name))
  const local = filtered.filter(branch => !branch.remote)
  const remote = filtered.filter(branch => branch.remote)

  return (
    <section aria-label="Git 分支" className="@container/git-branches flex h-full min-h-0 min-w-0 flex-col bg-sidebar">
      <header className="shrink-0 space-y-1.5 border-b px-2.5 py-2">
        <h3 className="font-medium">分支</h3>
        <InputGroup>
          <InputGroupInput aria-label="搜索 Git 分支" placeholder="搜索分支" className="min-w-0 @max-[10rem]/git-branches:ps-1.5" value={query}
            onChange={event => setQuery(event.target.value)} />
          <InputGroupAddon className="@max-[10rem]/git-branches:hidden"><Search aria-hidden="true" /></InputGroupAddon>
        </InputGroup>
      </header>
      <GitScrollArea className="flex-1">
        <div className="space-y-2 p-1.5">
          <ErrorLine message={snapshot.branchesIssue} />
          {!snapshot.branches.some(branch => branch.ref === currentRef) && (
            <Button type="button" size="sm" variant={selectedRef ? 'ghost' : 'secondary'} aria-pressed={!selectedRef}
              className="w-full justify-start" onClick={() => onSelect('')}>
              <GitBranch />{snapshot.branch || (snapshot.head ? '分离 HEAD' : '未产生提交')}
            </Button>
          )}
          {[{ label: '本地分支', refs: local, prefix: 'refs/heads/' },
            { label: '远程跟踪', refs: remote, prefix: 'refs/remotes/' }].map(({ label, refs, prefix }) => (
            refs.length > 0 && (
              <section key={prefix} aria-label={label}>
                <h4 className="flex items-center justify-between gap-1 px-1.5 pb-1 text-xs font-medium text-muted-foreground">
                  {label}<span className="tabular-nums">{refs.length}</span>
                </h4>
                <BranchTree key={query.trim()} node={buildBranchTree(refs)} prefix={prefix}
                  current={currentRef} active={activeRef} boundRef={boundRef} searching={Boolean(query.trim())}
                  onSelect={ref => onSelect(ref === currentRef ? '' : ref)} onCopy={onCopy} />
              </section>
            )
          ))}
          {!filtered.length && !snapshot.branchesIssue && (
            <p className="px-1.5 py-1 text-xs text-muted-foreground">{query.trim() ? '没有匹配的分支' : '暂无分支'}</p>
          )}
        </div>
      </GitScrollArea>
    </section>
  )
}

function BranchTree({ node, prefix, current, active, boundRef, searching, onSelect, onCopy }: BranchActions & {
  node: BranchFolder
  prefix: string
  current: string
  active: string
  boundRef?: string
  searching: boolean
}) {
  return (
    <ul className="min-w-0">
      {Array.from(node.folders, ([label, folder]) => {
        const folderPrefix = prefix + label + '/'
        return (
          <li key={label}>
            <BranchFolderToggle active={active} prefix={folderPrefix} initiallyOpen={searching || current.startsWith(folderPrefix)}>
              <CollapsibleTrigger asChild>
                <Button type="button" size="xs" variant="ghost" className="group w-full justify-start">
                  <ChevronRight aria-hidden="true" className="size-3 group-aria-expanded:rotate-90 motion-safe:transition-transform" />
                  <Folder aria-hidden="true" className="text-muted-foreground @max-[10rem]/git-branches:hidden" />
                  <span className="truncate" title={label}>{label}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ms-2 border-s ps-1 @max-[10rem]/git-branches:ms-1 @max-[10rem]/git-branches:ps-0">
                <BranchTree node={folder} prefix={folderPrefix} current={current} active={active} boundRef={boundRef}
                  searching={searching} onSelect={onSelect} onCopy={onCopy} />
              </CollapsibleContent>
            </BranchFolderToggle>
          </li>
        )
      })}
      {node.branches.map(branch => (
        <li key={branch.ref}>
          <ContextMenu>
            <Tooltip delayDuration={300}>
              <ContextMenuTrigger asChild>
                <TooltipTrigger asChild>
                  <Button type="button" size="xs" variant={branch.ref === active ? 'secondary' : 'ghost'}
                    className="w-full justify-start select-none active:bg-accent" aria-pressed={branch.ref === active}
                    aria-label={branch.name + (branch.ref === current ? '，本地检出' : '') + (branch.ref === boundRef ? '，需求绑定' : '')}
                    onClick={() => onSelect(branch.ref)}>
                    <GitBranch aria-hidden="true" className={cn('text-muted-foreground',
                      branch.ref === current && '@max-[10rem]/git-branches:text-indigo-700 dark:@max-[10rem]/git-branches:text-indigo-300')} />
                    <span className="min-w-0 flex-1 truncate text-start font-mono">{branch.name.split('/').at(-1)}</span>
                    {branch.ref === current && (
                      <Badge variant="outline" aria-hidden="true"
                        className="px-1 py-0 text-muted-foreground @max-[10rem]/git-branches:hidden">检出</Badge>
                    )}
                      {branch.ref === boundRef && branch.ref !== current && (
                        <Badge variant="outline" aria-hidden="true"
                      className="px-1 py-0 text-muted-foreground @max-[10rem]/git-branches:hidden">绑定</Badge>
                  )}
                  </Button>
                </TooltipTrigger>
              </ContextMenuTrigger>
              <TooltipContent side="right" className="max-w-72 wrap-anywhere data-[state=closed]:animate-none! motion-reduce:animate-none!">
                <span className="font-mono">{branch.name}</span>
                {branch.ref === current && <span className="ms-2">本地检出</span>}
                {branch.ref === boundRef && <span className="ms-2">需求绑定</span>}
              </TooltipContent>
            </Tooltip>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => onSelect(branch.ref)}><History />查看提交</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => onCopy(branch.name)}><Copy />复制分支名</ContextMenuItem>
              <ContextMenuItem onSelect={() => onCopy(branch.ref)}><Copy />复制完整引用</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </li>
      ))}
    </ul>
  )
}

function BranchFolderToggle({ active, prefix, initiallyOpen, children }: {
  active: string
  prefix: string
  initiallyOpen: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(initiallyOpen || active.startsWith(prefix))
  useEffect(() => {
    if (active.startsWith(prefix)) setOpen(true)
  }, [active, prefix])
  return <Collapsible open={open} onOpenChange={setOpen}>{children}</Collapsible>
}
