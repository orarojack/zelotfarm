import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Staff as StaffType, CasualWage, Farm, StaffRole, PaymentMethod } from '../../types';
import { Plus, Edit, Trash2, Users, DollarSign, Calendar, Key, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../contexts/AuthContext';

export default function Staff() {
  const [activeTab, setActiveTab] = useState<'staff' | 'salaries' | 'wages'>('staff');
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [casualWages, setCasualWages] = useState<CasualWage[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showWageModal, setShowWageModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Field Staff' as StaffRole,
    farm_id: '',
    monthly_salary: '',
    payment_method: 'Cash' as PaymentMethod,
    allowances: '',
    deductions: '',
    createAccount: false,
    password: '',
  });
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    show: boolean;
    staffId: string | null;
    staffEmail: string | null;
    staffName: string | null;
  }>({
    show: false,
    staffId: null,
    staffEmail: null,
    staffName: null,
  });
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [resettingPassword, setResettingPassword] = useState(false);
  const [wageFormData, setWageFormData] = useState({
    staff_id: '',
    farm_id: '',
    date: new Date(),
    task: '',
    hours: '',
    days: '',
    rate: '',
    payment_method: 'Cash' as PaymentMethod,
  });
  const [staffFilters, setStaffFilters] = useState({
    search: '',
    role: '',
    farm: '',
    status: 'all', // all, active, inactive
  });
  const [wageFilters, setWageFilters] = useState({
    search: '',
    farm: '',
    dateFrom: '',
    dateTo: '',
  });
  const { user, supabaseUser } = useAuth();

  useEffect(() => {
    fetchFarms();
    if (activeTab === 'staff' || activeTab === 'salaries') {
      fetchStaff();
    } else {
      fetchCasualWages();
    }
  }, [activeTab]);

  const fetchFarms = async () => {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  };

  const fetchStaff = async () => {
    try {
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .order('name');

      if (staffError) throw staffError;

      // Fetch users to check which staff have accounts
      const { data: usersData } = await supabase
        .from('users')
        .select('staff_id');

      const staffWithAccounts = new Set(usersData?.map((u) => u.staff_id).filter(Boolean) || []);

      // Add hasAccount flag to staff
      const staffWithAccountInfo = (staffData || []).map((staff) => ({
        ...staff,
        hasAccount: staffWithAccounts.has(staff.id),
      }));

      setStaffList(staffWithAccountInfo as any);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCasualWages = async () => {
    try {
      const { data, error } = await supabase
        .from('casual_wages')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCasualWages(data || []);
    } catch (error) {
      console.error('Error fetching casual wages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate default password
  const generateDefaultPassword = (name: string): string => {
    // Create a password based on name: FirstName123!
    const firstName = name.split(' ')[0].toLowerCase();
    const year = new Date().getFullYear();
    return `${firstName}${year}!`;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModal.staffEmail) return;

    setResettingPassword(true);

    // Validate passwords
    if (resetPasswordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      setResettingPassword(false);
      return;
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      alert('Passwords do not match');
      setResettingPassword(false);
      return;
    }

    try {
      // Copy password to clipboard for easy access
      try {
        await navigator.clipboard.writeText(resetPasswordForm.newPassword);
      } catch (clipboardError) {
        // Clipboard access might fail, that's okay
        console.log('Could not copy to clipboard');
      }

      // Show instructions with password
      const instructions = `Password Reset Instructions for ${resetPasswordModal.staffName}\n\n` +
        `New Password: ${resetPasswordForm.newPassword}\n` +
        `(Password has been copied to your clipboard)\n\n` +
        `Steps to reset in Supabase Dashboard:\n` +
        `1. Go to your Supabase Dashboard\n` +
        `2. Navigate to Authentication → Users\n` +
        `3. Find user with email: ${resetPasswordModal.staffEmail}\n` +
        `4. Click on the user\n` +
        `5. Click "Update user" or "Reset password"\n` +
        `6. Set the new password to: ${resetPasswordForm.newPassword}\n` +
        `7. Save the changes\n\n` +
        `After updating, share the new password with the staff member.`;

      alert(instructions);

      // Close modal and reset form
      setResetPasswordModal({ show: false, staffId: null, staffEmail: null, staffName: null });
      setResetPasswordForm({ newPassword: '', confirmPassword: '' });
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(`Error: ${error.message}\n\nPlease reset the password manually in Supabase Dashboard.`);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate email and password if creating account
      if (staffFormData.createAccount) {
        if (!staffFormData.email) {
          alert('Email is required to create a login account');
          return;
        }
        if (staffFormData.password && staffFormData.password.length < 6) {
          alert('Password must be at least 6 characters long');
          return;
        }
      }

      const staffData = {
        name: staffFormData.name,
        email: staffFormData.email || null,
        phone: staffFormData.phone || null,
        role: staffFormData.role,
        farm_id: staffFormData.farm_id || null,
        monthly_salary: staffFormData.monthly_salary ? parseFloat(staffFormData.monthly_salary) : null,
        payment_method: staffFormData.payment_method || null,
        allowances: staffFormData.allowances ? parseFloat(staffFormData.allowances) : null,
        deductions: staffFormData.deductions ? parseFloat(staffFormData.deductions) : null,
        is_active: true,
      };

      let newStaffId: string | null = null;

      if (editingStaff) {
        const { error } = await supabase
          .from('staff')
          .update({ ...staffData, updated_at: new Date().toISOString() })
          .eq('id', editingStaff.id);
        if (error) throw error;
        newStaffId = editingStaff.id;
      } else {
        const { data, error } = await supabase.from('staff').insert([staffData]).select('id').single();
        if (error) throw error;
        newStaffId = data.id;
      }

      // Create user account if requested
      // NOTE: Email confirmation MUST be disabled in Supabase Auth settings
      // for staff accounts to work without email verification.
      // See DISABLE_EMAIL_CONFIRMATION.md for setup instructions.
      if (staffFormData.createAccount && newStaffId && staffFormData.email) {
        // Use admin-provided password or generate default
        const password = staffFormData.password || generateDefaultPassword(staffFormData.name);
        
        try {
          // IMPORTANT: Save current admin session before creating new user
          // signUp() will automatically sign in as the new user if email confirmation is disabled
          const { data: currentSession } = await supabase.auth.getSession();
          const adminAccessToken = currentSession?.session?.access_token;
          const adminRefreshToken = currentSession?.session?.refresh_token;
          const adminUserId = supabaseUser?.id; // Save admin user ID
          const adminEmail = user?.email || supabaseUser?.email; // Save admin email
          
          // Create Supabase Auth user
          // This will work immediately if email confirmation is disabled
          // WARNING: This will change the current session to the new user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: staffFormData.email,
            password: password,
            options: {
              emailRedirectTo: undefined,
            },
          });

          if (authError) {
            // If user already exists, that's okay - we'll just link the account
            if (authError.message.includes('already registered')) {
              console.log('User already exists in Auth, linking account...');
              
              // Save admin session before signing in as the existing user
              const { data: currentSessionBeforeSignIn } = await supabase.auth.getSession();
              const adminAccessTokenBeforeSignIn = currentSessionBeforeSignIn?.session?.access_token;
              const adminRefreshTokenBeforeSignIn = currentSessionBeforeSignIn?.session?.refresh_token;
              const adminUserIdBeforeSignIn = supabaseUser?.id; // Save admin user ID
              
              // Try to sign in to get the user ID
              // WARNING: This will change the current session to the staff user
              const { data: signInData } = await supabase.auth.signInWithPassword({
                email: staffFormData.email,
                password: password,
              });
              
              if (signInData?.user) {
                // Create users table record
                const { error: userError } = await supabase.from('users').upsert({
                  id: signInData.user.id,
                  email: staffFormData.email,
                  role: staffFormData.role,
                  staff_id: newStaffId,
                });
                if (userError) throw userError;
                
                // CRITICAL: Restore admin session after linking account
                if (adminAccessTokenBeforeSignIn && adminRefreshTokenBeforeSignIn && adminUserIdBeforeSignIn) {
                  try {
                    await supabase.auth.signOut();
                    const { error: restoreError, data: restoreData } = await supabase.auth.setSession({
                      access_token: adminAccessTokenBeforeSignIn,
                      refresh_token: adminRefreshTokenBeforeSignIn,
                    });
                    
                    if (restoreError || !restoreData.session || restoreData.session.user.id !== adminUserIdBeforeSignIn) {
                      console.error('Error restoring admin session:', restoreError);
                      alert('Account linked successfully, but your session was interrupted. Please log in again.');
                      window.location.href = '/admin/login';
                      return;
                    }
                    
                    console.log('Admin session restored successfully after linking account');
                  } catch (restoreError) {
                    console.error('Error restoring admin session:', restoreError);
                    alert('Account linked successfully, but your session was interrupted. Please log in again.');
                    window.location.href = '/admin/login';
                    return;
                  }
                } else {
                  console.warn('Could not restore admin session - missing tokens or user ID');
                }
              }
            } else {
              throw authError;
            }
          } else if (authData?.user) {
            // Create users table record
            const { error: userError } = await supabase.from('users').insert({
              id: authData.user.id,
              email: staffFormData.email,
              role: staffFormData.role,
              staff_id: newStaffId,
            });
            if (userError) throw userError;

            // CRITICAL: Restore admin session immediately after creating user
            // signUp() automatically signed in as the new user, so we need to restore admin session
            if (adminAccessToken && adminRefreshToken && adminUserId) {
              try {
                // Sign out the newly created user
                await supabase.auth.signOut();
                
                // Restore admin session using the saved tokens
                const { error: restoreError, data: restoreData } = await supabase.auth.setSession({
                  access_token: adminAccessToken,
                  refresh_token: adminRefreshToken,
                });
                
                if (restoreError || !restoreData.session) {
                  console.error('Error restoring admin session:', restoreError);
                  // If restore fails, admin will need to log in again
                  alert('Staff account created successfully, but your session was interrupted. Please log in again.');
                  window.location.href = '/admin/login';
                  return;
                }
                
                // Verify we're back to the admin user
                if (restoreData.session.user.id !== adminUserId) {
                  console.error('Session restored but user ID mismatch');
                  alert('Staff account created successfully, but your session was interrupted. Please log in again.');
                  window.location.href = '/admin/login';
                  return;
                }
                
                console.log('Admin session restored successfully');
              } catch (restoreError) {
                console.error('Error restoring admin session:', restoreError);
                alert('Staff account created successfully, but your session was interrupted. Please log in again.');
                window.location.href = '/admin/login';
                return;
              }
            } else {
              console.warn('Could not restore admin session - missing tokens or user ID');
            }

            // Show credentials to admin
            setCreatedCredentials({
              email: staffFormData.email,
              password: password,
            });
          }
        } catch (accountError: any) {
          console.error('Error creating user account:', accountError);
          
          // Try to restore admin session even if account creation failed
          if (adminAccessToken && adminRefreshToken && adminUserId) {
            try {
              await supabase.auth.signOut();
              const { data: restoreData } = await supabase.auth.setSession({
                access_token: adminAccessToken,
                refresh_token: adminRefreshToken,
              });
              
              if (!restoreData.session || restoreData.session.user.id !== adminUserId) {
                console.error('Failed to restore admin session after error');
                alert('Your session was interrupted. Please log in again.');
                window.location.href = '/admin/login';
              }
            } catch (restoreError) {
              console.error('Error restoring admin session after error:', restoreError);
              alert('Your session was interrupted. Please log in again.');
              window.location.href = '/admin/login';
            }
          }
          
          // Don't fail the whole operation if account creation fails
          alert(`Staff member created, but account creation failed: ${accountError.message}. You can create the account manually later.`);
        }
      }

      if (!createdCredentials) {
        setShowStaffModal(false);
        setEditingStaff(null);
        resetStaffForm();
      }
      fetchStaff();
    } catch (error: any) {
      console.error('Error saving staff:', error);
      alert(`Error saving staff member: ${error.message}`);
    }
  };

  const handleWageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const hours = wageFormData.hours ? parseFloat(wageFormData.hours) : 0;
      const days = wageFormData.days ? parseFloat(wageFormData.days) : 0;
      const rate = parseFloat(wageFormData.rate);
      const total = hours > 0 ? hours * rate : days * rate;

      const wageData = {
        staff_id: wageFormData.staff_id,
        farm_id: wageFormData.farm_id,
        date: wageFormData.date.toISOString().split('T')[0],
        task: wageFormData.task,
        hours: hours > 0 ? hours : null,
        days: days > 0 ? days : null,
        rate: rate,
        total: total,
        payment_method: wageFormData.payment_method,
        created_by: user.id,
      };

      const { error } = await supabase.from('casual_wages').insert([wageData]);
      if (error) throw error;

      setShowWageModal(false);
      resetWageForm();
      fetchCasualWages();
    } catch (error) {
      console.error('Error saving casual wage:', error);
      alert('Error saving casual wage');
    }
  };

  const resetStaffForm = () => {
    setStaffFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Field Staff',
      farm_id: '',
      monthly_salary: '',
      payment_method: 'Cash',
      allowances: '',
      deductions: '',
      createAccount: false,
      password: '',
    });
    setCreatedCredentials(null);
  };

  const resetWageForm = () => {
    setWageFormData({
      staff_id: '',
      farm_id: '',
      date: new Date(),
      task: '',
      hours: '',
      days: '',
      rate: '',
      payment_method: 'Cash',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'staff'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={20} />
              Staff Members
            </div>
          </button>
          <button
            onClick={() => setActiveTab('salaries')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'salaries'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={20} />
              Salaries
            </div>
          </button>
          <button
            onClick={() => setActiveTab('wages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'wages'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar size={20} />
              Casual Wages
            </div>
          </button>
        </nav>
      </div>

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={staffFilters.search}
                  onChange={(e) => setStaffFilters({ ...staffFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={staffFilters.role}
                onChange={(e) => setStaffFilters({ ...staffFilters, role: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Vet">Vet</option>
                <option value="Storekeeper">Storekeeper</option>
                <option value="Accountant">Accountant</option>
                <option value="Field Staff">Field Staff</option>
              </select>
              <select
                value={staffFilters.farm}
                onChange={(e) => setStaffFilters({ ...staffFilters, farm: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Farms</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
              <select
                value={staffFilters.status}
                onChange={(e) => setStaffFilters({ ...staffFilters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingStaff(null);
                resetStaffForm();
                setShowStaffModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Staff Member
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffList.filter((member) => {
                  const matchesSearch = staffFilters.search === '' || 
                    member.name.toLowerCase().includes(staffFilters.search.toLowerCase()) ||
                    member.email?.toLowerCase().includes(staffFilters.search.toLowerCase()) ||
                    member.phone?.toLowerCase().includes(staffFilters.search.toLowerCase());
                  const matchesRole = staffFilters.role === '' || member.role === staffFilters.role;
                  const matchesFarm = staffFilters.farm === '' || member.farm_id === staffFilters.farm;
                  const matchesStatus = staffFilters.status === 'all' || 
                    (staffFilters.status === 'active' && member.is_active) ||
                    (staffFilters.status === 'inactive' && !member.is_active);
                  return matchesSearch && matchesRole && matchesFarm && matchesStatus;
                }).map((member) => {
                  const farm = farms.find((f) => f.id === member.farm_id);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {farm?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.phone || member.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {member.monthly_salary ? `KES ${member.monthly_salary.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(member as any).hasAccount ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            No Account
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(member as any).hasAccount && member.email && (
                            <button
                              onClick={() => {
                                setResetPasswordModal({
                                  show: true,
                                  staffId: member.id,
                                  staffEmail: member.email || null,
                                  staffName: member.name,
                                });
                                setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                              }}
                              className="text-orange-600 hover:text-orange-900"
                              title="Reset Password"
                            >
                              <Key size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingStaff(member);
                              setStaffFormData({
                                name: member.name,
                                email: member.email || '',
                                phone: member.phone || '',
                                role: member.role,
                                farm_id: member.farm_id || '',
                                monthly_salary: member.monthly_salary?.toString() || '',
                                payment_method: member.payment_method || 'Cash',
                                allowances: member.allowances?.toString() || '',
                                deductions: member.deductions?.toString() || '',
                                createAccount: false,
                                password: '',
                              });
                              setShowStaffModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Staff"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salaries Tab */}
      {activeTab === 'salaries' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffList.filter((s) => s.monthly_salary && s.is_active).map((member) => {
                  const farm = farms.find((f) => f.id === member.farm_id);
                  const netSalary = (member.monthly_salary || 0) + (member.allowances || 0) - (member.deductions || 0);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{member.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farm?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">KES {member.monthly_salary?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        +KES {member.allowances?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -KES {member.deductions?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        KES {netSalary.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Casual Wages Tab */}
      {activeTab === 'wages' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by staff name, task..."
                  value={wageFilters.search}
                  onChange={(e) => setWageFilters({ ...wageFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={wageFilters.farm}
                onChange={(e) => setWageFilters({ ...wageFilters, farm: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Farms</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={wageFilters.dateFrom}
                onChange={(e) => setWageFilters({ ...wageFilters, dateFrom: e.target.value })}
                placeholder="From Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="date"
                value={wageFilters.dateTo}
                onChange={(e) => setWageFilters({ ...wageFilters, dateTo: e.target.value })}
                placeholder="To Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                resetWageForm();
                setShowWageModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Casual Wage
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours/Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {casualWages.filter((wage) => {
                  const staffMember = staffList.find((s) => s.id === wage.staff_id);
                  const matchesSearch = wageFilters.search === '' || 
                    staffMember?.name.toLowerCase().includes(wageFilters.search.toLowerCase()) ||
                    wage.task.toLowerCase().includes(wageFilters.search.toLowerCase());
                  const matchesFarm = wageFilters.farm === '' || wage.farm_id === wageFilters.farm;
                  const matchesDateFrom = wageFilters.dateFrom === '' || new Date(wage.date) >= new Date(wageFilters.dateFrom);
                  const matchesDateTo = wageFilters.dateTo === '' || new Date(wage.date) <= new Date(wageFilters.dateTo);
                  return matchesSearch && matchesFarm && matchesDateFrom && matchesDateTo;
                }).map((wage) => {
                  const staffMember = staffList.find((s) => s.id === wage.staff_id);
                  const farm = farms.find((f) => f.id === wage.farm_id);
                  return (
                    <tr key={wage.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(wage.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {staffMember?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wage.task}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {wage.hours ? `${wage.hours} hrs` : wage.days ? `${wage.days} days` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">KES {wage.rate.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        KES {wage.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wage.payment_method}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
            </h2>
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={staffFormData.name}
                  onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as StaffRole })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Vet">Vet</option>
                    <option value="Storekeeper">Storekeeper</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Field Staff">Field Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                  <select
                    value={staffFormData.farm_id}
                    onChange={(e) => setStaffFormData({ ...staffFormData, farm_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary</label>
                <input
                  type="number"
                  step="0.01"
                  value={staffFormData.monthly_salary}
                  onChange={(e) => setStaffFormData({ ...staffFormData, monthly_salary: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowances</label>
                  <input
                    type="number"
                    step="0.01"
                    value={staffFormData.allowances}
                    onChange={(e) => setStaffFormData({ ...staffFormData, allowances: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                  <input
                    type="number"
                    step="0.01"
                    value={staffFormData.deductions}
                    onChange={(e) => setStaffFormData({ ...staffFormData, deductions: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={staffFormData.payment_method}
                  onChange={(e) => setStaffFormData({ ...staffFormData, payment_method: e.target.value as PaymentMethod })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="MPesa">MPesa</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              {!editingStaff && (
                <>
                  <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                      type="checkbox"
                      id="createAccount"
                      checked={staffFormData.createAccount}
                      onChange={(e) => setStaffFormData({ ...staffFormData, createAccount: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="createAccount" className="text-sm font-medium text-gray-700">
                      Create login account for this staff member
                    </label>
                  </div>
                  {staffFormData.createAccount && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Set Password *
                      </label>
                      <input
                        type="password"
                        value={staffFormData.password}
                        onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                        required={staffFormData.createAccount}
                        minLength={6}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Enter password (min. 6 characters)"
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Leave empty to auto-generate: {generateDefaultPassword(staffFormData.name || 'user')}
                      </p>
                    </div>
                  )}
                </>
              )}
              {createdCredentials && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Login Account Created Successfully!</h3>
                  <p className="text-sm text-gray-700 mb-2">Please share these credentials with the staff member:</p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Email: </span>
                      <span className="text-sm font-mono bg-white px-2 py-1 rounded border">{createdCredentials.email}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Default Password: </span>
                      <span className="text-sm font-mono bg-white px-2 py-1 rounded border">{createdCredentials.password}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    <strong>Note:</strong> The staff member should change this password in their Profile Settings after first login.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCredentials(null);
                      setShowStaffModal(false);
                      setEditingStaff(null);
                      resetStaffForm();
                    }}
                    className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    Close
                  </button>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingStaff ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wage Modal */}
      {showWageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Casual Wage</h2>
            <form onSubmit={handleWageSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff *</label>
                <select
                  value={wageFormData.staff_id}
                  onChange={(e) => setWageFormData({ ...wageFormData, staff_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Staff</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={wageFormData.farm_id}
                  onChange={(e) => setWageFormData({ ...wageFormData, farm_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Farm</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <DatePicker
                  selected={wageFormData.date}
                  onChange={(date: Date) => setWageFormData({ ...wageFormData, date })}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task *</label>
                <input
                  type="text"
                  value={wageFormData.task}
                  onChange={(e) => setWageFormData({ ...wageFormData, task: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={wageFormData.hours}
                    onChange={(e) => {
                      setWageFormData({ ...wageFormData, hours: e.target.value, days: '' });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                  <input
                    type="number"
                    step="0.5"
                    value={wageFormData.days}
                    onChange={(e) => {
                      setWageFormData({ ...wageFormData, days: e.target.value, hours: '' });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate (KES) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={wageFormData.rate}
                  onChange={(e) => setWageFormData({ ...wageFormData, rate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={wageFormData.payment_method}
                  onChange={(e) => setWageFormData({ ...wageFormData, payment_method: e.target.value as PaymentMethod })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="MPesa">MPesa</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowWageModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-4">
              Reset password for <strong>{resetPasswordModal.staffName}</strong> ({resetPasswordModal.staffEmail})
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 mb-2">
                  <strong>Note:</strong> Password reset requires Supabase Dashboard access. The password will be copied to your clipboard when you confirm.
                </p>
                <p className="text-xs text-blue-700 font-semibold">
                  New Password: {resetPasswordForm.newPassword || '(enter password above)'}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {resettingPassword ? 'Processing...' : 'Confirm Reset'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordModal({ show: false, staffId: null, staffEmail: null, staffName: null });
                    setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

