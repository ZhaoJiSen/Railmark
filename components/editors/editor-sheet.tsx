import { Tooltip } from '@heroui/react/tooltip'
import { ArrowDown, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { FieldSet } from '../ui/field'
import { ErrorLine } from '../ui/form-parts'
import { Spinner } from '../ui/spinner'
import { ScrollArea } from '../ui/scroll-area'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../ui/sheet'

import { DiscardChangesDialog } from './discard-changes-dialog'
import { useEditorScroll } from './use-editor-scroll'


type SubmitEditor = (event: FormEvent<HTMLFormElement>) => Promise<(() => void) | undefined>

export function EditorSheet({ title, description, headerAction, submitLabel, cancelLabel = '取消', busy,
  submitDisabled, footerActions, dirty, error, wide, initialFocus, children, onBack, onClose, onInterrupt, onSubmit }: {
  title: string
  description?: string
  headerAction?: ReactNode
  submitLabel: string
  cancelLabel?: string
  busy: boolean
  submitDisabled?: boolean
  footerActions?: ReactNode
  dirty: boolean
  error: string
  wide?: boolean
  initialFocus?: string
  children: ReactNode
  onBack?: () => void
  onClose: () => void
  onInterrupt?: () => void
  onSubmit: SubmitEditor
}) {
  const [open, setOpen] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const { setViewport, more } = useEditorScroll()
  const opener = useRef<HTMLElement>(null)
  const afterClose = useRef<(() => void) | null>(null)
  const canDismiss = !busy && !onInterrupt
  const canSubmit = open && !busy && !submitDisabled

  function cancel(): void {
    if (dirty) setConfirming(true)
    else close(onClose)
  }

  function close(action: () => void): void {
    afterClose.current = action
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={next => { if (!next && canDismiss && open && !confirming) cancel() }}>
      <SheetContent side="right" showCloseButton={canDismiss && !headerAction} onInteractOutside={event => event.preventDefault()}
        onEscapeKeyDown={event => {
          if (!canDismiss || event.isComposing || (event.target instanceof Element && event.target.closest('[data-editor-picker]'))) {
            event.preventDefault()
          } else if (onBack) {
            event.preventDefault()
            onBack()
          }
        }}
        onOpenAutoFocus={event => {
          if (document.activeElement instanceof HTMLElement) opener.current = document.activeElement
          const focus = initialFocus && document.getElementById(initialFocus)
          if (focus) {
            event.preventDefault()
            focus.focus()
          }
        }}
        onCloseAutoFocus={event => {
          event.preventDefault()
          if (opener.current?.isConnected) opener.current.focus({ preventScroll: true })
          const action = afterClose.current
          afterClose.current = null
          action?.()
        }}
        {...(!description && { 'aria-describedby': undefined })}
        className={cn('w-full overflow-hidden', wide ? 'max-w-[38rem]' : 'max-w-lg')}>
        <SheetHeader className="shrink-0">
          {headerAction ? (
            <div className="flex min-w-0 items-center gap-2">
              <SheetTitle className="min-w-0 flex-1 wrap-anywhere">{title}</SheetTitle>
              {headerAction}
              {canDismiss && (
                <SheetClose asChild>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="关闭">
                    <X aria-hidden="true" />
                  </Button>
                </SheetClose>
              )}
            </div>
          ) : <SheetTitle>{title}</SheetTitle>}
          {description && <SheetDescription className="wrap-anywhere text-xs">{description}</SheetDescription>}
        </SheetHeader>
        <form className="flex min-h-0 flex-1 flex-col"
          aria-keyshortcuts={canSubmit ? 'Meta+Enter Control+Enter' : undefined}
          onKeyDown={event => {
            if (!canSubmit || event.defaultPrevented || event.nativeEvent.isComposing
              || event.repeat || !(event.metaKey || event.ctrlKey) || event.key !== 'Enter'
              || !(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return
            event.preventDefault()
            event.currentTarget.requestSubmit()
          }}
          onSubmit={async event => {
            if (!open || submitDisabled) {
              event.preventDefault()
              return
            }
            const saved = await onSubmit(event)
            if (saved) close(saved)
          }}>
          <ScrollArea type="hover" scrollbarSize="thin"
            viewportProps={{ ref: setViewport, className: 'h-auto min-w-0 [&>div]:block!' }}
            className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] overflow-hidden">
            <FieldSet disabled={busy} className="@container w-full min-w-0 gap-4 px-6 py-4">
              {children}
            </FieldSet>
          </ScrollArea>
          {error && !footerActions && <div className="shrink-0 px-4 pb-2.5"><ErrorLine message={error} /></div>}
          <SheetFooter className="shrink-0 flex-row flex-wrap items-center justify-end">
            {more && (
              <span aria-hidden="true" className="me-auto flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowDown className="size-3" />{footerActions ? '下方还有内容' : '下方还有字段'}
              </span>
            )}
            {footerActions ?? <>
              <Button variant="ghost" type="button" onClick={onInterrupt ?? cancel} disabled={busy || !open}>{cancelLabel}</Button>
              <Tooltip delay={400} isDisabled={!canSubmit}>
                <Button type="submit" disabled={!canSubmit}>
                  {busy && <Spinner aria-hidden="true" />}
                  {busy ? '正在保存…' : submitLabel}
                </Button>
                <Tooltip.Content>快捷提交（⌘ + Enter 或 Ctrl + Enter）</Tooltip.Content>
              </Tooltip>
            </>}
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
