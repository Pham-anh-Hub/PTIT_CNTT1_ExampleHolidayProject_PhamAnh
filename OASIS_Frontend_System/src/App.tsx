import { useState, useTransition, Activity } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SAMPLE_TENANTS, SAMPLE_EMPLOYEES, SAMPLE_CONTRACTS, INITIAL_ORDERS, INITIAL_PLANS, INITIAL_LEAVE_REQUESTS, INITIAL_CLOCK_LOGS } from "./data";
import { Tenant, Employee, Contract, SalesOrder, ProductionPlan, LeaveRequest, ClockLog, User as UserType } from "./types";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import DashboardScreen from "./components/DashboardScreen";
import HRMScreen from "./components/HRMScreen";
import SalesScreen from "./components/SalesScreen";
import ProductionScreen from "./components/ProductionScreen";
import WorkerScreen from "./components/WorkerScreen";
import LoginScreen from "./components/LoginScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [, startTransition] = useTransition();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem("saas_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Multi-tenant selection states
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => {
    const saved = localStorage.getItem("saas_user");
    if (saved) {
      const user = JSON.parse(saved) as UserType;
      const found = SAMPLE_TENANTS.find(t => t.id === user.tenantId);
      if (found) return found;
    }
    return SAMPLE_TENANTS[0];
  });

  // Unified State Engine for cross-screen data syncing
  const [employees, setEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES);
  const [contracts, setContracts] = useState<Contract[]>(SAMPLE_CONTRACTS);
  const [orders, setOrders] = useState<SalesOrder[]>(INITIAL_ORDERS);
  const [plans, setPlans] = useState<ProductionPlan[]>(INITIAL_PLANS);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [logs, setLogs] = useState<ClockLog[]>(INITIAL_CLOCK_LOGS);

  // Helper selectors for pending approval counts in badge notifications
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const pendingContracts = contracts.filter((c) => c.status === "PENDING");
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");
  const pendingApprovalsCount = pendingOrders.length + pendingContracts.length + pendingLeaves.length;

  // Handlers for state updates
  const handleTenantChange = (tenant: Tenant) => {
    setCurrentTenant(tenant);
  };

  const handleAddEmployee = (emp: Employee) => {
    setEmployees((prev) => [emp, ...prev]);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === updatedEmp.id ? updatedEmp : emp)));
  };

  const handleAddContract = (con: Contract) => {
    setContracts((prev) => [con, ...prev]);
  };

  const handleAddOrder = (ord: SalesOrder) => {
    setOrders((prev) => [ord, ...prev]);
  };

  const handleAddPlan = (plan: ProductionPlan) => {
    setPlans((prev) => [plan, ...prev]);
  };

  const handleAddClockLog = (log: ClockLog) => {
    setLogs((prev) => [log, ...prev]);
  };

  const handleAddLeaveRequest = (req: LeaveRequest) => {
    setLeaves((prev) => [req, ...prev]);
  };

  // BOD Approvals / Rejections core handlers
  const handleApproveOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, status: "APPROVED" } : ord))
    );
  };

  const handleRejectOrder = (id: string, reason: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, status: "REJECTED", rejectionReason: reason } : ord))
    );
  };

  const handleApproveContract = (id: string) => {
    setContracts((prev) =>
      prev.map((con) => (con.id === id ? { ...con, status: "APPROVED", approvedBy: "Phan Văn Hùng" } : con))
    );
  };

  const handleRejectContract = (id: string, reason: string) => {
    setContracts((prev) =>
      prev.map((con) => (con.id === id ? { ...con, status: "REJECTED", rejectionReason: reason } : con))
    );
  };

  const handleApproveLeave = (id: string) => {
    setLeaves((prev) =>
      prev.map((lr) => (lr.id === id ? { ...lr, status: "APPROVED" } : lr))
    );
  };

  const handleRejectLeave = (id: string, reason: string) => {
    setLeaves((prev) =>
      prev.map((lr) => (lr.id === id ? { ...lr, status: "REJECTED", rejectionReason: reason } : lr))
    );
  };

  const handleTabChange = (tabId: string) => {
    startTransition(() => {
      setActiveTab(tabId);
    });
  };

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem("saas_user", JSON.stringify(user));
          const foundTenant = SAMPLE_TENANTS.find(t => t.id === user.tenantId);
          if (foundTenant) {
            setCurrentTenant(foundTenant);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-hidden" id="saas-system-root">
      {/* Top Bar with Shared notifications and tenant selection */}
      <Navbar
        currentTenant={currentTenant}
        tenants={SAMPLE_TENANTS}
        onTenantChange={handleTenantChange}
        pendingApprovalsCount={pendingApprovalsCount}
        pendingOrders={pendingOrders.length}
        pendingContracts={pendingContracts.length}
        pendingLeaves={pendingLeaves.length}
        onNavigateToTab={handleTabChange}
        currentUser={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem("saas_user");
        }}
      />

      {/* Main Corporate Split Frame */}
      <div className="flex flex-1 overflow-hidden" id="enterprise-main-frame">
        {/* Left Side Navigation Menu panel */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          pendingApprovalsCount={pendingApprovalsCount}
          currentTenant={currentTenant}
        />

        {/* Right Side Main Worksite Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative h-[calc(100vh-64px)] bg-neutral-light" id="content-canvas-root">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full"
            >
              {activeTab === "dashboard" && (
                <DashboardScreen
                  orders={orders}
                  contracts={contracts}
                  leaves={leaves}
                  onApproveOrder={handleApproveOrder}
                  onRejectOrder={handleRejectOrder}
                  onApproveContract={handleApproveContract}
                  onRejectContract={handleRejectContract}
                  onApproveLeave={handleApproveLeave}
                  onRejectLeave={handleRejectLeave}
                />
              )}

              {activeTab === "hrm" && (
                <HRMScreen
                  employees={employees}
                  contracts={contracts}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onAddContract={handleAddContract}
                />
              )}

              {activeTab === "sales" && (
                <SalesScreen
                  orders={orders}
                  onAddOrder={handleAddOrder}
                />
              )}

              {activeTab === "production" && (
                <ProductionScreen
                  plans={plans}
                  onAddPlan={handleAddPlan}
                />
              )}

              {activeTab === "worker-portal" && (
                <WorkerScreen
                  logs={logs}
                  onAddClockLog={handleAddClockLog}
                  onAddLeaveRequest={handleAddLeaveRequest}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
