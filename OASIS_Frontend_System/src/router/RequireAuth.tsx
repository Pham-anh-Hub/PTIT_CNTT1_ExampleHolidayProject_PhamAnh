import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * RequireAuth — Bảo vệ mọi route yêu cầu đăng nhập.
 * Nếu chưa đăng nhập → redirect về /login, lưu lại URL hiện tại để sau khi
 * đăng nhập xong có thể redirect về đúng trang người dùng muốn vào.
 */
export default function RequireAuth() {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (!auth?.currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
