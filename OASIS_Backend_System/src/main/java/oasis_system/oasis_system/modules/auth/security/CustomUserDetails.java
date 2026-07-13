package oasis_system.oasis_system.modules.auth.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

/**
 * Lớp CustomUserDetails hiện thực (implement) interface UserDetails của Spring Security.
 * Lớp này hoạt động như một Wrapper chứa thông tin người dùng được trích xuất từ database
 * và cung cấp cho Spring Security quản lý quyền truy cập.
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. Interface implementation: Kế thừa UserDetails để tùy biến thêm các thuộc tính nghiệp vụ.
 * 2. Multi-tenant context extension: Bổ sung userId, companyId, activeRoleId và activeDepartmentId 
 *    vào luồng bảo mật của Spring Security, giúp dễ dàng truy cập thông qua SecurityContextHolder.
 */
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final Long companyId;
    private final String email;
    private final String password;
    private final Long activeRoleId;
    private final Long activeDepartmentId;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(Long userId, Long companyId, String email, String password, 
                             Long activeRoleId, Long activeDepartmentId, 
                             Collection<? extends GrantedAuthority> authorities) {
        this.userId = userId;
        this.companyId = companyId;
        this.email = email;
        this.password = password;
        this.activeRoleId = activeRoleId;
        this.activeDepartmentId = activeDepartmentId;
        this.authorities = authorities;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public Long getActiveRoleId() {
        return activeRoleId;
    }

    public Long getActiveDepartmentId() {
        return activeDepartmentId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email; // Trong hệ thống này dùng Email làm tài khoản đăng nhập (Username)
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // Thiết lập mặc định tài khoản không bị hết hạn
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // Thiết lập mặc định tài khoản không bị khóa
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Thiết lập mặc định mật khẩu không bị hết hạn
    }

    @Override
    public boolean isEnabled() {
        return true; // Trạng thái kích hoạt tài khoản
    }
}
