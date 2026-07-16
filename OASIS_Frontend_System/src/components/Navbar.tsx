import { useState, startTransition } from "react";
import { Tenant, User as UserType } from "../types";
import { Search, Bell, ChevronDown, CheckCircle2, AlertTriangle, FileText, Calendar, LogOut, ShieldAlert } from "lucide-react";

interface NavbarProps {
  currentTenant: Tenant;
  tenants: Tenant[];
  onTenantChange: (tenant: Tenant) => void;
  pendingApprovalsCount: number;
  pendingOrders: number;
  pendingContracts: number;
  pendingLeaves: number;
  onNavigateToTab: (tabId: string) => void;
  currentUser: UserType;
  onLogout: () => void;
  liveNotifications?: any[];
  liveUnreadCount?: number;
  onMarkNotificationRead?: (id: number) => void;
  onMarkAllNotificationsRead?: () => void;
}

export default function Navbar({
  currentTenant,
  tenants,
  onTenantChange,
  pendingApprovalsCount,
  pendingOrders,
  pendingContracts,
  pendingLeaves,
  onNavigateToTab,
  currentUser,
  onLogout,
  liveNotifications = [],
  liveUnreadCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead
}: NavbarProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Phân quyền hiển thị ô tìm kiếm
  const isManager = currentUser && (
    currentUser.role.toUpperCase() === "BOD / OWNER" ||
    currentUser.role.toUpperCase() === "DIRECTOR" ||
    currentUser.role.toUpperCase() === "ADMIN_DN"
  );

  // Phân quyền nội dung thông báo
  const cleanRole = currentUser ? currentUser.role.toUpperCase() : "";
  const isSuperAdmin = cleanRole === "SUPER_ADMIN" || cleanRole.includes("SUPER_ADMIN") || cleanRole.includes("TOÀN BỘ HỆ THỐNG SAAS") || cleanRole.includes("QUẢN TRỊ HỆ THỐNG");
  const isBOD = cleanRole === "BOD / OWNER" || cleanRole === "DIRECTOR" || cleanRole === "ADMIN_DN";

  // Lấy chi tiết icon và giao diện của thông báo real-time
  const getNotifDetails = (type: string, isRead: boolean) => {
    if (isRead) {
      return {
        bg: "bg-slate-50/50 border-slate-100/60 opacity-60",
        text: "text-slate-400",
        icon: FileText
      };
    }
    const t = (type || "").toUpperCase();
    if (t === "ORDER") {
      return {
        bg: "bg-amber-50/85 border-amber-100/70",
        text: "text-amber-700",
        icon: AlertTriangle
      };
    }
    if (t === "CONTRACT") {
      return {
        bg: "bg-sky-50/85 border-sky-100/70",
        text: "text-sky-700",
        icon: FileText
      };
    }
    return {
      bg: "bg-rose-50/85 border-rose-100/70",
      text: "text-rose-700",
      icon: Calendar
    };
  };

  const notificationsCount = isBOD ? liveUnreadCount : (isSuperAdmin ? 2 : 0);

  // Chọn ảnh chân dung thực tế dựa trên vai trò
  const avatarUrl = isSuperAdmin
    ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=facearea&facepad=2&q=80" // Nữ quản trị viên CNTT
    : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=facearea&facepad=2&q=80"; // Nam giám đốc doanh nghiệp

  return (
    <header className="h-16 bg-white border-b border-slate-100 grid grid-cols-3 items-center px-6 sticky top-0 z-40 shadow-sm" id="global-navbar">
      {/* LEFT COL: Logo & Brand */}
      <div className="flex items-center space-x-3 justify-self-start">
        <div className="flex items-center space-x-3 mr-1 shrink-0" id="oasis-logo-brand">
          <img 
            src="/oasis_logo.png" 
            alt="OASIS Logo" 
            className="w-10 h-10 object-contain select-none shadow-xs"
          />
          <div className="flex flex-col text-left">
            <span className="font-sans font-black text-2xl text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "22px" }}>OASIS</span>
            <span className="text-[10px] text-slate-teal font-extrabold uppercase tracking-widest leading-none mt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>ERP SaaS SYSTEM</span>
          </div>
        </div>
      </div>

      {/* MIDDLE COL: Search Bar (Centered, only for Manager/Director) */}
      <div className="flex justify-center items-center w-full">
        {isManager && (
          <div className="relative w-full max-w-sm hidden md:block" id="global-search-container">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm nhanh nhân sự, đơn hàng, định mức..."
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-600 placeholder-slate-400 focus:outline-none focus:border-slate-teal focus:bg-white transition-all duration-200"
            />
          </div>
        )}
      </div>

      {/* RIGHT COL: Action Center */}
      <div className="flex items-center space-x-4 justify-self-end">
        {/* Multi-tenant badge */}
        <span className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-teal-light text-slate-teal text-[10px] font-bold uppercase tracking-wider" id="sys-status-badge">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-green animate-pulse"></span>
          <span>SaaS Portal</span>
        </span>

        {/* Notifications Alert Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowUserDropdown(false);
            }}
            className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-all relative border border-slate-100 bg-slate-50/50 cursor-pointer"
            id="notifications-alert-btn"
          >
            <Bell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-terracotta text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce shadow-sm">
                {notificationsCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-xl border border-slate-100/80 py-3 z-50 animate-in fade-in duration-200" id="notifications-panel">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">
                  {isSuperAdmin ? "Cảnh báo hệ thống" : "Hộp thư thông báo"} ({notificationsCount})
                </span>
                {isBOD && liveUnreadCount > 0 && onMarkAllNotificationsRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAllNotificationsRead();
                    }}
                    className="text-[9px] text-slate-teal font-extrabold hover:underline uppercase tracking-wider cursor-pointer bg-transparent border-0"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>
              
              <div className="max-h-72 overflow-y-auto mt-2">
                {notificationsCount === 0 ? (
                  <div className="py-6 px-4 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-green mx-auto mb-2 opacity-50" />
                    Không có thông báo mới nào!
                  </div>
                ) : (
                  <div className="px-2 space-y-1.5">
                    {/* Render notifications for BOD (Live) */}
                    {isBOD && liveNotifications.map((notif: any) => {
                      const details = getNotifDetails(notif.type, notif.isRead);
                      const IconComp = details.icon;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.isRead && onMarkNotificationRead) {
                              onMarkNotificationRead(notif.id);
                            }
                            startTransition(() => {
                              onNavigateToTab("dashboard");
                            });
                            setShowNotifDropdown(false);
                          }}
                          className={`p-3 rounded-2xl border flex items-start space-x-3 transition-all hover:bg-slate-50 cursor-pointer ${details.bg}`}
                        >
                          <div className={`p-1.5 rounded-xl bg-white shadow-xs shrink-0 ${details.text}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="text-left text-xs min-w-0 flex-1">
                            <div className="font-bold text-slate-800 truncate flex justify-between items-center">
                              <span className="truncate">{notif.title}</span>
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-1"></span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">{notif.message}</p>
                            {notif.createdAt && (
                              <span className="text-[8px] text-slate-400 font-mono mt-1 block">
                                {new Date(notif.createdAt).toLocaleString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit"
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Render notifications for Super Admin (Mock) */}
                    {isSuperAdmin && [
                      {
                        title: "Đăng ký doanh nghiệp thành công",
                        desc: "Đối tác HAIPHONG đã được kích hoạt thành công trên phân vùng SaaS.",
                        bg: "bg-emerald-50 border-emerald-100",
                        text: "text-emerald-700",
                        icon: CheckCircle2
                      },
                      {
                        title: "Tài nguyên máy chủ ổn định",
                        desc: "Uptime SLA đạt 99.99%, lưu lượng API gateway nằm trong ngưỡng an toàn.",
                        bg: "bg-sky-50 border-sky-100",
                        text: "text-sky-700",
                        icon: ShieldAlert
                      }
                    ].map((notif, idx) => {
                      const IconComp = notif.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setShowNotifDropdown(false);
                          }}
                          className={`p-3 rounded-2xl border flex items-start space-x-3 transition-all hover:bg-slate-50 cursor-pointer ${notif.bg}`}
                        >
                          <div className={`p-1.5 rounded-xl bg-white shadow-xs shrink-0 ${notif.text}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="text-left text-xs min-w-0">
                            <div className="font-bold text-slate-800 truncate">{notif.title}</div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal">{notif.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {isBOD && notificationsCount > 0 && (
                <div className="px-4 pt-2 mt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      startTransition(() => {
                        onNavigateToTab("dashboard");
                      });
                      setShowNotifDropdown(false);
                    }}
                    className="text-[10px] text-slate-teal font-bold hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Xem chi tiết tại Hộp thư phê duyệt
                  </button>
                </div>
              )}
            </div>
            </>
          )}
        </div>

        {/* User profile dropdown widget */}
        <div className="relative" id="user-profile-container">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center space-x-3 pl-3 border-l border-slate-100 hover:opacity-90 active:scale-95 transition-all text-left cursor-pointer"
            id="user-profile-widget"
          >
            <img 
              src={avatarUrl} 
              alt={currentUser.fullname} 
              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-md shrink-0"
            />
            <div className="hidden lg:block">
              <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                {currentUser.fullname}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
          </button>

          {showUserDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-xl border border-slate-100/80 py-3 z-50 animate-in fade-in duration-200" id="user-dropdown-panel">
              <div className="px-4 py-2 border-b border-slate-100 text-left">
                <div className="text-xs font-black text-slate-800">{currentUser.fullname}</div>
                <div className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{currentUser.email}</div>
                <div className="mt-2 inline-block text-[8px] bg-slate-teal-light text-slate-teal px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  {currentUser.role}
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowLogoutConfirm(true);
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors flex items-center space-x-2.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Đăng xuất hệ thống</span>
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
      {/* Modern Bubble/Glassmorphism Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/15 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 border border-slate-100 rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-center" id="logout-confirm-modal">
            {/* Background Bubble Highlights */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-slate-teal/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-950/5 rounded-full blur-xl pointer-events-none" />
            
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <LogOut className="w-6 h-6 text-blue-950" />
            </div>

            {/* Content */}
            <h3 className="text-[15px] font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Xác nhận Đăng xuất?
            </h3>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Bạn có chắc chắn muốn rời khỏi tài khoản <strong className="text-slate-600 font-bold">{currentUser.fullname}</strong>? Mọi công việc chưa hoàn tất có thể bị gián đoạn.
            </p>

            {/* Actions */}
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold text-slate-500 transition-all cursor-pointer"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setShowLogoutConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-950/15 hover:shadow-blue-950/25 transition-all cursor-pointer"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
