import { useState, useTransition } from "react";
import { SalesOrder, SalesOrderItem, Product } from "../types";
import { SAMPLE_PRODUCTS } from "../data";
import { Plus, Trash2, ShieldCheck, AlertTriangle, FileSpreadsheet, CheckCircle2, AlertCircle, ShoppingCart, X } from "lucide-react";

interface SalesScreenProps {
  orders: SalesOrder[];
  onAddOrder: (order: SalesOrder) => void;
}

export default function SalesScreen({ orders, onAddOrder }: SalesScreenProps) {
  const [, startTransition] = useTransition();

  // New order form fields
  const [customerName, setCustomerName] = useState("");
  const [orderDate, setOrderDate] = useState("2026-07-07");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" } | null>(null);

  // Order items state (start with 1 blank row)
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([
    { id: "item-1", productId: SAMPLE_PRODUCTS[0].id, productName: SAMPLE_PRODUCTS[0].name, unit: SAMPLE_PRODUCTS[0].unit, quantity: 1, price: SAMPLE_PRODUCTS[0].defaultPrice, subtotal: SAMPLE_PRODUCTS[0].defaultPrice }
  ]);

  const [activeFilter, setActiveFilter] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Add a blank row to the order items grid
  const handleAddRow = () => {
    const defaultProd = SAMPLE_PRODUCTS[0];
    const newId = `item-${Date.now()}`;
    setOrderItems([
      ...orderItems,
      {
        id: newId,
        productId: defaultProd.id,
        productName: defaultProd.name,
        unit: defaultProd.unit,
        quantity: 1,
        price: defaultProd.defaultPrice,
        subtotal: defaultProd.defaultPrice
      }
    ]);
  };

  // Remove a row from order items grid
  const handleRemoveRow = (id: string) => {
    if (orderItems.length === 1) return; // keep at least 1 row
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

  // Handle line item cell changes (Product change, Quantity change, Price change)
  const handleItemChange = (id: string, field: "productId" | "quantity" | "price", value: any) => {
    const updated = orderItems.map((item) => {
      if (item.id === id) {
        let updatedItem = { ...item };
        if (field === "productId") {
          const prod = SAMPLE_PRODUCTS.find((p) => p.id === value) as Product;
          updatedItem.productId = prod.id;
          updatedItem.productName = prod.name;
          updatedItem.unit = prod.unit;
          updatedItem.price = prod.defaultPrice;
          updatedItem.subtotal = updatedItem.quantity * prod.defaultPrice;
        } else if (field === "quantity") {
          const qty = Number(value);
          updatedItem.quantity = qty;
          updatedItem.subtotal = qty * updatedItem.price;
        } else if (field === "price") {
          const prc = Number(value);
          updatedItem.price = prc;
          updatedItem.subtotal = updatedItem.quantity * prc;
        }
        return updatedItem;
      }
      return item;
    });
    setOrderItems(updated);
  };

  // Calculate order total amount dynamically
  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Check threshold boundary rule (> 50M is pending, <= 50M is auto-approved)
  const limitThreshold = 50000000;
  const isOverThreshold = totalAmount > limitThreshold;

  // Form submit handler
  const handleSaveOrder = () => {
    if (!customerName.trim()) {
      setToast({ message: "Vui lòng nhập tên khách hàng.", type: "warning" });
      return;
    }

    const orderCode = `ĐH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(10 + Math.random() * 90)}`;
    const newOrder: SalesOrder = {
      id: `ord-${Date.now()}`,
      code: orderCode,
      customerName,
      orderDate,
      notes,
      totalAmount,
      status: isOverThreshold ? "PENDING" : "APPROVED",
      items: orderItems,
      createdAt: new Date().toISOString()
    };

    onAddOrder(newOrder);

    // Reset Form
    setCustomerName("");
    setNotes("");
    setOrderItems([
      { id: "item-1", productId: SAMPLE_PRODUCTS[0].id, productName: SAMPLE_PRODUCTS[0].name, unit: SAMPLE_PRODUCTS[0].unit, quantity: 1, price: SAMPLE_PRODUCTS[0].defaultPrice, subtotal: SAMPLE_PRODUCTS[0].defaultPrice }
    ]);

    if (isOverThreshold) {
      setToast({
        message: `Đơn hàng ${orderCode} trị giá ${formatMoney(totalAmount)} vượt ngưỡng quy định 50M. Trạng thái sau khi lưu: CHỜ PHÊ DUYỆT. Đơn hàng đã được tự động chuyển đến Hộp thư phê duyệt của Ban giám đốc.`,
        type: "warning"
      });
    } else {
      setToast({
        message: `Đơn hàng ${orderCode} trị giá ${formatMoney(totalAmount)} nằm trong hạn ngạch cho phép. Hệ thống đã TỰ ĐỘNG PHÊ DUYỆT thành công.`,
        type: "success"
      });
    }
  };

  // Filter existing orders
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "ALL") return true;
    return o.status === activeFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="sales-workspace-view">
      {/* Upper Header info */}
      <div>
        <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight">
          Lập Đơn Hàng &amp; Hạn Mức Tín Dụng
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Nhân viên kinh doanh nhập đơn hàng trực tiếp, hệ thống tự động kiểm tra ngưỡng tiền để kích hoạt quy trình phê duyệt của BOD và chuyển sang phân xưởng sản xuất.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="sales-grid-layout">
        {/* Left Hand Portion: Form Lập đơn hàng mới - 8 columns */}
        <div className="xl:col-span-8 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs pb-3 border-b border-slate-50">
            <ShoppingCart className="w-4 h-4 text-slate-teal" />
            <span>Biểu Mẫu Soạn Thảo Đơn Hàng Mới</span>
          </div>

          {/* Form Upper Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Tên Đối Tác / Khách Hàng</label>
              <input
                type="text"
                placeholder="Ví dụ: Tập đoàn Bán lẻ VinCommerce, CTCP Nội thất Nhà Đẹp..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Ngày đặt đơn</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">Lưu ý nghiệp vụ (Giao hàng, Chứng từ, Điều khoản thanh toán)</label>
            <input
              type="text"
              placeholder="Yêu cầu bọc xốp cẩn thận, bàn giao kèm theo Hoá đơn tài chính đỏ & Biên bản kiểm QA..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
            />
          </div>

          {/* Form Lower Table Segment: Order Lines Grid */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Danh mục sản phẩm đặt mua</span>
              <button
                onClick={handleAddRow}
                className="text-[11px] text-slate-teal hover:text-slate-teal-hover font-semibold flex items-center space-x-1 border border-slate-100 hover:border-slate-200 px-2.5 py-1 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm sản phẩm</span>
              </button>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                    <th className="p-3 w-64 min-w-[200px]">Sản phẩm phân xưởng</th>
                    <th className="p-3 w-20">ĐVT</th>
                    <th className="p-3 w-24">Số lượng</th>
                    <th className="p-3 w-36 text-right">Đơn giá bán (VND)</th>
                    <th className="p-3 text-right">Thành tiền</th>
                    <th className="p-3 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orderItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                      {/* Product selection dropdown */}
                      <td className="p-2">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(item.id, "productId", e.target.value)}
                          className="w-full text-xs bg-white border border-slate-100 hover:border-slate-200 rounded p-1.5 pr-8 focus:outline-none focus:border-slate-teal cursor-pointer"
                        >
                          {SAMPLE_PRODUCTS.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} ({prod.code})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Unit (auto) */}
                      <td className="p-2 text-slate-500 font-medium pl-3">{item.unit}</td>

                      {/* Quantity Input */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                          className="w-20 text-xs text-center border border-slate-100 rounded p-1.5 focus:outline-none focus:border-slate-teal font-mono"
                        />
                      </td>

                      {/* Price Input */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
                          className="w-32 text-xs text-right border border-slate-100 rounded p-1.5 focus:outline-none focus:border-slate-teal font-mono"
                        />
                      </td>

                      {/* Line Subtotal */}
                      <td className="p-2 text-right font-semibold font-mono text-slate-700 pl-4">
                        {formatMoney(item.subtotal)}
                      </td>

                      {/* Row Delete button */}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemoveRow(item.id)}
                          className="text-slate-400 hover:text-terracotta p-1 rounded hover:bg-slate-50 transition-colors"
                          title="Xoá dòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Hand Portion: Summary details and trigger alert box - 4 columns */}
        <div className="xl:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-50">
              Tổng quan thanh toán đơn hàng
            </h3>

            {/* Total display */}
            <div className="space-y-1 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Tổng giá trị đơn hàng (VND)</span>
              <span className="text-2xl font-black font-display text-slate-teal block py-1 font-mono tracking-tight">
                {totalAmount.toLocaleString("vi-VN")} đ
              </span>
            </div>

            {/* Dynamic limit checker block (Rule based on threshold limit) */}
            {isOverThreshold ? (
              <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-xs text-amber-900 leading-normal space-y-1.5 animate-in fade-in duration-300">
                <span className="font-bold flex items-center text-amber-800">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                  ⚠️ ĐƠN HÀNG VƯỢT HẠN MỨC 50M
                </span>
                <p className="text-[11px] text-amber-700">
                  Tổng giá trị vượt quá hạn quota cho phép của phòng Sales. <strong>Sau khi lưu hệ thống sẽ chuyển về trạng thái: Chờ duyệt.</strong> Trực tiếp gửi đến Hộp thư phê duyệt của Giám đốc điều hành.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-green-light/80 border border-emerald-green-light p-3.5 rounded-xl text-xs text-emerald-green-dark leading-normal space-y-1.5 animate-in fade-in duration-300">
                <span className="font-bold flex items-center text-emerald-green-dark">
                  <ShieldCheck className="w-4 h-4 mr-1.5 shrink-0" />
                  ✅ HẠN MỨC CHO PHÉP (TỰ ĐỘNG)
                </span>
                <p className="text-[11px] text-emerald-green-dark/90">
                  Tổng đơn hàng trong định mức uỷ quyền tự động của Sales Manager. <strong>Trạng thái sau khi lưu: Đã duyệt tự động.</strong> Sẵn sàng điều động vật tư và đưa vào kế hoạch sản xuất ngay lập tức.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-50">
            <button
              onClick={handleSaveOrder}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-teal hover:bg-slate-teal-hover text-white font-semibold text-xs shadow-sm transition-colors"
              id="btn-save-order-dispatch"
            >
              <span>Xác nhận &amp; Lưu đơn hàng</span>
            </button>
            <button
              onClick={() => {
                alert("Đơn hàng đã được lưu dưới dạng bản nháp cục bộ.");
              }}
              className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold text-xs transition-colors"
            >
              Lưu bản nháp (Draft)
            </button>
          </div>
        </div>
      </div>

      {/* LOWER TABLE: Order Archive List */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Sổ Đăng Ký Đơn Hàng &amp; Công Nợ Khách Hàng</h3>
            <p className="text-xs text-slate-400 mt-1">
              Hồ sơ tổng hợp các đơn hàng bán lẻ và bán buôn đã đưa vào dòng sản xuất hoặc đang chờ thẩm định tài chính.
            </p>
          </div>

          {/* Quick Filter tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-center">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                activeFilter === "ALL" ? "bg-white text-slate-teal shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              onClick={() => setActiveFilter("APPROVED")}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                activeFilter === "APPROVED" ? "bg-white text-slate-teal shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đã Duyệt ({orders.filter(o => o.status === "APPROVED").length})
            </button>
            <button
              onClick={() => setActiveFilter("PENDING")}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                activeFilter === "PENDING" ? "bg-white text-slate-teal shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Chờ duyệt ({orders.filter(o => o.status === "PENDING").length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                <th className="p-3">Mã chứng từ</th>
                <th className="p-3">Khách hàng / Đối tác</th>
                <th className="p-3">Ngày đặt</th>
                <th className="p-3 text-right">Tổng thanh toán</th>
                <th className="p-3 pl-6">Lưu ý nghiệp vụ</th>
                <th className="p-3 pr-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Không có đơn hàng nào khớp với bộ lọc hiện hành.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-3 font-semibold text-slate-700 font-mono">{ord.code}</td>
                    <td className="p-3 font-medium text-slate-600">{ord.customerName}</td>
                    <td className="p-3 text-slate-500 font-mono">{ord.orderDate}</td>
                    <td className="p-3 text-right font-mono text-slate-900 font-semibold">{formatMoney(ord.totalAmount)}</td>
                    <td className="p-3 pl-6 text-slate-400 italic truncate max-w-xs">{ord.notes || "—"}</td>
                    <td className="p-3 pr-4 text-right">
                      {ord.status === "APPROVED" ? (
                        <span className="inline-flex items-center space-x-1 text-[9px] bg-emerald-green-light text-emerald-green font-bold px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Đã duyệt</span>
                        </span>
                      ) : ord.status === "PENDING" ? (
                        <span className="inline-flex items-center space-x-1 text-[9px] bg-sage-amber-light text-sage-amber font-bold px-1.5 py-0.5 rounded animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Chờ Giám đốc duyệt</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[9px] bg-terracotta-light text-terracotta font-bold px-1.5 py-0.5 rounded">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Bị từ chối</span>
                        </span>
                      )}
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating State Toast overlay */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border border-slate-100 shadow-xl rounded-2xl p-4 max-w-sm flex items-start space-x-3 z-50 animate-in slide-in-from-bottom-5 duration-300">
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-green shrink-0 mt-0.5" />}
          {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-sage-amber shrink-0 mt-0.5" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />}
          <div className="flex-1 text-xs font-semibold text-slate-700 leading-relaxed">{toast.message}</div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
