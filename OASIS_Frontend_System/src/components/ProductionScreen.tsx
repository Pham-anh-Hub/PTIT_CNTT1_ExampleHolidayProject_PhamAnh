import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { ProductionPlan, ProductionStage, Product, Material, MaterialImport, FinishedProductImport, ProductBOM } from "../types";
import { SAMPLE_PRODUCTS, SAMPLE_MATERIALS, SAMPLE_BOMS, SAMPLE_EMPLOYEES } from "../data";
import { ArrowUp, ArrowDown, Hammer, PackageOpen, AlertTriangle, CheckCircle, Plus, ClipboardList, Warehouse, History, Layers, ClipboardCheck, ArrowUpRight, ChevronDown, Check, Info, Trash, X, Sliders } from "lucide-react";

interface ProductionScreenProps {
  plans: ProductionPlan[];
  onAddPlan: (plan: ProductionPlan) => void;
  materialImports: MaterialImport[];
  onAddMaterialImport: (imp: MaterialImport) => void;
  finishedImports: FinishedProductImport[];
  onAddFinishedImport: (fimp: FinishedProductImport) => void;
}

// --------------------------------------------------------------------------
// REUSABLE BUBBLE CONCEPT CUSTOM DROPDOWN (CLEAN RECTANGLE POPUP MENU)
// --------------------------------------------------------------------------
interface CustomSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  className?: string;
}

function CustomSelect({ value, options, onChange, className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block w-full font-sans text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xs flex items-center justify-between text-xs font-medium text-slate-800 hover:border-blue-950/40 hover:bg-slate-50 transition-all cursor-pointer ${className}`}
        style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 text-blue-950 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 w-full mt-1.5 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-1 max-h-56 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-blue-950 text-white font-bold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-blue-950"
                }`}
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProductionScreen({
  plans,
  onAddPlan,
  materialImports,
  onAddMaterialImport,
  finishedImports,
  onAddFinishedImport
}: ProductionScreenProps) {
  const [, startTransition] = useTransition();

  // Navigation Tab State
  const [activeSubTab, setActiveSubTab] = useState<"planning" | "warehouse">("planning");

  // Dynamic States for Multitenancy (Custom Products, Materials, and BOMs)
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [materials, setMaterials] = useState<Material[]>(SAMPLE_MATERIALS);
  const [boms, setBoms] = useState<ProductBOM[]>(SAMPLE_BOMS);

  // Configuration Modal state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<"product" | "material" | "bom">("product");

  // Form states for creating custom items in Configuration Modal
  const [newProdName, setNewProdName] = useState("");
  const [newProdCode, setNewProdCode] = useState("");
  const [newProdUnit, setNewProdUnit] = useState("Bộ");
  const [newProdPrice, setNewProdPrice] = useState(5000000);

  const [newMatName, setNewMatName] = useState("");
  const [newMatCode, setNewMatCode] = useState("");
  const [newMatUnit, setNewMatUnit] = useState("m3");
  const [newMatStock, setNewMatStock] = useState(50);

  const [bomSelectedProdId, setBomSelectedProdId] = useState(products[0]?.id || "");
  const [bomNewMatId, setBomNewMatId] = useState(materials[0]?.id || "");
  const [bomNewQty, setBomNewQty] = useState(1);

  // Custom Alert Popup State
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
    setAlertInfo({ isOpen: true, type, title, message });
  };

  // Material Import Form States
  const [importMatId, setImportMatId] = useState<string>(materials[0]?.id || "");
  const [importQty, setImportQty] = useState<number>(10);
  const [importPrice, setImportPrice] = useState<number>(150000);
  const [importSupplier, setImportSupplier] = useState<string>("Công ty Lâm sản Tây Nguyên");

  // Finished Product Import Form States
  const [importPlanId, setImportPlanId] = useState<string>(plans[0]?.id || "");
  const [importFQty, setImportFQty] = useState<number>(10);
  const [importQa, setImportQa] = useState<"PASSED" | "FAILED">("PASSED");

  // 1. Production Plan Drafting states
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
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
  const activeBOM = boms.find((bom) => bom.productId === selectedProductId);

  // 3. Dynamic Material Requirement Calculation with stock checks
  const calculatedMaterials = useMemo(() => {
    if (!activeBOM) return [];
    return activeBOM.items.map((bomItem) => {
      const material = materials.find((m) => m.id === bomItem.materialId);
      if (!material) return null;
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
    }).filter(Boolean) as any[];
  }, [selectedProductId, plannedQuantity, activeBOM, materials]);

  // Reordering stages handler
  const handleMoveStage = (index: number, direction: "UP" | "DOWN") => {
    if (direction === "UP" && index === 0) return;
    if (direction === "DOWN" && index === stages.length - 1) return;

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    const updated = [...stages];

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

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
    const selectedProdObj = products.find((p) => p.id === selectedProductId) as Product;
    if (!selectedProdObj) return;
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
    showAlert("Trình duyệt kế hoạch", `Đã lập đề xuất kế hoạch ${planCode} cho sản phẩm ${selectedProdObj.name} với ${plannedQuantity} ${selectedProdObj.unit} và trình BOD phê duyệt.`);
  };

  // Handle addition of custom elements for Multitenant configuration
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdCode) return;
    const newP: Product = {
      id: `custom-prod-${Date.now()}`,
      name: newProdName,
      code: newProdCode,
      unit: newProdUnit,
      defaultPrice: newProdPrice
    };
    setProducts([...products, newP]);
    setNewProdName("");
    setNewProdCode("");
    showAlert("Thành công", `Đã thêm sản phẩm custom: ${newProdName}`);
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName || !newMatCode) return;
    const newM: Material = {
      id: `custom-mat-${Date.now()}`,
      name: newMatName,
      code: newMatCode,
      unit: newMatUnit,
      inStock: newMatStock
    };
    setMaterials([...materials, newM]);
    setNewMatName("");
    setNewMatCode("");
    showAlert("Thành công", `Đã thêm nguyên vật liệu custom: ${newMatName}`);
  };

  const handleAddBOMItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomSelectedProdId || !bomNewMatId) return;
    const targetMat = materials.find(m => m.id === bomNewMatId);
    if (!targetMat) return;

    let existingBom = boms.find(b => b.productId === bomSelectedProdId);
    if (existingBom) {
      // Check if material already in items
      const hasMat = existingBom.items.some(it => it.materialId === bomNewMatId);
      if (hasMat) {
        existingBom.items = existingBom.items.map(it => 
          it.materialId === bomNewMatId ? { ...it, quantityPerUnit: bomNewQty } : it
        );
      } else {
        existingBom.items.push({
          materialId: bomNewMatId,
          materialName: targetMat.name,
          quantityPerUnit: bomNewQty
        });
      }
      setBoms([...boms]);
    } else {
      const newBom: ProductBOM = {
        productId: bomSelectedProdId,
        items: [{
          materialId: bomNewMatId,
          materialName: targetMat.name,
          quantityPerUnit: bomNewQty
        }]
      };
      setBoms([...boms, newBom]);
    }
    showAlert("Thành công", `Đã cập nhật định mức BOM.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="production-workspace-view" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Title Segment with Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight flex items-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
            <Warehouse className="w-5.5 h-5.5 text-slate-teal mr-2" />
            Điều Hành Sản Xuất &amp; Quản Lý Định Mức BOM
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị quy trình định mức nguyên vật liệu (BOM), đề xuất lệnh gia công và kiểm soát xuất nhập kho vật tư, thành phẩm.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-950 border border-blue-100 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-950" />
            <span>Cài đặt Sản phẩm &amp; BOM</span>
          </button>

          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-500 shrink-0 border border-slate-200">
            <button
              onClick={() => setActiveSubTab("planning")}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === "planning" ? "bg-white text-slate-teal shadow-xs font-bold" : "hover:text-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kế hoạch &amp; Định mức BOM</span>
            </button>
            <button
              onClick={() => setActiveSubTab("warehouse")}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === "warehouse" ? "bg-white text-slate-teal shadow-xs font-bold" : "hover:text-slate-800"
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Nhập Kho Vật Tư &amp; Thành Phẩm</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === "planning" ? (
        <>
          {/* Main Grid: Form vs Material Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="production-dashboard-grid">
        {/* Left Column: Form Lập Kế Hoạch - 6 Columns */}
        <div className="lg:col-span-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4 text-left">
          <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs pb-3 border-b border-slate-50" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
            <ClipboardList className="w-4 h-4 text-slate-teal" />
            <span>Biểu Mẫu Thiết Lập Kế Hoạch</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">Sản phẩm cần gia công sản xuất</label>
            <CustomSelect
              value={selectedProductId}
              onChange={(val) => setSelectedProductId(val)}
              options={products.map((prod) => ({
                value: prod.id,
                label: `${prod.name} (${prod.code})`
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Số lượng theo kế hoạch</label>
              <input
                type="number"
                min="1"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-none focus:border-slate-teal font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Tổng ngân sách dự trù (VND)</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={(plannedQuantity * 250000).toLocaleString("vi-VN") + " đ"}
                  className="w-full text-xs border border-slate-100 bg-slate-50 text-slate-500 rounded-xl p-2.5 font-mono font-bold"
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
                className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-none focus:border-slate-teal font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Ngày hoàn thành dự kiến</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-none focus:border-slate-teal font-medium"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-500 leading-normal">
            ℹ️ Thay đổi sản phẩm hoặc số lượng ở trên sẽ tự động kích hoạt tính toán bóc tách nguyên vật liệu tại bảng bên cạnh theo định mức BOM chuẩn hóa.
          </div>
        </div>

        {/* Right Column - 6 Columns */}
        <div className="lg:col-span-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs pb-3 border-b border-slate-50" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
              <PackageOpen className="w-4 h-4 text-slate-teal" />
              <span>Dự Toán Nguyên Vật Liệu &amp; Tồn Kho Thực Tế</span>
            </div>

            {calculatedMaterials.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Sản phẩm này chưa cấu hình Định mức vật tư (BOM) chi tiết trong hệ thống. Bạn có thể nhấn button "Cài đặt Sản phẩm &amp; BOM" để cấu hình.
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
                          ? "bg-rose-50 border-rose-200 text-rose-800"
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
                          <div className="flex items-center space-x-1 font-bold text-[11px] text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5 animate-bounce shrink-0" />
                            <span>Thiếu hụt: -{mat.deficit} {mat.unit}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded">
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
              disabled={calculatedMaterials.length === 0 || calculatedMaterials.some(m => m.deficit > 0)}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
              id="btn-trigger-production-plan"
              style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
            >
              <Hammer className="w-4 h-4" />
              <span>Đề xuất Kế hoạch &amp; Trình BOD phê duyệt</span>
            </button>
            {calculatedMaterials.length > 0 && calculatedMaterials.some(m => m.deficit > 0) && (
              <p className="text-[10px] text-rose-600 font-medium mt-1.5 text-center">
                ⚠️ Phát hiện thiếu hụt kho vật tư sản xuất. Vui lòng lập phiếu đề nghị mua hàng (PO) bổ sung trước khi phát lệnh.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Customizable Production Stages Table */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-left">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Quy Trình Phân Chia Công Đoạn &amp; Đơn Giá Lương Sản Lượng</h3>
            <p className="text-xs text-slate-400 mt-1">
              Thiết lập thứ tự công đoạn gia công, chỉ định thợ mộc phụ trách chính, cấu hình cách tính lương (Theo giờ hoặc khoán sản lượng sản phẩm).
            </p>
          </div>
          
          <button
            onClick={() => {
              const newStageId = `stg-${Date.now()}`;
              const newStage: ProductionStage = {
                id: newStageId,
                sequenceNo: 1,
                name: "", // Để trống tên công đoạn để người dùng dễ theo dõi và nhập mới
                workerId: workers[0]?.id || "emp-6",
                workerName: workers[0]?.fullname || "Nguyễn Công Binh",
                wageType: "HOURLY",
                unitWage: 45000
              };
              // Thêm lên đầu danh sách và tự động đánh lại số thứ tự từ 1 đến hết
              const updated = [newStage, ...stages].map((s, idx) => ({
                ...s,
                sequenceNo: idx + 1
              }));
              setStages(updated);
            }}
            className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-sm transition-all"
            style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm công đoạn</span>
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                <th className="p-3 w-16 text-center">Thứ tự</th>
                <th className="p-3">Tên công đoạn gia công sản xuất</th>
                <th className="p-3 w-56 min-w-[200px]">Thợ chính phụ trách</th>
                <th className="p-3 w-48 min-w-[160px]">Cách tính lương</th>
                <th className="p-3 text-right">Đơn giá định mức (VND)</th>
                <th className="p-3 w-36 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {stages.map((stg, index) => (
                <tr key={stg.id} className="hover:bg-slate-50/30 transition-all">
                  <td className="p-3 text-center">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center mx-auto">
                      {stg.sequenceNo}
                    </span>
                  </td>

                  <td className="p-2">
                    <input
                      type="text"
                      value={stg.name}
                      onChange={(e) => handleStageFieldChange(stg.id, "name", e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-slate-teal font-semibold text-slate-700"
                    />
                  </td>

                  <td className="p-2">
                    <CustomSelect
                      value={stg.workerId}
                      onChange={(val) => handleStageFieldChange(stg.id, "workerId", val)}
                      options={workers.map((w) => ({
                        value: w.id,
                        label: `${w.fullname} (${w.code})`
                      }))}
                    />
                  </td>

                  <td className="p-2">
                    <CustomSelect
                      value={stg.wageType}
                      onChange={(val) => handleStageFieldChange(stg.id, "wageType", val)}
                      options={[
                        { value: "HOURLY", label: "Tính lương theo giờ (Hourly)" },
                        { value: "PIECE_RATE", label: "Khoán sản phẩm (Piece-rate)" }
                      ]}
                    />
                  </td>

                  <td className="p-2 text-right">
                    <div className="relative inline-block w-36">
                      <input
                        type="number"
                        value={stg.unitWage}
                        onChange={(e) => handleStageFieldChange(stg.id, "unitWage", e.target.value)}
                        className="w-full text-xs text-right border border-slate-200 rounded-xl p-2.5 pr-12 focus:outline-none focus:border-slate-teal font-mono font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                        {stg.wageType === "HOURLY" ? "đ/h" : "đ/cái"}
                      </span>
                    </div>
                  </td>

                  <td className="p-2 text-center">
                    <div className="flex justify-center space-x-1.5">
                      <button
                        onClick={() => handleMoveStage(index, "UP")}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-500 cursor-pointer"
                        title="Di chuyển lên"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStage(index, "DOWN")}
                        disabled={index === stages.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-500 cursor-pointer"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const updated = stages.filter(s => s.id !== stg.id).map((s, idx) => ({
                            ...s,
                            sequenceNo: idx + 1
                          }));
                          setStages(updated);
                        }}
                        className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                        title="Xóa công đoạn"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        /* WAREHOUSE SUB-TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300" id="warehouse-sub-tab">
          {/* Left Hand: Raw Material Receipts - 6 Columns */}
          <div className="lg:col-span-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                <Warehouse className="w-4 h-4 text-slate-teal" />
                <span>Nhập Kho Nguyên Vật Tư (Mua Hàng)</span>
              </div>
              <span className="text-[10px] bg-slate-50 text-slate-teal px-2 py-0.5 rounded font-mono font-semibold">
                Kho vật tư thô
              </span>
            </div>

            {/* Form to add material import */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-600 flex items-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                <Plus className="w-3.5 h-3.5 text-slate-teal mr-1" />
                Lập Phiếu Nhập Vật Tư Mới
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Chọn vật tư</label>
                  <CustomSelect
                    value={importMatId}
                    onChange={(val) => {
                      setImportMatId(val);
                      const targetMat = materials.find(m => m.id === val);
                      if (targetMat) {
                        if (val.includes("custom")) setImportPrice(100000);
                        else if (val === "mat-1") setImportPrice(8500000);
                        else if (val === "mat-2") setImportPrice(1500);
                        else if (val === "mat-3") setImportPrice(6500000);
                        else if (val === "mat-4") setImportPrice(1200000);
                        else if (val === "mat-5") setImportPrice(85000);
                      }
                    }}
                    options={materials.map((m) => ({
                      value: m.id,
                      label: `${m.name} (${m.code})`
                    }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={importSupplier}
                    onChange={(e) => setImportSupplier(e.target.value)}
                    placeholder="Ví dụ: Công ty Lâm sản EG"
                    className="w-full text-xs border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-teal font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Số lượng nhập</label>
                  <input
                    type="number"
                    value={importQty}
                    onChange={(e) => setImportQty(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-teal font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đơn giá nhập (VNĐ)</label>
                  <input
                    type="number"
                    value={importPrice}
                    onChange={(e) => setImportPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-teal font-mono font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-400">
                  Thành tiền: <span className="font-mono text-slate-teal font-bold">{(importQty * importPrice).toLocaleString()} đ</span>
                </span>
                <button
                  onClick={() => {
                    const targetMat = materials.find(m => m.id === importMatId);
                    if (!targetMat) return;
                    const newImp: MaterialImport = {
                      id: `imp-${Date.now()}`,
                      code: `PNK-VT-${Math.floor(100 + Math.random() * 900)}`,
                      materialId: importMatId,
                      materialName: targetMat.name,
                      materialCode: targetMat.code,
                      quantity: importQty,
                      unitPrice: importPrice,
                      totalAmount: importQty * importPrice,
                      supplier: importSupplier,
                      importDate: new Date().toISOString().split('T')[0],
                      status: 'APPROVED'
                    };
                    onAddMaterialImport(newImp);
                    
                    // Update in-stock quantity of that material dynamically
                    setMaterials(prev => prev.map(m => 
                      m.id === importMatId ? { ...m, inStock: m.inStock + importQty } : m
                    ));

                    showAlert("Nhập kho thành công", `Đã ghi nhận Phiếu Nhập Vật Tư ${newImp.code} nhập kho ${importQty} ${targetMat.unit} ${targetMat.name} từ ${importSupplier}.`);
                    
                    // Clear/Reset form fields on success
                    setImportQty(10);
                    setImportSupplier("");
                  }}
                  className="bg-blue-950 hover:bg-blue-900 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center space-x-1 shadow-md shadow-blue-950/15"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Ghi nhận Nhập kho</span>
                </button>
              </div>
            </div>

            {/* List of Material Imports */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600 flex items-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                <History className="w-3.5 h-3.5 text-slate-teal mr-1" />
                Lịch Sử Nhập Kho Vật Tư Gần Đây
              </h3>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                      <th className="p-3">Mã phiếu</th>
                      <th className="p-3">Vật tư / NCC</th>
                      <th className="p-3 text-right">SL nhập</th>
                      <th className="p-3 text-right">Tổng tiền</th>
                      <th className="p-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {materialImports.map((imp) => (
                      <tr key={imp.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-[10px] font-bold text-slate-teal">{imp.code}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-700">{imp.materialName}</div>
                          <div className="text-[10px] text-slate-400">{imp.supplier} • {imp.importDate}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold">{imp.quantity.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-700">{imp.totalAmount.toLocaleString()}đ</td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center border border-emerald-100 whitespace-nowrap">
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                            Đã vào kho
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Hand: Finished Product Receipts - 6 Columns */}
          <div className="lg:col-span-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                <ClipboardCheck className="w-4 h-4 text-slate-teal" />
                <span>Nghiệm Thu &amp; Nhập Kho Thành Phẩm</span>
              </div>
              <span className="text-[10px] bg-slate-50 text-slate-teal px-2 py-0.5 rounded font-mono font-semibold">
                Kho thành phẩm
              </span>
            </div>

            {/* Form to add finished goods import */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-600 flex items-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                <Plus className="w-3.5 h-3.5 text-slate-teal mr-1" />
                Nghiệm Thu Kế Hoạch Sản Xuất
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Chọn Lệnh / Kế hoạch chạy</label>
                  <CustomSelect
                    value={importPlanId}
                    onChange={(val) => {
                      setImportPlanId(val);
                      const planObj = plans.find(p => p.id === val);
                      if (planObj) setImportFQty(planObj.plannedQuantity);
                    }}
                    options={[
                      { value: "", label: "-- Chọn lệnh sản xuất active --" },
                      ...plans.filter(p => p.status === "PENDING" || p.status === "RUNNING").map((p) => ({
                        value: p.id,
                        label: `${p.code} - ${p.productName} (${p.plannedQuantity} cái)`
                      }))
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Số lượng đạt chuẩn</label>
                  <input
                    type="number"
                    value={importFQty}
                    onChange={(e) => setImportFQty(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-teal font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đánh giá chất lượng QA</label>
                  <CustomSelect
                    value={importQa}
                    onChange={(val) => setImportQa(val as any)}
                    options={[
                      { value: "PASSED", label: "ĐẠT CHUẨN (PASSED)" },
                      { value: "FAILED", label: "LỖI KỸ THUẬT (REJECTED)" }
                    ]}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-400">
                  Nhân viên kiểm tra: <span className="font-semibold text-slate-600">Phạm Minh Hoàng (KCS)</span>
                </span>
                <button
                  onClick={() => {
                    const targetPlan = plans.find(p => p.id === importPlanId);
                    if (!targetPlan) {
                      showAlert("Thông báo lỗi", "Vui lòng chọn lệnh sản xuất để nghiệm thu!", "error");
                      return;
                    }
                    const productObj = products.find(p => p.id === targetPlan.productId);
                    const newFimp: FinishedProductImport = {
                      id: `fimp-${Date.now()}`,
                      code: `PNK-TP-${Math.floor(100 + Math.random() * 900)}`,
                      planCode: targetPlan.code,
                      productId: targetPlan.productId,
                      productName: targetPlan.productName,
                      productCode: productObj?.code || "SP-MOCK",
                      quantity: importFQty,
                      unit: productObj?.unit || "Cái",
                      qaStatus: importQa,
                      importDate: new Date().toISOString().split('T')[0],
                      operatorName: "Phạm Minh Hoàng"
                    };
                    onAddFinishedImport(newFimp);
                    
                    targetPlan.status = "COMPLETED";

                    showAlert("Nghiệm thu thành công", `Đã ghi nhận Phiếu Nghiệm Thu ${newFimp.code} cho kế hoạch ${targetPlan.code}. Trạng thái QA: ${importQa === 'PASSED' ? 'ĐẠT' : 'KHÔNG ĐẠT'} và nhập kho ${importFQty} thành phẩm.`);
                    
                    // Reset/Clear finished goods form fields on success
                    setImportPlanId("");
                    setImportFQty(10);
                    setImportQa("PASSED");
                  }}
                  className="bg-blue-950 hover:bg-blue-900 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center space-x-1 shadow-md shadow-blue-950/15"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Hoàn thành &amp; Nhập kho</span>
                </button>
              </div>
            </div>

            {/* List of Finished Goods Imports */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600 flex items-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                <History className="w-3.5 h-3.5 text-slate-teal mr-1" />
                Lịch Sử Nghiệm Thu Thành Phẩm
              </h3>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                      <th className="p-3">Mã phiếu</th>
                      <th className="p-3">Sản phẩm / Lệnh</th>
                      <th className="p-3 text-right">SL nhập</th>
                      <th className="p-3 text-center">Đánh giá QA</th>
                      <th className="p-3">Người KCS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {finishedImports.map((fimp) => (
                      <tr key={fimp.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-[10px] font-bold text-slate-teal">{fimp.code}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-700">{fimp.productName}</div>
                          <div className="text-[10px] text-slate-400">Lệnh: {fimp.planCode} • {fimp.importDate}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold">{fimp.quantity} {fimp.unit}</td>
                        <td className="p-3 text-center">
                          {fimp.qaStatus === "PASSED" ? (
                            <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 whitespace-nowrap">
                              Đạt chuẩn QA
                            </span>
                          ) : (
                            <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-100 whitespace-nowrap">
                              Phát hiện lỗi QA
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-500">{fimp.operatorName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MULTITENANT CONFIGURATION DIALOG MODAL (Sản phẩm, Vật tư & BOM) --- */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 border border-slate-100 rounded-[24px] p-6 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                  Cấu hình Kho, Sản phẩm &amp; Định mức BOM Doanh Nghiệp
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Tự do tùy biến danh mục nguyên vật liệu, thành phẩm và quy trình định mức đặc thù.</p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-tabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200 mb-4 shrink-0">
              <button
                onClick={() => setActiveConfigTab("product")}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  activeConfigTab === "product" ? "bg-white text-blue-950 shadow-xs font-bold" : "hover:text-slate-800"
                }`}
              >
                1. Sản phẩm &amp; Thiết kế
              </button>
              <button
                onClick={() => setActiveConfigTab("material")}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  activeConfigTab === "material" ? "bg-white text-blue-950 shadow-xs font-bold" : "hover:text-slate-800"
                }`}
              >
                2. Nguyên vật tư &amp; Tồn kho
              </button>
              <button
                onClick={() => setActiveConfigTab("bom")}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  activeConfigTab === "bom" ? "bg-white text-blue-950 shadow-xs font-bold" : "hover:text-slate-800"
                }`}
              >
                3. Thiết lập Định mức BOM
              </button>
            </div>

            {/* Tab content area - Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* TAB 1: Product Management */}
              {activeConfigTab === "product" && (
                <div className="space-y-4">
                  <form onSubmit={handleAddProduct} className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2 font-bold text-slate-700" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Thêm sản phẩm mới</div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Tên sản phẩm</label>
                      <input
                        type="text"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="Ví dụ: Bàn làm việc thông minh"
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Mã sản phẩm</label>
                      <input
                        type="text"
                        value={newProdCode}
                        onChange={(e) => setNewProdCode(e.target.value)}
                        placeholder="Ví dụ: SP-BLV-08"
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Đơn vị tính</label>
                      <input
                        type="text"
                        value={newProdUnit}
                        onChange={(e) => setNewProdUnit(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Giá bán định mức (VND)</label>
                      <input
                        type="number"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="col-span-2 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors text-center"
                      style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
                    >
                      + Lưu vào danh mục sản phẩm
                    </button>
                  </form>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Danh sách sản phẩm hiện tại ({products.length})</div>
                    <div className="border border-slate-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                            <th className="p-2.5">Mã</th>
                            <th className="p-2.5">Tên sản phẩm</th>
                            <th className="p-2.5">Đơn vị</th>
                            <th className="p-2.5 text-right">Đơn giá định mức</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {products.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="p-2 font-mono font-bold text-slate-teal">{p.code}</td>
                              <td className="p-2 text-slate-800">{p.name}</td>
                              <td className="p-2 text-slate-500">{p.unit}</td>
                              <td className="p-2 text-right font-mono text-slate-700">{p.defaultPrice.toLocaleString()}đ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Material Management */}
              {activeConfigTab === "material" && (
                <div className="space-y-4">
                  <form onSubmit={handleAddMaterial} className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2 font-bold text-slate-700" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Thêm nguyên vật liệu mới</div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Tên vật tư</label>
                      <input
                        type="text"
                        value={newMatName}
                        onChange={(e) => setNewMatName(e.target.value)}
                        placeholder="Ví dụ: Vải nỉ bọc ghế cao cấp"
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Mã vật tư</label>
                      <input
                        type="text"
                        value={newMatCode}
                        onChange={(e) => setNewMatCode(e.target.value)}
                        placeholder="Ví dụ: VT-VNI-07"
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Đơn vị tính</label>
                      <input
                        type="text"
                        value={newMatUnit}
                        onChange={(e) => setNewMatUnit(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Số lượng tồn kho ban đầu</label>
                      <input
                        type="number"
                        value={newMatStock}
                        onChange={(e) => setNewMatStock(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="col-span-2 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors text-center"
                      style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
                    >
                      + Lưu vào danh mục vật tư
                    </button>
                  </form>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Danh sách nguyên vật tư hiện tại ({materials.length})</div>
                    <div className="border border-slate-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                            <th className="p-2.5">Mã</th>
                            <th className="p-2.5">Tên vật tư</th>
                            <th className="p-2.5">Đơn vị</th>
                            <th className="p-2.5 text-right">Số lượng tồn kho</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {materials.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50/50">
                              <td className="p-2 font-mono font-bold text-slate-teal">{m.code}</td>
                              <td className="p-2 text-slate-800">{m.name}</td>
                              <td className="p-2 text-slate-500">{m.unit}</td>
                              <td className="p-2 text-right font-mono font-bold text-slate-700">{m.inStock.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BOM Configuration */}
              {activeConfigTab === "bom" && (
                <div className="space-y-4">
                  <form onSubmit={handleAddBOMItem} className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-3 gap-3 text-xs items-end">
                    <div className="col-span-3 font-bold text-slate-700" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>Thiết lập cấu phần định mức nguyên vật liệu (BOM)</div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Chọn sản phẩm</label>
                      <CustomSelect
                        value={bomSelectedProdId}
                        onChange={(val) => setBomSelectedProdId(val)}
                        options={products.map(p => ({ value: p.id, label: p.name }))}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Chọn vật tư định mức</label>
                      <CustomSelect
                        value={bomNewMatId}
                        onChange={(val) => setBomNewMatId(val)}
                        options={materials.map(m => ({ value: m.id, label: m.name }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold">Số lượng định mức / 1 thành phẩm</label>
                      <input
                        type="number"
                        step="0.01"
                        value={bomNewQty}
                        onChange={(e) => setBomNewQty(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:border-slate-teal font-mono"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="col-span-3 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors text-center"
                      style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
                    >
                      + Thiết lập / Cập nhật định mức
                    </button>
                  </form>

                  {/* Show Current BOM Items for selected product */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                      Bảng định mức BOM của sản phẩm: <span className="text-blue-950">{products.find(p => p.id === bomSelectedProdId)?.name || "Chưa chọn"}</span>
                    </div>

                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                            <th className="p-2.5">Vật tư cần dùng</th>
                            <th className="p-2.5">Mã vật tư</th>
                            <th className="p-2.5 text-right">Định mức sử dụng / 1 sản phẩm</th>
                            <th className="p-2.5 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(() => {
                            const curBom = boms.find(b => b.productId === bomSelectedProdId);
                            if (!curBom || curBom.items.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={4} className="text-center py-6 text-slate-400 italic">Sản phẩm này chưa được thiết lập định mức nguyên vật liệu.</td>
                                </tr>
                              );
                            }
                            return curBom.items.map(it => {
                              const targetM = materials.find(m => m.id === it.materialId);
                              return (
                                <tr key={it.materialId} className="hover:bg-slate-50/50">
                                  <td className="p-2 text-slate-800 font-semibold">{it.materialName}</td>
                                  <td className="p-2 font-mono text-slate-400 uppercase">({targetM?.code || "VT-MOCK"})</td>
                                  <td className="p-2 text-right font-mono font-bold text-slate-700">{it.quantityPerUnit} {targetM?.unit || "đv"}</td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => {
                                        const nextItems = curBom.items.filter(item => item.materialId !== it.materialId);
                                        const nextBoms = boms.map(b => 
                                          b.productId === bomSelectedProdId ? { ...b, items: nextItems } : b
                                        );
                                        setBoms(nextBoms);
                                        showAlert("Đã xóa", "Đã xóa vật tư ra khỏi định mức BOM.");
                                      }}
                                      className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 mt-4 text-right shrink-0">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-colors"
                style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
              >
                Hoàn tất cấu hình
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- REUSABLE SYSTEM ALERT DIALOG POPUP MODAL --- */}
      {alertInfo && alertInfo.isOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 border border-slate-100 rounded-[24px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center border ${
              alertInfo.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                : alertInfo.type === "error"
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : "bg-blue-50 border-blue-100 text-blue-950"
            }`}>
              {alertInfo.type === "success" ? (
                <Check className="w-6 h-6" />
              ) : alertInfo.type === "error" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Info className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-[14px] font-bold text-slate-800" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                {alertInfo.title}
              </h3>
              <p className="text-xs text-slate-500 font-poppins leading-relaxed">
                {alertInfo.message}
              </p>
            </div>

            <button
              onClick={() => setAlertInfo(null)}
              className="w-full py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-xs font-bold text-white shadow-lg cursor-pointer transition-all"
              style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
