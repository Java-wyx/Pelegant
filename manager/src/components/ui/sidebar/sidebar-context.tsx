
import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import type { SidebarProps } from "./types"

// Define constants for sidebar widths
export const SIDEBAR_WIDTH = "18rem"
export const SIDEBAR_WIDTH_ICON = "3.5rem"
export const SIDEBAR_WIDTH_MOBILE = "18rem"

interface SidebarContextType {
  isMobile: boolean
  openMobile: boolean
  collapsed: boolean
  state: "expanded" | "collapsed"
  collapsible: SidebarProps["collapsible"]
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextType>({
  isMobile: false,
  openMobile: false,
  collapsed: false,
  state: "expanded",
  collapsible: "offcanvas",
  setOpenMobile: () => null,
  setCollapsed: () => null,
  toggleSidebar: () => null,
})

export const SidebarProvider = ({
  children,
  collapsible = "offcanvas",
  defaultCollapsed = false,
}: {
  children: React.ReactNode
  collapsible?: SidebarProps["collapsible"]
  defaultCollapsed?: boolean
}) => {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  
  const toggleSidebar = React.useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const state = collapsed ? "collapsed" : "expanded"

  return (
    <SidebarContext.Provider
      value={{
        isMobile,
        openMobile,
        collapsed,
        state,
        collapsible,
        setOpenMobile,
        setCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
