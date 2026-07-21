package oasis_system.oasis_system.modules.production.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.auth.repository.CompanyRepository;
import oasis_system.oasis_system.modules.auth.security.CustomUserDetails;
import oasis_system.oasis_system.modules.bod.entity.ApprovalLog;
import oasis_system.oasis_system.modules.bod.repository.ApprovalLogRepository;
import oasis_system.oasis_system.modules.crm.entity.Order;
import oasis_system.oasis_system.modules.crm.repository.OrderRepository;
import oasis_system.oasis_system.modules.hrm.entity.Employee;
import oasis_system.oasis_system.modules.hrm.repository.EmployeeRepository;
import oasis_system.oasis_system.modules.production.entity.*;
import oasis_system.oasis_system.modules.production.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ProductionPlanService quản lý các nghiệp vụ lập kế hoạch sản xuất, định mức vật tư BOM,
 * cập nhật công đoạn xưởng và tự động trừ/cộng kho.
 */
@Service
@RequiredArgsConstructor
public class ProductionPlanService {

    private final ProductionPlanRepository productionPlanRepository;
    private final ProductionStageRepository productionStageRepository;
    private final BomRepository bomRepository;
    private final InventoryRepository inventoryRepository;
    private final EmployeeRepository employeeRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final MaterialRepository materialRepository;
    private final ApprovalLogRepository approvalLogRepository;

    /**
     * Lấy nhân sự hiện tại thực hiện hành động.
     */
    private Employee getCurrentActor() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return employeeRepository.findByUserId(customUserDetails.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ nhân sự liên kết với tài khoản của bạn."));
        }
        throw new IllegalStateException("Bạn chưa đăng nhập hoặc phiên làm việc đã kết thúc.");
    }

    /**
     * Lấy toàn bộ danh sách kế hoạch sản xuất của doanh nghiệp hiện tại.
     */
    @Transactional(readOnly = true)
    public List<ProductionPlan> getAllPlans() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp. Vui lòng đăng nhập lại.");
        }
        return productionPlanRepository.findByCompanyId(companyId);
    }

    /**
     * Lập Kế hoạch Sản xuất mới (Hỗ trợ đơn hàng MTO hoặc tích trữ MTS).
     * Tự động kiểm tra vật tư theo định mức BOM.
     */
    @Transactional
    public ProductionPlan createPlan(Long orderId, Long productId, BigDecimal plannedQuantity, LocalDate startDate, LocalDate endDate, BigDecimal estimatedBudget) {
        Employee actor = getCurrentActor();
        Company company = actor.getCompany();

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + productId));

        Order order = null;
        if (orderId != null) {
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng với ID: " + orderId));
        }

        ProductionPlan plan = ProductionPlan.builder()
                .company(company)
                .order(order)
                .product(product)
                .plannedQuantity(plannedQuantity)
                .startDate(startDate)
                .endDate(endDate)
                .estimatedBudget(estimatedBudget != null ? estimatedBudget : BigDecimal.ZERO)
                .status("DRAFT")
                .approvalStatus("Chờ duyệt")
                .createdBy(actor)
                .createdAt(LocalDateTime.now())
                .build();

        plan = productionPlanRepository.save(plan);

        // Khởi tạo các công đoạn sản xuất mặc định dựa trên cấu hình mẫu
        createDefaultStages(plan);

        return plan;
    }

    /**
     * Kiểm tra định mức vật tư BOM so với tồn kho thực tế của Kế hoạch.
     * Trả về danh sách vật tư bị thiếu hụt.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> checkMaterialAvailability(Long planId) {
        ProductionPlan plan = productionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch sản xuất với ID: " + planId));
        
        Long companyId = plan.getCompany().getId();
        List<Bom> boms = bomRepository.findByProductId(plan.getProduct().getId());
        List<Map<String, Object>> shortages = new ArrayList<>();

        for (Bom bom : boms) {
            BigDecimal quantityNeeded = bom.getQuantityRequired().multiply(plan.getPlannedQuantity());
            
            Inventory inv = inventoryRepository.findByCompanyIdAndItemTypeAndItemId(companyId, "MATERIAL", bom.getMaterial().getId())
                    .orElse(null);
            
            BigDecimal currentQty = inv != null ? inv.getQuantity() : BigDecimal.ZERO;
            
            if (currentQty.compareTo(quantityNeeded) < 0) {
                Map<String, Object> item = new HashMap<>();
                item.put("materialId", bom.getMaterial().getId());
                item.put("materialName", bom.getMaterial().getName());
                item.put("materialCode", bom.getMaterial().getCode());
                item.put("required", quantityNeeded);
                item.put("available", currentQty);
                item.put("shortage", quantityNeeded.subtract(currentQty));
                shortages.add(item);
            }
        }
        return shortages;
    }

    /**
     * Trưởng xưởng cập nhật trạng thái công đoạn sản xuất.
     * Thực hiện tự động trừ kho nguyên vật liệu ở công đoạn 1 và cộng kho thành phẩm ở công đoạn cuối.
     */
    @Transactional
    public void updateStageStatus(Long planId, Long stageId, String status) {
        ProductionPlan plan = productionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch sản xuất với ID: " + planId));

        ProductionStage stage = productionStageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy công đoạn sản xuất với ID: " + stageId));

        if (!stage.getProductionPlan().getId().equals(planId)) {
            throw new IllegalArgumentException("Công đoạn này không thuộc kế hoạch sản xuất đã chỉ định.");
        }

        String oldStatus = stage.getStatus();
        stage.setStatus(status.toUpperCase());
        
        if ("IN_PROGRESS".equalsIgnoreCase(status)) {
            if (stage.getStartTime() == null) {
                stage.setStartTime(LocalDateTime.now());
            }
        } else if ("DONE".equalsIgnoreCase(status)) {
            stage.setEndTime(LocalDateTime.now());
            
            // Nếu là công đoạn đầu tiên (Chuẩn bị NVL) -> Trừ kho vật tư
            if (stage.getSequenceNo() == 1 && !"DONE".equalsIgnoreCase(oldStatus)) {
                deductMaterialsFromInventory(plan);
            }
            
            // Kiểm tra xem tất cả các công đoạn đã hoàn thành chưa để hoàn tất kế hoạch
            checkAndCompletePlan(plan);
        }
        productionStageRepository.save(stage);
    }

    /**
     * Trưởng xưởng gửi đề xuất cấp bù vật tư hao hụt trình BOD phê duyệt.
     */
    @Transactional
    public void requestSurplusMaterial(Long planId, Long materialId, BigDecimal quantity, String reason) {
        Employee actor = getCurrentActor();
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nguyên vật liệu với ID: " + materialId));

        // Lưu yêu cầu cấp bù vào lịch sử phê duyệt ở trạng thái Chờ duyệt
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("PROD_SUPPLY")
                .documentId(planId)
                .action("REQUEST_SUPPLY")
                .actor(actor)
                .reason(materialId + ":" + quantity + ":" + reason)
                .createdAt(LocalDateTime.now())
                .build();
        
        approvalLogRepository.save(log);
    }

    /**
     * Khởi tạo các công đoạn sản xuất mẫu mặc định cho kế hoạch.
     */
    private void createDefaultStages(ProductionPlan plan) {
        String[] stageNames = {
            "1. Chuẩn bị nguyên vật liệu",
            "2. Cắt gỗ & Tạo hình phôi",
            "3. Lắp ráp kết cấu sản phẩm",
            "4. Chà nhám & Sơn phủ PU",
            "5. Đóng gói & Nhập kho thành phẩm"
        };
        
        for (int i = 0; i < stageNames.length; i++) {
            ProductionStage stage = ProductionStage.builder()
                    .productionPlan(plan)
                    .stageName(stageNames[i])
                    .sequenceNo(i + 1)
                    .status("PENDING")
                    .payType(i == 1 || i == 2 ? "PIECE_RATE" : "HOURLY")
                    .rate(i == 1 || i == 2 ? BigDecimal.valueOf(30000) : BigDecimal.valueOf(45000))
                    .build();
            productionStageRepository.save(stage);
        }
    }

    /**
     * Logic trừ nguyên vật liệu từ kho dựa trên định mức BOM.
     */
    private void deductMaterialsFromInventory(ProductionPlan plan) {
        Long companyId = plan.getCompany().getId();
        List<Bom> boms = bomRepository.findByProductId(plan.getProduct().getId());

        for (Bom bom : boms) {
            BigDecimal qtyToDeduct = bom.getQuantityRequired().multiply(plan.getPlannedQuantity());
            
            Inventory inv = inventoryRepository.findByCompanyIdAndItemTypeAndItemId(companyId, "MATERIAL", bom.getMaterial().getId())
                    .orElseGet(() -> Inventory.builder()
                            .company(plan.getCompany())
                            .itemType("MATERIAL")
                            .itemId(bom.getMaterial().getId())
                            .quantity(BigDecimal.ZERO)
                            .build());

            BigDecimal newQty = inv.getQuantity().subtract(qtyToDeduct);
            inv.setQuantity(newQty);
            inv.setUpdatedAt(LocalDateTime.now());
            inventoryRepository.save(inv);
        }
    }

    /**
     * Logic tự động cộng kho thành phẩm khi hoàn tất toàn bộ công đoạn.
     */
    private void checkAndCompletePlan(ProductionPlan plan) {
        List<ProductionStage> stages = productionStageRepository.findByProductionPlanIdOrderBySequenceNoAsc(plan.getId());
        boolean allDone = true;
        for (ProductionStage s : stages) {
            if (!"DONE".equalsIgnoreCase(s.getStatus())) {
                allDone = false;
                break;
            }
        }

        if (allDone) {
            plan.setStatus("DONE");
            productionPlanRepository.save(plan);

            // Cộng kho thành phẩm
            Long companyId = plan.getCompany().getId();
            Inventory inv = inventoryRepository.findByCompanyIdAndItemTypeAndItemId(companyId, "PRODUCT", plan.getProduct().getId())
                    .orElseGet(() -> Inventory.builder()
                            .company(plan.getCompany())
                            .itemType("PRODUCT")
                            .itemId(plan.getProduct().getId())
                            .quantity(BigDecimal.ZERO)
                            .build());

            BigDecimal newQty = inv.getQuantity().add(plan.getPlannedQuantity());
            inv.setQuantity(newQty);
            inv.setUpdatedAt(LocalDateTime.now());
            inventoryRepository.save(inv);
        }
    }
}
