package oasis_system.oasis_system.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * CompanyUpdateDto chứa thông tin cập nhật cho một Doanh nghiệp khách hàng (Tenant).
 */
@Getter
@Setter
public class CompanyUpdateDto {

    @NotBlank(message = "Tên doanh nghiệp không được để trống")
    private String name;

    private String address;
    private String phone;

    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Gói dịch vụ không được để trống")
    private String subscriptionPlan; // TRIAL, BASIC, PRO, ENTERPRISE...
}
