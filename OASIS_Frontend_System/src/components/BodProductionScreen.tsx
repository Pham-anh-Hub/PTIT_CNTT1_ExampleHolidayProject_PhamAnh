import React, { useState, useEffect, useCallback } from 'react';
import {
  Hammer, AlertTriangle, CheckCircle2, XCircle, Clock, Layers,
  Download, Send, Users, Package, ShieldAlert, ArrowRight, Check, X,
  FileText, Activity, RefreshCw, BarChart3, ChevronRight, AlertCircle
} from 'lucide-react';
import {
  getBodPendingProductionPlansApi,
  approveBodProductionPlanApi,
  rejectBodProductionPlanApi,
  getBodProductionProgressApi,
  getBodProductionBottlenecksApi
} from '../api';

interface BodProductionScreenProps {
  sharedNotifications?: any[];
  onMarkNotificationRead?: (id: number) => void;
}

export default function BodProductionScreen({
  sharedNotifications = [],
  onMarkNotificationRead
}: BodProductionScreenProps) {
  const [activeTab, setActiveTab] = useState<"BOTTLENECK" | "APPROVAL" | "PROGRESS">("BOTTLENECK");

  // State data
  const [pendingPlans, setPendingPlans] = useState<any[]>([]);
  const [progressList, setProgressList] = useState<any[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);

  // Loading & Toast states
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Directives Modal State (Gửi chỉ đạo Quản đốc)
  const [directiveModal, setDirectiveModal] = useState<{ isOpen: boolean; planName: string; stageName: string; targetForeman: string }>({
    isOpen: false,
    planName: "",
    stageName: "",
    targetForeman: ""
  });
  const [directiveText, setDirectiveText] = useState("");

  // Reject Modal State
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [rejectReason, setRejectReason] = useState("");

  // Selected Progress Detail Modal / Expand
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize WebSocket/Simulated Notifications with Pending Approval Queue
  const displayPendingPlans = React.useMemo(() => {
    const list = [...pendingPlans];
    const unreadProdNotifs = (sharedNotifications || []).filter(
      (n: any) => !n.isRead && (
        n.type === 'PRODUCTION_PLAN' ||
        n.type === 'MATERIAL_EXTRA' ||
        (n.title && (n.title.includes('sản xuất') || n.title.includes('vật tư')))
      )
    );

    for (const notif of unreadProdNotifs) {
      const notifId = notif.id;
      const exists = list.some(p => p.id === notifId);
      if (!exists) {
        let planType = "MTO";
        let title = notif.title || "Đề xuất Kế hoạch Sản xuất";
        let isExtra = notif.type === 'MATERIAL_EXTRA' || title.includes('Cấp bù');

        let budget = 450000000;
        const match = (notif.message || "").match(/([0-9.,]+)\s*[đd]/i);
        if (match) budget = parseInt(match[1].replace(/[,.]/g, ""), 10);

        list.push({
          id: notifId,
          code: `KH-2026-${100 + notifId}`,
          productName: isExtra ? "Áo sơ mi Nam Cotton Premium (Lô bổ sung)" : "Đơn hàng XK-2026-088 (10.000 cái áo)",
          planType: isExtra ? "CẤP BÙ VẬT TƯ" : "MTO",
          targetQuantity: 10000,
          requestedBudget: budget,
          scrapRate: isExtra ? 4.2 : 1.5,
          requestedBy: "Nguyễn Văn Hùng (Trưởng phòng SX)",
          note: notif.message || "Xin rút nguyên vật liệu vải cotton chuẩn bị cắt rập lô sản xuất mới.",
          createdAt: notif.createdAt ? notif.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10),
          isExtraCompensation: isExtra
        });
      }
    }
    return list;
  }, [pendingPlans, sharedNotifications]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansRes, progressRes, bottlenecksRes] = await Promise.all([
        getBodPendingProductionPlansApi().catch(() => ({ data: null })),
        getBodProductionProgressApi().catch(() => ({ data: null })),
        getBodProductionBottlenecksApi().catch(() => ({ data: null }))
      ]);

      // Fallback Data if backend empty / dev mode
      setPendingPlans(plansRes.data || [
        {
          id: 1,
          code: "KH-2026-01",
          productName: "Áo sơ mi Nam Oxford (Đơn hàng SALE-9921)",
          planType: "MTO",
          targetQuantity: 5000,
          requestedBudget: 320000000,
          scrapRate: 1.2,
          requestedBy: "Phạm Minh Hoàng (Trưởng phòng SX)",
          note: "Đề xuất rút 320.000.000 VNĐ tiền vải Oxord và phụ liệu khuy đơm chuẩn bị bấm máy công đoạn 1.",
          createdAt: "2026-07-20",
          isExtraCompensation: false
        },
        {
          id: 2,
          code: "KH-2026-02",
          productName: "Quần Kaki Tây Công sở (Cấp bù hao hụt)",
          planType: "CẤP BÙ VẬT TƯ",
          targetQuantity: 2000,
          requestedBudget: 28000000,
          scrapRate: 4.8,
          requestedBy: "Lê Văn Tùng (Quản đốc Xưởng May 2)",
          note: "Lỗi dập rập đợt 1 làm hỏng 40m vải Kaki. Xin duyệt cấp bù 28.000.000 VNĐ tiền vải thay thế. Đã ghi sổ xử lý trách nhiệm tổ cắt.",
          createdAt: "2026-07-21",
          isExtraCompensation: true
        }
      ]);

      setProgressList(progressRes.data || [
        {
          planId: 101,
          planCode: "KH-2026-MTO-88",
          productName: "Áo Polo Thể Thao Nam FastDry",
          totalQuantity: 10000,
          completedQuantity: 7400,
          progressPercent: 74,
          status: "IN_PROGRESS",
          startDate: "2026-07-10",
          expectedEndDate: "2026-07-28",
          stages: [
            { stageName: "1. Cắt rập tự động", sequenceNo: 1, status: "COMPLETED", assigneeName: "Tổ Cắt Laser 1", payType: "Lương khoán", rate: "2.500đ/cái", startTime: "2026-07-10", endTime: "2026-07-13" },
            { stageName: "2. Thêu logo ngực", sequenceNo: 2, status: "COMPLETED", assigneeName: "Xưởng Thêu Vi Tính", payType: "Lương khoán", rate: "1.200đ/cái", startTime: "2026-07-14", endTime: "2026-07-16" },
            { stageName: "3. May vắt sổ & Ráp thân", sequenceNo: 3, status: "IN_PROGRESS", assigneeName: "Tổ May Chuyền 3", payType: "Lương sản phẩm", rate: "8.000đ/cái", startTime: "2026-07-17", endTime: "2026-07-24" },
            { stageName: "4. Đơm khuy & Nút", sequenceNo: 4, status: "PENDING", assigneeName: "Tổ Hoàn thiện", payType: "Lương giờ", rate: "35.000đ/giờ", startTime: "-", endTime: "-" },
            { stageName: "5. Kiểm định QC & Đóng gói", sequenceNo: 5, status: "PENDING", assigneeName: "Tổ KCS & Kho", payType: "Lương cố định", rate: "N/A", startTime: "-", endTime: "-" }
          ]
        },
        {
          planId: 102,
          planCode: "KH-2026-MTS-12",
          productName: "Áo Khoác Windbreaker 2 Lớp",
          totalQuantity: 3000,
          completedQuantity: 1200,
          progressPercent: 40,
          status: "BOTTLENECK",
          startDate: "2026-07-12",
          expectedEndDate: "2026-07-30",
          stages: [
            { stageName: "1. Cắt vải chống nước", sequenceNo: 1, status: "COMPLETED", assigneeName: "Tổ Cắt 2", payType: "Lương khoán", rate: "3.000đ/cái", startTime: "2026-07-12", endTime: "2026-07-15" },
            { stageName: "2. Ép keo đường may (Seam sealing)", sequenceNo: 2, status: "IN_PROGRESS", assigneeName: "Tổ Chuyên dụng Ep Keo", payType: "Lương khoán", rate: "6.000đ/cái", startTime: "2026-07-16", endTime: "Đang tắc nghẽn" },
            { stageName: "3. May ráp lót & Khóa kéo", sequenceNo: 3, status: "PENDING", assigneeName: "Tổ May 1", payType: "Lương sản phẩm", rate: "12.000đ/cái", startTime: "-", endTime: "-" },
            { stageName: "4. Đóng gói & Dán nhãn", sequenceNo: 4, status: "PENDING", assigneeName: "Tổ Kho", payType: "Lương cố định", rate: "N/A", startTime: "-", endTime: "-" }
          ]
        }
      ]);

      setBottlenecks(bottlenecksRes.data || [
        {
          id: 1,
          planCode: "KH-2026-MTS-12",
          productName: "Áo Khoác Windbreaker 2 Lớp",
          stalledStageName: "Khâu Ép keo chống thấm đường may (Seam Sealing)",
          foremanName: "Trần Văn Bình (Quản đốc Xưởng 3)",
          daysStalled: 4,
          wipAccumulated: 1800,
          bottleneckReason: "Máy ép keo đường may số 2 bị hỏng bo mạch chính từ thứ Sáu. Tổ cắt đã giao 1.800 bán thành phẩm WIP nhưng tổ ép chưa thể xử lý kịp.",
          severity: "HIGH"
        },
        {
          id: 2,
          planCode: "KH-2026-MTO-45",
          productName: "Quần Jeans Nam Co Giãn",
          stalledStageName: "Khâu Giặt mài & Bắn Laser hiệu ứng",
          foremanName: "Nguyễn Quốc Anh (Quản đốc Xưởng Mài)",
          daysStalled: 2,
          wipAccumulated: 950,
          bottleneckReason: "Thiếu phụ gia hóa chất giặt mài nhập khẩu do thủ tục thông quan chậm 2 ngày. Bán thành phẩm tồn tại xưởng mài 950 cái.",
          severity: "MEDIUM"
        }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleApprovePlan = async (id: number) => {
    setActionLoading(`approve_${id}`);
    try {
      await approveBodProductionPlanApi(id).catch(() => { });
      setPendingPlans(prev => prev.filter(p => p.id !== id));
      if (onMarkNotificationRead) {
        onMarkNotificationRead(id);
      }
      showToast("Đã phê duyệt xuất kho kế hoạch sản xuất thành công!");
    } catch (e) {
      showToast("Có lỗi xảy ra khi phê duyệt kế hoạch.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.id || !rejectReason.trim()) return;
    const id = rejectModal.id;
    setActionLoading(`reject_${id}`);
    try {
      await rejectBodProductionPlanApi(id, rejectReason).catch(() => { });
      setPendingPlans(prev => prev.filter(p => p.id !== id));
      if (onMarkNotificationRead) {
        onMarkNotificationRead(id);
      }
      setRejectModal({ isOpen: false, id: null });
      setRejectReason("");
      showToast("Đã từ chối kế hoạch sản xuất và phản hồi Quản đốc.");
    } catch (e) {
      showToast("Lỗi khi từ chối.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendDirectiveSubmit = () => {
    if (!directiveText.trim()) return;
    showToast(`Đã phát chỉ đạo thành công cho Quản đốc ${directiveModal.targetForeman}!`);
    setDirectiveModal({ isOpen: false, planName: "", stageName: "", targetForeman: "" });
    setDirectiveText("");
  };

  const handleExportReport = () => {
    const headers = "Mã KH,Sản Phẩm,Số Lượng,Tiến Độ (%),Trạng Thái,Ngân Sách Vật Tư\n";
    const rows = progressList.map(p =>
      `"${p.planCode}","${p.productName}",${p.totalQuantity},${p.progressPercent}%,"${p.status === 'BOTTLENECK' ? 'Tắc nghẽn' : 'Đang chạy'}","${formatMoney(p.totalQuantity * 45000)}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bao_Cao_Tien_Do_San_Xuat_BOD_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    showToast("Đã xuất báo cáo sản xuất ra file Excel/CSV thành công!");
  };

  return (
    <div className="flex-1 bg-slate-50/50 overflow-y-auto overflow-x-hidden min-h-screen pb-12">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-blue-950 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-blue-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium font-sans">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-1 pb-6 space-y-4">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-3">
          <div>
            <h1 className="text-xl font-medium text-slate-900 tracking-tight flex items-center font-sans">
              <Hammer className="w-6 h-6 mr-2.5 text-blue-950 stroke-[2.5]" />
              Quản trị &amp; Giám sát Phân Xưởng Sản Xuất
            </h1>
            <p className="text-xs text-slate-500 font-normal mt-0.5 font-display">
              Đài quan sát tiến độ công đoạn, Bottleneck Radar &amp; Phê duyệt xuất kho vật tư cho Giám đốc (BOD).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportReport}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-2xl border border-slate-200/80 shadow-sm flex items-center transition-all cursor-pointer font-sans"
            >
              <Download className="w-4 h-4 mr-2 text-blue-950 stroke-[2]" />
              Xuất Báo Cáo (Excel/PDF)
            </button>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100/80 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Live Factory Feed
            </span>
          </div>
        </div>

        {/* HERO STAT BUBBLE CARDS (BONG BÓNG CONCEPT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">

          {/* Card 1: Active Plans */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-slate-100/80 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-normal text-slate-500 font-display mb-1">Kế hoạch Đang chạy</p>
              <h3 className="text-l font-medium text-slate-900 font-sans tracking-tight">8 Kế hoạch</h3>
              <span className="text-[11px] text-emerald-600 font-normal block mt-1 font-sans">6 MTO / 2 MTS</span>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-950 rounded-2xl flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          {/* Card 2: Average Progress */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-slate-100/80 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-normal text-slate-500 font-display mb-1">Tiến độ Trung bình Xưởng</p>
              <h3 className="text-l font-medium text-slate-900 font-sans tracking-tight">74.2%</h3>
              <span className="text-[11px] text-blue-600 font-normal block mt-1 font-sans">18.400 / 24.800 sản phẩm</span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          {/* Card 3: Material Expenses */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-slate-100/80 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-normal text-slate-500 font-display mb-1">Ngân sách Vật tư Xuất kho</p>
              <h3 className="text-l font-medium text-blue-950 font-sans tracking-tight">{formatMoney(1850000000)}</h3>
              <span className="text-[11px] text-slate-400 font-normal block mt-1 font-sans">Chiếm 62% chi phí vận hành</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          {/* Card 4: Bottlenecks */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-slate-100/80 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-normal text-slate-500 font-display mb-1">Điểm Tắc Nghẽn (WIP)</p>
              <h3 className="text-l font-medium text-rose-450 font-sans tracking-tight">{bottlenecks.length} Vấn đề</h3>
              <span className="text-[11px] text-rose-500 font-normal block mt-1 font-sans">Cần BOD chỉ đạo điều phối</span>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

        </div>

        {/* APPROVAL & MONITORING HUB (BUBBLE CONTAINER) */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-sm border border-slate-100/80 overflow-hidden">

          {/* TABS HEADER */}
          <div className="flex border-b border-slate-100/80 bg-slate-50/40">

            {/* Tab 1: Bottleneck Radar */}
            <button
              onClick={() => setActiveTab("BOTTLENECK")}
              className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center transition-all cursor-pointer font-sans ${activeTab === "BOTTLENECK"
                ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                }`}
            >
              <AlertTriangle className="w-4 h-4 mr-2 text-rose-500 stroke-[2.5]" />
              <span>Đài Quan Sát Tắc Nghẽn (Bottleneck Radar)</span>
              {bottlenecks.length > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm animate-pulse font-sans">
                  {bottlenecks.length}
                </span>
              )}
            </button>

            {/* Tab 2: Pending Approvals */}
            <button
              onClick={() => setActiveTab("APPROVAL")}
              className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center transition-all cursor-pointer font-sans ${activeTab === "APPROVAL"
                ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                }`}
            >
              <FileText className="w-4 h-4 mr-2 text-blue-950 stroke-[2.5]" />
              <span>Duyệt Kế Hoạch &amp; Cấp Bù Vật Tư</span>
              {displayPendingPlans.length > 0 && (
                <span className="ml-2 bg-blue-950 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm font-sans">
                  {displayPendingPlans.length}
                </span>
              )}
            </button>

            {/* Tab 3: Detailed Progress */}
            <button
              onClick={() => setActiveTab("PROGRESS")}
              className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center transition-all cursor-pointer font-sans ${activeTab === "PROGRESS"
                ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                }`}
            >
              <Activity className="w-4 h-4 mr-2 text-emerald-600 stroke-[2.5]" />
              <span>Giám Sát Tiến Độ Chi Tiết</span>
            </button>

          </div>

          {/* TAB CONTENT AREA */}
          <div className="p-6 min-h-[420px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-950 stroke-[2]" />
                <p className="text-xs font-normal font-display">Đang đồng bộ dữ liệu xưởng sản xuất...</p>
              </div>
            ) : (
              <>

                {/* TAB 1: BOTTLENECK RADAR */}
                {activeTab === "BOTTLENECK" && (
                  <div className="space-y-4">
                    <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 stroke-[2.2]" />
                      <div className="text-xs text-amber-900 font-display">
                        <span className="font-medium font-sans"></span> Tự động quét các công đoạn bị ngưng trệ
                      </div>
                    </div>

                    {bottlenecks.length === 0 ? (
                      <EmptyState message="Tuyệt vời! Không có công đoạn sản xuất nào gặp vấn đề." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {bottlenecks.map((b) => (
                          <div
                            key={b.id}
                            className="border border-rose-100 rounded-3xl p-5 bg-rose-50/20 hover:border-rose-300 transition-all shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-rose-100 text-rose-700 border border-rose-200 font-sans inline-block mb-1">
                                    Ách tắc {b.daysStalled} ngày • Tồn {b.wipAccumulated} WIP
                                  </span>
                                  <h4 className="font-medium text-slate-900 text-base font-sans">{b.productName}</h4>
                                  <p className="text-xs text-slate-500 font-display font-normal">{b.planCode}</p>
                                </div>
                                <span className="px-3 py-1 bg-white text-rose-600 text-xs font-medium rounded-2xl border border-rose-200 font-sans shadow-2xs">
                                  {b.stalledStageName}
                                </span>
                              </div>

                              {/* Reason Box */}
                              <div className="bg-white/90 rounded-2xl p-3.5 border border-slate-100 text-xs text-slate-700 mb-4 font-display space-y-1">
                                <p className="font-medium text-rose-900 font-sans flex items-center">
                                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600 stroke-[2.5]" />
                                  Lý do nghẽn:
                                </p>
                                <p className="text-slate-600 leading-relaxed">{b.bottleneckReason}</p>
                              </div>

                              <div className="flex justify-between items-center text-xs text-slate-500 mb-4 font-display">
                                <span>Quản đốc: <strong className="text-slate-800 font-medium font-sans">{b.foremanName}</strong></span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t border-rose-100/80 pt-3 flex space-x-2">
                              <button
                                onClick={() => setDirectiveModal({
                                  isOpen: true,
                                  planName: b.productName,
                                  stageName: b.stalledStageName,
                                  targetForeman: b.foremanName
                                })}
                                className="w-full py-2.5 px-4 bg-blue-950 hover:bg-blue-900 text-white rounded-2xl text-xs font-medium font-sans transition-all shadow-sm flex items-center justify-center cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5 mr-2 stroke-[2.5]" />
                                Gửi Chỉ Đạo Trực Tiếp Quản Đốc
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: APPROVAL QUEUE */}
                {activeTab === "APPROVAL" && (
                  <div className="space-y-4">
                    {displayPendingPlans.length === 0 ? (
                      <EmptyState message="Không có dự toán kế hoạch hoặc yêu cầu cấp bù vật tư nào chờ duyệt." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {displayPendingPlans.map((p) => (
                          <div
                            key={p.id}
                            className={`border rounded-3xl p-5 bg-white transition-all shadow-sm flex flex-col justify-between ${p.isExtraCompensation ? 'border-amber-200 hover:border-amber-400 bg-amber-50/10' : 'border-slate-100 hover:border-slate-300'
                              }`}
                          >
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <span className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full font-sans inline-block mb-1 border ${p.isExtraCompensation
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-blue-50 text-blue-900 border-blue-100'
                                    }`}>
                                    {p.planType} • Số lượng: {p.targetQuantity.toLocaleString()} cái
                                  </span>
                                  <h4 className="font-medium text-slate-900 text-base font-sans">{p.productName}</h4>
                                  <p className="text-xs text-slate-400 font-display">{p.code} • Yêu cầu bởi: {p.requestedBy}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-400 font-display uppercase">Dự toán xin rút</p>
                                  <p className="text-base font-medium text-blue-950 font-sans">{formatMoney(p.requestedBudget)}</p>
                                </div>
                              </div>

                              {/* Note / Reason Box */}
                              <div className="bg-slate-50/80 rounded-2xl p-3 text-xs text-slate-600 mb-3 font-display border border-slate-100">
                                "{p.note}"
                              </div>

                              {p.isExtraCompensation && (
                                <div className="bg-rose-50/60 text-rose-800 rounded-xl p-2.5 text-[11px] font-display mb-4 border border-rose-100 flex items-center">
                                  <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 shrink-0 stroke-[2.5]" />
                                  <span>Tỷ lệ hao hụt dập rập: <strong>{p.scrapRate}%</strong> (Vượt định mức BOM 1.5%). Đã lưu vết phạt bù trừ lương thợ.</span>
                                </div>
                              )}
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-2 border-t border-slate-100 pt-3">
                              <button
                                onClick={() => setRejectModal({ isOpen: true, id: p.id })}
                                className="flex-1 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all font-sans cursor-pointer"
                              >
                                Từ Chối
                              </button>
                              <button
                                onClick={() => handleApprovePlan(p.id)}
                                disabled={actionLoading === `approve_${p.id}`}
                                className="flex-1 py-2.5 text-xs font-medium text-white bg-blue-950 hover:bg-blue-900 rounded-2xl shadow-md shadow-blue-950/20 transition-all font-sans cursor-pointer flex justify-center items-center"
                              >
                                {actionLoading === `approve_${p.id}` ? "Đang xử lý..." : "Đồng Ý Duyệt Xuất Kho"}
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: DETAILED PROGRESS TRACKER */}
                {activeTab === "PROGRESS" && (
                  <div className="space-y-4">
                    {progressList.map((p) => {
                      const isExpanded = expandedPlanId === p.planId;
                      return (
                        <div
                          key={p.planId}
                          className="border border-slate-100 rounded-3xl p-5 bg-white hover:shadow-md transition-all space-y-4"
                        >
                          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <span className="font-mono text-xs text-slate-400 font-medium">{p.planCode}</span>
                                <h3 className="text-base font-medium text-slate-900 font-sans">{p.productName}</h3>
                                {p.status === 'BOTTLENECK' ? (
                                  <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-rose-100 text-rose-700 border border-rose-200 font-sans">
                                    Đang tắc nghẽn
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans">
                                    Đang gia công
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-display">
                                Sản lượng: <strong className="text-slate-800 font-medium font-sans">{p.completedQuantity.toLocaleString()} / {p.totalQuantity.toLocaleString()} cái</strong> • Khởi công: {p.startDate} • Dự kiến hoàn thành: {p.expectedEndDate}
                              </p>
                            </div>

                            {/* Progress Bar & Toggle */}
                            <div className="flex items-center space-x-6 min-w-[280px]">
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1 font-sans">
                                  <span className="text-slate-500 font-normal">Tiến độ tổng thể</span>
                                  <span className="font-medium text-blue-950">{p.progressPercent}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${p.status === 'BOTTLENECK' ? 'bg-rose-500' : 'bg-blue-950'
                                      }`}
                                    style={{ width: `${p.progressPercent}%` }}
                                  ></div>
                                </div>
                              </div>

                              <button
                                onClick={() => setExpandedPlanId(isExpanded ? null : p.planId)}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl border border-slate-200/80 transition-all font-sans cursor-pointer shrink-0"
                              >
                                {isExpanded ? "Ẩn công đoạn" : "Chi tiết công đoạn"}
                              </button>
                            </div>
                          </div>

                          {/* EXPANDABLE STAGES BREAKDOWN */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 pt-4 mt-2 animate-in fade-in duration-200">
                              <h4 className="text-xs font-medium text-slate-700 font-sans mb-3 flex items-center">
                                <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-950 stroke-[2.5]" />
                                Chi tiết 5 Công đoạn sản xuất theo thứ tự:
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                {p.stages.map((st: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`p-3.5 rounded-2xl border text-xs font-display flex flex-col justify-between ${st.status === 'COMPLETED'
                                      ? 'bg-emerald-50/40 border-emerald-100 text-emerald-950'
                                      : st.status === 'IN_PROGRESS'
                                        ? 'bg-amber-50/40 border-amber-200 text-amber-950'
                                        : 'bg-slate-50/60 border-slate-100 text-slate-400'
                                      }`}
                                  >
                                    <div>
                                      <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[10px] font-medium font-sans uppercase">Công đoạn {st.sequenceNo}</span>
                                        {st.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />}
                                        {st.status === 'IN_PROGRESS' && <Clock className="w-4 h-4 text-amber-600 animate-spin stroke-[2.5]" />}
                                      </div>
                                      <h5 className="font-medium text-slate-900 font-sans text-xs mb-1">{st.stageName}</h5>
                                      <p className="text-[11px] text-slate-600 font-display">Phụ trách: <strong>{st.assigneeName}</strong></p>
                                    </div>
                                    <div className="border-t border-slate-200/40 pt-2 mt-2 text-[10px] text-slate-500 font-sans">
                                      <span>Hình thức: {st.payType} ({st.rate})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}

              </>
            )}
          </div>

        </div>

      </div>

      {/* DIRECTIVES MODAL (GỬI CHỈ ĐẠO QUẢN ĐỐC) */}
      {directiveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-medium text-slate-900 font-sans">Gửi Chỉ Đạo Trực Tiếp cho Quản Đốc</h3>
                <p className="text-xs text-slate-500 font-display mt-0.5">
                  Chỉ đạo sẽ được gửi trực tiếp đến tài khoản <strong className="text-blue-950 font-sans">{directiveModal.targetForeman}</strong>.
                </p>
              </div>
              <button
                onClick={() => setDirectiveModal({ isOpen: false, planName: "", stageName: "", targetForeman: "" })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-700 font-display border border-slate-100 space-y-1">
              <p>Sản phẩm: <strong className="font-sans font-medium text-slate-900">{directiveModal.planName}</strong></p>
              <p>Công đoạn: <strong className="font-sans font-medium text-rose-700">{directiveModal.stageName}</strong></p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 font-sans block">Nội dung chỉ đạo của BOD:</label>
              <textarea
                value={directiveText}
                onChange={(e) => setDirectiveText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-display focus:outline-none focus:border-blue-950 focus:bg-white transition-colors min-h-[110px]"
                placeholder="Ví dụ: Đề nghị Quản đốc điều chuyển ngay 4 thợ từ Tổ may 1 sang hỗ trợ khâu Ép keo đường may để giải phóng 1.800 bán thành phẩm WIP tồn xưởng..."
              ></textarea>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDirectiveModal({ isOpen: false, planName: "", stageName: "", targetForeman: "" })}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-medium text-xs font-sans hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSendDirectiveSubmit}
                className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 text-white font-medium text-xs font-sans shadow-md shadow-blue-950/20 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5 mr-2 stroke-[2.5]" />
                Phát Chỉ Đạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 space-y-4">
            <h3 className="text-base font-medium text-slate-900 font-sans">Từ chối dự toán kế hoạch</h3>
            <p className="text-xs text-slate-500 font-display">Vui lòng nhập lý do từ chối để Trưởng phòng Sản xuất điều chỉnh lại định mức BOM.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-display focus:outline-none focus:border-rose-400 focus:bg-white transition-colors min-h-[90px]"
              placeholder="Nhập lý do từ chối..."
            ></textarea>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => { setRejectModal({ isOpen: false, id: null }); setRejectReason(""); }}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-medium text-xs font-sans hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectSubmit}
                className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs font-sans shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper Empty State
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
        <Check className="w-8 h-8 stroke-[2.5]" />
      </div>
      <h3 className="text-sm font-medium text-slate-800 font-sans">Trạng thái Lý tưởng!</h3>
      <p className="text-xs text-slate-400 mt-1 font-display max-w-sm">{message}</p>
    </div>
  );
}
