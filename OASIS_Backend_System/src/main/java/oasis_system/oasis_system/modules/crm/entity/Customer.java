package oasis_system.oasis_system.modules.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;

/**
 * Thực thể Customer ánh xạ tới bảng 'customers' trong Cơ sở dữ liệu.
 * Quản lý thông tin khách hàng phục vụ cho mô-đun CRM và Sales.
 */
@Entity
@Table(name = "customers", 
       uniqueConstraints = @UniqueConstraint(name = "unique_customer_code_company", columnNames = {"code", "company_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    private String phone;
    private String email;
    private String address;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String type = "cá nhân"; // cá nhân, doanh nghiệp
}
