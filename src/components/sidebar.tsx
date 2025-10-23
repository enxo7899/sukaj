"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Home, Building2, Layers, ChevronDown, ChevronRight, ChevronLeft, Warehouse, Store, Hotel, Building, LogOut, User, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userRole, isAdmin, signOut } = useAuth();
  const [isAmbjentetExpanded, setIsAmbjentetExpanded] = useState(false);
  
  let currentGrupi: string | null = null;
  let currentType: string | null = null;
  
  try {
    const searchParams = useSearchParams();
    currentGrupi = searchParams?.get('grupi') || null;
    currentType = searchParams?.get('type') || null;
  } catch {
    // useSearchParams not available during build
  }
  
  const [ambjenteteExpanded, setAmbjenteteExpanded] = useState(
    currentGrupi === 'MAGAZINA' || currentGrupi === 'DYQANE' || currentGrupi === 'HOTELI'
  )

  // Desktop collapse
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed')
      if (saved === '1') setCollapsed(true)
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0') } catch {}
  }, [collapsed])

  const handleNavigation = (href: string) => {
    router.push(href);
    onNavigate?.(); // Close mobile menu
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isActiveRoute = (href: string, type?: string, grupi?: string) => {
    if (href === pathname && !grupi && !type) return true
    if (type && currentType === type) return true
    if (grupi && currentGrupi === grupi) return true
    return false
  }

  return (
    <aside className={cn("flex h-full min-h-screen flex-col overflow-hidden border-r border-border/15 bg-[radial-gradient(circle_at_top_left,hsla(199,65%,18%,0.45),transparent_60%)] bg-secondary/70 backdrop-blur-xl transition-[width] duration-200", collapsed ? "w-16" : "w-64") }>
      <div className={cn("relative space-y-1 border-b border-border/10 py-6", collapsed ? "px-3" : "px-6") }>
        <div className="flex items-center justify-between">
          <h2 className={cn("font-semibold tracking-tight text-foreground", collapsed ? "text-base" : "text-xl")}>{collapsed ? "🏢" : "🏢 Sukaj Prona"}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsed && (
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Menaxhim pronash</p>
        )}
      </div>
      
      {/* User info */}
      {user && userRole && (
        <div className={cn("border-b border-border/10 bg-accent/20 py-4", collapsed ? "px-3" : "px-6") }>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <div className="flex-1 min-w-0">
              {!collapsed && (
                <>
                  <p className="font-medium truncate">{userRole.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole.role === 'admin' ? 'Administrator' : 'Editor'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <nav className={cn("flex-1 space-y-2 overflow-y-auto py-6", collapsed ? "px-2" : "px-4") }>
        {/* Kreu */}
        <button
          onClick={() => handleNavigation("/")}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-left",
            isActiveRoute("/")
              ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
              : "text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground"
          )}
        >
          <Home className="h-4 w-4" />
          {!collapsed && <span className="truncate">Kreu</span>}
        </button>

        {/* Të gjitha apartamentet */}
        <button
          onClick={() => handleNavigation("/prona?type=apartamente")}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-left",
            isActiveRoute("/prona", "apartamente")
              ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
              : "text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground"
          )}
        >
          <Building className="h-4 w-4" />
          {!collapsed && <span className="truncate">Të gjitha apartamentet</span>}
        </button>

        {/* Individual apartment categories */}
        <div className={cn("space-y-1", collapsed ? "pl-0" : "pl-5") }>
          <button
            onClick={() => handleNavigation("/prona?grupi=6%20KATESHI%20I%20BARDHË")}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-200 text-left",
              isActiveRoute("/prona", undefined, "6 KATESHI I BARDHË")
                ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
                : "text-muted-foreground/70 hover:bg-accent/40 hover:text-accent-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            {!collapsed && <span className="truncate">6 KATESHI I BARDHË</span>}
          </button>

          <button
            onClick={() => handleNavigation("/prona?grupi=Shkalla%20A%2BB")}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-200 text-left",
              isActiveRoute("/prona", undefined, "Shkalla A+B")
                ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
                : "text-muted-foreground/70 hover:bg-accent/40 hover:text-accent-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            {!collapsed && <span className="truncate">Shkalla A+B</span>}
          </button>

          <button
            onClick={() => handleNavigation("/prona?grupi=Shkalla%20D")}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-200 text-left",
              isActiveRoute("/prona", undefined, "Shkalla D")
                ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
                : "text-muted-foreground/70 hover:bg-accent/40 hover:text-accent-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            {!collapsed && <span className="truncate">Shkalla D</span>}
          </button>
        </div>

        {/* Ambjentet e mëdha - Collapsible */}
        <div>
          <button
            onClick={() => setAmbjenteteExpanded(!ambjenteteExpanded)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-left text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground"
            )}
          >
            {ambjenteteExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Building2 className="h-4 w-4" />
            {!collapsed && <span className="truncate">Ambjentet e mëdha</span>}
          </button>

          {ambjenteteExpanded && (
            <div className={cn("mt-1 space-y-1", collapsed ? "pl-0" : "pl-5") }>
              <button
                onClick={() => handleNavigation("/prona?grupi=MAGAZINA")}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-200 text-left",
                  isActiveRoute("/prona", undefined, "MAGAZINA")
                    ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
                    : "text-muted-foreground/70 hover:bg-accent/40 hover:text-accent-foreground"
                )}
              >
                <Warehouse className="h-4 w-4" />
                {!collapsed && <span className="truncate">Magazina</span>}
              </button>

              <button
                onClick={() => handleNavigation("/prona?grupi=DYQANE")}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-200 text-left",
                  isActiveRoute("/prona", undefined, "DYQANE")
                    ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
                    : "text-muted-foreground/70 hover:bg-accent/40 hover:text-accent-foreground"
                )}
              >
                <Store className="h-4 w-4" />
                {!collapsed && <span className="truncate">Dyqane</span>}
              </button>

              <button
                onClick={() => handleNavigation("/prona?grupi=HOTELI")}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-200 text-left",
                  isActiveRoute("/prona", undefined, "HOTELI")
                    ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
                    : "text-muted-foreground/70 hover:bg-accent/40 hover:text-accent-foreground"
                )}
              >
                <Hotel className="h-4 w-4" />
                {!collapsed && <span className="truncate">Hoteli</span>}
              </button>
            </div>
          )}
        </div>

        {/* Të gjitha pronat */}
        <button
          onClick={() => handleNavigation("/prona")}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-left",
            pathname === "/prona" && !currentGrupi && !currentType
              ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
              : "text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground"
          )}
        >
          <Building2 className="h-4 w-4" />
          {!collapsed && <span className="truncate">Të gjitha pronat</span>}
        </button>

        {/* Kontratat */}
        <button
          onClick={() => handleNavigation("/kontratat")}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-left",
            pathname === "/kontratat"
              ? "bg-accent/80 text-accent-foreground shadow-lg shadow-black/10"
              : "text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          {!collapsed && <span className="truncate">Kontratat</span>}
        </button>
      </nav>

      {/* Logout button at bottom */}
      <div className={cn("mt-auto border-t border-border/10 py-5", collapsed ? "px-2" : "px-4") }>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl bg-transparent text-muted-foreground transition-colors hover:bg-accent/40 hover:text-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span className="truncate">Dil</span>}
        </Button>
      </div>
    </aside>
  )
}
