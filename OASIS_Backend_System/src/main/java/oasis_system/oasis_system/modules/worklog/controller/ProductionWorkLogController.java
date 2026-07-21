package oasis_system.oasis_system.modules.worklog.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.worklog.dto.ProductionWorkLogDto;
import oasis_system.oasis_system.modules.worklog.service.ProductionWorkLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ProductionWorkLogController cung cấp API ghi nhận công nhật ký làm việc hằng ngày của công nhân sản xuất.
 */
@RestController
@RequestMapping("/api/v1/work-logs/production")
@RequiredArgsConstructor
public class ProductionWorkLogController {

    private final ProductionWorkLogService workLogService;

    @PostMapping("/daily")
    public ResponseEntity<ApiResponse<ProductionWorkLogDto>> createDailyWorkLog(@RequestBody ProductionWorkLogDto dto) {
        ProductionWorkLogDto result = workLogService.saveDailyWorkLog(dto);
        return ResponseEntity.ok(ApiResponse.success("Ghi nhận nhật ký công sản xuất thủ công thành công", result));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<ProductionWorkLogDto>>> getDailyWorkLogs(
            @RequestParam(name = "employee_id") Long employeeId,
            @RequestParam String period) {
        List<ProductionWorkLogDto> list = workLogService.getDailyWorkLogs(employeeId, period);
        return ResponseEntity.ok(ApiResponse.success("Lấy nhật ký công sản xuất hàng ngày trong tháng thành công", list));
    }
}
