import { ExpenseRow, FundRecord, AccountBalanceRecord, MONTH_NAMES } from '../types';

// Helper to parse "R$ 39.476,27" or "39.476,27" or "-" into a number
export const parseCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  const cleanValue = value.trim();
  if (cleanValue === '-' || cleanValue === '' || cleanValue === '0,00') return 0;
  
  // Remove 'R$' and spaces, remove dots (thousands), replace comma with dot
  const numberStr = cleanValue
    .replace('R$', '')
    .trim()
    .split('.')
    .join('')
    .replace(',', '.');
    
  const num = parseFloat(numberStr);
  return isNaN(num) ? 0 : num;
};

// Helper to parse date "DD/MM/YYYY"
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  // Month is 0-indexed in JS Date
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
};

export const parseExpensesCSV = (csvText: string): ExpenseRow[] => {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  const data: ExpenseRow[] = [];
  
  // Skip header if it exists (starts with Categoria)
  const startIndex = lines[0].toLowerCase().includes('categoria') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 2) continue;

    const category = cols[0].trim();
    const values: number[] = [];

    // Assuming columns 1 to 12 are Jan to Dec (or however many exist)
    for (let j = 1; j < cols.length; j++) {
      values.push(parseCurrency(cols[j]));
    }

    // Pad with zeros if months are missing up to 12
    while (values.length < 12) {
      values.push(0);
    }

    data.push({ category, values });
  }
  return data;
};

export const parseFundsCSV = (csvText: string): FundRecord[] => {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  const data: FundRecord[] = [];
  
  const startIndex = lines[0].toLowerCase().includes('data') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 4) continue;

    const date = parseDate(cols[0]);
    if (!date) continue;

    data.push({
      date,
      fundName: cols[1].trim(),
      balance: parseCurrency(cols[2]),
      currentValue: parseCurrency(cols[3])
    });
  }
  return data;
};

export const parseBalanceCSV = (csvText: string): AccountBalanceRecord[] => {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  const data: AccountBalanceRecord[] = [];
  
  const startIndex = lines[0].toLowerCase().includes('data') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 2) continue;

    const date = parseDate(cols[0]);
    if (!date) continue;

    data.push({
      date,
      balance: parseCurrency(cols[1])
    });
  }
  return data;
};