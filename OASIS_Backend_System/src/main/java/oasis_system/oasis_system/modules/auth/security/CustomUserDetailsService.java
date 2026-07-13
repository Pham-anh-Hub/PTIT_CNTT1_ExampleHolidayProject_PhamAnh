package oasis_system.oasis_system.modules.auth.security;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.modules.auth.entity.User;
import oasis_system.oasis_system.modules.auth.entity.UserRoleDepartment;
import oasis_system.oasis_system.modules.auth.repository.UserRepository;
import oasis_system.oasis_system.modules.auth.repository.UserRoleDepartmentRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp CustomUserDetailsService implement interface UserDetailsService của Spring Security.
 * Chịu trách nhiệm truy vấn thông tin tài khoản người dùng từ cơ sở dữ liệu dựa trên email đăng nhập,
 * thiết lập cơ cấu vai trò/phòng ban mặc định cho phiên làm việc ban đầu.
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. Spring Transaction (@Transactional): Đảm bảo các câu lệnh truy vấn Lazy loading của Hibernate
 *    chạy thành công trong cùng một giao dịch (Session), tránh lỗi LazyInitializationException.
 * 2. Java Stream API & Lambda: Dùng để duyệt danh sách vai trò kiêm nhiệm và ánh xạ sang định dạng 
 *    SimpleGrantedAuthority của Spring Security một cách ngắn gọn, hiệu quả.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleDepartmentRepository userRoleDepartmentRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. Kiểm tra tài khoản trong database
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Tài khoản với email: " + email + " không tồn tại."));

        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("Tài khoản hiện đã bị vô hiệu hóa.");
        }

        // 2. Tìm danh sách vai trò kiêm nhiệm tại các phòng ban của người dùng
        List<UserRoleDepartment> roleDepts = userRoleDepartmentRepository.findByUserId(user.getId());
        
        // Xác định vai trò & phòng ban mặc định cho phiên làm việc hiện tại
        UserRoleDepartment activeRoleDept = selectActiveRoleDepartment(roleDepts);

        // 3. Ánh xạ các vai trò sang GrantedAuthority
        // Chuẩn bảo mật Spring Security yêu cầu tên Authority nên bắt đầu bằng tiền tố "ROLE_"
        List<SimpleGrantedAuthority> authorities;
        if (roleDepts.isEmpty()) {
            authorities = Collections.emptyList();
        } else {
            authorities = roleDepts.stream()
                    .map(urd -> new SimpleGrantedAuthority("ROLE_" + urd.getRole().getName().toUpperCase()))
                    .distinct()
                    .collect(Collectors.toList());
        }

        // Trích xuất các ID cần thiết
        Long activeRoleId = (activeRoleDept != null) ? activeRoleDept.getRole().getId() : null;
        Long activeDeptId = (activeRoleDept != null && activeRoleDept.getDepartment() != null) ? activeRoleDept.getDepartment().getId() : null;

        // 4. Tạo và trả về đối tượng CustomUserDetails cho hệ thống bảo mật quản lý
        return new CustomUserDetails(
                user.getId(),
                user.getCompany().getId(),
                user.getEmail(),
                user.getPasswordHash(),
                activeRoleId,
                activeDeptId,
                authorities
        );
    }

    /**
     * Thuật toán lựa chọn vai trò & phòng ban làm việc mặc định cho người dùng:
     * - Ưu tiên chọn vai trò được đánh dấu là mặc định (isDefault = true).
     * - Nếu không có vai trò nào được đánh dấu mặc định, sẽ lấy vai trò đầu tiên trong danh sách kiêm nhiệm.
     * - Nếu người dùng chưa được cấu hình vai trò, trả về null.
     */
    private UserRoleDepartment selectActiveRoleDepartment(List<UserRoleDepartment> roleDepts) {
        if (roleDepts == null || roleDepts.isEmpty()) {
            return null;
        }
        
        // Tìm bản ghi mặc định
        return roleDepts.stream()
                .filter(UserRoleDepartment::getIsDefault)
                .findFirst()
                .orElse(roleDepts.get(0)); // Phục hồi lấy bản ghi đầu tiên nếu không có mặc định
    }
}
