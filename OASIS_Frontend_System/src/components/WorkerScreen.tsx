import { useState, useEffect, useRef } from "react";
import { LeaveRequest, ClockLog } from "../types";
import { SAMPLE_PAYSLIPS } from "../data";
import { 
  QrCode, CalendarPlus, FileSpreadsheet, Clock, ChevronDown, ChevronUp, 
  Check, CheckCircle2, AlertCircle, Camera, Scan, User, RefreshCw, 
  Video, VideoOff, Smile, ShieldAlert, Volume2, HelpCircle 
} from "lucide-react";

interface WorkerScreenProps {
  logs: ClockLog[];
  onAddClockLog: (log: ClockLog) => void;
  onAddLeaveRequest: (req: LeaveRequest) => void;
}

const SCANNABLE_WORKERS = [
  { id: "emp-6", name: "Nguyễn Công Binh", code: "GV-106", dept: "Xưởng Gỗ 1", role: "Thợ Gỗ Chính", avatar: "CB" },
  { id: "emp-2", name: "Trần Thị Mai", code: "GV-102", dept: "Hành chính", role: "Trưởng phòng HCNS", avatar: "TM" },
  { id: "emp-3", name: "Phạm Minh Quang", code: "GV-103", dept: "Sản xuất", role: "Kỹ thuật trưởng", avatar: "MQ" },
  { id: "emp-101", name: "Lê Văn Đạt", code: "GV-101", dept: "Xưởng Gỗ 1", role: "Thợ Phụ Gỗ", avatar: "VĐ" }
];

const MOCK_WORK_RECORDS: Record<string, Array<{ date: string; checkIn: string; checkOut: string; hours: number; status: "Đủ công" | "Trễ" | "Về sớm" | "Nghỉ phép" }>> = {
  "emp-6": [
    { date: "01/07", checkIn: "07:55", checkOut: "17:02", hours: 8, status: "Đủ công" },
    { date: "02/07", checkIn: "07:58", checkOut: "17:05", hours: 8, status: "Đủ công" },
    { date: "03/07", checkIn: "08:15", checkOut: "17:00", hours: 7.5, status: "Trễ" },
    { date: "04/07", checkIn: "07:50", checkOut: "12:00", hours: 4, status: "Đủ công" },
    { date: "06/07", checkIn: "07:52", checkOut: "17:03", hours: 8, status: "Đủ công" },
    { date: "07/07", checkIn: "07:56", checkOut: "15:30", hours: 6.5, status: "Về sớm" },
    { date: "08/07", checkIn: "07:59", checkOut: "17:01", hours: 8, status: "Đủ công" }
  ],
  "emp-2": [
    { date: "01/07", checkIn: "08:02", checkOut: "17:30", hours: 8, status: "Đủ công" },
    { date: "02/07", checkIn: "07:55", checkOut: "17:30", hours: 8, status: "Đủ công" },
    { date: "03/07", checkIn: "07:58", checkOut: "17:00", hours: 8, status: "Đủ công" },
    { date: "06/07", checkIn: "08:00", checkOut: "17:15", hours: 8, status: "Đủ công" },
    { date: "07/07", checkIn: "08:20", checkOut: "17:30", hours: 7.5, status: "Trễ" },
    { date: "08/07", checkIn: "07:50", checkOut: "17:05", hours: 8, status: "Đủ công" }
  ],
  "emp-3": [
    { date: "01/07", checkIn: "07:45", checkOut: "17:00", hours: 8, status: "Đủ công" },
    { date: "02/07", checkIn: "07:40", checkOut: "17:05", hours: 8, status: "Đủ công" },
    { date: "03/07", checkIn: "07:50", checkOut: "17:00", hours: 8, status: "Đủ công" },
    { date: "06/07", checkIn: "07:42", checkOut: "17:02", hours: 8, status: "Đủ công" },
    { date: "07/07", checkIn: "--:--", checkOut: "--:--", hours: 0, status: "Nghỉ phép" },
    { date: "08/07", checkIn: "07:48", checkOut: "17:00", hours: 8, status: "Đủ công" }
  ],
  "emp-101": [
    { date: "01/07", checkIn: "07:58", checkOut: "17:00", hours: 8, status: "Đủ công" },
    { date: "02/07", checkIn: "07:55", checkOut: "17:00", hours: 8, status: "Đủ công" },
    { date: "03/07", checkIn: "08:05", checkOut: "17:00", hours: 7.8, status: "Trễ" },
    { date: "06/07", checkIn: "07:59", checkOut: "17:02", hours: 8, status: "Đủ công" },
    { date: "07/07", checkIn: "07:54", checkOut: "17:00", hours: 8, status: "Đủ công" },
    { date: "08/07", checkIn: "07:50", checkOut: "17:03", hours: 8, status: "Đủ công" }
  ]
};

export default function WorkerScreen({ logs, onAddClockLog, onAddLeaveRequest }: WorkerScreenProps) {
  // 1. Ticking Real-Time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  // 2. FaceID & Webcam States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState("Sẵn sàng quét FaceID");
  const [selectedWorkerId, setSelectedWorkerId] = useState("emp-6");
  const [attendanceType, setAttendanceType] = useState<"IN" | "OUT">("IN");

  // Auto-detect check-in/out type based on worker history
  useEffect(() => {
    const workerLogs = logs.filter(l => l.workerId === selectedWorkerId);
    if (workerLogs.length === 0) {
      setAttendanceType("IN");
    } else {
      const lastLog = workerLogs[workerLogs.length - 1];
      setAttendanceType(lastLog.type === "IN" ? "OUT" : "IN");
    }
  }, [selectedWorkerId, logs]);
  
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [lastScanResult, setLastScanResult] = useState<{
    name: string;
    code: string;
    dept: string;
    time: string;
    type: "IN" | "OUT";
    confidence: number;
  } | null>(null);

  // Sound generator (Web Audio API) for instant feedback without external assets
  const playBeep = (type: "scan" | "success" | "error") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === "scan") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08);
      } else if (type === "success") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(900, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(1250, audioCtx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.22);
      } else if (type === "error") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      console.log("Audio feedback not supported or blocked by browser:", e);
    }
  };

  // Setup / teardown Webcam stream
  useEffect(() => {
    if (useWebcam) {
      setWebcamError(null);
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 480 }, 
          height: { ideal: 360 }, 
          facingMode: "user" 
        } 
      })
        .then((stream) => {
          setWebcamStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => {
              console.log("Video auto play interrupted", err);
            });
          }
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          setWebcamError("Không thể kích hoạt Camera thiết bị (Chưa cấp quyền hoặc thiết bị thiếu camera). Hệ thống tự động kích hoạt bộ mô phỏng cao cấp.");
          setUseWebcam(false);
          playBeep("error");
        });
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [useWebcam]);

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
  };

  // Trigger scanning procedure
  const handleStartFaceScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setLastScanResult(null);
    playBeep("scan");
    setScanStatusText("Đang dò tìm tiêu cự khuôn mặt...");

    const milestones = [
      { progress: 20, text: "Phát hiện khuôn mặt... Đang lập bản đồ 3D..." },
      { progress: 50, text: "Trích xuất đặc trưng sinh trắc học FaceID..." },
      { progress: 80, text: "So khớp cơ sở dữ liệu nhân sự phân xưởng..." },
      { progress: 100, text: "Đang ký số & ghi nhận chấm công điện tử..." }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 5;
        
        if (stepIdx < milestones.length && next >= milestones[stepIdx].progress) {
          setScanStatusText(milestones[stepIdx].text);
          stepIdx++;
          playBeep("scan");
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const worker = SCANNABLE_WORKERS.find(w => w.id === selectedWorkerId) || SCANNABLE_WORKERS[0];
            const logTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

            const newLog: ClockLog = {
              id: `log-${Date.now()}`,
              workerId: worker.id,
              workerName: worker.name,
              timestamp: new Date().toISOString(),
              type: attendanceType,
              location: "Tablet Cố Định - Xưởng Gỗ 1 (FaceID)"
            };

            // Propagate event up
            onAddClockLog(newLog);
            playBeep("success");

            setLastScanResult({
              name: worker.name,
              code: worker.code,
              dept: worker.dept,
              time: logTime,
              type: attendanceType,
              confidence: Number((99.2 + Math.random() * 0.7).toFixed(2))
            });

            setIsScanning(false);
            setScanProgress(0);
            setScanStatusText("Sẵn sàng quét FaceID");

            // Auto-detect will update state on next render via useEffect
          }, 350);
          return 100;
        }
        return next;
      });
    }, 120);
  };

  // 3. Companion Mobile States
  const [showLeaveWizard, setShowLeaveWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [leaveDate, setLeaveDate] = useState("2026-07-10");
  const [leaveEndDate, setLeaveEndDate] = useState("2026-07-11");
  const [leaveReason, setLeaveReason] = useState("Đau ốm đột xuất");

  const leaveReasons = [
    "Đau ốm đột xuất cần đi khám bệnh",
    "Giải quyết việc gia đình / Có giỗ ở quê",
    "Khám sức khoẻ định kỳ cá nhân",
    "Nghỉ phép thường niên theo chế độ",
    "Đi học lớp nâng cao tay nghề cơ khí mộc"
  ];

  const handleLeaveSubmit = () => {
    const newReq: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId: "emp-6",
      employeeName: "Nguyễn Công Binh",
      startDate: leaveDate,
      endDate: leaveEndDate,
      reason: leaveReason,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    onAddLeaveRequest(newReq);
    setWizardStep(1);
    setShowLeaveWizard(false);
    playBeep("success");

    alert("Gửi đơn nghỉ phép thành công! Đơn đã được chuyển về Hộp thư phê duyệt của BOD để xem xét duyệt lương.");
  };

  // 4. Expandable Payslips Breakdown State
  const [expandedPayslipId, setExpandedPayslipId] = useState<string | null>(null);

  // Dynamic helpers to construct work logs and payslips for the chosen worker
  const activeWorker = SCANNABLE_WORKERS.find(w => w.id === selectedWorkerId) || SCANNABLE_WORKERS[0];

  const getMergedRecords = (workerId: string) => {
    const base = MOCK_WORK_RECORDS[workerId] || [];
    
    // Find logs in this session for this worker
    const sessionLogs = logs.filter(l => l.workerId === workerId);
    
    if (sessionLogs.length === 0) return base;
    
    let checkInTime = "--:--";
    let checkOutTime = "--:--";
    let hours = 0;
    let status: "Đủ công" | "Trễ" | "Về sớm" | "Nghỉ phép" = "Đủ công";
    
    // Find first IN and last OUT
    const inLog = sessionLogs.find(l => l.type === "IN");
    const outLog = sessionLogs.slice().reverse().find(l => l.type === "OUT");
    
    if (inLog) {
      const d = new Date(inLog.timestamp);
      checkInTime = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      if (d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0)) {
        status = "Trễ";
      }
    }
    
    if (outLog) {
      const d = new Date(outLog.timestamp);
      checkOutTime = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      if (d.getHours() < 17) {
        status = "Về sớm";
      }
    }
    
    if (inLog && outLog) {
      const diffMs = new Date(outLog.timestamp).getTime() - new Date(inLog.timestamp).getTime();
      hours = Number((diffMs / (1000 * 60 * 60)).toFixed(1));
      if (hours >= 8 && status !== "Trễ") {
        status = "Đủ công";
      }
    } else if (inLog) {
      hours = 4; // default partial for check-in only
    }

    const updatedBase = [...base];
    const todayEntry = {
      date: "Hôm nay",
      checkIn: checkInTime,
      checkOut: checkOutTime,
      hours,
      status
    };
    
    // If there is already a "Hôm nay" entry, we can replace or overlay it
    const idx = updatedBase.findIndex(r => r.date === "Hôm nay");
    if (idx !== -1) {
      updatedBase[idx] = todayEntry;
    } else {
      updatedBase.push(todayEntry);
    }
    
    return updatedBase;
  };

  const getWorkerPayslips = (workerId: string) => {
    const worker = SCANNABLE_WORKERS.find(w => w.id === workerId) || SCANNABLE_WORKERS[0];
    let basic = 9500000;
    if (worker.id === "emp-2") basic = 22000000;
    if (worker.id === "emp-3") basic = 18000000;
    if (worker.id === "emp-101") basic = 7500000;

    return [
      {
        id: `slip-1-${worker.id}`,
        month: "2026-06",
        basicSalary: basic,
        pieceRateEarnings: worker.id === "emp-2" || worker.id === "emp-3" ? 0 : 3850000,
        overtimeEarnings: worker.id === "emp-2" ? 0 : 1200000,
        allowances: worker.id === "emp-2" ? 2000000 : 1000000,
        deductions: Math.floor(basic * 0.105),
        netPay: basic + (worker.id === "emp-2" || worker.id === "emp-3" ? 0 : 3850000) + (worker.id === "emp-2" ? 0 : 1200000) + (worker.id === "emp-2" ? 2000000 : 1000000) - Math.floor(basic * 0.105),
        details: worker.id === "emp-2" || worker.id === "emp-3" 
          ? [ { stageName: "Lương KPI Trách nhiệm Quản lý", quantity: 1, unitWage: worker.id === "emp-2" ? 5000000 : 4000000, amount: worker.id === "emp-2" ? 5000000 : 4000000 } ]
          : [
            { stageName: "Chà nhám mặt bàn SP-BAS-01", quantity: 15, unitWage: 120000, amount: 1800000 },
            { stageName: "Sơn lót & PU tủ SP-TQA-04", quantity: 10, unitWage: 150000, amount: 1500000 },
            { stageName: "Lắp ráp hộc kéo SP-KSA-05", quantity: 11, unitWage: 50000, amount: 550000 }
          ]
      }
    ];
  };

  const togglePayslip = (id: string) => {
    setExpandedPayslipId(expandedPayslipId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="worker-mobile-workspace">
      {/* Styles for advanced face mesh & laser scan animation */}
      <style>{`
        @keyframes scan-line-movement {
          0% { top: 4%; }
          50% { top: 96%; }
          100% { top: 4%; }
        }
        .animate-scan-line {
          animation: scan-line-movement 2.5s ease-in-out infinite;
        }
        @keyframes radar-pulse {
          0% { transform: scale(0.95); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.3; }
        }
        .animate-radar-pulse {
          animation: radar-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Head Panel */}
      <div>
        <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight">
          Hệ Thống Chấm Công Sinh Trắc Học &amp; Cổng Nhân Viên
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Bao gồm Trạm Chấm Công FaceID cố định (đặt tại cửa phân xưởng) chạy trên máy tính bảng/PC chuyên dụng, và Cổng di động tự phục vụ tra cứu phiếu lương cho thợ xưởng.
        </p>
      </div>

      {/* Grid Layout representing Industrial Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: STATIONARY TABLET ATTENDANCE TERMINAL (7/12) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-5 text-white">
          
          {/* Tablet Frame Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-teal/10 border border-slate-teal/30 flex items-center justify-center">
                <Camera className="w-5 h-5 text-slate-teal" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-1.5">
                  TRẠM CHẤM CÔNG FACEID CỐ ĐỊNH
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-green animate-pulse" title="Trạm trực tuyến"></span>
                </h2>
                <p className="text-[11px] text-slate-400">Thiết bị Tablet cố định đặt tại: <strong className="text-slate-300">Xưởng Gỗ số 1</strong></p>
              </div>
            </div>

            {/* Simulated live clock on stationary screen */}
            <div className="text-right sm:text-right w-full sm:w-auto">
              <span className="text-sm font-bold font-mono text-slate-teal tracking-wider block">
                {formatTime(currentTime)}
              </span>
              <span className="text-[9px] text-slate-400 font-medium block">
                {formatDate(currentTime)}
              </span>
            </div>
          </div>

          {/* Quick Simulation controls - VERY FRIENDLY FOR TESTING */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-slate-teal" /> Bộ chọn thử nghiệm nhân sự
              </span>
              <span className="text-[9px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Dành cho Kiểm Thử (BOD/QA)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Select Employee to stand in front of kiosk */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">Người đứng trước Camera:</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => {
                    setSelectedWorkerId(e.target.value);
                    setLastScanResult(null);
                  }}
                  disabled={isScanning}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-teal"
                >
                  {SCANNABLE_WORKERS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code} - {w.dept})
                    </option>
                  ))}
                </select>
              </div>

              {/* Set Check In or Out */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 font-bold">Trạng thái nhận diện:</label>
                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded animate-pulse">
                    Tự động nhận diện thông minh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`p-2 rounded-lg text-[11px] font-black text-center border transition-all ${
                      attendanceType === "IN"
                        ? "bg-emerald-green text-white border-emerald-green shadow-lg shadow-emerald-950/40"
                        : "bg-slate-900 text-slate-600 border-slate-800 opacity-40"
                    }`}
                  >
                    VÀO CA (Mặc định lần 1) {attendanceType === "IN" && "◀"}
                  </div>
                  <div
                    className={`p-2 rounded-lg text-[11px] font-black text-center border transition-all ${
                      attendanceType === "OUT"
                        ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-950/40"
                        : "bg-slate-900 text-slate-600 border-slate-800 opacity-40"
                    }`}
                  >
                    RA CA (Mặc định lần 2) {attendanceType === "OUT" && "◀"}
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 italic text-center">
                  Hệ thống tự động phân tích lượt chấm công để chốt vào/ra ca chính xác cho từng nhân sự.
                </p>
              </div>
            </div>
          </div>

          {/* WebCam / Fallback Scanner viewport */}
          <div className="relative aspect-video max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center shadow-inner">
            
            {/* Live HTML5 Video element when active */}
            {useWebcam ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            ) : (
              /* High-fidelity Vector Mesh/Radar simulation when inactive or loading */
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="relative w-28 h-28 rounded-full border border-slate-800 flex items-center justify-center">
                  <div className="absolute inset-2 rounded-full border border-slate-teal/20 animate-ping"></div>
                  <div className="absolute inset-4 rounded-full border-2 border-dashed border-slate-teal/40 animate-spin" style={{ animationDuration: "12s" }}></div>
                  <div className="absolute inset-8 rounded-full bg-slate-teal/10 border border-slate-teal/30 flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-teal/80" />
                  </div>
                </div>

                {/* Cyberpunk grid points */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                <span className="text-[10px] text-slate-500 mt-4 font-mono font-bold tracking-widest uppercase">
                  Simulated Camera Scanner
                </span>
              </div>
            )}

            {/* Glowing Laser line animation while scanning */}
            {isScanning && (
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-scan-line z-10" />
            )}

            {/* Face guide visual bracket borders overlay */}
            <div className="absolute inset-6 pointer-events-none flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-2 border-l-2 border-slate-teal"></div>
                <div className="w-6 h-6 border-t-2 border-r-2 border-slate-teal"></div>
              </div>
              
              {/* Dynamic crosshair in center */}
              <div className="self-center flex items-center justify-center">
                <div className={`w-36 h-36 rounded-full border border-dashed transition-colors duration-300 ${isScanning ? "border-red-500/60 animate-pulse" : "border-slate-teal/40"}`}></div>
                <Scan className={`absolute w-8 h-8 transition-colors duration-300 ${isScanning ? "text-red-500 animate-spin" : "text-slate-teal/60"}`} />
              </div>

              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-2 border-l-2 border-slate-teal"></div>
                <div className="w-6 h-6 border-b-2 border-r-2 border-slate-teal"></div>
              </div>
            </div>

            {/* Interactive Webcam active indicators */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-mono text-slate-300 border border-slate-800 flex items-center gap-1.5 z-10">
              <div className={`w-2 h-2 rounded-full ${useWebcam ? "bg-red-500 animate-pulse" : "bg-slate-500"}`}></div>
              <span>{useWebcam ? "LIVE WEBCAM" : "SIMULATION MODE"}</span>
            </div>

            {/* Scanning Progress Overlay bar */}
            {isScanning && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-center space-y-2 z-20">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400 font-bold text-left">{scanStatusText}</span>
                  <span className="text-slate-teal font-extrabold">{scanProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-slate-teal h-full rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Device Error Notification */}
          {webcamError && (
            <div className="bg-amber-950/40 border border-amber-900/50 text-amber-300 p-2.5 rounded-xl text-[10px] flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{webcamError}</span>
            </div>
          )}

          {/* Scanner Controls Underneath */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
            
            {/* The main FACEID scanning execution trigger */}
            <button
              onClick={handleStartFaceScan}
              disabled={isScanning}
              className={`flex-1 min-h-[50px] rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md ${
                isScanning 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-slate-teal hover:bg-slate-teal-hover text-white active:scale-98"
              }`}
            >
              <Scan className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "ĐANG TIẾN HÀNH QUÉT..." : "BẮT ĐẦU QUÉT KHUÔN MẶT (FACEID)"}
            </button>

            {/* Webcam activation toggle */}
            <button
              onClick={() => {
                setUseWebcam(!useWebcam);
                setLastScanResult(null);
              }}
              disabled={isScanning}
              className={`px-4 min-h-[50px] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                useWebcam
                  ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                  : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
              }`}
              title={useWebcam ? "Tắt camera thật" : "Bật camera thật"}
            >
              {useWebcam ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              <span>{useWebcam ? "Tắt Camera" : "Bật Camera Thật"}</span>
            </button>
          </div>

          {/* LIVE VERIFICATION DISPLAY (badge feedback) */}
          {lastScanResult ? (
            <div className="bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200" id="scan-success-pane">
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Ghi nhận chấm công thành công
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  Độ khớp: {lastScanResult.confidence}%
                </span>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold tracking-wider font-display shadow-sm">
                  {SCANNABLE_WORKERS.find(w => w.name === lastScanResult.name)?.avatar || "CB"}
                </div>
                <div className="flex-1 text-xs">
                  <div className="text-slate-300 font-bold text-sm">{lastScanResult.name}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    Mã số: <span className="text-slate-300 font-mono font-semibold">{lastScanResult.code}</span> • Phòng ban: <span className="text-slate-300 font-medium">{lastScanResult.dept}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                    lastScanResult.type === "IN" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {lastScanResult.type === "IN" ? "VÀO CA" : "RA CA"}
                  </span>
                  <span className="text-slate-400 block text-[10px] font-mono font-bold mt-1.5">{lastScanResult.time}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-800 rounded-2xl p-4 text-center text-slate-500 text-xs">
              <ShieldAlert className="w-4 h-4 mx-auto mb-1.5 text-slate-600" />
              <span>Chưa có lượt chấm công nào trong phiên. Đứng trước thiết bị tablet và bấm Quét FaceID để ghi nhận.</span>
            </div>
          )}

          {/* Local logs roster representation of Kiosk station */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Các lượt quét FaceID &amp; QR gần nhất tại Trạm:
            </span>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 font-sans text-[11px]">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">Chưa có bản ghi chấm công.</div>
              ) : (
                logs.slice().reverse().map((log) => (
                  <div key={log.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 flex justify-between items-center text-slate-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        {log.workerName.substring(0, 2)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">{log.workerName}</span>
                        <span className="text-[9px] text-slate-500 block">Địa điểm: {log.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        log.type === "IN" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {log.type === "IN" ? "VÀO" : "RA"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIMULATED PERSONAL WORKER MOBILE PORTAL (5/12) */}
        <div className="lg:col-span-5 flex justify-center items-start" id="simulated-mobile-wrapper">
          <div className="relative w-full max-w-[390px] bg-slate-900 rounded-[40px] p-4 shadow-2xl border-4 border-slate-800">
            {/* Smartphone Speaker & Camera Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-full flex items-center justify-center z-20">
              <div className="w-2 h-2 rounded-full bg-slate-900 mr-2"></div>
              <div className="w-12 h-1 bg-slate-900 rounded"></div>
            </div>

            {/* Smartphone Screen Canvas */}
            <div className="bg-[#f8fafc] rounded-[28px] overflow-hidden min-h-[620px] flex flex-col justify-between relative text-slate-800 font-sans border border-slate-700 select-none">
              
              {/* Simulated Phone Status Bar */}
              <div className="h-8 bg-slate-100 px-5 flex justify-between items-center text-[10px] text-slate-500 font-mono font-semibold pt-1 border-b border-slate-200/50">
                <span>Viettel 4G</span>
                <span className="font-bold">18:40</span>
                <div className="flex items-center space-x-1">
                  <span>⚡ 98%</span>
                </div>
              </div>

              {/* Mobile Header / Brand */}
              <div className="bg-slate-teal p-4 text-white text-center shadow">
                <div className="text-[10px] text-slate-teal-light/80 uppercase font-bold tracking-wider">Cơ khí &amp; Nội Thất Gỗ Việt</div>
                <h2 className="text-xs font-bold mt-0.5">Cổng Tiện Ích Thợ Phân Xưởng</h2>
              </div>

              {/* Simulated Mobile Scrollable Content Canvas */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 max-h-[480px]">
                
                {/* Worker Greeting */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-slate-teal flex items-center justify-center text-white text-xs font-bold font-display shadow-inner">
                    {activeWorker.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-slate-400">Cổng thông tin nhân viên</div>
                    <div className="text-xs font-bold text-slate-800 truncate">{activeWorker.name}</div>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-bold">{activeWorker.code}</span>
                      <span className="text-[8px] bg-emerald-green-light text-emerald-green px-1.5 py-0.2 rounded font-bold">{activeWorker.dept}</span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Daily Work Log Calendar Table or Leave Wizard */}
                {!showLeaveWizard ? (
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-xs">
                        <Clock className="w-4.5 h-4.5 text-slate-teal" />
                        <span>Bảng theo dõi công hằng ngày</span>
                      </div>
                      <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">07/2026</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400">
                            <th className="py-1.5">Ngày</th>
                            <th className="py-1.5 text-center">Vào</th>
                            <th className="py-1.5 text-center">Ra</th>
                            <th className="py-1.5 text-right">Trạng thái / Công</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[10px]">
                          {getMergedRecords(activeWorker.id).slice(-5).map((rec, i) => {
                            const isToday = rec.date === "Hôm nay";
                            return (
                              <tr key={i} className={`hover:bg-slate-50/50 ${isToday ? "bg-amber-50/60 font-semibold text-slate-900" : ""}`}>
                                <td className="py-2 text-slate-600 font-medium">
                                  {rec.date}
                                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block ml-1 animate-pulse" />}
                                </td>
                                <td className="py-2 text-center font-mono text-slate-700">{rec.checkIn}</td>
                                <td className="py-2 text-center font-mono text-slate-700">{rec.checkOut}</td>
                                <td className="py-2 text-right">
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded mr-1 ${
                                    rec.status === "Đủ công" ? "bg-emerald-100 text-emerald-800" :
                                    rec.status === "Trễ" ? "bg-amber-100 text-amber-800" :
                                    rec.status === "Về sớm" ? "bg-amber-100 text-amber-800" :
                                    "bg-rose-100 text-rose-800"
                                  }`}>
                                    {rec.status}
                                  </span>
                                  <span className="font-mono text-slate-500">{rec.hours > 0 ? `${rec.hours}h` : "-"}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Compact Leave Request Trigger */}
                    <button
                      onClick={() => {
                        setWizardStep(1);
                        setShowLeaveWizard(true);
                      }}
                      className="w-full h-8 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-[10px] font-bold text-slate-600 flex items-center justify-center space-x-1.5 transition-colors mt-1"
                      style={{ minHeight: "32px" }}
                      id="mobile-leave-request-btn"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-slate-teal" />
                      <span>Nộp Đơn Nghỉ Phép (3 Bước)</span>
                    </button>
                  </div>
                ) : (
                  /* 3-STEP LEAVE REQUEST WIZARD */
                  <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/20 shadow-xs space-y-4 animate-in slide-in-from-bottom-5 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-700">Quy trình xin nghỉ phép</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Bước {wizardStep}/3</span>
                    </div>

                    {/* Step 1: Select date */}
                    {wizardStep === 1 && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Nghỉ từ ngày</label>
                          <input
                            type="date"
                            value={leaveDate}
                            onChange={(e) => setLeaveDate(e.target.value)}
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Đến hết ngày</label>
                          <input
                            type="date"
                            value={leaveEndDate}
                            onChange={(e) => setLeaveEndDate(e.target.value)}
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                          />
                        </div>
                        <button
                          onClick={() => setWizardStep(2)}
                          className="w-full h-10 bg-slate-teal text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Tiếp tục
                        </button>
                      </div>
                    )}

                    {/* Step 2: Choose Reason */}
                    {wizardStep === 2 && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Chọn lý do nghỉ phép</label>
                          <select
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                          >
                            {leaveReasons.map((rs, idx) => (
                              <option key={idx} value={rs}>
                                {rs}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setWizardStep(1)}
                            className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                          >
                            Quay lại
                          </button>
                          <button
                            onClick={() => setWizardStep(3)}
                            className="flex-1 h-10 bg-slate-teal text-white rounded-xl text-xs font-bold"
                          >
                            Tiếp tục
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Confirmation Summary */}
                    {wizardStep === 3 && (
                      <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Thời gian nghỉ:</span>
                            <span className="font-bold text-slate-700">{leaveDate} → {leaveEndDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Lý do trình duyệt:</span>
                            <span className="font-bold text-slate-700 italic">"{leaveReason}"</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => setWizardStep(2)}
                            className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                          >
                            Sửa lại
                          </button>
                          <button
                            onClick={handleLeaveSubmit}
                            className="flex-1 h-10 bg-emerald-green text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
                          >
                            <Check className="w-4 h-4" />
                            <span>Gửi duyệt</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowLeaveWizard(false);
                        setWizardStep(1);
                      }}
                      className="w-full text-[10px] text-slate-400 text-center hover:underline"
                    >
                      Huỷ quy trình
                    </button>
                  </div>
                )}

                {/* Section 2: Payslip views */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-3">
                  <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-xs pb-1.5 border-b border-slate-50">
                    <FileSpreadsheet className="w-4 h-4 text-slate-teal" />
                    <span>Tổng kết &amp; Tra cứu Lương cuối tháng</span>
                  </div>

                  <div className="space-y-2">
                    {getWorkerPayslips(activeWorker.id).map((slip) => {
                      const isExpanded = expandedPayslipId === slip.id;
                      return (
                        <div key={slip.id} className="border border-slate-100 rounded-xl overflow-hidden transition-all duration-200">
                          {/* Payslip header trigger */}
                          <button
                            onClick={() => togglePayslip(slip.id)}
                            className="w-full text-left p-2.5 flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex-1">
                              <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Kỳ lương: {slip.month}</span>
                              <span className="text-xs font-bold text-slate-800 block mt-0.5">Thực nhận: {slip.netPay.toLocaleString("vi-VN")} đ</span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </button>

                          {/* Expandable breakdown ledge */}
                          {isExpanded && (
                            <div className="p-2.5 bg-white border-t border-slate-50 text-[10px] space-y-2 animate-in fade-in duration-150">
                              <div className="grid grid-cols-2 gap-1.5 text-slate-500 font-mono">
                                <div>Lương cơ bản:</div>
                                <div className="text-right text-slate-800 font-semibold">{slip.basicSalary.toLocaleString("vi-VN")} đ</div>
                                {slip.pieceRateEarnings > 0 && (
                                  <>
                                    <div>Lương khoán sản lượng:</div>
                                    <div className="text-right text-slate-800 font-semibold">{slip.pieceRateEarnings.toLocaleString("vi-VN")} đ</div>
                                  </>
                                )}
                                {slip.overtimeEarnings > 0 && (
                                  <>
                                    <div>Làm thêm giờ:</div>
                                    <div className="text-right text-slate-800 font-semibold">{slip.overtimeEarnings.toLocaleString("vi-VN")} đ</div>
                                  </>
                                )}
                                <div>Phụ cấp &amp; Khác:</div>
                                <div className="text-right text-slate-800 font-semibold">+{slip.allowances.toLocaleString("vi-VN")} đ</div>
                                <div className="text-slate-400">Các khoản giảm trừ (BHXH):</div>
                                <div className="text-right text-red-500 font-semibold">-{slip.deductions.toLocaleString("vi-VN")} đ</div>
                              </div>

                              {/* Manufacturing stage piece-rate details */}
                              <div className="border-t border-dashed border-slate-100 pt-2 space-y-1">
                                <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">Chi tiết sản lượng trong kỳ:</span>
                                {slip.details.map((detail, idx) => (
                                  <div key={idx} className="flex justify-between items-start text-[9px] leading-relaxed">
                                    <div className="text-slate-600 max-w-[130px] truncate">{detail.stageName}</div>
                                    <div className="text-right font-mono text-slate-500">
                                      {detail.quantity} cái x {detail.unitWage.toLocaleString("vi-VN")} = <strong>{detail.amount.toLocaleString("vi-VN")}</strong>
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
                </div>
              </div>

              {/* Simulated Phone Home Indicator Button */}
              <div className="h-6 bg-slate-100 flex items-center justify-center border-t border-slate-200/50 pb-1">
                <div className="w-24 h-1 bg-slate-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
