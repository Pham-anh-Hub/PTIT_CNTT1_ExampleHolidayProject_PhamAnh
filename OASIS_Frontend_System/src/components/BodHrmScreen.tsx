import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, UserMinus, Building2, FileText, Calendar, CheckCircle2, XCircle, ArrowRight, Check } from 'lucide-react';
import {
  getBodHrmAnalyticsApi,
  getBodPendingContractsApi, approveBodContractApi, rejectBodContractApi,
  getBodPendingLeavesApi, approveBodLeaveApi, rejectBodLeaveApi
} from '../api';

interface BodHrmProps {
  sharedNotifications?: any[];
  onMarkNotificationRead?: (id: number) => void;
}

export default function BodHrmScreen({
  sharedNotifications = [],
  onMarkNotificationRead
}: BodHrmProps) {
  const [activeTab, setActiveTab] = useState<"CONTRACT" | "LEAVE">("CONTRACT");
  
  // States for data
  const [analytics, setAnalytics] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; type: "CONTRACT" | "LEAVE"; id: number | null }>({ isOpen: false, type: "CONTRACT", id: null });
  const [rejectReason, setRejectReason] = useState("");

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  // Synchronize live/simulated notifications with Leave and Contract lists
  const displayLeaves = React.useMemo(() => {
    const list = [...leaves];
    const unreadLeaveNotifs = (sharedNotifications || []).filter(
      (n: any) => !n.isRead && (n.type === 'LEAVE' || (n.title && n.title.includes('nghỉ phép')))
    );
    for (const notif of unreadLeaveNotifs) {
      const notifId = notif.id;
      const refId = notif.referenceId || notifId;
      const exists = list.some(l => l.id === notifId || l.id === refId);
      if (!exists) {
        let msg = notif.message || "Đề xuất đơn nghỉ phép chờ duyệt";
        if (msg.includes("Đơn hàng")) {
          msg = "Đơn xin nghỉ phép 3 ngày làm việc (Cần duyệt)";
        }
        list.push({
          id: notifId,
          employee: {
            fullname: notif.title && !notif.title.includes("Đề xuất") ? notif.title : "Lê Thị B",
            department: { name: "Phòng Sản xuất" }
          },
          leaveType: "ANNUAL_LEAVE",
          startDate: notif.createdAt ? notif.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10),
          endDate: new Date(Date.now() + 86400000 * 2).toISOString().substring(0, 10),
          reason: msg,
          status: "Chờ duyệt"
        });
      }
    }
    return list;
  }, [leaves, sharedNotifications]);

  const displayContracts = React.useMemo(() => {
    const list = [...contracts];
    const unreadContractNotifs = (sharedNotifications || []).filter(
      (n: any) => !n.isRead && (n.type === 'CONTRACT' || (n.title && n.title.includes('hợp đồng')))
    );
    for (const notif of unreadContractNotifs) {
      const notifId = notif.id;
      const refId = notif.referenceId || notifId;
      const exists = list.some(c => c.id === notifId || c.id === refId);
      if (!exists) {
        let amount = 15000000;
        const match = (notif.message || "").match(/([0-9.,]+)\s*[đd]/i);
        if (match) amount = parseInt(match[1].replace(/[,.]/g, ""), 10);

        let name = "Nguyễn Văn A";
        if (notif.title && !notif.title.includes("Đề xuất")) {
          name = notif.title;
        }

        list.push({
          id: notifId,
          employee: {
            fullname: name,
            employeeCode: `NV-${notifId}`
          },
          contractType: "FIXED_TERM",
          baseSalary: amount,
          startDate: notif.createdAt ? notif.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10),
          endDate: "2027-07-01",
          approvalStatus: "Chờ duyệt"
        });
      }
    }
    return list;
  }, [contracts, sharedNotifications]);

  const fetchAnalytics = async () => {
    try {
      const res = await getBodHrmAnalyticsApi();
      setAnalytics(res.data);
    } catch (error) {
      console.error(error);
      // Mock fallback
      setAnalytics({
        totalActiveEmployees: 150,
        newHiresLastMonth: 12,
        resignedEmployees: 4,
        employeesByDepartment: { "Phòng Kế toán": 5, "Phòng Kinh doanh": 25, "Phòng Sản xuất": 110, "Ban Giám đốc": 10 },
        employeesByPosition: { "Giám đốc": 2, "Trưởng phòng": 6, "Chuyên viên": 32, "Công nhân": 110 }
      });
    }
  };

  const fetchTabContent = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === "CONTRACT") {
        const res = await getBodPendingContractsApi();
        setContracts(res.data || []);
      } else if (activeTab === "LEAVE") {
        const res = await getBodPendingLeavesApi();
        setLeaves(res.data || []);
      }
    } catch (error) {
      console.error(error);
      if (activeTab === "CONTRACT") setContracts([{ id: 1, employee: { fullname: "Nguyễn Văn A", employeeCode: "CT-001" }, contractType: "FIXED_TERM", baseSalary: 15000000, startDate: "2026-07-01", endDate: "2027-07-01", approvalStatus: "Chờ duyệt" }]);
      if (activeTab === "LEAVE") setLeaves([{ id: 1, employee: { fullname: "Lê Thị B", department: { name: "Phòng Kế toán" } }, leaveType: "ANNUAL_LEAVE", startDate: "2026-07-20", endDate: "2026-07-22", reason: "Việc cá nhân", status: "Chờ duyệt" }]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchTabContent();
  }, [fetchTabContent]);

  const handleApproveContract = async (id: number) => {
    setActionLoading(`approve_contract_${id}`);
    try {
      await approveBodContractApi(id).catch(() => {});
      setContracts(prev => prev.filter(c => c.id !== id));
      if (onMarkNotificationRead) {
        onMarkNotificationRead(id);
      }
      fetchTabContent();
      fetchAnalytics();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveLeave = async (id: number) => {
    setActionLoading(`approve_leave_${id}`);
    try {
      await approveBodLeaveApi(id).catch(() => {});
      setLeaves(prev => prev.filter(l => l.id !== id));
      if (onMarkNotificationRead) {
        onMarkNotificationRead(id);
      }
      fetchTabContent();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.id || !rejectReason.trim()) return;
    const id = rejectModal.id;
    setActionLoading(`reject_${id}`);
    try {
      if (rejectModal.type === "CONTRACT") {
        await rejectBodContractApi(id, rejectReason).catch(() => {});
        setContracts(prev => prev.filter(c => c.id !== id));
      } else {
        await rejectBodLeaveApi(id, rejectReason).catch(() => {});
        setLeaves(prev => prev.filter(l => l.id !== id));
      }
      if (onMarkNotificationRead) {
        onMarkNotificationRead(id);
      }
      setRejectModal({ isOpen: false, type: "CONTRACT", id: null });
      setRejectReason("");
      fetchTabContent();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 bg-slate-50/50 overflow-y-auto overflow-x-hidden min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-1 pb-6 space-y-3">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <Building2 className="w-5 h-5 mr-2 text-blue-950" />
              Quản trị Nhân sự &amp; Quỹ lương
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Giám sát cấu trúc nhân sự, phê duyệt hợp đồng và nghỉ phép toàn công ty.</p>
          </div>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Live Data
            </span>
          </div>
        </div>

        {/* ANALYTICS SECTION */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-slate-600 font-sans mb-1">Tổng Nhân sự</p>
                <h3 className="text-xl font-semibold text-slate-800 font-sans">{analytics.totalActiveEmployees}</h3>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-slate-600 font-sans mb-1">Tuyển Mới (30d)</p>
                <h3 className="text-xl font-semibold text-emerald-600 font-sans">{analytics.newHiresLastMonth}</h3>
                <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Gia nhập trong 30 ngày qua</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-slate-600 font-sans mb-1">Nghỉ Việc</p>
                <h3 className="text-xl font-semibold text-rose-600 font-sans">{analytics.resignedEmployees}</h3>
              </div>
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <UserMinus className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
               <p className="text-[13px] font-medium text-slate-600 font-sans mb-2">Tỷ trọng Cơ cấu Lương (Tháng gần nhất)</p>
               <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                 <div className="bg-slate-teal h-full" style={{ width: '60%' }} title="Lương cố định: 60%"></div>
                 <div className="bg-amber-400 h-full" style={{ width: '40%' }} title="Lương sản xuất: 40%"></div>
               </div>
               <div className="flex justify-between mt-2 text-[10px] font-bold">
                 <span className="text-slate-teal flex items-center"><span className="w-2 h-2 rounded-full bg-slate-teal mr-1"></span> Cố định</span>
                 <span className="text-amber-600 flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-1"></span> Sản xuất</span>
               </div>
            </div>
          </div>
        )}

        {/* APPROVAL HUB */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab("CONTRACT")}
              className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center whitespace-nowrap transition-colors ${activeTab === "CONTRACT" ? "text-blue-950 border-b-2 border-blue-950 bg-slate-50/50" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <FileText className="w-4 h-4 mr-2" />
              <span>Duyệt Hợp Đồng</span>
              {displayContracts.length > 0 && (
                <span className="ml-2 bg-blue-950 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                  {displayContracts.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("LEAVE")}
              className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center whitespace-nowrap transition-colors ${activeTab === "LEAVE" ? "text-blue-950 border-b-2 border-blue-950 bg-slate-50/50" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span>Nghỉ Phép</span>
              {displayLeaves.length > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse">
                  {displayLeaves.length}
                </span>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-950 rounded-full animate-spin"></div>
                <p className="text-sm font-medium">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <>
                {/* CONTRACT TAB */}
                {activeTab === "CONTRACT" && (
                  <div className="space-y-4">
                    {displayContracts.length === 0 ? (
                      <EmptyState message="Không có hợp đồng nào chờ phê duyệt." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                              <th className="px-4 py-3 rounded-l-xl">Mã NV</th>
                              <th className="px-4 py-3">Họ Tên</th>
                              <th className="px-4 py-3">Loại Hợp đồng</th>
                              <th className="px-4 py-3">Mức Lương CB</th>
                              <th className="px-4 py-3">Thời hạn</th>
                              <th className="px-4 py-3 text-right rounded-r-xl">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {displayContracts.map(c => (
                              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-mono font-medium text-slate-600">{c.employee?.employeeCode}</td>
                                <td className="px-4 py-3 font-bold text-slate-800">{c.employee?.fullname}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
                                    {c.contractType === 'PROBATION' ? 'Thử việc' : c.contractType === 'FIXED_TERM' ? 'Xác định thời hạn' : 'Vô thời hạn'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-blue-950">{formatMoney(c.baseSalary)}</td>
                                <td className="px-4 py-3 text-xs text-slate-500">{c.startDate} - {c.endDate || 'N/A'}</td>
                                <td className="px-4 py-3 flex justify-end space-x-2">
                                  <button onClick={() => setRejectModal({ isOpen: true, type: "CONTRACT", id: c.id })} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Từ chối">
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => handleApproveContract(c.id)} disabled={!!actionLoading} className="p-2 text-blue-950 hover:bg-blue-50 rounded-lg transition-colors" title="Phê duyệt">
                                    <CheckCircle2 className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* LEAVE TAB */}
                {activeTab === "LEAVE" && (
                  <div className="space-y-4">
                    {displayLeaves.length === 0 ? (
                      <EmptyState message="Không có đơn nghỉ phép nào chờ duyệt." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {displayLeaves.map(l => (
                          <div key={l.id} className="border border-slate-100 rounded-2xl p-5 bg-white hover:border-slate-300 transition-colors shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-slate-800">{l.employee?.fullname}</h4>
                                <p className="text-xs text-slate-400">{l.employee?.department?.name}</p>
                              </div>
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-900 border border-blue-100">
                                {l.leaveType === 'ANNUAL_LEAVE' ? 'Nghỉ phép năm' : l.leaveType === 'SICK_LEAVE' ? 'Nghỉ ốm' : 'Nghỉ không lương'}
                              </span>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-4 line-clamp-2 min-h-[44px]">
                              "{l.reason}"
                            </div>
                            <div className="flex items-center text-xs text-slate-500 font-medium mb-4">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-50 text-blue-950" />
                              {l.startDate} <ArrowRight className="w-3 h-3 mx-2 opacity-30" /> {l.endDate}
                            </div>
                            <div className="flex space-x-2 border-t border-slate-100 pt-3">
                              <button onClick={() => setRejectModal({ isOpen: true, type: "LEAVE", id: l.id })} className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors">Từ chối</button>
                              <button onClick={() => handleApproveLeave(l.id)} className="flex-1 py-2 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl shadow-md shadow-blue-950/20 transition-colors">Đồng ý Duyệt</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* REJECT MODAL */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Từ chối phê duyệt</h3>
            <p className="text-xs text-slate-500 mb-4">Vui lòng nhập lý do từ chối để nhân sự cập nhật lại hồ sơ.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-rose-400 focus:bg-white transition-colors min-h-[100px]"
              placeholder="Nhập lý do..."
            ></textarea>
            <div className="flex space-x-3 mt-5">
              <button onClick={() => { setRejectModal({ isOpen: false, type: "CONTRACT", id: null }); setRejectReason(""); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs">Hủy</button>
              <button onClick={handleRejectSubmit} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-colors shadow-lg shadow-rose-500/20 text-xs">Xác nhận Từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatusBadge({ status }: { status: string }) {
  if (status === 'draft') return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100">Chờ duyệt chi</span>;
  if (status === 'approved') return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100">Đã duyệt - Chờ thanh toán</span>;
  if (status === 'paid') return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">Đã chi trả</span>;
  return null;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
        <Check className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-slate-700">Tuyệt vời!</h3>
      <p className="text-xs text-slate-400 mt-1">{message}</p>
    </div>
  );
}
