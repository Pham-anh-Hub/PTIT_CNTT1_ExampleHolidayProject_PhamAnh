import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { SAMPLE_TENANTS } from "./data";
import { Tenant, User as UserType } from "./types";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AppRoutes from "./router/AppRoutes";
import { ROUTES, getDefaultRouteForRole } from "./router/routeConfig";
import { AuthContext } from "./context/AuthContext";
import { DataContext } from "./context/DataContext";
import {
  logoutApi,
  getTenantCompanyProfileApi,
  getBodNotificationsApi,
  getBodNotificationsUnreadCountApi,
  markBodNotificationReadApi,
  markAllBodNotificationsReadApi,
  API_BASE_URL,
} from "./api";

// ─── StompClient (giữ nguyên, tách ra nếu cần refactor sau) ─────────────────
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
      const connectFrame = "CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n\n\u0000";
      this.ws?.send(connectFrame);
    };

    this.ws.onmessage = (event) => {
      const data = event.data;
      if (data.startsWith("CONNECTED")) {
        this.connected = true;
        onConnect();
        for (const [destination] of this.subscriptions) {
          this.sendSubscribe(destination);
        }
      } else if (data.startsWith("MESSAGE")) {
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
        if (body.endsWith("\u0000\n")) body = body.slice(0, -2);
        else if (body.endsWith("\u0000")) body = body.slice(0, -1);
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
      this.reconnectTimer = setTimeout(() => this.connect(onConnect, onError), 5000);
    };

    this.ws.onerror = (err) => { onError(err); };
  }

  subscribe(destination: string, callback: (msg: any) => void) {
    this.subscriptions.set(destination, callback);
    if (this.connected) this.sendSubscribe(destination);
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

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra đường dẫn hiện tại — nếu là /login thì KHÔNG render layout
  const isLoginPage = location.pathname === ROUTES.LOGIN;

  // Dọn sạch session mock cũ (nếu có)
  useEffect(() => {
    const token = localStorage.getItem("saas_token");
    if (token === "mock-jwt-token-for-dev") {
      localStorage.removeItem("saas_user");
      localStorage.removeItem("saas_token");
      auth?.setCurrentUser(null);
    }
  }, []);

  const currentUser = auth?.currentUser ?? null;

  // Tenant state
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => {
    const saved = localStorage.getItem("saas_user");
    if (saved) {
      const user = JSON.parse(saved) as UserType;
      const found = SAMPLE_TENANTS.find((t) => t.id === user.tenantId);
      if (found) return found;
    }
    return SAMPLE_TENANTS[0] ?? {
      id: "tenant-system",
      name: "Oasis SaaS Platform",
      industry: "Hệ thống quản trị tổng",
      subdomain: "system.saas-erp.vn",
      logo: "SYS",
      taxCode: "None",
    };
  });

  // Notifications state (App-level, sẽ có sync vào DataContext)
  const [notifications, setNotificationsLocal] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCountLocal] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  // DataContext — để sync notifications cho Dashboard và BodSales
  const dataCtx = useContext(DataContext);

  // Wrapper để set notifications và sync vào DataContext
  const setNotifications = (updater: any[] | ((prev: any[]) => any[])) => {
    setNotificationsLocal((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Sync vào DataContext ngay lập tức
      if (dataCtx) dataCtx.setNotifications(next);
      return next;
    });
  };
  const setUnreadNotifCount = (updater: number | ((prev: number) => number)) => {
    setUnreadNotifCountLocal((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (dataCtx) dataCtx.setUnreadNotifCount(next);
      return next;
    });
  };

  // Tải thông tin doanh nghiệp khi đăng nhập
  useEffect(() => {
    if (currentUser) {
      getTenantCompanyProfileApi()
        .then((res) => { if (res.data) setCurrentTenant(res.data); })
        .catch((err) => console.error("Lỗi lấy thông tin doanh nghiệp:", err));
    }
  }, [currentUser]);

  // WebSocket & Notifications cho BOD
  useEffect(() => {
    if (!currentUser) return;
    const r = currentUser.role.toUpperCase();
    const isBOD =
      r === "BOD / OWNER" || r === "DIRECTOR" || r === "ADMIN_DN" ||
      r.includes("CHỦ DOANH NGHIỆP") || r.includes("GIÁM ĐỐC");
    if (!isBOD) return;

    const load = async () => {
      try {
        const notifsRes = await getBodNotificationsApi();
        const rawList = notifsRes.data || [];
        // Lọc chỉ giữ lại thông báo dành cho BOD (targetRole là BOD hoặc null/rỗng)
        const bodOnlyList = rawList.filter((n: any) => (!n.targetRole || n.targetRole === "BOD") && n.type !== "ACCOUNTANT_EXPLANATION");
        setNotifications(bodOnlyList);
        const countRes = await getBodNotificationsUnreadCountApi();
        setUnreadNotifCount(bodOnlyList.filter((n: any) => !n.isRead).length);
      } catch (err) {
        console.error("Không thể tải thông báo:", err);
      }
    };
    load();

    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsHost = "localhost:8080";
    if (API_BASE_URL.includes("://")) wsHost = API_BASE_URL.split("://")[1];
    else wsHost = window.location.host;

    const wsUrl = `${wsProto}//${wsHost}/ws/websocket`;
    const stomp = new StompClient(wsUrl);
    stomp.connect(
      () => {
        stomp.subscribe(`/topic/approvals/${currentTenant.id}`, (payload: any) => {
          // Chỉ thêm thông báo nếu dành cho BOD
          if ((!payload.targetRole || payload.targetRole === "BOD") && payload.type !== "ACCOUNTANT_EXPLANATION") {
            setNotifications((prev) => [payload, ...prev]);
            setUnreadNotifCount((prev) => prev + 1);
            setToastMessage(payload.title || "Có thông báo phê duyệt mới!");
            setTimeout(() => setToastMessage(null), 5000);
          }
        });
      },
      (err) => console.error("Lỗi WebSocket STOMP:", err)
    );

    return () => stomp.disconnect();
  }, [currentUser, currentTenant.id]);

  // Session expired listener — xoá user NGAY và redirect về login
  // Dùng useRef để debounce, tránh nhiều event 401 đồng thời gây lặp
  const sessionExpiredHandled = React.useRef(false);
  useEffect(() => {
    const handler = () => {
      // Chặn xử lý trùng nếu nhiều 401 phát sinh cùng lúc
      if (sessionExpiredHandled.current) return;
      sessionExpiredHandled.current = true;

      // Xoá phiên ngay lập tức để layout bỏ Navbar/Sidebar
      localStorage.removeItem("saas_user");
      localStorage.removeItem("saas_token");
      auth?.setCurrentUser(null);
      // Hiện modal thông báo trên trang login
      setShowSessionExpired(true);
      navigate(ROUTES.LOGIN, { replace: true });

      // Reset debounce flag sau 2 giây
      setTimeout(() => { sessionExpiredHandled.current = false; }, 2000);
    };
    window.addEventListener("session-expired", handler);
    return () => window.removeEventListener("session-expired", handler);
  }, [auth, navigate]);

  const handleSessionConfirm = () => {
    setShowSessionExpired(false);
  };

  const handleLoginSuccess = (user: UserType) => {
    auth?.setCurrentUser(user);
    localStorage.setItem("saas_user", JSON.stringify(user));
    const found = SAMPLE_TENANTS.find((t) => t.id === user.tenantId);
    if (found) setCurrentTenant(found);
    navigate(getDefaultRouteForRole(user.role), { replace: true });
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await markBodNotificationReadApi(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllBodNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error("Lỗi đánh dấu đọc tất cả:", err);
    }
  };

  // Pending counts cho badge
  const pendingApprovalsCount = unreadNotifCount;

  // ─── LoginScreen — không có layout (Navbar/Sidebar) ────────────────────────
  // Được render trực tiếp qua AppRoutes khi path === /login
  // Chú ý: AppRoutes cần biết onLoginSuccess → truyền qua Context
  // Tạm thời dùng cách truyền qua prop của LoginScreen trong AppRoutes wrapper
  // Để đơn giản hơn, ta để AppRoutes render LoginScreen độc lập (không qua layout)
  // và sử dụng AuthContext.setCurrentUser bên trong LoginScreen.

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-hidden"
      id="saas-system-root"
    >
      {/* Layout chỉ hiện khi đã đăng nhập VÀ KHÔNG ở trang login */}
      {currentUser && !isLoginPage ? (
        <>
          <Navbar
            currentTenant={currentTenant}
            tenants={SAMPLE_TENANTS}
            onTenantChange={setCurrentTenant}
            pendingApprovalsCount={pendingApprovalsCount}
            pendingOrders={0}
            pendingContracts={0}
            pendingLeaves={0}
            currentUser={currentUser}
            onLogout={async () => {
              await logoutApi();
              auth?.setCurrentUser(null);
              navigate(ROUTES.LOGIN, { replace: true });
            }}
            liveNotifications={notifications}
            liveUnreadCount={unreadNotifCount}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          />

          <div className="flex flex-1 overflow-hidden" id="enterprise-main-frame">
            <Sidebar
              currentUser={currentUser}
              currentTenant={currentTenant}
              pendingApprovalsCount={pendingApprovalsCount}
            />

            <main
              className="flex-1 overflow-y-auto p-6 md:p-8 relative h-[calc(100vh-64px)] bg-neutral-light"
              id="content-canvas-root"
            >
              <AppRoutes onLoginSuccess={handleLoginSuccess} />
            </main>
          </div>
        </>
      ) : (
        /* Chưa đăng nhập HOẶC đang ở trang login → chỉ render AppRoutes (LoginScreen) */
        <AppRoutes onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Toast thông báo real-time */}
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
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              </div>
              <div className="text-left text-xs flex-1">
                <span className="font-extrabold block text-[10px] uppercase text-slate-300 tracking-wider">
                  Thông báo Real-time
                </span>
                <p className="font-bold text-white mt-1 leading-normal">{toastMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal phiên đăng nhập hết hạn */}
      <AnimatePresence>
        {showSessionExpired && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden"
            >
              <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-950">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-blue-950 mb-2">Phiên làm việc hết hạn</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">
                Phiên làm việc của bạn đã hết hạn để đảm bảo an toàn bảo mật. Vui lòng đăng nhập lại.
              </p>
              <div className="flex space-x-3.5">
                <button
                  onClick={handleSessionConfirm}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition duration-150 border border-slate-200"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={handleSessionConfirm}
                  className="flex-1 py-2.5 bg-blue-950 hover:bg-blue-900 active:bg-blue-950 text-white font-bold rounded-xl text-xs transition duration-150 shadow-lg shadow-blue-950/20"
                >
                  Đăng nhập lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
