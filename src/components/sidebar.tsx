"use client"

import { useState } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Home, Building2, Layers, ChevronDown, ChevronRight, Warehouse, Store, Hotel, Building, LogOut, User } from "lucide-react"
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
    <aside className="flex h-full min-h-screen w-64 flex-col overflow-hidden border-r border-border/15 bg-[radial-gradient(circle_at_top_left,hsla(199,65%,18%,0.45),transparent_60%)] bg-secondary/70 backdrop-blur-xl">
      <div className="space-y-1 border-b border-border/10 px-6 py-7">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">🏢 Sukaj Prona</h2>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Menaxhim pronash</p>
      </div>
      
      {/* User info */}
      {user && userRole && (
        <div className="border-b border-border/10 bg-accent/20 px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userRole.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole.role === 'admin' ? 'Administrator' : 'Editor'}
              </p>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
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
          Kreu
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
          Të gjitha apartamentet
        </button>

        {/* Individual apartment categories */}
        <div className="space-y-1 pl-5">
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
            6 KATESHI I BARDHË
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
            Shkalla A+B
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
            Shkalla D
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
            Ambjentet e mëdha
          </button>

          {ambjenteteExpanded && (
            <div className="mt-1 space-y-1 pl-5">
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
                Magazina
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
                Dyqane
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
                Hoteli
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
          Të gjitha pronat
        </button>
      </nav>

      {/* Logout button at bottom */}
      <div className="mt-auto border-t border-border/10 px-4 py-5">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl bg-transparent text-muted-foreground transition-colors hover:bg-accent/40 hover:text-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Dil
        </Button>
      </div>
    </aside>
  )
}
