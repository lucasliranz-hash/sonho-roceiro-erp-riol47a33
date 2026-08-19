import {
  Home,
  Layers,
  Wheat,
  Scale,
  Skull,
  TrendingUp,
  Bird,
  Dna,
  Egg,
  Flame,
  Package,
  DollarSign,
  Building2,
  Zap,
  ShoppingCart,
  Users,
  Briefcase,
  AlertTriangle,
  Settings,
  Truck,
  UserCog,
  CircleUser,
  Calculator,
  ListTodo,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: any
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  { label: 'INÍCIO', items: [{ label: 'Início', path: '/', icon: Home }] },
  {
    label: 'PRODUÇÃO',
    items: [
      { label: 'Lotes', path: '/lotes', icon: Layers },
      { label: 'Ração', path: '/racao', icon: Wheat },
      { label: 'Pesagens', path: '/pesagens', icon: Scale },
      { label: 'Mortalidade', path: '/mortalidade', icon: Skull },
      { label: 'Produção', path: '/producao', icon: TrendingUp },
    ],
  },
  {
    label: 'REPRODUÇÃO',
    items: [
      { label: 'Matrizes', path: '/matrizes', icon: Bird },
      { label: 'Acasalamentos', path: '/acasalamentos', icon: Dna },
      { label: 'Ovos', path: '/ovos', icon: Egg },
      { label: 'Chocadeira', path: '/chocadeira', icon: Flame },
    ],
  },
  {
    label: 'GESTÃO',
    items: [
      { label: 'Estoque', path: '/estoque', icon: Package },
      { label: 'Financeiro', path: '/financeiro', icon: DollarSign },
      { label: 'Patrimônio', path: '/patrimonio', icon: Truck },
      { label: 'Estrutura', path: '/estrutura', icon: Building2 },
      { label: 'Energia', path: '/energia', icon: Zap },
      { label: 'Atividades', path: '/atividades', icon: ListTodo },
      { label: 'Custos e Precificação', path: '/custos', icon: Calculator },
    ],
  },
  {
    label: 'COMERCIAL',
    items: [
      { label: 'Vendas', path: '/vendas', icon: ShoppingCart },
      { label: 'Clientes', path: '/parceiros', icon: Users },
    ],
  },
  { label: 'RELATÓRIOS', items: [{ label: 'Indicadores', path: '/indicadores', icon: Briefcase }] },
  {
    label: 'CONFIGURAÇÕES',
    items: [
      { label: 'Equipe', path: '/equipe', icon: UserCog },
      { label: 'Alertas', path: '/alertas', icon: AlertTriangle },
      { label: 'Minha Conta', path: '/minha-conta', icon: CircleUser },
      { label: 'Configurações', path: '/configuracoes', icon: Settings },
    ],
  },
]
