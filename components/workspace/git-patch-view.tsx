import { type CSSProperties, useMemo } from 'react'
import { Diff, Hunk, parseDiff } from 'react-diff-view'
import 'react-diff-view/style/index.css'
import styles from './git-patch.module.css'

export default function GitPatchView({ patch }: { patch: string }) {
  const files = useMemo(() => {
    try {
      return parseDiff(patch)
    } catch {
      return []
    }
  }, [patch])
  const file = files[0]

  if (file?.isBinary || /^Binary files .* differ$/m.test(patch)) {
    return <p className="p-2 text-muted-foreground">二进制文件已改动</p>
  }
  if (files.length !== 1 || !file?.hunks.length) {
    return <pre className="whitespace-pre-wrap p-2 font-mono wrap-anywhere">{patch}</pre>
  }

  const lastLine = file.hunks.reduce((lastLine, hunk) => Math.max(
    lastLine, hunk.oldStart + hunk.oldLines - 1, hunk.newStart + hunk.newLines - 1,
  ), 0)
  const gutterDigits = Math.max(4, String(lastLine).length)
  return (
    <div className={styles.patch} style={{ '--git-diff-gutter-digits': gutterDigits } as CSSProperties}>
      <Diff viewType="unified" diffType={file.type} hunks={file.hunks}>
        {hunks => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
      </Diff>
    </div>
  )
}
