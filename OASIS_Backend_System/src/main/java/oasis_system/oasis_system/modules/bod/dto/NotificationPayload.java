package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * NotificationPayload đóng gói dữ liệu thông báo thời gian thực gửi đến BOD qua WebSocket.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPayload {
    private Long id; // ID lưu trữ trong database
    private String title;
    private String message;
    private String type; // ORDER, CONTRACT, PROD_PLAN
    private Long referenceId;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
