package oasis_system.oasis_system.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.hrm.entity.Department;

/**
 * Thực thể UserRoleDepartment ánh xạ tới bảng trung gian 'user_role_departments' trong Cơ sở dữ liệu.
 * Cho phép một tài khoản (User) đảm nhiệm nhiều vai trò (Role) tại các phòng ban (Department) khác nhau,
 * hỗ trợ cơ chế phân quyền đa nhiệm và làm việc linh động.
 */
@Entity
@Table(name = "user_role_departments", 
       uniqueConstraints = @UniqueConstraint(name = "unique_user_role_dept", columnNames = {"user_id", "role_id", "department_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRoleDepartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;
}
