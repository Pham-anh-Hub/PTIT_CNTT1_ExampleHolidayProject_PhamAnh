import { useState, startTransition } from "react";
import { Tenant, User as UserType } from "../types";
import { DEPARTMENTS } from "../data";
import { Building2, Search, Bell, ChevronDown, User, CheckCircle2, AlertTriangle, FileText, Calendar, LogOut } from "lucide-react";

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
  onLogout
}: NavbarProps) {
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between pl-3 pr-6 sticky top-0 z-40 shadow-sm" id="global-navbar">
      {/* Left: OASIS Brand Logo & Tenant Switcher */}
      <div className="flex items-center space-x-3">
        {/* OASIS Logo & System Name */}
        <div className="flex items-center space-x-2 mr-1 shrink-0" id="oasis-logo-brand">
          <div className="w-9 h-9 rounded-xl bg-slate-teal flex items-center justify-center text-white font-display font-black text-base shadow-xs">
            O
          </div>
          <span className="font-display font-black text-base text-slate-800 tracking-tight hidden md:inline-block">OASIS</span>
        </div>

        {/* Separator */}
        <div className="h-6 w-[1px] bg-slate-200 shrink-0"></div>

        {/* Search input - High Efficiency Search Bar */}
        <div className="relative max-w-xs lg:max-w-md hidden md:block" id="global-search-container">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm nhanh nhân sự, đơn hàng, định mức..."
            className="w-64 lg:w-80 bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-600 placeholder-slate-400 focus:outline-none focus:border-slate-teal focus:bg-white transition-all duration-200"
          />
        </div>
      </div>

      {/* Right: Notification Alerts, Status, Profile */}
      <div className="flex items-center space-x-4">
        {/* Quick Help Status Indicator */}
        <span className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-green-light text-emerald-green-dark text-xs font-semibold" id="sys-status-badge">
          <span className="w-2 h-2 rounded-full bg-emerald-green animate-pulse"></span>
          <span>Multi-tenant SaaS</span>
        </span>

        {/* Action Center - Notifications / Approval Queue Alert */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowTenantDropdown(false);
            }}
            className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors relative border border-slate-100"
            id="notifications-alert-btn"
          >
            <Bell className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-terracotta text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-100/80 py-2.5 z-50 animate-in fade-in duration-200" id="notifications-panel">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">Quy trình duyệt cần xử lý ({pendingApprovalsCount})</span>
                <span className="text-[10px] bg-slate-teal-light text-slate-teal px-2 py-0.5 rounded-full font-bold">Inbox BOD</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {pendingApprovalsCount === 0 ? (
                  <div className="py-6 px-4 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-green mx-auto mb-2 opacity-50" />
                    Không có quy trình nào chờ duyệt!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {pendingOrders > 0 && (
                      <button
                        onClick={() => {
                          startTransition(() => {
                            onNavigateToTab("dashboard");
                          });
                          setShowNotifDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-slate-50 flex items-start space-x-3 transition-colors"
                      >
                        <div className="p-1.5 rounded bg-sage-amber-light text-sage-amber">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-slate-800">Có {pendingOrders} Đơn hàng vượt ngưỡng</div>
                          <p className="text-slate-500 mt-0.5">Vượt mức tiền quy định (&gt; 50 triệu) đang chờ Giám đốc duyệt.</p>
                        </div>
                      </button>
                    )}
                    {pendingContracts > 0 && (
                      <button
                        onClick={() => {
                          startTransition(() => {
                            onNavigateToTab("dashboard");
                          });
                          setShowNotifDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-slate-50 flex items-start space-x-3 transition-colors"
                      >
                        <div className="p-1.5 rounded bg-slate-teal-light text-slate-teal">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-slate-800">Có {pendingContracts} Hợp đồng lao động mới</div>
                          <p className="text-slate-500 mt-0.5">Nhân sự vừa gửi dự thảo chờ phê duyệt kỳ thử việc.</p>
                        </div>
                      </button>
                    )}
                    {pendingLeaves > 0 && (
                      <button
                        onClick={() => {
                          startTransition(() => {
                            onNavigateToTab("dashboard");
                          });
                          setShowNotifDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-slate-50 flex items-start space-x-3 transition-colors"
                      >
                        <div className="p-1.5 rounded bg-terracotta-light text-terracotta">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-slate-800">Có {pendingLeaves} Đơn nghỉ phép của công nhân</div>
                          <p className="text-slate-500 mt-0.5">Nhật ký sản xuất ghi nhận đơn xin phép mới.</p>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    startTransition(() => {
                      onNavigateToTab("dashboard");
                    });
                    setShowNotifDropdown(false);
                  }}
                  className="text-[10px] text-slate-teal font-semibold hover:underline"
                >
                  Xem chi tiết tại Hộp thư phê duyệt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile details */}
        <div className="relative" id="user-profile-container">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowTenantDropdown(false);
              setShowNotifDropdown(false);
            }}
            className="flex items-center space-x-3 pl-3 border-l border-slate-100 hover:opacity-90 active:scale-95 transition-all text-left"
            id="user-profile-widget"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-teal to-cyan-500 flex items-center justify-center text-white border-2 border-white shadow-md cursor-pointer">
              <User className="w-4.5 h-4.5" />
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                {currentUser.fullname}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{currentUser.role}</div>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-100/80 py-3 z-50 animate-in fade-in duration-200" id="user-dropdown-panel">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs font-black text-slate-800">{currentUser.fullname}</div>
                <div className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{currentUser.email}</div>
                <div className="mt-1.5 inline-block text-[9px] bg-slate-teal-light text-slate-teal px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {currentUser.role}
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    onLogout();
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 text-xs font-bold text-red-600 transition-colors flex items-center space-x-2.5"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Đăng xuất hệ thống</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
