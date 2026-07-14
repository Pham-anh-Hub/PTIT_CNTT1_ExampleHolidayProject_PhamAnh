package oasis_system.oasis_system.modules.auth.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.modules.auth.dto.CompanyDetailResponse;
import oasis_system.oasis_system.modules.auth.dto.CompanyStatusDto;
import oasis_system.oasis_system.modules.auth.dto.CompanyUpdateDto;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.auth.entity.User;
import oasis_system.oasis_system.modules.auth.repository.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SystemAdminService xử lý các nghiệp vụ dành riêng cho Admin hệ thống (Super Admin / Sys Admin).
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. Transactional(readOnly = true): Tối ưu hóa hiệu năng truy vấn Spring JPA/Hibernate, 
 *    báo cho hệ thống biết đây là các thao tác đọc thuần túy, tránh kích hoạt kiểm tra thay đổi thực thể (dirty checking)
 *    và không tạo khóa ghi (write locks) lên CSDL.
 * 2. Native & JPQL Aggregation: Sử dụng kết hợp truy vấn JPQL để lấy đối tượng có cấu trúc (Admin User)
 *    và Native Query đếm trực tiếp trên CSDL để tổng hợp báo cáo mà không cần tải dữ liệu lên Java xử lý.
 */
@Service
@RequiredArgsConstructor
public class SystemAdminService {

    private final CompanyRepository companyRepository;

    /**
     * Lấy thông tin chi tiết và thống kê sử dụng tài nguyên của một doanh nghiệp.
     * 
     * @param companyId ID của doanh nghiệp cần tra cứu
     * @return CompanyDetailResponse
     */
    @Transactional(readOnly = true)
    public CompanyDetailResponse getCompanyDetail(Long companyId) {
        // 1. Kiểm tra xem doanh nghiệp có tồn tại không
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Doanh nghiệp có ID " + companyId + " không tồn tại."));

        // 2. Tìm kiếm thông tin Admin đại diện của doanh nghiệp đó
        User adminUser = companyRepository.findAdminUserByCompanyId(companyId).orElse(null);
        CompanyDetailResponse.AdminInfoDto adminInfoDto = null;
        if (adminUser != null) {
            adminInfoDto = CompanyDetailResponse.AdminInfoDto.builder()
                    .id(adminUser.getId())
                    .email(adminUser.getEmail())
                    .fullname(adminUser.getFullname())
                    .isActive(adminUser.getIsActive())
                    .lastLoginAt(adminUser.getLastLoginAt())
                    .build();
        }

        // 3. Tính toán các số liệu thống kê sử dụng tài nguyên
        long totalUsers = companyRepository.countUsersByCompanyId(companyId);
        long totalEmployees = companyRepository.countEmployeesByCompanyId(companyId);
        long totalDepartments = companyRepository.countDepartmentsByCompanyId(companyId);
        long totalCustomers = companyRepository.countCustomersByCompanyId(companyId);
        long totalOrders = companyRepository.countOrdersByCompanyId(companyId);
        java.math.BigDecimal totalRevenue = companyRepository.sumRevenueByCompanyId(companyId);
        long totalProducts = companyRepository.countProductsByCompanyId(companyId);
        long totalProductionPlans = companyRepository.countProductionPlansByCompanyId(companyId);
        long totalRecruitmentPosts = companyRepository.countRecruitmentPostsByCompanyId(companyId);

        CompanyDetailResponse.CompanyStatsDto statsDto = CompanyDetailResponse.CompanyStatsDto.builder()
                .totalUsers(totalUsers)
                .totalEmployees(totalEmployees)
                .totalDepartments(totalDepartments)
                .totalCustomers(totalCustomers)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .totalProducts(totalProducts)
                .totalProductionPlans(totalProductionPlans)
                .totalRecruitmentPosts(totalRecruitmentPosts)
                .build();

        // 4. Đóng gói phản hồi
        return CompanyDetailResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .code(company.getCode())
                .address(company.getAddress())
                .phone(company.getPhone())
                .email(company.getEmail())
                .isActive(company.getIsActive())
                .subscriptionPlan(company.getSubscriptionPlan())
                .createdAt(company.getCreatedAt())
                .adminInfo(adminInfoDto)
                .stats(statsDto)
                .build();
    }

    /**
     * Chỉnh sửa thông tin cơ bản của một doanh nghiệp khách hàng (Tenant).
     * 
     * @param companyId ID doanh nghiệp cần cập nhật
     * @param dto Dữ liệu cập nhật
     * @return Thực thể Company sau khi lưu CSDL
     */
    @Transactional
    public Company updateCompany(Long companyId, CompanyUpdateDto dto) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Doanh nghiệp có ID " + companyId + " không tồn tại."));

        company.setName(dto.getName());
        company.setAddress(dto.getAddress());
        company.setPhone(dto.getPhone());
        company.setEmail(dto.getEmail());
        company.setSubscriptionPlan(dto.getSubscriptionPlan());

        return companyRepository.save(company);
    }

    /**
     * Khóa hoặc mở khóa tài khoản hoạt động của doanh nghiệp khách hàng (Tenant).
     * 
     * @param companyId ID doanh nghiệp cần cập nhật trạng thái
     * @param dto Trạng thái kích hoạt mới (isActive)
     * @return Thực thể Company sau khi lưu CSDL
     */
    @Transactional
    public Company updateCompanyStatus(Long companyId, CompanyStatusDto dto) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Doanh nghiệp có ID " + companyId + " không tồn tại."));

        company.setIsActive(dto.getIsActive());

        return companyRepository.save(company);
    }
}
