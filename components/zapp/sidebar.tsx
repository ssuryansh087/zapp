"use client"

import { cn } from "@/lib/utils"
import { MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, LogOut, Pencil, Check, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { getUserProjects } from "@/lib/supabase/projects"
import { Project } from "@/lib/supabase/types"
import Image from "next/image"

type Props = {
  open: boolean
  onToggle: () => void
  currentProjectId?: string | null
  onProjectSelect?: (project: Project) => void
  onNewProject?: () => void
}

export default function Sidebar({ open, onToggle, currentProjectId, onProjectSelect, onNewProject }: Props) {
  const { user, profile, signOut } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getUserProjects(user.id)
      setProjects(data)
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditStart = (project: Project) => {
    setEditingId(project.id)
    setEditName(project.name)
  }

  const handleEditSave = async (projectId: string) => {
    if (!editName.trim()) return
    try {
      const { updateProject } = await import("@/lib/supabase/projects")
      await updateProject(projectId, { name: editName.trim() })
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: editName.trim() } : p))
      setEditingId(null)
    } catch (error) {
      console.error("Failed to update project name:", error)
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditName("")
  }

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
          {open && user && (
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 transition"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          )}
        </div>

        <div className="mx-2 mt-2 flex-1 overflow-auto rounded-lg p-1">
          {user ? (
            <ul className="space-y-1">
              {loading ? (
                <li className="px-2 py-4 text-center text-sm text-white/50">Loading...</li>
              ) : projects.length === 0 ? (
                <li className="px-2 py-4 text-center text-sm text-white/50">
                  {open ? "No projects yet" : ""}
                </li>
              ) : (
                projects.map((project) => (
                  <li key={project.id}>
                    <div
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
                        "hover:bg-white/5 transition",
                        "shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_16px_rgba(255,255,255,0.15)]",
                        currentProjectId === project.id && "bg-white/10"
                      )}
                    >
                      {editingId === project.id ? (
                        <>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave(project.id)
                              if (e.key === "Escape") handleEditCancel()
                            }}
                            className="flex-1 bg-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleEditSave(project.id)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <Check className="h-3 w-3 text-green-400" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <X className="h-3 w-3 text-red-400" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onProjectSelect?.(project)}
                            className="flex items-center gap-2 flex-1 min-w-0"
                          >
                            <MessageSquare className="h-4 w-4 text-white/70 shrink-0" />
                            {open && (
                              <span className="line-clamp-1 text-white/90 group-hover:text-white">
                                {project.name}
                              </span>
                            )}
                          </button>
                          {open && (
                            <button
                              onClick={() => handleEditStart(project)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition"
                            >
                              <Pencil className="h-3 w-3 text-white/60" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <div className="px-2 py-4 text-center text-sm text-white/50">
              {open ? "Sign in to view projects" : ""}
            </div>
          )}
        </div>

        {user && (
          <div className="mt-auto border-t border-white/10 p-3">
            <div className={cn("flex items-center gap-3", !open && "justify-center")}>
              <div className="relative h-9 w-9 shrink-0 rounded-full bg-white/10 overflow-hidden">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name || "User"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-white">
                    {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {open && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-xs text-white/50 truncate">{user.email}</p>
                </div>
              )}
              {open && (
                <button
                  onClick={signOut}
                  className="p-2 rounded-md hover:bg-white/5 transition"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4 text-white/60" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
