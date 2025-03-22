"use client"

import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { theme, setTheme, isSaving } = useTheme()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative" disabled={isSaving}>
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <Laptop className="absolute h-4 w-4 rotate-90 scale-0 transition-all data-[state=open]:rotate-0 data-[state=open]:scale-100" />
                <span className="sr-only">Toggle theme</span>
                {isSaving && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary animate-pulse" />}
              </Button>
            </DropdownMenuTrigger>
            <TooltipContent side="bottom">
              <p>Change theme</p>
            </TooltipContent>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")} disabled={isSaving}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
                {theme === "light" && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} disabled={isSaving}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
                {theme === "dark" && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} disabled={isSaving}>
                <Laptop className="mr-2 h-4 w-4" />
                <span>System</span>
                {theme === "system" && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  )
}

