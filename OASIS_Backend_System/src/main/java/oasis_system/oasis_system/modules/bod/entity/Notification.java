package oasis_system.oasis_system.modules.bod.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;

import java.time.LocalDateTime;

/**
 * Thực thể Notification ánh xạ tới bảng 'notifications' trong Cơ sở dữ liệu.
 * Lưu trữ lịch sử thông báo của doanh nghiệp để hiển thị hộp thư lưu trữ.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false, length = 50)
    private String type; // ORDER, CONTRACT, PROD_PLAN

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "target_role", length = 50)
    private String targetRole; // E.g., "BOD", "ACCOUNTANT", "HR", "SALES"

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
