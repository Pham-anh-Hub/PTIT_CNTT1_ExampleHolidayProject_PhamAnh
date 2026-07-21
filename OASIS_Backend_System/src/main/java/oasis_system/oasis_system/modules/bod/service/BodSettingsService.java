package oasis_system.oasis_system.modules.bod.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.entity.ApprovalSetting;
import oasis_system.oasis_system.modules.auth.repository.ApprovalSettingRepository;
import oasis_system.oasis_system.modules.auth.security.CustomUserDetails;
import oasis_system.oasis_system.modules.bod.dto.AuditLogResponseDto;
import oasis_system.oasis_system.modules.bod.dto.BodApprovalThresholdDto;
import oasis_system.oasis_system.modules.bod.entity.ApprovalLog;
import oasis_system.oasis_system.modules.bod.repository.ApprovalLogRepository;
import oasis_system.oasis_system.modules.hrm.entity.Employee;
import oasis_system.oasis_system.modules.hrm.repository.EmployeeRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * BodSettingsService quản lý tra cứu Nhật ký hoạt động và cấu hình ngưỡng duyệt rủi ro của Ban Giám đốc (BOD).
 */
@Service
@RequiredArgsConstructor
public class BodSettingsService {

    private final ApprovalLogRepository approvalLogRepository;
    private final ApprovalSettingRepository approvalSettingRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Lấy thực thể Employee tương ứng với tài khoản đăng nhập hiện tại của Giám đốc.
     */
    private Employee getCurrentActor() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return employeeRepository.findByUserId(customUserDetails.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ nhân sự liên kết với tài khoản của bạn."));
        }
        throw new IllegalStateException("Bạn chưa đăng nhập hoặc phiên làm việc đã kết thúc.");
    }

    // ==================== 1. NHẬT KÝ HOẠT ĐỘNG (EXECUTIVE AUDIT LOGS) ====================

    /**
     * Tra cứu Nhật ký hoạt động vết phê duyệt của Giám đốc và các phòng ban.
     */
    @Transactional(readOnly = true)
    public List<AuditLogResponseDto> getAuditLogs(String documentType, String action) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<ApprovalLog> logs = approvalLogRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        List<AuditLogResponseDto> dtos = new ArrayList<>();

        for (ApprovalLog log : logs) {
            // Lọc theo documentType hoặc action nếu có
            if (documentType != null && !documentType.isBlank() && !documentType.equalsIgnoreCase(log.getDocumentType())) {
                continue;
            }
            if (action != null && !action.isBlank() && !action.equalsIgnoreCase(log.getAction())) {
                continue;
            }

            String actorName = log.getActor() != null ? log.getActor().getFullname() : "Ban Giám Đốc";
            String actorRole = (log.getActor() != null && log.getActor().getPosition() != null)
                    ? log.getActor().getPosition().getName()
                    : "Chủ doanh nghiệp / Giám đốc";

            String riskLevel = "INFO";
            if ("REJECT".equalsIgnoreCase(log.getAction()) || "SETTING_CHANGE".equalsIgnoreCase(log.getAction())) {
                riskLevel = "CRITICAL";
            } else if ("PAYROLL_DISBURSEMENT".equalsIgnoreCase(log.getDocumentType())) {
                riskLevel = "WARNING";
            }

            dtos.add(AuditLogResponseDto.builder()
                    .id(log.getId())
                    .timestamp(log.getCreatedAt() != null ? log.getCreatedAt().toString() : "")
                    .actorName(actorName)
                    .actorRole(actorRole)
                    .action(log.getAction())
                    .documentType(log.getDocumentType())
                    .documentId(log.getDocumentId())
                    .reason(log.getReason())
                    .riskLevel(riskLevel)
                    .build());
        }
        return dtos;
    }

    // ==================== 2. CẤU HÌNH NGƯỠNG PHÊ DUYỆT RỦI RO (APPROVAL THRESHOLDS) ====================

    /**
     * Lấy danh sách các cấu hình ngưỡng phê duyệt của doanh nghiệp dành cho BOD.
     */
    @Transactional
    public List<BodApprovalThresholdDto> getApprovalThresholds() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<ApprovalSetting> settings = approvalSettingRepository.findByCompanyId(companyId);
        if (settings.isEmpty()) {
            Employee actor = getCurrentActor();
            // Khởi tạo các ngưỡng mặc định cho doanh nghiệp mới
            settings.add(ApprovalSetting.builder()
                    .company(actor.getCompany())
                    .ruleType("ORDER_AMOUNT_THRESHOLD")
                    .thresholdValue(new BigDecimal("50000000.00")) // 50 triệu
                    .isEnabled(true)
                    .build());

            settings.add(ApprovalSetting.builder()
                    .company(actor.getCompany())
                    .ruleType("MATERIAL_SUPPLEMENT_THRESHOLD")
                    .thresholdValue(new BigDecimal("10000000.00")) // 10 triệu
                    .isEnabled(true)
                    .build());

            settings.add(ApprovalSetting.builder()
                    .company(actor.getCompany())
                    .ruleType("FIXED_SALARY_RATIO_WARNING")
                    .thresholdValue(new BigDecimal("75.00")) // 75%
                    .isEnabled(true)
                    .build());

            settings.add(ApprovalSetting.builder()
                    .company(actor.getCompany())
                    .ruleType("RED_ZONE_DEBT_DAYS")
                    .thresholdValue(new BigDecimal("90.00")) // 90 ngày
                    .isEnabled(true)
                    .build());

            settings = approvalSettingRepository.saveAll(settings);
        }

        List<BodApprovalThresholdDto> dtos = new ArrayList<>();
        for (ApprovalSetting s : settings) {
            dtos.add(BodApprovalThresholdDto.builder()
                    .id(s.getId())
                    .ruleType(s.getRuleType())
                    .ruleName(getVietnameseRuleName(s.getRuleType()))
                    .thresholdValue(s.getThresholdValue())
                    .isEnabled(s.getIsEnabled())
                    .build());
        }
        return dtos;
    }

    /**
     * Cập nhật danh sách ngưỡng phê duyệt rủi ro của doanh nghiệp.
     */
    @Transactional
    public List<BodApprovalThresholdDto> updateApprovalThresholds(List<BodApprovalThresholdDto> dtos) {
        Employee actor = getCurrentActor();
        List<ApprovalSetting> updatedSettings = new ArrayList<>();

        for (BodApprovalThresholdDto dto : dtos) {
            ApprovalSetting setting;
            if (dto.getId() != null) {
                setting = approvalSettingRepository.findById(dto.getId())
                        .orElseGet(() -> ApprovalSetting.builder().company(actor.getCompany()).build());
            } else {
                setting = ApprovalSetting.builder().company(actor.getCompany()).build();
            }

            setting.setRuleType(dto.getRuleType());
            setting.setThresholdValue(dto.getThresholdValue() != null ? dto.getThresholdValue() : BigDecimal.ZERO);
            setting.setIsEnabled(dto.getIsEnabled() != null ? dto.getIsEnabled() : true);

            updatedSettings.add(setting);
        }

        approvalSettingRepository.saveAll(updatedSettings);

        // Lưu vết lịch sử thay đổi cấu hình
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("SYSTEM_SETTING")
                .documentId(0L)
                .action("SETTING_CHANGE")
                .actor(actor)
                .reason("Cập nhật thay đổi các ngưỡng phê duyệt và cài đặt rủi ro hệ thống của doanh nghiệp.")
                .build();
        approvalLogRepository.save(log);

        return getApprovalThresholds();
    }

    private String getVietnameseRuleName(String ruleType) {
        return switch (ruleType) {
            case "ORDER_AMOUNT_THRESHOLD" -> "Ngưỡng giá trị đơn hàng Sales cần Giám đốc ký duyệt";
            case "MATERIAL_SUPPLEMENT_THRESHOLD" -> "Ngưỡng cấp bù vật tư sản xuất cần ký duyệt";
            case "FIXED_SALARY_RATIO_WARNING" -> "Ngưỡng % cảnh báo tỷ trọng Lương cố định quá tải";
            case "RED_ZONE_DEBT_DAYS" -> "Ngưỡng số ngày nợ quá hạn xếp vào Vùng Đỏ Nợ Xấu";
            default -> ruleType;
        };
    }
}
