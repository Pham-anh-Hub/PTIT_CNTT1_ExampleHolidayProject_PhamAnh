package oasis_system.oasis_system.core.config;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.modules.auth.entity.*;
import oasis_system.oasis_system.modules.auth.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * DataInitializer tự động chạy khi Spring Boot khởi động ứng dụng thành công.
 * Thực hiện kiểm tra và seed dữ liệu mặc định của hệ thống SaaS (Super Admin & System Company).
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. CommandLineRunner: Giao diện chạy mã nguồn ngay sau khi Spring Context sẵn sàng.
 * 2. Idempotent Data Seeding: Đảm bảo kiểm tra dữ liệu tồn tại trước khi thêm mới 
 *    để tránh bị trùng lặp (duy nhất) khi ứng dụng được khởi động lại nhiều lần.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleDepartmentRepository userRoleDepartmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Kiểm tra xem doanh nghiệp Hệ thống (SYSTEM) đã tồn tại chưa
        if (!companyRepository.existsByCode("SYSTEM")) {
            
            // 1. Tạo doanh nghiệp chủ quản hệ thống SaaS
            Company systemCompany = Company.builder()
                    .name("OASIS SaaS Provider")
                    .code("SYSTEM")
                    .isActive(true)
                    .subscriptionPlan("ENTERPRISE")
                    .build();
            systemCompany = companyRepository.save(systemCompany);

            // 2. Tạo vai trò tối cao Super Admin của hệ thống
            Role superAdminRole = Role.builder()
                    .company(systemCompany)
                    .name("SUPER_ADMIN")
                    .description("Quyền quản trị tối cao toàn bộ hệ thống SaaS")
                    .build();
            superAdminRole = roleRepository.save(superAdminRole);

            // 3. Tạo tài khoản đăng nhập Super Admin mặc định
            User sysAdminUser = User.builder()
                    .company(systemCompany)
                    .email("sysadmin@oasis.com")
                    .passwordHash(passwordEncoder.encode("123456789"))
                    .fullname("Oasis System Admin")
                    .isActive(true)
                    .build();
            sysAdminUser = userRepository.save(sysAdminUser);

            // 4. Tạo bản ghi liên kết vai trò hoạt động (Department là null vì Super Admin quản trị toàn cục)
            UserRoleDepartment urd = UserRoleDepartment.builder()
                    .user(sysAdminUser)
                    .role(superAdminRole)
                    .department(null)
                    .isDefault(true)
                    .build();
            userRoleDepartmentRepository.save(urd);

            System.out.println(">>> [Seed Data] Đã khởi tạo thành công tài khoản Super Admin hệ thống: sysadmin@oasis.com / 123456789");
        }
    }
}
