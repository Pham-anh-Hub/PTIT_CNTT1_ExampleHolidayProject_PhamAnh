import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Plus, Building, User, Mail, Lock, CheckCircle2, AlertCircle, TrendingUp, Cpu, CreditCard, Activity, X, Globe, UserCheck, ShieldAlert } from "lucide-react";
import { registerCompanyApi, getCompaniesApi } from "../api";
import { SAMPLE_TENANTS } from "../data";

const getCompanyLogoUrl = (logoText: string) => {
  const code = logoText.toUpperCase();
  if (logoText.startsWith("http")) return logoText;
  if (code === "GV") {
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80"; // GoViet logo placeholder
  }
  if (code === "TL") {
    return "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=80&auto=format&fit=crop&q=80"; // ThangLong logo placeholder
  }
  return "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80"; // Fallback logo placeholder
};

interface SysAdminScreenProps {
  onViewTenantDetail: (tenant: any) => void;
}

export default function SysAdminScreen({ onViewTenantDetail }: SysAdminScreenProps) {
  const [tenants, setTenants] = useState<any[]>([]);

  // Fetch companies từ Backend khi component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await getCompaniesApi();
        const list = response.data || [];
        const filtered = list.filter((c: any) => c.code !== "SYSTEM");
        const formatted = filtered.map((c: any) => ({
          id: `tenant-${c.id}`,
          name: c.name,
          code: c.code,
          industry: "Lĩnh vực dịch vụ",
          subdomain: `${c.code.toLowerCase()}.saas-erp.vn`,
          logo: c.name.split(" ").map((w: string) => w[0]).join("").substring(0, 3).toUpperCase(),
          taxCode: "Chính thức",
          plan: c.subscriptionPlan || "TRIAL",
          adminName: "Hệ thống cấp",
          adminEmail: `admin@${c.code.toLowerCase()}.vn`,
          createdAt: c.createdAt ? c.createdAt.split("T")[0] : "2026-07-01",
          status: c.isActive ? "ACTIVE" : "INACTIVE"
        }));
        setTenants(formatted);
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách doanh nghiệp:", err);
      }
    };
    fetchCompanies();
  }, []);

  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFullname, setAdminFullname] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("TRIAL");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tính toán số liệu thống kê cho Dashboard
  const totalTenants = tenants.length;
  const mrrTotal = tenants.reduce((acc, t) => {
    if (t.plan === "ENTERPRISE") return acc + 25000000;
    if (t.plan === "STANDARD") return acc + 12000000;
    return acc + 0; // TRIAL
  }, 0);

  const entCount = tenants.filter(t => t.plan === "ENTERPRISE").length;
  const stdCount = tenants.filter(t => t.plan === "STANDARD").length;
  const trlCount = tenants.filter(t => t.plan === "TRIAL").length;

  const entPct = totalTenants > 0 ? (entCount / totalTenants) * 100 : 0;
  const stdPct = totalTenants > 0 ? (stdCount / totalTenants) * 100 : 0;
  const trlPct = totalTenants > 0 ? (trlCount / totalTenants) * 100 : 0;

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate inputs programmatically
    const errors: Record<string, string> = {};
    if (!companyName.trim()) {
      errors.companyName = "Tên doanh nghiệp không được để trống";
    }
    if (!companyCode.trim()) {
      errors.companyCode = "Mã doanh nghiệp không được để trống";
    } else if (companyCode.trim().length > 50) {
      errors.companyCode = "Mã doanh nghiệp không được quá 50 ký tự";
    }
    if (!adminEmail.trim()) {
      errors.adminEmail = "Email quản trị viên không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      errors.adminEmail = "Email không hợp lệ (ví dụ: admin@abc.com)";
    }
    if (!adminFullname.trim()) {
      errors.adminFullname = "Họ tên quản trị viên không được để trống";
    }
    if (!adminPassword) {
      errors.adminPassword = "Mật khẩu không được để trống";
    } else {
      if (adminPassword.length < 6) {
        errors.adminPassword = "Mật khẩu phải có độ dài tối thiểu 6 ký tự";
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#/]).{6,}$/.test(adminPassword)) {
        errors.adminPassword = "Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt (@$!%*?&._-#/)";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);

    try {
      const response = await registerCompanyApi({
        companyName: companyName.trim(),
        companyCode: companyCode.trim().toUpperCase(),
        adminEmail: adminEmail.trim(),
        adminFullname: adminFullname.trim(),
        adminPassword: adminPassword,
      });

      const newCompany = response.data;
      
      // Thêm mới vào danh sách hiển thị
      const newTenant = {
        id: `tenant-${newCompany.id || Date.now()}`,
        name: newCompany.name,
        industry: "Lĩnh vực mới đăng ký",
        subdomain: `${newCompany.code.toLowerCase()}.saas-erp.vn`,
        logo: newCompany.code.substring(0, 2),
        taxCode: "Chưa cập nhật",
        plan: selectedPlan,
        adminName: adminFullname.trim(),
        adminEmail: adminEmail.trim(),
        createdAt: new Date().toISOString().split('T')[0],
        status: "ACTIVE"
      };

      setTenants((prev) => [newTenant, ...prev]);
      setSuccess(`Đăng ký thành công doanh nghiệp "${newCompany.name}" và khởi tạo hệ thống!`);
      
      // Reset form
      setCompanyName("");
      setCompanyCode("");
      setAdminEmail("");
      setAdminFullname("");
      setAdminPassword("");
      setValidationErrors({});
      
      // Đóng modal sau 1.5 giây
      setTimeout(() => {
        setShowRegisterModal(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Đăng ký doanh nghiệp thất bại. Vui lòng kiểm tra lại kết nối hoặc dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative overflow-hidden p-1 font-sans text-xs" id="sys-admin-workspace-view">
      {/* Background Bubble Highlights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-100/20 rounded-full blur-3xl -z-10" />

      {/* Upper Title Segment & Trigger Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="text-left">
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
            <div className="w-9 h-9 rounded-full bg-slate-teal/5 flex items-center justify-center mr-3 shadow-xs">
              <Shield className="w-5 h-5 text-slate-teal" />
            </div>
            Hệ thống Tổng cục SaaS Control Panel
          </h1>
          <p className="text-[11px] text-slate-400 mt-1 pl-12 leading-relaxed">
            Giám sát thời gian thực tài nguyên máy chủ, quản lý cơ sở hạ tầng các Tenant doanh nghiệp sử dụng dịch vụ.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setSuccess(null);
            setValidationErrors({});
            setShowRegisterModal(true);
          }}
          className="bg-slate-teal hover:bg-slate-teal-hover text-white px-5 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer bubble-btn self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Đăng ký doanh nghiệp mới</span>
        </button>
      </div>

      {/* TOP ROW: KPIs Statistics & Plan Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: KPIs Dashboard - 7 columns */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bubble-card p-5 relative overflow-hidden flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Building className="w-5.5 h-5.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Doanh nghiệp kích hoạt</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{totalTenants}</span>
            </div>
          </div>

          <div className="bubble-card p-5 relative overflow-hidden flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5.5 h-5.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ước tính doanh thu (MRR)</span>
              <span className="text-xl font-black text-slate-800 mt-1 block">{mrrTotal.toLocaleString()} đ</span>
            </div>
          </div>

          <div className="bubble-card p-5 relative overflow-hidden flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Activity className="w-5.5 h-5.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Độ ổn định máy chủ SLA</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">99.99%</span>
            </div>
          </div>

          <div className="bubble-card p-5 relative overflow-hidden flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Cpu className="w-5.5 h-5.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">API Load Gateway</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">152 req/s</span>
            </div>
          </div>
        </div>

        {/* Right: Traffic & Subscription Plan Distribution Chart - 5 columns */}
        <div className="lg:col-span-5 bubble-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 flex items-center">
              <TrendingUp className="w-4 h-4 text-slate-teal mr-2" />
              Thống kê lưu lượng phân bổ gói cước
            </span>
          </div>

          <div className="flex flex-row items-center justify-around gap-4 pt-4">
            {/* SVG Donut Graphic */}
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                {totalTenants === 0 ? (
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="4.5" />
                ) : (
                  <>
                    {/* enterprise plan */}
                    {entPct > 0 && (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(221, 83%, 24%)" strokeWidth="4.5" strokeDasharray={`${entPct} ${100 - entPct}`} strokeDashoffset="0" />
                    )}
                    {/* standard plan */}
                    {stdPct > 0 && (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(38, 92%, 50%)" strokeWidth="4.5" strokeDasharray={`${stdPct} ${100 - stdPct}`} strokeDashoffset={`-${entPct}`} />
                    )}
                    {/* trial plan */}
                    {trlPct > 0 && (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(145, 55%, 43%)" strokeWidth="4.5" strokeDasharray={`${trlPct} ${100 - trlPct}`} strokeDashoffset={`-${entPct + stdPct}`} />
                    )}
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-800 leading-none">{totalTenants}</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase mt-1">Tenant</span>
              </div>
            </div>

            {/* Legend with bubble dots */}
            <div className="space-y-2 text-[10px] text-left">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-teal" />
                <span className="font-medium text-slate-600">Enterprise: <strong>{tenants.filter(t => t.plan === "ENTERPRISE").length} DN</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-medium text-slate-600">Standard: <strong>{tenants.filter(t => t.plan === "STANDARD").length} DN</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-600">Trial: <strong>{tenants.filter(t => t.plan === "TRIAL").length} DN</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: Bảng chi tiết danh sách doanh nghiệp sử dụng dịch vụ */}
      <div className="bubble-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <span className="text-xs font-bold text-slate-700 flex items-center">
            <Building className="w-4.5 h-4.5 text-slate-teal mr-2" />
            Bảng theo dõi và quản lý Tenant Doanh nghiệp
          </span>
          <span className="text-[10px] text-slate-400 font-bold">Tổng số: {totalTenants} đối tác</span>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pl-4">Doanh nghiệp</th>
                <th className="pb-3">Subdomain &amp; Mã</th>
                <th className="pb-3">Gói cước</th>
                <th className="pb-3">Quản trị viên (Admin)</th>
                <th className="pb-3">Ngày khởi tạo</th>
                <th className="pb-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="py-3.5 pl-4 flex items-center space-x-3">
                    <img 
                      src={getCompanyLogoUrl(tenant.logo)}
                      alt={tenant.name}
                      className="w-9 h-9 rounded-xl object-cover shadow-xs border border-slate-100 shrink-0 select-none"
                    />
                    <div className="text-left">
                      <button
                        onClick={() => onViewTenantDetail(tenant)}
                        className="font-bold text-slate-800 hover:text-slate-teal hover:underline transition-colors block text-left cursor-pointer"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {tenant.name}
                      </button>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{tenant.industry}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center space-x-1 text-slate-600">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{tenant.subdomain}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1 block">CODE: {tenant.logo}</span>
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      tenant.plan === "ENTERPRISE" 
                        ? "bg-purple-50 text-purple-600 border-purple-100" 
                        : tenant.plan === "STANDARD" 
                          ? "bg-blue-50 text-blue-600 border-blue-100" 
                          : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}>
                      {tenant.plan || "TRIAL"}
                    </span>
                  </td>
                  <td className="py-3.5 text-left">
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold">{tenant.adminName || "Chưa thiết lập"}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block font-medium">{tenant.adminEmail || "Chưa thiết lập"}</span>
                  </td>
                  <td className="py-3.5 text-slate-500 font-medium">
                    {tenant.createdAt}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold uppercase tracking-wider text-[9px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Hoạt động</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: Đăng ký doanh nghiệp mới */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" 
            id="register-company-modal"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }}
              exit={{ scale: 0.95, opacity: 0, y: 15, transition: { duration: 0.15 } }}
              className="w-full max-w-lg p-7 space-y-6 relative border border-slate-200/80 shadow-2xl rounded-3xl"
              style={{ background: "#ffffff", boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)" }}
            >
              {/* Close Button X */}
              <button
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2.5 text-slate-800 pb-3.5 border-b border-slate-100" style={{ fontFamily: "'Roboto', sans-serif" }}>
                <Plus className="w-5 h-5 text-slate-teal" />
                <span className="text-sm font-black text-slate-900 tracking-tight">Đăng ký Doanh nghiệp &amp; Cấp tài khoản quản trị mới</span>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleRegisterCompany} className="space-y-4 text-xs text-left" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Tên Doanh Nghiệp / Công Ty <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ví dụ: Tập đoàn May mặc Hải Phòng"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          if (validationErrors.companyName) {
                            setValidationErrors(prev => ({ ...prev, companyName: "" }));
                          }
                        }}
                        className={`w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 placeholder-slate-400 border rounded-xl focus:outline-none transition-all duration-150 font-medium ${
                          validationErrors.companyName
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                            : "border-slate-300 focus:border-slate-teal focus:ring-1 focus:ring-slate-teal/30"
                        }`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      />
                    </div>
                    {validationErrors.companyName && (
                      <p className="text-[10px] text-red-500 font-medium mt-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-150" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {validationErrors.companyName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Mã Doanh Nghiệp (Viết tắt) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: HAIPHONG, DONGTAM"
                      value={companyCode}
                      onChange={(e) => {
                        setCompanyCode(e.target.value);
                        if (validationErrors.companyCode) {
                          setValidationErrors(prev => ({ ...prev, companyCode: "" }));
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white text-slate-800 placeholder-slate-400 border rounded-xl focus:outline-none transition-all duration-150 uppercase font-bold ${
                        validationErrors.companyCode
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                          : "border-slate-300 focus:border-slate-teal focus:ring-1 focus:ring-slate-teal/30"
                      }`}
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                    {validationErrors.companyCode && (
                      <p className="text-[10px] text-red-500 font-medium mt-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-150" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {validationErrors.companyCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Gói dịch vụ đăng ký <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white text-slate-800 border border-slate-300 rounded-xl focus:outline-none focus:border-slate-teal focus:ring-1 focus:ring-slate-teal/30 font-medium cursor-pointer"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <option value="TRIAL">TRIAL - Dùng thử miễn phí</option>
                      <option value="STANDARD">STANDARD - Tiêu chuẩn doanh nghiệp</option>
                      <option value="ENTERPRISE">ENTERPRISE - Cao cấp trọn gói</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Mật khẩu tài khoản <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Độ dài tối thiểu 6 ký tự"
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          if (validationErrors.adminPassword) {
                            setValidationErrors(prev => ({ ...prev, adminPassword: "" }));
                          }
                        }}
                        className={`w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 placeholder-slate-400 border rounded-xl focus:outline-none transition-all duration-150 font-medium ${
                          validationErrors.adminPassword
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                            : "border-slate-300 focus:border-slate-teal focus:ring-1 focus:ring-slate-teal/30"
                        }`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      />
                    </div>
                    {validationErrors.adminPassword && (
                      <p className="text-[10px] text-red-500 font-medium mt-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-150" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {validationErrors.adminPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Tài khoản Admin quản trị của Doanh nghiệp
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                        Họ và Tên Admin <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Ví dụ: Nguyễn Văn Hải"
                          value={adminFullname}
                          onChange={(e) => {
                            setAdminFullname(e.target.value);
                            if (validationErrors.adminFullname) {
                              setValidationErrors(prev => ({ ...prev, adminFullname: "" }));
                            }
                          }}
                          className={`w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 placeholder-slate-400 border rounded-xl focus:outline-none transition-all duration-150 font-medium ${
                            validationErrors.adminFullname
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                              : "border-slate-300 focus:border-slate-teal focus:ring-1 focus:ring-slate-teal/30"
                          }`}
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        />
                      </div>
                      {validationErrors.adminFullname && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-150" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {validationErrors.adminFullname}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                        Email quản trị viên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          placeholder="admin@haiphong.com"
                          value={adminEmail}
                          onChange={(e) => {
                            setAdminEmail(e.target.value);
                            if (validationErrors.adminEmail) {
                              setValidationErrors(prev => ({ ...prev, adminEmail: "" }));
                            }
                          }}
                          className={`w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 placeholder-slate-400 border rounded-xl focus:outline-none transition-all duration-150 font-medium ${
                            validationErrors.adminEmail
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                              : "border-slate-300 focus:border-slate-teal focus:ring-1 focus:ring-slate-teal/30"
                          }`}
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        />
                      </div>
                      {validationErrors.adminEmail && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-150" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {validationErrors.adminEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-slate-teal hover:bg-slate-teal-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer bubble-btn"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Tạo doanh nghiệp</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
