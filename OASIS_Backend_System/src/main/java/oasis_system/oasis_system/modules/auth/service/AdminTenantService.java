package oasis_system.oasis_system.modules.auth.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.entity.*;
import oasis_system.oasis_system.modules.auth.repository.*;
import oasis_system.oasis_system.modules.hrm.dto.EmployeeCreateDto;
import oasis_system.oasis_system.modules.hrm.entity.*;
import oasis_system.oasis_system.modules.hrm.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * AdminTenantService xử lý các tác vụ quản trị nội bộ của từng doanh nghiệp (Tenant).
 * Chỉ dành cho tài khoản Admin Doanh nghiệp (ADMIN_DN) thực thi.
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. Tenant Verification (Security best practice): 
 *    Mọi đối tượng (Department, Position, Role) gửi lên từ client đều được đối chiếu chặt chẽ 
 *    với companyId trích xuất từ TenantContext của Admin. Nếu không trùng khớp, hệ thống từ chối xử lý,
 *    ngăn chặn lỗ hổng IDOR (truy cập trái phép tài nguyên chéo tenant).
 * 2. Tự động sinh mã Nhân viên (SaaS Requirement): 
 *    Tự sinh mã nhân viên định dạng {Code Công ty}-{Code Phòng ban}-{Số ngẫu nhiên 4 chữ số}.
 */
@Service
@RequiredArgsConstructor
public class AdminTenantService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRoleDepartmentRepository userRoleDepartmentRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Khởi tạo hồ sơ nhân viên mới và tùy chọn tạo tài khoản đăng nhập đi kèm.
     * 
     * @param dto DTO chứa dữ liệu khởi tạo
     * @return Employee Thực thể nhân viên vừa tạo
     */
    @Transactional
    public Employee createEmployeeAndUser(EmployeeCreateDto dto) {
        // 1. Trích xuất companyId của Admin từ ThreadLocal TenantContext
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy doanh nghiệp của bạn trên hệ thống."));

        // 2. Xác thực và kiểm duyệt phòng ban (Department) thuộc về doanh nghiệp hiện tại
        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng ban được chọn."));
        if (!department.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Phòng ban không thuộc về doanh nghiệp của bạn.");
        }

        // 3. Xác thực và kiểm duyệt chức vụ (Position) thuộc về doanh nghiệp hiện tại
        Position position = positionRepository.findById(dto.getPositionId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chức vụ được chọn."));
        if (!position.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Chức vụ không thuộc về doanh nghiệp của bạn.");
        }

        // 4. Xác thực vai trò phân quyền (Role)
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vai trò được chọn."));
        // Vai trò phải là vai trò dùng chung của hệ thống (companyId is null) hoặc thuộc về công ty này
        if (role.getCompany() != null && !role.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Vai trò phân quyền không thuộc phạm vi doanh nghiệp của bạn.");
        }

        // 5. Kiểm tra email duy nhất
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Địa chỉ email '" + dto.getEmail() + "' đã được sử dụng trên hệ thống.");
        }

        // 6. Xử lý mã nhân viên (Employee Code)
        String empCode = dto.getEmployeeCode();
        if (empCode == null || empCode.trim().isEmpty()) {
            // Sinh mã ngẫu nhiên dạng: CTY001-HRD-5421
            int randomNum = (int) (Math.random() * 9000) + 1000; // Số ngẫu nhiên từ 1000 đến 9999
            empCode = company.getCode() + "-" + department.getCode() + "-" + randomNum;
        }

        if (employeeRepository.existsByEmployeeCodeAndCompanyId(empCode, companyId)) {
            throw new IllegalArgumentException("Mã nhân viên '" + empCode + "' đã tồn tại trong doanh nghiệp.");
        }

        // 7. Tạo mới hồ sơ nhân sự Employee
        Employee employee = Employee.builder()
                .company(company)
                .department(department)
                .position(position)
                .employeeCode(empCode)
                .fullname(dto.getFullname())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .status("Thử việc") // Mặc định khi thêm mới là thử việc
                .build();
        employee = employeeRepository.save(employee);

        // 8. Nếu yêu cầu cấp tài khoản đăng nhập Web
        if (Boolean.TRUE.equals(dto.getCreateAccount())) {
            if (dto.getPassword() == null || dto.getPassword().trim().length() < 6) {
                throw new IllegalArgumentException("Cần cung cấp mật khẩu có độ dài tối thiểu 6 ký tự để tạo tài khoản.");
            }

            // Tạo tài khoản User đăng nhập
            User user = User.builder()
                    .company(company)
                    .email(dto.getEmail())
                    .passwordHash(passwordEncoder.encode(dto.getPassword()))
                    .fullname(dto.getFullname())
                    .isActive(true)
                    .build();
            user = userRepository.save(user);

            // Liên kết ngược User vào hồ sơ Employee
            employee.setUser(user);
            employee = employeeRepository.save(employee);

            // Tạo liên kết phân quyền hoạt động mặc định
            UserRoleDepartment urd = UserRoleDepartment.builder()
                    .user(user)
                    .role(role)
                    .department(department)
                    .isDefault(true)
                    .build();
            userRoleDepartmentRepository.save(urd);
        }

        return employee;
    }
}
