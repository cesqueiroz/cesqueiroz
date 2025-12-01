import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onUploadExpenses: (content: string) => void;
  onUploadFunds: (content: string) => void;
  onUploadBalances: (content: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadExpenses, onUploadFunds, onUploadBalances }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, callback: (content: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          callback(text);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
      <div className="flex items-center space-x-2">
        <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-sm transition-colors w-full justify-center border border-slate-700">
          <Upload size={16} />
          <span>Upload Despesas</span>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileChange(e, onUploadExpenses)} />
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-sm transition-colors w-full justify-center border border-slate-700">
          <Upload size={16} />
          <span>Upload Fundos</span>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileChange(e, onUploadFunds)} />
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-sm transition-colors w-full justify-center border border-slate-700">
          <Upload size={16} />
          <span>Upload Saldo Conta</span>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileChange(e, onUploadBalances)} />
        </label>
      </div>
    </div>
  );
};