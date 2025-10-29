"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  )
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative z-50 w-full max-w-3xl max-h-[90vh] bg-card border rounded-lg shadow-lg overflow-hidden flex flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6 border-b", className)} {...props} />
)

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
)

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

const DialogContentInner = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto p-6", className)} {...props} />
)

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, onClick, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity p-2",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
)
DialogClose.displayName = "DialogClose"

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogContentInner, DialogClose }

