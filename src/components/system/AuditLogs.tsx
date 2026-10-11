import React, { useState, useMemo } from 'react';
import { FileText, Search, ShieldCheck, Download, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuditLogs: React.FC = () => {
  const { auditLogs, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAct = log.action.toLowerCase().includes(q);
        const matchDet = log.details.toLowerCase().includes(q);
        const matchUser = log.userName.toLowerCase().includes(q);
        if (!matchAct && !matchDet && !matchUser) return false;
      }
      return true;
    });
  }, [auditLogs, moduleFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Module', 'Action', 'User', 'Details'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.module,
      l.action,
      `"${l.userName}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#4F35F5]" />
            {t.auditLogs} & Security Trails
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Immutable operation history: order creation, stock write-offs, financial postings, and user changes
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.exportCSV}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action name, details, or user..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
          />
        </div>

        <select 
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none text-slate-700"
        >
          <option value="all">All Modules</option>
          <option value="orders">Orders</option>
          <option value="inventory">Inventory</option>
          <option value="finance">Finance</option>
          <option value="customers">Customers</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Operation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 text-slate-700">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-indigo-700">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800">
                    {log.userName}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-sans">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
