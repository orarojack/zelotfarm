import { supabase } from './supabase';
import { AuditLog } from '../types';

export interface AuditAction {
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  requires_approval?: boolean;
}

export async function createAuditLog(
  auditAction: AuditAction,
  userId: string
): Promise<void> {
  try {
    const auditLog: Omit<AuditLog, 'id' | 'created_at'> = {
      table_name: auditAction.table_name,
      record_id: auditAction.record_id,
      action: auditAction.action,
      old_values: auditAction.old_values || null,
      new_values: auditAction.new_values || null,
      user_id: userId,
      requires_approval: auditAction.requires_approval || false,
      approved_by: null,
      approved_at: null,
    };

    const { error } = await supabase.from('audit_logs').insert([auditLog]);

    if (error) {
      console.error('Error creating audit log:', error);
      // Don't throw - audit logging shouldn't break the main operation
    }
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

export function shouldRequireApproval(
  tableName: string,
  action: 'UPDATE' | 'DELETE',
  createdAt: string
): boolean {
  // Check if record is older than 30 minutes
  const recordDate = new Date(createdAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - recordDate.getTime()) / (1000 * 60);

  // If older than 30 minutes, requires approval
  if (diffMinutes > 30) {
    return true;
  }

  return false;
}

export async function approveAuditLog(
  auditLogId: string,
  approvedBy: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .update({
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', auditLogId);

    if (error) throw error;
  } catch (error) {
    console.error('Error approving audit log:', error);
    throw error;
  }
}

export async function getPendingApprovals(): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('requires_approval', true)
      .is('approved_by', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }
}

