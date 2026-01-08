
import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  
  const [modalSelectedProject, setModalSelectedProject] = useState<string>('');
  const [modalHours, setModalHours] = useState<number>(0);

  const projects = useMemo(() => Array.from(new Set(data.rows.map(r => r.project))).sort(), [data.rows]);

  // Logs for the current member on the current date across all projects
  const dayLogs = useMemo(() => {
    if (!editModal) return [];
    return data.rows
      .filter(r => r.member === editModal.member && (r.dailyHours[editModal.date] || 0) > 0)
      .map(r => ({
        project: r.project,
        hours: r.dailyHours[editModal.date]
      }))
      .sort((a, b) => a.project.localeCompare(b.project));
  }, [data.rows, editModal]);

  useEffect(() => {
    if (editModal) {
      if (editModal.type === 'edit' && editModal.project) {
        setModalSelectedProject(editModal.project);
        setModalHours(editModal.hours);
      } else if (editModal.type === 'add') {
        const defaultProject = projects[0] || '';
        setModalSelectedProject(defaultProject);
        const existing = data.rows.find(r => r.member === editModal.member && r.project === defaultProject);
        setModalHours(existing?.dailyHours[editModal.date] || 0);
      }
    }
  }, [editModal, projects, data.rows]);

  const handleProjectChange = (project: string) => {
    setModalSelectedProject(project);
    if (editModal) {
      const existing = data.rows.find(r => r.member === editModal.member && r.project === project);
      setModalHours(existing?.dailyHours[editModal.date] || 0);
    }
  };

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
        const newRow: TimesheetRow = {
          member,
          project,
          dailyHours: { [date]: hours },
          totalHours: hours,
          memberTotalMonth: 0 
        };
        newRows.push(newRow);
      } else {
        const row = { ...newRows[rowIndex] };
        row.dailyHours = { ...row.dailyHours, [date]: hours };
        row.totalHours = Object.values(row.dailyHours).reduce((sum: number, h: number) => sum + h, 0);
        newRows[rowIndex] = row;
      }

      const memberTotal = newRows
        .filter((r: TimesheetRow) => r.member === member)
        .reduce((sum: number, r: TimesheetRow) => sum + r.totalHours, 0);
      
      const finalRows = newRows.map(r => r.member === member ? { ...r, memberTotalMonth: memberTotal } : r);
      
      return { 
        ...prev, 
        rows: finalRows.sort((a, b) => a.project.localeCompare(b.project) || a.member.localeCompare(b.member)) 
      };
    });
    // Don't close modal if updating within same day context might be needed, but for now we follow old behavior
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
    const project = modalSelectedProject;
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
            
            {/* Form Section */}
            <div className="flex-1 border-r border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-lg">
                  {editModal.type === 'edit' ? 'Edit Worklog' : 'Add Worklog'}
                </h3>
                <button onClick={() => setEditModal(null)} className="md:hidden text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                  {editModal.member[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{editModal.member}</p>
                  <p className="text-xs text-indigo-600 font-medium uppercase">{editModal.date}</p>
                </div>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project</label>
                  <select 
                    name="project" 
                    required 
                    value={modalSelectedProject}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  >
                    {projects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hours</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.5" 
                      min="0" 
                      max="24"
                      name="hours" 
                      key={`${modalSelectedProject}-${editModal.date}`} 
                      defaultValue={modalHours || ''}
                      placeholder="e.g. 8"
                      autoFocus
                      required
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-lg font-bold text-slate-900"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">hrs</div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {(editModal.type === 'edit' || modalHours > 0) && (
                    <button 
                      type="button"
                      onClick={() => deleteEntry(editModal.member, modalSelectedProject, editModal.date)}
                      className="flex-1 px-4 py-2.5 bg-white border-2 border-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all"
                    >
                      Delete
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="flex-[2] px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </div>

            {/* List Section */}
            <div className="bg-slate-50 w-full md:w-56 p-6 border-t md:border-t-0 border-slate-100 overflow-y-auto max-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Today</h4>
                <button onClick={() => setEditModal(null)} className="hidden md:block text-slate-400 hover:text-slate-600">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-2">
                {dayLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No entries yet for this date.</p>
                ) : (
                  dayLogs.map((log) => (
                    <button
                      key={log.project}
                      onClick={() => handleProjectChange(log.project)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                        modalSelectedProject === log.project 
                          ? 'bg-white border-indigo-200 shadow-sm ring-2 ring-indigo-50' 
                          : 'bg-transparent border-slate-200 hover:border-indigo-200 hover:bg-white'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className={`text-[11px] font-bold truncate ${modalSelectedProject === log.project ? 'text-indigo-600' : 'text-slate-700'}`}>
                          {log.project}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">Project Code</p>
                      </div>
                      <div className={`text-xs font-black px-1.5 py-0.5 rounded ${modalSelectedProject === log.project ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {log.hours}h
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Daily Total</span>
                  <span className="text-slate-900 font-black">
                    {dayLogs.reduce((sum, l) => sum + (l.hours || 0), 0)}h
                  </span>
                </div>
              </div>
            </div>

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
