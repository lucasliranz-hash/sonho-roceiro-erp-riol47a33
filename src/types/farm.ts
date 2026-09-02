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
  // Novos campos para Vacinas, Medicamentos e Produtos Sanitários
  packaging_type?: string // Frasco, Caixa, Bisnaga, Ampola, Seringa, Envelope, Balde, Saco, Outro
  content_per_package?: number // Conteúdo/volume/doses por embalagem
  consumption_unit?: string // dose, mL, L, mg, g, comprimido, cápsula, unidade, outra
  custom_unit?: string // texto livre se consumption_unit === 'outra'
  manufacturer_batch?: string // Lote do fabricante ativo/recente
  expiration_date?: string // Validade ativa/recente
  manufacturing_date?: string // Data de fabricação
  can_keep_opened?: boolean // Sobra reconstituída pode permanecer utilizável
  reconstitution_allowed?: boolean // Produto requer/permite reconstituição
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

export interface IncubationReading {
  id: string
  date: string
  day: number
  temperature: number
  humidity: number
  notes?: string
}

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
  // Leituras diárias
  readings?: IncubationReading[]
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

export type AlertStatus = 'nao_lido' | 'lido' | 'dispensado'

export type AlertType =
  | 'estoque'
  | 'sanidade'
  | 'incubacao'
  | 'mortalidade'
  | 'pesagem'
  | 'despesa'
  | 'financeiro'
  | 'chocadeira'
  | 'abate'
  | 'operacional'

export interface FarmAlert {
  id: string
  organization_id?: string
  property_id?: string
  propertyName?: string
  user_id?: string
  type: AlertType | string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  origin: string
  related_entity_type?: string
  related_entity_id?: string
  deduplication_key?: string
  condition_active?: boolean
  condition_state?: string
  status: AlertStatus
  isRead: boolean
  read_at?: string | null
  dismissed_at?: string | null
  modulePath: string
  date: string // YYYY-MM-DD or ISO
  created_at?: string
  updated_at?: string
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
  // Campos específicos de Embalagem, Lote Fabricante e Validade
  package_quantity?: number
  value_per_package?: number
  manufacturer_batch?: string
  manufacturing_date?: string
  expiration_date?: string
  purchase_date?: string
}

export type PeriodFilter = 'Hoje' | '7 dias' | 'Este mês' | 'Últimos 30 dias' | 'Este ano' | 'Todos'

// ==========================================
// SANIDADE (VACCINATION, TREATMENT, OCCURRENCE, PROTOCOLS)
// ==========================================

export type VaccinationStatus = 'scheduled' | 'performed' | 'delayed' | 'cancelled'
export type VaccinationRoute =
  | 'oral'
  | 'intramuscular'
  | 'ocular'
  | 'água'
  | 'ração'
  | 'subcutânea'
  | 'nasal'
  | 'spray'
  | 'outra'

export type VialStatus = 'closed' | 'opened' | 'discarded'
export type VialDestiny = 'closed' | 'kept' | 'discarded'

export interface VaccinationSessionLotApplication {
  lot_id?: string
  lotName?: string
  animal_count?: number
  dose_per_animal?: number
  volume_per_dose?: number
  volume_unit?: string
  doses_applied: number
  total_volume?: number
  cost: number
  notes?: string
}

export interface VaccinationSession {
  id: string
  organization_id?: string
  property_id?: string
  activity_id?: string
  session_date: string
  vaccine_name: string
  inventory_item_id?: string
  inventory_item_name?: string
  manufacturer_batch?: string
  expiration_date?: string
  vial_capacity: number
  initial_quantity: number
  vial_cost: number
  unit_cost: number
  opened_at?: string
  responsible?: string
  vial_destiny: VialDestiny
  total_applied: number
  total_discarded: number
  total_downloaded: number
  total_cost: number
  applications: VaccinationSessionLotApplication[]
  status: 'completed' | 'in_progress' | 'cancelled'
  notes?: string
  data?: Record<string, any>
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string
}

export interface Vaccination {
  id: string
  organization_id?: string
  property_id?: string
  activity_id?: string
  lot_id?: string
  lotName?: string
  vaccine_name: string
  disease_target?: string
  scheduled_date?: string
  performed_date?: string
  animal_count?: number
  dose_per_animal?: number // doses por ave (ex: 1 dose)
  dose_unit?: string // ex: dose, un
  volume_per_dose?: number // volume por dose (ex: 0.03 mL)
  volume_unit?: string // ex: mL, gotas
  application_route?: VaccinationRoute | string
  responsible?: string
  inventory_item_id?: string
  inventory_item_name?: string
  batch_number?: string
  expiration_date?: string
  quantity_used?: number
  unit_cost?: number
  total_cost?: number
  stock_deducted?: boolean
  notes?: string
  status: VaccinationStatus
  // Frascos multidose e perdas
  vial_status?: VialStatus
  vial_destiny?: VialDestiny
  doses_applied?: number
  doses_discarded?: number
  total_downloaded?: number
  discarded_quantity?: number
  waste_cost?: number
  session_id?: string
  data?: Record<string, any>
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string
}

export type TreatmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface Treatment {
  id: string
  organization_id?: string
  property_id?: string
  activity_id?: string
  lot_id?: string
  lotName?: string
  medication_name: string
  diagnosis_reason?: string
  dosage?: string
  frequency?: string
  duration_days?: number
  administration_route?: string
  animal_count?: number
  responsible?: string
  inventory_item_id?: string
  inventory_item_name?: string
  quantity_used?: number
  unit_cost?: number
  total_cost?: number
  stock_deducted?: boolean
  withdrawal_period_days?: number // carência em dias
  start_date?: string
  end_date?: string
  notes?: string
  status: TreatmentStatus
  data?: Record<string, any>
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string
}

export type HealthOccurrenceType =
  | 'disease'
  | 'symptom'
  | 'injury'
  | 'respiratory'
  | 'diarrhea'
  | 'locomotor'
  | 'parasites'
  | 'abnormal_behavior'
  | 'other'

export type HealthOccurrenceSeverity = 'low' | 'moderate' | 'high' | 'critical'

export interface HealthOccurrence {
  id: string
  organization_id?: string
  property_id?: string
  activity_id?: string
  lot_id?: string
  lotName?: string
  occurrence_date: string // timestamptz or YYYY-MM-DD
  occurrence_type: HealthOccurrenceType
  custom_type?: string
  severity: HealthOccurrenceSeverity
  affected_count?: number
  symptoms?: string
  description?: string
  action_taken?: string
  responsible?: string
  notes?: string
  data?: Record<string, any>
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string
}

export type HealthProtocolType =
  | 'vaccination_program'
  | 'deworming'
  | 'preventive_treatment'
  | 'biosecurity'
  | 'cleaning_disinfection'
  | 'other'

export interface HealthProtocolStep {
  day: number // dia de vida ou offset em dias
  action: string
  description?: string
  inventory_item_id?: string
  inventory_item_name?: string
  dose?: string
  route?: string
  category?: 'vacina' | 'medicamento' | 'manejo' | 'outro'
}

export interface HealthProtocol {
  id: string
  organization_id?: string
  property_id?: string
  name: string
  protocol_type: HealthProtocolType
  activity_type?: string
  age_range_start?: number
  age_range_end?: number
  steps: HealthProtocolStep[]
  notes?: string
  status: 'active' | 'inactive' | 'archived'
  data?: Record<string, any>
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string
}

export interface GeneratedProtocolEntry {
  day_offset: number
  scheduled_date: string
  action: string
  description?: string
  status: 'pending' | 'completed' | 'skipped'
  vaccination_id?: string
  treatment_id?: string
}

export interface ProtocolAssignment {
  id: string
  organization_id?: string
  property_id?: string
  lot_id?: string
  lotName?: string
  protocol_id: string
  protocolName?: string
  assigned_date: string
  start_date: string
  generated_entries: GeneratedProtocolEntry[]
  notes?: string
  data?: Record<string, any>
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string
}

export interface SanitaryApplication {
  id: string
  lot_id?: string
  date: string
  name: string
  type: 'vaccination' | 'treatment'
  total_cost: number
  status: string
  details?: string
  stock_deducted?: boolean
}
