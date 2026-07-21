import React, { useState, useEffect, startTransition } from 'react';
import { ShieldAlert, TrendingUp, Users, AlertTriangle, CheckCircle2, ShoppingCart, Landmark, Activity, RefreshCw, FileCheck2 } from 'lucide-react';
import { 
  getBodRevenueTrendApi, 
  getBodCustomerDebtApi,
  getBodPendingOrdersApi,
  getBodNotificationsApi,
  markBodNotificationReadApi,
  approveBodOrderApi,
  rejectBodOrderApi
} from '../api';

interface BodSalesScreenProps {
  orders?: any[];
  onApproveOrder?: (id: string) => void;
  onRejectOrder?: (id: string, reason: string) => void;
  // Props mới — nhận notifications từ DataContext (shared with Dashboard)
  sharedNotifications?: any[];
  onMarkNotificationRead?: (id: number) => void;
}

export default function BodSalesScreen({ orders = [], onApproveOrder, onRejectOrder, sharedNotifications, onMarkNotificationRead }: BodSalesScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  
  // Data states
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [customerDebt, setCustomerDebt] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [orderNotifications, setOrderNotifications] = useState<any[]>([]);

  // Top Metrics calculation states
  const [latestCashflow, setLatestCashflow] = useState({ sales: 0, revenue: 0 });
  const [totalBadDebt, setTotalBadDebt] = useState(0);
  const [top3Dependency, setTop3Dependency] = useState(0);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; orderId: number | string | null }>({ isOpen: false, orderId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [selectedNotifId, setSelectedNotifId] = useState<number | null>(null);
  // Confirm approve popup
  const [confirmApproveId, setConfirmApproveId] = useState<number | string | null>(null);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [trendRes, debtRes, ordersRes, notifRes] = await Promise.all([
        getBodRevenueTrendApi().catch(() => ({ data: [] })),
        getBodCustomerDebtApi().catch(() => ({ data: [] })),
        getBodPendingOrdersApi().catch(() => ({ data: [] })),
        getBodNotificationsApi().catch(() => ({ data: [] }))
      ]);

      const allNotifs = notifRes.data || [];
      const oNotifs = allNotifs.filter((n: any) => n.type === 'ORDER');
      // Sort: unread first, then date desc
      oNotifs.sort((a: any, b: any) => {
        if (a.isRead === b.isRead) {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return a.isRead ? 1 : -1;
      });
      // Chỉ set local nếu không có sharedNotifications
      if (!sharedNotifications) setOrderNotifications(oNotifs);

      const trends = trendRes.data && trendRes.data.length > 0 ? trendRes.data : [
        { period: "2026-02", revenue: 80000000, sales: 110000000 },
        { period: "2026-03", revenue: 100000000, sales: 120000000 },
        { period: "2026-04", revenue: 95000000, sales: 135000000 },
        { period: "2026-05", revenue: 110000000, sales: 125000000 },
        { period: "2026-06", revenue: 120000000, sales: 140000000 },
        { period: "2026-07", revenue: 115000000, sales: 155000000 }
      ];

      const debts = debtRes.data && debtRes.data.length > 0 ? debtRes.data : [
        { customerName: "Nội Thất Nhà Xinh", debtAmount: 120000000 },
        { customerName: "Xây dựng Hoà Bình", debtAmount: 95000000 },
        { customerName: "Tập đoàn SunGroup", debtAmount: 82000000 },
        { customerName: "Gỗ Mỹ Nghệ Âu Lạc", debtAmount: 45000000 },
        { customerName: "Showroom Tân Cổ Điển", debtAmount: 25000000 }
      ];
      
      const apiOrders = ordersRes.data && ordersRes.data.length > 0 ? ordersRes.data : [];
      // Combine API pending orders with props orders
      const propsPendingOrders = orders.filter((o: any) => o.status === "PENDING" || o.status === "Chờ duyệt");
      const combinedPendingOrders = apiOrders.length > 0 ? apiOrders : propsPendingOrders;

      // Sắp xếp giảm dần theo nợ
      const sortedDebts = [...debts].sort((a, b) => b.debtAmount - a.debtAmount);
      
      setRevenueTrend(trends);
      setCustomerDebt(sortedDebts);
      setPendingOrders(combinedPendingOrders);

      // Tính Metrics
      if (trends.length > 0) {
        setLatestCashflow({ 
          sales: trends[trends.length - 1].sales || 0, 
          revenue: trends[trends.length - 1].revenue || 0 
        });
      }

      const totalDebt = sortedDebts.reduce((sum, item) => sum + (item.debtAmount || 0), 0);
      setTotalBadDebt(totalDebt);

      if (sortedDebts.length > 0 && totalDebt > 0) {
        const top3Sum = sortedDebts.slice(0, 3).reduce((sum, item) => sum + (item.debtAmount || 0), 0);
        setTop3Dependency(parseFloat(((top3Sum / totalDebt) * 100).toFixed(1)));
      }
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu BOD Sales:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: number | string) => {
    setConfirmApproveId(null); // Đóng popup
    setActionLoading(id);
    try {
      if (typeof id === 'number') {
        await approveBodOrderApi(id);
      } else if (onApproveOrder) {
        onApproveOrder(id);
      }
      setPendingOrders(prev => prev.filter(o => o.id !== id));
      // Mark related notification as read
      const relatedNotif = displayNotifications.find(n => n.referenceId === id || n.id === id);
      if (relatedNotif && onMarkNotificationRead) {
        onMarkNotificationRead(relatedNotif.id);
      } else if (relatedNotif) {
        setOrderNotifications(prev => prev.map(n => n.id === relatedNotif.id ? { ...n, isRead: true } : n));
      }
      setSelectedNotifId(null);
    } catch (err) {
      alert("Ụi khi duyệt đơn!");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.orderId || !rejectReason.trim()) return;
    setActionLoading(rejectModal.orderId);
    
    try {
      if (typeof rejectModal.orderId === 'number') {
        await rejectBodOrderApi(rejectModal.orderId, rejectReason);
      } else if (onRejectOrder) {
        onRejectOrder(rejectModal.orderId, rejectReason);
      }
      setPendingOrders(prev => prev.filter(o => o.id !== rejectModal.orderId));
      // Mark related notification as read
      const relatedNotif = displayNotifications.find(n => n.referenceId === rejectModal.orderId || n.id === rejectModal.orderId);
      if (relatedNotif && onMarkNotificationRead) {
        onMarkNotificationRead(relatedNotif.id);
      } else if (relatedNotif) {
        setOrderNotifications(prev => prev.map(n => n.id === relatedNotif.id ? { ...n, isRead: true } : n));
      }
      setRejectModal({ isOpen: false, orderId: null });
      setRejectReason("");
      setSelectedNotifId(null);
    } catch (err) {
      alert("Ụi khi từ chối đơn!");
    } finally {
      setActionLoading(null);
    }
  };

  const gapRatio = latestCashflow.sales > 0 
    ? Math.round(((latestCashflow.sales - latestCashflow.revenue) / latestCashflow.sales) * 100) 
    : 0;

  // Sử dụng sharedNotifications nếu có, fallback về local state
  const displayNotifications = React.useMemo(() => {
    if (sharedNotifications && sharedNotifications.length > 0) {
      // Lọc chỉ ORDER notifications và sắp xếp
      const oNotifs = sharedNotifications.filter((n: any) => !n.type || n.type === 'ORDER');
      return [...oNotifs].sort((a: any, b: any) => {
        if (a.isRead === b.isRead) {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return a.isRead ? 1 : -1;
      });
    }
    return orderNotifications;
  }, [sharedNotifications, orderNotifications]);

  const handleSelectNotification = (notif: any) => {
    setSelectedNotifId(notif.id);
  };

  const formatPeriodLabel = (p: string) => {
    if (!p) return "";
    const parts = p.split("-");
    if (parts.length === 2) return `Tháng ${parseInt(parts[1], 10)}`;
    return p;
  };

  return (
    <div className="flex-1 bg-slate-50/50 overflow-y-auto overflow-x-hidden min-h-screen pb-12 font-sans" id="bod-sales-view">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-1 pb-6 space-y-3 animate-in fade-in duration-300">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
          <div>
            <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight flex items-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <ShieldAlert className="w-5 h-5 mr-2 text-slate-800" />
              Đài Quan Sát Sales &amp; Công Nợ
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Góc nhìn trực quan về Dòng tiền và phê duyệt đơn hàng lớn (Đã đồng bộ thời gian thực).</p>
          </div>
          <div className="flex space-x-3 items-center">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer shadow-sm"
              title="Đồng bộ lại dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <span className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-full border border-slate-700 flex items-center shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
              Gatekeeper Mode
            </span>
          </div>
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[13px] font-medium text-slate-600 font-sans">Doanh thu vs Thực thu (Kỳ mới nhất)</span>
              <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-xl font-semibold text-slate-800 font-sans">{formatMoney(latestCashflow.revenue)}</h3>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Thực thu</span>
              </div>
              <div className="mt-1 flex items-center text-[11px] font-medium text-slate-500 font-sans">
                <span>Doanh thu chốt: {formatMoney(latestCashflow.sales)}</span>
                <span className="mx-2 text-slate-200">|</span>
                <span className="text-slate-800 font-bold">Lệch {gapRatio}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[13px] font-medium text-slate-600 font-sans">Tổng Công nợ (Khách hàng)</span>
              <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800 font-sans">{formatMoney(totalBadDebt)}</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1 font-sans">Tổng cộng các khoản chưa thu hồi.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[13px] font-medium text-slate-600 font-sans">Độ phụ thuộc "Cá Mập" (Top 3)</span>
              <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800 font-sans">{top3Dependency}%</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1 font-sans">Tỷ trọng nợ/doanh thu tập trung ở 3 khách lớn nhất.</p>
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Chart 1: Horizontal Bar Chart (Công nợ Khách hàng) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display">Xếp hạng Công nợ Khách hàng</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Thanh ngang thể hiện độ lớn khoản nợ.</p>
              </div>
            </div>
            
            <div className="relative w-full pb-2">
              {customerDebt.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Chưa có dữ liệu công nợ.</div>
              ) : (
                <div className="space-y-4">
                  {customerDebt.slice(0, 5).map((item, idx) => {
                    const maxDebt = Math.max(...customerDebt.map(d => d.debtAmount), 1);
                    const widthPercent = (item.debtAmount / maxDebt) * 100;
                    
                    // Xanh Navy tone
                    let colorClass = "bg-slate-300";
                    if (idx === 0) colorClass = "bg-slate-800";
                    else if (idx === 1) colorClass = "bg-slate-600";
                    else if (idx === 2) colorClass = "bg-slate-500";
                    else if (idx === 3) colorClass = "bg-slate-400";

                    return (
                      <div key={idx} className="group cursor-pointer">
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                          <span className="truncate max-w-[180px]">{item.customerName}</span>
                          <span className="font-mono">{formatMoney(item.debtAmount)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-5 overflow-hidden">
                          <div 
                            className={`h-full ${colorClass} transition-all duration-700 group-hover:brightness-110`}
                            style={{ width: `${Math.max(widthPercent, 5)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Grouped Bar Chart (Doanh thu vs Thực thu) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display">Doanh thu vs Tiền Thực thu</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">So sánh kỳ vọng và thực tế song song để dễ nhìn.</p>
              </div>
              <div className="flex items-center space-x-3 text-[10px] font-bold">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-300"></span>
                  <span className="text-slate-500">Doanh thu chốt</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800"></span>
                  <span className="text-slate-800">Tiền thực thu</span>
                </div>
              </div>
            </div>

            {/* SVG Grouped Bar Chart */}
            <div className="h-56 relative w-full">
              {revenueTrend.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">Chưa có dữ liệu xu hướng.</div>
              ) : (
                <svg className="w-full h-full" viewBox="0 0 550 220" preserveAspectRatio="none">
                  {/* Y Axis Labels */}
                  <text x="35" y="25" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">150M</text>
                  <text x="35" y="62.5" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">100M</text>
                  <text x="35" y="100" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">50M</text>
                  <text x="35" y="137.5" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">25M</text>
                  <text x="35" y="175" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">0</text>

                  {/* Grid Lines */}
                  <line x1="45" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="45" y1="57.5" x2="520" y2="57.5" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="45" y1="95" x2="520" y2="95" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="45" y1="132.5" x2="520" y2="132.5" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="45" y1="170" x2="520" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Draw bars */}
                  {(() => {
                    const maxVal = Math.max(...revenueTrend.map(d => Math.max(d.sales || 0, d.revenue || 0)), 150000000) || 150000000;
                    
                    return revenueTrend.map((d, idx) => {
                      const colX = 80 + idx * 75; 
                      
                      const salesHeight = ((d.sales || 0) / maxVal) * 150;
                      const salesY = 170 - salesHeight;

                      const revHeight = ((d.revenue || 0) / maxVal) * 150;
                      const revY = 170 - revHeight;

                      return (
                        <g key={idx} className="cursor-pointer group">
                          {/* Hover background for the group */}
                          <rect x={colX - 35} y="15" width="70" height="160" fill="transparent" className="group-hover:fill-slate-50 transition-colors"/>
                          
                          {/* Doanh thu chốt (Cột trái - xám) */}
                          <rect
                            x={colX - 22}
                            y={salesY}
                            width="20"
                            height={Math.max(2, salesHeight)}
                            className="transition-all duration-300 group-hover:opacity-90 fill-slate-300"
                          />

                          {/* Tiền thực thu (Cột phải - Xanh navy/Đen) */}
                          <rect
                            x={colX + 2}
                            y={revY}
                            width="20"
                            height={Math.max(2, revHeight)}
                            className="transition-all duration-300 group-hover:opacity-90 fill-slate-800"
                          />

                          {/* X Axis label */}
                          <text x={colX} y="190" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">
                            {formatPeriodLabel(d.period)}
                          </text>

                          {/* Tooltip text (SVG) - Hiện khi hover */}
                          <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <rect x={colX - 55} y={Math.min(salesY, revY) - 28} width="110" height="22" rx="4" fill="#1e293b" />
                            <text x={colX} y={Math.min(salesY, revY) - 13} textAnchor="middle" className="text-[9px] font-bold fill-white">
                              Thu: {formatMoney(d.revenue)}
                            </text>
                          </g>
                        </g>
                      );
                    });
                  })()}
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* ACTION HUB */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 py-4 px-6 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center font-display">
              <ShoppingCart className="w-5 h-5 mr-2 text-slate-800" />
              Gatekeeper: Duyệt Đơn Rủi Ro
              {displayNotifications.filter((n: any) => !n.isRead).length > 0 && <span className="ml-3 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full">{displayNotifications.filter((n: any) => !n.isRead).length} chưa đọc</span>}
            </h3>
          </div>

          <div className="p-6">
            {/* ORDERS / NOTIFICATIONS VIEW */}
              <div className="space-y-4">
                {displayNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
                    <h3 className="text-sm font-bold text-slate-700">Không có thông báo phê duyệt rủi ro.</h3>
                    <p className="text-xs text-slate-400 mt-1">Các đơn hàng bình thường đang được tự động duyệt theo phân quyền.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
                    {/* Left Hand: Queue List */}
                    <div className="lg:col-span-5 space-y-2 border-r border-slate-50 pr-0 lg:pr-4 max-h-[400px] overflow-y-auto">
                      {displayNotifications.map((notif: any) => {
                        const isRead = notif.isRead;
                        // Thử tìm giá trị trong pendingOrders bằng referenceId hoặc parse từ message
                        const actualOrder = pendingOrders.find(o => o.id === notif.referenceId);
                        let amount = actualOrder ? (actualOrder.totalAmount || actualOrder.amount) : 0;
                        if (!amount) {
                            const match = (notif.message || "").match(/([0-9.,]+)\s*[đd]/i);
                            if (match) amount = parseInt(match[1].replace(/[,.]/g, ""), 10);
                        }

                        return (
                          <button
                            key={notif.id}
                            onClick={() => handleSelectNotification(notif)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                              selectedNotifId === notif.id
                                ? "border-slate-800 bg-slate-100 shadow-sm"
                                : isRead 
                                  ? "border-slate-100 bg-white/50 opacity-70 hover:opacity-100" 
                                  : "border-slate-200 bg-slate-50 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between w-full">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${isRead ? "bg-slate-100 text-slate-500" : "bg-rose-50 text-rose-600"}`}>
                                {isRead ? "Đã xem" : "Mới: Đơn hàng rủi ro"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">#{notif.referenceId || notif.id}</span>
                            </div>
                            <h4 className={`text-xs mt-2 truncate ${isRead ? "font-medium text-slate-600" : "font-bold text-slate-800"}`}>
                                {notif.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                            
                            {!!amount && (
                                <div className="mt-3 flex justify-between items-center border-t border-slate-100 pt-2">
                                <span className="text-[10px] text-slate-400">Trị giá:</span>
                                <span className={`text-xs font-mono ${isRead ? "text-slate-500" : "font-bold text-slate-800"}`}>{formatMoney(amount)}</span>
                                </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Hand: Detailed View */}
                    <div className="lg:col-span-7 bg-slate-50/40 border border-slate-100 rounded-xl p-5 relative min-h-[300px]">
                      {(() => {
                        const selectedNotif = displayNotifications.find((n: any) => n.id === selectedNotifId);
                        if (!selectedNotif) {
                          return (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                              <FileCheck2 className="w-10 h-10 mb-3 opacity-20" />
                              <p className="text-xs font-bold">Chưa chọn thông báo cần duyệt</p>
                              <p className="text-[10px] mt-1 text-slate-400">Chọn bất kỳ một đề xuất nào trong hàng đợi bên trái</p>
                            </div>
                          );
                        }

                        const actualOrder = pendingOrders.find(o => o.id === selectedNotif.referenceId);
                        const orderAmount = actualOrder ? (actualOrder.totalAmount || actualOrder.amount || 0) : 0;
                        const tags = [];
                        if (orderAmount > 50000000) tags.push("Vượt hạn mức duyệt tự động");
                        if (orderAmount > 100000000) tags.push("Khách mua đột biến");

                        return (
                          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-200">
                            <div className="border-b border-slate-200 pb-4">
                              <h3 className="text-lg font-bold text-slate-800 font-display mb-1">{selectedNotif.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                                <span>Ref ID: #{selectedNotif.referenceId}</span>
                                <span>|</span>
                                <span>Ngày: {selectedNotif.createdAt ? selectedNotif.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10)}</span>
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-100">
                                <p className="text-xs leading-relaxed text-slate-600">{selectedNotif.message}</p>
                            </div>

                            {!!orderAmount && (
                                <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Trị giá đơn hàng</p>
                                    <p className="text-lg font-black text-slate-800 font-mono">{formatMoney(orderAmount)}</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Tình trạng Tồn kho</p>
                                    <p className="text-sm font-bold text-emerald-600 mt-1">Đủ hàng giao</p>
                                </div>
                                </div>
                            )}

                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
                              <p className="text-[10px] uppercase font-bold text-rose-600 tracking-wider mb-2 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Đánh giá Rủi ro Hệ thống
                              </p>
                              <ul className="list-disc pl-4 text-xs text-rose-700 font-medium space-y-1">
                                {tags.map((tag, idx) => <li key={idx}>{tag}</li>)}
                                {tags.length === 0 && <li>Cần Giám đốc đánh giá tín dụng khách hàng thủ công.</li>}
                              </ul>
                            </div>

                            <div className="flex space-x-3 pt-2">
                              <button 
                                onClick={() => setRejectModal({ isOpen: true, orderId: selectedNotif.referenceId })}
                                disabled={!!actionLoading || !selectedNotif.referenceId}
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                              >
                                Bác bỏ (Yêu cầu trả trước)
                              </button>
                              <button 
                                onClick={() => {
                                  if (selectedNotif.referenceId) setConfirmApproveId(selectedNotif.referenceId);
                                }}
                                disabled={!!actionLoading || !selectedNotif.referenceId}
                                className="flex-1 px-4 py-2.5 bg-blue-950 text-white hover:bg-blue-900 text-xs font-bold rounded-xl shadow-lg shadow-blue-950/30 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === selectedNotif.referenceId ? "Đang xử lý..." : "Bảo lãnh xuất hàng"}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>

      </div>

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-800 mb-1 font-display">Bác bỏ đơn hàng</h3>
            <p className="text-[11px] text-slate-500 mb-4">Lý do sẽ được chuyển đến cho Nhân viên Sale để họ đàm phán lại với khách hoặc giục nợ.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-400 focus:bg-white transition-colors min-h-[100px]"
              placeholder="VD: Yêu cầu khách hàng thanh toán 50% dư nợ cũ trước khi xuất hàng mới..."
            ></textarea>
            <div className="flex space-x-3 mt-5">
              <button 
                onClick={() => { setRejectModal({ isOpen: false, orderId: null }); setRejectReason(""); }} 
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleRejectSubmit} 
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors shadow-lg shadow-slate-900/20 text-xs"
              >
                Xác nhận Bác bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Approve Modal — tông navy/trắng, backdrop mờ nhẹ */}
      {confirmApproveId !== null && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}
          onClick={() => setConfirmApproveId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-blue-950/10 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-14 h-14 bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-bold text-center text-blue-950 mb-1">Xác nhận Bảo lãnh Xuất hàng</h3>
            <p className="text-xs text-center text-slate-500 mb-5 leading-relaxed">
              Bạn chắc chắn muốn xác nhận và ký số duyệt xuất hàng cho đơn này? Hành động này sẽ được ghi nhận với tư cách Ban Giám đốc.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmApproveId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleApprove(confirmApproveId)}
                className="flex-1 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold transition-colors shadow-lg shadow-blue-950/25 text-xs"
              >
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
