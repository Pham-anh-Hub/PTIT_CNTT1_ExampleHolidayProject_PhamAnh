import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getDefaultRouteForRole } from "./routeConfig";

interface RequireRoleProps {
  /** Danh sách các role được phép truy cập route này */
  allowedRoles: string[];
}

/**
 * RequireRole — Kiểm tra quyền truy cập theo vai trò.
 * Nếu role không hợp lệ → redirect về trang mặc định của vai trò đó.
 */
export default function RequireRole({ allowedRoles }: RequireRoleProps) {
  const auth = useContext(AuthContext);
  const currentRole = auth?.currentUser?.role?.toUpperCase() ?? "";

  const hasAccess = allowedRoles.some((allowed) => {
    const a = allowed.toUpperCase();
    return (
      currentRole === a ||
      currentRole.includes(a) ||
      a.includes(currentRole)
    );
  });

  if (!hasAccess) {
    const defaultRoute = getDefaultRouteForRole(currentRole);
    return <Navigate to={defaultRoute} replace />;
  }

  return <Outlet />;
}
