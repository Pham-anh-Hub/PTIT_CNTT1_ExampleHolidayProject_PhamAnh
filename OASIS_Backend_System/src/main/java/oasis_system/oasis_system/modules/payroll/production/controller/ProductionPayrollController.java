package oasis_system.oasis_system.modules.payroll.production.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.payroll.production.dto.ProductionPayrollDto;
import oasis_system.oasis_system.modules.payroll.production.service.ProductionPayrollService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ProductionPayrollController cung cấp các API để Kế toán lấy bảng lương sản xuất phân rã và duyệt chi lương.
 */
@RestController
@RequestMapping("/api/v1/payroll/production")
@RequiredArgsConstructor
public class ProductionPayrollController {

    private final ProductionPayrollService productionPayrollService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductionPayrollDto>>> getProductionPayroll(@RequestParam String period) {
        List<ProductionPayrollDto> list = productionPayrollService.getProductionPayrollList(period);
        return ResponseEntity.ok(ApiResponse.success("Lấy bảng lương khối sản xuất phân rã thành công", list));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolvePayroll(
            @PathVariable Long id,
            @RequestParam String period) {
        productionPayrollService.resolvePayroll(id, period);
        return ResponseEntity.ok(ApiResponse.success("Chuyển trạng thái lương sản xuất thành 'Đã giải quyết' thành công", null));
    }
}
