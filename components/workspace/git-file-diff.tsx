import { lazy, Suspense, useEffect, useState } from 'react'
import type { GitFilePatch } from '../../lib/mygo'
import { Desk } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { ErrorLine } from '../ui/form-parts'
import { Spinner } from '../ui/spinner'
import { GitScrollArea } from './git-scroll-area'

const GitPatchView = lazy(() => import('./git-patch-view'))

function PatchLoading() {
  return (
    <p role="status" className="flex items-center gap-1.5 p-2 text-muted-foreground">
      <Spinner aria-hidden="true" />正在读取文件差异…
    </p>
  )
}

export function GitFileDiff({ directoryId, hash, index, path }: {
  directoryId: number
  hash: string
  index: number
  path: string
}) {
  const [data, setData] = useState<GitFilePatch>()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Desk.gitFilePatch(directoryId, hash, index).then(result => {
      if (active) setData(result)
    }).catch(error => {
      if (active) setError(readableError(error))
    })
    return () => { active = false }
  }, [directoryId, hash, index])

  return (
    <section aria-label={`${path} 的差异`} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <h4 className="hidden shrink-0 truncate border-b bg-default/25 px-2.5 py-1.5 font-mono font-medium @min-[32rem]/git-details:block" title={path}>{path}</h4>
      <GitScrollArea horizontal className="flex-1 select-text"
        viewportProps={{ tabIndex: 0, role: 'region', 'aria-label': '文件差异内容' }}>
        {error && <div className="p-2"><ErrorLine message={error} /></div>}
        {!data && !error && <PatchLoading />}
        {data?.issue && <p className="p-2 text-muted-foreground">{data.issue}</p>}
        {data && !data.issue && (
          data.patch ? (
            <Suspense fallback={<PatchLoading />}>
              <GitPatchView patch={data.patch} />
            </Suspense>
          ) : <p className="p-2 text-muted-foreground">此文件没有文本差异</p>
        )}
      </GitScrollArea>
    </section>
  )
}
