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
    <aside className="w-64 border-r bg-card/50 backdrop-blur flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">🏢 Sukaj Prona</h2>
        <p className="text-sm text-muted-foreground">Menaxhim pronash</p>
      </div>
      
      {/* User info */}
      {user && userRole && (
        <div className="px-6 py-4 border-b bg-accent/30">
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
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {/* Kreu */}
        <button
          onClick={() => handleNavigation("/")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
            isActiveRoute("/")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-accent-foreground"
          )}
        >
          <Home className="h-4 w-4" />
          Kreu
        </button>

        {/* Të gjitha apartamentet */}
        <button
          onClick={() => handleNavigation("/prona?type=apartamente")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
            isActiveRoute("/prona", "apartamente")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-accent-foreground"
          )}
        >
          <Building className="h-4 w-4" />
          Të gjitha apartamentet
        </button>

        {/* Individual apartment categories */}
        <div className="pl-4 space-y-1">
          <button
            onClick={() => handleNavigation("/prona?grupi=6%20KATESHI%20I%20BARDHË")}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
              isActiveRoute("/prona", undefined, "6 KATESHI I BARDHË")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-accent-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            6 KATESHI I BARDHË
          </button>

          <button
            onClick={() => handleNavigation("/prona?grupi=Shkalla%20A%2BB")}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
              isActiveRoute("/prona", undefined, "Shkalla A+B")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-accent-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            Shkalla A+B
          </button>

          <button
            onClick={() => handleNavigation("/prona?grupi=Shkalla%20D")}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
              isActiveRoute("/prona", undefined, "Shkalla D")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-accent-foreground"
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
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
              "text-muted-foreground hover:text-accent-foreground"
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
            <div className="pl-4 space-y-1 mt-1">
              <button
                onClick={() => handleNavigation("/prona?grupi=MAGAZINA")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
                  isActiveRoute("/prona", undefined, "MAGAZINA")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-accent-foreground"
                )}
              >
                <Warehouse className="h-4 w-4" />
                Magazina
              </button>

              <button
                onClick={() => handleNavigation("/prona?grupi=DYQANE")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
                  isActiveRoute("/prona", undefined, "DYQANE")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-accent-foreground"
                )}
              >
                <Store className="h-4 w-4" />
                Dyqane
              </button>

              <button
                onClick={() => handleNavigation("/prona?grupi=HOTELI")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
                  isActiveRoute("/prona", undefined, "HOTELI")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-accent-foreground"
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
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-left",
            pathname === "/prona" && !currentGrupi && !currentType
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-accent-foreground"
          )}
        >
          <Building2 className="h-4 w-4" />
          Të gjitha pronat
        </button>
      </nav>

      {/* Logout button at bottom */}
      <div className="mt-auto p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Dil
        </Button>
      </div>
    </aside>
  )
}
