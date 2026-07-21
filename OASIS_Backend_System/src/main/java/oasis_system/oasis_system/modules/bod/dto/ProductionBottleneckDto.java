package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;

/**
 * DTO đại diện cho công đoạn bị tắc nghẽn (Bottleneck Radar) để BOD điều phối nhân sự tăng ca.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionBottleneckDto {
    private Long planId;
    private String productName;
    private String stageName;              // Tên công đoạn bị nghẽn (Ví dụ: "Tổ May")
    private Integer sequenceNo;            // Thứ tự công đoạn
    private String assigneeName;           // Người/Tổ phụ trách
    private long stuckDurationDays;        // Số ngày bị chậm trễ/tắc nghẽn
    private String bottleneckReason;       // Lý do tắc nghẽn (Thiếu vật tư phụ, hỏng máy, thiếu nhân công...)
    private String warningMessage;          // Thông điệp cảnh báo tắc nghẽn
}
