package oasis_system.oasis_system.modules.accounting.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.accounting.dto.CustomerDebtDto;
import oasis_system.oasis_system.modules.accounting.dto.PaymentScheduleDto;
import oasis_system.oasis_system.modules.accounting.entity.ReceiptVoucher;
import oasis_system.oasis_system.modules.accounting.repository.ReceiptVoucherRepository;
import oasis_system.oasis_system.modules.crm.entity.Customer;
import oasis_system.oasis_system.modules.crm.entity.Order;
import oasis_system.oasis_system.modules.crm.repository.CustomerRepository;
import oasis_system.oasis_system.modules.crm.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountingDebtService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final ReceiptVoucherRepository receiptVoucherRepository;

    public List<CustomerDebtDto> getCustomerDebts() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L;
        }

        List<Customer> customers = customerRepository.findByCompanyId(companyId);
        List<Order> orders = orderRepository.findByCompanyId(companyId);
        List<ReceiptVoucher> receipts = receiptVoucherRepository.findByCompanyId(companyId);

        Map<Long, List<Order>> customerOrdersMap = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getCustomer().getId()));

        Map<Long, BigDecimal> orderPaidMap = receipts.stream()
                .filter(r -> r.getOrderId() != null)
                .collect(Collectors.groupingBy(ReceiptVoucher::getOrderId,
                        Collectors.reducing(BigDecimal.ZERO, ReceiptVoucher::getAmount, BigDecimal::add)));

        List<CustomerDebtDto> result = new ArrayList<>();

        for (Customer c : customers) {
            List<Order> cOrders = customerOrdersMap.getOrDefault(c.getId(), new ArrayList<>());
            BigDecimal totalOrderValue = BigDecimal.ZERO;
            BigDecimal totalPaid = BigDecimal.ZERO;
            int unpaidCount = 0;

            for (Order o : cOrders) {
                totalOrderValue = totalOrderValue.add(o.getTotalAmount());
                BigDecimal paidForOrder = orderPaidMap.getOrDefault(o.getId(), BigDecimal.ZERO);
                totalPaid = totalPaid.add(paidForOrder);
                if (paidForOrder.compareTo(o.getTotalAmount()) < 0) {
                    unpaidCount++;
                }
            }

            BigDecimal remainingDebt = totalOrderValue.subtract(totalPaid);

            result.add(CustomerDebtDto.builder()
                    .customerId(c.getId())
                    .customerName(c.getName())
                    .totalOrdersValue(totalOrderValue)
                    .totalPaid(totalPaid)
                    .remainingDebt(remainingDebt.max(BigDecimal.ZERO))
                    .unpaidOrdersCount(unpaidCount)
                    .build());
        }

        return result;
    }

    public PaymentScheduleDto getPaymentSchedule(Long orderId) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L;
        }

        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            throw new RuntimeException("Đơn hàng không tồn tại");
        }

        Order order = orderOpt.get();
        List<ReceiptVoucher> receipts = receiptVoucherRepository.findByCompanyIdAndOrderId(companyId, orderId);

        BigDecimal paidAmount = BigDecimal.ZERO;
        List<PaymentScheduleDto.PaymentItem> items = new ArrayList<>();

        for (ReceiptVoucher r : receipts) {
            paidAmount = paidAmount.add(r.getAmount());
            items.add(PaymentScheduleDto.PaymentItem.builder()
                    .voucherCode(r.getVoucherCode())
                    .amount(r.getAmount())
                    .paymentMethod(r.getPaymentMethod())
                    .paidDate(r.getCreatedAt())
                    .note(r.getNote())
                    .build());
        }

        BigDecimal remainingDebt = order.getTotalAmount().subtract(paidAmount).max(BigDecimal.ZERO);

        return PaymentScheduleDto.builder()
                .orderId(order.getId())
                .orderTotalAmount(order.getTotalAmount())
                .paidAmount(paidAmount)
                .remainingDebt(remainingDebt)
                .payments(items)
                .build();
    }
}
