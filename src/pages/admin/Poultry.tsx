import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Farm } from '../../types';
import { Egg, Circle, Package, Syringe, TrendingUp, ShoppingCart, DollarSign, BookOpen, BarChart3, Pill } from 'lucide-react';
import BatchManagement from './poultry/BatchManagement';
import BroilersModule from './poultry/BroilersModule';
import LayersModule from './poultry/LayersModule';
import FeedIssuance from './poultry/FeedIssuance';
import VaccinationSchedule from './poultry/VaccinationSchedule';
import DailyStockMovements from './poultry/DailyStockMovements';
import MedicationManagement from './poultry/MedicationManagement';
import EggGrading from './poultry/EggGrading';
import CustomerManagement from './poultry/CustomerManagement';
import SalesOrders from './poultry/SalesOrders';
import InvoiceManagement from './poultry/InvoiceManagement';
import PaymentManagement from './poultry/PaymentManagement';
import ChartOfAccounts from './poultry/ChartOfAccounts';
import JournalEntries from './poultry/JournalEntries';
import GeneralLedger from './poultry/GeneralLedger';
import BudgetPlanning from './poultry/BudgetPlanning';
import FinancialStatements from './poultry/FinancialStatements';
import AssetsManagement from './poultry/AssetsManagement';
import PerformanceDashboard from './poultry/PerformanceDashboard';

export default function Poultry() {
  const [activeTab, setActiveTab] = useState<string>('batch');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
    const { data } = await supabase
      .from('farms')
      .select('*')
        .in('type', ['Layer', 'Broiler', 'Mixed']);
    setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'batch', label: 'Batch Management', icon: Circle },
    { id: 'broilers', label: 'Broilers', icon: Circle },
    { id: 'layers', label: 'Layers', icon: Egg },
    { id: 'feed', label: 'Feed Issuance', icon: Package },
    { id: 'vaccination', label: 'Vaccination', icon: Syringe },
    { id: 'stock', label: 'Daily Stock', icon: TrendingUp },
    { id: 'medication', label: 'Medication', icon: Pill },
    { id: 'grading', label: 'Egg Grading', icon: Egg },
    { id: 'customers', label: 'Customers', icon: ShoppingCart },
    { id: 'orders', label: 'Sales & Orders', icon: ShoppingCart },
    { id: 'invoices', label: 'Invoices', icon: DollarSign },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'chart', label: 'Chart of Accounts', icon: BookOpen },
    { id: 'journal', label: 'Journal Entries', icon: BookOpen },
    { id: 'ledger', label: 'General Ledger', icon: BookOpen },
    { id: 'budget', label: 'Budget Planning', icon: BookOpen },
    { id: 'statements', label: 'Financial Statements', icon: BookOpen },
    { id: 'assets', label: 'Assets', icon: BookOpen },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Poultry Management</h1>
      </div>

      {/* Tabs as Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative p-5 rounded-xl border-2 transition-all duration-300 transform ${
                isActive
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-200/50 scale-105'
                  : 'border-gray-200 bg-white hover:border-green-400 hover:shadow-lg hover:shadow-green-100/50 hover:scale-105 hover:-translate-y-1'
              }`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
              
              <div className="flex flex-col items-center gap-3">
                {/* Icon with gradient background */}
                <div className={`relative p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 group-hover:from-green-100 group-hover:to-emerald-100 group-hover:text-green-600'
                }`}>
                  <Icon size={28} className="transition-transform duration-300 group-hover:scale-110" />
                  
                  {/* Shine effect on active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-xs lg:text-sm font-semibold text-center leading-tight transition-colors duration-300 ${
                  isActive
                    ? 'text-green-700'
                    : 'text-gray-700 group-hover:text-green-700'
                }`}>
                  {tab.label}
                </span>
              </div>
              
              {/* Hover glow effect */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 transition-all duration-300 pointer-events-none"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'batch' && <BatchManagement farms={farms} />}
        {activeTab === 'broilers' && <BroilersModule farms={farms} />}
        {activeTab === 'layers' && <LayersModule farms={farms} />}
        {activeTab === 'feed' && <FeedIssuance />}
        {activeTab === 'vaccination' && <VaccinationSchedule />}
        {activeTab === 'stock' && <DailyStockMovements />}
        {activeTab === 'medication' && <MedicationManagement />}
        {activeTab === 'grading' && <EggGrading farms={farms} />}
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'orders' && <SalesOrders />}
        {activeTab === 'invoices' && <InvoiceManagement />}
        {activeTab === 'payments' && <PaymentManagement />}
        {activeTab === 'chart' && <ChartOfAccounts />}
        {activeTab === 'journal' && <JournalEntries />}
        {activeTab === 'ledger' && <GeneralLedger />}
        {activeTab === 'budget' && <BudgetPlanning />}
        {activeTab === 'statements' && <FinancialStatements />}
        {activeTab === 'assets' && <AssetsManagement />}
        {activeTab === 'performance' && <PerformanceDashboard />}
            </div>
          </div>
  );
}
