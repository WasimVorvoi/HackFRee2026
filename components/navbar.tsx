"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { Home, Search, PlusCircle, MessageSquare, LogOut, User, Settings, Users, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { user, isLoggedIn, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 max-w-7xl">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
            C
          </div>
          <span className="font-bold text-xl tracking-tight">Communify</span>
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="gap-2 hover:bg-accent/50 transition-colors">
              <Link href="/">
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">Home</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="gap-2 hover:bg-accent/50 transition-colors">
              <Link href="/spaces">
                <Search className="h-4 w-4" />
                <span className="hidden md:inline">Spaces</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="gap-2 hover:bg-accent/50 transition-colors">
              <Link href="/opportunities">
                <Search className="h-4 w-4" />
                <span className="hidden md:inline">Opportunities</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="gap-2 hover:bg-accent/50 transition-colors">
              <Link href="/groups">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Groups</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="gap-2 hover:bg-accent/50 transition-colors">
              <Link href="/messages">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden md:inline">Messages</span>
              </Link>
            </Button>
            <Button size="sm" asChild className="gap-2 ml-3 shadow-md hover:shadow-lg transition-all">
              <Link href="/create">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2 rounded-full hover:bg-accent/50 transition-colors">
                  <Avatar className="h-9 w-9 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                    <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                      {user?.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{user?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/bookings" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    My Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hover:bg-accent/50 transition-colors">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="shadow-md hover:shadow-lg transition-all">
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
