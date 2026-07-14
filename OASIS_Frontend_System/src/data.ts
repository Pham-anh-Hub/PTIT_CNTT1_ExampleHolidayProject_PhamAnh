import { Employee, Contract, SalesOrder, Product, Material, ProductBOM, ProductionPlan, LeaveRequest, ClockLog, PayslipItem, MaterialImport, FinishedProductImport, SupplierPayable } from "./types";

export const SAMPLE_TENANTS: any[] = [];

export const DEPARTMENTS = [
  { id: "BOD", name: "Ban Giám Đốc (BOD)" },
  { id: "HR", name: "Phòng Hành chính - Nhân sự (HR)" },
  { id: "SALES", name: "Phòng Kinh doanh & Marketing (Sales)" },
  { id: "PROD", name: "Bộ phận Sản xuất & Kho (Operations)" },
  { id: "QA", name: "Phòng Kiểm soát Chất lượng (QA/QC)" }
];

export const POSITIONS = [
  { id: "CEO", name: "Giám Đốc Điều Hành (CEO)", deptId: "BOD" },
  { id: "HR_MGR", name: "Trưởng phòng Nhân sự", deptId: "HR" },
  { id: "HR_STAFF", name: "Chuyên viên Tuyển dụng & C&B", deptId: "HR" },
  { id: "SALES_MGR", name: "Trưởng phòng Kinh doanh", deptId: "SALES" },
  { id: "SALES_STAFF", name: "Nhân viên Kinh doanh", deptId: "SALES" },
  { id: "PROD_MGR", name: "Trưởng phòng Sản xuất", deptId: "PROD" },
  { id: "PROD_SUPER", name: "Giám sát Phân xưởng", deptId: "PROD" },
  { id: "WORKER", name: "Công nhân Kỹ thuật Phân xưởng", deptId: "PROD" }
];

export const SAMPLE_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    fullname: "Phan Văn Hùng",
    code: "GV-CEO-001",
    birthday: "1982-05-14",
    email: "hung.phan@goviet.com",
    phone: "0903123456",
    departmentId: "BOD",
    positionId: "CEO",
    status: "ACTIVE"
  },
  {
    id: "emp-2",
    fullname: "Trần Thị Kim Oanh",
    code: "GV-HRM-002",
    birthday: "1988-11-20",
    email: "oanh.tran@goviet.com",
    phone: "0912987654",
    departmentId: "HR",
    positionId: "HR_MGR",
    status: "ACTIVE"
  },
  {
    id: "emp-3",
    fullname: "Lê Hoàng Long",
    code: "GV-SLM-003",
    birthday: "1990-03-25",
    email: "long.le@goviet.com",
    phone: "0987111222",
    departmentId: "SALES",
    positionId: "SALES_MGR",
    status: "ACTIVE"
  },
  {
    id: "emp-4",
    fullname: "Nguyễn Văn Đạt",
    code: "GV-SLS-004",
    birthday: "1995-07-08",
    email: "dat.nguyen@goviet.com",
    phone: "0976555444",
    departmentId: "SALES",
    positionId: "SALES_STAFF",
    status: "ACTIVE"
  },
  {
    id: "emp-5",
    fullname: "Phạm Minh Hoàng",
    code: "GV-PRM-005",
    birthday: "1984-09-12",
    email: "hoang.pham@goviet.com",
    phone: "0914222333",
    departmentId: "PROD",
    positionId: "PROD_MGR",
    status: "ACTIVE"
  },
  {
    id: "emp-6",
    fullname: "Nguyễn Công Binh",
    code: "GV-WKR-006",
    birthday: "1994-01-30",
    email: "binh.nguyen@goviet.com",
    phone: "0934888999",
    departmentId: "PROD",
    positionId: "WORKER",
    status: "ACTIVE"
  },
  {
    id: "emp-7",
    fullname: "Lê Văn Tùng",
    code: "GV-WKR-007",
    birthday: "1997-12-15",
    email: "tung.le@goviet.com",
    phone: "0963777888",
    departmentId: "PROD",
    positionId: "WORKER",
    status: "ACTIVE"
  },
  {
    id: "emp-8",
    fullname: "Vũ Thị Hương",
    code: "GV-HRS-008",
    birthday: "1999-04-18",
    email: "huong.vu@goviet.com",
    phone: "0945666777",
    departmentId: "HR",
    positionId: "HR_STAFF",
    status: "PROBATION"
  }
];

export const SAMPLE_CONTRACTS: Contract[] = [
  {
    id: "con-1",
    employeeId: "emp-1",
    employeeName: "Phan Văn Hùng",
    code: "HĐ-GV-2022-01",
    type: "Hợp đồng Không xác định thời hạn",
    startDate: "2022-01-01",
    endDate: "None",
    basicSalary: 45000000,
    status: "APPROVED",
    approvedBy: "Hội Đồng Quản Trị",
    attachmentName: "hop_dong_bld_ceo.pdf"
  },
  {
    id: "con-2",
    employeeId: "emp-2",
    employeeName: "Trần Thị Kim Oanh",
    code: "HĐ-GV-2023-04",
    type: "Hợp đồng Xác định thời hạn (3 năm)",
    startDate: "2023-04-01",
    endDate: "2026-04-01",
    basicSalary: 22000000,
    status: "APPROVED",
    approvedBy: "Phan Văn Hùng",
    attachmentName: "hdld_oanhttk.pdf"
  },
  {
    id: "con-3",
    employeeId: "emp-6",
    employeeName: "Nguyễn Công Binh",
    code: "HĐ-GV-2024-02",
    type: "Hợp đồng Xác định thời hạn (1 năm)",
    startDate: "2024-02-15",
    endDate: "2025-02-15",
    basicSalary: 9500000,
    status: "APPROVED",
    approvedBy: "Trần Thị Kim Oanh",
    attachmentName: "hd_congnhan_binhnc.pdf"
  },
  {
    id: "con-4",
    employeeId: "emp-8",
    employeeName: "Vũ Thị Hương",
    code: "HĐ-GV-2026-05",
    type: "Hợp đồng Thử việc (2 tháng)",
    startDate: "2026-05-15",
    endDate: "2026-07-15",
    basicSalary: 7500000,
    status: "PENDING",
    attachmentName: "hd_thuviec_huongvt.pdf"
  }
];

export const SAMPLE_PRODUCTS: Product[] = [
  { id: "prod-1", name: "Bàn ăn Gỗ Sồi 6 ghế Premium", code: "SP-BAS-01", unit: "Bộ", defaultPrice: 18500000 },
  { id: "prod-2", name: "Ghế xoay Công thái học Ergonomic", code: "SP-GCT-02", unit: "Chiếc", defaultPrice: 4200000 },
  { id: "prod-3", name: "Sofa Da bò Ý Nhập khẩu", code: "SP-SFD-03", unit: "Bộ", defaultPrice: 52000000 },
  { id: "prod-4", name: "Tủ Quần Áo Gỗ MDF 4 Cánh", code: "SP-TQA-04", unit: "Chiếc", defaultPrice: 12500000 },
  { id: "prod-5", name: "Kệ sách Gỗ Tự nhiên đa năng", code: "SP-KSA-05", unit: "Chiếc", defaultPrice: 3500000 }
];

export const SAMPLE_MATERIALS: Material[] = [
  { id: "mat-1", name: "Gỗ sồi Mỹ nhập khẩu", code: "VT-GSO-01", inStock: 45, unit: "m3" },
  { id: "mat-2", name: "Ốc vít & Phụ kiện liên kết", code: "VT-OVI-02", inStock: 5000, unit: "Cái" },
  { id: "mat-3", name: "Mút xốp & Cao su đệm", code: "VT-MUT-03", inStock: 12, unit: "Cuộn" },
  { id: "mat-4", name: "Sơn bóng PU cao cấp", code: "VT-SON-04", inStock: 80, unit: "Thùng" },
  { id: "mat-5", name: "Gỗ ép MDF chống ẩm 18mm", code: "VT-MDF-05", inStock: 15, unit: "Tấm" },
  { id: "mat-6", name: "Da bò thật nguyên tấm", code: "VT-DAB-06", inStock: 4, unit: "Tấm" }
];

export const SAMPLE_BOMS: ProductBOM[] = [
  {
    productId: "prod-1", // Bàn ăn gỗ sồi
    items: [
      { materialId: "mat-1", materialName: "Gỗ sồi Mỹ nhập khẩu", quantityPerUnit: 0.15 },
      { materialId: "mat-2", materialName: "Ốc vít & Phụ kiện liên kết", quantityPerUnit: 24 },
      { materialId: "mat-4", materialName: "Sơn bóng PU cao cấp", quantityPerUnit: 0.5 }
    ]
  },
  {
    productId: "prod-3", // Sofa da bò
    items: [
      { materialId: "mat-1", materialName: "Gỗ sồi Mỹ nhập khẩu", quantityPerUnit: 0.05 },
      { materialId: "mat-2", materialName: "Ốc vít & Phụ kiện liên kết", quantityPerUnit: 12 },
      { materialId: "mat-3", materialName: "Mút xốp & Cao su đệm", quantityPerUnit: 0.8 },
      { materialId: "mat-6", materialName: "Da bò thật nguyên tấm", quantityPerUnit: 1.5 }
    ]
  },
  {
    productId: "prod-4", // Tủ MDF
    items: [
      { materialId: "mat-5", materialName: "Gỗ ép MDF chống ẩm 18mm", quantityPerUnit: 2.2 },
      { materialId: "mat-2", materialName: "Ốc vít & Phụ kiện liên kết", quantityPerUnit: 36 },
      { materialId: "mat-4", materialName: "Sơn bóng PU cao cấp", quantityPerUnit: 0.2 }
    ]
  }
];

export const INITIAL_ORDERS: SalesOrder[] = [
  {
    id: "ord-1",
    code: "ĐH-20260701-01",
    customerName: "Công ty Cổ phần Decor Xinh",
    orderDate: "2026-07-01",
    notes: "Giao hàng gấp trước ngày 15/7/2026. Kiểm tra kỹ lớp sơn PU.",
    totalAmount: 112500000, // 3 * 18.5M (Bàn ăn) + 10 * 3.5M (Kệ sách) + 5 * 4.2M (Ghế xoay)
    status: "APPROVED",
    items: [
      { id: "item-1-1", productId: "prod-1", productName: "Bàn ăn Gỗ Sồi 6 ghế Premium", unit: "Bộ", quantity: 3, price: 18500000, subtotal: 55500000 },
      { id: "item-1-2", productId: "prod-5", productName: "Kệ sách Gỗ Tự nhiên đa năng", unit: "Chiếc", quantity: 10, price: 3500000, subtotal: 35000000 },
      { id: "item-1-3", productId: "prod-2", productName: "Ghế xoay Công thái học Ergonomic", unit: "Chiếc", quantity: 5, price: 4200000, subtotal: 21000000 }
    ],
    createdAt: "2026-07-01T09:30:00-07:00"
  },
  {
    id: "ord-2",
    code: "ĐH-20260705-02",
    customerName: "Khách sạn Imperial Vũng Tàu",
    orderDate: "2026-07-05",
    notes: "Đơn hàng vượt ngưỡng 50 triệu - Chờ sếp duyệt nâng hạn mức thanh toán trả chậm 30 ngày.",
    totalAmount: 208000000, // 4 * 52.0M (Sofa da)
    status: "PENDING",
    items: [
      { id: "item-2-1", productId: "prod-3", productName: "Sofa Da bò Ý Nhập khẩu", unit: "Bộ", quantity: 4, price: 52000000, subtotal: 208000000 }
    ],
    createdAt: "2026-07-05T14:15:00-07:00"
  },
  {
    id: "ord-3",
    code: "ĐH-20260706-03",
    customerName: "Anh Nguyễn Tuấn Anh (Biệt thự Ciputra)",
    orderDate: "2026-07-06",
    notes: "Hộ gia đình, thanh toán tiền mặt 100% khi bàn giao.",
    totalAmount: 43000000, // 2 * 18.5M (Bàn ăn) + 1 * 6.0M
    status: "APPROVED",
    items: [
      { id: "item-3-1", productId: "prod-1", productName: "Bàn ăn Gỗ Sồi 6 ghế Premium", unit: "Bộ", quantity: 2, price: 18500000, subtotal: 37000000 },
      { id: "item-3-2", productId: "prod-5", productName: "Kệ sách Gỗ Tự nhiên đa năng", unit: "Chiếc", quantity: 1, price: 3500000, subtotal: 3500000 },
      { id: "item-3-3", productId: "prod-2", productName: "Ghế xoay Công thái học Ergonomic", unit: "Chiếc", quantity: 1, price: 2500000, subtotal: 2500000 }
    ],
    createdAt: "2026-07-06T11:00:00-07:00"
  }
];

export const INITIAL_PLANS: ProductionPlan[] = [
  {
    id: "plan-1",
    code: "KHSX-2026-01",
    productId: "prod-1",
    productName: "Bàn ăn Gỗ Sồi 6 ghế Premium",
    plannedQuantity: 20,
    startDate: "2026-07-08",
    endDate: "2026-07-20",
    stages: [
      { id: "stage-1-1", sequenceNo: 1, name: "Cắt xẻ phôi gỗ", workerId: "emp-6", workerName: "Nguyễn Công Binh", wageType: "HOURLY", unitWage: 45000 },
      { id: "stage-1-2", sequenceNo: 2, name: "Chà nhám & Làm mịn bề mặt", workerId: "emp-7", workerName: "Lê Văn Tùng", wageType: "PIECE_RATE", unitWage: 120000 },
      { id: "stage-1-3", sequenceNo: 3, name: "Phun sơn lót & PU màu", workerId: "emp-6", workerName: "Nguyễn Công Binh", wageType: "PIECE_RATE", unitWage: 250000 },
      { id: "stage-1-4", sequenceNo: 4, name: "Lắp ráp liên kết & Kiểm QA/QC", workerId: "emp-7", workerName: "Lê Văn Tùng", workerId_2: "emp-7", wageType: "HOURLY", unitWage: 50000 }
    ] as any[],
    status: "RUNNING"
  },
  {
    id: "plan-2",
    code: "KHSX-2026-02",
    productId: "prod-3",
    productName: "Sofa Da bò Ý Nhập khẩu",
    plannedQuantity: 5,
    startDate: "2026-07-15",
    endDate: "2026-07-30",
    stages: [
      { id: "stage-2-1", sequenceNo: 1, name: "Sản xuất Khung gỗ chịu lực", workerId: "emp-6", workerName: "Nguyễn Công Binh", wageType: "HOURLY", unitWage: 50000 },
      { id: "stage-2-2", sequenceNo: 2, name: "Bọc nệm mút & Căng da bò", workerId: "emp-7", workerName: "Lê Văn Tùng", wageType: "PIECE_RATE", unitWage: 800000 }
    ],
    status: "PENDING"
  }
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "lr-1",
    employeeId: "emp-6",
    employeeName: "Nguyễn Công Binh",
    startDate: "2026-07-10",
    endDate: "2026-07-11",
    reason: "Khám sức khỏe định kỳ tại Bệnh viện đa khoa tỉnh",
    status: "PENDING",
    createdAt: "2026-07-07T10:00:00-07:00"
  },
  {
    id: "lr-2",
    employeeId: "emp-4",
    employeeName: "Nguyễn Văn Đạt",
    startDate: "2026-07-05",
    endDate: "2026-07-06",
    reason: "Giải quyết việc cá nhân gia đình ở quê",
    status: "APPROVED",
    createdAt: "2026-07-04T08:15:00-07:00"
  }
];

export const INITIAL_CLOCK_LOGS: ClockLog[] = [
  {
    id: "log-1",
    workerId: "emp-6",
    workerName: "Nguyễn Công Binh",
    timestamp: "2026-07-07T07:55:12",
    type: "IN",
    location: "Cổng phân xưởng gỗ 1"
  },
  {
    id: "log-2",
    workerId: "emp-7",
    workerName: "Lê Văn Tùng",
    timestamp: "2026-07-07T07:58:34",
    type: "IN",
    location: "Cổng phân xưởng gỗ 1"
  }
];

export const SAMPLE_PAYSLIPS: PayslipItem[] = [
  {
    id: "slip-1",
    month: "2026-06",
    basicSalary: 9500000,
    pieceRateEarnings: 3850000,
    overtimeEarnings: 1200000,
    allowances: 1000000, // Xăng xe, ăn trưa
    deductions: 1050000, // BHXH, công đoàn
    netPay: 14500000,
    details: [
      { stageName: "Chà nhám mặt bàn SP-BAS-01", quantity: 15, unitWage: 120000, amount: 1800000 },
      { stageName: "Sơn lót & PU tủ SP-TQA-04", quantity: 10, unitWage: 150000, amount: 1500000 },
      { stageName: "Lắp ráp hộc kéo SP-KSA-05", quantity: 11, unitWage: 50000, amount: 550000 }
    ]
  },
  {
    id: "slip-2",
    month: "2026-05",
    basicSalary: 9500000,
    pieceRateEarnings: 2900000,
    overtimeEarnings: 800000,
    allowances: 1000000,
    deductions: 1050000,
    netPay: 13150000,
    details: [
      { stageName: "Chà nhám ghế SP-GCT-02", quantity: 20, unitWage: 80000, amount: 1600000 },
      { stageName: "Đóng gói hoàn thiện SP-BAS-01", quantity: 13, unitWage: 100000, amount: 1300000 }
    ]
  }
];

export const INITIAL_MATERIAL_IMPORTS: MaterialImport[] = [
  {
    id: "imp-1",
    code: "PNK-VT-001",
    materialId: "mat-1",
    materialName: "Gỗ sồi Mỹ nhập khẩu",
    materialCode: "VT-GSO-01",
    quantity: 20,
    unitPrice: 8500000,
    totalAmount: 170000000,
    supplier: "Công ty Lâm sản Tây Nguyên",
    importDate: "2026-07-02",
    status: "APPROVED"
  },
  {
    id: "imp-2",
    code: "PNK-VT-002",
    materialId: "mat-4",
    materialName: "Sơn bóng PU cao cấp",
    materialCode: "VT-SON-04",
    quantity: 40,
    unitPrice: 1200000,
    totalAmount: 48000000,
    supplier: "Sơn Kansai Việt Nam",
    importDate: "2026-07-04",
    status: "APPROVED"
  },
  {
    id: "imp-3",
    code: "PNK-VT-003",
    materialId: "mat-2",
    materialName: "Ốc vít & Phụ kiện liên kết",
    materialCode: "VT-OVI-02",
    quantity: 2000,
    unitPrice: 1500,
    totalAmount: 3000000,
    supplier: "Kim khí Phú Tiến",
    importDate: "2026-07-05",
    status: "APPROVED"
  }
];

export const INITIAL_FINISHED_IMPORTS: FinishedProductImport[] = [
  {
    id: "fimp-1",
    code: "PNK-TP-001",
    planCode: "KHSX-2026-01",
    productId: "prod-1",
    productName: "Bàn ăn Gỗ Sồi 6 ghế Premium",
    productCode: "SP-BAS-01",
    quantity: 10,
    unit: "Bộ",
    qaStatus: "PASSED",
    importDate: "2026-07-09",
    operatorName: "Phạm Minh Hoàng"
  },
  {
    id: "fimp-2",
    code: "PNK-TP-002",
    planCode: "KHSX-2026-01",
    productId: "prod-1",
    productName: "Bàn ăn Gỗ Sồi 6 ghế Premium",
    productCode: "SP-BAS-01",
    quantity: 1,
    unit: "Bộ",
    qaStatus: "FAILED",
    importDate: "2026-07-09",
    operatorName: "Phạm Minh Hoàng"
  },
  {
    id: "fimp-3",
    code: "PNK-TP-003",
    planCode: "KHSX-2026-02",
    productId: "prod-3",
    productName: "Sofa Da bò Ý Nhập khẩu",
    productCode: "SP-SFD-03",
    quantity: 3,
    unit: "Bộ",
    qaStatus: "PASSED",
    importDate: "2026-07-10",
    operatorName: "Phạm Minh Hoàng"
  }
];

export const INITIAL_SUPPLIER_PAYABLES: SupplierPayable[] = [
  {
    id: "spay-1",
    supplierName: "Công ty Lâm sản Tây Nguyên",
    totalAmount: 170000000,
    paidAmount: 100000000,
    remainingAmount: 70000000,
    dueDate: "2026-07-25",
    status: "WARNING"
  },
  {
    id: "spay-2",
    supplierName: "Sơn Kansai Việt Nam",
    totalAmount: 48000000,
    paidAmount: 48000000,
    remainingAmount: 0,
    dueDate: "2026-07-10",
    status: "GOOD"
  },
  {
    id: "spay-3",
    supplierName: "Kim khí Phú Tiến",
    totalAmount: 3000000,
    paidAmount: 0,
    remainingAmount: 3000000,
    dueDate: "2026-07-15",
    status: "WARNING"
  }
];

