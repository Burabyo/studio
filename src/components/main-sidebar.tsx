"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { PaypulseIcon } from "@/components/icons";
import { LayoutDashboard, Users, FileText, Settings, Printer, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

const allMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "employee"] },
  { href: "/employees", label: "Employees", icon: Users, roles: ["admin", "manager"] },
  { href: "/payroll", label: "Transactions", icon: FileText, roles: ["admin", "manager"] },
  { href: "/payslips", label: "Payslips", icon: Printer, roles: ["admin", "manager", "employee"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { employee, logout } = useAuth();

  // Always check before rendering hooks dependent on employee
  const menuItems = React.useMemo(() => {
    if (!employee) return [];
    return allMenuItems.filter((item) => item.roles.includes(employee.role));
  }, [employee]);

  const handleLogout = React.useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  if (!employee) return null;

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground" variant="sidebar" collapsible="icon">
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
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Your Profile" className="justify-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {employee.name?.charAt(0) || "U"}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{employee.name}</span>
                  <span className="text-xs capitalize text-muted-foreground">{employee.role}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={handleLogout} variant="outline" className="border-sidebar-border">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
