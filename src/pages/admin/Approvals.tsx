import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AuditLog } from '../../types';
import { Check, X, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { approveAuditLog } from '../../lib/audit';
import TableActions from '../../components/admin/TableActions';

export default function Approvals() {
  const [pendingApprovals, setPendingApprovals] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('requires_approval', true)
        .is('approved_by', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (log: AuditLog) => {
    if (!user) return;

    if (!confirm('Are you sure you want to approve this change?')) return;

    try {
      await approveAuditLog(log.id, user.id);

      // Apply the change based on the audit log
      if (log.action === 'UPDATE' && log.new_values) {
        const { error } = await supabase
          .from(log.table_name)
          .update(log.new_values)
          .eq('id', log.record_id);

        if (error) throw error;
      } else if (log.action === 'DELETE') {
        const { error } = await supabase
          .from(log.table_name)
          .delete()
          .eq('id', log.record_id);

        if (error) throw error;
      }

      fetchPendingApprovals();
      alert('Change approved and applied successfully');
    } catch (error) {
      console.error('Error approving change:', error);
      alert('Error approving change');
    }
  };

  const handleReject = async (log: AuditLog) => {
    if (!user) return;

    if (!confirm('Are you sure you want to reject this change?')) return;

    try {
      // Mark as rejected by updating the audit log
      const { error } = await supabase
        .from('audit_logs')
        .update({
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          // We can add a rejected status if needed
        })
        .eq('id', log.id);

      if (error) throw error;

      fetchPendingApprovals();
      alert('Change rejected');
    } catch (error) {
      console.error('Error rejecting change:', error);
      alert('Error rejecting change');
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No pending approvals</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingApprovals.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{log.table_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.user_id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleApprove(log)}
                        className="text-green-600 hover:text-green-900"
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleReject(log)}
                        className="text-red-600 hover:text-red-900"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-5xl">
            <h2 className="text-2xl font-bold mb-4">Audit Log Details</h2>
            <div className="space-y-4">
              <div>
                <strong>Table:</strong> {selectedLog.table_name}
              </div>
              <div>
                <strong>Action:</strong> {selectedLog.action}
              </div>
              <div>
                <strong>Record ID:</strong> {selectedLog.record_id}
              </div>
              <div>
                <strong>Created:</strong> {new Date(selectedLog.created_at).toLocaleString()}
              </div>
              {selectedLog.old_values && (
                <div>
                  <strong>Old Values:</strong>
                  <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.new_values && (
                <div>
                  <strong>New Values:</strong>
                  <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedLog(null)}
              className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

