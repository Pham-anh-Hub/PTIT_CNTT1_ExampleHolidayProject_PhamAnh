package oasis_system.oasis_system.modules.bod.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.bod.dto.ActionReasonDto;
import oasis_system.oasis_system.modules.bod.dto.ProductionBottleneckDto;
import oasis_system.oasis_system.modules.bod.dto.ProductionProgressDto;
import oasis_system.oasis_system.modules.bod.service.BodProductionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BodProductionController cung cấp các API REST cho Ban Giám đốc (BOD) phê duyệt kế hoạch sản xuất và giám sát tiến độ xưởng.
 */
@RestController
@RequestMapping("/api/v1/bod/production")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BOD', 'DIRECTOR')")
public class BodProductionController {

    private final BodProductionService bodProductionService;

    // ==================== 1. PHÊ DUYỆT KẾ HOẠCH SẢN XUẤT (APPROVAL QUEUE) ====================

    @GetMapping("/plans/pending")
    public ResponseEntity<ApiResponse<List<ProductionProgressDto>>> getPendingProductionPlans() {
        List<ProductionProgressDto> pendingPlans = bodProductionService.getPendingProductionPlans();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách kế hoạch sản xuất chờ duyệt thành công.", pendingPlans));
    }

    @PutMapping("/plans/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveProductionPlan(@PathVariable Long id) {
        bodProductionService.approveProductionPlan(id);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt Kế hoạch sản xuất #" + id + " thành công.", null));
    }

    @PutMapping("/plans/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectProductionPlan(
            @PathVariable Long id,
            @RequestBody(required = false) @Valid ActionReasonDto reasonDto) {
        String reason = reasonDto != null ? reasonDto.getReason() : "Từ chối kế hoạch sản xuất.";
        bodProductionService.rejectProductionPlan(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối Kế hoạch sản xuất #" + id + ".", null));
    }

    // ==================== 2. GIÁM SÁT TIẾN ĐỘ & NÚT THẮT CỔ CHAI (PROGRESS & BOTTLENECK) ====================

    @GetMapping("/progress")
    public ResponseEntity<ApiResponse<List<ProductionProgressDto>>> getProductionProgressList() {
        List<ProductionProgressDto> progressList = bodProductionService.getProductionProgressList();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tiến độ sản xuất toàn xưởng thành công.", progressList));
    }

    @GetMapping("/bottlenecks")
    public ResponseEntity<ApiResponse<List<ProductionBottleneckDto>>> getProductionBottlenecks() {
        List<ProductionBottleneckDto> bottlenecks = bodProductionService.getProductionBottlenecks();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách công đoạn bị tắc nghẽn sản xuất thành công.", bottlenecks));
    }
}
