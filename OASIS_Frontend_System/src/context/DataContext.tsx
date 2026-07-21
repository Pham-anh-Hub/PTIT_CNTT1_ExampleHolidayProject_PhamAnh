import React, { createContext, useState, ReactNode } from 'react';
import {
  Employee,
  Contract,
  SalesOrder,
  ProductionPlan,
  LeaveRequest,
  ClockLog,
  MaterialImport,
  FinishedProductImport,
} from '../types';
import {
  SAMPLE_EMPLOYEES,
  SAMPLE_CONTRACTS,
  INITIAL_ORDERS,
  INITIAL_PLANS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_CLOCK_LOGS,
  INITIAL_MATERIAL_IMPORTS,
  INITIAL_FINISHED_IMPORTS,
} from '../data';

type DataContextProps = {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  contracts: Contract[];
  setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
  orders: SalesOrder[];
  setOrders: React.Dispatch<React.SetStateAction<SalesOrder[]>>;
  plans: ProductionPlan[];
  setPlans: React.Dispatch<React.SetStateAction<ProductionPlan[]>>;
  leaves: LeaveRequest[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  logs: ClockLog[];
  setLogs: React.Dispatch<React.SetStateAction<ClockLog[]>>;
  materialImports: MaterialImport[];
  setMaterialImports: React.Dispatch<React.SetStateAction<MaterialImport[]>>;
  finishedImports: FinishedProductImport[];
  setFinishedImports: React.Dispatch<React.SetStateAction<FinishedProductImport[]>>;
  // Shared notifications — dùng chung giữa Dashboard & BodSales
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  unreadNotifCount: number;
  setUnreadNotifCount: React.Dispatch<React.SetStateAction<number>>;
};

export const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES);
  const [contracts, setContracts] = useState<Contract[]>(SAMPLE_CONTRACTS);
  const [orders, setOrders] = useState<SalesOrder[]>(INITIAL_ORDERS);
  const [plans, setPlans] = useState<ProductionPlan[]>(INITIAL_PLANS);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [logs, setLogs] = useState<ClockLog[]>(INITIAL_CLOCK_LOGS);
  const [materialImports, setMaterialImports] = useState<MaterialImport[]>(INITIAL_MATERIAL_IMPORTS);
  const [finishedImports, setFinishedImports] = useState<FinishedProductImport[]>(INITIAL_FINISHED_IMPORTS);
  // Notifications chia sẻ — App.tsx sẽ ghi, Dashboard & BodSales đọc
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  return (
    <DataContext.Provider
      value={{
        employees,
        setEmployees,
        contracts,
        setContracts,
        orders,
        setOrders,
        plans,
        setPlans,
        leaves,
        setLeaves,
        logs,
        setLogs,
        materialImports,
        setMaterialImports,
        finishedImports,
        setFinishedImports,
        notifications,
        setNotifications,
        unreadNotifCount,
        setUnreadNotifCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
