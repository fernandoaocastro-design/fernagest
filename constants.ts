import { Product, Customer, FinancialRecord, RecentActivity, KPIStats, TopProduct, CustomerOrigin, BirthdayProfile, Sale, StockMovement, Supplier, PipelineDeal, FinancialTransaction, PurchaseOrder, Project, ReportDef, SystemUser, AuditLog } from './types';

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'Tech Distribuidora', contact: 'Carlos', phone: '(11) 9999-9999' },
  { id: '2', name: 'Office Supplies Co.', contact: 'Maria', phone: '(11) 8888-8888' },
  { id: '3', name: 'Global Imports', contact: 'João', phone: '(21) 7777-7777' },
];

export const MOCK_PRODUCTS: Product[] = [
  { 
    id: '1', name: 'Notebook Pro X1', sku: 'NB-001', category: 'Eletrônicos', 
    supplier: 'Tech Distribuidora', costPrice: 350000.00, price: 450000.00, 
    stock: 12, minStock: 5, unit: 'un', location: 'A-01', status: 'active', lastMovement: '2023-10-24' 
  },
  { 
    id: '2', name: 'Monitor UltraWide 34"', sku: 'MN-034', category: 'Periféricos', 
    supplier: 'Tech Distribuidora', costPrice: 150000.00, price: 210000.00, 
    stock: 4, minStock: 10, unit: 'un', location: 'A-02', status: 'active', lastMovement: '2023-10-22' 
  },
  { 
    id: '3', name: 'Teclado Mecânico RGB', sku: 'KB-RGB', category: 'Acessórios', 
    supplier: 'Global Imports', costPrice: 18000.00, price: 35000.00, 
    stock: 45, minStock: 15, unit: 'un', location: 'B-05', status: 'active', lastMovement: '2023-10-23' 
  },
  { 
    id: '4', name: 'Mouse Wireless Ergo', sku: 'MS-WRL', category: 'Acessórios', 
    supplier: 'Global Imports', costPrice: 9000.00, price: 18000.00, 
    stock: 2, minStock: 20, unit: 'un', location: 'B-06', status: 'active', lastMovement: '2023-10-20' 
  },
  { 
    id: '5', name: 'Cadeira Office Premium', sku: 'CH-OFF', category: 'Móveis', 
    supplier: 'Office Supplies Co.', costPrice: 75000.00, price: 120000.00, 
    stock: 8, minStock: 5, unit: 'un', location: 'C-01', status: 'active', lastMovement: '2023-10-18' 
  },
  { 
    id: '6', name: 'Webcam 4K Pro', sku: 'WB-4K', category: 'Periféricos', 
    supplier: 'Tech Distribuidora', costPrice: 35000.00, price: 65000.00, 
    stock: 15, minStock: 5, unit: 'un', location: 'A-03', status: 'active', lastMovement: '2023-10-21' 
  },
  { 
    id: '7', name: 'Headset Noise Cancel', sku: 'HD-NC', category: 'Áudio', 
    supplier: 'Global Imports', costPrice: 22000.00, price: 45000.00, 
    stock: 20, minStock: 8, unit: 'un', location: 'B-08', status: 'active', lastMovement: '2023-10-24' 
  },
];

export const MOCK_STOCK_MOVEMENTS: StockMovement[] = [
  { id: '1', date: '2023-10-24 14:30', productId: '1', productName: 'Notebook Pro X1', type: 'OUT', quantity: 1, user: 'Ana Silva', reason: 'Venda #1024' },
  { id: '2', date: '2023-10-24 10:00', productId: '7', productName: 'Headset Noise Cancel', type: 'IN', quantity: 10, user: 'Roberto (Estoque)', reason: 'Compra #554' },
  { id: '3', date: '2023-10-23 16:00', productId: '3', productName: 'Teclado Mecânico RGB', type: 'OUT', quantity: 2, user: 'Ana Silva', reason: 'Venda #1023' },
  { id: '4', date: '2023-10-23 09:15', productId: '4', productName: 'Mouse Wireless Ergo', type: 'ADJUST', quantity: -1, user: 'Admin', reason: 'Avaria' },
  { id: '5', date: '2023-10-22 11:30', productId: '5', productName: 'Cadeira Office Premium', type: 'OUT', quantity: 1, user: 'Carlos Santos', reason: 'Venda #1021' },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { 
    id: '1', name: 'Roberto Almeida', company: 'Tech Solutions Ltda', email: 'roberto@techsol.com', phone: '(11) 99999-1234', 
    status: 'active', lastOrderDate: '2023-10-15', document: '123.456.789-00', location: 'Luanda, AO', 
    segment: 'VIP', totalSpent: 4500000, purchaseCount: 12 
  },
  { 
    id: '2', name: 'Fernanda Costa', company: 'Design Studio', email: 'fernanda@dstudio.com', phone: '(21) 98888-5678', 
    status: 'active', lastOrderDate: '2023-10-12', document: '987.654.321-99', location: 'Benguela, AO', 
    segment: 'Regular', totalSpent: 850000, purchaseCount: 5 
  },
  { 
    id: '3', name: 'Carlos Oliveira', company: 'Varejo Express', email: 'carlos@vexpress.com', phone: '(31) 97777-4321', 
    status: 'inactive', lastOrderDate: '2023-08-28', document: '456.789.123-44', location: 'Huambo, AO', 
    segment: 'Inativo', totalSpent: 120000, purchaseCount: 2 
  },
  { 
    id: '4', name: 'Juliana Mendes', company: 'Advocacia Mendes', email: 'ju@mendes.adv.ao', phone: '(11) 91234-5678', 
    status: 'active', lastOrderDate: '2023-10-20', document: '111.222.333-44', location: 'Luanda, AO', 
    segment: 'Novo', totalSpent: 45000, purchaseCount: 1 
  },
  { 
    id: '5', name: 'Grupo Horizonte', company: 'Construtora Horizonte', email: 'compras@horizonte.co.ao', phone: '(21) 2222-3333', 
    status: 'active', lastOrderDate: '2023-10-24', document: '12.345.678/0001-90', location: 'Cabinda, AO', 
    segment: 'VIP', totalSpent: 12500000, purchaseCount: 24 
  },
];

export const MOCK_PIPELINE: PipelineDeal[] = [
  { id: '1', customerId: '4', customerName: 'Juliana Mendes', title: 'Renovação de Equipamentos', value: 450000, stage: 'proposal', probability: 60, expectedDate: '2023-11-15' },
  { id: '2', customerId: '2', customerName: 'Design Studio', title: 'Novos Monitores 4K', value: 850000, stage: 'negotiation', probability: 80, expectedDate: '2023-10-30' },
  { id: '3', customerId: 'NEW', customerName: 'Startup Inovação', title: 'Montagem Escritório', value: 2500000, stage: 'lead', probability: 20, expectedDate: '2023-12-01' },
  { id: '4', customerId: '1', customerName: 'Tech Solutions', title: 'Servidores Locais', value: 1200000, stage: 'contact', probability: 40, expectedDate: '2023-11-05' },
];

export const MOCK_SALES: Sale[] = [
  { 
    id: 'VEN-2023-001', 
    customerId: '1', 
    customerName: 'Tech Solutions Ltda', 
    date: '2023-10-24 14:30', 
    status: 'completed', 
    paymentMethod: 'credit_card', 
    total: 495000.00,
    seller: 'Ana Silva',
    items: [
      { productId: '1', productName: 'Notebook Pro X1', quantity: 1, unitPrice: 450000.00, total: 450000.00 },
      { productId: '7', productName: 'Headset Noise Cancel', quantity: 1, unitPrice: 45000.00, total: 45000.00 }
    ]
  },
  { 
    id: 'VEN-2023-002', 
    customerId: '2', 
    customerName: 'Design Studio', 
    date: '2023-10-24 10:15', 
    status: 'pending', 
    paymentMethod: 'boleto', 
    total: 210000.00,
    seller: 'Carlos Santos',
    items: [
      { productId: '2', productName: 'Monitor UltraWide 34"', quantity: 1, unitPrice: 210000.00, total: 210000.00 }
    ]
  },
  { 
    id: 'VEN-2023-003', 
    customerId: '3', 
    customerName: 'Varejo Express', 
    date: '2023-10-23 16:45', 
    status: 'completed', 
    paymentMethod: 'pix', 
    total: 35000.00,
    seller: 'Ana Silva',
    items: [
      { productId: '3', productName: 'Teclado Mecânico RGB', quantity: 1, unitPrice: 35000.00, total: 35000.00 }
    ]
  },
  { 
    id: 'VEN-2023-004', 
    customerId: '1', 
    customerName: 'Tech Solutions Ltda', 
    date: '2023-10-22 09:30', 
    status: 'cancelled', 
    paymentMethod: 'credit_card', 
    total: 120000.00,
    seller: 'Mariana Lima',
    items: [
      { productId: '5', productName: 'Cadeira Office Premium', quantity: 1, unitPrice: 120000.00, total: 120000.00 }
    ]
  },
];

export const MOCK_PURCHASES: PurchaseOrder[] = [
  {
    id: 'PED-501', supplierId: '1', supplierName: 'Tech Distribuidora', date: '2023-10-20', expectedDate: '2023-10-28', status: 'PENDING', total: 1250000,
    items: [
      { productId: '1', productName: 'Notebook Pro X1', quantity: 3, unitCost: 350000, total: 1050000 },
      { productId: '2', productName: 'Monitor UltraWide', quantity: 2, unitCost: 100000, total: 200000 }
    ]
  },
  {
    id: 'PED-502', supplierId: '3', supplierName: 'Global Imports', date: '2023-10-18', expectedDate: '2023-10-25', status: 'RECEIVED', total: 85000,
    items: [
      { productId: '4', productName: 'Mouse Wireless Ergo', quantity: 10, unitCost: 8500, total: 85000 }
    ]
  },
  {
    id: 'PED-503', supplierId: '2', supplierName: 'Office Supplies Co.', date: '2023-10-15', expectedDate: '2023-10-22', status: 'APPROVED', total: 220000,
    items: [
      { productId: '5', productName: 'Cadeira Office Premium', quantity: 4, unitCost: 55000, total: 220000 }
    ]
  },
  {
    id: 'PED-500', supplierId: '1', supplierName: 'Tech Distribuidora', date: '2023-10-01', expectedDate: '2023-10-10', status: 'RECEIVED', total: 4500000,
    items: []
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'PRJ-23-001', name: 'Implantação ERP', client: 'Grupo Horizonte', manager: 'Ana Silva', 
    status: 'ACTIVE', priority: 'HIGH', startDate: '2023-09-01', endDate: '2023-12-15', 
    progress: 65, budget: 5000000, spent: 3250000, category: 'Tecnologia',
    tasks: [
      { id: '1', title: 'Levantamento de Requisitos', assignee: 'Ana Silva', status: 'DONE', dueDate: '2023-09-15' },
      { id: '2', title: 'Configuração do Servidor', assignee: 'Carlos Santos', status: 'IN_PROGRESS', dueDate: '2023-10-30' },
      { id: '3', title: 'Treinamento da Equipe', assignee: 'Ana Silva', status: 'TODO', dueDate: '2023-11-20' },
    ]
  },
  {
    id: 'PRJ-23-002', name: 'Marketing Digital Q4', client: 'Design Studio', manager: 'Mariana Lima', 
    status: 'PLANNING', priority: 'MEDIUM', startDate: '2023-11-01', endDate: '2024-01-31', 
    progress: 15, budget: 1200000, spent: 50000, category: 'Marketing',
    tasks: [
      { id: '1', title: 'Definição de Persona', assignee: 'Mariana Lima', status: 'DONE', dueDate: '2023-10-25' },
      { id: '2', title: 'Criação de Criativos', assignee: 'Design Team', status: 'TODO', dueDate: '2023-11-10' },
    ]
  },
  {
    id: 'PRJ-23-003', name: 'Reforma Escritório', client: 'Interno', manager: 'Roberto Almeida', 
    status: 'ON_HOLD', priority: 'LOW', startDate: '2023-08-01', endDate: '2023-10-30', 
    progress: 40, budget: 2500000, spent: 1800000, category: 'Infraestrutura',
    tasks: [
      { id: '1', title: 'Pintura', assignee: 'Empreiteira A', status: 'DONE', dueDate: '2023-08-15' },
      { id: '2', title: 'Móveis Planejados', assignee: 'Marcenaria B', status: 'IN_PROGRESS', dueDate: '2023-09-30' },
    ]
  },
  {
    id: 'PRJ-23-004', name: 'Consultoria Financeira', client: 'Tech Solutions Ltda', manager: 'Ana Silva', 
    status: 'COMPLETED', priority: 'HIGH', startDate: '2023-07-01', endDate: '2023-09-30', 
    progress: 100, budget: 1500000, spent: 1450000, category: 'Consultoria',
    tasks: []
  }
];

export const MOCK_FINANCIAL_DATA: FinancialRecord[] = [
  { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
  { month: 'Fev', revenue: 52000, expenses: 34000, profit: 18000 },
  { month: 'Mar', revenue: 48000, expenses: 31000, profit: 17000 },
  { month: 'Abr', revenue: 61000, expenses: 38000, profit: 23000 },
  { month: 'Mai', revenue: 55000, expenses: 36000, profit: 19000 },
  { month: 'Jun', revenue: 67000, expenses: 41000, profit: 26000 },
  { month: 'Jul', revenue: 72000, expenses: 45000, profit: 27000 },
  { month: 'Ago', revenue: 68000, expenses: 42000, profit: 26000 },
  { month: 'Set', revenue: 75000, expenses: 48000, profit: 27000 },
  { month: 'Out', revenue: 81000, expenses: 51000, profit: 30000 },
  { month: 'Nov', revenue: 95000, expenses: 55000, profit: 40000 },
  { month: 'Dez', revenue: 110000, expenses: 60000, profit: 50000 },
];

export const MOCK_TRANSACTIONS: FinancialTransaction[] = [
  { id: 'TRX-001', description: 'Venda de Notebook', entity: 'Tech Solutions Ltda', amount: 450000, type: 'INCOME', category: 'Vendas', date: '2023-10-24', dueDate: '2023-10-24', status: 'PAID', paymentMethod: 'Cartão de Crédito', documentNumber: 'NF-1020' },
  { id: 'TRX-002', description: 'Aluguel do Escritório', entity: 'Imobiliária Central', amount: 150000, type: 'EXPENSE', category: 'Aluguel', date: '2023-10-01', dueDate: '2023-10-05', status: 'PAID', paymentMethod: 'Transferência', documentNumber: 'REC-055' },
  { id: 'TRX-003', description: 'Compra de Periféricos', entity: 'Tech Distribuidora', amount: 85000, type: 'EXPENSE', category: 'Estoque', date: '2023-10-10', dueDate: '2023-10-20', status: 'OVERDUE', paymentMethod: 'Boleto', documentNumber: 'NF-5502' },
  { id: 'TRX-004', description: 'Consultoria de TI', entity: 'Design Studio', amount: 210000, type: 'INCOME', category: 'Serviços', date: '2023-10-15', dueDate: '2023-10-30', status: 'PENDING', paymentMethod: 'Boleto', documentNumber: 'NF-1021' },
  { id: 'TRX-005', description: 'Conta de Energia', entity: 'ENDE', amount: 25000, type: 'EXPENSE', category: 'Utilidades', date: '2023-10-20', dueDate: '2023-11-05', status: 'PENDING', paymentMethod: 'Referência', documentNumber: 'FT-992' },
  { id: 'TRX-006', description: 'Venda Teclados', entity: 'Varejo Express', amount: 35000, type: 'INCOME', category: 'Vendas', date: '2023-10-23', dueDate: '2023-10-23', status: 'PAID', paymentMethod: 'PIX', documentNumber: 'NF-1022' },
  { id: 'TRX-007', description: 'Serviço de Limpeza', entity: 'Clean Service', amount: 12000, type: 'EXPENSE', category: 'Serviços', date: '2023-10-02', dueDate: '2023-10-10', status: 'PAID', paymentMethod: 'Dinheiro', documentNumber: 'REC-11' },
];

export const MOCK_ACTIVITY: RecentActivity[] = [
  { id: '1', action: 'Nova venda #1234', user: 'Sistema', time: '10:45', type: 'order', value: 12500 },
  { id: '2', action: 'Novo cliente cadastrado', user: 'Ana Silva', time: '09:30', type: 'system' },
  { id: '3', action: 'Recebimento Fatura #998', user: 'Financeiro', time: '09:15', type: 'finance', value: 4500 },
  { id: '4', action: 'Ticket #404 Aberto', user: 'Suporte', time: '08:50', type: 'alert' },
  { id: '5', action: 'Venda Balcão #1233', user: 'Carlos', time: 'Ontem', type: 'order', value: 2100 },
];

export const KPIS: KPIStats = {
  dailyRevenue: 12500.00,
  monthlyRevenue: 184500.00,
  newCustomers: 24,
  totalExpenses: 82000.00,
  netProfit: 102500.00,
  margin: 55.5,
  accountsReceivable: 45000.00,
  accountsPayable: 12000.00
};

export const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { name: 'Notebook Pro X1', sales: 45, revenue: 202500 },
  { name: 'Monitor UltraWide', sales: 32, revenue: 67200 },
  { name: 'Teclado RGB', sales: 28, revenue: 9800 },
  { name: 'Cadeira Office', sales: 15, revenue: 18000 },
  { name: 'Mouse Wireless', sales: 12, revenue: 2160 },
];

export const MOCK_ORIGIN: CustomerOrigin[] = [
  { source: 'Indicação', count: 45 },
  { source: 'Google', count: 30 },
  { source: 'Instagram', count: 15 },
  { source: 'Facebook', count: 10 },
];

export const MOCK_BIRTHDAYS: BirthdayProfile[] = [
  { id: '1', name: 'Mariana Santos', date: 'Hoje', type: 'customer' },
  { id: '2', name: 'Pedro Souza', date: 'Hoje', type: 'employee' },
  { id: '3', name: 'Lucas Ferreira', date: '25/Out', type: 'customer' },
  { id: '4', name: 'Carla Dias', date: '28/Out', type: 'customer' },
];

export const MOCK_REPORTS: ReportDef[] = [
  { id: 'RPT-001', title: 'DRE Gerencial', description: 'Demonstrativo de Resultados do Exercício Detalhado', module: 'FINANCE', type: 'PDF', lastGenerated: '24/10/2023', favorite: true },
  { id: 'RPT-002', title: 'Fluxo de Caixa Diário', description: 'Entradas e saídas agrupadas por dia e categoria', module: 'FINANCE', type: 'EXCEL', lastGenerated: '23/10/2023', favorite: false },
  { id: 'RPT-003', title: 'Curva ABC de Vendas', description: 'Classificação de produtos por relevância de faturamento', module: 'SALES', type: 'PDF', lastGenerated: '20/10/2023', favorite: true },
  { id: 'RPT-004', title: 'Vendas por Vendedor', description: 'Performance individual e comissões do período', module: 'SALES', type: 'CSV', lastGenerated: '22/10/2023', favorite: false },
  { id: 'RPT-005', title: 'Giro de Estoque', description: 'Análise de rotatividade e dias de cobertura', module: 'INVENTORY', type: 'EXCEL', lastGenerated: '15/10/2023', favorite: true },
  { id: 'RPT-006', title: 'Produtos Abaixo do Mínimo', description: 'Lista de reposição imediata e alerta de ruptura', module: 'INVENTORY', type: 'PDF', lastGenerated: 'Hoje', favorite: false },
  { id: 'RPT-007', title: 'Aniversariantes do Mês', description: 'Lista de clientes para campanhas de marketing', module: 'CRM', type: 'CSV', lastGenerated: '01/10/2023', favorite: false },
  { id: 'RPT-008', title: 'Rentabilidade de Projetos', description: 'Comparativo Orçado x Realizado por projeto', module: 'PROJECTS', type: 'PDF', lastGenerated: '18/10/2023', favorite: true },
  { id: 'RPT-009', title: 'Gastos por Fornecedor', description: 'Totalização de compras por parceiro comercial', module: 'PURCHASES', type: 'EXCEL', lastGenerated: '21/10/2023', favorite: false },
];

export const MOCK_USERS: SystemUser[] = [
  { id: '1', name: 'Admin User', email: 'admin@fernagest.ao', role: 'ADMIN', status: 'ACTIVE', lastLogin: 'Agora', avatar: 'AD' },
  { id: '2', name: 'Ana Silva', email: 'ana@fernagest.ao', role: 'MANAGER', status: 'ACTIVE', lastLogin: '24/10/2023 09:30', avatar: 'AS' },
  { id: '3', name: 'Carlos Santos', email: 'carlos@fernagest.ao', role: 'SELLER', status: 'ACTIVE', lastLogin: '24/10/2023 08:45', avatar: 'CS' },
  { id: '4', name: 'Roberto Financeiro', email: 'fin@fernagest.ao', role: 'FINANCE', status: 'INACTIVE', lastLogin: '20/10/2023 14:20', avatar: 'RF' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: '1', user: 'Admin User', action: 'Alteração de Permissões', module: 'SECURITY', timestamp: '24/10/2023 10:45', ip: '192.168.1.10' },
  { id: '2', user: 'Ana Silva', action: 'Exportação de Relatório', module: 'REPORTS', timestamp: '24/10/2023 09:15', ip: '192.168.1.12' },
  { id: '3', user: 'Carlos Santos', action: 'Nova Venda #1234', module: 'SALES', timestamp: '24/10/2023 08:50', ip: '192.168.1.15' },
  { id: '4', user: 'Admin User', action: 'Login no Sistema', module: 'AUTH', timestamp: '24/10/2023 08:00', ip: '192.168.1.10' },
];