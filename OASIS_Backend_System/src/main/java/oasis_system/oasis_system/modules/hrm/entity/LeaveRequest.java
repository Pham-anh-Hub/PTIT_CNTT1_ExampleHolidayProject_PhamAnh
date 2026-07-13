package oasis_system.oasis_system.modules.hrm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Thực thể LeaveRequest ánh xạ tới bảng 'leave_requests' trong Cơ sở dữ liệu.
 * Quản lý các yêu cầu xin nghỉ phép của nhân viên gửi tới Trưởng phòng/HR phê duyệt.
 */
@Entity
@Table(name = "leave_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "leave_type", nullable = false, length = 50)
    private String leaveType; // Ví dụ: ANNUAL_LEAVE, UNPAID_LEAVE, SICK_LEAVE

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    private String reason;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "Chờ duyệt"; // Chờ duyệt, Đã duyệt, Bị từ chối

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private Employee approver; // Trưởng phòng hoặc HR duyệt đơn (trỏ tới bảng employees)

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
