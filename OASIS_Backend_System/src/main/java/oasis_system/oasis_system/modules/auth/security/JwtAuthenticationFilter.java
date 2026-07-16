package oasis_system.oasis_system.modules.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.service.TokenBlacklistService;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Lớp JwtAuthenticationFilter kế thừa OncePerRequestFilter để đảm bảo bộ lọc này 
 * chỉ được thực thi một lần duy nhất cho mỗi yêu cầu HTTP (Request).
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. OncePerRequestFilter (Java Web Service & Spring Boot): Bộ lọc Servlet Filter của Spring MVC.
 * 2. HTTP Authorization Header: Đọc mã Bearer Token từ tiêu đề Authorization của HTTP Request.
 * 3. SecurityContextHolder: Cập nhật thông tin đăng nhập thành công vào context bảo mật toàn hệ thống.
 * 4. Tenant Isolation Cleanup (Security Best Practice):
 *    Sử dụng khối lệnh try-finally để đảm bảo sau khi hoàn thành xử lý request, 
 *    thông tin companyId trong TenantContext (ThreadLocal) PHẢI được giải phóng hoàn toàn, 
 *    tránh xung đột dữ liệu giữa các doanh nghiệp khi Thread được tái sử dụng trong ThreadPool.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 1. Kiểm tra tiêu đề Authorization có chứa Bearer Token không
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Không có token -> Cho phép request đi tiếp qua các filter tiếp theo (Spring Security sẽ xử lý phân quyền sau đó)
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7); // Trích xuất token JWT (bỏ chuỗi "Bearer ")

        // Kiểm tra xem token đã bị thu hồi trong danh sách đen (đăng xuất) hay chưa
        if (tokenBlacklistService.isTokenBlacklisted(jwt)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            try {
                // 2. Giải mã token trích xuất email người dùng (Username)
                userEmail = jwtService.extractUsername(jwt);
            } catch (io.jsonwebtoken.ExpiredJwtException | io.jsonwebtoken.security.SignatureException | io.jsonwebtoken.MalformedJwtException e) {
                // Token lỗi/hết hạn -> Cho qua filter để xử lý như request nặc danh (Spring Security sẽ chặn 401 ở phân quyền sau đó)
                filterChain.doFilter(request, response);
                return;
            }

            // 3. Nếu trích xuất được email và tài khoản chưa được xác thực trong phiên làm việc này
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // Nạp thông tin chi tiết tài khoản từ CSDL (bao gồm cả phân quyền và các mã ID)
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                // 4. Kiểm tra tính hợp lệ của token (so sánh email trùng khớp và thời hạn hết hạn)
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    
                    // Thiết lập mã Doanh nghiệp vào TenantContext của luồng xử lý này
                    Long companyId = jwtService.extractCompanyId(jwt);
                    TenantContext.setCurrentTenant(companyId);

                    // Re-assert hoặc cập nhật activeRoleId và activeDepartmentId nếu có trong token vào UserDetails
                    if (userDetails instanceof CustomUserDetails customUserDetails) {
                        // Tạo đối tượng xác thực đại diện cho người dùng
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                customUserDetails,
                                null,
                                customUserDetails.getAuthorities()
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        
                        // Đặt đối tượng xác thực vào Security Context của Spring Security
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
            
            // Cho phép request tiếp tục đi tới Controller xử lý nghiệp vụ chính
            filterChain.doFilter(request, response);
            
        } finally {
            // 5. Giải phóng TenantContext để ngăn ngừa rò rỉ bộ nhớ hoặc trộn lẫn dữ liệu giữa các Client (Memory Leak / Cross-Tenant Pollution)
            TenantContext.clear();
        }
    }
}
