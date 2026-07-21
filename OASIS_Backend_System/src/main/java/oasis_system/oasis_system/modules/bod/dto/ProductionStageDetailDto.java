package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * DTO chứa thông tin chi tiết của từng công đoạn sản xuất thuộc kế hoạch.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionStageDetailDto {
    private Long stageId;
    private String stageName;         // Tên công đoạn (Cắt, May, Sơn, Đóng gói...)
    private Integer sequenceNo;       // Thứ tự công đoạn
    private String status;            // PENDING, IN_PROGRESS, DONE
    private String assigneeName;      // Người/Tổ phụ trách
    private String payType;           // HOURLY, PIECE_RATE
    private BigDecimal rate;          // Đơn giá công đoạn
    private String startTime;
    private String endTime;
}
