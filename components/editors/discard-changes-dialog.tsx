import { useRef } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'

export function DiscardChangesDialog({ onKeep, onDiscard }: { onKeep: () => void, onDiscard: () => void }) {
  const opener = useRef<HTMLElement>(null)

  return (
    <Dialog open onOpenChange={open => { if (!open) onKeep() }}>
      <DialogContent role="alertdialog" showCloseButton={false} onInteractOutside={event => event.preventDefault()}
        onOpenAutoFocus={() => {
          if (document.activeElement instanceof HTMLElement) opener.current = document.activeElement
        }}
        onCloseAutoFocus={event => {
          event.preventDefault()
          if (opener.current?.closest('[data-slot="sheet-content"][data-state="open"]')) {
            opener.current.focus({ preventScroll: true })
          }
        }}
        className="gap-3 p-4 motion-reduce:animate-none! sm:max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle>放弃未保存的修改？</DialogTitle>
          <DialogDescription>关闭后，本次表单修改会丢失。</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end">
          <Button type="button" variant="outline" onClick={onKeep}>继续编辑</Button>
          <Button type="button" variant="destructive" onClick={onDiscard}>放弃修改</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
