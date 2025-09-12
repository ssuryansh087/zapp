"use client"

import { cn } from "@/lib/utils"
import { MessageSquare, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react"

type Props = {
  open: boolean
  onToggle: () => void
}

export default function Sidebar({ open, onToggle }: Props) {
  const items = Array.from({ length: 10 }).map((_, i) => ({
    id: `chat-${i + 1}`,
    title: i === 0 ? "Fintech Landing" : i === 1 ? "Mobile Onboarding" : `Project ${i + 1}`,
  }))

  return (
    <aside
      className={cn(
        "sticky left-0 top-0 hidden h-dvh shrink-0 border-r border-white/10 md:block",
        "transition-[width] duration-500",
        open ? "w-64" : "w-16",
      )}
      aria-label="History sidebar"
    >
      <div className="flex h-full flex-col">
        <div className="glass flex items-center justify-between px-3 py-3">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md transition hover:scale-[1.03] hover:shadow-[0_0_20px_#fff3]"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            onClick={onToggle}
          >
            {open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>
          {open && (
            <button className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">
              <Plus className="h-4 w-4" />
              New
            </button>
          )}
        </div>

        <div className="mx-2 mt-2 flex-1 overflow-auto rounded-lg p-1">
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
                    "hover:bg-white/5 transition",
                    "shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_16px_rgba(255,255,255,0.15)]",
                  )}
                >
                  <MessageSquare className="h-4 w-4 text-white/70" />
                  {open && <span className="line-clamp-1 text-white/90 group-hover:text-white">{it.title}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
