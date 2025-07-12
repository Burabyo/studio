"use client"
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { PaypulseIcon } from "@/components/icons"
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CircleUser,
  Printer,
} from "lucide-react"
import Link from "next/link"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/payroll", label: "Payroll", icon: FileText },
  { href: "/payslips", label: "Payslips", icon: Printer },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <PaypulseIcon className="w-8 h-8 text-primary" />
          <span className="text-lg font-semibold">PayPulse</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton tooltip="Your Profile">
                <CircleUser />
                <span>Jane Doe</span>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
