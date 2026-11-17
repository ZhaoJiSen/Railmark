"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

function ScrollArea({
  className,
  children,
  viewportProps,
  scrollbarSize = "default",
  horizontal = false,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  viewportProps?: React.ComponentProps<typeof ScrollAreaPrimitive.Viewport>
  scrollbarSize?: "default" | "thin"
  horizontal?: boolean
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        {...viewportProps}
        data-slot="scroll-area-viewport"
        className={cn(
          "size-full overscroll-none rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
          viewportProps?.className
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar size={scrollbarSize} />
      {horizontal && <ScrollBar orientation="horizontal" size={scrollbarSize} />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  size = "default",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & { size?: "default" | "thin" }) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" ? "h-full border-l border-l-transparent" : "flex-col border-t border-t-transparent",
        orientation === "vertical" ? (size === "thin" ? "w-2" : "w-2.5") : (size === "thin" ? "h-2" : "h-2.5"),
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={cn("relative flex-1 rounded-full", size === "thin" ? "bg-muted-foreground/60 hover:bg-muted-foreground" : "bg-border")}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
