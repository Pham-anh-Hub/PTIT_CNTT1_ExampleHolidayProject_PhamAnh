package oasis_system.oasis_system.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Thực thể Role ánh xạ tới bảng 'roles' trong Cơ sở dữ liệu.
 * Quản lý các vai trò phân quyền (ví dụ: Admin, HR, Sales, Trưởng phòng, Chủ doanh nghiệp).
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company; // Nullable đối với các vai trò mặc định toàn hệ thống

    @Column(nullable = false, length = 100)
    private String name;

    private String description;
}
