# Zealot AgriWorks Management System

A comprehensive cloud-based farm management system for dairy, broiler, and layer farms. Built with React, TypeScript, and Supabase.

## Features

### Core Modules

1. **Farm Locations Management**
   - Add, edit, and manage multiple farm locations
   - Support for Dairy, Broiler, and Layer farms
   - Filter by farm type

2. **Cattle Management**
   - Individual cow tracking with tag IDs
   - Full lifecycle tracking (Calf → Heifer → Cow/Bull)
   - Gender-based development paths
   - Breeding and calving history
   - Health treatments and vaccinations
   - Weight tracking

3. **Dairy Milking Module**
   - Three milking sessions (Morning, Afternoon, Evening)
   - Staff accountability for milking
   - Daily/weekly/monthly milk production tracking
   - 30-minute edit/delete window with approval workflow

4. **Poultry Management**
   - **Layers**: Egg collection with staff accountability
   - **Broilers**: Batch tracking with weight, feed, mortality, and FCR
   - 30-minute edit/delete window

5. **Inventory & Stock Management**
   - Track feeds, drugs, vaccines, equipment
   - Stock movements (In/Out/Transfer)
   - Low stock alerts
   - Stock movement history

6. **Finance Module**
   - Expense tracking with categories
   - Revenue tracking by product type
   - Multiple payment methods (MPesa, Cash, Bank Transfer, Cheque)
   - 30-minute edit/delete window

7. **Staff Management**
   - Staff profiles with roles
   - Permanent staff salaries
   - Casual wages tracking
   - Staff attendance (ready for implementation)

8. **Reports & Dashboard**
   - Real-time dashboard with key metrics
   - Revenue vs Expenses charts
   - Profit trends
   - Farm contribution analysis
   - PDF export functionality
   - Filterable reports by farm, date range, and type

### User Roles & Permissions

- **Super Admin**: Full system access
- **Branch Manager**: Manage assigned farms
- **Vet**: Record treatments and vaccinations
- **Storekeeper**: Manage inventory
- **Accountant**: Sales, payments, expenses, reports
- **Field Staff**: Record milk, eggs, broilers, attendance

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form, Zod
- **Date Picker**: React DatePicker
- **Backend**: Supabase (PostgreSQL)
- **PDF Export**: jsPDF, jsPDF-AutoTable
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd project
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase project URL and anon key:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:
   - Create tables based on the TypeScript types in `src/types/index.ts`
   - Set up Row Level Security (RLS) policies
   - Create authentication tables

5. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Database Schema

The system requires the following main tables:

- `farms` - Farm locations
- `cattle` - Individual cattle records
- `milking_records` - Daily milking data
- `egg_collections` - Layer egg collection
- `broiler_batches` - Broiler batch management
- `inventory_items` - Stock items
- `stock_movements` - Inventory movements
- `expenses` - Financial expenses
- `revenue` - Sales revenue
- `staff` - Staff members
- `casual_wages` - Casual labor payments
- `users` - System users (linked to Supabase Auth)
- `audit_logs` - System audit trail

## Key Features

### 30-Minute Edit Window
- Records can be edited/deleted within 30 minutes of creation
- After 30 minutes, changes require senior approval
- Implemented for: Milking records, Egg collections, Expenses, Revenue

### Staff Accountability
- All milking records require staff assignment
- Egg collections require staff assignment
- Tracks performance per staff member

### Real-time Dashboard
- Live updates of key metrics
- Visual charts and graphs
- Filterable by date range (week/month/year)

### Multi-Farm Support
- All records linked to specific farms
- Filter and view data by farm
- Farm-specific analytics

## Development

### Project Structure

```
src/
├── components/
│   └── admin/          # Admin layout and shared components
├── contexts/           # React contexts (Auth)
├── lib/                # Utilities (Supabase client)
├── pages/
│   ├── admin/          # Admin module pages
│   └── ...             # Public pages
└── types/              # TypeScript type definitions
```

### Building for Production

```bash
npm run build
# or
pnpm build
```

The built files will be in the `dist/` directory.

## License

Copyright © 2024 Zealot AgriWorks Limited

## Contact

**Zealot AgriWorks Limited**
- Location: Mutuya, Ikinu Ward, Githunguri Sub-County, Kiambu County, Kenya
- Tel: +254 708 500 722
- Email: isaaczealot2024@gmail.com

