package oasis_system.oasis_system.modules.bod.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.security.CustomUserDetails;
import oasis_system.oasis_system.modules.bod.dto.HrAnalyticsResponse;
import oasis_system.oasis_system.modules.bod.dto.PayrollSummaryDto;
import oasis_system.oasis_system.modules.bod.entity.ApprovalLog;
import oasis_system.oasis_system.modules.bod.repository.ApprovalLogRepository;
import oasis_system.oasis_system.modules.hrm.entity.*;
import oasis_system.oasis_system.modules.hrm.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * BodHrmService triển khai các nghiệp vụ giám sát và phê duyệt HRM của Giám đốc (BOD).
 */
@Service
@RequiredArgsConstructor
public class BodHrmService {

    private final ContractRepository contractRepository;
    private final PayrollRepository payrollRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final ApprovalLogRepository approvalLogRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Lấy thực thể Employee tương ứng với tài khoản đăng nhập hiện tại.
     */
    private Employee getCurrentActor() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return employeeRepository.findByUserId(customUserDetails.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ nhân sự liên kết với tài khoản của bạn."));
        }
        throw new IllegalStateException("Bạn chưa đăng nhập hoặc phiên làm việc đã kết thúc.");
    }

    // ==================== 1. PHÊ DUYỆT HỢP ĐỒNG LAO ĐỘNG ====================

    /**
     * Lấy danh sách hợp đồng chờ duyệt của doanh nghiệp.
     */
    @Transactional(readOnly = true)
    public List<Contract> getPendingContracts() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        return contractRepository.findByCompanyIdAndApprovalStatus(companyId, "Chờ duyệt");
    }

    /**
     * Phê duyệt hợp đồng lao động.
     */
    @Transactional
    public void approveContract(Long id) {
        Long companyId = TenantContext.getCurrentTenant();
        Employee actor = getCurrentActor();

        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng lao động có ID: " + id));

        if (!contract.getEmployee().getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo bảo mật: Bạn không có quyền phê duyệt hợp đồng này.");
        }

        contract.setApprovalStatus("Đã phê duyệt");
        contract.setStatus("active");
        contract.setApprovedBy(actor);
        contractRepository.save(contract);

        // Lưu vết phê duyệt
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("CONTRACT")
                .documentId(id)
                .action("APPROVE")
                .actor(actor)
                .reason("Phê duyệt hợp đồng nhân viên " + contract.getEmployee().getFullname())
                .build();
        approvalLogRepository.save(log);
    }

    /**
     * Từ chối phê duyệt hợp đồng lao động.
     */
    @Transactional
    public void rejectContract(Long id, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Lý do từ chối không được để trống.");
        }
        Long companyId = TenantContext.getCurrentTenant();
        Employee actor = getCurrentActor();

        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng lao động có ID: " + id));

        if (!contract.getEmployee().getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo bảo mật: Bạn không có quyền từ chối hợp đồng này.");
        }

        contract.setApprovalStatus("Bị từ chối");
        contractRepository.save(contract);

        // Lưu vết phê duyệt
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("CONTRACT")
                .documentId(id)
                .action("REJECT")
                .actor(actor)
                .reason(reason)
                .build();
        approvalLogRepository.save(log);
    }

    // ==================== 2. GIÁM SÁT VÀ PHÊ DUYỆT QUỸ LƯƠNG THÁNG ====================

    /**
     * Lấy tóm tắt lịch sử quỹ lương các tháng (Chu kỳ).
     */
    @Transactional(readOnly = true)
    public List<PayrollSummaryDto> getMonthlyPayrollSummary() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<Object[]> rawList = payrollRepository.getMonthlyPayrollSummary(companyId);
        List<PayrollSummaryDto> summaryList = new ArrayList<>();

        for (Object[] row : rawList) {
            String period = (String) row[0];
            BigDecimal fixedCost = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            BigDecimal prodCost = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
            BigDecimal deductions = row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO;
            BigDecimal net = row[4] != null ? new BigDecimal(row[4].toString()) : BigDecimal.ZERO;
            String status = (String) row[5];

            BigDecimal totalSalary = fixedCost.add(prodCost);
            double ratioFixed = 0.0;
            double ratioProd = 0.0;
            if (totalSalary.compareTo(BigDecimal.ZERO) > 0) {
                ratioFixed = fixedCost.multiply(new BigDecimal("100"))
                        .divide(totalSalary, 2, java.math.RoundingMode.HALF_UP).doubleValue();
                ratioProd = prodCost.multiply(new BigDecimal("100"))
                        .divide(totalSalary, 2, java.math.RoundingMode.HALF_UP).doubleValue();
            }

            summaryList.add(PayrollSummaryDto.builder()
                    .period(period)
                    .totalFixedCost(fixedCost)
                    .totalProductionCost(prodCost)
                    .totalDeduction(deductions)
                    .netSalary(net)
                    .status(status)
                    .ratioFixed(ratioFixed)
                    .ratioProduction(ratioProd)
                    .build());
        }

        return summaryList;
    }

    /**
     * Lấy chi tiết bảng lương từng nhân sự trong chu kỳ cụ thể.
     */
    @Transactional(readOnly = true)
    public List<Payroll> getPayrollDetailsByPeriod(String period) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        return payrollRepository.findByCompanyIdAndPeriod(companyId, period);
    }

    /**
     * Phê duyệt bảng lương (Chuyển draft sang approved).
     */
    @Transactional
    public void approvePayroll(String period) {
        Long companyId = TenantContext.getCurrentTenant();
        Employee actor = getCurrentActor();

        List<Payroll> payrolls = payrollRepository.findByCompanyIdAndPeriod(companyId, period);
        if (payrolls.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy dữ liệu lương của chu kỳ tháng: " + period);
        }

        for (Payroll p : payrolls) {
            p.setStatus("approved");
        }
        payrollRepository.saveAll(payrolls);

        // Lưu vết phê duyệt
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("PAYROLL")
                .documentId(0L) // ID 0 đại diện chung cho cả chu kỳ tháng
                .action("APPROVE")
                .actor(actor)
                .reason("Phê duyệt tổng quỹ lương tháng: " + period)
                .build();
        approvalLogRepository.save(log);
    }

    /**
     * Xác nhận đã chi tiền/Thanh toán bảng lương (Chuyển approved sang paid).
     */
    @Transactional
    public void payPayroll(String period) {
        Long companyId = TenantContext.getCurrentTenant();
        Employee actor = getCurrentActor();

        List<Payroll> payrolls = payrollRepository.findByCompanyIdAndPeriod(companyId, period);
        if (payrolls.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy dữ liệu lương của chu kỳ tháng: " + period);
        }

        for (Payroll p : payrolls) {
            p.setStatus("paid");
        }
        payrollRepository.saveAll(payrolls);

        // Lưu vết phê duyệt
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("PAYROLL")
                .documentId(0L)
                .action("PAY")
                .actor(actor)
                .reason("Xác nhận chi trả tiền bảng lương tháng: " + period)
                .build();
        approvalLogRepository.save(log);
    }

    // ==================== 3. THỐNG KÊ BIẾN ĐỘNG NHÂN SỰ ====================

    /**
     * Báo cáo phân tích sức khỏe nhân sự (HR Analytics).
     */
    @Transactional(readOnly = true)
    public HrAnalyticsResponse getHrAnalytics() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<Employee> allEmployees = employeeRepository.findByCompanyId(companyId);

        // 1. Số nhân sự đang làm việc (Khác Đã nghỉ việc)
        List<Employee> activeEmployees = allEmployees.stream()
                .filter(e -> !e.getStatus().equalsIgnoreCase("Đã nghỉ việc"))
                .toList();
        long totalActive = activeEmployees.size();

        // 2. Nhân sự đã nghỉ việc
        long totalResigned = allEmployees.stream()
                .filter(e -> e.getStatus().equalsIgnoreCase("Đã nghỉ việc"))
                .count();

        // 3. Nhân sự mới trong 30 ngày qua
        java.time.LocalDate thirtyDaysAgo = java.time.LocalDate.now().minusDays(30);
        long newHires = activeEmployees.stream()
                .filter(e -> e.getHireDate() != null && e.getHireDate().isAfter(thirtyDaysAgo))
                .count();

        // 4. Cơ cấu theo phòng ban (Chỉ tính nhân sự đang hoạt động)
        Map<String, Long> byDept = activeEmployees.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getDepartment() != null ? e.getDepartment().getName() : "Không có phòng ban",
                        Collectors.counting()
                ));

        // 5. Cơ cấu theo chức danh (Chỉ tính nhân sự đang hoạt động)
        Map<String, Long> byPos = activeEmployees.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getPosition() != null ? e.getPosition().getName() : "Không có chức danh",
                        Collectors.counting()
                ));

        return HrAnalyticsResponse.builder()
                .totalActiveEmployees(totalActive)
                .newHiresLastMonth(newHires)
                .resignedEmployees(totalResigned)
                .employeesByDepartment(byDept)
                .employeesByPosition(byPos)
                .build();
    }

    // ==================== 4. PHÊ DUYỆT NGHỈ PHÉP NGOẠI LỆ ====================

    /**
     * Lấy danh sách đơn nghỉ phép chờ duyệt.
     */
    @Transactional(readOnly = true)
    public List<LeaveRequest> getPendingLeaveRequests() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        return leaveRequestRepository.findByCompanyIdAndStatus(companyId, "Chờ duyệt");
    }

    /**
     * Phê duyệt đơn nghỉ phép.
     */
    @Transactional
    public void approveLeaveRequest(Long id) {
        Long companyId = TenantContext.getCurrentTenant();
        Employee actor = getCurrentActor();

        LeaveRequest req = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn xin nghỉ phép có ID: " + id));

        if (!req.getEmployee().getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo bảo mật: Bạn không có quyền phê duyệt đơn nghỉ phép này.");
        }

        req.setStatus("Đã duyệt");
        req.setApprover(actor);
        req.setApprovedAt(LocalDateTime.now());
        leaveRequestRepository.save(req);

        // Ghi log phê duyệt
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("LEAVE")
                .documentId(id)
                .action("APPROVE")
                .actor(actor)
                .reason("Phê duyệt đơn nghỉ phép của nhân viên " + req.getEmployee().getFullname())
                .build();
        approvalLogRepository.save(log);
    }

    /**
     * Từ chối đơn nghỉ phép.
     */
    @Transactional
    public void rejectLeaveRequest(Long id, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Lý do từ chối không được để trống.");
        }
        Long companyId = TenantContext.getCurrentTenant();
        Employee actor = getCurrentActor();

        LeaveRequest req = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn xin nghỉ phép có ID: " + id));

        if (!req.getEmployee().getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo bảo mật: Bạn không có quyền từ chối đơn nghỉ phép này.");
        }

        req.setStatus("Bị từ chối");
        req.setApprover(actor);
        req.setApprovedAt(LocalDateTime.now());
        leaveRequestRepository.save(req);

        // Ghi log phê duyệt
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("LEAVE")
                .documentId(id)
                .action("REJECT")
                .actor(actor)
                .reason(reason)
                .build();
        approvalLogRepository.save(log);
    }

    // ==================== 5. TRUY XUẤT LỊCH SỬ PHÊ DUYỆT ====================

    /**
     * Lấy toàn bộ lịch sử phê duyệt của doanh nghiệp.
     */
    @Transactional(readOnly = true)
    public List<ApprovalLog> getApprovalLogs() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        return approvalLogRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
    }
}
