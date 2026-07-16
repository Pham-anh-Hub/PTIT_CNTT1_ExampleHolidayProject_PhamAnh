import { useState, useEffect, useTransition, Activity } from "react";
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
import BusinessAdminScreen from "./components/BusinessAdminScreen";
import {
  logoutApi,
  getTenantCompanyProfileApi,
  getBodNotificationsApi,
  getBodNotificationsUnreadCountApi,
  markBodNotificationReadApi,
  markAllBodNotificationsReadApi,
  API_BASE_URL
} from "./api";

// Bộ STOMP client gọn nhẹ viết bằng Vanilla WebSocket để kết nối real-time
export class StompClient {
  private ws: WebSocket | null = null;
  private connected = false;
  private subscriptions: Map<string, (msg: any) => void> = new Map();
  private reconnectTimer: any = null;

  constructor(private url: string) {}

  connect(onConnect: () => void, onError: (err: any) => void) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      // Gửi CONNECT frame ban đầu
      const connectFrame = "CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n\n\u0000";
      this.ws?.send(connectFrame);
    };

    this.ws.onmessage = (event) => {
      const data = event.data;
      if (data.startsWith("CONNECTED")) {
        this.connected = true;
        onConnect();
        // Đăng ký lại các topic nếu có
        for (const [destination] of this.subscriptions) {
          this.sendSubscribe(destination);
        }
      } else if (data.startsWith("MESSAGE")) {
        // Tách header và body của tin nhắn STOMP
        const lines = data.split("\n");
        let dest = "";
        let bodyStart = false;
        let body = "";
        for (const line of lines) {
          if (bodyStart) {
            body += line + "\n";
          } else if (line.startsWith("destination:")) {
            dest = line.split("destination:")[1].trim();
          } else if (line === "") {
            bodyStart = true;
          }
        }
        // Loại bỏ ký tự null cuối cùng (\u0000)
        if (body.endsWith("\u0000\n")) {
          body = body.slice(0, -2);
        } else if (body.endsWith("\u0000")) {
          body = body.slice(0, -1);
        }
        try {
          const parsed = JSON.parse(body.trim());
          const callback = this.subscriptions.get(dest);
          if (callback) callback(parsed);
        } catch (e) {
          console.error("Lỗi parse dữ liệu thông báo WebSocket:", body, e);
        }
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      // Tự động kết nối lại sau 5 giây
      this.reconnectTimer = setTimeout(() => this.connect(onConnect, onError), 5000);
    };

    this.ws.onerror = (err) => {
      onError(err);
    };
  }

  subscribe(destination: string, callback: (msg: any) => void) {
    this.subscriptions.set(destination, callback);
    if (this.connected) {
      this.sendSubscribe(destination);
    }
  }

  private sendSubscribe(destination: string) {
    const frame = `SUBSCRIBE\nid:sub-${destination}\ndestination:${destination}\n\n\u0000`;
    this.ws?.send(frame);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.connected = false;
    this.subscriptions.clear();
  }
}


// Cấu hình phân loại vai trò với tab truy cập mặc định (Dễ bảo trì và mở rộng)
export function getDefaultTabForRole(role: string): string {
  const cleanRole = role.toUpperCase();
  
  // 1. Quản trị hệ thống tối cao (SaaS Super Admin)
  if (cleanRole === "SUPER_ADMIN" || cleanRole.includes("SUPER_ADMIN") || cleanRole.includes("TOÀN BỘ HỆ THỐNG SAAS") || cleanRole.includes("QUẢN TRỊ HỆ THỐNG")) {
    return "sys-admin";
  }
  
  // 2. Admin doanh nghiệp (Quản trị doanh nghiệp)
  if (cleanRole === "ADMIN_DN" || cleanRole.includes("QUẢN TRỊ DOANH NGHIỆP")) {
    return "tenant-admin-dashboard";
  }
  
  // Ban Giám Đốc / Chủ doanh nghiệp
  if (cleanRole === "BOD / OWNER" || cleanRole === "DIRECTOR" || cleanRole.includes("CHỦ DOANH NGHIỆP") || cleanRole.includes("GIÁM ĐỐC")) {
    return "dashboard";
  }
  
  // 3. Bộ phận Nhân sự (HRM)
  if (cleanRole === "HR MANAGER" || cleanRole === "HR_STAFF" || cleanRole.includes("NHÂN SỰ") || cleanRole.includes("HR")) {
    return "hrm";
  }
  
  // 4. Bộ phận Kinh doanh (Sales)
  if (cleanRole === "SALES STAFF" || cleanRole === "SALES_STAFF" || cleanRole.includes("KINH DOANH") || cleanRole.includes("SALES")) {
    return "sales";
  }
  
  // 5. Bộ phận Kế toán (Accountant)
  if (cleanRole === "ACCOUNTANT" || cleanRole === "ACCOUNTANT_STAFF" || cleanRole === "AD" || cleanRole.includes("KẾ TOÁN")) {
    return "accountant";
  }
  
  // 6. Bộ phận Sản xuất & Công nhân (Production)
  if (cleanRole === "PRODUCTION WORKER" || cleanRole === "WORKER" || cleanRole === "PRODUCTION_STAFF" || cleanRole.includes("SẢN XUẤT") || cleanRole.includes("CÔNG NHÂN")) {
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

  // Real-time notifications state for BOD/DIRECTOR
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tự động tải thông tin doanh nghiệp khi người dùng đăng nhập thành công
  useEffect(() => {
    if (currentUser) {
      getTenantCompanyProfileApi()
        .then((res) => {
          if (res.data) {
            setCurrentTenant(res.data);
          }
        })
        .catch((err) => {
          console.error("Lỗi lấy thông tin doanh nghiệp đăng nhập:", err);
        });
    }
  }, [currentUser]);

  // Tải danh sách thông báo và khởi tạo kết nối WebSocket cho Giám đốc / BOD
  useEffect(() => {
    if (!currentUser) return;

    const cleanRole = currentUser.role.toUpperCase();
    const isBOD = cleanRole === "BOD / OWNER" || cleanRole === "DIRECTOR" || cleanRole === "ADMIN_DN" || cleanRole.includes("CHỦ DOANH NGHIỆP") || cleanRole.includes("GIÁM ĐỐC");

    if (!isBOD) return;

    // 1. Tải danh sách thông báo hiện có trong CSDL
    const loadNotifications = async () => {
      try {
        const notifsRes = await getBodNotificationsApi();
        setNotifications(notifsRes.data || []);
        
        const countRes = await getBodNotificationsUnreadCountApi();
        setUnreadNotifCount(countRes.data || 0);
      } catch (err) {
        console.error("Không thể tải danh sách thông báo từ API:", err);
      }
    };

    loadNotifications();

    // 2. Khởi tạo kết nối WebSocket STOMP
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsHost = "localhost:8080";
    if (API_BASE_URL.includes("://")) {
      wsHost = API_BASE_URL.split("://")[1];
    } else {
      wsHost = window.location.host;
    }
    
    const wsUrl = `${wsProto}//${wsHost}/ws/websocket`;
    const stompClient = new StompClient(wsUrl);
    const tenantId = currentUser.tenantId || currentTenant.id;

    stompClient.connect(
      () => {
        console.log(">>> WebSocket STOMP Connected successfully!");
        
        // Đăng ký nhận thông báo phê duyệt
        stompClient.subscribe(`/topic/approvals/${tenantId}`, (payload: any) => {
          console.log(">>> Nhận được thông báo thời gian thực:", payload);
          
          // Thêm thông báo mới vào đầu danh sách
          setNotifications(prev => [payload, ...prev]);
          setUnreadNotifCount(prev => prev + 1);

          // Hiển thị toast thông báo Premium
          setToastMessage(payload.title || "Có thông báo phê duyệt mới!");
          setTimeout(() => setToastMessage(null), 5000);
        });
      },
      (err) => {
        console.error("Lỗi kết nối WebSocket STOMP:", err);
      }
    );

    return () => {
      stompClient.disconnect();
    };
  }, [currentUser, currentTenant.id]);

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await markBodNotificationReadApi(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc thông báo:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllBodNotificationsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error("Lỗi đánh dấu đọc tất cả thông báo:", err);
    }
  };


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
        liveNotifications={notifications}
        liveUnreadCount={unreadNotifCount}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
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

              {(activeTab === "tenant-admin-dashboard" || 
                activeTab === "tenant-admin-accounts" || 
                activeTab === "tenant-admin-settings" || 
                activeTab.startsWith("tenant-admin-accounts-dept-")) && currentUser && (
                <BusinessAdminScreen
                  currentTenant={currentTenant}
                  currentUser={currentUser}
                  activeTab={activeTab}
                  selectedDepartmentId={
                    activeTab.startsWith("tenant-admin-accounts-dept-") 
                      ? activeTab.replace("tenant-admin-accounts-dept-", "") 
                      : null
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Alert nổi thời gian thực */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-full px-4"
          >
            <div className="bg-blue-950/95 backdrop-blur-md text-white px-5 py-4 rounded-[24px] shadow-2xl border border-white/10 flex items-start space-x-3.5">
              <div className="p-2 rounded-xl bg-white/10 text-emerald-400 shrink-0">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-left text-xs flex-1">
                <span className="font-extrabold block text-[10px] uppercase text-slate-300 tracking-wider">Thông báo Real-time</span>
                <p className="font-bold text-white mt-1 leading-normal">{toastMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
