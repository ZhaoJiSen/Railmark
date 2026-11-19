import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'

export function AutomationProgress({ status, onCancel }: { status: string; onCancel?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Spinner aria-hidden="true" />{status}
      </span>
      {onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>停止</Button>}
    </div>
  )
}
