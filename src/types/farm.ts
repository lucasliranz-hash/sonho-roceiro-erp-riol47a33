export type LotType =
  | 'Poedeiras'
  | 'Frango de corte'
  | 'Frango caipira'
  | 'Pintinhos'
  | 'Matrizes'
  | 'Reprodutores'
export type LotStatus = 'Ativo' | 'Finalizado' | 'Vendido' | 'Abatido' | 'Transferido'

export interface Lot {
  id: string
  code: string
  name: string
  type: LotType
  startDate: string
  origin: string
  supplier: string
  breed: string
  initialQuantity: number
  currentQuantity: number
  initialAgeDays: number
  acquisitionCost: number
  purpose: string
  status: LotStatus
  notes?: string
}

export interface StructureCost {
  id: string
  date: string
  category:
    | 'Madeira'
    | 'Tela'
    | 'Telhado'
    | 'Piso'
    | 'Concreto'
    | 'Portões'
    | 'Cerca'
    | 'Hidráulica'
    | 'Elétrica'
    | "Caixa d'água"
    | 'Bebedouros'
    | 'Comedouros'
    | 'Chocadeira'
    | 'Equipamentos'
    | 'Ferramentas'
    | 'Mão de obra'
    | 'Transporte'
    | 'Outros'
  subcategory?: string
  description: string
  quantity: number
  unit: string
  unitValue: number
  totalValue: number
  supplier: string
  paymentMethod: string
  isPaid: boolean
  center: string
  notes?: string
}

export interface Expense {
  id: string
  date: string
  category:
    | 'Ração'
    | 'Pintinhos'
    | 'Ovos férteis'
    | 'Medicamentos'
    | 'Vacinas'
    | 'Cama'
    | 'Energia'
    | 'Água'
    | 'Transporte'
    | 'Abate'
    | 'Embalagem'
    | 'Mão de obra'
    | 'Manutenção'
    | 'Outros'
  description: string
  lotId?: string
  lotName?: string
  quantity: number
  unitValue: number
  totalValue: number
  supplier: string
  paymentMethod: string
  isPaid: boolean
  notes?: string
}

export interface InventoryItem {
  id: string
  name: string
  category:
    | 'Ração'
    | 'Milho'
    | 'Farelos'
    | 'Medicamentos'
    | 'Vacinas'
    | 'Maravalha'
    | 'Embalagens'
    | 'Insumos'
    | 'Outros'
  unit: string
  currentStock: number
  minStock: number
  averageCost: number
  lastUpdated: string
}

export interface FeedConsumption {
  id: string
  date: string
  lotId: string
  lotName: string
  quantityKg: number
  inventoryItemId?: string
  costPerKg: number
  totalCost: number
  notes?: string
}

export interface Weighing {
  id: string
  date: string
  lotId: string
  lotName: string
  weighedCount: number
  totalWeightKg: number
  averageWeightKg: number
  ageDays: number
  dailyGainGrams?: number
  notes?: string
}

export interface Mortality {
  id: string
  date: string
  lotId: string
  lotName: string
  quantity: number
  cause: string
  notes?: string
}

export interface EggProduction {
  id: string
  date: string
  lotId: string
  lotName: string
  collected: number
  broken: number
  consumed: number
  sold: number
  incubated: number
  discarded: number
  notes?: string
}

export type IncubationStatus = 'Em andamento' | 'Concluído' | 'Cancelado'

export interface Incubation {
  id: string
  code: string
  startDate: string
  eggCount: number
  origin: string
  supplier: string
  breed: string
  eggCost: number
  incubatorName: string
  targetTemp: number
  targetHumidity: number
  autoTurning: boolean
  expectedHatchDate: string
  status: IncubationStatus
  hatchedCount?: number
  unhatchedCount?: number
  healthyChicks?: number
  deaths?: number
  energyCost?: number
  notes?: string
}

export interface Candling {
  id: string
  incubationId: string
  date: string
  day: number
  fertile: number
  infertile: number
  developing: number
  deadEmbryo: number
  discarded: number
  notes?: string
}

export interface EnergyMeasurement {
  id: string
  equipment: string
  date: string
  hours: number
  consumptionKwh: number
  ratePerKwh: number
  totalCost: number
  incubationId?: string
}

export interface Animal {
  id: string
  code: string
  sex: 'Macho' | 'Fêmea'
  breed: string
  lineage: string
  birthDate: string
  origin: string
  fatherCode?: string
  motherCode?: string
  weightKg: number
  status: 'Ativo' | 'Vendido' | 'Descartado' | 'Morto'
  notes?: string
}

export interface Mating {
  id: string
  roosterCode: string
  henCodes: string[]
  startDate: string
  endDate?: string
  goal: string
  targetTrait: string
  status: 'Ativo' | 'Concluído'
}

export interface Sale {
  id: string
  date: string
  customerName: string
  product:
    | 'Ovos'
    | 'Ovos férteis'
    | 'Pintinhos'
    | 'Frangos vivos'
    | 'Frangos abatidos'
    | 'Galinhas'
    | 'Matrizes'
    | 'Reprodutores'
    | 'Outros'
  lotId?: string
  lotName?: string
  quantity: number
  weightKg?: number
  unitPrice: number
  totalPrice: number
  paymentMethod: string
  isPaid: boolean
  notes?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  whatsapp: string
  city: string
  notes?: string
}

export interface Supplier {
  id: string
  name: string
  suppliedProduct: string
  phone: string
  city: string
  notes?: string
}

export interface Asset {
  id: string
  name: string
  category:
    | 'Chocadeira'
    | 'Equipamentos'
    | 'Ferramentas'
    | 'Bombas'
    | 'Aeradores'
    | 'Estruturas'
    | 'Outros'
  acquisitionDate: string
  value: number
  usefulLifeYears: number
  condition: 'Excelente' | 'Bom' | 'Regular' | 'Necessita manutenção'
  location: string
  notes?: string
}

export interface FarmAlert {
  id: string
  title: string
  description: string
  type: 'estoque' | 'financeiro' | 'chocadeira' | 'mortalidade' | 'pesagem' | 'abate'
  date: string
  isRead: boolean
  modulePath: string
}

export type PeriodFilter = 'Hoje' | '7 dias' | 'Este mês' | 'Últimos 30 dias' | 'Este ano' | 'Todos'
