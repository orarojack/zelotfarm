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

export interface EggCollection {
  id: string;
  farm_id: string;
  date: string;
  number_of_eggs: number; // Total eggs collected
  egg_status: EggStatus; // Legacy field, kept for backward compatibility
  broken_count?: number; // Number of broken eggs
  spoiled_count?: number; // Number of spoiled eggs
  trays?: number;
  staff_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

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
  fcr?: number; // Feed Conversion Ratio
  harvest_date?: string;
  harvest_count?: number;
  harvest_weight?: number;
  revenue?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

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

