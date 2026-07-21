package oasis_system.oasis_system.modules.bod.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * ActionReasonDto dùng để tiếp nhận lý do khi phê duyệt bị từ chối.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionReasonDto {
    @Size(max = 500, message = "Lý do không được vượt quá 500 ký tự.")
    private String reason;
}
