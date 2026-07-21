package oasis_system.oasis_system.modules.production.controller;

import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.production.entity.ProductionPlan;
import oasis_system.oasis_system.modules.production.service.ProductionPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * ProductionPlanController cung cấp các API REST quản trị và điều phối phân xưởng sản xuất
 * dành cho Trưởng phòng Sản xuất / Quản đốc.
 */
@RestController
@RequestMapping("/api/v1/production")
@RequiredArgsConstructor
public class ProductionPlanController {

    private final ProductionPlanService productionPlanService;

    /**
     * Lấy toàn bộ danh sách kế hoạch sản xuất của doanh nghiệp hiện tại.
     */
    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<ProductionPlan>>> getAllPlans() {
        List<ProductionPlan> plans = productionPlanService.getAllPlans();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách kế hoạch sản xuất thành công.", plans));
    }

    /**
     * Lập Kế hoạch Sản xuất mới (MTS/MTO)
     */
    @PostMapping("/plans")
    public ResponseEntity<ApiResponse<ProductionPlan>> createPlan(@RequestBody @Valid CreatePlanRequest request) {
        ProductionPlan plan = productionPlanService.createPlan(
                request.getOrderId(),
                request.getProductId(),
                request.getPlannedQuantity(),
                request.getStartDate(),
                request.getEndDate(),
                request.getEstimatedBudget()
        );
        return ResponseEntity.ok(ApiResponse.success("Lập Kế hoạch sản xuất mới thành công.", plan));
    }

    /**
     * Kiểm tra định mức nguyên vật liệu BOM so với tồn kho thực tế.
     */
    @GetMapping("/plans/{id}/check-materials")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> checkMaterials(@PathVariable Long id) {
        List<Map<String, Object>> shortages = productionPlanService.checkMaterialAvailability(id);
        return ResponseEntity.ok(ApiResponse.success("Kiểm định tồn kho định mức BOM thành công.", shortages));
    }

    /**
     * Trưởng xưởng cập nhật trạng thái tiến trình công đoạn xưởng.
     */
    @PutMapping("/plans/{planId}/stages/{stageId}/status")
    public ResponseEntity<ApiResponse<Void>> updateStageStatus(
            @PathVariable Long planId,
            @PathVariable Long stageId,
            @RequestBody @Valid StageStatusRequest request) {
        productionPlanService.updateStageStatus(planId, stageId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái công đoạn thành công.", null));
    }

    /**
     * Gửi đề xuất cấp bù vật tư hao hụt xưởng trình BOD duyệt.
     */
    @PostMapping("/plans/{planId}/compensate-supply")
    public ResponseEntity<ApiResponse<Void>> requestSurplusMaterial(
            @PathVariable Long planId,
            @RequestBody @Valid SurplusRequest request) {
        productionPlanService.requestSurplusMaterial(
                planId,
                request.getMaterialId(),
                request.getQuantity(),
                request.getReason()
        );
        return ResponseEntity.ok(ApiResponse.success("Đã gửi đề xuất cấp bù vật tư hao hụt lên BOD.", null));
    }

    // --- DTO Requests ---

    @Data
    public static class CreatePlanRequest {
        private Long orderId;
        private Long productId;
        private BigDecimal plannedQuantity;
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal estimatedBudget;
    }

    @Data
    public static class StageStatusRequest {
        private String status;
    }

    @Data
    public static class SurplusRequest {
        private Long materialId;
        private BigDecimal quantity;
        private String reason;
    }
}
