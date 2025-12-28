// Farm Types
export type FarmType = 'Dairy' | 'Broiler' | 'Layer' | 'Other';

export interface Farm {
  id: string;
  name: string;
  type: FarmType;
  location: string;
  created_at: string;
  updated_at: string;
}

// Cattle Types
export type CattleGender = 'Male' | 'Female';
export type CattleStatus = 'Calf' | 'Heifer' | 'Cow' | 'Bull';

export interface Cattle {
  id: string;
  tag_id: string;
  farm_id: string;
  cow_name?: string;
  breed: string;
  gender: CattleGender;
  status: CattleStatus;
  birth_date: string;
  birth_weight?: number;
  mother_tag?: string;
  father_tag?: string;
  sale_date?: string;
  death_date?: string;
  sale_price?: number;
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CattleWeight {
  id: string;
  cattle_id: string;
  weight: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface CattleHealth {
  id: string;
  cattle_id: string;
  treatment_type: 'Vaccination' | 'Treatment' | 'Checkup';
  description: string;
  date: string;
  vet_name?: string;
  cost?: number;
  created_at: string;
}

export interface Breeding {
  id: string;
  cow_id: string;
  bull_id?: string;
  breeding_date: string;
  expected_calving_date?: string;
  actual_calving_date?: string;
  calf_tag?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Milking Types
export type MilkingSession = 'Morning' | 'Afternoon' | 'Evening';
export type MilkStatus = 'Consumption' | 'Colostrum';

export interface MilkingRecord {
  id: string;
  farm_id: string;
  cow_id: string;
  date: string;
  session: MilkingSession;
  milk_yield: number; // in liters
  milk_status: MilkStatus;
  staff_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Poultry Types
export type EggStatus = 'Good' | 'Broken' | 'Spoiled';
export type ProductionType = 'Broiler' | 'Layer';
export type BatchStatus = 'Planned' | 'Active' | 'Suspended' | 'Closed';
export type AdministrationMethod = 'Oral' | 'Injection' | 'Water' | 'Spray' | 'Eye Drop' | 'Wing Web' | 'Other';
export type VaccinationStatus = 'Planned' | 'Completed' | 'Overdue';
export type EggGrade = 'Grade A' | 'Grade B' | 'Grade C' | 'Dirty';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';
export type PaymentStatusType = 'Pending' | 'Partially Paid' | 'Fully Paid';
export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type ProductType = 'Eggs' | 'Broilers' | 'Layers' | 'Feed' | 'Other';
export type LayerProductType = 'Eggs' | 'Spent Hens' | 'Manure' | 'Other';
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export type AssetCategory = 'Land' | 'Building' | 'Equipment' | 'Vehicle' | 'Furniture' | 'Other';
export type DepreciationMethod = 'Straight-line' | 'Reducing Balance' | 'Units of Production' | 'None';

// Poultry Houses
export interface PoultryHouse {
  id: string;
  farm_id: string;
  name: string;
  capacity?: number;
  house_type?: 'Broiler House' | 'Layer House' | 'Mixed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Poultry Batches/Flocks (unified for Broilers and Layers)
export interface PoultryBatch {
  id: string;
  batch_flock_id: string; // Auto-generated unique ID
  production_type: ProductionType;
  farm_id: string;
  house_id?: string;
  breed_strain: string;
  source?: string; // Chick or pullet source
  placement_date: string;
  initial_quantity: number;
  age_at_placement?: number; // For layers (in days)
  production_phase?: string; // For layers
  expected_market_date?: string; // For broilers
  expected_laying_period?: number; // For layers (in days)
  status: BatchStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Daily Stock Movement
export interface BatchStockMovement {
  id: string;
  batch_id: string;
  date: string;
  opening_stock: number;
  mortalities: number;
  culls: number;
  closing_stock: number; // Auto-calculated
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Feed Issuance
export interface FeedIssuance {
  id: string;
  issuance_reference: string; // Auto-generated
  batch_id: string;
  feed_type: string;
  supplier?: string;
  issuance_date: string;
  quantity_kg: number;
  quantity_bags?: number;
  bags_per_kg?: number; // Conversion factor
  unit_cost?: number;
  total_cost?: number; // Auto-calculated
  inventory_item_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Vaccination
export interface Vaccination {
  id: string;
  batch_id: string;
  vaccination_date: string;
  birds_age_days: number;
  vaccine_name: string;
  disease_target: string;
  administration_method: AdministrationMethod;
  dosage: string;
  number_of_birds: number;
  manufacturer?: string;
  batch_number?: string; // Vaccine batch number
  expiry_date?: string;
  cost_per_dosage?: number;
  total_cost?: number; // Auto-calculated
  veterinary_name?: string;
  status: VaccinationStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Medication
export interface PoultryMedication {
  id: string;
  batch_id: string;
  treatment_date: string;
  medication_name: string;
  disease_condition?: string;
  administration_method?: string;
  dosage?: string;
  number_of_birds?: number;
  withdrawal_period_days?: number;
  cost?: number;
  veterinary_name?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Enhanced Egg Collection with Grading
export interface EggCollectionEnhanced {
  id: string;
  batch_id: string; // Link to flock
  farm_id: string;
  branch?: string;
  collection_date: string;
  collection_time?: string;
  total_eggs_collected: number;
  grade_a_quantity: number;
  grade_b_quantity: number;
  grade_c_quantity: number;
  dirty_eggs_quantity: number;
  average_egg_weight_g?: number;
  storage_temperature_c?: number;
  notes?: string;
  staff_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Legacy Egg Collection (for backward compatibility)
export interface EggCollection {
  id: string;
  farm_id: string;
  date: string;
  number_of_eggs: number;
  egg_status: EggStatus;
  broken_count?: number;
  spoiled_count?: number;
  trays?: number;
  staff_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Broiler Production
export interface BroilerProduction {
  id: string;
  batch_id: string;
  date: string;
  average_weight_kg?: number;
  daily_gain_kg?: number; // Auto-calculated
  total_feed_consumed_kg?: number;
  mortality_count: number;
  current_count: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Broiler Sales
export interface BroilerSale {
  id: string;
  batch_id: string;
  sale_date: string;
  quantity: number;
  average_weight_kg?: number;
  total_weight_kg?: number; // Auto-calculated
  unit_price?: number;
  total_amount?: number; // Auto-calculated
  customer_id?: string;
  customer_name?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatusType;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Legacy BroilerBatch (for backward compatibility)
export interface BroilerBatch {
  id: string;
  farm_id: string;
  batch_number: string;
  start_date: string;
  initial_count: number;
  current_count: number;
  average_weight?: number;
  feed_consumption?: number;
  mortality?: number;
  fcr?: number;
  harvest_date?: string;
  harvest_count?: number;
  harvest_weight?: number;
  revenue?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Layer Production
export interface LayerProduction {
  id: string;
  batch_id: string;
  date: string;
  eggs_per_bird?: number;
  production_percentage?: number; // Auto-calculated
  total_eggs: number;
  current_bird_count: number;
  feed_consumed_kg?: number;
  feed_cost_per_egg?: number; // Auto-calculated
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Layer Sales
export interface LayerSale {
  id: string;
  batch_id: string;
  sale_date: string;
  product_type: LayerProductType;
  quantity: number;
  unit: string;
  unit_price?: number;
  total_amount?: number; // Auto-calculated
  customer_id?: string;
  customer_name?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatusType;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Customer (enhanced)
export interface CustomerEnhanced {
  id: string;
  customer_code?: string;
  customer_name: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  customer_type?: CustomerType;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Legacy EggSale (for backward compatibility)
export interface EggSale {
  id: string;
  farm_id: string;
  date: string;
  quantity: number;
  unit_price?: number;
  total_amount?: number;
  customer?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EggStockInitial {
  id: string;
  farm_id: string;
  initial_stock: number;
  start_date: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EggStockAnalysis {
  date: string;
  opening_stock: number;
  daily_collection: number;
  total: number;
  broken: number;
  spoiled: number;
  sold: number;
  balance: number;
}

// Poultry Orders
export interface PoultryOrder {
  id: string;
  order_reference: string;
  customer_id: string;
  order_date: string;
  delivery_date?: string;
  status: OrderStatus;
  total_amount: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PoultryOrderItem {
  id: string;
  order_id: string;
  item_type: ProductType;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  batch_id?: string;
  notes?: string;
  created_at: string;
}

// Invoices
export interface Invoice {
  id: string;
  invoice_number: string;
  order_id?: string;
  customer_id: string;
  invoice_date: string;
  billing_address?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number; // Auto-calculated
  status: InvoiceStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// Payments
export interface Payment {
  id: string;
  payment_reference: string;
  invoice_id: string;
  payment_date: string;
  payment_method: PaymentMethod;
  amount_paid: number;
  outstanding_balance?: number; // Auto-calculated
  status: PaymentStatusType;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Financial Management
export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account_id?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  entry_reference: string;
  entry_date: string;
  description: string;
  total_debit: number;
  total_credit: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  budget_reference: string;
  period_start: string;
  period_end: string;
  account_id: string;
  planned_amount: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  asset_code: string;
  asset_name: string;
  asset_category: AssetCategory;
  purchase_date: string;
  purchase_cost: number;
  depreciation_method: DepreciationMethod;
  useful_life_years?: number;
  depreciation_rate_percent?: number;
  accumulated_depreciation: number;
  net_book_value?: number; // Auto-calculated
  location?: string;
  assigned_department?: string;
  notes?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssetDepreciation {
  id: string;
  asset_id: string;
  depreciation_date: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  net_book_value: number;
  notes?: string;
  created_by: string;
  created_at: string;
}

// Batch Performance KPIs (computed)
export interface BatchPerformance {
  batch_id: string;
  batch_flock_id: string;
  production_type: ProductionType;
  mortality_percentage: number;
  fcr?: number; // Feed Conversion Ratio (for broilers)
  production_percentage?: number; // For layers
  feed_cost_per_egg?: number; // For layers
  total_revenue: number;
  total_costs: number;
  net_profit: number;
  profitability_percentage: number;
}

// Inventory Types
export type InventoryCategory = 'Feeds' | 'Drugs' | 'Vaccines' | 'Equipment' | 'Other';

export interface InventoryItem {
  id: string;
  farm_id: string;
  name: string;
  category: InventoryCategory;
  unit: string; // kg, liters, pieces, etc.
  quantity: number;
  min_stock_level: number;
  unit_price?: number;
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  inventory_id: string;
  farm_id: string;
  movement_type: 'In' | 'Out' | 'Transfer';
  quantity: number;
  date: string;
  to_farm_id?: string; // for transfers
  notes?: string;
  created_by: string;
  created_at: string;
}

// Finance Types
export type PaymentMethod = 'MPesa' | 'Cash' | 'Bank Transfer' | 'Cheque';
export type ExpenseCategory = 
  | 'Feeds' 
  | 'Drugs & Vaccines' 
  | 'Staff Salaries' 
  | 'Casual Wages' 
  | 'Fuel & Transport' 
  | 'Repairs' 
  | 'Services' 
  | 'Miscellaneous';

export type RevenueType = 
  | 'Milk' 
  | 'Eggs' 
  | 'Broilers' 
  | 'Male Calves' 
  | 'Heifers' 
  | 'Other Products';

export interface Expense {
  id: string;
  farm_id: string;
  date: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Revenue {
  id: string;
  farm_id: string;
  date: string;
  amount: number;
  customer?: string;
  revenue_type: RevenueType;
  payment_method: PaymentMethod;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Staff Types
export type StaffRole = 
  | 'Super Admin' 
  | 'Branch Manager' 
  | 'Vet' 
  | 'Storekeeper' 
  | 'Accountant' 
  | 'Field Staff';

export interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  farm_id?: string; // assigned farm
  monthly_salary?: number;
  payment_method?: PaymentMethod;
  allowances?: number;
  deductions?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffAttendance {
  id: string;
  staff_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  hours_worked?: number;
  notes?: string;
  created_at: string;
}

export interface CasualWage {
  id: string;
  staff_id: string;
  farm_id: string;
  date: string;
  task: string;
  hours?: number;
  days?: number;
  rate: number;
  total: number;
  payment_method: PaymentMethod;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// User & Auth Types
export interface User {
  id: string;
  email: string;
  role: StaffRole;
  staff_id?: string;
  created_at: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id: string;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

// Dashboard Types
export interface DashboardStats {
  total_revenue: number;
  total_expenses: number;
  total_salaries: number;
  total_casual_wages: number;
  net_profit: number;
  milk_production: number;
  egg_collection: number;
  broiler_revenue: number;
  other_income: number;
}

export interface ChartData {
  date: string;
  revenue?: number;
  expenses?: number;
  profit?: number;
  milk?: number;
  eggs?: number;
}

// Ecommerce Types
export interface ProductCategory {
  id: string;
  name: string;
  icon_name?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EcommerceProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stock_quantity: number;
  stock_unit: string;
  location: string;
  image_url?: string;
  category_id?: string;
  farm_id?: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LiveBid {
  id: string;
  name: string;
  description?: string;
  starting_price: number;
  current_price: number;
  unit: string;
  available_quantity: string;
  location: string;
  image_url?: string;
  category_id?: string;
  farm_id?: string;
  start_time: string;
  end_time: string;
  total_bids: number;
  is_trending: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Customer Types
export interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  city?: string;
  county?: string;
  postal_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Cart Types
export type CartItemType = 'product' | 'bid';

export interface CartItem {
  id: string;
  customer_id: string;
  product_id?: string;
  bid_id?: string;
  quantity: number;
  unit_price: number;
  item_type: CartItemType;
  created_at: string;
  updated_at: string;
  // Joined data
  product?: EcommerceProduct;
  bid?: LiveBid;
}

// Order Types
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type CustomerPaymentMethod = 'MPesa' | 'Cash' | 'Bank Transfer' | 'Cheque' | 'Card';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_county?: string;
  shipping_postal_code?: string;
  shipping_phone: string;
  payment_method?: CustomerPaymentMethod;
  payment_status: PaymentStatus;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  // Joined data
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  bid_id?: string;
  item_name: string;
  item_type: CartItemType;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  // Joined data
  product?: EcommerceProduct;
  bid?: LiveBid;
}

