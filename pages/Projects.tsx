import React, { useState, useMemo } from 'react';
import { 
  Briefcase, Plus, Search, Filter, Printer, Mail, 
  Calendar, CheckCircle, Clock, AlertCircle, X, Save,
  MoreVertical, Edit2, Play, Pause, FolderOpen,
  DollarSign, TrendingUp, Users, CheckSquare, BarChart2,
  FileText, Trash2, ChevronDown, PieChart
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { formatDate } from '../utils/language';
import { useI18n } from '../utils/i18n';

// --- MOCK DATA E TIPOS (Para o cÃ³digo rodar sem dependÃªncias externas) ---

export interface Task {
  id: number;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  assignee?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  category: string;
  manager: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  description: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  progress: number;
  tasks: Task[];
}

const MOCK_CUSTOMERS = [
  { id: 1, name: 'Empresa A' },
  { id: 2, name: 'Tech Solutions' },
  { id: 3, name: 'Marketing Global' }
];

const MOCK_PROJECTS: Project[] = [
  {
    id: 'PROJ-001',
    name: 'Website Institucional',
    client: 'Empresa A',
    category: 'Tecnologia',
    manager: 'Carlos Silva',
    priority: 'HIGH',
    startDate: '2024-01-10',
    endDate: '2024-03-15',
    budget: 500000,
    spent: 120000,
    description: 'RefatoraÃ§Ã£o completa do portal corporativo.',
    status: 'ACTIVE',
    progress: 35,
    tasks: [
      { id: 1, title: 'Design da Home', status: 'DONE' },
      { id: 2, title: 'Desenvolvimento Frontend', status: 'IN_PROGRESS' }
    ]
  },
  {
    id: 'PROJ-002',
    name: 'Campanha de VerÃ£o',
    client: 'Marketing Global',
    category: 'Marketing',
    manager: 'Ana Souza',
    priority: 'MEDIUM',
    startDate: '2024-02-01',
    endDate: '2024-04-30',
    budget: 1500000,
    spent: 200000,
    description: 'Campanha publicitÃ¡ria para redes sociais.',
    status: 'PLANNING',
    progress: 10,
    tasks: []
  }
];

const formatKz = (value: any) => {
  if (value === undefined || value === null) return formatCurrency(0);
  const num = Number(value);
  return isNaN(num) ? formatCurrency(0) : formatCurrency(num);
};

// Logotipo SVG Base64
const FERNAGEST_LOGO = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 80'%3E%3Cg transform='translate(10, 10)'%3E%3Cpath d='M30 2 C15 2 2 15 2 30 C2 45 15 58 30 58 C45 58 58 45 58 30 C58 15 45 2 30 2 Z' fill='none' stroke='%232563eb' stroke-width='2'/%3E%3Crect x='18' y='35' width='6' height='10' fill='%2316a34a' rx='1'/%3E%3Crect x='27' y='25' width='6' height='20' fill='%232563eb' rx='1'/%3E%3Crect x='36' y='15' width='6' height='30' fill='%2316a34a' rx='1'/%3E%3Cpath d='M10 40 Q 30 55 50 35' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Ctext x='70' y='40' font-family='Arial, sans-serif' font-size='32' font-weight='bold'%3E%3Ctspan fill='%232563eb'%3EFerna%3C/tspan%3E%3Ctspan fill='%2316a34a'%3EGest%3C/tspan%3E%3C/text%3E%3Ctext x='72' y='58' font-family='Arial, sans-serif' font-size='9' letter-spacing='1.5' fill='%23555' font-weight='bold'%3EGESTÃƒO INTELIGENTE%3C/text%3E%3C/svg%3E";

// --- COMPONENTES AUXILIARES ---

const CreateProjectForm = ({ onSave, onCancel, initialData }: { onSave: (p: any) => void, onCancel: () => void, initialData?: any }) => {
  const { t } = useI18n();
  const currencySymbol = getCurrencySymbol();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    client: initialData?.client || '',
    category: initialData?.category || t('projects.category_technology'),
    manager: initialData?.manager || '',
    priority: initialData?.priority || 'MEDIUM',
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate || '',
    budget: initialData?.budget || '',
    description: initialData?.description || '',
    status: initialData?.status || 'PLANNING',
    tasks: Array.isArray(initialData?.tasks) ? [...initialData.tasks] : []
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.manager) return alert(t('projects.required_name_manager'));
    onSave({
      ...formData,
      id: initialData?.id, // MantÃ©m o ID se for ediÃ§Ã£o
      budget: Number(formData.budget),
      spent: initialData?.spent || 0,
      progress: initialData?.progress || 0,
    });
  };

  const handleAddTask = () => {
    const title = prompt(t('projects.prompt_task_name'));
    if (!title) return;
    
    const newTask = { id: Date.now(), title, status: 'TODO', dueDate: formData.endDate };
    setFormData({
      ...formData,
      tasks: [...formData.tasks, newTask]
    });
  };

  const removeTask = (taskId: number) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((t: any) => t.id !== taskId)
    });
  };

  return (
    <div className="bg-white h-full flex flex-col animate-in slide-in-from-bottom-4 duration-300">
       <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{initialData ? t('projects.edit_project') : t('projects.new_project')}</h2>
            <p className="text-sm text-gray-500">{t('projects.plan_manage_project')}</p>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
       </div>

       <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
              
             {/* Section 1: Basic Info */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <FolderOpen size={18} className="text-blue-600"/> {t('projects.project_data')}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.project_name')}</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder={t('projects.project_name_placeholder')} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.linked_customer')}</label>
                      <select value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                          <option value="">{t('projects.internal_no_customer')}</option>
                          {(MOCK_CUSTOMERS || []).map(c => c ? <option key={c.id} value={c.name}>{c.name}</option> : null)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.category')}</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                          <option>{t('projects.category_technology')}</option>
                          <option>{t('projects.category_marketing')}</option>
                          <option>{t('projects.category_consulting')}</option>
                          <option>{t('projects.category_infrastructure')}</option>
                          <option>{t('projects.category_operational')}</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.manager_responsible')}</label>
                      <input type="text" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder={t('projects.manager_name_placeholder')} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.priority')}</label>
                      <div className="flex gap-2">
                          <label className="flex-1 cursor-pointer">
                             <input type="radio" name="priority" className="peer sr-only" checked={formData.priority === 'LOW'} onChange={() => setFormData({...formData, priority: 'LOW'})} />
                             <div className="text-center py-2 rounded-lg border border-gray-200 peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 text-sm font-medium transition-all">{t('projects.priority_low')}</div>
                          </label>
                          <label className="flex-1 cursor-pointer">
                             <input type="radio" name="priority" className="peer sr-only" checked={formData.priority === 'MEDIUM'} onChange={() => setFormData({...formData, priority: 'MEDIUM'})} />
                             <div className="text-center py-2 rounded-lg border border-gray-200 peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 text-sm font-medium transition-all">{t('projects.priority_medium')}</div>
                          </label>
                          <label className="flex-1 cursor-pointer">
                             <input type="radio" name="priority" className="peer sr-only" checked={formData.priority === 'HIGH'} onChange={() => setFormData({...formData, priority: 'HIGH'})} />
                             <div className="text-center py-2 rounded-lg border border-gray-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 text-sm font-medium transition-all">{t('projects.priority_high')}</div>
                          </label>
                      </div>
                   </div>
                   <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.detailed_description')}</label>
                      <textarea 
                        rows={3}
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                        placeholder={t('projects.description_placeholder')}
                      />
                   </div>
                </div>
             </div>

             {/* Section 2: Planning */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600"/> {t('projects.timeline_and_costs')}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.start_date')}</label>
                      <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.end_date_forecast')}</label>
                      <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.total_budget', { currency: currencySymbol })}</label>
                      <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0,00" />
                   </div>
                </div>
             </div>

             {/* Section 3: Tasks Preview */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <CheckSquare size={18} className="text-blue-600"/> {t('projects.task_management')}
                 </h3>
                <div className="space-y-2 mb-4">
                  {formData.tasks.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">{t('projects.no_tasks_yet')}</p>
                  ) : (
                    formData.tasks.map((t: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${t.status === 'DONE' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                          <span className="font-medium text-gray-700">{t.title}</span>
                        </div>
                        <button onClick={() => removeTask(t.id)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-dashed border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer" onClick={handleAddTask}>
                   <button className="text-blue-600 font-medium text-sm flex items-center justify-center gap-1 mx-auto">
                      <Plus size={16} /> {formData.tasks.length > 0 ? t('projects.add_another_task') : t('projects.add_first_task')}
                   </button>
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-4">
                <button onClick={onCancel} className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                   {t('common.cancel')}
                </button>
                <button onClick={handleSubmit} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                   <Save size={18} /> {t('projects.save_project')}
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

const ProjectDetailsModal = ({ project, onClose }: { project: Project, onClose: () => void }) => {
  const { t } = useI18n();
  const statusLabels: Record<Project['status'], string> = {
    ACTIVE: t('projects.status_active'),
    COMPLETED: t('projects.status_completed'),
    PLANNING: t('projects.status_planning'),
    ON_HOLD: t('projects.status_on_hold')
  };
  if (!project) return null;
  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong className="text-gray-500">{t('projects.client')}:</strong> <br/>{project.client}</p>
                    <p><strong className="text-gray-500">{t('projects.manager')}:</strong> <br/>{project.manager}</p>
                    <p><strong className="text-gray-500">{t('projects.status')}:</strong> <br/>{statusLabels[project.status] || project.status}</p>
                    <p><strong className="text-gray-500">{t('projects.budget_label')}:</strong> <br/>{formatKz(project.budget)}</p>
                  </div>
                  
                  {project.description && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-4">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">{t('projects.detailed_description')}</p>
                      <p className="text-gray-700 leading-relaxed text-sm">{project.description}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-bold mb-3 text-gray-800 flex items-center gap-2"><CheckSquare size={16}/> {t('projects.tasks_count', { count: (project.tasks || []).length })}</h4>
                      <ul className="space-y-2">
                          {(project.tasks || []).map(t => <li key={t.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {t.title}</li>)}
                          {(!project.tasks || project.tasks.length === 0) && <li className="text-sm text-gray-400 italic">{t('projects.no_task_registered')}</li>}
                      </ul>
                  </div>
              </div>
          </div>
      </div>
  );
}

// Componente de GrÃ¡fico de Gantt Simples
const SimpleGanttChart = ({ projects }: { projects: Project[] }) => {
  const { t } = useI18n();
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BarChart2 size={18} className="text-blue-600" /> {t('projects.gantt_timeline')}
      </h3>
      <div className="space-y-4">
        {(projects || []).slice(0, 5).map(project => {
          if (!project) return null;
          // CorreÃ§Ã£o: Usar valor determinÃ­stico (progresso) para evitar que o grÃ¡fico "pisque" com random
          const width = Math.max(10, project.progress || 10); 
          const marginLeft = 0; // Simplificado para demonstraÃ§Ã£o
          
          return (
            <div key={project.id} className="relative">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700 w-32 truncate">{project.name}</span>
                <span className="text-gray-400 text-[10px]">{project.startDate} - {project.endDate}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6 relative overflow-hidden">
                <div 
                  className={`h-full rounded-full flex items-center px-2 text-[10px] text-white font-medium whitespace-nowrap ${
                    project.status === 'COMPLETED' ? 'bg-green-500' : 
                    project.status === 'ON_HOLD' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${width}%`, marginLeft: `${marginLeft}%` }}
                >
                  {project.progress}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Projects = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [projects, setProjects] = useState<Project[]>(Array.isArray(MOCK_PROJECTS) ? MOCK_PROJECTS : []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const getProjectStatusLabel = (status: Project['status']) => {
    const labels: Record<Project['status'], string> = {
      ACTIVE: t('projects.status_active'),
      COMPLETED: t('projects.status_completed'),
      PLANNING: t('projects.status_planning'),
      ON_HOLD: t('projects.status_on_hold')
    };
    return labels[status] || status;
  };

  const getProjectPriorityLabel = (priority: Project['priority']) => {
    const labels: Record<Project['priority'], string> = {
      HIGH: t('projects.priority_high'),
      MEDIUM: t('projects.priority_medium'),
      LOW: t('projects.priority_low')
    };
    return labels[priority] || priority;
  };

  const getTaskStatusLabel = (status: Task['status']) => {
    const labels: Record<Task['status'], string> = {
      TODO: t('projects.task_status_todo'),
      IN_PROGRESS: t('projects.task_status_in_progress'),
      DONE: t('projects.task_status_done')
    };
    return labels[status] || status;
  };

  // KPIs
  const safeProjects = projects || [];
  const totalProjects = safeProjects.length;
  
  const filteredProjects = safeProjects.filter(p => {
    if (!p) return false;
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.manager || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || p.priority?.toUpperCase() === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSaveProject = (projectData: any) => {
    if (projectData.id) {
      // Editar
      setProjects(projects.map(p => p.id === projectData.id ? { ...p, ...projectData } : p));
    } else {
      // Criar
      const newProject = { 
        ...projectData, 
        id: `PROJ-${Date.now()}`,
        spent: 0,
        progress: 0
      };
      setProjects([newProject, ...projects]);
    }
    setIsCreating(false);
    setEditingProject(null);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=600');
    if (!printWindow) return alert(t('projects.popup_blocked'));

    const logoUrl = FERNAGEST_LOGO;
    const date = formatDate(new Date());

    printWindow.document.write(`
      <html>
        <head>
          <title>${t('projects.report_title')}</title>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;" />
            <h2>${t('projects.report_title')}</h2>
            <p>${t('projects.report_generated_at')}: ${date}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>${t('projects.project_name')}</th>
                <th>${t('projects.client')}</th>
                <th>${t('projects.manager')}</th>
                <th>${t('projects.start_date')}</th>
                <th>${t('projects.end_date')}</th>
                <th>${t('projects.status')}</th>
                <th style="text-align: right;">${t('projects.budget_label')}</th>
              </tr>
            </thead>
            <tbody>
              ${projects.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.client}</td>
                  <td>${p.manager}</td>
                  <td>${p.startDate}</td>
                  <td>${p.endDate}</td>
                  <td>${getProjectStatusLabel(p.status as Project['status'])}</td>
                  <td style="text-align: right;">${formatKz(p.budget)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">${t('projects.total_projects')}: ${projects.length}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generateProjectPDF = (project: Project) => {
    const printWindow = window.open('', '_blank', 'width=900,height=600');
    if (!printWindow) return alert(t('projects.popup_blocked'));

    const logoUrl = FERNAGEST_LOGO;
    const date = formatDate(new Date());
    const spentPercentage = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;

    printWindow.document.write(`
      <html>
        <head>
          <title>${t('projects.project_pdf_title', { name: project.name })}</title>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { height: 50px; }
            .title { font-size: 24px; font-weight: bold; color: #1e293b; margin: 0; }
            .meta { color: #64748b; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block; margin-bottom: 5px; }
            .value { font-size: 16px; font-weight: 600; color: #0f172a; }
            .section-title { font-size: 18px; font-weight: bold; color: #1e293b; margin: 30px 0 15px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; padding: 10px; background: #f1f5f9; color: #475569; border-bottom: 2px solid #e2e8f0; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            .status { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; }
            .status-DONE { background: #dcfce7; color: #166534; }
            .status-TODO { background: #f1f5f9; color: #475569; }
            .status-IN_PROGRESS { background: #dbeafe; color: #1e40af; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <img src="${logoUrl}" class="logo" />
            </div>
            <div style="text-align: right;">
              <h1 class="title">${t('projects.single_report_title')}</h1>
              <p class="meta">${t('projects.report_generated_at')}: ${date}</p>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <span class="label">${t('projects.project_name')}</span>
              <div class="value">${project.name}</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 5px;">${project.description || t('projects.no_description')}</div>
            </div>
            <div class="card">
              <span class="label">${t('projects.status_and_priority')}</span>
              <div class="value">
                ${getProjectStatusLabel(project.status)} <span style="color: #cbd5e1;">|</span> ${getProjectPriorityLabel(project.priority)}
              </div>
            </div>
            <div class="card">
              <span class="label">${t('projects.client')}</span>
              <div class="value">${project.client}</div>
            </div>
            <div class="card">
              <span class="label">${t('projects.manager')}</span>
              <div class="value">${project.manager}</div>
            </div>
            <div class="card">
              <span class="label">${t('projects.deadlines')}</span>
              <div class="value">${formatDate(new Date(project.startDate))} - ${formatDate(new Date(project.endDate))}</div>
            </div>
            <div class="card">
              <span class="label">${t('projects.finance')}</span>
              <div class="value">
                ${t('projects.budget_label')}: ${formatKz(project.budget)}<br>
                <span style="font-size: 13px; color: ${project.spent > project.budget ? '#ef4444' : '#16a34a'};">
                  ${t('projects.spent_label')}: ${formatKz(project.spent)} (${spentPercentage}%)
                </span>
              </div>
            </div>
          </div>

          <div class="section-title">${t('projects.timeline_and_tasks')}</div>
          <table>
            <thead>
              <tr>
                <th>${t('projects.task')}</th>
                <th>${t('projects.assignee')}</th>
                <th>${t('projects.deadline')}</th>
                <th>${t('projects.status')}</th>
              </tr>
            </thead>
            <tbody>
              ${(project.tasks || []).map(task => `
                <tr>
                  <td>${task.title}</td>
                  <td>${task.assignee || '-'}</td>
                  <td>${task.dueDate ? formatDate(new Date(task.dueDate)) : '-'}</td>
                  <td><span class="status status-${task.status}">${getTaskStatusLabel(task.status)}</span></td>
                </tr>
              `).join('')}
              ${(project.tasks || []).length === 0 ? `<tr><td colspan="4" style="text-align:center; color: #94a3b8;">${t('projects.no_task_registered')}</td></tr>` : ''}
            </tbody>
          </table>

          <div class="footer">
            ${t('projects.footer_brand')}
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {isCreating ? (
        <CreateProjectForm 
          onSave={handleSaveProject} 
          onCancel={() => { setIsCreating(false); setEditingProject(null); }} 
          initialData={editingProject}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('projects.title')}</h1>
              <p className="text-gray-500 text-sm">{t('projects.subtitle')}</p>
            </div>
            <div className="flex gap-2">
               <button onClick={handlePrint} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                 <Printer size={16} /> {t('projects.reports')}
               </button>
               <button 
                 onClick={() => { setEditingProject(null); setIsCreating(true); }}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
               >
                 <Plus size={18} /> {t('projects.new_project')}
               </button>
            </div>
          </div>

          {/* Abas de NavegaÃ§Ã£o */}
          <div className="flex gap-2 border-b border-gray-200 pb-1">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2"><PieChart size={16}/> {t('projects.tab_dashboard')}</div>
            </button>
            <button 
              onClick={() => setActiveTab('list')} 
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'list' 
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2"><Briefcase size={16}/> {t('projects.tab_list')}</div>
            </button>
          </div>

          {/* RenderizaÃ§Ã£o Condicional - DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {/* Gantt Chart */}
              <div className="lg:col-span-2">
                <SimpleGanttChart projects={projects} />
              </div>

              {/* Budget vs Spent */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">{t('projects.budget_vs_spent')}</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projects.slice(0, 5)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                        <Tooltip formatter={(val) => formatKz(val as number)} />
                        <Bar dataKey="budget" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} name={t('projects.budget_label')} />
                        <Bar dataKey="spent" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name={t('projects.spent_label')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>
            </div>
          )}

          {/* RenderizaÃ§Ã£o Condicional - LISTA */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 animate-in fade-in duration-300">
               <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('projects.search_placeholder')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative">
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
                      >
                        <option value="ALL">{t('projects.filter_all_status')}</option>
                        <option value="ACTIVE">{t('projects.status_active')}</option>
                        <option value="COMPLETED">{t('projects.status_completed')}</option>
                        <option value="PLANNING">{t('projects.status_planning')}</option>
                        <option value="ON_HOLD">{t('projects.status_on_hold')}</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select 
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
                      >
                        <option value="ALL">{t('projects.filter_all_priorities')}</option>
                        <option value="HIGH">{t('projects.priority_high')}</option>
                        <option value="MEDIUM">{t('projects.priority_medium')}</option>
                        <option value="LOW">{t('projects.priority_low')}</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                      <tr>
                        <th className="px-6 py-4">{t('projects.project_name')}</th>
                        <th className="px-6 py-4">{t('projects.client')}</th>
                        <th className="px-6 py-4">{t('projects.status')}</th>
                        <th className="px-6 py-4">{t('projects.progress')}</th>
                        <th className="px-6 py-4 text-right">{t('projects.budget_label')}</th>
                        <th className="px-6 py-4 text-right">{t('projects.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map(project => {
                        if (!project) return null;
                        return (
                        <tr key={project.id || Math.random()} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{project.name}</div>
                            <div className="text-xs text-gray-500">{project.manager}</div>
                          </td>
                          <td className="px-6 py-4">{project.client}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              project.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {getProjectStatusLabel(project.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{width: `${project.progress || 0}%`}}></div>
                              </div>
                              <span className="text-xs font-medium">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {formatKz(project.budget)}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                <button onClick={() => generateProjectPDF(project)} className="p-1.5 hover:bg-purple-50 text-purple-600 rounded" title={t('projects.generate_project_pdf')}>
                                   <FileText size={16} />
                                </button>
                                <button onClick={() => setViewingProject(project)} className="p-1.5 hover:bg-gray-100 text-gray-600 rounded" title={t('projects.view_details')}>
                                   <FolderOpen size={16} />
                                </button>
                                <button onClick={() => { setEditingProject(project); setIsCreating(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title={t('common.edit')}>
                                   <Edit2 size={16} />
                                </button>
                             </div>
                          </td>
                        </tr>
                  )})}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </>
      )}

      {viewingProject && <ProjectDetailsModal project={viewingProject} onClose={() => setViewingProject(null)} />}
    </div>
  );
};

export default Projects;

