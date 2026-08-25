export type ActivityType =
  | 'Avicultura'
  | 'Piscicultura'
  | 'Suinocultura'
  | 'Bovinocultura'
  | 'Ovinocultura'
  | 'Caprinocultura'
  | 'Agricultura'
  | 'Outra'

export interface Activity {
  id: string
  name: string
  type: ActivityType
  /** Valor de tipo customizado, usado apenas quando type === 'Outra' */
  customType?: string
  description?: string
  isActive: boolean
  /** ID da propriedade à qual a atividade pertence */
  propertyId?: string
  /** ID da organização à qual a atividade pertence */
  organizationId?: string
}

export const ACTIVITY_TYPES: ActivityType[] = [
  'Avicultura',
  'Piscicultura',
  'Suinocultura',
  'Bovinocultura',
  'Ovinocultura',
  'Caprinocultura',
  'Agricultura',
  'Outra',
]

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
  activityId?: string
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
  incubationId?: string
}

export interface StructureCost {
  id: string
  date: string
  category: string
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
  category: string
  description: string
  lotId?: string
  lotName?: string
  quantity: number
  unitValue: number
  totalValue: number
  supplier: string
  paymentMethod: string
  isPaid: boolean
  aplicacao?: 'geral' | 'atividade' | 'lote' | 'propriedade'
  activity?: string
  notes?: string
  source_type?: string
  source_id?: string
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  averageCost: number
  supplier?: string
  notes?: string
  lastUpdated: string
  packageWeight?: number
  brand?: string
}

export interface FeedConsumption {
  id: string
  date: string
  lotId?: string
  lotName?: string
  activityId?: string
  activityName?: string
  destinationType?: 'lote' | 'atividade' | 'geral'
  quantityKg: number
  inventoryItemId?: string
  inventoryItemName?: string
  costPerKg: number
  totalCost: number
  notes?: string
}

export interface FeedPurchase {
  id: string
  date: string
  inventoryItemId: string
  inventoryItemName: string
  packages: number
  weightPerPackage: number
  totalQuantity: number
  pricePerPackage: number
  totalValue: number
  supplier?: string
  paymentMethod?: string
  notes?: string
  source_type?: string
  source_id?: string
  expenseId?: string
  recordType?: 'purchase' | 'consumption'
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
  // Custos adicionais
  eggCostPerUnit?: number
  suppliesCost?: number
  laborCost?: number
  otherCosts?: number
  energyStartKwh?: number
  energyEndKwh?: number
  energyTotalKwh?: number
  energyRatePerKwh?: number
  // Fechamento e vínculo
  endDate?: string
  resultingLotId?: string
  activityId?: string
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
  measurementType?: 'Propriedade' | 'Atividade' | 'Estrutura' | 'Equipamento' | 'Lote'
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
  product: string
  lotId?: string
  lotName?: string
  quantity: number
  weightKg?: number
  unitPrice: number
  totalPrice: number
  paymentMethod: string
  isPaid: boolean
  notes?: string
  source_type?: string
  source_id?: string
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
  category: string
  acquisitionDate: string
  value: number
  usefulLifeYears: number
  condition: 'Excelente' | 'Bom' | 'Regular' | 'Necessita manutenção'
  location: string
  status: 'Em uso' | 'Ocioso' | 'Em manutenção' | 'Descartado'
  residualValue?: number
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

export interface StockMovement {
  id: string
  date: string
  inventoryItemId: string
  inventoryItemName: string
  type: 'entrada' | 'saida'
  movementType: string
  quantity: number
  unit: string
  balanceAfter: number
  unitValue: number
  totalValue: number
  supplier?: string
  lotId?: string
  lotName?: string
  activity?: string
  documentNumber?: string
  notes?: string
  generateExpense?: boolean
  user?: string
}

export type PeriodFilter = 'Hoje' | '7 dias' | 'Este mês' | 'Últimos 30 dias' | 'Este ano' | 'Todos'
