package oasis_system.oasis_system.modules.production.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.hrm.entity.Employee;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Thực thể ProductionStageWorkLog ánh xạ tới bảng 'production_stage_work_logs' trong Cơ sở dữ liệu.
 * Nhật ký ghi nhận công việc hàng ngày của công nhân sản xuất tại từng công đoạn chi tiết
 * để hệ thống tự động tính toán ra khoản thu nhập sản xuất (computed_amount) cuối tháng.
 */
@Entity
@Table(name = "production_stage_work_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionStageWorkLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_stage_id", nullable = false)
    private ProductionStage productionStage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "hours_worked")
    private BigDecimal hoursWorked; // Số giờ làm việc thực tế (nếu tính theo giờ)

    @Column(name = "quantity_completed")
    private BigDecimal quantityCompleted; // Số sản lượng hoàn thành đạt chuẩn (nếu tính khoán sản phẩm)

    @Column(name = "computed_amount", nullable = false)
    private BigDecimal computedAmount; // Thu nhập tạm tính tự động (hoursWorked * rate hoặc quantityCompleted * rate)

    @Column(name = "shift_name", length = 100)
    private String shiftName; // Ca làm / Khung giờ (ví dụ: Ca Hành chính, Ca Hành chính + OT (2h))

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private Employee approvedBy; // Quản đốc / Cán bộ duyệt chấm công
}
