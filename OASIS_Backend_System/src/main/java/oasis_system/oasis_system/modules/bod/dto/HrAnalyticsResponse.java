package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.util.Map;

/**
 * HrAnalyticsResponse chứa số liệu phân tích cơ cấu và biến động nhân sự cho Dashboard Giám đốc.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrAnalyticsResponse {
    private long totalActiveEmployees;      // Tổng số nhân sự đang làm việc (Thử việc + Chính thức)
    private long newHiresLastMonth;         // Nhân viên mới tuyển dụng trong 30 ngày qua
    private long resignedEmployees;         // Nhân viên đã nghỉ việc
    private Map<String, Long> employeesByDepartment; // Phân bổ số nhân sự hoạt động theo phòng ban
    private Map<String, Long> employeesByPosition;   // Phân bổ số nhân sự hoạt động theo chức vụ/chức danh
}
