import { ArrowDown } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { FieldSet } from '../ui/field'
import { ErrorLine } from '../ui/form-parts'
import { Kbd } from '../ui/kbd'
import { Spinner } from '../ui/spinner'
import { ScrollArea } from '../ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../ui/sheet'

import { DiscardChangesDialog } from './discard-changes-dialog'
import { useEditorScroll } from './use-editor-scroll'

const toolbarInset = 'top-[max(3rem,var(--mygo-titlebar-height,0px))]'

type SubmitEditor = (event: FormEvent<HTMLFormElement>) => Promise<(() => void) | undefined>

export function EditorSheet({ title, description, submitLabel, busy, dirty, error, wide, children, onClose, onSubmit }: {
  title: string
  description?: string
  submitLabel: string
  busy: boolean
  dirty: boolean
  error: string
  wide?: boolean
  children: ReactNode
  onClose: () => void
  onSubmit: SubmitEditor
}) {
  const [open, setOpen] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const { setViewport, more } = useEditorScroll()
  const opener = useRef<HTMLElement>(null)
  const afterClose = useRef<(() => void) | null>(null)

  function cancel(): void {
    if (dirty) setConfirming(true)
    else close(onClose)
  }

  function close(action: () => void): void {
    afterClose.current = action
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={next => { if (!next && !busy && open && !confirming) cancel() }}>
      <SheetContent side="right" showCloseButton={!busy} onInteractOutside={event => event.preventDefault()}
        onEscapeKeyDown={event => {
          if (event.isComposing || (event.target instanceof Element && event.target.closest('[data-editor-picker]'))) {
            event.preventDefault()
          }
        }}
        onOpenAutoFocus={() => {
          if (document.activeElement instanceof HTMLElement) opener.current = document.activeElement
        }}
        onCloseAutoFocus={event => {
          event.preventDefault()
          if (opener.current?.isConnected) opener.current.focus({ preventScroll: true })
          const action = afterClose.current
          afterClose.current = null
          action?.()
        }}
        {...(!description && { 'aria-describedby': undefined })}
        overlayClassName={cn(toolbarInset, 'bg-black/20 data-[state=closed]:duration-120 data-[state=open]:duration-180 motion-reduce:animate-none! dark:bg-black/40')}
        className={cn(
          toolbarInset, 'bottom-0 h-auto w-full gap-0 overflow-hidden p-0 motion-reduce:animate-none!',
          'data-[state=open]:duration-220 data-[state=open]:ease-out',
          'data-[state=closed]:pointer-events-none data-[state=closed]:duration-140 data-[state=closed]:ease-in',
          wide ? 'max-w-[34rem] sm:max-w-[34rem]' : 'max-w-md sm:max-w-md',
        )}>
        <SheetHeader className="shrink-0 gap-1 border-b px-4 py-3 pe-11">
          <SheetTitle className="text-base">{title}</SheetTitle>
          {description && <SheetDescription className="wrap-anywhere text-xs">{description}</SheetDescription>}
        </SheetHeader>
        <form className="flex min-h-0 flex-1 flex-col"
          onKeyDown={event => {
            if (!open || busy || event.defaultPrevented || event.nativeEvent.isComposing
              || event.repeat || !(event.metaKey || event.ctrlKey) || event.key !== 'Enter'
              || !(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return
            event.preventDefault()
            event.currentTarget.requestSubmit()
          }}
          onSubmit={async event => {
            if (!open) {
              event.preventDefault()
              return
            }
            const saved = await onSubmit(event)
            if (saved) close(saved)
          }}>
          <ScrollArea type="hover" scrollbarSize="thin"
            viewportProps={{ ref: setViewport, className: 'h-auto min-w-0 [&>div]:block!' }}
            className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] overflow-hidden">
            <FieldSet disabled={busy} className="@container w-full min-w-0 gap-3 px-4 py-3">
              {children}
            </FieldSet>
          </ScrollArea>
          {error && <div className="shrink-0 px-4 pb-2.5"><ErrorLine message={error} /></div>}
          <SheetFooter className="shrink-0 flex-row flex-wrap items-center justify-end border-t bg-muted/40 px-4 py-2.5">
            {more && (
              <span aria-hidden="true" className="me-auto flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowDown className="size-3" />下方还有字段
              </span>
            )}
            <Button variant="outline" type="button" onClick={cancel} disabled={busy || !open}>取消</Button>
            <Button type="submit" className="active:bg-primary/80" disabled={busy || !open} aria-keyshortcuts="Meta+Enter Control+Enter">
              {busy && <Spinner aria-hidden="true" className="size-3.5" />}
              {busy ? '正在保存…' : submitLabel}
              {!busy && <Kbd aria-hidden="true" className="bg-primary-foreground/15 text-current">⌘↵</Kbd>}
            </Button>
          </SheetFooter>
        </form>
        {confirming && <DiscardChangesDialog onKeep={() => setConfirming(false)} onDiscard={() => {
          setConfirming(false)
          close(onClose)
        }} />}
      </SheetContent>
    </Sheet>
  )
}
