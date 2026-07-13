package oasis_system.oasis_system.modules.auth.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.modules.auth.dto.CompanyRegisterDto;
import oasis_system.oasis_system.modules.auth.dto.LoginRequest;
import oasis_system.oasis_system.modules.auth.dto.LoginResponse;
import oasis_system.oasis_system.modules.auth.dto.ContextSelectRequest;
import oasis_system.oasis_system.modules.auth.entity.*;
import oasis_system.oasis_system.modules.auth.repository.*;
import oasis_system.oasis_system.modules.auth.security.CustomUserDetails;
import oasis_system.oasis_system.modules.auth.security.JwtService;
import oasis_system.oasis_system.modules.hrm.entity.*;
import oasis_system.oasis_system.modules.hrm.repository.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AuthService xử lý các nghiệp vụ liên quan đến Đăng ký doanh nghiệp mới
 * và thiết lập dữ liệu ban đầu cho Tenant (Onboarding Setup).
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. Transactional: Sử dụng giao dịch cơ sở dữ liệu để đảm bảo tính nguyên tử (Atomicity). 
 *    Nếu việc tạo tài khoản admin hoặc seed phòng ban thất bại, toàn bộ quá trình tạo 
 *    doanh nghiệp mới sẽ được rollback (hoàn tác) để tránh rác dữ liệu.
 * 2. Seeding Pattern: Tạo sẵn các dữ liệu tĩnh để người dùng có thể trải nghiệm hệ thống ngay lập tức.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRoleDepartmentRepository userRoleDepartmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    /**
     * Quy trình đăng ký một doanh nghiệp mới trong mô hình SaaS Multi-tenant.
     * 
     * @param dto Thông tin doanh nghiệp và quản trị viên
     * @return Company doanh nghiệp vừa tạo
     */
    @Transactional
    public Company registerCompany(CompanyRegisterDto dto) {
        // 1. Kiểm tra tính hợp lệ và duy nhất của dữ liệu đầu vào
        if (companyRepository.existsByCode(dto.getCompanyCode())) {
            throw new IllegalArgumentException("Mã doanh nghiệp '" + dto.getCompanyCode() + "' đã tồn tại trên hệ thống.");
        }

        if (userRepository.findByEmail(dto.getAdminEmail()).isPresent()) {
            throw new IllegalArgumentException("Email đăng ký '" + dto.getAdminEmail() + "' đã được sử dụng.");
        }

        // 2. Tạo mới thực thể Doanh nghiệp (Company / Tenant)
        Company company = Company.builder()
                .name(dto.getCompanyName())
                .code(dto.getCompanyCode().toUpperCase())
                .isActive(true)
                .subscriptionPlan("TRIAL")
                .build();
        company = companyRepository.save(company);

        // 3. Khởi tạo tự động sơ đồ phòng ban cốt lõi (Department Seeding)
        Department bodDept = createDepartment(company, "BOD", "Ban Giám đốc", "Ban lãnh đạo cấp cao phê duyệt các yêu cầu.");
        Department hrdDept = createDepartment(company, "HRD", "Phòng Nhân sự", "Quản lý nhân sự, chấm công, tính lương.");
        Department salesDept = createDepartment(company, "SD", "Phòng Kinh doanh", "Bán hàng, theo dõi khách hàng và công nợ.");
        Department prodDept = createDepartment(company, "PD", "Phòng Sản xuất", "Lên kế hoạch và theo dõi công đoạn sản xuất.");
        createDepartment(company, "AD", "Phòng Kế toán", "Quản lý hóa đơn, tài chính, đối soát doanh thu.");

        // 4. Khởi tạo tự động các vai trò mặc định (Role Seeding)
        Role adminRole = createRole(company, "ADMIN_DN", "Quản trị doanh nghiệp");
        Role directorRole = createRole(company, "DIRECTOR", "Chủ doanh nghiệp / Giám đốc");
        Role hrRole = createRole(company, "HR_STAFF", "Nhân viên phòng Nhân sự");
        Role salesRole = createRole(company, "SALES_STAFF", "Nhân viên phòng Kinh doanh");
        Role prodRole = createRole(company, "PRODUCTION_STAFF", "Nhân viên phòng Sản xuất");
        createRole(company, "WORKER", "Công nhân sản xuất");

        // 5. Khởi tạo tự động các chức vụ mặc định (Position Seeding)
        Position adminPos = createPosition(company, "Quản trị viên", "Quản lý kỹ thuật hệ thống nội bộ");
        createPosition(company, "Giám đốc", "Lãnh đạo cao nhất điều hành doanh nghiệp");
        createPosition(company, "Trưởng phòng", "Quản lý trực tiếp một bộ phận");
        createPosition(company, "Chuyên viên", "Nhân viên nghiệp vụ văn phòng");
        createPosition(company, "Công nhân", "Nhân sự trực tiếp sản xuất tại nhà xưởng");

        // 6. Tạo tài khoản người dùng đăng nhập cho Admin Doanh nghiệp
        User adminUser = User.builder()
                .company(company)
                .email(dto.getAdminEmail())
                .passwordHash(passwordEncoder.encode(dto.getAdminPassword()))
                .fullname(dto.getAdminFullname())
                .isActive(true)
                .build();
        adminUser = userRepository.save(adminUser);

        // Gán ngữ cảnh vai trò mặc định: ADMIN_DN (Không trực thuộc phòng ban nghiệp vụ nào)
        UserRoleDepartment urd = UserRoleDepartment.builder()
                .user(adminUser)
                .role(adminRole)
                .department(null)
                .isDefault(true)
                .build();
        userRoleDepartmentRepository.save(urd);

        // 7. Tạo hồ sơ lý lịch nhân sự Employee tương ứng cho Admin Doanh nghiệp
        Employee adminEmployee = Employee.builder()
                .company(company)
                .user(adminUser)
                .department(hrdDept) // Admin thường hoạt động chính tại phòng nhân sự hoặc BOD
                .position(adminPos)
                .employeeCode(company.getCode() + "-ADMIN-0001")
                .fullname(dto.getAdminFullname())
                .email(dto.getAdminEmail())
                .status("Chính thức")
                .build();
        employeeRepository.save(adminEmployee);

        return company;
    }

    // Helper tạo phòng ban
    private Department createDepartment(Company company, String code, String name, String desc) {
        Department dept = Department.builder()
                .company(company)
                .code(code)
                .name(name)
                .description(desc)
                .build();
        return departmentRepository.save(dept);
    }

    // Helper tạo vai trò
    private Role createRole(Company company, String name, String desc) {
        Role role = Role.builder()
                .company(company)
                .name(name)
                .description(desc)
                .build();
        return roleRepository.save(role);
    }

    // Helper tạo chức vụ
    private Position createPosition(Company company, String name, String desc) {
        Position pos = Position.builder()
                .company(company)
                .name(name)
                .description(desc)
                .build();
        return positionRepository.save(pos);
    }

    /**
     * Xác thực thông tin đăng nhập và xác định ngữ cảnh vai trò (đơn vai trò / kiêm nhiệm).
     */
    @Transactional(readOnly = true)
    public LoginResponse authenticateUser(LoginRequest request) {
        // 1. Thực hiện xác thực thông qua AuthenticationManager
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Tìm thông tin tài khoản
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản sau khi xác thực."));

        if (!user.getIsActive()) {
            throw new IllegalStateException("Tài khoản của bạn đã bị khóa.");
        }

        // 3. Truy vấn danh sách vai trò - phòng ban được gán
        List<UserRoleDepartment> urds = userRoleDepartmentRepository.findByUserId(user.getId());
        if (urds.isEmpty()) {
            throw new IllegalStateException("Tài khoản chưa được cấu hình vai trò hoạt động trong doanh nghiệp.");
        }

        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullname(user.getFullname())
                .build();

        // Trường hợp 1: Người dùng chỉ có duy nhất 1 vai trò hoạt động (Ví dụ: Super Admin, Admin DN,...)
        if (urds.size() == 1) {
            UserRoleDepartment urd = urds.get(0);
            
            // Xây dựng GrantedAuthority
            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + urd.getRole().getName().toUpperCase())
            );

            // Khởi tạo CustomUserDetails để sinh JWT Token
            CustomUserDetails userDetails = new CustomUserDetails(
                    user.getId(),
                    user.getCompany().getId(),
                    user.getEmail(),
                    user.getPasswordHash(),
                    urd.getRole().getId(),
                    urd.getDepartment() != null ? urd.getDepartment().getId() : null,
                    authorities
            );

            String accessToken = jwtService.generateAccessToken(userDetails);

            LoginResponse.UserContextDto activeContext = LoginResponse.UserContextDto.builder()
                    .roleId(urd.getRole().getId())
                    .roleName(urd.getRole().getDescription() != null ? urd.getRole().getDescription() : urd.getRole().getName())
                    .departmentId(urd.getDepartment() != null ? urd.getDepartment().getId() : null)
                    .departmentName(urd.getDepartment() != null ? urd.getDepartment().getName() : "Không thuộc phòng ban")
                    .build();

            return LoginResponse.builder()
                    .requireContextSelection(false)
                    .accessToken(accessToken)
                    .userInfo(userInfo)
                    .activeContext(activeContext)
                    .build();
        }

        // Trường hợp 2: Tài khoản kiêm nhiệm nhiều vai trò/phòng ban khác nhau -> Cần yêu cầu lựa chọn
        List<LoginResponse.UserContextDto> contexts = urds.stream()
                .map(urd -> LoginResponse.UserContextDto.builder()
                        .roleId(urd.getRole().getId())
                        .roleName(urd.getRole().getDescription() != null ? urd.getRole().getDescription() : urd.getRole().getName())
                        .departmentId(urd.getDepartment() != null ? urd.getDepartment().getId() : null)
                        .departmentName(urd.getDepartment() != null ? urd.getDepartment().getName() : "Không thuộc phòng ban")
                        .build())
                .collect(Collectors.toList());

        return LoginResponse.builder()
                .requireContextSelection(true)
                .userInfo(userInfo)
                .contexts(contexts)
                .build();
    }

    /**
     * Xác nhận lựa chọn ngữ cảnh hoạt động và trả về Access Token chính thức.
     */
    @Transactional(readOnly = true)
    public LoginResponse selectActiveContext(ContextSelectRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản."));

        if (!user.getIsActive()) {
            throw new IllegalStateException("Tài khoản của bạn hiện đang bị vô hiệu hóa.");
        }

        // Truy vấn danh sách kiêm nhiệm và xác thực ngữ cảnh được lựa chọn
        List<UserRoleDepartment> urds = userRoleDepartmentRepository.findByUserId(user.getId());
        UserRoleDepartment targetUrd = urds.stream()
                .filter(urd -> urd.getRole().getId().equals(request.getRoleId()) &&
                        ((urd.getDepartment() == null && request.getDepartmentId() == null) ||
                         (urd.getDepartment() != null && urd.getDepartment().getId().equals(request.getDepartmentId()))))
                .findFirst()
                .orElseThrow(() -> new SecurityException("Cảnh báo: Bạn không được gán vai trò hoặc phòng ban làm việc đã chọn."));

        // Xây dựng GrantedAuthority cho vai trò được lựa chọn
        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + targetUrd.getRole().getName().toUpperCase())
        );

        // Khởi tạo CustomUserDetails để sinh JWT Token chính thức
        CustomUserDetails userDetails = new CustomUserDetails(
                user.getId(),
                user.getCompany().getId(),
                user.getEmail(),
                user.getPasswordHash(),
                targetUrd.getRole().getId(),
                targetUrd.getDepartment() != null ? targetUrd.getDepartment().getId() : null,
                authorities
        );

        String accessToken = jwtService.generateAccessToken(userDetails);

        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullname(user.getFullname())
                .build();

        LoginResponse.UserContextDto activeContext = LoginResponse.UserContextDto.builder()
                .roleId(targetUrd.getRole().getId())
                .roleName(targetUrd.getRole().getDescription() != null ? targetUrd.getRole().getDescription() : targetUrd.getRole().getName())
                .departmentId(targetUrd.getDepartment() != null ? targetUrd.getDepartment().getId() : null)
                .departmentName(targetUrd.getDepartment() != null ? targetUrd.getDepartment().getName() : "Không thuộc phòng ban")
                .build();

        return LoginResponse.builder()
                .requireContextSelection(false)
                .accessToken(accessToken)
                .userInfo(userInfo)
                .activeContext(activeContext)
                .build();
    }
}
