package oasis_system.oasis_system.modules.bod.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.security.CustomUserDetails;
import oasis_system.oasis_system.modules.bod.dto.FinancialHealthRadarDto;
import oasis_system.oasis_system.modules.bod.dto.PayrollDisbursementAnalysisDto;
import oasis_system.oasis_system.modules.bod.entity.ApprovalLog;
import oasis_system.oasis_system.modules.bod.repository.ApprovalLogRepository;
import oasis_system.oasis_system.modules.crm.entity.Customer;
import oasis_system.oasis_system.modules.crm.entity.Order;
import oasis_system.oasis_system.modules.crm.entity.Payment;
import oasis_system.oasis_system.modules.crm.repository.CustomerRepository;
import oasis_system.oasis_system.modules.crm.repository.OrderRepository;
import oasis_system.oasis_system.modules.crm.repository.PaymentRepository;
import oasis_system.oasis_system.modules.hrm.entity.Employee;
import oasis_system.oasis_system.modules.hrm.entity.Payroll;
import oasis_system.oasis_system.modules.hrm.repository.EmployeeRepository;
import oasis_system.oasis_system.modules.hrm.repository.PayrollRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * BodFinanceService quản lý các nghiệp vụ kiểm soát tài chính và duyệt chi cho Ban Giám đốc (BOD).
 */
@Service
@RequiredArgsConstructor
public class BodFinanceService {

    private final PayrollRepository payrollRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
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

    // ==================== 1. PHÊ DUYỆT QUỸ LƯƠNG TỔNG (ỦY NHIỆM CHI NGÂN HÀNG) ====================

    /**
     * Lấy danh sách các chu kỳ lương chờ BOD duyệt chi gửi ngân hàng cho Kế toán.
     */
    @Transactional(readOnly = true)
    public List<String> getPendingPayrollDisbursements() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<Object[]> summaries = payrollRepository.getMonthlyPayrollSummary(companyId);
        List<String> pendingPeriods = new ArrayList<>();
        for (Object[] row : summaries) {
            String period = (String) row[0];
            String status = (String) row[5];
            if ("draft".equalsIgnoreCase(status)) {
                pendingPeriods.add(period);
            }
        }
        return pendingPeriods;
    }

    /**
     * Phân tích cơ cấu quỹ lương theo chu kỳ, nhận diện 3 mô hình trả lương (Khoán 100%, Cố định 100%, Hỗn hợp).
     */
    @Transactional(readOnly = true)
    public PayrollDisbursementAnalysisDto getPayrollDisbursementAnalysis(String period) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<Payroll> payrolls = payrollRepository.findByCompanyIdAndPeriod(companyId, period);
        if (payrolls.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy dữ liệu bảng lương của chu kỳ tháng: " + period);
        }

        BigDecimal totalFixed = BigDecimal.ZERO;
        BigDecimal totalProd = BigDecimal.ZERO;
        BigDecimal totalOutflow = BigDecimal.ZERO;
        String status = "draft";

        for (Payroll p : payrolls) {
            BigDecimal base = p.getBaseComponent() != null ? p.getBaseComponent() : BigDecimal.ZERO;
            BigDecimal allow = p.getAllowance() != null ? p.getAllowance() : BigDecimal.ZERO;
            BigDecimal ot = p.getOvertimeAmount() != null ? p.getOvertimeAmount() : BigDecimal.ZERO;

            BigDecimal fixedComponent = base.add(allow).add(ot);
            BigDecimal prodComponent = p.getProductionComponent() != null ? p.getProductionComponent() : BigDecimal.ZERO;
            BigDecimal net = p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO;

            totalFixed = totalFixed.add(fixedComponent);
            totalProd = totalProd.add(prodComponent);
            totalOutflow = totalOutflow.add(net);
            status = p.getStatus();
        }

        BigDecimal totalSalary = totalFixed.add(totalProd);
        double ratioFixed = 0.0;
        double ratioProd = 0.0;
        if (totalSalary.compareTo(BigDecimal.ZERO) > 0) {
            ratioFixed = totalFixed.multiply(new BigDecimal("100"))
                    .divide(totalSalary, 2, RoundingMode.HALF_UP).doubleValue();
            ratioProd = totalProd.multiply(new BigDecimal("100"))
                    .divide(totalSalary, 2, RoundingMode.HALF_UP).doubleValue();
        }

        // Nhận diện mô hình trả lương của doanh nghiệp
        String modelType;
        boolean alertFlag = false;
        String message;

        if (totalFixed.compareTo(BigDecimal.ZERO) == 0 || ratioFixed < 5.0) {
            modelType = "PURE_PIECE_RATE";
            message = "Doanh nghiệp áp dụng 100% Lương khoán sản lượng (Năng suất) - Chi phí nhân công tối ưu linh hoạt theo sản phẩm.";
        } else if (totalProd.compareTo(BigDecimal.ZERO) == 0) {
            modelType = "PURE_FIXED";
            message = "Doanh nghiệp áp dụng 100% Lương cố định định kỳ.";
        } else {
            modelType = "HYBRID";
            if (ratioFixed > 75.0) {
                alertFlag = true;
                message = "CẢNH BÁO: Tỷ trọng lương cố định chiếm " + ratioFixed + "% (vượt ngưỡng 75%). Doanh nghiệp có rủi ro gồng gánh chi phí cố định quá tải khi sản lượng sản xuất sụt giảm.";
            } else {
                message = "Cơ cấu lương cân bằng hợp lý giữa Cố định (" + ratioFixed + "%) và Sản xuất (" + ratioProd + "%).";
            }
        }

        return PayrollDisbursementAnalysisDto.builder()
                .period(period)
                .totalFixedCost(totalFixed)
                .totalProductionCost(totalProd)
                .totalOutflow(totalOutflow)
                .ratioFixed(ratioFixed)
                .ratioProduction(ratioProd)
                .payrollModelType(modelType)
                .riskAlertFlag(alertFlag)
                .analysisMessage(message)
                .status(status)
                .build();
    }

    /**
     * BOD phê duyệt duyệt chi quỹ lương tổng gửi Ngân hàng cho Kế toán.
     */
    @Transactional
    public void authorizePayrollDisbursement(String period) {
        Long companyId = TenantContext.getCurrentTenant();
        Employee actor = getCurrentActor();

        List<Payroll> payrolls = payrollRepository.findByCompanyIdAndPeriod(companyId, period);
        if (payrolls.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy dữ liệu bảng lương của chu kỳ tháng: " + period);
        }

        for (Payroll p : payrolls) {
            p.setStatus("approved");
        }
        payrollRepository.saveAll(payrolls);

        // Lưu vết phê duyệt
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("PAYROLL_DISBURSEMENT")
                .documentId(0L)
                .action("APPROVE")
                .actor(actor)
                .reason("Phê duyệt duyệt chi Quỹ lương tháng " + period + " gửi Ngân hàng thực hiện chuyển khoản.")
                .build();
        approvalLogRepository.save(log);
    }

    // ==================== 2. RADAR SỨC KHỎE TÀI CHÍNH & LỢI NHUẬN RÒNG ====================

    /**
     * Lấy các chỉ số Radar Sức khỏe Tài chính và Lợi nhuận ròng thực tế.
     */
    @Transactional(readOnly = true)
    public FinancialHealthRadarDto getFinancialHealthRadar() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        // 1. Tính Doanh thu danh nghĩa (Sales chốt đơn)
        List<Order> approvedOrders = orderRepository.findByCompanyIdAndApprovalStatus(companyId, "Đã phê duyệt");
        BigDecimal nominalRev = approvedOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Tính Thực thu thực tế vào tài khoản
        List<Customer> customers = customerRepository.findByCompanyId(companyId);
        BigDecimal realInflow = BigDecimal.ZERO;
        for (Customer c : customers) {
            List<Payment> pList = paymentRepository.findPaymentsByCustomerId(c.getId());
            BigDecimal pSum = pList.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            realInflow = realInflow.add(pSum);
        }

        // 3. Tính Tổng chi phí vận hành (Quỹ lương đã chi)
        List<Payroll> allPayrolls = payrollRepository.findByCompanyId(companyId);
        BigDecimal totalExpenses = allPayrolls.stream()
                .map(Payroll::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Lợi nhuận ròng thực tế = Thực thu - Tổng chi phí
        BigDecimal netProfit = realInflow.subtract(totalExpenses);

        // 5. Tính các tỷ lệ biên tài chính
        double netMargin = 0.0;
        double inflowEfficiency = 0.0;
        double expenseRatio = 0.0;

        if (realInflow.compareTo(BigDecimal.ZERO) > 0) {
            netMargin = netProfit.multiply(new BigDecimal("100"))
                    .divide(realInflow, 2, RoundingMode.HALF_UP).doubleValue();
            expenseRatio = totalExpenses.multiply(new BigDecimal("100"))
                    .divide(realInflow, 2, RoundingMode.HALF_UP).doubleValue();
        }

        if (nominalRev.compareTo(BigDecimal.ZERO) > 0) {
            inflowEfficiency = realInflow.multiply(new BigDecimal("100"))
                    .divide(nominalRev, 2, RoundingMode.HALF_UP).doubleValue();
        }

        // 6. Đưa ra thông điệp cảnh báo rủi ro tự động
        String warningMsg;
        if (nominalRev.compareTo(BigDecimal.ZERO) > 0 && inflowEfficiency < 50.0) {
            warningMsg = "CẢNH BÁO CÔNG NỢ: Thực thu chỉ đạt " + inflowEfficiency + "% so với Doanh thu danh nghĩa. Kinh doanh đang cho bán nợ quá nhiều, cần siết công nợ.";
        } else if (netProfit.compareTo(BigDecimal.ZERO) < 0) {
            warningMsg = "CẢNH BÁO BÁO ĐỘNG: Lợi nhuận ròng đang bị âm " + netProfit.abs() + "đ. Chi phí vận hành đang vượt quá dòng tiền thực thu.";
        } else {
            warningMsg = "Sức khỏe tài chính và dòng tiền ổn định. Biên lợi nhuận ròng đạt " + netMargin + "%.";
        }

        return FinancialHealthRadarDto.builder()
                .nominalRevenue(nominalRev)
                .realCashInflow(realInflow)
                .totalOperatingExpenses(totalExpenses)
                .netProfit(netProfit)
                .netProfitMargin(netMargin)
                .cashInflowEfficiency(inflowEfficiency)
                .expenseToRevenueRatio(expenseRatio)
                .financialWarningMessage(warningMsg)
                .build();
    }
}
