package oasis_system.oasis_system.modules.bod.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.security.CustomUserDetails;
import oasis_system.oasis_system.modules.bod.dto.ProductionBottleneckDto;
import oasis_system.oasis_system.modules.bod.dto.ProductionProgressDto;
import oasis_system.oasis_system.modules.bod.dto.ProductionStageDetailDto;
import oasis_system.oasis_system.modules.bod.entity.ApprovalLog;
import oasis_system.oasis_system.modules.bod.repository.ApprovalLogRepository;
import oasis_system.oasis_system.modules.hrm.entity.Employee;
import oasis_system.oasis_system.modules.hrm.repository.EmployeeRepository;
import oasis_system.oasis_system.modules.production.entity.ProductionPlan;
import oasis_system.oasis_system.modules.production.entity.ProductionStage;
import oasis_system.oasis_system.modules.production.repository.ProductionPlanRepository;
import oasis_system.oasis_system.modules.production.repository.ProductionStageRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * BodProductionService quản lý các nghiệp vụ kiểm soát tiến độ và phê duyệt kế hoạch sản xuất cho Giám đốc (BOD).
 */
@Service
@RequiredArgsConstructor
public class BodProductionService {

    private final ProductionPlanRepository productionPlanRepository;
    private final ProductionStageRepository productionStageRepository;
    private final ApprovalLogRepository approvalLogRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Lấy thực thể Employee tương ứng với tài khoản đăng nhập hiện tại của Giám đốc.
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
     * Lấy danh sách các Kế hoạch sản xuất MTO/MTS đang chờ BOD duyệt.
     */
    @Transactional(readOnly = true)
    public List<ProductionProgressDto> getPendingProductionPlans() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<ProductionPlan> pendingPlans = productionPlanRepository.findByCompanyIdAndApprovalStatus(companyId, "Chờ duyệt");
        List<ProductionProgressDto> dtos = new ArrayList<>();
        for (ProductionPlan plan : pendingPlans) {
            dtos.add(mapToProgressDto(plan));
        }
        return dtos;
    }

    /**
     * BOD bấm Phê duyệt Kế hoạch sản xuất (MTO/MTS).
     */
    @Transactional
    public void approveProductionPlan(Long planId) {
        Employee actor = getCurrentActor();
        ProductionPlan plan = productionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch sản xuất với ID: " + planId));

        plan.setApprovalStatus("Đã phê duyệt");
        plan.setStatus("IN_PROGRESS");
        plan.setApprovedBy(actor);
        productionPlanRepository.save(plan);

        // Lưu vết phê duyệt
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("PRODUCTION_PLAN")
                .documentId(planId)
                .action("APPROVE")
                .actor(actor)
                .reason("Phê duyệt Kế hoạch sản xuất #" + planId + " (" + plan.getProduct().getName() + ") và cấp phép xuất kho nguyên vật tư.")
                .build();
        approvalLogRepository.save(log);
    }

    /**
     * BOD bấm Từ chối Kế hoạch sản xuất.
     */
    @Transactional
    public void rejectProductionPlan(Long planId, String reason) {
        Employee actor = getCurrentActor();
        ProductionPlan plan = productionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch sản xuất với ID: " + planId));

        plan.setApprovalStatus("Bị từ chối");
        productionPlanRepository.save(plan);

        // Lưu vết từ chối
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("PRODUCTION_PLAN")
                .documentId(planId)
                .action("REJECT")
                .actor(actor)
                .reason(reason != null && !reason.isBlank() ? reason : "Từ chối phê duyệt kế hoạch sản xuất.")
                .build();
        approvalLogRepository.save(log);
    }

    /**
     * Lấy danh sách tiến độ sản xuất tổng thể của tất cả Kế hoạch thuộc doanh nghiệp.
     */
    @Transactional(readOnly = true)
    public List<ProductionProgressDto> getProductionProgressList() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<ProductionPlan> plans = productionPlanRepository.findByCompanyId(companyId);
        List<ProductionProgressDto> dtos = new ArrayList<>();
        for (ProductionPlan plan : plans) {
            dtos.add(mapToProgressDto(plan));
        }
        return dtos;
    }

    /**
     * Quét phát hiện các Công đoạn bị Tắc nghẽn (Bottleneck Radar) để BOD chỉ đạo điều phối tăng ca.
     */
    @Transactional(readOnly = true)
    public List<ProductionBottleneckDto> getProductionBottlenecks() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<ProductionStage> activeStages = productionStageRepository.findByCompanyIdAndStatus(companyId, "IN_PROGRESS");
        List<ProductionBottleneckDto> bottlenecks = new ArrayList<>();

        for (ProductionStage stage : activeStages) {
            LocalDateTime start = stage.getStartTime() != null ? stage.getStartTime() : stage.getProductionPlan().getCreatedAt();
            long stuckDays = Duration.between(start, LocalDateTime.now()).toDays();

            // Giả định công đoạn sản xuất quá 1 ngày ở trạng thái IN_PROGRESS là có dấu hiệu tắc nghẽn
            if (stuckDays >= 1) {
                String assigneeName = stage.getAssignee() != null ? stage.getAssignee().getFullname() : "Chưa phân công";
                String reason = "Tắc nghẽn sản xuất tại " + stage.getStageName() + ": Ứ đọng bán thành phẩm do thiếu nhân công tăng ca hoặc nghẽn công đoạn trước.";

                bottlenecks.add(ProductionBottleneckDto.builder()
                        .planId(stage.getProductionPlan().getId())
                        .productName(stage.getProductionPlan().getProduct().getName())
                        .stageName(stage.getStageName())
                        .sequenceNo(stage.getSequenceNo())
                        .assigneeName(assigneeName)
                        .stuckDurationDays(stuckDays)
                        .bottleneckReason(reason)
                        .warningMessage("CẢNH BÁO TẮC NGHẼN: Công đoạn " + stage.getStageName() + " đang bị ngưng trệ " + stuckDays + " ngày. Yêu cầu điều phối tăng ca gỡ vướng.")
                        .build());
            }
        }
        return bottlenecks;
    }

    /**
     * Map từ thực thể ProductionPlan sang DTO ProductionProgressDto (kèm danh sách chi tiết các công đoạn).
     */
    private ProductionProgressDto mapToProgressDto(ProductionPlan plan) {
        List<ProductionStage> stages = productionStageRepository.findByProductionPlanIdOrderBySequenceNoAsc(plan.getId());
        List<ProductionStageDetailDto> stageDtos = new ArrayList<>();

        int totalStages = stages.size();
        int completedStages = 0;
        String activeStageName = "Chưa khởi công";

        for (ProductionStage s : stages) {
            if ("DONE".equalsIgnoreCase(s.getStatus())) {
                completedStages++;
            } else if ("IN_PROGRESS".equalsIgnoreCase(s.getStatus())) {
                activeStageName = s.getStageName();
            }

            String assignee = s.getAssignee() != null ? s.getAssignee().getFullname() : "Tổ sản xuất chung";
            stageDtos.add(ProductionStageDetailDto.builder()
                    .stageId(s.getId())
                    .stageName(s.getStageName())
                    .sequenceNo(s.getSequenceNo())
                    .status(s.getStatus())
                    .assigneeName(assignee)
                    .payType(s.getPayType())
                    .rate(s.getRate())
                    .startTime(s.getStartTime() != null ? s.getStartTime().toString() : null)
                    .endTime(s.getEndTime() != null ? s.getEndTime().toString() : null)
                    .build());
        }

        double percent = 0.0;
        if (totalStages > 0) {
            percent = (double) completedStages / totalStages * 100.0;
            percent = Math.round(percent * 100.0) / 100.0;
        }

        return ProductionProgressDto.builder()
                .planId(plan.getId())
                .productName(plan.getProduct().getName())
                .productCode(plan.getProduct().getCode())
                .plannedQuantity(plan.getPlannedQuantity())
                .estimatedBudget(plan.getEstimatedBudget())
                .startDate(plan.getStartDate() != null ? plan.getStartDate().toString() : "")
                .endDate(plan.getEndDate() != null ? plan.getEndDate().toString() : "")
                .totalStages(totalStages)
                .completedStages(completedStages)
                .progressPercent(percent)
                .currentActiveStage(activeStageName)
                .status(plan.getStatus())
                .approvalStatus(plan.getApprovalStatus())
                .stages(stageDtos)
                .build();
    }
}
