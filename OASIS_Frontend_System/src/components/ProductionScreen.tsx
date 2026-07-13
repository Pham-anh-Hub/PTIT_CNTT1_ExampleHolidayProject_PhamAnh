import { useState, useTransition, useMemo } from "react";
import { ProductionPlan, ProductionStage, Product, Material } from "../types";
import { SAMPLE_PRODUCTS, SAMPLE_MATERIALS, SAMPLE_BOMS, SAMPLE_EMPLOYEES } from "../data";
import { ArrowUp, ArrowDown, Hammer, PackageOpen, AlertTriangle, CheckCircle, Plus, ClipboardList } from "lucide-react";

interface ProductionScreenProps {
  plans: ProductionPlan[];
  onAddPlan: (plan: ProductionPlan) => void;
}

export default function ProductionScreen({ plans, onAddPlan }: ProductionScreenProps) {
  const [, startTransition] = useTransition();

  // 1. Production Plan Drafting states
  const [selectedProductId, setSelectedProductId] = useState<string>(SAMPLE_PRODUCTS[0].id);
  const [plannedQuantity, setPlannedQuantity] = useState<number>(30);
  const [startDate, setStartDate] = useState("2026-07-08");
  const [endDate, setEndDate] = useState("2026-07-20");

  // Filter out workers to designate in production stages
  const workers = SAMPLE_EMPLOYEES.filter((emp) => emp.positionId === "WORKER" || emp.positionId === "PROD_SUPER");

  // 2. Production Stages sequencing state
  const [stages, setStages] = useState<ProductionStage[]>([
    { id: "stg-1", sequenceNo: 1, name: "Cắt xẻ phôi gỗ chính", workerId: workers[0].id, workerName: workers[0].fullname, wageType: "HOURLY", unitWage: 45000 },
    { id: "stg-2", sequenceNo: 2, name: "Chà nhám thô & Mịn bề mặt", workerId: workers[1].id, workerName: workers[1].fullname, wageType: "PIECE_RATE", unitWage: 120000 },
    { id: "stg-3", sequenceNo: 3, name: "Phun sơn lót chống nứt", workerId: workers[0].id, workerName: workers[0].fullname, wageType: "PIECE_RATE", unitWage: 150000 },
    { id: "stg-4", sequenceNo: 4, name: "Lắp ráp cố định & Khóa QA", workerId: workers[1].id, workerName: workers[1].fullname, wageType: "HOURLY", unitWage: 50000 }
  ]);

  // Find BOM template for the currently selected product
  const activeBOM = SAMPLE_BOMS.find((bom) => bom.productId === selectedProductId);

  // 3. Dynamic Material Requirement Calculation with stock checks
  const calculatedMaterials = useMemo(() => {
    if (!activeBOM) return [];
    return activeBOM.items.map((bomItem) => {
      const material = SAMPLE_MATERIALS.find((m) => m.id === bomItem.materialId) as Material;
      const totalNeeded = Number((bomItem.quantityPerUnit * plannedQuantity).toFixed(2));
      const inStock = material.inStock;
      const deficit = totalNeeded > inStock ? Number((totalNeeded - inStock).toFixed(2)) : 0;

      return {
        id: material.id,
        name: material.name,
        code: material.code,
        needed: totalNeeded,
        inStock: inStock,
        unit: material.unit,
        deficit: deficit
      };
    });
  }, [selectedProductId, plannedQuantity, activeBOM]);

  // Reordering stages handler (Sequence Shift Up/Down simulating drag-and-drop)
  const handleMoveStage = (index: number, direction: "UP" | "DOWN") => {
    if (direction === "UP" && index === 0) return;
    if (direction === "DOWN" && index === stages.length - 1) return;

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    const updated = [...stages];

    // Swap elements
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Reset sequence indexes
    const resequenced = updated.map((stage, i) => ({
      ...stage,
      sequenceNo: i + 1
    }));

    setStages(resequenced);
  };

  const handleStageFieldChange = (id: string, field: "name" | "workerId" | "wageType" | "unitWage", value: any) => {
    const updated = stages.map((stg) => {
      if (stg.id === id) {
        let updatedStg = { ...stg };
        if (field === "name") {
          updatedStg.name = value;
        } else if (field === "workerId") {
          const worker = workers.find((w) => w.id === value);
          updatedStg.workerId = value;
          updatedStg.workerName = worker ? worker.fullname : "";
        } else if (field === "wageType") {
          updatedStg.wageType = value as any;
        } else if (field === "unitWage") {
          updatedStg.unitWage = Number(value);
        }
        return updatedStg;
      }
      return stg;
    });
    setStages(updated);
  };

  const handleCreatePlan = () => {
    const selectedProdObj = SAMPLE_PRODUCTS.find((p) => p.id === selectedProductId) as Product;
    const planCode = `KHSX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newPlan: ProductionPlan = {
      id: `plan-${Date.now()}`,
      code: planCode,
      productId: selectedProductId,
      productName: selectedProdObj.name,
      plannedQuantity,
      startDate,
      endDate,
      stages,
      status: "PENDING"
    };

    onAddPlan(newPlan);
    alert(`Đã lập thành công kế hoạch ${planCode} cho sản phẩm ${selectedProdObj.name} với ${plannedQuantity} ${selectedProdObj.unit}. Kế hoạch đang ở trạng thái chuẩn bị vật tư.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="production-workspace-view">
      {/* Title Segment */}
      <div>
        <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight">
          Lập Kế Hoạch Sản Xuất &amp; Thẩm Định Định Mức BOM
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Trưởng phòng sản xuất thiết lập kế hoạch gia công, hệ thống tự động bóc tách định mức nguyên vật liệu (BOM) và đối chiếu tồn kho để cảnh báo thiếu hụt.
        </p>
      </div>

      {/* Main Grid: Form vs Material Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="production-dashboard-grid">
        {/* Left Column: Form Lập Kế Hoạch - 6 Columns */}
        <div className="lg:col-span-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs pb-3 border-b border-slate-50">
            <ClipboardList className="w-4 h-4 text-slate-teal" />
            <span>Biểu Mẫu Thiết Lập Kế Hoạch</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">Sản phẩm cần gia công sản xuất</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
            >
              {SAMPLE_PRODUCTS.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name} ({prod.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Số lượng kế hoạch (Target)</label>
              <input
                type="number"
                min="1"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Tổng ngân sách dự trù (VND)</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={(plannedQuantity * 250000).toLocaleString("vi-VN") + " đ"}
                  className="w-full text-xs border border-slate-100 bg-slate-50 text-slate-500 rounded-lg p-2.5 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Ngày hoàn thành dự kiến</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-500 leading-normal">
            ℹ️ Thay đổi sản phẩm hoặc số lượng ở trên sẽ tự động kích hoạt tính toán bóc tách nguyên vật liệu tại bảng bên cạnh theo định mức BOM chuẩn hóa.
          </div>
        </div>

        {/* Right Column: Material Requirements & Deficit Checker - 6 Columns */}
        <div className="lg:col-span-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs pb-3 border-b border-slate-50">
              <PackageOpen className="w-4 h-4 text-slate-teal" />
              <span>Dự Toán Nguyên Vật Liệu &amp; Tồn Kho Thực Tế</span>
            </div>

            {calculatedMaterials.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Sản phẩm này chưa cấu hình Định mức vật tư (BOM) chi tiết trong hệ thống.
              </div>
            ) : (
              <div className="my-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {calculatedMaterials.map((mat) => {
                  const hasDeficit = mat.deficit > 0;
                  return (
                    <div
                      key={mat.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        hasDeficit
                          ? "bg-terracotta-light/60 border-terracotta text-terracotta-dark"
                          : "bg-slate-50/50 border-slate-100 text-slate-700 hover:border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center space-x-1.5">
                          <span>{mat.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 uppercase">({mat.code})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          Nhu cầu: {mat.needed} {mat.unit} | Tồn thực tế: {mat.inStock} {mat.unit}
                        </div>
                      </div>

                      <div className="text-right">
                        {hasDeficit ? (
                          <div className="flex items-center space-x-1 font-bold text-[11px] text-terracotta">
                            <AlertTriangle className="w-3.5 h-3.5 animate-bounce shrink-0" />
                            <span>Thiếu hụt: -{mat.deficit} {mat.unit}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-green-light text-emerald-green font-bold px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-2.5 h-2.5" />
                            <span>Đủ kho</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-50 pt-3">
            <button
              onClick={handleCreatePlan}
              disabled={calculatedMaterials.some(m => m.deficit > 0)}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-teal hover:bg-slate-teal-hover disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs shadow-sm transition-colors"
              id="btn-trigger-production-plan"
            >
              <Hammer className="w-4 h-4" />
              <span>Phê Duyệt Kế Hoạch &amp; Phát Lệnh Gia Công</span>
            </button>
            {calculatedMaterials.some(m => m.deficit > 0) && (
              <p className="text-[10px] text-terracotta font-medium mt-1.5 text-center">
                ⚠️ Phát hiện thiếu hụt kho vật tư sản xuất. Vui lòng lập phiếu đề nghị mua hàng (PO) bổ sung trước khi phát lệnh.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Reorderable Production Stages Table */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold text-slate-800">Quy Trình Phân Chia Công Đoạn &amp; Đơn Giá Lương Sản Lượng</h3>
          <p className="text-xs text-slate-400 mt-1">
            Thiết lập thứ tự công đoạn gia công, chỉ định thợ mộc phụ trách chính, cấu hình cách tính lương (Theo giờ hoặc khoán sản lượng sản phẩm).
          </p>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                <th className="p-3 w-16 text-center">Thứ tự</th>
                <th className="p-3">Tên công đoạn gia công sản xuất</th>
                <th className="p-3 w-56 min-w-[200px]">Thợ chính phụ trách</th>
                <th className="p-3 w-48 min-w-[160px]">Cách tính lương</th>
                <th className="p-3 text-right">Đơn giá định mức (VND)</th>
                <th className="p-3 w-28 text-center">Di chuyển</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stages.map((stg, index) => (
                <tr key={stg.id} className="hover:bg-slate-50/30 transition-all">
                  {/* Sequence sequenceNo */}
                  <td className="p-3 text-center">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center mx-auto">
                      {stg.sequenceNo}
                    </span>
                  </td>

                  {/* Stage Name input */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={stg.name}
                      onChange={(e) => handleStageFieldChange(stg.id, "name", e.target.value)}
                      className="w-full text-xs bg-white border border-slate-100 hover:border-slate-200 rounded p-1.5 focus:outline-none focus:border-slate-teal font-semibold text-slate-700"
                    />
                  </td>

                  {/* Designated Lead worker select */}
                  <td className="p-2">
                    <select
                      value={stg.workerId}
                      onChange={(e) => handleStageFieldChange(stg.id, "workerId", e.target.value)}
                      className="w-full text-xs bg-white border border-slate-100 hover:border-slate-200 rounded p-1.5 pr-8 focus:outline-none focus:border-slate-teal cursor-pointer"
                    >
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.fullname} ({w.code})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Wage Calculation dropdown */}
                  <td className="p-2">
                    <select
                      value={stg.wageType}
                      onChange={(e) => handleStageFieldChange(stg.id, "wageType", e.target.value)}
                      className="w-full text-xs bg-white border border-slate-100 hover:border-slate-200 rounded p-1.5 pr-8 focus:outline-none focus:border-slate-teal cursor-pointer"
                    >
                      <option value="HOURLY">Tính lương theo giờ (Hourly)</option>
                      <option value="PIECE_RATE">Khoán sản phẩm (Piece-rate)</option>
                    </select>
                  </td>

                  {/* Unit rate input */}
                  <td className="p-2 text-right">
                    <div className="relative inline-block w-36">
                      <input
                        type="number"
                        value={stg.unitWage}
                        onChange={(e) => handleStageFieldChange(stg.id, "unitWage", e.target.value)}
                        className="w-full text-xs text-right border border-slate-100 hover:border-slate-200 rounded p-1.5 pr-12 focus:outline-none focus:border-slate-teal font-mono font-semibold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                        {stg.wageType === "HOURLY" ? "đ/h" : "đ/cái"}
                      </span>
                    </div>
                  </td>

                  {/* Up / Down Sequence move buttons (simulates Drag-and-Drop) */}
                  <td className="p-2 text-center">
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => handleMoveStage(index, "UP")}
                        disabled={index === 0}
                        className="p-1 rounded border border-slate-100 hover:bg-slate-50 disabled:opacity-30 text-slate-500"
                        title="Di chuyển lên"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveStage(index, "DOWN")}
                        disabled={index === stages.length - 1}
                        className="p-1 rounded border border-slate-100 hover:bg-slate-50 disabled:opacity-30 text-slate-500"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
