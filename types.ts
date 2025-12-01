export interface ExpenseRow {
  category: string;
  values: number[]; // Index 0 = Jan, 1 = Feb, etc.
}

export interface FundRecord {
  date: Date;
  fundName: string;
  balance: number;
  currentValue: number;
}

export interface AccountBalanceRecord {
  date: Date;
  balance: number;
}

export interface DashboardData {
  expenses: ExpenseRow[];
  funds: FundRecord[];
  accountBalances: AccountBalanceRecord[];
}

export enum Month {
  JAN = 0,
  FEB = 1,
  MAR = 2,
  APR = 3,
  MAY = 4,
  JUN = 5,
  JUL = 6,
  AUG = 7,
  SEP = 8,
  OCT = 9,
  NOV = 10,
  DEC = 11
}

export const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const VIEW_ALL_MONTHS = -1; // Represents "Acumulado"