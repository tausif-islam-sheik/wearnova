import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  /** Anchors have no native disabled state, so this wires up aria-disabled and blocks clicks. */
  disabled?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  disabled,
  size = "icon",
  onClick,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size={size}
      className={cn(
        // The current page is filled with the brand colour (same as the selected tab).
        isActive &&
          "bg-brand-primary text-primary-foreground hover:bg-brand-primary-hover hover:text-primary-foreground aria-expanded:bg-brand-primary",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          onClick={(e) => {
            if (disabled) {
              e.preventDefault()
              return
            }
            onClick?.(e)
          }}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size={text ? "default" : "icon"}
      className={cn(text && "pl-1.5!", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon={text ? "inline-start" : undefined} />
      {text && <span className="hidden sm:block">{text}</span>}
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size={text ? "default" : "icon"}
      className={cn(text && "pr-1.5!", className)}
      {...props}
    >
      {text && <span className="hidden sm:block">{text}</span>}
      <ChevronRightIcon data-icon={text ? "inline-end" : undefined} />
    </PaginationLink>
  )
}

/** Jump to the first page (double left arrow). Icon-only; pass `text` for a labelled button. */
function PaginationFirst({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to first page"
      size={text ? "default" : "icon"}
      className={cn(text && "pl-1.5!", className)}
      {...props}
    >
      <ChevronsLeftIcon data-icon={text ? "inline-start" : undefined} />
      {text && <span className="hidden sm:block">{text}</span>}
    </PaginationLink>
  )
}

/** Jump to the last page (double right arrow). Icon-only; pass `text` for a labelled button. */
function PaginationLast({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to last page"
      size={text ? "default" : "icon"}
      className={cn(text && "pr-1.5!", className)}
      {...props}
    >
      {text && <span className="hidden sm:block">{text}</span>}
      <ChevronsRightIcon data-icon={text ? "inline-end" : undefined} />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon
      />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
