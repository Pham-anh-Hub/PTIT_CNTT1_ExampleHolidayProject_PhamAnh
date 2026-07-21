import React, { lazy, Suspense, useContext } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { ROUTES, getDefaultRouteForRole } from "./routeConfig";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";
import LoadingSpinner from "../components/LoadingSpinner";
import { AuthContext } from "../context/AuthContext";
import { DataContext } from "../context/DataContext";
import { User as UserType } from "../types";

interface AppRoutesProps {
  onLoginSuccess: (user: UserType) => void;
}

// ─── Lazy Imports ──────────────────────────────────────────────────────────────
const LoginScreen = lazy(() => import("../components/LoginScreen"));
const DashboardScreen = lazy(() => import("../components/DashboardScreen"));
const BodHrmScreen = lazy(() => import("../components/BodHrmScreen"));
const BodSalesScreen = lazy(() => import("../components/BodSalesScreen"));
const BodFinanceScreen = lazy(() => import("../components/BodFinanceScreen"));
const BodProductionScreen = lazy(() => import("../components/BodProductionScreen"));
const BodSettingsScreen = lazy(() => import("../components/BodSettingsScreen"));
const HRMScreen = lazy(() => import("../components/HRMScreen"));
const SalesScreen = lazy(() => import("../components/SalesScreen"));
const ProductionScreen = lazy(() => import("../components/ProductionScreen"));
const AccountantScreen = lazy(() => import("../components/AccountantScreen"));
const WorkerScreen = lazy(() => import("../components/WorkerScreen"));
const SysAdminScreen = lazy(() => import("../components/SysAdminScreen"));
const TenantDetailScreen = lazy(() => import("../components/TenantDetailScreen"));
const BusinessAdminScreen = lazy(() => import("../components/BusinessAdminScreen"));

// ─── Roles constants ──────────────────────────────────────────────────────────
const BOD_ROLES = ["BOD / OWNER", "DIRECTOR", "BOD"];
const HR_ROLES = ["HR MANAGER", "HR_STAFF", "NHÂN SỰ", "HR"];
const SALES_ROLES = ["SALES STAFF", "SALES_STAFF", "KINH DOANH", "SALES"];
const PRODUCTION_ROLES = ["PRODUCTION WORKER", "WORKER", "PRODUCTION_STAFF", "SẢN XUẤT", "CÔNG NHÂN"];
const ACCOUNTANT_ROLES = ["ACCOUNTANT", "ACCOUNTANT_STAFF", "AD", "KẾ TOÁN"];
const ADMIN_DN_ROLES = ["ADMIN_DN", "QUẢN TRỊ DOANH NGHIỆP"];
const SUPER_ADMIN_ROLES = ["SUPER_ADMIN", "TOÀN BỘ HỆ THỐNG SAAS", "QUẢN TRỊ HỆ THỐNG"];

// ─── Wrapper: DashboardScreen với DataContext ─────────────────────────────────
function DashboardWrapper() {
  const data = useContext(DataContext)!;
  const { orders, setOrders, contracts, setContracts, leaves, setLeaves, notifications, setNotifications, setUnreadNotifCount } = data;

  const handleApproveOrder = (id: string) =>
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "APPROVED" } : o));
  const handleRejectOrder = (id: string, reason: string) =>
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "REJECTED", rejectionReason: reason } : o));
  const handleApproveContract = (id: string) =>
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: "APPROVED", approvedBy: "BOD" } : c));
  const handleRejectContract = (id: string, reason: string) =>
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: "REJECTED", rejectionReason: reason } : c));
  const handleApproveLeave = (id: string) =>
    setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: "APPROVED" } : l));
  const handleRejectLeave = (id: string, reason: string) =>
    setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: "REJECTED", rejectionReason: reason } : l));

  // Mark notification as read — cập nhật cả notifications list và unread count
  const handleMarkNotificationRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadNotifCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardScreen
        liveNotifications={notifications}
        targetNotificationId={null}
        onClearTargetNotification={() => { }}
        onMarkNotificationRead={handleMarkNotificationRead}
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
    </Suspense>
  );
}

// ─── Wrapper: BodHrmScreen ────────────────────────────────────────────────────
function BodHrmWrapper() {
  const data = useContext(DataContext)!;
  const { notifications, setNotifications, setUnreadNotifCount } = data;

  const handleMarkNotifRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadNotifCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BodHrmScreen
        sharedNotifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
      />
    </Suspense>
  );
}

// ─── Wrapper: BodSalesScreen ──────────────────────────────────────────────────
function BodSalesWrapper() {
  const data = useContext(DataContext)!;
  const { orders, setOrders, notifications, setNotifications, setUnreadNotifCount } = data;

  const handleApproveOrder = (id: string) =>
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "APPROVED" } : o));
  const handleRejectOrder = (id: string, reason: string) =>
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "REJECTED", rejectionReason: reason } : o));

  // Mark notification as read — sync về DataContext để Dashboard cập nhật
  const handleMarkNotifRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadNotifCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BodSalesScreen
        orders={orders}
        onApproveOrder={handleApproveOrder}
        onRejectOrder={handleRejectOrder}
        sharedNotifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
      />
    </Suspense>
  );
}

// ─── Wrapper: BodFinanceScreen ────────────────────────────────────────────────
function BodFinanceWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BodFinanceScreen />
    </Suspense>
  );
}

// ─── Wrapper: BodProductionScreen ─────────────────────────────────────────────
function BodProductionWrapper() {
  const data = useContext(DataContext)!;
  const { notifications, setNotifications, setUnreadNotifCount } = data;

  const handleMarkNotifRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadNotifCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BodProductionScreen
        sharedNotifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
      />
    </Suspense>
  );
}

// ─── Wrapper: BodSettingsScreen ───────────────────────────────────────────────
function BodSettingsWrapper() {
  const data = useContext(DataContext)!;
  const { notifications, setNotifications, setUnreadNotifCount } = data;

  const handleMarkNotifRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadNotifCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BodSettingsScreen
        sharedNotifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
      />
    </Suspense>
  );
}

// ─── Wrapper: HRMScreen ───────────────────────────────────────────────────────
function HrmWrapper() {
  const data = useContext(DataContext)!;
  const { employees, setEmployees, contracts, setContracts } = data;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HRMScreen
        employees={employees}
        contracts={contracts}
        onAddEmployee={(emp) => setEmployees((prev) => [emp, ...prev])}
        onUpdateEmployee={(emp) => setEmployees((prev) => prev.map((e) => e.id === emp.id ? emp : e))}
        onAddContract={(con) => setContracts((prev) => [con, ...prev])}
      />
    </Suspense>
  );
}

// ─── Wrapper: SalesScreen ─────────────────────────────────────────────────────
function SalesWrapper() {
  const data = useContext(DataContext)!;
  const { orders, setOrders } = data;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SalesScreen orders={orders} onAddOrder={(ord) => setOrders((prev) => [ord, ...prev])} />
    </Suspense>
  );
}

// ─── Wrapper: ProductionScreen ────────────────────────────────────────────────
function ProductionWrapper() {
  const data = useContext(DataContext)!;
  const { plans, setPlans, materialImports, setMaterialImports, finishedImports, setFinishedImports } = data;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductionScreen
        plans={plans}
        onAddPlan={(p) => setPlans((prev) => [p, ...prev])}
        materialImports={materialImports}
        onAddMaterialImport={(imp) => setMaterialImports((prev) => [imp, ...prev])}
        finishedImports={finishedImports}
        onAddFinishedImport={(fimp) => setFinishedImports((prev) => [fimp, ...prev])}
      />
    </Suspense>
  );
}

// ─── Wrapper: AccountantScreen ────────────────────────────────────────────────
interface AccountantWrapperProps {
  initialTab?: "payroll_production" | "payroll_office" | "receipts_expenses" | "debts";
}

function AccountantWrapper({ initialTab = "payroll_production" }: AccountantWrapperProps) {
  const data = useContext(DataContext)!;
  const { employees, contracts, orders, materialImports, setMaterialImports, finishedImports, setFinishedImports } = data;

  // SupplierPayables và tax rate sống local (kế toán quản lý riêng)
  const [supplierPayables, setSupplierPayables] = React.useState([
    { id: "sp-1", supplierName: "Gỗ Tự Nhiên Miền Trung", totalAmount: 60000000, remainingAmount: 45000000, paidAmount: 15000000, dueDate: "2026-07-25", status: "WARNING" as const },
    { id: "sp-2", supplierName: "Sơn Công Nghiệp PU Hà Thành", totalAmount: 20000000, remainingAmount: 12000000, paidAmount: 8000000, dueDate: "2026-07-28", status: "GOOD" as const },
  ]);
  const [corporateTaxRate, setCorporateTaxRate] = React.useState(20);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AccountantScreen
        initialTab={initialTab}
        employees={employees}
        contracts={contracts}
        orders={orders}
        materialImports={materialImports}
        onAddMaterialImport={(imp) => setMaterialImports((prev) => [imp, ...prev])}
        finishedImports={finishedImports}
        onAddFinishedImport={(fimp) => setFinishedImports((prev) => [fimp, ...prev])}
        supplierPayables={supplierPayables}
        onUpdateSupplierPayable={(id, amount) =>
          setSupplierPayables((prev) =>
            prev.map((s) => s.id === id ? { ...s, paidAmount: s.paidAmount + amount, remainingAmount: Math.max(0, s.remainingAmount - amount) } : s)
          )
        }
        corporateTaxRate={corporateTaxRate}
        onUpdateTaxRate={setCorporateTaxRate}
      />
    </Suspense>
  );
}

// ─── Wrapper: WorkerScreen ────────────────────────────────────────────────────
function WorkerWrapper() {
  const data = useContext(DataContext)!;
  const { logs, setLogs, leaves, setLeaves } = data;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WorkerScreen
        logs={logs}
        onAddClockLog={(log) => setLogs((prev) => [log, ...prev])}
        onAddLeaveRequest={(req) => setLeaves((prev) => [req, ...prev])}
      />
    </Suspense>
  );
}

// ─── Wrapper: TenantDetailScreen ──────────────────────────────────────────────
function TenantDetailWrapper() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const fakeTenant = {
    id: tenantId ?? "",
    name: "",
    code: "",
    industry: "",
    subdomain: "",
    logo: "",
    taxCode: "",
    plan: "TRIAL",
    adminName: "",
    adminEmail: "",
    createdAt: "",
    status: "ACTIVE",
  };
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TenantDetailScreen tenant={fakeTenant} onBack={() => window.history.back()} />
    </Suspense>
  );
}

// ─── Wrapper: AdminAccountsDept ───────────────────────────────────────────────
function AdminAccountsDeptWrapper() {
  const { deptId } = useParams<{ deptId: string }>();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BusinessAdminScreen
        activeTab={`tenant-admin-accounts-dept-${deptId}`}
        selectedDepartmentId={deptId ?? null}
      />
    </Suspense>
  );
}

// ─── HomeRedirect ─────────────────────────────────────────────────────────────
function HomeRedirect() {
  const auth = useContext(AuthContext);
  if (!auth?.currentUser) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Navigate to={getDefaultRouteForRole(auth.currentUser.role)} replace />;
}

// ─── AppRoutes ────────────────────────────────────────────────────────────────
export default function AppRoutes({ onLoginSuccess }: AppRoutesProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* ─── Public ───────────────────────────────────────────────── */}
        <Route path={ROUTES.LOGIN} element={<LoginScreen onLoginSuccess={onLoginSuccess} />} />

        {/* ─── Redirect gốc "/" ────────────────────────────────────── */}
        <Route path="/" element={<HomeRedirect />} />

        {/* ─── Protected (Yêu cầu đăng nhập) ──────────────────────── */}
        <Route element={<RequireAuth />}>

          {/* BOD / DIRECTOR */}
          <Route element={<RequireRole allowedRoles={BOD_ROLES} />}>
            <Route path={ROUTES.BOD_DASHBOARD} element={<DashboardWrapper />} />
            <Route path={ROUTES.BOD_FINANCE} element={<BodFinanceWrapper />} />
            <Route path={ROUTES.BOD_HRM} element={<BodHrmWrapper />} />
            <Route path={ROUTES.BOD_SALES} element={<BodSalesWrapper />} />
            <Route path={ROUTES.BOD_PRODUCTION} element={<BodProductionWrapper />} />
            <Route path={ROUTES.BOD_SETTINGS} element={<BodSettingsWrapper />} />
          </Route>

          {/* HR */}
          <Route element={<RequireRole allowedRoles={HR_ROLES} />}>
            <Route path={ROUTES.HR_HRM} element={<HrmWrapper />} />
          </Route>

          {/* Sales */}
          <Route element={<RequireRole allowedRoles={SALES_ROLES} />}>
            <Route path={ROUTES.SALES_ORDERS} element={<SalesWrapper />} />
          </Route>

          {/* Production */}
          <Route element={<RequireRole allowedRoles={PRODUCTION_ROLES} />}>
            <Route path={ROUTES.PRODUCTION_PLANS} element={<ProductionWrapper />} />
          </Route>

          {/* Accountant — 4 Direct URL Routes */}
          <Route element={<RequireRole allowedRoles={ACCOUNTANT_ROLES} />}>
            <Route path={ROUTES.ACCOUNTANT_FINANCE} element={<Navigate to={ROUTES.ACCOUNTANT_PRODUCTION_PAYROLL} replace />} />
            <Route path={ROUTES.ACCOUNTANT_PRODUCTION_PAYROLL} element={<AccountantWrapper initialTab="payroll_production" />} />
            <Route path={ROUTES.ACCOUNTANT_OFFICE_PAYROLL} element={<AccountantWrapper initialTab="payroll_office" />} />
            <Route path={ROUTES.ACCOUNTANT_VOUCHERS} element={<AccountantWrapper initialTab="receipts_expenses" />} />
            <Route path={ROUTES.ACCOUNTANT_DEBTS} element={<AccountantWrapper initialTab="debts" />} />
          </Route>

          {/* Worker */}
          <Route element={<RequireRole allowedRoles={PRODUCTION_ROLES} />}>
            <Route path={ROUTES.WORKER_PORTAL} element={<WorkerWrapper />} />
          </Route>

          {/* Super Admin */}
          <Route element={<RequireRole allowedRoles={SUPER_ADMIN_ROLES} />}>
            <Route path={ROUTES.SYS_ADMIN} element={<Suspense fallback={<LoadingSpinner />}><SysAdminScreen /></Suspense>} />
            <Route path={ROUTES.SYS_ADMIN_TENANT} element={<TenantDetailWrapper />} />
          </Route>

          {/* Admin DN */}
          <Route element={<RequireRole allowedRoles={ADMIN_DN_ROLES} />}>
            <Route
              path={ROUTES.ADMIN_DASHBOARD}
              element={<Suspense fallback={<LoadingSpinner />}><BusinessAdminScreen activeTab="tenant-admin-dashboard" selectedDepartmentId={null} /></Suspense>}
            />
            <Route
              path={ROUTES.ADMIN_ACCOUNTS}
              element={<Suspense fallback={<LoadingSpinner />}><BusinessAdminScreen activeTab="tenant-admin-accounts" selectedDepartmentId={null} /></Suspense>}
            />
            <Route path={ROUTES.ADMIN_ACCOUNTS_DEPT} element={<AdminAccountsDeptWrapper />} />
            <Route
              path={ROUTES.ADMIN_SETTINGS}
              element={<Suspense fallback={<LoadingSpinner />}><BusinessAdminScreen activeTab="tenant-admin-settings" selectedDepartmentId={null} /></Suspense>}
            />
          </Route>

        </Route>

        {/* ─── 404 ─────────────────────────────────────────────────── */}
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </Suspense>
  );
}
