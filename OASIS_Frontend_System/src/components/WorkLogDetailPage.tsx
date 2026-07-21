import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Calendar, Clock, User, CheckCircle2, FileSpreadsheet, Building2, Plus, X, Info, AlertTriangle, Check } from "lucide-react";
import { getDailyWorkLogsApi, createDailyWorkLogApi } from "../api";

interface WorkLogDetailPageProps {
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  period?: string;
  type?: "piece_rate" | "hourly";
  onBack?: () => void;
}

// Định nghĩa các công đoạn cố định tương ứng dữ liệu mẫu ở Backend
const DEFAULT_STAGES = [
  { id: 1, name: "1. Chuẩn bị nguyên vật liệu", type: "hourly", rate: 45000 },
  { id: 2, name: "2. Cắt gỗ & Tạo hình phôi", type: "piece_rate", rate: 30000 },
  { id: 3, name: "3. Lắp ráp kết cấu sản phẩm", type: "piece_rate", rate: 30000 },
  { id: 4, name: "4. Chà nhám & Sơn phủ PU", type: "hourly", rate: 45000 },
  { id: 5, name: "5. Đóng gói & Nhập kho thành phẩm", type: "hourly", rate: 45000 }
];

export default function WorkLogDetailPage({
  employeeId = "25",
  employeeName = "Trần Văn C",
  employeeCode = "CTY001-PROD-08",
  departmentName = "Phân xưởng Mộc",
  period = "2026-06",
  type = "hourly",
  onBack
}: WorkLogDetailPageProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [showStageDropdown, setShowStageDropdown] = useState(false);

  // Custom Alert Popup State
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
    setAlertInfo({ isOpen: true, type, title, message });
  };

  // Form states
  const [workDate, setWorkDate] = useState(new Date().toISOString().split("T")[0]);
  const [shiftName, setShiftName] = useState("Ca Hành chính (08h - 17h)");
  const [selectedStage, setSelectedStage] = useState(DEFAULT_STAGES[0]);
  const [completedQuantity, setCompletedQuantity] = useState("10");
  const [hoursWorked, setHoursWorked] = useState("8");

  const shiftDropdownRef = useRef<HTMLDivElement>(null);
  const stageDropdownRef = useRef<HTMLDivElement>(null);

  const shiftOptions = [
    "Ca Hành chính (08h - 17h)",
    "Ca Hành chính + OT (2h)",
    "Ca Hành chính + OT (3h)",
    "Nghỉ phép có đơn"
  ];

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shiftDropdownRef.current && !shiftDropdownRef.current.contains(event.target as Node)) {
        setShowShiftDropdown(false);
      }
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target as Node)) {
        setShowStageDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch dữ liệu từ API
  const fetchWorkLogs = async () => {
    setIsLoading(true);
    try {
      const response = await getDailyWorkLogsApi(employeeId, period);
      if (response && response.data) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải nhật ký công nhật:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkLogs();
  }, [employeeId, period]);

  // Submit log mới lên Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId: Number(employeeId),
        stageId: selectedStage.id,
        workDate: workDate,
        shiftName: shiftName,
        completedQuantity: selectedStage.type === "piece_rate" ? Number(completedQuantity) : null,
        hoursWorked: selectedStage.type === "hourly" ? Number(hoursWorked) : null
      };

      await createDailyWorkLogApi(payload);
      setIsModalOpen(false);
      fetchWorkLogs();
      showAlert("Ghi công thành công", "Đã ghi nhận nhật ký công việc thành công vào hệ thống.");
    } catch (err) {
      console.error("Lỗi khi ghi nhận nhật ký công:", err);
      showAlert("Lỗi hệ thống", "Ghi nhận nhật ký chấm công thất bại!", "error");
    }
  };

  // Tính toán các thẻ thống kê tổng hợp
  const totalAmount = logs.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalQuantity = logs.reduce((sum, item) => sum + (item.completedQuantity || 0), 0);
  const totalHours = logs.reduce((sum, item) => sum + (item.hoursWorked || 0), 0);
  const totalWorkDays = logs.filter(item => (item.hoursWorked || 0) > 0 || (item.completedQuantity || 0) > 0).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Top Navigation Bar with System Navy Back Button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-950/15"
          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Bảng Lương</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-poppins">Kỳ lương: <strong className="text-slate-900 font-mono font-bold">{period}</strong></span>
          <span className="bg-blue-50 text-blue-950 text-xs font-bold px-3 py-1 rounded-xl border border-blue-100" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
            {type === "piece_rate" ? "Lương Sản Phẩm Khoán" : "Lương Theo Công / Giờ Ngày"}
          </span>
        </div>
      </div>

      {/* Light Header Info Card */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-3 bg-blue-50 text-blue-950 rounded-2xl border border-blue-100">
            <User className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
              {employeeName}
            </h1>
            <p className="text-xs text-slate-500 font-poppins flex items-center space-x-2 mt-0.5">
              <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs border border-slate-200">{employeeCode}</span>
              <span>•</span>
              <span className="flex items-center"><Building2 className="w-3.5 h-3.5 mr-1 text-slate-500" /> {departmentName}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-center space-x-6">
          {type === "piece_rate" ? (
            <>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Tổng Sản Lượng</span>
                <span className="text-lg font-bold font-mono text-slate-900">{totalQuantity} <span className="text-xs font-normal text-slate-500">sản phẩm</span></span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Tổng Tiền Công</span>
                <span className="text-lg font-bold font-mono text-emerald-600">{totalAmount.toLocaleString("vi-VN")} đ</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Tổng Giờ Làm (Công)</span>
                <span className="text-lg font-bold font-mono text-slate-900">{totalHours} giờ <span className="text-xs font-poppins font-normal text-slate-500">({totalWorkDays} ngày)</span></span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Tổng Tiền Công Tích Lũy</span>
                <span className="text-lg font-bold font-mono text-emerald-600">{totalAmount.toLocaleString("vi-VN")} đ</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notice & Daily Record Trigger Button */}
      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-xs font-poppins text-slate-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Dữ liệu nhật ký công hàng ngày do <strong>Quản lý Phân xưởng / SPM</strong> nhập và đối soát trực tiếp.</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm"
          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ghi nhận thủ công</span>
        </button>
      </div>

      {/* Main Logs Table Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
            <FileSpreadsheet className="w-4.5 h-4.5 text-blue-950 mr-2" />
            Chi Tiết Nhật Ký Công Hàng Ngày ({type === "piece_rate" ? "Sản Phẩm" : "Theo Giờ"})
          </h2>
          <span className="text-xs text-slate-500 font-poppins">Hiển thị {logs.length} bản ghi</span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs font-poppins text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-700" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                <th className="py-3.5 px-4">Ngày</th>
                <th className="py-3.5 px-4">Ca Làm / Khung Giờ</th>
                <th className="py-3.5 px-4 text-right">{type === "piece_rate" ? "Sản Lượng" : "Số Giờ Làm"}</th>
                <th className="py-3.5 px-4">Nhiệm Vụ / Công Đoạn</th>
                <th className="py-3.5 px-4 text-right">Đơn Giá</th>
                <th className="py-3.5 px-4 text-right">Tiền Công Ngày</th>
                <th className="py-3.5 px-4 text-center">Duyệt Bởi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-poppins">Đang tải nhật ký công việc từ hệ thống...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-poppins">Không có bản ghi nhật ký chấm công nào trong tháng này.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{log.workDate}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{log.shiftName || "Ca Hành chính"}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {type === "piece_rate" ? (
                        `${log.completedQuantity || 0} sp`
                      ) : (
                        log.hoursWorked > 0 ? `${log.hoursWorked} giờ` : <span className="text-slate-400 font-normal">0 giờ</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{log.stageName}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 text-xs">{(log.unitPrice || 0).toLocaleString("vi-VN")}đ</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 text-sm">{(log.amount || 0).toLocaleString("vi-VN")}đ</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> {log.approvedByName || "Quản đốc xưởng"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-100 text-xs">
                <td colSpan={2} className="py-3.5 px-4 text-slate-900 font-bold" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                  TỔNG CỘNG THÁNG ({totalWorkDays} NGÀY CÔNG)
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-bold text-sm">
                  {type === "piece_rate" ? `${totalQuantity} sp` : `${totalHours} giờ`}
                </td>
                <td colSpan={2} className="py-3.5 px-4"></td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-600 text-base">{totalAmount.toLocaleString("vi-VN")} VNĐ</td>
                <td className="py-3.5 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Manual Daily Work Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 border border-slate-100 rounded-[24px] p-6 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-[15px] font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                Ghi nhận công nhật hằng ngày
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ngày làm việc */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Ngày làm việc</label>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Ca làm / Khung giờ */}
              <div className="space-y-1 relative" ref={shiftDropdownRef}>
                <label className="text-xs font-bold text-slate-500 block">Ca làm / Khung giờ</label>
                <button
                  type="button"
                  onClick={() => setShowShiftDropdown(!showShiftDropdown)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all duration-200 flex justify-between items-center cursor-pointer text-left"
                >
                  <span>{shiftName}</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showShiftDropdown && (
                  <div className="absolute left-0 w-full mt-1.5 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-1 max-h-40 overflow-y-auto">
                    {shiftOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setShiftName(option);
                          setShowShiftDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          shiftName === option ? "bg-blue-950 text-white font-bold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nhiệm vụ / Công đoạn */}
              <div className="space-y-1 relative" ref={stageDropdownRef}>
                <label className="text-xs font-bold text-slate-500 block">Nhiệm vụ / Công đoạn sản xuất</label>
                <button
                  type="button"
                  onClick={() => setShowStageDropdown(!showStageDropdown)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all duration-200 flex justify-between items-center cursor-pointer text-left"
                >
                  <span>{selectedStage.name} ({selectedStage.type === "piece_rate" ? "Khoán" : "Giờ"})</span>
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showStageDropdown && (
                  <div className="absolute left-0 w-full mt-1.5 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-1">
                    {DEFAULT_STAGES.map((stage) => (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          setSelectedStage(stage);
                          setShowStageDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          selectedStage.id === stage.id ? "bg-blue-950 text-white font-bold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {stage.name} ({stage.type === "piece_rate" ? "Lương Khoán" : "Lương Giờ"})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nhập số lượng / Giờ làm dựa theo loại công đoạn đã chọn */}
              {selectedStage.type === "piece_rate" ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Số sản lượng đạt chuẩn (sản phẩm)</label>
                  <input
                    type="number"
                    value={completedQuantity}
                    onChange={(e) => setCompletedQuantity(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all"
                    min="1"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Số giờ làm việc thực tế (giờ)</label>
                  <input
                    type="number"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all"
                    step="0.5"
                    min="0"
                    max="24"
                    required
                  />
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 cursor-pointer text-center"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-xs font-bold text-white shadow-lg cursor-pointer text-center"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
                >
                  Ghi nhận công ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- REUSABLE SYSTEM ALERT DIALOG POPUP MODAL --- */}
      {alertInfo && alertInfo.isOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 border border-slate-100 rounded-[24px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center border ${
              alertInfo.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                : alertInfo.type === "error"
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : "bg-blue-50 border-blue-100 text-blue-950"
            }`}>
              {alertInfo.type === "success" ? (
                <Check className="w-6 h-6" />
              ) : alertInfo.type === "error" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Info className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-[14px] font-bold text-slate-800" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                {alertInfo.title}
              </h3>
              <p className="text-xs text-slate-500 font-poppins leading-relaxed">
                {alertInfo.message}
              </p>
            </div>

            <button
              onClick={() => setAlertInfo(null)}
              className="w-full py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-xs font-bold text-white shadow-lg cursor-pointer transition-all"
              style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
