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
        // 1. Đảm bảo doanh nghiệp Hệ thống (SYSTEM) đã tồn tại
        Company systemCompany = companyRepository.findByCode("SYSTEM").orElse(null);
        if (systemCompany == null) {
            systemCompany = Company.builder()
                    .name("OASIS SaaS Provider")
                    .code("SYSTEM")
                    .isActive(true)
                    .subscriptionPlan("ENTERPRISE")
                    .build();
            systemCompany = companyRepository.save(systemCompany);
        }

        // 2. Đảm bảo vai trò SUPER_ADMIN đã tồn tại
        Role superAdminRole = roleRepository.findByNameAndCompanyId("SUPER_ADMIN", systemCompany.getId()).orElse(null);
        if (superAdminRole == null) {
            superAdminRole = Role.builder()
                    .company(systemCompany)
                    .name("SUPER_ADMIN")
                    .description("Quyền quản trị tối cao toàn bộ hệ thống SaaS")
                    .build();
            superAdminRole = roleRepository.save(superAdminRole);
        }

        // 3. Đảm bảo tài khoản Super Admin tồn tại và đồng bộ đúng mật khẩu
        final Company finalSystemCompany = systemCompany;
        final Role finalSuperAdminRole = superAdminRole;
        
        userRepository.findByEmail("sysadmin@oasis.com").ifPresentOrElse(
            user -> {
                // Reset/Đồng bộ lại mật khẩu chuẩn của hệ thống
                user.setPasswordHash(passwordEncoder.encode("123456789"));
                userRepository.save(user);
                System.out.println(">>> [Seed Data] Đã đồng bộ mật khẩu Super Admin: sysadmin@oasis.com / 123456789");
            },
            () -> {
                // Tạo mới nếu chưa tồn tại
                User sysAdminUser = User.builder()
                        .company(finalSystemCompany)
                        .email("sysadmin@oasis.com")
                        .passwordHash(passwordEncoder.encode("123456789"))
                        .fullname("Oasis System Admin")
                        .isActive(true)
                        .build();
                sysAdminUser = userRepository.save(sysAdminUser);

                UserRoleDepartment urd = UserRoleDepartment.builder()
                        .user(sysAdminUser)
                        .role(finalSuperAdminRole)
                        .department(null)
                        .isDefault(true)
                        .build();
                userRoleDepartmentRepository.save(urd);
                System.out.println(">>> [Seed Data] Đã khởi tạo mới tài khoản Super Admin: sysadmin@oasis.com / 123456789");
            }
        );
    }
}
