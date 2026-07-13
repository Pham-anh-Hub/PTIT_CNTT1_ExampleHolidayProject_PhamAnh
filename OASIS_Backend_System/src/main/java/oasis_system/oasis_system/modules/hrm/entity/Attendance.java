package oasis_system.oasis_system.modules.hrm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Thực thể Attendance ánh xạ tới bảng 'attendances' trong Cơ sở dữ liệu.
 * Ghi nhận nhật ký chấm công hàng ngày của nhân viên (giờ vào, giờ ra, ca kíp, nguồn chấm công).
 */
@Entity
@Table(name = "attendances", 
       uniqueConstraints = @UniqueConstraint(name = "unique_attendance_emp_date_shift", columnNames = {"employee_id", "work_date", "shift_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "check_in_time")
    private LocalTime checkInTime;

    @Column(name = "check_out_time")
    private LocalTime checkOutTime;

    @Column(nullable = false, length = 50)
    private String source; // Ví dụ: QR, FaceID, manual, machine

    @Column(nullable = false, length = 50)
    private String status; // Ví dụ: Muộn, Về sớm, Đúng giờ, Vắng mặt

    private String note;
}
