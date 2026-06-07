import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Users, Package, Wallet, Receipt,
  Repeat, FileCheck2, StickyNote, Shield, Menu, Bell, Plus,
  ChevronDown, Search, X, FileBarChart2, Landmark,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useStore, rolePermissions, type Role } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/quotations", label: "Quotations", icon: FileCheck2 },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/recurring", label: "Recurring", icon: Repeat },
  { to: "/notes", label: "Credit / Debit", icon: StickyNote },
  { to: "/gstr1", label: "GSTR-1 Report", icon: FileBarChart2 },
  { to: "/gstr3b", label: "GSTR-3B Summary", icon: Landmark },
  { to: "/staff", label: "Staff & Roles", icon: Shield },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { business, currentRole, setCurrentRole, staff } = useStore();
  const perms = rolePermissions(currentRole);

  const isActive = (to: string) => to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold">ST</div>
          {!collapsed && (
            <div className="ml-3 leading-tight">
              <div className="text-sm font-semibold">{business.name}</div>
              <div className="text-[11px] text-sidebar-foreground/60">GST {business.gstin.slice(0, 8)}…</div>
            </div>
          )}
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="m-3 h-9 rounded-md border border-sidebar-border text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent"
        >
          {collapsed ? "›" : "‹ Collapse"}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-sidebar text-sidebar-foreground flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
              <div className="font-semibold">{business.name}</div>
              <button onClick={() => setMobileOpen(false)} className="p-2"><X className="w-4 h-4" /></button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 h-10 rounded-md text-sm",
                      active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
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

          <BusinessSwitcher />

          <div className="hidden md:flex items-center gap-2 ml-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full h-9 pl-9 pr-3 rounded-md bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search invoices, customers…"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <RoleSwitcher role={currentRole} setRole={setCurrentRole} />
            <button className="relative p-2 rounded-md hover:bg-muted">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </button>
            {perms.canCreate && (
              <Link to="/invoices/new">
                <Button className="gap-1.5"><Plus className="w-4 h-4" /> New Invoice</Button>
              </Link>
            )}
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
              {staff.find((s) => s.role === currentRole)?.name?.[0] ?? "R"}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t flex justify-around h-16 z-30">
          {[nav[0], nav[1], nav[3], nav[5], nav[6]].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link key={item.to} to={item.to} className={cn("flex-1 flex flex-col items-center justify-center gap-1 text-[11px]", active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="w-5 h-5" />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function BusinessSwitcher() {
  const { business } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 px-3 rounded-md hover:bg-muted text-sm font-medium"
      >
        <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">ST</div>
        <span className="hidden sm:inline truncate max-w-[140px]">{business.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-11 left-0 w-64 bg-popover border rounded-lg shadow-lg p-2 z-40">
          <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Switch Business</div>
          <div className="px-2 py-2 rounded-md bg-accent flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">ST</div>
            <div className="text-sm">
              <div className="font-medium">{business.name}</div>
              <div className="text-xs text-muted-foreground">{business.state}</div>
            </div>
          </div>
          <button className="mt-1 w-full text-left px-2 py-2 text-sm rounded-md hover:bg-muted text-muted-foreground">+ Add Business Profile</button>
        </div>
      )}
    </div>
  );
}

function RoleSwitcher({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  const roles: Role[] = ["Owner", "Accountant", "Staff", "Viewer"];
  return (
    <div className="hidden md:flex items-center bg-muted rounded-md p-0.5 text-xs">
      {roles.map((r) => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className={cn(
            "px-2.5 h-7 rounded-[5px] transition-colors",
            role === r ? "bg-card shadow-sm font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
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

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: "bg-success/15 text-success border-success/30",
    "Partially Paid": "bg-info/15 text-info border-info/30",
    Sent: "bg-primary/10 text-primary border-primary/20",
    Draft: "bg-muted text-muted-foreground border-border",
    Overdue: "bg-destructive/10 text-destructive border-destructive/25",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium", map[status] ?? map.Draft)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed rounded-xl p-10 text-center bg-card">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</div>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
