package oasis_system.oasis_system.modules.auth.dto;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * CompanyDetailResponse đóng gói toàn bộ thông tin chi tiết của một doanh nghiệp khách hàng (Tenant),
 * bao gồm cả thông tin người đại diện quản trị (Admin DN) và các số liệu sử dụng tài nguyên.
 */
@Getter
@Builder
public class CompanyDetailResponse {
    
    private Long id;
    private String name;
    private String code;
    private String address;
    private String phone;
    private String email;
    private boolean isActive;
    private String subscriptionPlan;
    private LocalDateTime createdAt;

    private AdminInfoDto adminInfo;
    private CompanyStatsDto stats;

    @Getter
    @Builder
    public static class AdminInfoDto {
        private Long id;
        private String email;
        private String fullname;
        private boolean isActive;
        private LocalDateTime lastLoginAt;
    }

    @Getter
    @Builder
    public static class CompanyStatsDto {
        private long totalUsers;
        private long totalEmployees;
        private long totalDepartments;
        private long totalCustomers;
        private long totalOrders;
        private BigDecimal totalRevenue;
        private long totalProducts;
        private long totalProductionPlans;
        private long totalRecruitmentPosts;
    }
}
