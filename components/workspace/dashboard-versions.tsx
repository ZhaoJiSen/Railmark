import { Layers3 } from 'lucide-react'
import type { Requirement, Version } from '../../lib/mygo'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle } from '../ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty'
import { Progress } from '../ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { VersionStatus } from './status'

export function DashboardVersions({ versions, requirements, onVersion }: {
  versions: Version[]
  requirements: Requirement[]
  onVersion: (id: number) => void
}) {
  const byVersion = Map.groupBy(requirements, item => item.versionId)
  return (
    <Card aria-labelledby="dashboard-versions" className="@container/version-progress min-w-0 gap-0 py-0">
      <CardHeader className="flex min-h-11 items-center px-3 py-1.5">
        <CardTitle id="dashboard-versions" role="heading" aria-level={2}>版本进度</CardTitle>
      </CardHeader>
      <Table aria-label="版本进度" className="table-fixed border-t">
        <TableHeader className="bg-muted/20 [&_th]:h-8 [&_th]:text-xs [&_th]:text-muted-foreground">
          <TableRow>
            <TableHead className="w-[55%] ps-4 @min-[25rem]/version-progress:w-[44%]">版本</TableHead>
            <TableHead>需求进度</TableHead>
            <TableHead className="hidden w-27 pe-3 @min-[25rem]/version-progress:table-cell">发布日期</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map(version => {
            const items = byVersion.get(version.id) ?? []
            const done = items.filter(item => item.state === 'done').length
            return (
              <TableRow key={version.id}>
                <TableCell className="py-1 ps-3 whitespace-normal">
                  <Button type="button" variant="ghost" size="sm" title={version.name}
                    className="h-auto min-h-7 max-w-full flex-wrap justify-start gap-x-2 gap-y-0.5 px-1 py-0.5" onClick={() => onVersion(version.id)}>
                    <span className="min-w-0 truncate font-mono">{version.name}</span>
                    <VersionStatus state={version.state} />
                  </Button>
                  {version.releaseDate && <p className="ms-1 text-xs text-muted-foreground @min-[25rem]/version-progress:hidden">{version.releaseDate}</p>}
                </TableCell>
                <TableCell className="text-xs whitespace-normal text-muted-foreground tabular-nums">
                  {items.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span><span className="font-medium text-foreground">{done}</span> / {items.length} 已完成</span>
                      <Progress aria-label={`${version.name} 需求完成进度`} className="w-12" value={done * 100 / items.length} />
                    </div>
                  ) : '暂无需求'}
                </TableCell>
                <TableCell className="hidden pe-3 text-xs text-muted-foreground tabular-nums @min-[25rem]/version-progress:table-cell">
                  {version.releaseDate || '未安排'}
                </TableCell>
              </TableRow>
            )
          })}
          {!versions.length && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className="p-0 whitespace-normal">
                <Empty className="flex-row justify-start gap-2.5 px-3 py-3 text-start md:p-3">
                  <EmptyMedia variant="icon" className="mb-0"><Layers3 /></EmptyMedia>
                  <EmptyHeader className="min-w-0 items-start gap-1 text-start">
                    <EmptyTitle>暂无版本</EmptyTitle>
                    <EmptyDescription>新建版本后，即可添加需求和关联本地项目。</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
