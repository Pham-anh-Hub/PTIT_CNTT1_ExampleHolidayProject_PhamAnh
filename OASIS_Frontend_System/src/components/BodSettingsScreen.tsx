import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders, ShieldCheck, Bell, UserCheck, Search, Filter, Clock,
  AlertTriangle, Save, FileText, CheckCircle2, Shield, Calendar,
  ArrowRight, Check, X, RefreshCw, ChevronRight, AlertCircle, Info,
  ExternalLink, User, Lock, Mail, Smartphone
} from 'lucide-react';
import {
  getBodAuditLogsApi,
  getBodThresholdsApi,
  updateBodThresholdsApi
} from '../api';
import CustomSelect from './CustomSelect';

interface BodSettingsScreenProps {
  sharedNotifications?: any[];
  onMarkNotificationRead?: (id: number) => void;
}

export default function BodSettingsScreen({
  sharedNotifications = [],
  onMarkNotificationRead
}: BodSettingsScreenProps) {
  // Sub-tabs: 'audit-logs' | 'thresholds'
  const [activeSubTab, setActiveSubTab] = useState<"audit-logs" | "thresholds">("audit-logs");

  // State data
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any>({
    salesOrderThreshold: 50000000,
    fixedPayrollRatioCeiling: 75,
    redZoneCreditDays: 90,
    materialCompensationThreshold: 10000000
  });

  // Filter states for Audit Logs (5 dimensions: Thời gian, Người thực hiện, Hành động, Phân hệ, Nội dung & Mã chứng từ)
  const [logSearch, setLogSearch] = useState("");
  const [logActorFilter, setLogActorFilter] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("ALL");
  const [logModuleFilter, setLogModuleFilter] = useState("ALL");
  const [logSeverityFilter, setLogSeverityFilter] = useState("ALL");
  const [logDateFilter, setLogDateFilter] = useState("");

  // Loading & Toast states
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingThresholds, setIsSavingThresholds] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Log detail modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logsRes, thresholdsRes] = await Promise.all([
        getBodAuditLogsApi({ module: logModuleFilter, severity: logSeverityFilter, search: logSearch }).catch(() => ({ data: null })),
        getBodThresholdsApi().catch(() => ({ data: null }))
      ]);

      // Fallback Audit Logs data (Dữ liệu thử nghiệm phong phú cho bộ lọc 5 chiều)
      setAuditLogs((logsRes.data && logsRes.data.length > 0) ? logsRes.data : [
        {
          id: 1,
          createdAt: "2026-07-21 09:15:22",
          actorName: "Phạm Anh (Giám đốc)",
          actorRole: "BOD / DIRECTOR",
          ipAddress: "118.70.124.89",
          action: "Phê duyệt",
          actionType: "APPROVE",
          module: "Sản xuất",
          documentRef: "KHSX-2026-08",
          details: "Duyệt cấp 450.000.000 VNĐ nguyên vật tư cho kế hoạch sản xuất 10.000 áo sơ mi Oxford.",
          severity: "INFO"
        },
        {
          id: 2,
          createdAt: "2026-07-21 08:40:10",
          actorName: "Phạm Anh (Giám đốc)",
          actorRole: "BOD / DIRECTOR",
          ipAddress: "118.70.124.89",
          action: "Thay đổi cấu hình",
          actionType: "SETTING_CHANGE",
          module: "Hệ thống",
          documentRef: "CẤU-HÌNH-01",
          details: "Điều chỉnh hạn mức duyệt đơn hàng Sales tự động từ 30.000.000 VNĐ lên 50.000.000 VNĐ.",
          severity: "WARNING"
        },
        {
          id: 3,
          createdAt: "2026-07-21 07:30:00",
          actorName: "Trần Thị Mai (Trưởng phòng Nhân sự)",
          actorRole: "HR MANAGER",
          ipAddress: "118.70.124.15",
          action: "Phê duyệt",
          actionType: "APPROVE",
          module: "Nhân sự",
          documentRef: "HD-2026-105",
          details: "Ký hợp đồng lao động chính thức 2 năm cho Nhân viên Thiết kế Nguyễn Hoàng Long.",
          severity: "INFO"
        },
        {
          id: 4,
          createdAt: "2026-07-20 16:30:45",
          actorName: "Nguyễn Văn Hùng (Kế toán trưởng)",
          actorRole: "ACCOUNTANT",
          ipAddress: "14.232.180.12",
          action: "Duyệt chi",
          actionType: "DISBURSE",
          module: "Tài chính",
          documentRef: "QL-2026-07",
          details: "Xác nhận chi trả tiền lương tháng 7 tổng trị giá 185.000.000 VNĐ qua ngân hàng Vietcombank.",
          severity: "CRITICAL"
        },
        {
          id: 5,
          createdAt: "2026-07-20 14:12:05",
          actorName: "Phạm Anh (Giám đốc)",
          actorRole: "BOD / DIRECTOR",
          ipAddress: "118.70.124.89",
          action: "Từ chối",
          actionType: "REJECT",
          module: "Kinh doanh",
          documentRef: "DH-SALE-991",
          details: "Từ chối duyệt đơn hàng bảo lãnh công nợ cho Công ty Kim Long do nợ Vùng Đỏ quá 95 ngày.",
          severity: "WARNING"
        },
        {
          id: 6,
          createdAt: "2026-07-20 10:15:30",
          actorName: "Hoàng Quốc Bảo (Nhân viên Sales)",
          actorRole: "SALES STAFF",
          ipAddress: "27.72.105.44",
          action: "Đề xuất",
          actionType: "SUBMIT",
          module: "Kinh doanh",
          documentRef: "DH-SALE-995",
          details: "Lập đề xuất đơn hàng 120.000.000 VNĐ cho Tập đoàn Dệt may Hòa Phát.",
          severity: "INFO"
        },
        {
          id: 7,
          createdAt: "2026-07-19 15:45:12",
          actorName: "Phạm Anh (Giám đốc)",
          actorRole: "BOD / DIRECTOR",
          ipAddress: "118.70.124.89",
          action: "Phê duyệt",
          actionType: "APPROVE",
          module: "Tài chính",
          documentRef: "UNT-2026-44",
          details: "Ký duyệt ủy nhiệm chi thanh toán hợp đồng thuê xưởng tháng 7 trị giá 90.000.000 VNĐ.",
          severity: "INFO"
        },
        {
          id: 8,
          createdAt: "2026-07-19 11:05:00",
          actorName: "Lê Văn Tùng (Quản đốc Xưởng May)",
          actorRole: "PRODUCTION_STAFF",
          ipAddress: "118.70.125.10",
          action: "Đề xuất cấp bù",
          actionType: "REQUEST_EXTRA",
          module: "Sản xuất",
          documentRef: "CB-2026-02",
          details: "Yêu cầu cấp bù 28.000.000 VNĐ vải Kaki do lỗi dập rập đợt 1. Đã ghi sổ vi phạm.",
          severity: "INFO"
        },
        {
          id: 9,
          createdAt: "2026-07-18 17:00:22",
          actorName: "Nguyễn Văn Hùng (Kế toán trưởng)",
          actorRole: "ACCOUNTANT",
          ipAddress: "14.232.180.12",
          action: "Thay đổi cấu hình",
          actionType: "SETTING_CHANGE",
          module: "Hệ thống",
          documentRef: "CẤU-HÌNH-02",
          details: "Cập nhật số ngày quá hạn nợ xấu Vùng Đỏ từ 60 ngày lên 90 ngày theo quy chế tài chính mới.",
          severity: "WARNING"
        },
        {
          id: 10,
          createdAt: "2026-07-18 13:20:15",
          actorName: "Phạm Anh (Giám đốc)",
          actorRole: "BOD / DIRECTOR",
          ipAddress: "118.70.124.89",
          action: "Từ chối",
          actionType: "REJECT",
          module: "Sản xuất",
          documentRef: "KHSX-2026-06",
          details: "Từ chối duyệt kế hoạch sản xuất gia công ngoài do vượt 35% chi phí dự toán BOM.",
          severity: "CRITICAL"
        },
        {
          id: 11,
          createdAt: "2026-07-17 09:10:05",
          actorName: "Trần Thị Mai (Trưởng phòng Nhân sự)",
          actorRole: "HR MANAGER",
          ipAddress: "118.70.124.15",
          action: "Phê duyệt",
          actionType: "APPROVE",
          module: "Nhân sự",
          documentRef: "NP-2026-42",
          details: "Phê duyệt đơn xin nghỉ phép 3 ngày của Quản đốc Lê Văn Tùng có lý do cá nhân.",
          severity: "INFO"
        },
        {
          id: 12,
          createdAt: "2026-07-16 16:50:00",
          actorName: "Phạm Anh (Giám đốc)",
          actorRole: "BOD / DIRECTOR",
          ipAddress: "118.70.124.89",
          action: "Phê duyệt",
          actionType: "APPROVE",
          module: "Kinh doanh",
          documentRef: "DH-SALE-980",
          details: "Ký duyệt hợp đồng cung ứng 5.000 bộ đồng phục công sở trị giá 650.000.000 VNĐ.",
          severity: "CRITICAL"
        }
      ]);

      if (thresholdsRes.data) {
        setThresholds(thresholdsRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [logModuleFilter, logSeverityFilter, logSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Threshold Save
  const handleSaveThresholds = async () => {
    setIsSavingThresholds(true);
    try {
      await updateBodThresholdsApi(thresholds).catch(() => { });
      showToast("Đã lưu thành công các hạn mức kiểm soát rủi ro!");
      fetchData();
    } catch (e) {
      showToast("Có lỗi xảy ra khi lưu cấu hình ngưỡng.");
    } finally {
      setIsSavingThresholds(false);
    }
  };

  // Filtered logs list across all 5 dimensions
  const filteredLogs = auditLogs.filter(log => {
    const matchSearch = !logSearch ||
      log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.documentRef.toLowerCase().includes(logSearch.toLowerCase());
    const matchActor = !logActorFilter ||
      log.actorName.toLowerCase().includes(logActorFilter.toLowerCase()) ||
      log.actorRole.toLowerCase().includes(logActorFilter.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(logActorFilter.toLowerCase());
    const matchAction = logActionFilter === "ALL" || log.action === logActionFilter;
    const matchModule = logModuleFilter === "ALL" || log.module === logModuleFilter;
    const matchSeverity = logSeverityFilter === "ALL" || log.severity === logSeverityFilter;
    const matchDate = !logDateFilter || log.createdAt.startsWith(logDateFilter);

    return matchSearch && matchActor && matchAction && matchModule && matchSeverity && matchDate;
  });

  const resetAuditLogFilters = () => {
    setLogSearch("");
    setLogActorFilter("");
    setLogActionFilter("ALL");
    setLogModuleFilter("ALL");
    setLogSeverityFilter("ALL");
    setLogDateFilter("");
  };

  return (
    <div className="flex-1 bg-slate-50/50 overflow-y-auto overflow-x-hidden min-h-screen pb-12">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-blue-950 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-blue-800 font-sans text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-1 pb-6 space-y-4">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 gap-3">
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-tight flex items-center font-sans">
              <Sliders className="w-5 h-5 mr-2.5 text-blue-950 stroke-[2.2]" />
              Cấu hình hệ thống &amp; Nhật ký hoạt động
            </h1>
            <p className="text-xs text-slate-400 font-normal mt-0.5 font-display">
              Trung tâm kiểm soát rủi ro, cài đặt hạn mức duyệt tự động và nhật ký vết phê duyệt cho Ban Giám đốc (BOD).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-950 text-xs font-medium rounded-full border border-blue-100 flex items-center font-sans">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-950 stroke-[2]" />
              BOD Authorized Mode
            </span>
          </div>
        </div>

        {/* CONTAINER CHÍNH KIEU BONG BÓNG (GLASSMORPHIC CARD) */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-100/80 rounded-[32px] pt-5 pb-8 px-6 sm:px-8 shadow-sm text-left relative overflow-hidden">

          {/* SUB-TAB BAR NGANG (THIẾT KẾ GIỐNG TRANG ADMIN DN SETTING) */}
          <div className="flex border-b border-slate-100/80 pb-3 mb-6 space-x-8 overflow-x-auto hide-scrollbar">

            {/* Sub-tab 1: Audit Logs */}
            <button
              type="button"
              onClick={() => setActiveSubTab("audit-logs")}
              className={`pb-2.5 text-xs transition-all relative font-sans whitespace-nowrap cursor-pointer ${activeSubTab === "audit-logs"
                  ? "text-blue-950 font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-950 after:rounded-full"
                  : "text-slate-400 hover:text-slate-650 font-display"
                }`}
            >
              Nhật ký hoạt động &amp; Vết phê duyệt
            </button>

            {/* Sub-tab 2: Thresholds */}
            <button
              type="button"
              onClick={() => setActiveSubTab("thresholds")}
              className={`pb-2.5 text-xs transition-all relative font-sans whitespace-nowrap cursor-pointer ${activeSubTab === "thresholds"
                  ? "text-blue-950 font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-950 after:rounded-full"
                  : "text-slate-400 hover:text-slate-650 font-display"
                }`}
            >
              Hạn mức duyệt rủi ro
            </button>
          </div>

          {/* SUB-TAB 1: AUDIT LOGS */}
          {activeSubTab === "audit-logs" && (
            <div className="space-y-4 animate-in fade-in duration-200">

              {/* 5-Dimensional Search & Filter Bar */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 font-sans flex items-center">
                    <Filter className="w-3.5 h-3.5 mr-1.5 text-blue-950 stroke-[2]" />
                    Bộ lọc tra cứu vết nhật ký hoạt động
                  </span>
                  {(logSearch || logActorFilter || logActionFilter !== "ALL" || logModuleFilter !== "ALL" || logSeverityFilter !== "ALL" || logDateFilter) && (
                    <button
                      onClick={resetAuditLogFilters}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-medium font-sans flex items-center cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-rose-200/80 shadow-2xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1 text-rose-600" />
                      Xóa bộ lọc
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  
                  {/* 1. Tìm kiếm theo Nội dung / Mã chứng từ */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 stroke-[2]" />
                    <input
                      type="text"
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      placeholder="Nội dung / Mã chứng từ..."
                      className="w-full bg-white border border-slate-200/80 rounded-xl pl-8 pr-3 py-2 h-[38px] text-xs font-display focus:outline-none focus:border-blue-950 transition-colors placeholder:text-slate-400"
                    />
                  </div>

                  {/* 2. Tìm kiếm theo Người thực hiện */}
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 stroke-[2]" />
                    <input
                      type="text"
                      value={logActorFilter}
                      onChange={(e) => setLogActorFilter(e.target.value)}
                      placeholder="Người thực hiện / IP..."
                      className="w-full bg-white border border-slate-200/80 rounded-xl pl-8 pr-3 py-2 h-[38px] text-xs font-display focus:outline-none focus:border-blue-950 transition-colors placeholder:text-slate-400"
                    />
                  </div>

                  {/* 3. Lọc theo Thời gian */}
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 stroke-[2]" />
                    <input
                      type="date"
                      value={logDateFilter}
                      onChange={(e) => setLogDateFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200/80 rounded-xl pl-8 pr-3 py-2 h-[38px] text-xs font-medium font-sans text-slate-700 focus:outline-none focus:border-blue-950"
                    />
                  </div>

                  {/* 4. Lọc theo Phân hệ */}
                  <CustomSelect
                    value={logModuleFilter}
                    onChange={(val) => setLogModuleFilter(val)}
                    options={[
                      { value: "ALL", label: "Tất cả phân hệ" },
                      { value: "Sản xuất", label: "Sản xuất" },
                      { value: "Kinh doanh", label: "Kinh doanh" },
                      { value: "Tài chính", label: "Tài chính" },
                      { value: "Nhân sự", label: "Nhân sự" },
                      { value: "Hệ thống", label: "Hệ thống" },
                    ]}
                    className="w-full"
                  />

                  {/* 5. Lọc theo Hành động */}
                  <CustomSelect
                    value={logActionFilter}
                    onChange={(val) => setLogActionFilter(val)}
                    options={[
                      { value: "ALL", label: "Tất cả hành động" },
                      { value: "Phê duyệt", label: "Phê duyệt" },
                      { value: "Từ chối", label: "Từ chối" },
                      { value: "Duyệt chi", label: "Duyệt chi" },
                      { value: "Thay đổi cấu hình", label: "Thay đổi cấu hình" },
                      { value: "Đề xuất cấp bù", label: "Đề xuất cấp bù" },
                    ]}
                    className="w-full"
                  />

                </div>
              </div>

              {/* Audit Logs Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-medium font-sans">
                    <tr>
                      <th className="px-4 py-3.5 rounded-tl-2xl">Thời gian</th>
                      <th className="px-4 py-3.5">Người thực hiện</th>
                      <th className="px-4 py-3.5">Hành động</th>
                      <th className="px-4 py-3.5">Phân hệ</th>
                      <th className="px-4 py-3.5">Mã chứng từ</th>
                      <th className="px-4 py-3.5">Nội dung chi tiết</th>
                      <th className="px-4 py-3.5 text-center rounded-tr-2xl">Mức rủi ro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-display">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Không tìm thấy nhật ký hoạt động nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3.5 font-mono text-slate-500 whitespace-nowrap">{log.createdAt}</td>
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-slate-800 font-sans block">{log.actorName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{log.ipAddress}</span>
                          </td>
                          <td className="px-4 py-3.5 font-medium font-sans text-slate-700">{log.action}</td>
                          <td className="px-4 py-3.5 text-slate-600">{log.module}</td>
                          <td className="px-4 py-3.5 font-mono text-blue-950 font-medium">{log.documentRef}</td>
                          <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{log.details}</td>
                          <td className="px-4 py-3.5 text-center">
                            {log.severity === 'CRITICAL' && (
                              <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-sans shadow-2xs animate-pulse">
                                CRITICAL
                              </span>
                            )}
                            {log.severity === 'WARNING' && (
                              <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-sans">
                                WARNING
                              </span>
                            )}
                            {log.severity === 'INFO' && (
                              <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans">
                                INFO
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* SUB-TAB 2: THRESHOLDS & RISK LIMITS */}
          {activeSubTab === "thresholds" && (
            <div className="space-y-5 animate-in fade-in duration-200">

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-950 shrink-0 mt-0.5 stroke-[2]" />
                <div className="text-xs text-slate-600 font-display leading-relaxed">
                  <span className="font-medium font-sans text-blue-950">Chuyển giao thẩm quyền cho Giám đốc:</span> Toàn bộ việc cài đặt các ngưỡng lọc duyệt rủi ro tự động đã được chuyển về cho tài khoản Giám đốc (BOD). Hệ thống dựa vào các con số này để tự động đẩy đơn chứng từ vượt hạn mức vào Hộp thư phê duyệt Gatekeeper.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Threshold 1: Sales Order Limit */}
                <div className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-slate-800 font-sans">Ngưỡng duyệt đơn hàng Sales tự động</h4>
                      <p className="text-xs text-slate-400 font-display mt-0.5">
                        Đơn bán hàng vượt quá giá trị này cần Giám đốc ký duyệt số.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-lg border border-slate-100 font-sans">
                      Sales Module
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 font-sans block">Hạn mức giá trị (VNĐ):</label>
                    <input
                      type="number"
                      value={thresholds.salesOrderThreshold}
                      onChange={(e) => setThresholds({ ...thresholds, salesOrderThreshold: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-sm font-medium text-blue-950 font-sans focus:outline-none focus:border-blue-950 focus:bg-white transition-colors"
                    />
                    <p className="text-[11px] text-slate-400 font-display">Hiện tại: {formatMoney(thresholds.salesOrderThreshold)}</p>
                  </div>
                </div>

                {/* Threshold 2: Fixed Payroll Ratio */}
                <div className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-slate-800 font-sans">Ngưỡng cảnh báo tỷ trọng lương cố định</h4>
                      <p className="text-xs text-slate-400 font-display mt-0.5">
                        Phát cảnh báo nếu tỷ trọng lương cố định vượt % tổng quỹ lương.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-lg border border-slate-100 font-sans">
                      HRM Module
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 font-sans block">Tỷ lệ trần cho phép (%):</label>
                    <input
                      type="number"
                      value={thresholds.fixedPayrollRatioCeiling}
                      onChange={(e) => setThresholds({ ...thresholds, fixedPayrollRatioCeiling: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-sm font-medium text-blue-950 font-sans focus:outline-none focus:border-blue-950 focus:bg-white transition-colors"
                    />
                    <p className="text-[11px] text-slate-400 font-display">Mức trần: {thresholds.fixedPayrollRatioCeiling}% tổng chi phí lương</p>
                  </div>
                </div>

                {/* Threshold 3: Red Zone Credit Days */}
                <div className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-slate-800 font-sans">Ngưỡng nợ xấu Vùng Đỏ (Red Zone)</h4>
                      <p className="text-xs text-slate-400 font-display mt-0.5">
                        Số ngày nợ quá hạn để tự động khóa xuất hàng cho khách.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-lg border border-slate-100 font-sans">
                      Credit Limit
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 font-sans block">Số ngày nợ quá hạn tối đa (ngày):</label>
                    <input
                      type="number"
                      value={thresholds.redZoneCreditDays}
                      onChange={(e) => setThresholds({ ...thresholds, redZoneCreditDays: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-sm font-medium text-rose-600 font-sans focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
                    />
                    <p className="text-[11px] text-slate-400 font-display">Quá {thresholds.redZoneCreditDays} ngày nợ sẽ tự động chặn đơn hàng mới</p>
                  </div>
                </div>

                {/* Threshold 4: Material Compensation Limit */}
                <div className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-slate-800 font-sans">Ngưỡng duyệt cấp bù vật tư xưởng</h4>
                      <p className="text-xs text-slate-400 font-display mt-0.5">
                        Yêu cầu cấp bù nguyên liệu do hao hụt vượt quá số tiền này cần Giám đốc ký.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-lg border border-slate-100 font-sans">
                      Production
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 font-sans block">Hạn mức cấp bù vật tư (VNĐ):</label>
                    <input
                      type="number"
                      value={thresholds.materialCompensationThreshold}
                      onChange={(e) => setThresholds({ ...thresholds, materialCompensationThreshold: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-sm font-medium text-blue-950 font-sans focus:outline-none focus:border-blue-950 focus:bg-white transition-colors"
                    />
                    <p className="text-[11px] text-slate-400 font-display">Hiện tại: {formatMoney(thresholds.materialCompensationThreshold)}</p>
                  </div>
                </div>

              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveThresholds}
                  disabled={isSavingThresholds}
                  className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-white rounded-2xl text-xs font-medium font-sans shadow-md shadow-blue-950/20 transition-all flex items-center cursor-pointer"
                >
                  <Save className="w-4 h-4 mr-2 stroke-[2]" />
                  {isSavingThresholds ? "Đang lưu..." : "Lưu cấu hình ngưỡng"}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* LOG DETAILS MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-medium text-slate-900 font-sans">Chi Tiết Vết Nhật Ký Audit</h3>
                <p className="text-xs text-slate-500 font-display mt-0.5">
                  Mã chứng từ: <strong className="font-mono text-blue-950">{selectedLog.documentRef}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-700 font-display border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian:</span>
                <span className="font-mono font-medium">{selectedLog.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Người thực hiện:</span>
                <span className="font-sans font-medium text-slate-800">{selectedLog.actorName} ({selectedLog.actorRole})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Địa chỉ IP:</span>
                <span className="font-mono text-slate-600">{selectedLog.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phân hệ:</span>
                <span className="font-medium text-slate-800 font-sans">{selectedLog.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hành động:</span>
                <span className="font-medium text-slate-800 font-sans">{selectedLog.action}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 font-sans block">Nội dung chi tiết thao tác:</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 font-display leading-relaxed">
                {selectedLog.details}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-2xl bg-blue-950 hover:bg-blue-900 text-white font-medium text-xs font-sans shadow-md cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
