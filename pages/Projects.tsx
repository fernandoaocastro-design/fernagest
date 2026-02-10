import React, { useState } from 'react';
import { 
  Briefcase, Plus, Search, Filter, Printer, Mail, 
  Calendar, CheckCircle, Clock, AlertCircle, X, Save,
  MoreVertical, Edit2, Play, Pause, FolderOpen, PieChart,
  DollarSign, TrendingUp, Users, CheckSquare
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { MOCK_PROJECTS, MOCK_CUSTOMERS } from '../constants';
import { Project } from '../types';

const formatKz = (value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

const Projects = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [projects] = useState<Project[]>(MOCK_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');

  // KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = projects.reduce((acc, p) => acc + p.spent, 0);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => window.print();

  const CreateProjectForm = () => (
    <div className="bg-white h-full flex flex-col">
       <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Projeto</h2>
            <p className="text-sm text-gray-500">Planeje e gerencie um novo projeto.</p>
          </div>
          <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
       </div>

       <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
             
             {/* Section 1: Basic Info */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                   <FolderOpen size={18} className="text-blue-600"/> Dados do Projeto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
                      <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Campanha de Marketing 2024" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente Vinculado</label>
                      <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                         <option value="">Interno (Sem cliente)</option>
                         {MOCK_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                      <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                         <option>Tecnologia</option>
                         <option>Marketing</option>
                         <option>Consultoria</option>
                         <option>Infraestrutura</option>
                         <option>Operacional</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gerente Responsável</label>
                      <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Nome do gestor" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                      <div className="flex gap-2">
                         <label className="flex-1 cursor-pointer">
                            <input type="radio" name="priority" className="peer sr-only" />
                            <div className="text-center py-2 rounded-lg border border-gray-200 peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 text-sm font-medium transition-all">Baixa</div>
                         </label>
                         <label className="flex-1 cursor-pointer">
                            <input type="radio" name="priority" className="peer sr-only" defaultChecked />
                            <div className="text-center py-2 rounded-lg border border-gray-200 peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 text-sm font-medium transition-all">Média</div>
                         </label>
                         <label className="flex-1 cursor-pointer">
                            <input type="radio" name="priority" className="peer sr-only" />
                            <div className="text-center py-2 rounded-lg border border-gray-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 text-sm font-medium transition-all">Alta</div>
                         </label>
                      </div>
                   </div>
                </div>
             </div>

             {/* Section 2: Planning */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                   <Calendar size={18} className="text-blue-600"/> Prazos e Custos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                      <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de Término</label>
                      <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Total (Kz)</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0,00" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custo Estimado (Kz)</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0,00" />
                   </div>
                </div>
             </div>

             {/* Section 3: Tasks Preview */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                   <CheckSquare size={18} className="text-blue-600"/> Tarefas Iniciais
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-dashed border-gray-200">
                   <p className="text-gray-500 text-sm mb-2">Adicione tarefas após salvar o projeto.</p>
                   <button className="text-blue-600 font-medium text-sm flex items-center justify-center gap-1 mx-auto hover:underline">
                      <Plus size={16} /> Adicionar primeira tarefa
                   </button>
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setIsCreating(false)} className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                   Cancelar
                </button>
                <button className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                   <Save size={18} /> Salvar Projeto
                </button>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {isCreating ? (
        <CreateProjectForm />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Projetos</h1>
              <p className="text-gray-500 text-sm">Planeje, execute e acompanhe seus projetos.</p>
            </div>
            <div className="flex gap-2">
               <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2" onClick={handlePrint}>
                 <Printer size={16} /> Relatórios
               </button>
               <button 
                 onClick={() => setIsCreating(true)}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
               >
                 <Plus size={18} /> Novo Projeto
               </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Total Projetos</p>
                <h3 className="text-xl font-bold text-gray-900">{totalProjects}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Play size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Em Andamento</p>
                <h3 className="text-xl font-bold text-gray-900">{activeProjects}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Concluídos</p>
                <h3 className="text-xl font-bold text-gray-900">{completedProjects}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><DollarSign size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Orçamento Total</p>
                <h3 className="text-xl font-bold text-gray-900">{formatKz(totalBudget)}</h3>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1">
             <div className="border-b border-gray-200 px-6 flex items-center justify-between">
               <nav className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Visão Geral
                  </button>
                  <button 
                    onClick={() => setActiveTab('list')}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Lista de Projetos
                  </button>
               </nav>
               {activeTab === 'list' && (
                  <div className="flex items-center gap-2">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                           type="text" 
                           placeholder="Buscar projeto..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                     </div>
                  </div>
               )}
             </div>

             <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
               {activeTab === 'dashboard' ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Progress Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                       <h3 className="font-bold text-gray-800 mb-6">Status dos Projetos</h3>
                       <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={[
                               { name: 'Planejamento', value: projects.filter(p => p.status === 'PLANNING').length },
                               { name: 'Ativos', value: projects.filter(p => p.status === 'ACTIVE').length },
                               { name: 'Pausados', value: projects.filter(p => p.status === 'ON_HOLD').length },
                               { name: 'Concluídos', value: projects.filter(p => p.status === 'COMPLETED').length }
                             ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                  {
                                    [0, 1, 2, 3].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={['#94a3b8', '#3b82f6', '#f59e0b', '#10b981'][index]} />
                                    ))
                                  }
                                </Bar>
                             </BarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Budget vs Spent */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                       <h3 className="font-bold text-gray-800 mb-4">Orçamento vs Realizado</h3>
                       <div className="space-y-6 mt-8">
                          {projects.slice(0, 4).map(project => {
                             const percentSpent = Math.min((project.spent / project.budget) * 100, 100);
                             return (
                                <div key={project.id}>
                                   <div className="flex justify-between text-sm mb-1">
                                      <span className="font-medium text-gray-700">{project.name}</span>
                                      <span className="text-gray-500">{formatKz(project.spent)} / {formatKz(project.budget)}</span>
                                   </div>
                                   <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                      <div 
                                         className={`h-full rounded-full ${percentSpent > 90 ? 'bg-red-500' : percentSpent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                         style={{ width: `${percentSpent}%` }}
                                      ></div>
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    </div>

                    {/* Active Tasks List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                       <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <CheckSquare size={18} className="text-blue-600" /> Tarefas Recentes em Aberto
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {projects.flatMap(p => p.tasks.map(t => ({...t, projectName: p.name}))).filter(t => t.status !== 'DONE').slice(0, 6).map((task, idx) => (
                             <div key={idx} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${task.status === 'TODO' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                      {task.status === 'TODO' ? 'A Fazer' : 'Em Andamento'}
                                   </span>
                                   <span className="text-[10px] text-gray-400">{task.dueDate}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-800 mb-1">{task.title}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                   <Briefcase size={10} /> {task.projectName}
                                </p>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                       <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                          <tr>
                             <th className="px-6 py-4">Projeto</th>
                             <th className="px-6 py-4">Cliente/Responsável</th>
                             <th className="px-6 py-4">Prazos</th>
                             <th className="px-6 py-4">Progresso</th>
                             <th className="px-6 py-4 text-center">Status</th>
                             <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {filteredProjects.map(project => (
                             <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                   <div>
                                      <p className="font-medium text-gray-900">{project.name}</p>
                                      <p className="text-xs text-gray-500">{project.category}</p>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex flex-col">
                                      <span className="text-gray-900 text-xs font-medium">{project.client}</span>
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                         <Users size={10} /> {project.manager}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                   <div className="flex flex-col gap-1">
                                      <span className="text-green-600">Início: {project.startDate}</span>
                                      <span className="text-red-600">Fim: {project.endDate}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                         <div 
                                            className="h-full bg-blue-600 rounded-full"
                                            style={{ width: `${project.progress}%` }}
                                         ></div>
                                      </div>
                                      <span className="text-xs font-bold text-gray-700">{project.progress}%</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                      project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                      project.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                      project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                   }`}>
                                      {project.status === 'COMPLETED' ? 'Concluído' : 
                                       project.status === 'ACTIVE' ? 'Ativo' : 
                                       project.status === 'ON_HOLD' ? 'Pausado' : 'Planejamento'}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <div className="flex justify-end gap-2">
                                      <button className="p-1.5 hover:bg-gray-100 text-gray-600 rounded" title="Ver Detalhes">
                                         <FolderOpen size={16} />
                                      </button>
                                      <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="Editar">
                                         <Edit2 size={16} />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Projects;