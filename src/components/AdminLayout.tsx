import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, CreditCard, Package2, LifeBuoy, Settings,
  Menu, X, Bell, Search, ShieldCheck, LogOut, ChevronDown,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/tenants", label: "Tenants", icon: Building2 },
  { to: "/admin/plans", label: "Plans", icon: Package2 },
  { to: "/admin/billing", label: "Billing", icon: CreditCard },
  { to: "/admin/support", label: "Support", icon: LifeBuoy },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/90 text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">BillKhata Admin</div>
            <div className="text-[11px] text-sidebar-foreground/60">Platform Control</div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">Platform</div>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <Link key={item.to} to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 px-3 h-9 rounded-md text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="w-3.5 h-3.5" /> Exit to tenant app
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-sidebar text-sidebar-foreground flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
              <div className="font-semibold">BillKhata Admin</div>
              <button onClick={() => setMobileOpen(false)} className="p-2"><X className="w-4 h-4" /></button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, item.exact);
                return (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    className={cn("flex items-center gap-3 px-3 h-10 rounded-md text-sm",
                      active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent")}>
                    <Icon className="w-4 h-4" /><span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center gap-3 px-4 md:px-6 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2"><Menu className="w-5 h-5" /></button>
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-[11px] font-semibold uppercase tracking-wide">
            <ShieldCheck className="w-3 h-3" /> Super Admin
          </div>
          <div className="hidden md:flex items-center gap-2 ml-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="w-full h-9 pl-9 pr-3 rounded-md bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search tenants, invoices, tickets…" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-md hover:bg-muted">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <button className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-muted text-sm">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">AD</div>
              <span className="hidden sm:inline font-medium">Aanya Desai</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function AdminPageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function TenantStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/15 text-success border-success/30",
    Trial: "bg-info/15 text-info border-info/30",
    Suspended: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    Churned: "bg-destructive/10 text-destructive border-destructive/25",
    Paid: "bg-success/15 text-success border-success/30",
    Failed: "bg-destructive/10 text-destructive border-destructive/25",
    Refunded: "bg-muted text-muted-foreground border-border",
    Open: "bg-info/15 text-info border-info/30",
    "In Progress": "bg-primary/10 text-primary border-primary/20",
    "Waiting on user": "bg-amber-500/15 text-amber-600 border-amber-500/30",
    Resolved: "bg-success/15 text-success border-success/30",
    Critical: "bg-destructive/10 text-destructive border-destructive/25",
    High: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    Medium: "bg-info/15 text-info border-info/30",
    Low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium", map[status] ?? map.Low)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
