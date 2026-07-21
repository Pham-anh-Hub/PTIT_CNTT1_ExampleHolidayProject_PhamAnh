package oasis_system.oasis_system.modules.payroll.production.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.hrm.entity.Employee;
import oasis_system.oasis_system.modules.hrm.entity.Payroll;
import oasis_system.oasis_system.modules.hrm.repository.PayrollRepository;
import oasis_system.oasis_system.modules.production.entity.ProductionStage;
import oasis_system.oasis_system.modules.production.entity.ProductionStageWorkLog;
import oasis_system.oasis_system.modules.production.repository.ProductionStageWorkLogRepository;
import oasis_system.oasis_system.modules.payroll.production.dto.ProductionPayrollDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

/**
 * ProductionPayrollService tổng hợp và phân rã các bản ghi nhật ký làm việc (work logs)
 * của công nhân sản xuất trong tháng thành bảng tính lương công đoạn cho Kế toán.
 */
@Service
@RequiredArgsConstructor
public class ProductionPayrollService {

    private final ProductionStageWorkLogRepository workLogRepository;
    private final PayrollRepository payrollRepository;

    /**
     * Lấy bảng lương công đoạn khối sản xuất phân rã theo loại hàng và sản phẩm của tháng (period).
     */
    @Transactional(readOnly = true)
    public List<ProductionPayrollDto> getProductionPayrollList(String period) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        YearMonth yearMonth = YearMonth.parse(period);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // Lấy tất cả nhật ký công việc của doanh nghiệp trong tháng
        List<ProductionStageWorkLog> logs = workLogRepository.findByCompanyIdAndDateRange(companyId, startDate, endDate);

        // Gom nhóm logs theo Employee
        Map<Employee, List<ProductionStageWorkLog>> employeeLogsMap = new HashMap<>();
        for (ProductionStageWorkLog log : logs) {
            employeeLogsMap.computeIfAbsent(log.getEmployee(), k -> new ArrayList<>()).add(log);
        }

        List<ProductionPayrollDto> dtos = new ArrayList<>();
        int stt = 1;

        for (Map.Entry<Employee, List<ProductionStageWorkLog>> entry : employeeLogsMap.entrySet()) {
            Employee emp = entry.getKey();
            List<ProductionStageWorkLog> empLogs = entry.getValue();

            // Gom nhóm tiếp theo sản phẩm + công đoạn để tạo chi tiết PayrollItem
            Map<String, Map<String, Object>> itemsGroupMap = new HashMap<>();
            BigDecimal totalAmount = BigDecimal.ZERO;
            int totalQuantity = 0;

            for (ProductionStageWorkLog log : empLogs) {
                ProductionStage stage = log.getProductionStage();
                String productTypeName = stage.getProductionPlan().getProduct().getName() + " (" + stage.getStageName() + ")";
                
                BigDecimal rate = stage.getRate();
                BigDecimal logAmount = log.getComputedAmount();
                int qty = log.getQuantityCompleted() != null ? log.getQuantityCompleted().intValue() : 0;

                totalAmount = totalAmount.add(logAmount);
                totalQuantity += qty;

                Map<String, Object> itemData = itemsGroupMap.computeIfAbsent(productTypeName, k -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("productType", productTypeName);
                    map.put("quantity", 0);
                    map.put("unitPrice", rate);
                    map.put("amount", BigDecimal.ZERO);
                    return map;
                });

                itemData.put("quantity", (int) itemData.get("quantity") + qty);
                itemData.put("amount", ((BigDecimal) itemData.get("amount")).add(logAmount));
            }

            List<ProductionPayrollDto.PayrollItem> payrollItems = new ArrayList<>();
            for (Map<String, Object> map : itemsGroupMap.values()) {
                payrollItems.add(ProductionPayrollDto.PayrollItem.builder()
                        .productType((String) map.get("productType"))
                        .quantity((Integer) map.get("quantity"))
                        .unitPrice((BigDecimal) map.get("unitPrice"))
                        .amount((BigDecimal) map.get("amount"))
                        .build());
            }

            // Xác định trạng thái thanh toán từ bảng lương tổng hợp
            String payrollStatus = "Chưa giải quyết";
            Optional<Payroll> payrollOpt = payrollRepository.findByEmployeeIdAndPeriod(emp.getId(), period);
            if (payrollOpt.isPresent()) {
                if ("paid".equalsIgnoreCase(payrollOpt.get().getStatus())) {
                    payrollStatus = "Đã giải quyết";
                }
            }

            dtos.add(ProductionPayrollDto.builder()
                    .stt(stt++)
                    .employeeId(emp.getId())
                    .employeeCode(emp.getEmployeeCode())
                    .employeeName(emp.getFullname())
                    .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : "Phân xưởng")
                    .items(payrollItems)
                    .totalQuantity(totalQuantity)
                    .totalAmount(totalAmount)
                    .status(payrollStatus)
                    .detailRedirectUrl("/work-logs/production/daily?employee_id=" + emp.getId() + "&period=" + period)
                    .build());
        }

        return dtos;
    }

    /**
     * Kế toán bấm Duyệt chi giải ngân lương sản xuất.
     */
    @Transactional
    public void resolvePayroll(Long employeeId, String period) {
        Payroll payroll = payrollRepository.findByEmployeeIdAndPeriod(employeeId, period)
                .orElseGet(() -> {
                    // Nếu chưa có bảng lương tổng hợp, khởi tạo mới tự động
                    Employee emp = Employee.builder().id(employeeId).build();
                    return Payroll.builder()
                            .employee(emp)
                            .period(period)
                            .status("draft")
                            .createdAt(LocalDateTime.now())
                            .build();
                });

        payroll.setStatus("paid");
        payrollRepository.save(payroll);
    }
}
