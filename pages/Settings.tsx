import React, { useState } from 'react';
import { 
  Building, Users, Settings as Cog, Bell, Shield, Globe, 
  Save, Upload, Plus, Trash2, Edit2, CheckCircle, XCircle, 
  Download, Moon, Sun, Smartphone, Mail, Lock, Database
} from 'lucide-react';
import { MOCK_USERS, MOCK_AUDIT_LOGS } from '../constants';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [theme, setTheme] = useState('light');
  
  // Tabs Navigation
  const tabs = [
    { id: 'general', label: 'Empresa', icon: Building },
    { id: 'users', label: 'Usuários & Acesso', icon: Users },
    { id: 'system', label: 'Preferências', icon: Cog },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'integrations', label: 'Integrações', icon: Globe },
  ];

  // --- Content Sections ---

  const GeneralSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Identidade da Empresa</h3>
        
        <div className="flex flex-col md:flex-row gap-8">
           {/* Logo Upload */}
           <div className="flex flex-col items-center space-y-3">
              <div className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-500 transition-all group relative overflow-hidden">
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Upload size={24} className="mb-1" />
                    <span className="text-xs font-medium">Logo</span>
                 </div>
              </div>
              <button className="text-sm text-blue-600 font-medium hover:underline">Alterar Logo</button>
           </div>

           {/* Form Fields */}
           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                 <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" defaultValue="Minha Loja de Sucesso Lda." />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">NIF / CNPJ</label>
                 <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" defaultValue="5412312391" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Setor de Atuação</label>
                 <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                    <option>Varejo</option>
                    <option>Serviços</option>
                    <option>Indústria</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Principal</label>
                 <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" defaultValue="+244 923 000 000" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contato</label>
                 <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" defaultValue="contato@minhaloja.ao" />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                 <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" defaultValue="Av. 4 de Fevereiro, Luanda, Angola" />
              </div>
           </div>
        </div>
        
        <div className="mt-6 flex justify-end">
           <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
             <Save size={16} /> Salvar Alterações
           </button>
        </div>
      </div>
    </div>
  );

  const UserSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
         <div>
            <h3 className="text-lg font-bold text-gray-900">Gerenciar Usuários</h3>
            <p className="text-sm text-gray-500">Controle de acesso e permissões.</p>
         </div>
         <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Novo Usuário
         </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
         <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
               <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Função</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Último Acesso</th>
                  <th className="px-6 py-4 text-right">Ações</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {MOCK_USERS.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {user.avatar}
                           </div>
                           <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700 border border-gray-200">
                           {user.role}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        {user.status === 'ACTIVE' ? (
                           <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
                              <CheckCircle size={10} /> Ativo
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">
                              <XCircle size={10} /> Inativo
                           </span>
                        )}
                     </td>
                     <td className="px-6 py-4 text-xs text-gray-500">{user.lastLogin}</td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="Editar">
                              <Edit2 size={16} />
                           </button>
                           <button className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="Remover">
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );

  const SystemSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Modules */}
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
               <Database size={18} className="text-blue-600"/> Módulos Ativos
            </h3>
            <div className="space-y-4">
               {[
                  { id: 'finance', label: 'Financeiro e Fluxo de Caixa', active: true },
                  { id: 'sales', label: 'Gestão de Vendas', active: true },
                  { id: 'stock', label: 'Controle de Estoque', active: true },
                  { id: 'crm', label: 'CRM (Gestão de Clientes)', active: true },
                  { id: 'projects', label: 'Gestão de Projetos', active: true },
                  { id: 'hr', label: 'Recursos Humanos', active: false },
               ].map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                     <span className="text-sm font-medium text-gray-700">{mod.label}</span>
                     <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${mod.active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${mod.active ? 'left-6' : 'left-1'}`}></div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Localization & Personalization */}
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-blue-600"/> Localização
               </h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Moeda Padrão</label>
                     <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                        <option>Kwanza (AOA)</option>
                        <option>Dólar (USD)</option>
                        <option>Euro (EUR)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                     <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                        <option>Português (AO)</option>
                        <option>English (US)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Fuso Horário</label>
                     <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                        <option>(GMT+01:00) West Central Africa</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Smartphone size={18} className="text-blue-600"/> Aparência
               </h3>
               <div className="flex gap-4">
                  <button 
                     onClick={() => setTheme('light')}
                     className={`flex-1 p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                     <Sun size={24} />
                     <span className="text-xs font-bold">Modo Claro</span>
                  </button>
                  <button 
                     onClick={() => setTheme('dark')}
                     className={`flex-1 p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-slate-800 bg-slate-900 text-white' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                     <Moon size={24} />
                     <span className="text-xs font-bold">Modo Escuro</span>
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
             {/* Auth Policy */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <Lock size={18} className="text-blue-600"/> Políticas de Acesso
                </h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Autenticação em 2 Fatores (2FA)</span>
                      <div className="w-10 h-5 rounded-full bg-blue-600 relative cursor-pointer"><div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full"></div></div>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Forçar troca de senha (90 dias)</span>
                      <div className="w-10 h-5 rounded-full bg-gray-300 relative cursor-pointer"><div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full"></div></div>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Bloquear após 3 tentativas</span>
                      <div className="w-10 h-5 rounded-full bg-blue-600 relative cursor-pointer"><div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full"></div></div>
                   </div>
                </div>
                <button className="w-full mt-6 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
                   Redefinir Senha Mestra
                </button>
             </div>

             {/* Backup */}
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white">
                <h3 className="font-bold mb-2 flex items-center gap-2"><Database size={18}/> Backup de Dados</h3>
                <p className="text-xs text-slate-400 mb-4">Último backup automático: Hoje às 03:00</p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                   <Download size={16} /> Fazer Backup Agora
                </button>
             </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Log de Auditoria</h3>
                <button className="text-xs text-blue-600 font-medium hover:underline">Exportar Logs</button>
             </div>
             <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                   <tr>
                      <th className="px-4 py-3">Data/Hora</th>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Ação</th>
                      <th className="px-4 py-3 text-right">IP</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {MOCK_AUDIT_LOGS.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                         <td className="px-4 py-3 font-mono text-xs">{log.timestamp}</td>
                         <td className="px-4 py-3 font-medium">{log.user}</td>
                         <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs border border-gray-200">
                               {log.module}
                            </span>
                            <span className="ml-2">{log.action}</span>
                         </td>
                         <td className="px-4 py-3 text-right text-xs text-gray-400">{log.ip}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-start">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-500 text-sm">Gerencie preferências, usuários e segurança do sistema.</p>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
         {/* Sidebar Navigation */}
         <div className="lg:w-64 bg-white rounded-xl shadow-sm border border-gray-100 h-fit flex-shrink-0">
            <nav className="p-2 space-y-1">
               {tabs.map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                     <tab.icon size={18} />
                     {tab.label}
                  </button>
               ))}
            </nav>
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'users' && <UserSettings />}
            {activeTab === 'system' && <SystemSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && (
               <div className="bg-white p-12 text-center rounded-xl border border-gray-100 border-dashed text-gray-400">
                  <Bell size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-gray-600">Central de Notificações</h3>
                  <p>Configure alertas por e-mail e push (Em Breve).</p>
               </div>
            )}
            {activeTab === 'integrations' && (
               <div className="bg-white p-12 text-center rounded-xl border border-gray-100 border-dashed text-gray-400">
                  <Globe size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-gray-600">Marketplace de Integrações</h3>
                  <p>Conecte WhatsApp, Gateways de Pagamento e mais (Em Breve).</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Settings;