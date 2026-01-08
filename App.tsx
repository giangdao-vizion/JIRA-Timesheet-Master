
import React, { useState, useCallback, useMemo } from 'react';
import { parseTimesheetCsv } from './utils/jira-parser';
import { ParsedData, TimesheetRow } from './types';
import TimesheetTable from './components/TimesheetTable';
import MemberSummaryTable from './components/MemberSummaryTable';

const SAMPLE_CSV = `Avatar,Worklog Author,1-Dec-25,2-Dec-25,3-Dec-25,4-Dec-25,5-Dec-25,6-Dec-25,7-Dec-25,8-Dec-25,9-Dec-25,10-Dec-25,11-Dec-25,12-Dec-25,13-Dec-25,14-Dec-25,15-Dec-25,16-Dec-25,17-Dec-25,18-Dec-25,19-Dec-25,20-Dec-25,21-Dec-25,22-Dec-25,23-Dec-25,24-Dec-25,25-Dec-25,26-Dec-25,27-Dec-25,28-Dec-25,29-Dec-25,30-Dec-25,31-Dec-25,Started,Key,Comment
https://picsum.photos/48/48?random=1,Dang Hoang Dai Nghia,8h,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2025-12-01T08:00:00.000+0700,UPDP-2,
https://picsum.photos/48/48?random=2,Dang Hoang Dai Nghia,0,8h,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2025-12-02T08:00:00.000+0700,UPDP-2,IM- Implement feature | Update feedback
https://picsum.photos/48/48?random=3,Dang Hoang Dai Nghia,0,8h,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2025-12-02T08:00:00.000+0700,ETOWN-1,eTown Tour UI-UX
https://picsum.photos/48/48?random=4,Dien Than,1h,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2025-12-01T16:47:18.611+0700,MTL-1,
https://picsum.photos/48/48?random=5,Dung Nguyen,3h,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2025-12-01T14:23:11.239+0700,VX-125,Viewer + Client Portal`;

interface EditModalState {
  member: string;
  project?: string;
  date: string;
  hours: number;
  type: 'edit' | 'add';
}

const App: React.FC = () => {
  const [data, setData] = useState<ParsedData>({ rows: [], dates: [] });
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);

  // Derived unique projects for the "Add" dropdown
  const projects = useMemo(() => Array.from(new Set(data.rows.map(r => r.project))).sort(), [data.rows]);

  const processFile = (file: File) => {
    if (!file || !file.name.endsWith('.csv')) {
      alert("Please upload a valid CSV file.");
      return;
    }
    setFileName(file.name);
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseTimesheetCsv(text);
      setData(parsed);
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const loadSample = useCallback(() => {
    setIsProcessing(true);
    setFileName('sample_data.csv');
    setTimeout(() => {
      setData(parseTimesheetCsv(SAMPLE_CSV));
      setIsProcessing(false);
    }, 500);
  }, []);

  const updateEntry = (member: string, project: string, date: string, hours: number) => {
    setData(prev => {
      const newRows = [...prev.rows];
      let rowIndex = newRows.findIndex(r => r.member === member && r.project === project);
      
      if (rowIndex === -1) {
        // Create new row if it doesn't exist (for "Add" from Member table)
        const newRow: TimesheetRow = {
          member,
          project,
          dailyHours: { [date]: hours },
          totalHours: hours,
          memberTotalMonth: 0 // Will be recalculated
        };
        newRows.push(newRow);
      } else {
        const row = { ...newRows[rowIndex] };
        row.dailyHours = { ...row.dailyHours, [date]: hours };
        // Fixed: Explicitly type the reduce parameters to avoid "unknown" errors on line 82
        row.totalHours = Object.values(row.dailyHours).reduce((sum: number, h: number) => sum + h, 0);
        newRows[rowIndex] = row;
      }

      // Recalculate memberTotalMonth for all rows of this member
      const memberTotal = newRows
        .filter((r: TimesheetRow) => r.member === member)
        .reduce((sum: number, r: TimesheetRow) => sum + r.totalHours, 0);
      
      const finalRows = newRows.map(r => r.member === member ? { ...r, memberTotalMonth: memberTotal } : r);
      
      return { 
        ...prev, 
        // Fixed: Corrected comparison bug: should compare a.member to b.member
        rows: finalRows.sort((a, b) => a.project.localeCompare(b.project) || a.member.localeCompare(b.member)) 
      };
    });
    setEditModal(null);
  };

  const deleteEntry = (member: string, project: string, date: string) => {
    updateEntry(member, project, date, 0);
  };

  const handleModalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editModal) return;
    const formData = new FormData(e.currentTarget);
    const hours = parseFloat(formData.get('hours') as string) || 0;
    const project = (formData.get('project') as string) || editModal.project;
    if (project) {
      updateEntry(editModal.member, project, editModal.date, hours);
    }
  };

  return (
    <div 
      className={`min-h-screen p-4 md:p-8 space-y-8 transition-colors duration-200 ${isDragging ? 'bg-indigo-50/50' : 'bg-slate-50'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); }}
    >
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.09-.36.14-.57.14s-.41-.05-.57-.14l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.09.36-.14.57-.14s.41.05.57.14l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 15.91l6 3.38v-6.71L5 9.21v6.7zm14 0v-6.7l-6 3.37v6.71l6-3.38z" />
            </svg>
            JIRA Timesheet Summary
          </h1>
          <p className="text-slate-500 mt-1">Real-time editable project summary</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadSample} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all">Load Sample</button>
          <label className="relative cursor-pointer">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <div className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload CSV
            </div>
          </label>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {!data.rows.length && !isProcessing ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <h2 className="text-xl font-bold text-slate-700 mb-2">Drop your JIRA CSV here</h2>
            <p className="text-slate-400 text-center max-w-sm mb-6">Aggregate your timesheet logs instantly and edit them in the grid below.</p>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Processing...</p>
          </div>
        ) : (
          <div className="space-y-12">
            <TimesheetTable 
              data={data} 
              onCellClick={(member, project, date, hours) => setEditModal({ member, project, date, hours, type: 'edit' })} 
            />
            <MemberSummaryTable 
              data={data} 
              onCellClick={(member, date, total) => setEditModal({ member, date, hours: 0, type: 'add' })}
            />
          </div>
        )}
      </main>

      {/* Edit/Add Modal */}
      {editModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                {editModal.type === 'edit' ? 'Edit Worklog' : 'Add Worklog'}
              </h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {editModal.member[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{editModal.member}</p>
                  <p className="text-xs text-slate-500">{editModal.date}</p>
                </div>
              </div>

              {editModal.type === 'add' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Project</label>
                  <select name="project" required className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm">
                    {projects.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="">+ New Project Code</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Project</label>
                  <div className="px-4 py-2 bg-slate-100 text-slate-600 font-mono text-xs rounded-lg border border-slate-200">
                    {editModal.project}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hours</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="24"
                  name="hours" 
                  defaultValue={editModal.hours || ''}
                  placeholder="e.g. 8"
                  autoFocus
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                {editModal.type === 'edit' && (
                  <button 
                    type="button"
                    onClick={() => deleteEntry(editModal.member, editModal.project!, editModal.date)}
                    className="flex-1 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-all"
                  >
                    Delete Log
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-md transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto py-12 text-center text-slate-400 text-sm">
        Built for internal project management &middot; Real-time Editable Grid
      </footer>
    </div>
  );
};

export default App;
