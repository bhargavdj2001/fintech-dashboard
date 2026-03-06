"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CommandShortcut() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleClick = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  if (!mounted) return null

  return (
    <Button
      variant="outline"
      className="relative h-9 w-full justify-start rounded-md bg-muted/50 px-3 text-sm font-normal text-muted-foreground shadow-none sm:w-64"
      onClick={handleClick}
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline-flex">Search or type command...</span>
      <span className="inline-flex sm:hidden">Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">Cmd</span>K
      </kbd>
    </Button>
  )
}
