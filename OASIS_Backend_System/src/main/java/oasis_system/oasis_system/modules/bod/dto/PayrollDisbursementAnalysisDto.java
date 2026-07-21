package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * DTO chứa thông tin phân tích duyệt chi quỹ lương tổng gửi Ngân hàng cho Kế toán.
 * Tự động phân loại 3 mô hình trả lương (Khoán 100%, Cố định 100%, Hỗn hợp).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollDisbursementAnalysisDto {
    private String period;                  // Chu kỳ tháng (YYYY-MM)
    private BigDecimal totalFixedCost;       // Tổng chi phí lương cố định
    private BigDecimal totalProductionCost;  // Tổng chi phí lương sản xuất
    private BigDecimal totalOutflow;         // Tổng ngân sách chi trả
    private double ratioFixed;              // Tỷ lệ % lương cố định
    private double ratioProduction;         // Tỷ lệ % lương sản xuất
    private String payrollModelType;        // PURE_PIECE_RATE (Khoán 100%), PURE_FIXED (Cố định 100%), HYBRID (Hỗn hợp)
    private boolean riskAlertFlag;          // Cờ cảnh báo rủi ro chi phí cố định quá tải
    private String analysisMessage;         // Đánh giá cơ cấu lương thông minh
    private String status;                  // Trạng thái chung: draft, approved, paid
}
