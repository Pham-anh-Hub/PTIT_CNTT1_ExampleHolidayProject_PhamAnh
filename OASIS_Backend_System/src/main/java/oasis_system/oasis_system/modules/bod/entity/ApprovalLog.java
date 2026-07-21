package oasis_system.oasis_system.modules.bod.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.hrm.entity.Employee;

import java.time.LocalDateTime;

/**
 * Thực thể ApprovalLog lưu lịch sử thao tác phê duyệt/từ chối của Giám đốc (BOD).
 */
@Entity
@Table(name = "approval_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType; // CONTRACT, PAYROLL, LEAVE, ORDER, PROD_PLAN

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "action", nullable = false, length = 50)
    private String action; // APPROVE, REJECT

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private Employee actor; // Giám đốc thực hiện hành động

    @Column(length = 500)
    private String reason; // Lý do từ chối (hoặc lý do phê duyệt)

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
