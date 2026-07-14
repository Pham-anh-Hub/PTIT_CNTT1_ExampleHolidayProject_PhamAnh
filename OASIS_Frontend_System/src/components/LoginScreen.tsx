import { useState } from "react";
import { motion } from "motion/react";
import { Shield, LogIn, Lock, Mail, Building, Eye, EyeOff, Info, Layers } from "lucide-react";
import { User as UserType } from "../types";
import { loginApi, selectContextApi } from "../api";

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

export const DEMO_USERS: UserType[] = [
  {
    id: "user-sysadmin",
    username: "sysadmin@oasis.com",
    fullname: "Oasis System Admin",
    role: "SUPER_ADMIN",
    email: "sysadmin@oasis.com",
    tenantId: "tenant-system",
  }
];

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingContexts, setPendingContexts] = useState<any[] | null>(null);

  // Inline Validation States
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    if (!val.trim()) {
      return "Email không được để trống";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return "Email không đúng định dạng (Ví dụ: name@company.vn)";
    }
    return null;
  };

  const validatePassword = (val: string) => {
    if (!val.trim()) {
      return "Mật khẩu không được để trống";
    }
    if (val.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    return null;
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) {
      setEmailError(validateEmail(val));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (passwordError) {
      setPasswordError(validatePassword(val));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    if (eErr || pErr) {
      setEmailError(eErr);
      setPasswordError(pErr);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Gọi API đăng nhập backend
      const response = await loginApi(email, password);

      if (response.data.requireContextSelection) {
        // Cần chọn ngữ cảnh
        setPendingContexts(response.data.contexts);
      } else {
        // Đăng nhập thành công trực tiếp (chỉ có 1 ngữ cảnh hoặc là Super Admin)
        const token = response.data.accessToken;
        const info = response.data.userInfo;
        const activeContext = response.data.activeContext;

        localStorage.setItem("saas_token", token);

        // Tạo đối tượng User cho Frontend
        const frontendUser: UserType = {
          id: info.id.toString(),
          username: info.email,
          fullname: info.fullname,
          role: activeContext ? activeContext.roleName : "SUPER_ADMIN",
          email: info.email,
          tenantId: activeContext && activeContext.roleId ? `tenant-${activeContext.roleId}` : "tenant-system",
          avatar: info.fullname.split(" ").pop()?.charAt(0) || "U"
        };

        onLoginSuccess(frontendUser);
      }
    } catch (apiErr: any) {
      console.error("Lỗi đăng nhập:", apiErr);
      if (apiErr.message === "Failed to fetch") {
        setError("Không thể kết nối máy chủ. Vui lòng kiểm tra lại đường truyền mạng hoặc thử lại sau.");
      } else {
        setError(apiErr.message || "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch overflow-hidden font-sans">
      {/* LEFT SIDE: Corporate Business Context & OASIS Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 relative items-start justify-between p-16 flex-col overflow-hidden select-none border-r border-slate-100">
        {/* Modern bright and pleasant premium glass-and-wood enterprise boardroom background */}
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80"
          alt="OASIS Enterprise Systems"
          className="absolute inset-0 w-full h-full object-cover opacity-55 scale-100 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        {/* Soft elegant bright gradients to secure perfect contrast with dark slate text */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-teal-light/25 via-transparent to-transparent" />

        {/* Top: Branding logo and name pushed far to the top-left */}
        <div className="relative z-10 flex items-center space-x-3.5 self-start">
          <div className="w-11 h-11 rounded-xl bg-slate-teal flex items-center justify-center text-white font-display font-black text-lg shadow-md border border-white/10">
            O
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black text-slate-800 tracking-tight font-display">OASIS</h1>
            <p className="text-[9px] text-slate-teal font-bold uppercase tracking-widest leading-none mt-0.5">Enterprise SaaS Platform</p>
          </div>
        </div>

        {/* Middle: Key message, text weight is normal (not bold), using Poppins font-display */}
        <div className="relative z-10 space-y-4 max-w-lg text-left self-start my-auto">
          <h2 className="text-3xl sm:text-4xl font-normal text-slate-800 leading-tight font-display">
            Hệ thống Quản trị doanh nghiệp toàn diện
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Số hóa liên thông, tự động minh bạch, bảo mật tuyệt đối, bứt tốc quyết định.
          </p>
        </div>

        {/* Bottom: Sub-system indicators in elegant matching text */}
        <div className="relative z-10 w-full grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-left self-start">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-teal" /> Doanh nghiệp độc lập
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal">Mỗi khách hàng sở hữu môi trường dữ liệu và cơ cấu phân quyền riêng biệt.</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-teal" /> Khả năng mở rộng
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal">Dễ dàng cấu hình và mở rộng thêm module sản xuất, kinh doanh theo quy mô.</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Dedicated Clean Corporate Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white relative">
        {/* Mobile top branding */}
        <div className="absolute top-10 left-10 lg:hidden flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-teal flex items-center justify-center text-white font-display font-black text-base shadow-md">
            O
          </div>
          <span className="font-display font-black text-base text-slate-800 tracking-tight">OASIS</span>
        </div>

        <div className="w-full max-w-md space-y-8">
          {pendingContexts ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 font-display">Chọn ngữ cảnh làm việc</h3>
                <p className="text-xs text-slate-400">
                  Tài khoản <strong className="text-slate-700">{email}</strong> của bạn kiêm nhiệm nhiều vai trò hoạt động. Vui lòng chọn một ngữ cảnh:
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-xs font-semibold text-red-600 rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {pendingContexts.map((context, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      setIsLoading(true);
                      setError(null);
                      try {
                        const response = await selectContextApi(email, context.roleId, context.departmentId);
                        const token = response.data.accessToken;
                        const info = response.data.userInfo;
                        const active = response.data.activeContext;

                        localStorage.setItem("saas_token", token);

                        const frontendUser: UserType = {
                          id: info.id.toString(),
                          username: info.email,
                          fullname: info.fullname,
                          role: active ? active.roleName : "SUPER_ADMIN",
                          email: info.email,
                          tenantId: active && active.roleId ? `tenant-${active.roleId}` : "tenant-system",
                          avatar: info.fullname.split(" ").pop()?.charAt(0) || "U"
                        };

                        onLoginSuccess(frontendUser);
                      } catch (err: any) {
                        setError(err.message || "Lựa chọn ngữ cảnh thất bại");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-slate-teal hover:bg-slate-teal-light/20 bg-slate-50 transition-all duration-200 flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-slate-teal">{context.roleName}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{context.departmentName || "Không thuộc phòng ban"}</div>
                    </div>
                    <Layers className="w-4 h-4 text-slate-300 group-hover:text-slate-teal shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setPendingContexts(null);
                  setError(null);
                }}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-2"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 font-display">Đăng nhập tài khoản</h3>
                <p className="text-xs text-slate-400">
                  Vui lòng sử dụng tài khoản được cấp bởi doanh nghiệp của bạn để truy cập hệ thống.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 leading-relaxed"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500" htmlFor="email-input">Email hệ thống</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="email-input"
                      type="email"
                      placeholder="name@company.vn"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`w-full bg-slate-50 hover:bg-slate-100/30 focus:bg-white text-xs font-medium pl-11 pr-4 py-3.5 rounded-2xl border outline-none transition-all duration-200 ${emailError
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10"
                          : "border-slate-200/80 focus:border-slate-teal"
                        }`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150" id="email-error-msg">
                      <span>•</span> {emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500" htmlFor="password-input">Mật khẩu</label>
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); setError("Mật khẩu dùng thử hệ thống mặc định là: 123456"); }} className="text-[11px] font-bold text-slate-teal hover:underline">Quên mật khẩu?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`w-full bg-slate-50 hover:bg-slate-100/30 focus:bg-white text-xs font-medium pl-11 pr-11 py-3.5 rounded-2xl border outline-none transition-all duration-200 ${passwordError
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10"
                          : "border-slate-200/80 focus:border-slate-teal"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150" id="password-error-msg">
                      <span>•</span> {passwordError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-teal hover:bg-slate-teal-hover text-white py-3.5 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Đăng nhập hệ thống</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
