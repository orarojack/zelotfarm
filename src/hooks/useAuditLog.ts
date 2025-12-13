import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createAuditLog, shouldRequireApproval } from '../lib/audit';
import { supabase } from '../lib/supabase';

export function useAuditLog() {
  const { user } = useAuth();

  const logUpdate = useCallback(
    async (
      tableName: string,
      recordId: string,
      oldValues: Record<string, any>,
      newValues: Record<string, any>,
      createdAt: string
    ) => {
      if (!user) return;

      const requiresApproval = shouldRequireApproval(tableName, 'UPDATE', createdAt);

      await createAuditLog(
        {
          table_name: tableName,
          record_id: recordId,
          action: 'UPDATE',
          old_values: oldValues,
          new_values: newValues,
          requires_approval: requiresApproval,
        },
        user.id
      );

      return requiresApproval;
    },
    [user]
  );

  const logDelete = useCallback(
    async (tableName: string, recordId: string, oldValues: Record<string, any>, createdAt: string) => {
      if (!user) return;

      const requiresApproval = shouldRequireApproval(tableName, 'DELETE', createdAt);

      await createAuditLog(
        {
          table_name: tableName,
          record_id: recordId,
          action: 'DELETE',
          old_values: oldValues,
          requires_approval: requiresApproval,
        },
        user.id
      );

      return requiresApproval;
    },
    [user]
  );

  const logCreate = useCallback(
    async (tableName: string, recordId: string, newValues: Record<string, any>) => {
      if (!user) return;

      await createAuditLog(
        {
          table_name: tableName,
          record_id: recordId,
          action: 'CREATE',
          new_values: newValues,
          requires_approval: false,
        },
        user.id
      );
    },
    [user]
  );

  return { logUpdate, logDelete, logCreate };
}

