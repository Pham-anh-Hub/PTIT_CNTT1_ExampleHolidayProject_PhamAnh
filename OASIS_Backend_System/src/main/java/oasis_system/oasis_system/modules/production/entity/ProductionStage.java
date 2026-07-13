package oasis_system.oasis_system.modules.production.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.hrm.entity.Employee;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Thực thể ProductionStage ánh xạ tới bảng 'production_stages' trong Cơ sở dữ liệu.
 * Phân chia kế hoạch sản xuất thành các công đoạn/bước chi tiết tuần tự,
 * lưu trữ đơn giá và phương thức tính lương công đoạn (lương khoán / lương giờ).
 */
@Entity
@Table(name = "production_stages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionStage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_plan_id", nullable = false)
    private ProductionPlan productionPlan;

    @Column(name = "stage_name", nullable = false)
    private String stageName;

    @Column(name = "sequence_no", nullable = false)
    private Integer sequenceNo;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, IN_PROGRESS, DONE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private Employee assignee; // Nhân viên chịu trách nhiệm chính (trỏ tới employees)

    @Column(name = "pay_type", nullable = false, length = 50)
    private String payType; // HOURLY, PIECE_RATE

    @Column(nullable = false)
    private BigDecimal rate; // Đơn giá công đoạn (đơn giá/giờ hoặc đơn giá/sản phẩm)

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;
}
