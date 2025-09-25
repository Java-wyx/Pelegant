
import * as React from "react"

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Control whether the sidebar is collapsible, and how it behaves. */
  collapsible?: "offcanvas" | "icon" | "none"
  /** Control the position of the sidebar. */
  side?: "left" | "right"
  /** Control the variant of the sidebar. */
  variant?: "sidebar" | "floating" | "inset"
}

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Control whether to render a different element. */
  asChild?: boolean
  /** Control whether the button is active. */
  isActive?: boolean
  /** Control the variant of the button. */
  variant?: "default" | "outline"
  /** Control the size of the button. */
  size?: "default" | "sm" | "lg"
  /** Control the tooltip content. */
  tooltip?: React.ReactNode | { children: React.ReactNode; [key: string]: any }
}
