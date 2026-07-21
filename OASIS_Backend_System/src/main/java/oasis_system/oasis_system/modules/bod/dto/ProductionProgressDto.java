package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO chứa thông tin tiến độ sản xuất tổng thể của một Kế hoạch sản xuất.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionProgressDto {
    private Long planId;
    private String productName;
    private String productCode;
    private BigDecimal plannedQuantity;
    private BigDecimal estimatedBudget;
    private String startDate;
    private String endDate;
    private int totalStages;                   // Tổng số công đoạn
    private int completedStages;               // Số công đoạn đã hoàn thành
    private double progressPercent;            // Tỷ lệ hoàn thành (%)
    private String currentActiveStage;        // Tên công đoạn đang thực hiện
    private String status;                    // Trạng thái chung kế hoạch (DRAFT, IN_PROGRESS, DONE)
    private String approvalStatus;            // Trạng thái duyệt (Chờ duyệt, Đã phê duyệt, Bị từ chối)
    private List<ProductionStageDetailDto> stages; // Danh sách chi tiết từng công đoạn
}
