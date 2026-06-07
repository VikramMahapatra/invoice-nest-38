import { createFileRoute } from "@tanstack/react-router";
import { Plus, Shield, History, UserPlus } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { rolePermissions, useStore, type Role } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Staff & Roles · BillKhata" }] }),
  component: Staff,
});

const ROLE_DESC: Record<Role, { label: string; desc: string; perms: string[] }> = {
  Owner: { label: "Owner", desc: "Unrestricted access to data and financials.", perms: ["Create / Edit / Delete", "All financial reports", "Manage staff & roles"] },
  Accountant: { label: "Accountant", desc: "View-only access to records and reports.", perms: ["View invoices & reports", "Export GSTR-1", "Cannot edit or delete"] },
  Staff: { label: "Staff", desc: "Can create invoices but no financial visibility.", perms: ["Create invoices", "Add customers", "No profit / margin data"] },
  Viewer: { label: "Viewer", desc: "Global read-only access, no actions.", perms: ["Read everything", "No create / edit", "Audit-friendly"] },
};

function Staff() {
  const { staff, currentRole, setCurrentRole, addStaff } = useStore();
  const [open, setOpen] = useState(false);
  const perms = rolePermissions(currentRole);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader title="Staff & Permissions" subtitle="Invite teammates and control what they can see or do." actions={perms.canManageStaff && <Button onClick={() => setOpen(true)} className="gap-1.5"><UserPlus className="w-4 h-4" /> Invite Staff</Button>} />

        <div className="bg-card border rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Try a Role</h3>
              <p className="text-xs text-muted-foreground mt-1">Switch between roles to preview how the app changes for each persona.</p>
            </div>
            <div className="inline-flex bg-muted rounded-md p-0.5">
              {(["Owner", "Accountant", "Staff", "Viewer"] as Role[]).map((r) => (
                <button key={r} onClick={() => setCurrentRole(r)} className={cn("px-3 h-8 text-sm rounded", currentRole === r ? "bg-card shadow-sm font-medium" : "text-muted-foreground")}>{r}</button>
              ))}
            </div>
          </div>
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(ROLE_DESC) as Role[]).map((r) => (
              <div key={r} className={cn("rounded-lg border p-4", currentRole === r ? "border-primary bg-primary/5" : "")}>
                <div className="font-semibold">{ROLE_DESC[r].label}</div>
                <div className="text-xs text-muted-foreground mt-1">{ROLE_DESC[r].desc}</div>
                <ul className="mt-3 space-y-1 text-xs">
                  {ROLE_DESC[r].perms.map((p) => <li key={p} className="text-muted-foreground">• {p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left py-3 px-5 font-medium">Name</th>
                <th className="text-left py-3 px-2 font-medium">Email</th>
                <th className="text-left py-3 px-2 font-medium">Role</th>
                <th className="text-left py-3 px-2 font-medium">Last Active</th>
                <th className="py-3 px-5"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-3 px-5 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{s.name[0]}</div>{s.name}</td>
                  <td className="py-3 px-2 text-muted-foreground">{s.email}</td>
                  <td className="py-3 px-2"><span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{s.role}</span></td>
                  <td className="py-3 px-2 text-muted-foreground">{s.lastActive}</td>
                  <td className="py-3 px-5 text-right">
                    {perms.canManageStaff ? <Button size="sm" variant="ghost">Edit</Button> : <span className="text-xs text-muted-foreground">Read-only</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card border rounded-xl p-5 mt-6">
          <h3 className="font-semibold flex items-center gap-2"><History className="w-4 h-4 text-muted-foreground" /> Recent Activity (Audit Trail)</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { who: "Rahul (Staff)", what: "created invoice ST/26-27/0409 for Rajesh Hardware Stores", when: "2h ago" },
              { who: "Priya (Accountant)", what: "marked invoice ST/26-27/0411 as Paid", when: "5h ago" },
              { who: "Rajesh (Owner)", what: "issued credit note CN/26-27/0012 against ST/26-27/0405", when: "yesterday" },
            ].map((a, i) => (
              <li key={i} className="flex gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <div><span className="font-medium">{a.who}</span> <span className="text-muted-foreground">{a.what}</span></div>
                  <div className="text-xs text-muted-foreground">{a.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {open && <InviteModal onClose={() => setOpen(false)} onAdd={(s) => { addStaff(s); setOpen(false); }} />}
      </div>
    </AppLayout>
  );
}

function InviteModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: { name: string; email: string; role: Role; lastActive: string }) => void }) {
  const [f, setF] = useState({ name: "", email: "", role: "Staff" as Role });
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Invite Staff Member</h3>
        <div className="mt-4 space-y-3">
          <div><label className="text-xs font-medium text-muted-foreground">Full Name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">Email</label><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm" /></div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm">
              {(["Owner", "Accountant", "Staff", "Viewer"] as Role[]).map((r) => <option key={r}>{r}</option>)}
            </select>
            <p className="text-xs text-muted-foreground mt-1">{ROLE_DESC[f.role].desc}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onAdd({ ...f, lastActive: "just now" })}>Send Invite</Button></div>
      </div>
    </div>
  );
}
