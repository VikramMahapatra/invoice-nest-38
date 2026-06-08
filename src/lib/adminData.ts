export type TenantStatus = "Active" | "Trial" | "Suspended" | "Churned";
export type TenantPlan = "Starter" | "Growth" | "Scale" | "Enterprise";

export type Tenant = {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  gstin: string;
  state: string;
  plan: TenantPlan;
  status: TenantStatus;
  mrr: number;
  users: number;
  invoices: number;
  storageGB: number;
  storageLimitGB: number;
  joined: string;
  renewsOn: string;
  lastActive: string;
};

export const tenants: Tenant[] = [
  { id: "TNT-1001", name: "Sharma Traders", owner: "Rajesh Sharma", email: "rajesh@sharmatraders.in", phone: "+91 98220 11223", gstin: "27ABCDE1234F1Z5", state: "Maharashtra", plan: "Growth", status: "Active", mrr: 2499, users: 6, invoices: 1284, storageGB: 4.2, storageLimitGB: 10, joined: "2024-08-12", renewsOn: "2026-07-10", lastActive: "2026-06-08" },
  { id: "TNT-1002", name: "Kumar Electronics", owner: "Anita Kumar", email: "anita@kumarelec.com", phone: "+91 99876 55421", gstin: "29KLMNO5678G2Z1", state: "Karnataka", plan: "Scale", status: "Active", mrr: 4999, users: 14, invoices: 4310, storageGB: 18.7, storageLimitGB: 50, joined: "2024-03-04", renewsOn: "2026-06-30", lastActive: "2026-06-08" },
  { id: "TNT-1003", name: "Patel Textiles", owner: "Mehul Patel", email: "accounts@pateltex.com", phone: "+91 90033 11244", gstin: "24PQRST9876H3Z2", state: "Gujarat", plan: "Starter", status: "Trial", mrr: 0, users: 2, invoices: 38, storageGB: 0.4, storageLimitGB: 2, joined: "2026-05-28", renewsOn: "2026-06-11", lastActive: "2026-06-07" },
  { id: "TNT-1004", name: "Mumbai Hardware Co.", owner: "Suresh Joshi", email: "suresh@mumbaihardware.in", phone: "+91 98201 77881", gstin: "27UVWXY1122I4Z3", state: "Maharashtra", plan: "Growth", status: "Active", mrr: 2499, users: 8, invoices: 2104, storageGB: 7.3, storageLimitGB: 10, joined: "2025-01-19", renewsOn: "2026-07-22", lastActive: "2026-06-06" },
  { id: "TNT-1005", name: "Bhatia Foods Pvt Ltd", owner: "Karan Bhatia", email: "karan@bhatiafoods.co", phone: "+91 88600 99001", gstin: "07ZABCD3344J5Z4", state: "Delhi", plan: "Enterprise", status: "Active", mrr: 12999, users: 42, invoices: 18920, storageGB: 86.1, storageLimitGB: 250, joined: "2023-11-02", renewsOn: "2026-11-02", lastActive: "2026-06-08" },
  { id: "TNT-1006", name: "Lakshmi Stores", owner: "Priya Iyer", email: "priya@lakshmistores.in", phone: "+91 95011 23456", gstin: "33EFGHI5566K6Z5", state: "Tamil Nadu", plan: "Starter", status: "Suspended", mrr: 0, users: 3, invoices: 412, storageGB: 1.1, storageLimitGB: 2, joined: "2024-09-30", renewsOn: "2026-05-30", lastActive: "2026-05-20" },
  { id: "TNT-1007", name: "Singh Auto Spares", owner: "Harpreet Singh", email: "hp@singhautos.in", phone: "+91 98140 44556", gstin: "03JKLMN7788L7Z6", state: "Punjab", plan: "Growth", status: "Active", mrr: 2499, users: 5, invoices: 990, storageGB: 3.0, storageLimitGB: 10, joined: "2025-06-15", renewsOn: "2026-07-15", lastActive: "2026-06-08" },
  { id: "TNT-1008", name: "Coastal Seafoods", owner: "Manoj Pillai", email: "manoj@coastalsea.in", phone: "+91 99474 66778", gstin: "32OPQRS9900M8Z7", state: "Kerala", plan: "Scale", status: "Trial", mrr: 0, users: 7, invoices: 124, storageGB: 0.9, storageLimitGB: 50, joined: "2026-05-22", renewsOn: "2026-06-21", lastActive: "2026-06-07" },
  { id: "TNT-1009", name: "Ravi Pharma", owner: "Ravi Menon", email: "ravi@ravipharma.in", phone: "+91 98456 11220", gstin: "29TUVWX1212N9Z8", state: "Karnataka", plan: "Growth", status: "Churned", mrr: 0, users: 4, invoices: 2200, storageGB: 5.6, storageLimitGB: 10, joined: "2024-02-11", renewsOn: "2026-02-11", lastActive: "2026-03-15" },
  { id: "TNT-1010", name: "Decor & Co.", owner: "Sneha Reddy", email: "sneha@decorandco.in", phone: "+91 91234 33445", gstin: "36YZABC3434O1Z9", state: "Telangana", plan: "Starter", status: "Active", mrr: 999, users: 2, invoices: 188, storageGB: 0.7, storageLimitGB: 2, joined: "2026-02-08", renewsOn: "2026-07-08", lastActive: "2026-06-08" },
];

export const plans = [
  { id: "starter", name: "Starter", price: 999, billed: "/mo", tagline: "Solo proprietors & freelancers", features: ["Up to 100 invoices/mo", "2 users", "GSTR-1 export", "Email support"], tenants: tenants.filter(t => t.plan === "Starter").length },
  { id: "growth", name: "Growth", price: 2499, billed: "/mo", tagline: "Growing SMBs", features: ["Up to 1,000 invoices/mo", "10 users", "GSTR-1 + 3B + E-Invoice", "Priority chat support"], tenants: tenants.filter(t => t.plan === "Growth").length, popular: true },
  { id: "scale", name: "Scale", price: 4999, billed: "/mo", tagline: "Multi-branch businesses", features: ["Unlimited invoices", "25 users", "E-Way Bill, Inventory", "Dedicated success manager"], tenants: tenants.filter(t => t.plan === "Scale").length },
  { id: "enterprise", name: "Enterprise", price: 12999, billed: "/mo", tagline: "Large distributors & chains", features: ["Multi-entity, Multi-GSTIN", "Unlimited users", "API + SSO + Audit logs", "24×7 phone support, SLA"], tenants: tenants.filter(t => t.plan === "Enterprise").length },
];

export const billingHistory = [
  { id: "INV-AX-2841", tenant: "Bhatia Foods Pvt Ltd", plan: "Enterprise", amount: 12999, date: "2026-06-02", status: "Paid", method: "NEFT" },
  { id: "INV-AX-2840", tenant: "Kumar Electronics", plan: "Scale", amount: 4999, date: "2026-06-01", status: "Paid", method: "UPI" },
  { id: "INV-AX-2839", tenant: "Sharma Traders", plan: "Growth", amount: 2499, date: "2026-06-01", status: "Paid", method: "Card" },
  { id: "INV-AX-2838", tenant: "Mumbai Hardware Co.", plan: "Growth", amount: 2499, date: "2026-05-31", status: "Paid", method: "UPI" },
  { id: "INV-AX-2837", tenant: "Singh Auto Spares", plan: "Growth", amount: 2499, date: "2026-05-30", status: "Paid", method: "Card" },
  { id: "INV-AX-2836", tenant: "Lakshmi Stores", plan: "Starter", amount: 999, date: "2026-05-30", status: "Failed", method: "Card" },
  { id: "INV-AX-2835", tenant: "Decor & Co.", plan: "Starter", amount: 999, date: "2026-05-08", status: "Paid", method: "UPI" },
  { id: "INV-AX-2834", tenant: "Ravi Pharma", plan: "Growth", amount: 2499, date: "2026-02-11", status: "Refunded", method: "Card" },
];

export const tickets = [
  { id: "TKT-9821", tenant: "Sharma Traders", subject: "GSTR-1 JSON download empty for B2C", priority: "High", status: "Open", updated: "2h ago", assignee: "Neha" },
  { id: "TKT-9820", tenant: "Kumar Electronics", subject: "E-Invoice IRN registration timing out", priority: "Critical", status: "In Progress", updated: "30m ago", assignee: "Arun" },
  { id: "TKT-9819", tenant: "Patel Textiles", subject: "How do I import opening stock?", priority: "Low", status: "Open", updated: "5h ago", assignee: "—" },
  { id: "TKT-9818", tenant: "Mumbai Hardware Co.", subject: "Need invoice template customization", priority: "Medium", status: "Waiting on user", updated: "1d ago", assignee: "Neha" },
  { id: "TKT-9817", tenant: "Bhatia Foods Pvt Ltd", subject: "SSO/SAML configuration assistance", priority: "High", status: "In Progress", updated: "3h ago", assignee: "Vikram" },
  { id: "TKT-9816", tenant: "Lakshmi Stores", subject: "Account suspended after failed payment", priority: "Medium", status: "Resolved", updated: "2d ago", assignee: "Arun" },
];

export const platformStats = {
  totalTenants: tenants.length,
  activeTenants: tenants.filter(t => t.status === "Active").length,
  trialTenants: tenants.filter(t => t.status === "Trial").length,
  mrr: tenants.reduce((a, t) => a + t.mrr, 0),
  arr: tenants.reduce((a, t) => a + t.mrr, 0) * 12,
  invoicesProcessed: tenants.reduce((a, t) => a + t.invoices, 0),
};
