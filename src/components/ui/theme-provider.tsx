
"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDarkMode: boolean
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  isDarkMode: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "spades-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)")
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    theme === "dark" || (theme === "system" && prefersDark)
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = prefersDark ? "dark" : "light"
      root.classList.add(systemTheme)
      setIsDarkMode(systemTheme === "dark")
    } else {
      root.classList.add(theme)
      setIsDarkMode(theme === "dark")
    }
  }, [theme, prefersDark])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    isDarkMode,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
