package oasis_system.oasis_system.modules.hrm.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;

import java.time.LocalTime;

/**
 * Thực thể Shift ánh xạ tới bảng 'shifts' trong Cơ sở dữ liệu.
 * Quản lý các ca làm việc của doanh nghiệp (ví dụ: Ca sáng, Ca chiều, Ca hành chính).
 */
@Entity
@Table(name = "shifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    private String description;
}
