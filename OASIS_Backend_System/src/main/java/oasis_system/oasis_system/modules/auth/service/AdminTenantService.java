package oasis_system.oasis_system.modules.auth.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.dto.ApprovalSettingDto;
import oasis_system.oasis_system.modules.auth.dto.CompanyUpdateDto;
import oasis_system.oasis_system.modules.auth.entity.*;
import oasis_system.oasis_system.modules.auth.repository.*;
import oasis_system.oasis_system.modules.hrm.dto.*;
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
    private final ApprovalSettingRepository approvalSettingRepository;

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
                .avatarUrl(dto.getAvatarUrl())
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

    /**
     * Lấy danh sách nhân viên thuộc doanh nghiệp hiện tại kèm bộ lọc tìm kiếm.
     */
    @Transactional(readOnly = true)
    public java.util.List<Employee> getEmployees(String search, Long departmentId, String status) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        String searchParam = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String statusParam = (status == null || status.trim().isEmpty()) ? null : status.trim();

        return employeeRepository.findEmployeesWithFilters(companyId, searchParam, departmentId, statusParam);
    }

    /**
     * Lấy chi tiết thông tin và tài khoản của một nhân viên.
     */
    @Transactional(readOnly = true)
    public Employee getEmployeeDetail(Long id) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên có ID " + id));

        if (!employee.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Nhân viên không thuộc về doanh nghiệp của bạn.");
        }

        return employee;
    }

    /**
     * Cập nhật thông tin lý lịch và phòng ban/chức vụ của nhân viên.
     */
    @Transactional
    public Employee updateEmployee(Long id, EmployeeUpdateDto dto) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên có ID " + id));

        if (!employee.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Nhân viên không thuộc về doanh nghiệp của bạn.");
        }

        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng ban được chọn."));
        if (!department.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Phòng ban không thuộc về doanh nghiệp của bạn.");
        }

        Position position = positionRepository.findById(dto.getPositionId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chức vụ được chọn."));
        if (!position.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Chức vụ không thuộc về doanh nghiệp của bạn.");
        }

        employee.setFullname(dto.getFullname());
        employee.setPhone(dto.getPhone());
        employee.setAvatarUrl(dto.getAvatarUrl());
        employee.setStatus(dto.getStatus());
        employee.setDepartment(department);
        employee.setPosition(position);

        if (employee.getUser() != null) {
            User user = employee.getUser();
            user.setFullname(dto.getFullname());
            userRepository.save(user);
        }

        return employeeRepository.save(employee);
    }

    /**
     * Khóa hoặc mở khóa tài khoản đăng nhập Web của nhân viên.
     */
    @Transactional
    public Employee updateEmployeeAccountStatus(Long id, Boolean isActive) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên có ID " + id));

        if (!employee.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Nhân viên không thuộc về doanh nghiệp của bạn.");
        }

        User user = employee.getUser();
        if (user == null) {
            throw new IllegalArgumentException("Nhân viên này hiện chưa được cấp tài khoản đăng nhập hệ thống.");
        }

        // Ngăn chặn tự khóa tài khoản chính mình
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && auth.getName().equals(user.getEmail())) {
            throw new IllegalArgumentException("Bạn không thể tự khóa tài khoản của chính mình!");
        }

        user.setIsActive(isActive);
        userRepository.save(user);

        return employee;
    }

    /**
     * Gán và thay thế toàn bộ danh sách vai trò kiêm nhiệm phòng ban của nhân viên.
     */
    @Transactional
    public Employee assignUserRoles(Long id, java.util.List<UserRoleAssignmentDto> assignments) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên có ID " + id));

        if (!employee.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Nhân viên không thuộc về doanh nghiệp của bạn.");
        }

        User user = employee.getUser();
        if (user == null) {
            throw new IllegalArgumentException("Nhân viên này hiện chưa có tài khoản đăng nhập để thực hiện phân quyền.");
        }

        if (assignments == null || assignments.isEmpty()) {
            throw new IllegalArgumentException("Danh sách phân quyền kiêm nhiệm không được để trống.");
        }

        long defaultCount = assignments.stream().filter(UserRoleAssignmentDto::getIsDefault).count();
        if (defaultCount != 1) {
            throw new IllegalArgumentException("Bắt buộc phải có duy nhất 1 vai trò được thiết lập làm mặc định (isDefault = true).");
        }

        java.util.List<UserRoleDepartment> newUrds = new java.util.ArrayList<>();
        for (UserRoleAssignmentDto assignment : assignments) {
            Role role = roleRepository.findById(assignment.getRoleId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vai trò có ID " + assignment.getRoleId()));
            if (role.getCompany() != null && !role.getCompany().getId().equals(companyId)) {
                throw new SecurityException("Cảnh báo: Vai trò phân quyền không thuộc phạm vi doanh nghiệp của bạn.");
            }

            Department department = departmentRepository.findById(assignment.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng ban có ID " + assignment.getDepartmentId()));
            if (!department.getCompany().getId().equals(companyId)) {
                throw new SecurityException("Cảnh báo: Phòng ban kiêm nhiệm không thuộc về doanh nghiệp của bạn.");
            }

            UserRoleDepartment urd = UserRoleDepartment.builder()
                    .user(user)
                    .role(role)
                    .department(department)
                    .isDefault(assignment.getIsDefault())
                    .build();
            newUrds.add(urd);
        }

        userRoleDepartmentRepository.deleteByUserId(user.getId());
        userRoleDepartmentRepository.saveAll(newUrds);

        return employee;
    }

    /**
     * Lấy danh sách tất cả phòng ban của doanh nghiệp.
     */
    @Transactional(readOnly = true)
    public java.util.List<Department> getDepartments() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại.");
        }
        return departmentRepository.findByCompanyId(companyId);
    }

    /**
     * Lấy danh sách tất cả chức vụ của doanh nghiệp.
     */
    @Transactional(readOnly = true)
    public java.util.List<Position> getPositions() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại.");
        }
        return positionRepository.findByCompanyId(companyId);
    }

    /**
     * Lấy danh sách tất cả vai trò hoạt động hợp lệ.
     */
    @Transactional(readOnly = true)
    public java.util.List<Role> getRoles() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại.");
        }
        java.util.List<Role> systemRoles = roleRepository.findByCompanyIdIsNull();
        java.util.List<Role> tenantRoles = roleRepository.findByCompanyId(companyId);
        java.util.List<Role> allRoles = new java.util.ArrayList<>();
        allRoles.addAll(systemRoles);
        allRoles.addAll(tenantRoles);
        return allRoles;
    }

    /**
     * Lấy thông tin chi tiết của doanh nghiệp hiện tại.
     */
    @Transactional(readOnly = true)
    public Company getCompanyProfile() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại.");
        }
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy doanh nghiệp."));
    }

    /**
     * Cập nhật thông tin chi tiết của doanh nghiệp hiện tại.
     */
    @Transactional
    public Company updateCompanyProfile(CompanyUpdateDto dto) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại.");
        }
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy doanh nghiệp."));
        
        company.setName(dto.getName());
        company.setAddress(dto.getAddress());
        company.setPhone(dto.getPhone());
        company.setEmail(dto.getEmail());
        
        return companyRepository.save(company);
    }

    /**
     * Lấy cấu hình phê duyệt của doanh nghiệp. Tự động khởi tạo nếu chưa có.
     */
    @Transactional
    public java.util.List<ApprovalSetting> getApprovalSettings() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        java.util.List<ApprovalSetting> settings = approvalSettingRepository.findByCompanyId(companyId);

        if (settings.isEmpty()) {
            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy doanh nghiệp của bạn trên hệ thống."));

            settings = new java.util.ArrayList<>();
            settings.add(ApprovalSetting.builder()
                    .company(company)
                    .ruleType("ORDER_AMOUNT_THRESHOLD")
                    .thresholdValue(new java.math.BigDecimal("50000000.00"))
                    .isEnabled(true)
                    .build());
            settings.add(ApprovalSetting.builder()
                    .company(company)
                    .ruleType("CONTRACT_APPROVAL")
                    .thresholdValue(java.math.BigDecimal.ZERO)
                    .isEnabled(true)
                    .build());
            settings.add(ApprovalSetting.builder()
                    .company(company)
                    .ruleType("PRODUCTION_PLAN_APPROVAL")
                    .thresholdValue(java.math.BigDecimal.ZERO)
                    .isEnabled(true)
                    .build());

            settings = approvalSettingRepository.saveAll(settings);
        }

        return settings;
    }

    /**
     * Cập nhật hàng loạt cấu hình phê duyệt cho doanh nghiệp.
     */
    @Transactional
    public java.util.List<ApprovalSetting> updateApprovalSettings(java.util.List<ApprovalSettingDto> dtos) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        if (dtos == null || dtos.isEmpty()) {
            throw new IllegalArgumentException("Danh sách cấu hình phê duyệt gửi lên không được để trống.");
        }

        java.util.List<ApprovalSetting> settings = new java.util.ArrayList<>();
        for (ApprovalSettingDto dto : dtos) {
            ApprovalSetting setting;
            if (dto.getId() != null) {
                setting = approvalSettingRepository.findById(dto.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy tắc phê duyệt có ID " + dto.getId()));
                if (!setting.getCompany().getId().equals(companyId)) {
                    throw new SecurityException("Cảnh báo: Quy tắc phê duyệt không thuộc phạm vi doanh nghiệp của bạn.");
                }
            } else {
                Company company = companyRepository.findById(companyId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy doanh nghiệp của bạn trên hệ thống."));
                setting = new ApprovalSetting();
                setting.setCompany(company);
            }

            setting.setRuleType(dto.getRuleType());
            setting.setThresholdValue(dto.getThresholdValue());
            setting.setIsEnabled(dto.getIsEnabled());
            settings.add(setting);
        }

        return approvalSettingRepository.saveAll(settings);
    }

    /**
     * Tạo mới một phòng ban trong doanh nghiệp.
     */
    @Transactional
    public Department createDepartment(DepartmentDto dto) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy doanh nghiệp của bạn trên hệ thống."));

        if (departmentRepository.existsByCodeAndCompanyId(dto.getCode(), companyId)) {
            throw new IllegalArgumentException("Mã phòng ban '" + dto.getCode() + "' đã tồn tại trong doanh nghiệp.");
        }

        Department parent = null;
        if (dto.getParentDepartmentId() != null) {
            parent = departmentRepository.findById(dto.getParentDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng ban cha có ID " + dto.getParentDepartmentId()));
            if (!parent.getCompany().getId().equals(companyId)) {
                throw new SecurityException("Cảnh báo: Phòng ban cha không thuộc về doanh nghiệp của bạn.");
            }
        }

        Department department = Department.builder()
                .company(company)
                .name(dto.getName())
                .code(dto.getCode())
                .description(dto.getDescription())
                .parentDepartment(parent)
                .build();

        return departmentRepository.save(department);
    }

    /**
     * Cập nhật thông tin phòng ban và cấu trúc phân cấp.
     */
    @Transactional
    public Department updateDepartment(Long id, DepartmentDto dto) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng ban có ID " + id));
        if (!department.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Phòng ban không thuộc về doanh nghiệp của bạn.");
        }

        if (!department.getCode().equals(dto.getCode())) {
            if (departmentRepository.existsByCodeAndCompanyId(dto.getCode(), companyId)) {
                throw new IllegalArgumentException("Mã phòng ban '" + dto.getCode() + "' đã tồn tại trong doanh nghiệp.");
            }
        }

        Department parent = null;
        if (dto.getParentDepartmentId() != null) {
            if (dto.getParentDepartmentId().equals(id)) {
                throw new IllegalArgumentException("Phòng ban cha không được là chính nó.");
            }

            Department checkParent = departmentRepository.findById(dto.getParentDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng ban cha có ID " + dto.getParentDepartmentId()));
            if (!checkParent.getCompany().getId().equals(companyId)) {
                throw new SecurityException("Cảnh báo: Phòng ban cha không thuộc về doanh nghiệp của bạn.");
            }

            // Ngăn chặn vòng lặp phòng ban cha-con
            Department currentAncestor = checkParent;
            while (currentAncestor != null) {
                if (currentAncestor.getId().equals(id)) {
                    throw new IllegalArgumentException("Cảnh báo vòng lặp: Phòng ban cha được chọn đang trực thuộc phòng ban hiện tại.");
                }
                currentAncestor = currentAncestor.getParentDepartment();
            }

            parent = checkParent;
        }

        department.setName(dto.getName());
        department.setCode(dto.getCode());
        department.setDescription(dto.getDescription());
        department.setParentDepartment(parent);

        return departmentRepository.save(department);
    }

    /**
     * Xóa phòng ban khi đáp ứng đầy đủ các ràng buộc khóa ngoại.
     */
    @Transactional
    public void deleteDepartment(Long id) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng ban có ID " + id));
        if (!department.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Phòng ban không thuộc về doanh nghiệp của bạn.");
        }

        if (departmentRepository.existsByParentDepartmentId(id)) {
            throw new IllegalStateException("Không thể xóa phòng ban này vì đang có các phòng ban con trực thuộc.");
        }

        if (employeeRepository.existsByDepartmentId(id)) {
            throw new IllegalStateException("Không thể xóa phòng ban này vì đang có nhân viên trực thuộc.");
        }

        if (userRoleDepartmentRepository.existsByDepartmentId(id)) {
            throw new IllegalStateException("Không thể xóa phòng ban này vì đang được gán làm vai trò kiêm nhiệm cho nhân sự.");
        }

        departmentRepository.delete(department);
    }

    /**
     * Tạo mới một chức danh (chức vụ) công việc trong doanh nghiệp.
     */
    @Transactional
    public Position createPosition(PositionDto dto) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy doanh nghiệp của bạn trên hệ thống."));

        if (positionRepository.existsByNameAndCompanyId(dto.getName(), companyId)) {
            throw new IllegalArgumentException("Chức vụ '" + dto.getName() + "' đã tồn tại trong doanh nghiệp.");
        }

        Position position = Position.builder()
                .company(company)
                .name(dto.getName())
                .description(dto.getDescription())
                .build();

        return positionRepository.save(position);
    }

    /**
     * Cập nhật thông tin chức vụ.
     */
    @Transactional
    public Position updatePosition(Long id, PositionDto dto) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chức vụ có ID " + id));
        if (!position.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Chức vụ không thuộc về doanh nghiệp của bạn.");
        }

        if (!position.getName().equals(dto.getName())) {
            if (positionRepository.existsByNameAndCompanyId(dto.getName(), companyId)) {
                throw new IllegalArgumentException("Chức vụ '" + dto.getName() + "' đã tồn tại trong doanh nghiệp.");
            }
        }

        position.setName(dto.getName());
        position.setDescription(dto.getDescription());

        return positionRepository.save(position);
    }

    /**
     * Xóa chức vụ nếu không có nhân viên nào đang liên kết nắm giữ.
     */
    @Transactional
    public void deletePosition(Long id) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chức vụ có ID " + id));
        if (!position.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo: Chức vụ không thuộc về doanh nghiệp của bạn.");
        }

        if (employeeRepository.existsByPositionId(id)) {
            throw new IllegalStateException("Không thể xóa chức vụ này vì đang có nhân sự nắm giữ chức vụ.");
        }

        positionRepository.delete(position);
    }
}
