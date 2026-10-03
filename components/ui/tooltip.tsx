"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "cn"
import { Tooltip as TooltipPrimitive } from "radix-ui"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  disableHoverableContent = true,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" disableHoverableContent={disableHoverableContent} {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "pointer-events-none z-50 inline-flex w-fit min-w-8 max-w-[min(250px,var(--radix-tooltip-content-available-width))] origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-[6px] bg-[var(--color-tooltip-bg)] px-3 py-2 text-center text-[13px] leading-4 font-normal text-[var(--color-text-value)] has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow asChild width={14} height={6}>
          <span aria-hidden className="relative block h-[6px] w-[14px]">
            <Image alt="" className="cs-tooltip-arrow-dark absolute inset-0" height={6} src="/figma/tooltip-arrow-dark.svg" width={14} />
            <Image alt="" className="cs-tooltip-arrow-light absolute inset-0" height={6} src="/figma/tooltip-arrow-light.svg" width={14} />
          </span>
        </TooltipPrimitive.Arrow>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
