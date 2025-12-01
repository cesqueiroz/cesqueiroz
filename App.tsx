import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { FileUpload } from './components/FileUpload';
import { parseExpensesCSV, parseFundsCSV, parseBalanceCSV } from './utils/parser';
import { DEFAULT_EXPENSES_CSV, DEFAULT_FUNDS_CSV, DEFAULT_BALANCE_CSV } from './utils/defaultData';
import { DashboardData } from './types';
import { LayoutDashboard, RefreshCw, X } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    expenses: [],
    funds: [],
    accountBalances: []
  });

  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);

  // Load default data on mount
  useEffect(() => {
    const expenses = parseExpensesCSV(DEFAULT_EXPENSES_CSV);
    const funds = parseFundsCSV(DEFAULT_FUNDS_CSV);
    const balances = parseBalanceCSV(DEFAULT_BALANCE_CSV);
    
    setData({
      expenses,
      funds,
      accountBalances: balances
    });
  }, []);

  const handleUploadExpenses = (content: string) => {
    try {
      const expenses = parseExpensesCSV(content);
      setData(prev => ({ ...prev, expenses }));
    } catch (e) {
      console.error("Error parsing expenses", e);
      alert("Erro ao ler arquivo de despesas.");
    }
  };

  const handleUploadFunds = (content: string) => {
    try {
      const funds = parseFundsCSV(content);
      setData(prev => ({ ...prev, funds }));
    } catch (e) {
      console.error("Error parsing funds", e);
      alert("Erro ao ler arquivo de fundos.");
    }
  };

  const handleUploadBalances = (content: string) => {
    try {
      const balances = parseBalanceCSV(content);
      setData(prev => ({ ...prev, accountBalances: balances }));
    } catch (e) {
      console.error("Error parsing balances", e);
      alert("Erro ao ler arquivo de saldos.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3 text-slate-100">
            <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Condomínio Dashboard</h2>
              <p className="text-slate-400 text-sm">Gestão Financeira & Analítica</p>
            </div>
          </div>

          <button 
            onClick={() => setIsUploadPanelOpen(!isUploadPanelOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isUploadPanelOpen 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            }`}
          >
            {isUploadPanelOpen ? <X size={18} /> : <RefreshCw size={18} />}
            <span>{isUploadPanelOpen ? 'Fechar Importação' : 'Atualizar Dados'}</span>
          </button>
        </header>

        {isUploadPanelOpen && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 mb-2">
                <h3 className="text-slate-300 text-sm font-semibold mb-4 uppercase tracking-wider">Importação de Arquivos</h3>
                <FileUpload 
                  onUploadExpenses={handleUploadExpenses}
                  onUploadFunds={handleUploadFunds}
                  onUploadBalances={handleUploadBalances}
                />
                <p className="text-xs text-slate-500 mt-4">
                  * Selecione os arquivos CSV correspondentes para atualizar as informações do dashboard. O sistema processará os dados automaticamente.
                </p>
            </div>
          </div>
        )}

        <Dashboard data={data} />
        
        <footer className="text-center text-slate-600 text-xs mt-12 pb-4">
          © 2025 Edificio Cond. Curitiba e Porto Alegre. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
};

export default App;