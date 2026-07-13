package oasis_system.oasis_system.modules.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.hrm.entity.Employee;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Thực thể Order ánh xạ tới bảng 'orders' trong Cơ sở dữ liệu.
 * Quản lý thông tin đơn đặt hàng từ khách hàng, hỗ trợ ngưỡng duyệt tiền tự động.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String status = "Mới tạo"; // Ví dụ: Mới tạo, Xác nhận, Đang giao, Đã hoàn thành

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "approval_status", nullable = false, length = 50)
    @Builder.Default
    private String approvalStatus = "Chờ duyệt"; // Chờ duyệt, Đã phê duyệt, Bị từ chối

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy; // Trỏ tới bảng employees (người duyệt)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private Employee createdBy; // Trỏ tới bảng employees (người tạo đơn)
}
