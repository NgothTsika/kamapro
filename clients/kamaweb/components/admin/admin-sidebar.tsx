"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Trophy,
  LogOut,
  FolderOpen,
  Users,
  HardDrive,
  Zap,
  BookMarked,
  Share2,
  Bell,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { clearAdminToken } from "@/lib/admin-auth";
import type { MeUser } from "@/lib/kama-types";

const navItems: Array<{
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  match: "exact" | "prefix";
  roles?: Array<"ADMIN" | "MODERATOR" | "USER">;
}> = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    match: "exact",
  },
  { title: "Content", href: "/content", icon: FolderOpen, match: "prefix" },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    match: "exact",
    roles: ["ADMIN", "MODERATOR"],
  },
  {
    title: "Achievements",
    href: "/achievements",
    icon: Trophy,
    match: "exact",
  },
  {
    title: "Gamification",
    href: "/gamification",
    icon: Zap,
    match: "prefix",
    roles: ["ADMIN"],
  },
  {
    title: "Moderation",
    href: "/moderation",
    icon: ShieldAlert,
    match: "exact",
  },
];

type AdminSidebarProps = {
  user: MeUser;
};

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  function onLogout() {
    clearAdminToken();
    router.replace("/login");
  }

  function isActive(item: (typeof navItems)[number]) {
    if (item.match === "prefix") {
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    }
    return pathname === item.href;
  }

  function handleNavigation() {
    // Close sidebar on mobile after selecting an item
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1">
          <p className="text-sm font-semibold">KamaGame Admin</p>
          <p className="text-xs text-muted-foreground">
            {user.username} ({user.role})
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            {navItems
              .filter((item) => !item.roles || item.roles.includes(user.role))
              .map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item)}>
                    <Link href={item.href} onClick={handleNavigation}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button variant="ghost" onClick={onLogout} className="justify-start">
          <LogOut />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
