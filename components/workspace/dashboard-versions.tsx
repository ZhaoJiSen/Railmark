import { Table } from '@heroui/react/table'
import type { Requirement, Version } from '../../lib/mygo'
import { Card, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { VersionStatus } from './status'

export function DashboardVersions({ versions, requirements, onVersion }: {
  versions: Version[]
  requirements: Requirement[]
  onVersion: (id: number) => void
}) {
  const byVersion = Map.groupBy(requirements, item => item.versionId)
  return (
    <Card variant="transparent" aria-labelledby="dashboard-versions" className="min-w-0 px-0">
      <CardHeader className="min-h-8 justify-center">
        <CardTitle id="dashboard-versions" role="heading" aria-level={2}>版本进度</CardTitle>
      </CardHeader>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="版本进度" className="min-w-96 table-fixed">
            <Table.Header>
              <Table.Column isRowHeader>版本</Table.Column>
              <Table.Column className="w-24">状态</Table.Column>
              <Table.Column className="w-[27%]">需求进度</Table.Column>
              <Table.Column className="w-28">发布日期</Table.Column>
            </Table.Header>
            <Table.Body renderEmptyState={() => '新建版本后，即可添加需求和关联本地项目。'}>
              {versions.map(version => {
                const items = byVersion.get(version.id) ?? []
                const total = items.length
                const done = items.filter(item => item.state === 'done').length
                return (
                  <Table.Row id={version.id} key={version.id} textValue={version.name}
                    className="cursor-pointer" onAction={() => onVersion(version.id)}>
                    <Table.Cell>
                      <span className="font-medium wrap-anywhere">{version.name}</span>
                    </Table.Cell>
                    <Table.Cell><VersionStatus state={version.state} /></Table.Cell>
                    <Table.Cell className="text-xs text-muted">
                      {total > 0 ? (
                        <div className="flex items-center gap-2">
                          <span aria-hidden="true" className="whitespace-nowrap tabular-nums">{done} / {total}</span>
                          <Progress size="sm" className="min-w-0 max-w-16 flex-1 gap-0"
                            aria-label={`${version.name} 需求完成进度`} valueLabel={`${done} / ${total} 已完成`}
                            value={done} maxValue={total} />
                        </div>
                      ) : '暂无需求'}
                    </Table.Cell>
                    <Table.Cell>{version.releaseDate || '未安排'}</Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </Card>
  )
}
