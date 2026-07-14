import { useState, useEffect } from "react";
import { ArrowLeft, Building, User, Mail, Phone, MapPin, Calendar, CreditCard, Users, Layers, Shield, Activity, Landmark, ShieldAlert, CheckCircle2, AlertCircle, UserCheck, Globe, X, Edit3, ChevronDown } from "lucide-react";
import { getCompanyDetailApi, updateCompanyApi, updateCompanyStatusApi } from "../api";

interface TenantDetailScreenProps {
  tenant: {
    id: string;
    name: string;
    code: string;
    industry: string;
    subdomain: string;
    logo: string;
    taxCode: string;
    plan: string;
    adminName: string;
    adminEmail: string;
    createdAt: string;
    status: string;
  };
  onBack: () => void;
}

export default function TenantDetailScreen({
  tenant,
  onBack
}: TenantDetailScreenProps) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States cho Form chỉnh sửa thông tin
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPlan, setEditPlan] = useState("TRIAL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // States cho Form xác nhận khóa/mở khóa
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDetail = async () => {
    if (!tenant || !tenant.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getCompanyDetailApi(tenant.id);
      setDetail(res.data);
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết doanh nghiệp từ Backend:", err);
      setError(err.message || "Không thể tải thông tin chi tiết từ hệ thống máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [tenant]);

  // Đồng bộ hóa dữ liệu hiển thị (ưu tiên dữ liệu chi tiết từ API)
  const displayTenant = detail || tenant;
  const logoText = displayTenant.name 
    ? displayTenant.name.split(" ").map((w: string) => w[0]).join("").substring(0, 3).toUpperCase() 
    : (tenant.logo || "CO");
  const formattedSubdomain = displayTenant.code 
    ? `${displayTenant.code.toLowerCase()}.saas-erp.vn` 
    : (tenant.subdomain || "");
  const plan = displayTenant.subscriptionPlan || tenant.plan || "TRIAL";
  const isActiveStatus = typeof displayTenant.isActive === "boolean" 
    ? displayTenant.isActive 
    : (tenant.status === "ACTIVE");

  const adminName = detail?.adminInfo?.fullname || tenant.adminName || "Hệ thống cấp";
  const adminEmail = detail?.adminInfo?.email || tenant.adminEmail || `admin@${(displayTenant.code || "company").toLowerCase()}.vn`;
  const formattedDate = displayTenant.createdAt 
    ? displayTenant.createdAt.toString().split("T")[0] 
    : (tenant.createdAt || "2026-07-01");

  // Các số liệu thống kê thực tế từ Backend
  const stats = detail?.stats || {
    totalEmployees: tenant.code === "GV" ? 8 : 0,
    totalDepartments: 5,
    totalOrders: tenant.code === "GV" ? 3 : 0
  };

  // Mở Popup chỉnh sửa và điền sẵn thông tin hiện tại
  const handleOpenEditModal = () => {
    setEditName(displayTenant.name || "");
    setEditAddress(displayTenant.address || "");
    setEditPhone(displayTenant.phone || "");
    setEditEmail(displayTenant.email || "");
    setEditPlan(plan);
    setEditErrors({});
    setShowEditModal(true);
  };

  // Xử lý gửi Form cập nhật thông tin lên Backend
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!editName.trim()) {
      errors.name = "Tên doanh nghiệp không được để trống";
    }
    if (editEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      errors.email = "Email không hợp lệ (ví dụ: contact@abc.com)";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setIsUpdating(true);
      await updateCompanyApi(tenant.id, {
        name: editName.trim(),
        address: editAddress.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        subscriptionPlan: editPlan
      });
      setShowEditModal(false);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || "Cập nhật thông tin thất bại. Vui lòng thử lại.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Xử lý gửi cập nhật Trạng thái (Khóa/Mở khóa) lên Backend
  const handleToggleStatus = async () => {
    try {
      setIsUpdatingStatus(true);
      await updateCompanyStatusApi(tenant.id, !isActiveStatus);
      setShowStatusConfirmModal(false);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || "Thay đổi trạng thái thất bại. Vui lòng thử lại.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Hàm hiển thị định dạng gói dịch vụ
  const getPlanBadge = (planName: string) => {
    const p = planName.toUpperCase();
    if (p === "ENTERPRISE") {
      return (
        <span 
          className="px-4 py-1.5 rounded-full bg-blue-950 text-white text-xs font-extrabold tracking-wider uppercase shadow-sm"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          ENTERPRISE - Cao cấp
        </span>
      );
    }
    if (p === "STANDARD") {
      return (
        <span 
          className="px-4 py-1.5 rounded-full bg-slate-500 text-white text-xs font-extrabold tracking-wider uppercase shadow-sm"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          STANDARD - Tiêu chuẩn
        </span>
      );
    }
    return (
      <span 
        className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-extrabold tracking-wider uppercase shadow-xs"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        TRIAL - Dùng thử
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative overflow-hidden p-1 pb-12" id="tenant-detail-view">
      {/* Background Bubble Highlights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-950/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-slate-teal/5 rounded-full blur-3xl -z-10" />

      {/* Upper Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-4 text-left">
          {/* Back button with large icon, no background */}
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-600 hover:text-blue-950 transition-all cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          
          <div>
            <h1 
              className="text-2xl font-black text-slate-800 tracking-tight flex items-center"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Hồ sơ chi tiết Đối tác
            </h1>
            <p 
              className="text-[13px] text-slate-400 font-medium mt-1 leading-none"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Xem chi tiết hồ sơ thành viên, thông tin giám đốc và cấu hình dịch vụ.
            </p>
          </div>
        </div>

        {/* Plan status indicator */}
        <div className="flex items-center space-x-3 self-start sm:self-center">
          {getPlanBadge(plan)}
          <span 
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow-xs ${
              isActiveStatus 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <span className={`w-2 h-2 rounded-full ${isActiveStatus ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
            {isActiveStatus ? "Hoạt động" : "Tạm khóa"}
          </span>
        </div>
      </div>

      {loading && !detail && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-950 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-bold animate-pulse" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Đang tải dữ liệu vận hành từ máy chủ...
          </p>
        </div>
      )}

      {error && !detail && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-left flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-800" style={{ fontFamily: "'Poppins', sans-serif" }}>Lỗi nạp dữ liệu</h4>
            <p className="text-[11px] text-rose-600 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{error}</p>
          </div>
        </div>
      )}

      {/* Grid Panels layout */}
      {(!loading || detail) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          
          {/* LEFT COLUMN: Corporate & Owner Profile */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Card 1: Doanh nghiệp Profile (Bubble Card) */}
            <div 
              className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[32px] p-8 shadow-md relative overflow-hidden"
              id="tenant-profile-card"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-950/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start space-x-5 text-left border-b border-slate-50 pb-6 mb-6">
                <div 
                  className="w-16 h-16 rounded-[22px] bg-blue-950 text-white font-extrabold text-2xl flex items-center justify-center shadow-md select-none shrink-0"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {logoText}
                </div>
                <div>
                  <h2 
                    className="text-xl font-extrabold text-slate-800 leading-tight"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {displayTenant.name}
                  </h2>
                  <div 
                    className="flex items-center space-x-2 text-slate-400 font-semibold text-xs mt-1.5"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span>{formattedSubdomain}</span>
                  </div>
                </div>
              </div>

              {/* Corporate Info Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start space-x-4">
                  <Building className="w-6 h-6 text-blue-950 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Mã doanh nghiệp</div>
                    <div className="text-sm font-extrabold text-slate-700 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{displayTenant.code}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Landmark className="w-6 h-6 text-blue-950 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Mã số thuế</div>
                    <div className="text-sm font-extrabold text-slate-700 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{displayTenant.taxCode || "Chính thức"}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-blue-950 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Số điện thoại</div>
                    <div className="text-sm font-extrabold text-slate-700 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{displayTenant.phone || "Chưa cập nhật"}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-blue-950 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Email liên hệ</div>
                    <div className="text-sm font-extrabold text-slate-700 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{displayTenant.email || "Chưa cập nhật"}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 md:col-span-2">
                  <MapPin className="w-6 h-6 text-blue-950 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Địa chỉ văn phòng</div>
                    <div className="text-sm font-extrabold text-slate-700 mt-0.5 leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>{displayTenant.address || "Chưa cập nhật"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Chủ doanh nghiệp / Giám đốc Profile (Bubble Card) */}
            <div 
              className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[32px] p-8 shadow-md text-left relative overflow-hidden"
              id="tenant-owner-card"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-teal/5 rounded-full blur-2xl pointer-events-none" />
              
              <h3 
                className="text-base font-black text-slate-800 flex items-center mb-6"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <User className="w-6 h-6 text-blue-950 mr-2.5 shrink-0" />
                Thông tin Chủ doanh nghiệp / Giám đốc
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <UserCheck className="w-6 h-6 text-blue-950 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Họ và tên Giám đốc</div>
                    <div className="text-sm font-extrabold text-slate-700 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{adminName}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-blue-950 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Email Quản trị viên</div>
                    <div className="text-sm font-extrabold text-slate-700 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{adminEmail}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Calendar className="w-6 h-6 text-blue-950 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Ngày đăng ký</div>
                    <div className="text-sm font-extrabold text-slate-700 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{formattedDate}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <ShieldAlert className="w-6 h-6 text-blue-950 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Quyền hạn mặc định</div>
                    <div className="text-sm font-extrabold text-slate-700 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>ADMIN_DN (Quản trị viên Doanh nghiệp)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SaaS Resource & Operational Stats */}
          <div className="space-y-8 text-left">
            
            {/* Card 3: Thống kê chỉ số (Bubble Card) */}
            <div 
              className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[32px] p-6 shadow-md relative overflow-hidden"
              id="tenant-stats-card"
            >
              <h3 
                className="text-base font-black text-slate-800 flex items-center mb-6"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Activity className="w-6 h-6 text-blue-950 mr-2.5 shrink-0" />
                Tài nguyên & Vận hành
              </h3>

              <div className="space-y-5">
                {/* Stat Item 1: Personnel */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all duration-200">
                  <div className="flex items-center space-x-3.5">
                    <Users className="w-6 h-6 text-blue-950 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Nhân sự công ty</div>
                      <div className="text-[10px] text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Đang quản lý trong HRM</div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-blue-950" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {stats.totalEmployees} <span className="text-xs font-bold text-slate-400">người</span>
                  </div>
                </div>

                {/* Stat Item 2: Departments */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all duration-200">
                  <div className="flex items-center space-x-3.5">
                    <Layers className="w-6 h-6 text-blue-950 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Phòng ban phân bổ</div>
                      <div className="text-[10px] text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Cơ cấu tổ chức phòng ban</div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-blue-950" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {stats.totalDepartments} <span className="text-xs font-bold text-slate-400">khoa</span>
                  </div>
                </div>

                {/* Stat Item 3: Orders */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all duration-200">
                  <div className="flex items-center space-x-3.5">
                    <CreditCard className="w-6 h-6 text-blue-950 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Đơn hàng bán ra</div>
                      <div className="text-[10px] text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Đơn hàng phát sinh trên hệ thống</div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-blue-950" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {stats.totalOrders} <span className="text-xs font-bold text-slate-400">yêu cầu</span>
                  </div>
                </div>

                {/* Stat Item 4: Storage */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all duration-200">
                  <div className="flex items-center space-x-3.5">
                    <Activity className="w-6 h-6 text-blue-950 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Dung lượng lưu trữ</div>
                      <div className="text-[10px] text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Hợp đồng & Tài liệu đã tải lên</div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-blue-950" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    0.0 <span className="text-xs font-bold text-slate-400">GB</span>
                  </div>
                </div>

                {/* Stat Item 5: Uptime */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all duration-200">
                  <div className="flex items-center space-x-3.5">
                    <CheckCircle2 className="w-6 h-6 text-blue-950 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Ổn định máy chủ</div>
                      <div className="text-[10px] text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Cam kết chất lượng SLA</div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-emerald-600" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    99.99%
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Management Panel */}
            <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[32px] p-6 shadow-md">
              <h3 
                className="text-base font-black text-slate-800 flex items-center mb-5"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Shield className="w-6 h-6 text-blue-950 mr-2.5 shrink-0" />
                Thao tác Nhanh
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setShowStatusConfirmModal(true)}
                  className="w-full py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {isActiveStatus ? "Tạm khóa doanh nghiệp" : "Kích hoạt doanh nghiệp"}
                </button>
                
                <button 
                  onClick={handleOpenEditModal}
                  className="w-full py-3 rounded-2xl bg-blue-950 hover:bg-blue-900 text-xs font-bold text-white shadow-md shadow-blue-950/15 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Chỉnh sửa thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: FORM POPUP CHỈNH SỬA DOANH NGHIỆP (Click Outside to Close) */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
            }
          }}
        >
          <div 
            className="bg-white/95 border border-slate-100 rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left cursor-default"
            id="company-edit-popup-form"
          >
            {/* Background Bubble highlights inside popup */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-950/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-slate-teal/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
              <h3 
                className="text-lg font-black text-slate-800 flex items-center gap-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Edit3 className="w-5.5 h-5.5 text-blue-950" />
                Chỉnh sửa Doanh nghiệp
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                  Tên doanh nghiệp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-white text-slate-800 border rounded-2xl focus:outline-none transition-all duration-150 font-medium ${
                    editErrors.name ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-950"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
                {editErrors.name && (
                  <p className="text-[10px] text-red-500 font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{editErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                  Địa chỉ văn phòng
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all duration-150 font-medium"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all duration-150 font-medium"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Email liên hệ
                  </label>
                  <input
                    type="text"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white text-slate-800 border rounded-2xl focus:outline-none transition-all duration-150 font-medium ${
                      editErrors.email ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-950"
                    }`}
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                  {editErrors.email && (
                    <p className="text-[10px] text-red-500 font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{editErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                  Gói cước dịch vụ
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all duration-150 font-medium text-left cursor-pointer flex items-center justify-between"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <span>
                      {editPlan === "TRIAL" && "TRIAL - Dùng thử miễn phí"}
                      {editPlan === "STANDARD" && "STANDARD - Gói Tiêu chuẩn"}
                      {editPlan === "ENTERPRISE" && "ENTERPRISE - Gói Cao cấp toàn diện"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isDropdownOpen && (
                    <>
                      {/* Lớp nền click outside để đóng dropdown */}
                      <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                      
                      <div 
                        className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 text-left"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditPlan("TRIAL");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-xs font-bold text-left cursor-pointer transition-colors block ${
                            editPlan === "TRIAL" ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          TRIAL - Dùng thử miễn phí
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditPlan("STANDARD");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-xs font-bold text-left cursor-pointer transition-colors block ${
                            editPlan === "STANDARD" ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          STANDARD - Gói Tiêu chuẩn
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditPlan("ENTERPRISE");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-xs font-bold text-left cursor-pointer transition-colors block ${
                            editPlan === "ENTERPRISE" ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          ENTERPRISE - Gói Cao cấp toàn diện
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-6 border-t border-slate-50 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold text-slate-500 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-950/15 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FORM XÁC NHẬN KHÓA / MỞ KHÓA TÀI KHOẢN (Click Outside to Close) */}
      {showStatusConfirmModal && (
        <div 
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStatusConfirmModal(false);
            }
          }}
        >
          <div 
            className="bg-white/95 border border-slate-100 rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-center cursor-default"
            id="status-confirm-popup"
          >
            {/* Background highlight */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-slate-teal/5 rounded-full blur-xl pointer-events-none" />
            
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Shield className="w-6 h-6 text-blue-950" />
            </div>

            {/* Content */}
            <h3 
              className="text-[15px] font-black text-slate-800 tracking-tight"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {isActiveStatus ? "Xác nhận Khóa đối tác?" : "Kích hoạt lại đối tác?"}
            </h3>
            <p 
              className="text-[11px] text-slate-400 mt-2.5 leading-relaxed"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {isActiveStatus 
                ? `Bạn có chắc chắn muốn tạm ngừng cung cấp dịch vụ cho doanh nghiệp ${displayTenant.name}? Các tài khoản người dùng trực thuộc sẽ bị ngắt kết nối.`
                : `Bạn có muốn khôi phục quyền truy cập và hoạt động bình thường cho doanh nghiệp ${displayTenant.name}?`}
            </p>

            {/* Actions */}
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowStatusConfirmModal(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold text-slate-500 transition-all cursor-pointer"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-950/15 transition-all cursor-pointer"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {isUpdatingStatus ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
