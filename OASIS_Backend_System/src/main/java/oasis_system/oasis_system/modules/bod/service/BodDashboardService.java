package oasis_system.oasis_system.modules.bod.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.bod.dto.CostStructureDto;
import oasis_system.oasis_system.modules.bod.dto.CustomerDebtDto;
import oasis_system.oasis_system.modules.bod.dto.KpiCardsResponse;
import oasis_system.oasis_system.modules.bod.dto.RevenueTrendDto;
import oasis_system.oasis_system.modules.bod.repository.BodDashboardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BodDashboardService {

    private final BodDashboardRepository bodDashboardRepository;

    /**
     * Lấy các chỉ số KPI hiển thị trên thẻ.
     */
    @Transactional(readOnly = true)
    public KpiCardsResponse getKpiCards() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        BigDecimal totalRevenue = bodDashboardRepository.getTotalRevenue(companyId);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;
        BigDecimal actualRevenue = bodDashboardRepository.getActualRevenue(companyId);
        if (actualRevenue == null) actualRevenue = BigDecimal.ZERO;
        BigDecimal totalProductionCost = bodDashboardRepository.getTotalProductionCost(companyId);
        if (totalProductionCost == null) totalProductionCost = BigDecimal.ZERO;
        BigDecimal totalLaborCost = bodDashboardRepository.getTotalLaborCost(companyId);
        if (totalLaborCost == null) totalLaborCost = BigDecimal.ZERO;
        BigDecimal totalTaxCost = bodDashboardRepository.getTotalTaxCost(companyId);
        if (totalTaxCost == null) totalTaxCost = BigDecimal.ZERO;

        BigDecimal totalCosts = totalProductionCost.add(totalLaborCost).add(totalTaxCost);
        BigDecimal netProfit = actualRevenue.subtract(totalCosts);
        BigDecimal totalDebt = totalRevenue.subtract(actualRevenue);

        return KpiCardsResponse.builder()
                .totalRevenue(totalRevenue)
                .actualRevenue(actualRevenue)
                .totalProductionCost(totalProductionCost)
                .netProfit(netProfit)
                .totalDebt(totalDebt)
                .build();
    }

    /**
     * Lấy xu hướng doanh thu thực thu và lợi nhuận ròng theo tháng để vẽ Combo Chart.
     */
    @Transactional(readOnly = true)
    public List<RevenueTrendDto> getRevenueTrend() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        // Lấy dữ liệu thô từ repository
        List<Object[]> actualRevenueRaw = bodDashboardRepository.getMonthlyActualRevenueTrend(companyId);
        List<Object[]> salesRaw = bodDashboardRepository.getMonthlySalesTrend(companyId);
        List<Object[]> productionCostRaw = bodDashboardRepository.getMonthlyProductionCostTrend(companyId);
        List<Object[]> laborCostRaw = bodDashboardRepository.getMonthlyLaborCostTrend(companyId);
        List<Object[]> taxCostRaw = bodDashboardRepository.getMonthlyTaxCostTrend(companyId);

        // Chuyển đổi sang Map để dễ tra cứu theo tháng (period: YYYY-MM)
        Map<String, BigDecimal> actualRevenueMap = convertToMap(actualRevenueRaw);
        Map<String, BigDecimal> salesMap = convertToMap(salesRaw);
        Map<String, BigDecimal> productionCostMap = convertToMap(productionCostRaw);
        Map<String, BigDecimal> laborCostMap = convertToMap(laborCostRaw);
        Map<String, BigDecimal> taxCostMap = convertToMap(taxCostRaw);

        // Gom tất cả các tháng xuất hiện trong dữ liệu
        Set<String> periods = new TreeSet<>();
        periods.addAll(actualRevenueMap.keySet());
        periods.addAll(salesMap.keySet());
        periods.addAll(productionCostMap.keySet());
        periods.addAll(laborCostMap.keySet());
        periods.addAll(taxCostMap.keySet());

        List<RevenueTrendDto> trendList = new ArrayList<>();
        for (String period : periods) {
            BigDecimal revenue = actualRevenueMap.getOrDefault(period, BigDecimal.ZERO);
            BigDecimal sales = salesMap.getOrDefault(period, BigDecimal.ZERO);
            BigDecimal prodCost = productionCostMap.getOrDefault(period, BigDecimal.ZERO);
            BigDecimal laborCost = laborCostMap.getOrDefault(period, BigDecimal.ZERO);
            BigDecimal taxCost = taxCostMap.getOrDefault(period, BigDecimal.ZERO);

            BigDecimal totalCost = prodCost.add(laborCost).add(taxCost);
            BigDecimal profit = revenue.subtract(totalCost);

            trendList.add(RevenueTrendDto.builder()
                    .period(period)
                    .revenue(revenue)
                    .sales(sales)
                    .profit(profit)
                    .build());
        }

        // Giới hạn hiển thị 12 tháng gần nhất (nếu nhiều hơn)
        if (trendList.size() > 12) {
            trendList = trendList.subList(trendList.size() - 12, trendList.size());
        }

        return trendList;
    }

    /**
     * Lấy cấu trúc chi phí doanh nghiệp để vẽ Donut Chart.
     */
    @Transactional(readOnly = true)
    public List<CostStructureDto> getCostStructure() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        BigDecimal totalProductionCost = bodDashboardRepository.getTotalProductionCost(companyId);
        if (totalProductionCost == null) totalProductionCost = BigDecimal.ZERO;
        BigDecimal totalLaborCost = bodDashboardRepository.getTotalLaborCost(companyId);
        if (totalLaborCost == null) totalLaborCost = BigDecimal.ZERO;
        BigDecimal totalTaxCost = bodDashboardRepository.getTotalTaxCost(companyId);
        if (totalTaxCost == null) totalTaxCost = BigDecimal.ZERO;

        BigDecimal totalCost = totalProductionCost.add(totalLaborCost).add(totalTaxCost);

        List<CostStructureDto> costStructureList = new ArrayList<>();

        if (totalCost.compareTo(BigDecimal.ZERO) == 0) {
            costStructureList.add(new CostStructureDto("Chi phí vật tư sản xuất", BigDecimal.ZERO, 0.0));
            costStructureList.add(new CostStructureDto("Chi phí lương thợ/nhân sự", BigDecimal.ZERO, 0.0));
            costStructureList.add(new CostStructureDto("Thuế thu nhập", BigDecimal.ZERO, 0.0));
            return costStructureList;
        }

        double prodPercent = totalProductionCost.multiply(new BigDecimal("100"))
                .divide(totalCost, 2, RoundingMode.HALF_UP).doubleValue();
        double laborPercent = totalLaborCost.multiply(new BigDecimal("100"))
                .divide(totalCost, 2, RoundingMode.HALF_UP).doubleValue();
        double taxPercent = totalTaxCost.multiply(new BigDecimal("100"))
                .divide(totalCost, 2, RoundingMode.HALF_UP).doubleValue();

        costStructureList.add(new CostStructureDto("Chi phí vật tư sản xuất", totalProductionCost, prodPercent));
        costStructureList.add(new CostStructureDto("Chi phí lương thợ/nhân sự", totalLaborCost, laborPercent));
        costStructureList.add(new CostStructureDto("Thuế thu nhập", totalTaxCost, taxPercent));

        return costStructureList;
    }

    /**
     * Lấy danh sách công nợ của khách hàng để vẽ Bar Chart.
     */
    @Transactional(readOnly = true)
    public List<CustomerDebtDto> getCustomerDebt() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<Object[]> rawData = bodDashboardRepository.getCustomerDebtData(companyId);
        List<CustomerDebtDto> debtList = new ArrayList<>();

        for (Object[] row : rawData) {
            String customerCode = row[0] != null ? row[0].toString() : "";
            String customerName = row[1] != null ? row[1].toString() : "";
            BigDecimal totalOrdered = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
            BigDecimal totalPaid = row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO;
            BigDecimal debtAmount = totalOrdered.subtract(totalPaid);

            debtList.add(CustomerDebtDto.builder()
                    .customerCode(customerCode)
                    .customerName(customerName)
                    .totalOrdered(totalOrdered)
                    .totalPaid(totalPaid)
                    .debtAmount(debtAmount)
                    .build());
        }

        // Sắp xếp công nợ giảm dần
        debtList.sort((d1, d2) -> d2.getDebtAmount().compareTo(d1.getDebtAmount()));

        return debtList;
    }

    private Map<String, BigDecimal> convertToMap(List<Object[]> rawList) {
        Map<String, BigDecimal> map = new HashMap<>();
        if (rawList != null) {
            for (Object[] row : rawList) {
                if (row.length >= 2 && row[0] != null) {
                    String period = row[0].toString();
                    BigDecimal value = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
                    map.put(period, value);
                }
            }
        }
        return map;
    }
}
