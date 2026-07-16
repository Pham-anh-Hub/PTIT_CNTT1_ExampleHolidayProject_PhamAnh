export interface Tenant {
  id: string;
  name: string;
  industry?: string;
  subdomain?: string;
  logo?: string;
  taxCode?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  subscriptionPlan?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  username: string;
  fullname: string;
  role: string;
  email: string;
  tenantId: string;
  avatar?: string;
}

export type EmployeeStatus = 'PROBATION' | 'ACTIVE' | 'RESIGNED';

export interface Employee {
  id: string;
  fullname: string;
  code: string;
  birthday: string;
  email: string;
  phone: string;
  departmentId: string;
  positionId: string;
  status: EmployeeStatus;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  code: string;
  type: string;
  startDate: string;
  endDate: string;
  basicSalary: number;
  status: ApprovalStatus;
  approvedBy?: string;
  rejectionReason?: string;
  attachmentName?: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface SalesOrder {
  id: string;
  code: string;
  customerName: string;
  orderDate: string;
  notes: string;
  totalAmount: number;
  status: ApprovalStatus;
  items: SalesOrderItem[];
  rejectionReason?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  code: string;
  inStock: number;
  unit: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  defaultPrice: number;
}

export interface BOMItem {
  materialId: string;
  materialName: string;
  quantityPerUnit: number;
}

export interface ProductBOM {
  productId: string;
  items: BOMItem[];
}

export interface ProductionStage {
  id: string;
  sequenceNo: number;
  name: string;
  workerId: string;
  workerName: string;
  wageType: 'HOURLY' | 'PIECE_RATE';
  unitWage: number;
}

export interface ProductionPlan {
  id: string;
  code: string;
  productId: string;
  productName: string;
  plannedQuantity: number;
  startDate: string;
  endDate: string;
  stages: ProductionStage[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
  rejectionReason?: string;
}

export interface ClockLog {
  id: string;
  workerId: string;
  workerName: string;
  timestamp: string;
  type: 'IN' | 'OUT';
  location: string;
}

export interface PayslipItem {
  id: string;
  month: string;
  basicSalary: number;
  pieceRateEarnings: number;
  overtimeEarnings: number;
  allowances: number;
  deductions: number;
  netPay: number;
  details: {
    stageName: string;
    quantity: number;
    unitWage: number;
    amount: number;
  }[];
}

export interface MaterialImport {
  id: string;
  code: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  supplier: string;
  importDate: string;
  status: 'PENDING' | 'APPROVED';
}

export interface FinishedProductImport {
  id: string;
  code: string;
  planCode: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  qaStatus: 'PASSED' | 'FAILED';
  importDate: string;
  operatorName: string;
}

export interface SupplierPayable {
  id: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'DANGER' | 'WARNING' | 'GOOD';
}

