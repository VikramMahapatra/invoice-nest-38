import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout, AdminPageHeader, TenantStatusBadge } from "@/components/AdminLayout";
import { tickets } from "@/lib/adminData";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Support · BillKhata Admin" }] }),
  component: SupportPage,
});

const TABS = ["All", "Open", "In Progress", "Waiting on user", "Resolved"] as const;

function SupportPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = tickets.filter(t =>
    (tab === "All" || t.status === tab) &&
    (q === "" || (t.subject + t.tenant + t.id).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <AdminPageHeader
          title="Support inbox"
          subtitle="Manage tenant support tickets across the platform"
          actions={<Button className="gap-1.5"><Plus className="w-4 h-4" /> New ticket</Button>}
        />

        <div className="rounded-xl border bg-card">
          <div className="p-4 flex flex-wrap items-center gap-3 border-b">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search ticket, tenant, subject…" />
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 text-xs overflow-x-auto">
              {TABS.map((s) => (
                <button key={s} onClick={() => setTab(s)}
                  className={`px-2.5 h-7 rounded-[5px] whitespace-nowrap ${tab === s ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Ticket</th>
                  <th className="text-left font-medium px-3 py-2.5">Subject</th>
                  <th className="text-left font-medium px-3 py-2.5">Tenant</th>
                  <th className="text-left font-medium px-3 py-2.5">Priority</th>
                  <th className="text-left font-medium px-3 py-2.5">Status</th>
                  <th className="text-left font-medium px-3 py-2.5">Assignee</th>
                  <th className="text-left font-medium px-5 py-2.5">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-muted/30 cursor-pointer">
                    <td className="px-5 py-3 font-mono text-xs">{t.id}</td>
                    <td className="px-3 py-3 font-medium max-w-md truncate">{t.subject}</td>
                    <td className="px-3 py-3">{t.tenant}</td>
                    <td className="px-3 py-3"><TenantStatusBadge status={t.priority} /></td>
                    <td className="px-3 py-3"><TenantStatusBadge status={t.status} /></td>
                    <td className="px-3 py-3 text-sm">{t.assignee}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{t.updated}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No tickets match.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y">
            {filtered.map((t) => (
              <div key={t.id} className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{t.subject}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.tenant} · {t.id} · {t.updated}</div>
                  </div>
                  <TenantStatusBadge status={t.priority} />
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <TenantStatusBadge status={t.status} />
                  <span className="text-xs text-muted-foreground">{t.assignee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
