import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { DashboardData, MONTH_NAMES, VIEW_ALL_MONTHS } from '../types';
import { AlertCircle, DollarSign, Wallet, TrendingUp, TrendingDown, Building2 } from 'lucide-react';

interface DashboardProps {
  data: DashboardData;
}

// Professional Color Palette
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-lg z-50">
        <p className="text-slate-300 text-sm mb-2 font-bold border-b border-slate-700 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-slate-400">{entry.name}:</span>
            <span className={`font-mono font-medium ${entry.value < 0 ? 'text-red-400' : 'text-slate-100'}`}>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // State
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(VIEW_ALL_MONTHS);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Current Date for filtering future events
  const today = new Date();

  // --- 1. Available Years ---
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    data.accountBalances.forEach(r => years.add(r.date.getFullYear()));
    data.funds.forEach(r => years.add(r.date.getFullYear()));
    // Fallback if empty
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  // --- 2. Data Processing & Calculations ---

  // Helper: Get expenses for a specific month/year
  const getTotalExpensesForMonth = (year: number, monthIndex: number) => {
    return data.expenses.reduce((acc, row) => acc + (row.values[monthIndex] || 0), 0);
  };

  // Calculate Monthly Financials (Revenue, Expenses, Balance)
  const monthlyFinancials = useMemo(() => {
    const financials = [];
    
    for (let i = 0; i < 12; i++) {
      // Skip months in the future for the current year
      if (selectedYear === today.getFullYear() && i > today.getMonth()) continue;
      // Skip months entirely for future years
      if (selectedYear > today.getFullYear()) continue;

      const monthDate = new Date(selectedYear, i, 1);
      
      // 1. Get Balance for this month
      // We look for a balance record in this month/year
      const currentBalanceRecord = data.accountBalances
        .filter(r => r.date.getMonth() === i && r.date.getFullYear() === selectedYear)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0]; // Get latest in month
      
      const currentBalance = currentBalanceRecord ? currentBalanceRecord.balance : 0;

      // 2. Get Previous Month Balance (for revenue calc)
      // Look for the last record BEFORE this month
      const prevDate = new Date(selectedYear, i, 0); // Last day of prev month
      const prevBalanceRecord = data.accountBalances
        .filter(r => r.date <= prevDate)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      const prevBalance = prevBalanceRecord ? prevBalanceRecord.balance : 0;

      // 3. Expenses
      const expenses = getTotalExpensesForMonth(selectedYear, i);

      // 4. Revenue Derivation:
      // EndBalance = StartBalance + Revenue - Expenses
      // Revenue = EndBalance - StartBalance + Expenses
      let revenue = 0;
      if (currentBalanceRecord) {
         revenue = (currentBalance - prevBalance) + expenses;
      }

      // 5. Funds Total
      const monthFunds = data.funds.filter(f => 
        f.date.getMonth() === i && f.date.getFullYear() === selectedYear
      );
      const totalFunds = monthFunds.reduce((acc, curr) => acc + curr.currentValue, 0);

      financials.push({
        monthIndex: i,
        name: MONTH_NAMES[i],
        revenue,
        expenses,
        balance: currentBalance,
        totalFunds,
        netWorth: currentBalance + totalFunds,
        // Mark as having data ONLY if we have a balance record. 
        // Revenue relies on balance, so without it, the data is incomplete.
        hasData: !!currentBalanceRecord 
      });
    }
    return financials;
  }, [data.accountBalances, data.expenses, data.funds, selectedYear]);

  // --- 3. KPI Logic (Single Month vs Accumulated) ---

  const kpiData = useMemo(() => {
    if (selectedMonthIndex === VIEW_ALL_MONTHS) {
      // Accumulated (Sum of Revenue/Expenses, Latest for Balance/NetWorth)
      // Only consider months that actually have data
      const validMonths = monthlyFinancials.filter(m => m.hasData);
      const lastMonth = validMonths[validMonths.length - 1];

      return {
        revenue: validMonths.reduce((acc, m) => acc + m.revenue, 0),
        expenses: validMonths.reduce((acc, m) => acc + m.expenses, 0),
        balance: lastMonth ? lastMonth.balance : 0,
        netWorth: lastMonth ? lastMonth.netWorth : 0,
        label: `Acumulado ${selectedYear}`
      };
    } else {
      // Single Month
      const monthData = monthlyFinancials.find(m => m.monthIndex === selectedMonthIndex);
      return {
        revenue: monthData ? monthData.revenue : 0,
        expenses: monthData ? monthData.expenses : 0,
        balance: monthData ? monthData.balance : 0,
        netWorth: monthData ? monthData.netWorth : 0,
        label: `${MONTH_NAMES[selectedMonthIndex]}/${selectedYear}`
      };
    }
  }, [monthlyFinancials, selectedMonthIndex, selectedYear]);

  // --- 4. Chart Data Preparation ---

  // A. Revenue vs Expenses Evolution
  const evolutionChartData = useMemo(() => {
    return monthlyFinancials
      .filter(m => m.hasData) // Filter out months with no data
      .map(m => ({
        name: m.name,
        Receitas: m.revenue,
        Despesas: m.expenses,
      }));
  }, [monthlyFinancials]);

  // B. Ordinary Account Balance Evolution
  const balanceChartData = useMemo(() => {
    return monthlyFinancials
      .filter(m => m.hasData) // Filter out months with no data
      .map(m => ({
        name: m.name,
        Saldo: m.balance
      }));
  }, [monthlyFinancials]);

  // C. Expense Composition (Pie)
  const expenseCompositionData = useMemo(() => {
    if (selectedMonthIndex === VIEW_ALL_MONTHS) {
        // Sum all months for year that have data
        const monthsToSum = monthlyFinancials
          .filter(m => m.hasData)
          .map(m => m.monthIndex);
        
        return data.expenses
          .map(row => ({
            name: row.category,
            value: row.values.reduce((acc, val, idx) => monthsToSum.includes(idx) ? acc + val : acc, 0)
          }))
          .filter(item => item.value > 0)
          .sort((a, b) => b.value - a.value);
    } else {
        // Single Month
        return data.expenses
          .map(row => ({
            name: row.category,
            value: row.values[selectedMonthIndex] || 0
          }))
          .filter(item => item.value > 0)
          .sort((a, b) => b.value - a.value);
    }
  }, [data.expenses, selectedMonthIndex, monthlyFinancials]);

  // D. Funds Composition (Bar)
  const fundsCompositionData = useMemo(() => {
    // If accumulated, we show the situation of the *last available valid month*
    let targetMonthIndex = selectedMonthIndex;
    
    if (selectedMonthIndex === VIEW_ALL_MONTHS) {
      // Find the last month that actually has data
      const lastValidMonth = monthlyFinancials.filter(m => m.hasData).pop();
      targetMonthIndex = lastValidMonth ? lastValidMonth.monthIndex : -1;
    }

    if (targetMonthIndex === -1) return [];

    return data.funds
      .filter(f => f.date.getMonth() === targetMonthIndex && f.date.getFullYear() === selectedYear)
      .map(f => ({
        name: f.fundName,
        'Valor Atual': f.currentValue
      }))
      .sort((a, b) => b['Valor Atual'] - a['Valor Atual']);
  }, [data.funds, selectedMonthIndex, selectedYear, monthlyFinancials]);


  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Situação das Contas</h1>
          <p className="text-slate-400 text-sm">Edificio Cond. Curitiba e Porto Alegre</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
           {/* Year Selector */}
           <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 inline-flex">
              <select 
                  className="bg-transparent text-white font-medium border-none rounded px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year} className="bg-slate-800">{year}</option>
                  ))}
              </select>
           </div>

           {/* Month Selector */}
           <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex flex-wrap gap-1 justify-center sm:justify-start">
             <button
                onClick={() => setSelectedMonthIndex(VIEW_ALL_MONTHS)}
                className={`px-4 py-2 text-xs font-bold rounded transition-all uppercase tracking-wide ${
                  selectedMonthIndex === VIEW_ALL_MONTHS 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Acumulado
              </button>
             <div className="w-px bg-slate-700 mx-1 hidden sm:block"></div>
             {MONTH_NAMES.map((m, idx) => {
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMonthIndex(idx)}
                    className={`px-3 py-2 text-xs font-medium rounded transition-all ${
                      selectedMonthIndex === idx 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                )
             })}
           </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Receitas */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp size={64} className="text-emerald-500" />
            </div>
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <TrendingUp size={20} />
                </div>
                <p className="text-slate-400 text-sm font-medium">Total Receitas</p>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
                {formatCurrency(kpiData.revenue)}
            </h3>
            <p className="text-slate-500 text-xs mt-2">{kpiData.label}</p>
        </div>

        {/* Despesas */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-red-500/50 transition-colors">
            <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingDown size={64} className="text-red-500" />
            </div>
            <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                    <TrendingDown size={20} />
                </div>
                <p className="text-slate-400 text-sm font-medium">Total Despesas</p>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
                {formatCurrency(kpiData.expenses)}
            </h3>
            <p className="text-slate-500 text-xs mt-2">{kpiData.label}</p>
        </div>

        {/* Saldo Ordinaria */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Wallet size={64} className="text-blue-500" />
            </div>
            <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Wallet size={20} />
                </div>
                <p className="text-slate-400 text-sm font-medium">Conta Ordinária</p>
            </div>
            <h3 className={`text-2xl font-bold tracking-tight ${kpiData.balance < 0 ? 'text-red-500' : 'text-blue-400'}`}>
                {formatCurrency(kpiData.balance)}
            </h3>
            <p className="text-slate-500 text-xs mt-2">Saldo Atual ({selectedYear})</p>
        </div>

        {/* Patrimonio Liquido */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Building2 size={64} className="text-purple-500" />
            </div>
             <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                    <Building2 size={20} />
                </div>
                <p className="text-slate-400 text-sm font-medium">Patrimônio Líquido</p>
            </div>
            <h3 className={`text-2xl font-bold tracking-tight ${kpiData.netWorth < 0 ? 'text-red-500' : 'text-purple-400'}`}>
                {formatCurrency(kpiData.netWorth)}
            </h3>
            <p className="text-slate-500 text-xs mt-2">Fundos + C. Ordinária</p>
        </div>

      </div>

      {/* Row 2: Main Evolution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue vs Expenses Chart */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Evolução Receitas vs Despesas</h3>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Receita</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Despesa</div>
                </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                            name="Receitas"
                            type="monotone" 
                            dataKey="Receitas" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            dot={{ fill: '#10b981', r: 3 }} 
                            activeDot={{ r: 5 }}
                        />
                        <Line 
                            name="Despesas"
                            type="monotone" 
                            dataKey="Despesas" 
                            stroke="#ef4444" 
                            strokeWidth={3} 
                            dot={{ fill: '#ef4444', r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Ordinary Account Evolution */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-6">Evolução Saldo Conta Ordinária</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceChartData}>
                        <defs>
                            <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                            name="Saldo"
                            type="monotone" 
                            dataKey="Saldo" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorSaldo)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* Row 3: Composition & Funds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Expense Composition */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6">
                Composição de Despesas 
                <span className="text-slate-500 font-normal ml-2 text-sm">
                   ({selectedMonthIndex === VIEW_ALL_MONTHS ? `Acumulado ${selectedYear}` : MONTH_NAMES[selectedMonthIndex]})
                </span>
            </h3>
            
            <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={expenseCompositionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {expenseCompositionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="sticky top-0 bg-slate-900">
                           <tr className="border-b border-slate-700">
                               <th className="py-2 text-slate-400 font-normal">Categoria</th>
                               <th className="py-2 text-slate-400 font-normal text-right">%</th>
                               <th className="py-2 text-slate-400 font-normal text-right">Valor</th>
                           </tr>
                        </thead>
                        <tbody>
                            {expenseCompositionData.map((entry, index) => {
                                const total = expenseCompositionData.reduce((acc, curr) => acc + curr.value, 0);
                                const percentage = total > 0 ? (entry.value / total) * 100 : 0;
                                return (
                                    <tr key={index} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                                        <td className="py-2.5 flex items-center gap-2 text-slate-200">
                                            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                                        </td>
                                        <td className="py-2.5 text-right text-slate-400 font-mono">{percentage.toFixed(1)}%</td>
                                        <td className="py-2.5 text-right text-slate-200 font-mono">{formatCurrency(entry.value)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          {/* Fund Balances */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-6">
                Situação dos Fundos 
                <span className="text-slate-500 font-normal ml-2 text-sm">
                    (Valor Atual)
                </span>
            </h3>
             <div className="h-80 w-full">
                {fundsCompositionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={fundsCompositionData} margin={{ left: 10, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                            <YAxis dataKey="name" type="category" width={130} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b'}} />
                            <Bar 
                                name="Valor Atual" 
                                dataKey="Valor Atual" 
                                fill="#8b5cf6" 
                                radius={[0, 4, 4, 0]} 
                                barSize={24}
                            >
                                {
                                  fundsCompositionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry['Valor Atual'] < 0 ? '#ef4444' : '#8b5cf6'} />
                                  ))
                                }
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-2">
                        <AlertCircle size={32} />
                        <p>Sem dados de fundos para este período</p>
                    </div>
                )}
            </div>
          </div>

      </div>
    </div>
  );
};