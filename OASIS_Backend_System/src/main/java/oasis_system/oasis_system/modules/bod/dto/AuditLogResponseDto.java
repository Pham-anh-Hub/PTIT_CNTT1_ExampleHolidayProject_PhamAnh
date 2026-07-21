package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;

/**
 * DTO đóng gói dữ liệu Nhật ký Hoạt động (Executive Audit Logs) cho Giám đốc tra cứu.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponseDto {
    private Long id;
    private String timestamp;        // Ngày giờ thực hiện
    private String actorName;        // Tên người thực hiện
    private String actorRole;        // Chức danh/Vai trò
    private String action;           // APPROVE, REJECT, AUTHORIZE_PAYROLL, SETTING_CHANGE
    private String documentType;     // CONTRACT, PAYROLL, ORDER, PRODUCTION_PLAN, SYSTEM_SETTING
    private Long documentId;         // ID chứng từ tương ứng
    private String reason;           // Lý do / Chi tiết nội dung thao tác
    private String riskLevel;        // INFO, WARNING, CRITICAL
}
