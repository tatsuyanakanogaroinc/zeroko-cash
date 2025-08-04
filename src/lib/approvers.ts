import { supabase } from './supabase';
import { ApproverSetting } from './types';

export async function getApprovers(): Promise<ApproverSetting[]> {
  const { data, error } = await supabase.from('approvers').select('*');
  if (error) throw error;
  return data as ApproverSetting[];
}

export async function addApprover(approver: Omit<ApproverSetting, 'id' | 'created_at'>): Promise<ApproverSetting> {
  const { data, error } = await supabase.from('approvers').insert([approver]).select().single();
  if (error) throw error;
  return data as ApproverSetting;
}

export async function updateApprover(id: string, approver: Partial<ApproverSetting>): Promise<ApproverSetting> {
  const { data, error } = await supabase.from('approvers').update(approver).eq('id', id).select().single();
  if (error) throw error;
  return data as ApproverSetting;
}

export async function deleteApprover(id: string): Promise<void> {
  const { error } = await supabase.from('approvers').delete().eq('id', id);
  if (error) throw error;
} 