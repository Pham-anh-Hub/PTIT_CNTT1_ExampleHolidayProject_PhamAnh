import { useState, useTransition, Activity } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SAMPLE_TENANTS, SAMPLE_EMPLOYEES, SAMPLE_CONTRACTS, INITIAL_ORDERS, INITIAL_PLANS, INITIAL_LEAVE_REQUESTS, INITIAL_CLOCK_LOGS, INITIAL_MATERIAL_IMPORTS, INITIAL_FINISHED_IMPORTS } from "./data";
import { Tenant, Employee, Contract, SalesOrder, ProductionPlan, LeaveRequest, ClockLog, User as UserType, MaterialImport, FinishedProductImport } from "./types";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import DashboardScreen from "./components/DashboardScreen";
import HRMScreen from "./components/HRMScreen";
import SalesScreen from "./components/SalesScreen";
import ProductionScreen from "./components/ProductionScreen";
import WorkerScreen from "./components/WorkerScreen";
import LoginScreen from "./components/LoginScreen";
import SysAdminScreen from "./components/SysAdminScreen";
import TenantDetailScreen from "./components/TenantDetailScreen";
import { logoutApi } from "./api";

// Cấu hình phân loại vai trò với tab truy cập mặc định (Dễ bảo trì và mở rộng)
export function getDefaultTabForRole(role: string): string {
  const cleanRole = role.toUpperCase();
  
  // 1. Quản trị hệ thống tối cao (SaaS Super Admin)
  if (cleanRole === "SUPER_ADMIN" || cleanRole.includes("SUPER_ADMIN") || cleanRole.includes("TOÀN BỘ HỆ THỐNG SAAS") || cleanRole.includes("QUẢN TRỊ HỆ THỐNG")) {
    return "sys-admin";
  }
  
  // 2. Ban Giám Đốc / Chủ doanh nghiệp / Admin doanh nghiệp
  if (cleanRole === "BOD / OWNER" || cleanRole === "DIRECTOR" || cleanRole === "ADMIN_DN") {
    return "dashboard";
  }
  
  // 3. Bộ phận Nhân sự (HRM)
  if (cleanRole === "HR MANAGER" || cleanRole === "HR_STAFF") {
    return "hrm";
  }
  
  // 4. Bộ phận Kinh doanh (Sales)
  if (cleanRole === "SALES STAFF" || cleanRole === "SALES_STAFF") {
    return "sales";
  }
  
  // 5. Bộ phận Kế toán (Accountant)
  if (cleanRole === "ACCOUNTANT" || cleanRole === "ACCOUNTANT_STAFF" || cleanRole === "AD") {
    return "accountant";
  }
  
  // 6. Bộ phận Sản xuất & Công nhân (Production)
  if (cleanRole === "PRODUCTION WORKER" || cleanRole === "WORKER" || cleanRole === "PRODUCTION_STAFF") {
    return "worker-portal";
  }
  
  // Dự phòng: Nếu có vai trò/phòng ban mới được mở rộng sau này, tự động định tuyến về Dashboard chung
  return "dashboard";
}

export default function App() {
  // Tự động kiểm tra và dọn sạch session mock cũ (nếu có)
  const token = localStorage.getItem("saas_token");
  const isMockToken = token === "mock-jwt-token-for-dev";
  if (isMockToken) {
    localStorage.removeItem("saas_user");
    localStorage.removeItem("saas_token");
  }

  const [activeTab, setActiveTab] = useState(() => {
    if (isMockToken) return "dashboard";
    const saved = localStorage.getItem("saas_user");
    if (saved) {
      const user = JSON.parse(saved) as UserType;
      return getDefaultTabForRole(user.role);
    }
    return "dashboard";
  });
  const [, startTransition] = useTransition();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    if (isMockToken) return null;
    const saved = localStorage.getItem("saas_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  // Multi-tenant selection states
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => {
    if (!isMockToken) {
      const saved = localStorage.getItem("saas_user");
      if (saved) {
        const user = JSON.parse(saved) as UserType;
        const found = SAMPLE_TENANTS.find(t => t.id === user.tenantId);
        if (found) return found;
      }
    }
    if (SAMPLE_TENANTS.length > 0) return SAMPLE_TENANTS[0];
    return {
      id: "tenant-system",
      name: "Oasis SaaS Platform",
      industry: "Hệ thống quản trị tổng",
      subdomain: "system.saas-erp.vn",
      logo: "SYS",
      taxCode: "None"
    };
  });

  // Unified State Engine for cross-screen data syncing
  const [employees, setEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES);
  const [contracts, setContracts] = useState<Contract[]>(SAMPLE_CONTRACTS);
  const [orders, setOrders] = useState<SalesOrder[]>(INITIAL_ORDERS);
  const [plans, setPlans] = useState<ProductionPlan[]>(INITIAL_PLANS);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [logs, setLogs] = useState<ClockLog[]>(INITIAL_CLOCK_LOGS);
  const [materialImports, setMaterialImports] = useState<MaterialImport[]>(INITIAL_MATERIAL_IMPORTS);
  const [finishedImports, setFinishedImports] = useState<FinishedProductImport[]>(INITIAL_FINISHED_IMPORTS);

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

  const handleAddMaterialImport = (imp: MaterialImport) => {
    setMaterialImports((prev) => [imp, ...prev]);
  };

  const handleAddFinishedImport = (fimp: FinishedProductImport) => {
    setFinishedImports((prev) => [fimp, ...prev]);
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
          setActiveTab(getDefaultTabForRole(user.role));
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
        onLogout={async () => {
          await logoutApi();
          setCurrentUser(null);
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
          currentUser={currentUser}
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
                  materialImports={materialImports}
                  onAddMaterialImport={handleAddMaterialImport}
                  finishedImports={finishedImports}
                  onAddFinishedImport={handleAddFinishedImport}
                />
              )}

              {activeTab === "worker-portal" && (
                <WorkerScreen
                  logs={logs}
                  onAddClockLog={handleAddClockLog}
                  onAddLeaveRequest={handleAddLeaveRequest}
                />
              )}

              {activeTab === "sys-admin" && (
                <SysAdminScreen
                  onViewTenantDetail={(tenant) => {
                    setSelectedTenant(tenant);
                    handleTabChange("sys-admin-tenant-detail");
                  }}
                />
              )}

              {activeTab === "sys-admin-tenant-detail" && selectedTenant && (
                <TenantDetailScreen
                  tenant={selectedTenant}
                  onBack={() => handleTabChange("sys-admin")}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
