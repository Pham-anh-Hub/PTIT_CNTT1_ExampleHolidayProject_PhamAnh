package oasis_system.oasis_system.modules.bod.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.security.CustomUserDetails;
import oasis_system.oasis_system.modules.bod.dto.CustomerDebtAgingDto;
import oasis_system.oasis_system.modules.bod.dto.CustomerSummaryDto;
import oasis_system.oasis_system.modules.bod.dto.OrderDetailWithDebtDto;
import oasis_system.oasis_system.modules.bod.entity.ApprovalLog;
import oasis_system.oasis_system.modules.bod.repository.ApprovalLogRepository;
import oasis_system.oasis_system.modules.crm.entity.Customer;
import oasis_system.oasis_system.modules.crm.entity.Order;
import oasis_system.oasis_system.modules.crm.entity.OrderDetail;
import oasis_system.oasis_system.modules.crm.entity.Payment;
import oasis_system.oasis_system.modules.crm.repository.CustomerRepository;
import oasis_system.oasis_system.modules.crm.repository.OrderDetailRepository;
import oasis_system.oasis_system.modules.crm.repository.OrderRepository;
import oasis_system.oasis_system.modules.crm.repository.PaymentRepository;
import oasis_system.oasis_system.modules.hrm.entity.Employee;
import oasis_system.oasis_system.modules.hrm.repository.EmployeeRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * BodSalesService quản lý các hoạt động phê duyệt đơn hàng, theo dõi công nợ FIFO và danh mục khách hàng.
 */
@Service
@RequiredArgsConstructor
public class BodSalesService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final CustomerRepository customerRepository;
    private final PaymentRepository paymentRepository;
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

    // ==================== 1. NGHIỆP VỤ PHÊ DUYỆT ĐƠN HÀNG (ORDERS) ====================

    /**
     * Lấy danh sách các đơn hàng ở trạng thái Chờ duyệt.
     */
    @Transactional(readOnly = true)
    public List<Order> getPendingOrders() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        return orderRepository.findByCompanyIdAndApprovalStatus(companyId, "Chờ duyệt");
    }

    /**
     * Xem thông tin chi tiết đơn hàng cùng các chỉ số kiểm soát rủi ro (Nợ khách hàng, Chiết khấu).
     */
    @Transactional(readOnly = true)
    public OrderDetailWithDebtDto getOrderDetailWithDebt(Long id) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt hàng có ID: " + id));

        if (!order.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo bảo mật: Bạn không có quyền truy cập đơn hàng này.");
        }

        List<OrderDetail> details = orderDetailRepository.findByOrderId(id);

        // 1. Tính toán dư nợ hiện tại của khách hàng này
        Long customerId = order.getCustomer().getId();
        List<Order> approvedOrders = orderRepository.findApprovedOrdersByCustomerId(customerId);
        BigDecimal totalOrdered = approvedOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Payment> payments = paymentRepository.findPaymentsByCustomerId(customerId);
        BigDecimal totalPaid = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal customerTotalDebt = totalOrdered.subtract(totalPaid);

        // 2. Tìm mức chiết khấu cao nhất trong đơn hàng
        double maxDiscountPercent = 0.0;
        for (OrderDetail item : details) {
            BigDecimal standardPrice = item.getProduct().getSalePrice();
            if (standardPrice != null && standardPrice.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal unitPrice = item.getUnitPrice();
                if (unitPrice.compareTo(standardPrice) < 0) {
                    BigDecimal diff = standardPrice.subtract(unitPrice);
                    double discountPercent = diff.multiply(new BigDecimal("100"))
                            .divide(standardPrice, 2, java.math.RoundingMode.HALF_UP).doubleValue();
                    if (discountPercent > maxDiscountPercent) {
                        maxDiscountPercent = discountPercent;
                    }
                }
            }
        }

        return OrderDetailWithDebtDto.builder()
                .order(order)
                .orderDetails(details)
                .customerTotalDebt(customerTotalDebt)
                .maxDiscountPercent(maxDiscountPercent)
                .build();
    }

    /**
     * Phê duyệt đơn hàng.
     */
    @Transactional
    public void approveOrder(Long id) {
        Long companyId = TenantContext.getCurrentTenant();
        Employee actor = getCurrentActor();

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt hàng có ID: " + id));

        if (!order.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo bảo mật: Bạn không có quyền phê duyệt đơn hàng này.");
        }

        order.setApprovalStatus("Đã phê duyệt");
        order.setStatus("Xác nhận");
        order.setApprovedBy(actor);
        orderRepository.save(order);

        // Ghi log
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("ORDER")
                .documentId(id)
                .action("APPROVE")
                .actor(actor)
                .reason("Phê duyệt đơn đặt hàng trị giá " + order.getTotalAmount() + "đ của khách hàng " + order.getCustomer().getName())
                .build();
        approvalLogRepository.save(log);
    }

    /**
     * Từ chối đơn hàng.
     */
    @Transactional
    public void rejectOrder(Long id, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Lý do từ chối không được để trống.");
        }

        Long companyId = TenantContext.getCurrentTenant();
        Employee actor = getCurrentActor();

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt hàng có ID: " + id));

        if (!order.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo bảo mật: Bạn không có quyền từ chối đơn hàng này.");
        }

        order.setApprovalStatus("Bị từ chối");
        orderRepository.save(order);

        // Ghi log
        ApprovalLog log = ApprovalLog.builder()
                .company(actor.getCompany())
                .documentType("ORDER")
                .documentId(id)
                .action("REJECT")
                .actor(actor)
                .reason(reason)
                .build();
        approvalLogRepository.save(log);
    }

    // ==================== 2. QUẢN TRỊ RỦI RO CÔNG NỢ (AGING REPORT FIFO) ====================

    /**
     * Lấy báo cáo tuổi nợ của khách hàng áp dụng đối soát FIFO.
     */
    @Transactional(readOnly = true)
    public List<CustomerDebtAgingDto> getCustomerDebtAgingReport() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<Customer> customers = customerRepository.findByCompanyId(companyId);
        List<CustomerDebtAgingDto> agingReport = new ArrayList<>();

        for (Customer customer : customers) {
            // Lấy tất cả đơn hàng đã được duyệt, sắp xếp tăng dần theo ngày lên đơn (cũ nhất lên trước)
            List<Order> orders = orderRepository.findApprovedOrdersByCustomerId(customer.getId());
            orders.sort(Comparator.comparing(Order::getOrderDate));

            // Tính tổng tiền mua
            BigDecimal totalOrdered = orders.stream()
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Lấy tổng thanh toán của khách hàng
            List<Payment> payments = paymentRepository.findPaymentsByCustomerId(customer.getId());
            BigDecimal totalPaid = payments.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalDebt = totalOrdered.subtract(totalPaid);

            // Phân bổ công nợ vào các nhóm tuổi nợ theo FIFO
            BigDecimal remainingPaid = totalPaid;
            BigDecimal agingUnder30 = BigDecimal.ZERO;
            BigDecimal aging30To60 = BigDecimal.ZERO;
            BigDecimal aging60To90 = BigDecimal.ZERO;
            BigDecimal agingOver90 = BigDecimal.ZERO;

            for (Order order : orders) {
                BigDecimal orderAmount = order.getTotalAmount();
                BigDecimal unpaidAmount = BigDecimal.ZERO;

                if (remainingPaid.compareTo(orderAmount) >= 0) {
                    // Đơn hàng này đã được thanh toán hoàn toàn từ quỹ trả trước
                    remainingPaid = remainingPaid.subtract(orderAmount);
                } else if (remainingPaid.compareTo(BigDecimal.ZERO) > 0) {
                    // Đơn hàng này được trả một phần, phần còn nợ là sự chênh lệch
                    unpaidAmount = orderAmount.subtract(remainingPaid);
                    remainingPaid = BigDecimal.ZERO;
                } else {
                    // Không còn tiền thanh toán dư -> Đơn hàng này hoàn toàn là nợ
                    unpaidAmount = orderAmount;
                }

                if (unpaidAmount.compareTo(BigDecimal.ZERO) > 0) {
                    // Tính khoảng cách ngày từ ngày chốt đơn đến hôm nay
                    long days = ChronoUnit.DAYS.between(order.getOrderDate(), LocalDate.now());
                    if (days < 30) {
                        agingUnder30 = agingUnder30.add(unpaidAmount);
                    } else if (days < 60) {
                        aging30To60 = aging30To60.add(unpaidAmount);
                    } else if (days < 90) {
                        aging60To90 = aging60To90.add(unpaidAmount);
                    } else {
                        agingOver90 = agingOver90.add(unpaidAmount);
                    }
                }
            }

            agingReport.add(CustomerDebtAgingDto.builder()
                    .customerId(customer.getId())
                    .customerCode(customer.getCode())
                    .customerName(customer.getName())
                    .totalOrdered(totalOrdered)
                    .totalPaid(totalPaid)
                    .totalDebt(totalDebt)
                    .agingUnder30Days(agingUnder30)
                    .aging30To60Days(aging30To60)
                    .aging60To90Days(aging60To90)
                    .agingOver90Days(agingOver90)
                    .build());
        }

        return agingReport;
    }

    // ==================== 3. QUẢN TRỊ DANH MỤC KHÁCH HÀNG (CUSTOMER PORTFOLIO) ====================

    /**
     * Lấy danh sách tổng hợp khách hàng phục vụ BOD giám sát quy mô và sự phụ thuộc doanh thu.
     */
    @Transactional(readOnly = true)
    public List<CustomerSummaryDto> getCustomerSummaryList() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<Customer> customers = customerRepository.findByCompanyId(companyId);
        List<CustomerSummaryDto> summaryList = new ArrayList<>();

        for (Customer customer : customers) {
            List<Order> orders = orderRepository.findApprovedOrdersByCustomerId(customer.getId());
            
            BigDecimal totalOrdered = orders.stream()
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<Payment> payments = paymentRepository.findPaymentsByCustomerId(customer.getId());
            BigDecimal totalPaid = payments.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal currentDebt = totalOrdered.subtract(totalPaid);

            summaryList.add(CustomerSummaryDto.builder()
                    .id(customer.getId())
                    .code(customer.getCode())
                    .name(customer.getName())
                    .phone(customer.getPhone())
                    .email(customer.getEmail())
                    .address(customer.getAddress())
                    .type(customer.getType())
                    .totalOrdersCount(orders.size())
                    .totalOrderedAmount(totalOrdered)
                    .currentDebt(currentDebt)
                    .build());
        }

        return summaryList;
    }
}
