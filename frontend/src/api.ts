import { 
  DashboardStats, 
  Customer360Data, 
  TimelineEvent, 
  WhatChangedData, 
  CustomerStoryData, 
  NextBestActionData, 
  AuditLog, 
  AssistantResponse 
} from './types';

const API_BASE = '/api';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to load dashboard statistics');
  return res.json();
}

export async function searchCustomers(query?: string): Promise<{ count: number; customers: any[] }> {
  const url = query ? `${API_BASE}/customers?q=${encodeURIComponent(query)}` : `${API_BASE}/customers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to search customers');
  return res.json();
}

export async function fetchCustomer360(customerId: number): Promise<Customer360Data> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/360`);
  if (!res.ok) throw new Error('Failed to load Customer 360 profile');
  return res.json();
}

export async function fetchCustomerTimeline(customerId: number): Promise<{ customer_id: number; timeline: TimelineEvent[] }> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/timeline`);
  if (!res.ok) throw new Error('Failed to load timeline');
  return res.json();
}

export async function fetchWhatChanged(customerId: number): Promise<WhatChangedData> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/what-changed`);
  if (!res.ok) throw new Error('Failed to load What Changed analysis');
  return res.json();
}

export async function fetchCustomerStory(customerId: number): Promise<CustomerStoryData> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/story`);
  if (!res.ok) throw new Error('Failed to load customer story');
  return res.json();
}

export async function fetchNextBestAction(customerId: number): Promise<NextBestActionData> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/next-best-action`);
  if (!res.ok) throw new Error('Failed to load Next Best Action');
  return res.json();
}

export async function submitHumanDecision(customerId: number, decision: {
  recommendation_id: string;
  agent_id: string;
  agent_name: string;
  role: string;
  action_taken: string;
  recommended_action: string;
  final_action: string;
  recommended_channel: string;
  final_channel: string;
  recommended_timing?: string;
  final_timing?: string;
  rationale?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision),
  });
  if (!res.ok) throw new Error('Failed to record human decision');
  return res.json();
}

export async function queryAssistant(question: string, customerId?: number): Promise<AssistantResponse> {
  const res = await fetch(`${API_BASE}/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, customer_id: customerId }),
  });
  if (!res.ok) throw new Error('Assistant query failed');
  return res.json();
}

export async function fetchDataQuality(): Promise<any> {
  const res = await fetch(`${API_BASE}/data-quality`);
  if (!res.ok) throw new Error('Failed to fetch data quality metrics');
  return res.json();
}

export async function fetchAuditTrail(customerId?: number): Promise<{ audit_logs: AuditLog[] }> {
  const url = customerId ? `${API_BASE}/governance/audit-trail?customer_id=${customerId}` : `${API_BASE}/governance/audit-trail`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load audit trail');
  return res.json();
}

export async function fetchComplianceInfo(): Promise<any> {
  const res = await fetch(`${API_BASE}/governance/compliance-info`);
  if (!res.ok) throw new Error('Failed to load compliance info');
  return res.json();
}
