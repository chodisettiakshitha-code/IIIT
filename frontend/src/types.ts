export interface CustomerProfile {
  id: number;
  customer_ref: string;
  full_name: string;
  email: string;
  phone: string;
  segment: string;
  employment_status: string;
  employer: string;
  monthly_income: number;
  credit_score: number;
  risk_tier: string;
  kyc_status: string;
  preferred_language: string;
  created_at: string;
}

export interface FinancialSummary {
  total_card_balance: number;
  total_loan_balance: number;
  total_debt_exposure: number;
  total_deposits: number;
  net_bank_position: number;
  total_overdue: number;
  max_dpd: number;
  cards_count: number;
  loans_count: number;
  deposits_count: number;
}

export interface CardAccount {
  id: number;
  account_number_masked: string;
  card_type: string;
  credit_limit: number;
  current_balance: number;
  min_due: number;
  due_date: string;
  dpd: number;
  status: string;
}

export interface LoanAccount {
  id: number;
  loan_ref: string;
  loan_type: string;
  principal_amount: number;
  outstanding_balance: number;
  emi_amount: number;
  tenure_months: number;
  next_due_date: string;
  dpd: number;
  status: string;
}

export interface DepositAccount {
  id: number;
  account_type: string;
  account_number_masked: string;
  balance: number;
  currency: string;
  last_activity_date: string;
  status: string;
}

export interface CollectionsCase {
  id: number;
  case_ref: string;
  case_status: string;
  stage: string;
  dpd_bucket: string;
  total_overdue: number;
  priority: string;
  assigned_agent: string;
  strategy_segment: string;
  opened_at: string;
  last_review_date: string;
}

export interface PromiseToPay {
  id: number;
  amount_promised: number;
  promise_date: string;
  status: string;
  channel_agreed: string;
  broken_reason?: string;
  recorded_at: string;
}

export interface ContactRecord {
  id: number;
  channel: string;
  direction: string;
  outcome: string;
  duration_seconds: number;
  agent_id: string;
  notes_summary: string;
  timestamp: string;
}

export interface AgentNote {
  id: number;
  agent_name: string;
  category: string;
  note_text: string;
  sentiment: string;
  created_at: string;
}

export interface CallTranscript {
  id: number;
  call_ref: string;
  call_date: string;
  duration_seconds: number;
  agent_name: string;
  transcript_text: string;
  summary: string;
  customer_sentiment: string;
  call_reason: string;
  key_commitments: string;
}

export interface Customer360Data {
  profile: CustomerProfile;
  financial_summary: FinancialSummary;
  cards: CardAccount[];
  loans: LoanAccount[];
  deposits: DepositAccount[];
  cases: CollectionsCase[];
  promises: PromiseToPay[];
  contacts: ContactRecord[];
  notes: AgentNote[];
  transcripts: CallTranscript[];
  external_score?: {
    bureau_score: number;
    bureau_risk_grade: string;
    telco_stability_score: number;
    spending_index: number;
    estimated_capacity_to_pay: string;
    updated_at: string;
  };
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  description: string;
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  icon: string;
  badge: string;
}

export interface WhatChangedData {
  customer_id: number;
  previous_situation: string;
  current_situation: string;
  key_changes: Array<{
    metric: string;
    previous: string;
    current: string;
    severity: string;
    change: string;
  }>;
  ai_explanation: string;
  comparison_window: string;
  evaluated_at: string;
}

export interface CustomerStoryData {
  customer_id: number;
  concise_story: string;
  facts: Array<{ label: string; detail: string }>;
  ai_interpretations: Array<{ label: string; assessment: string; rationale: string }>;
  root_cause_diagnosis: string;
  historical_channel_effectiveness: string;
  generated_at: string;
}

export interface NextBestActionData {
  recommendation_id: string;
  customer_id: number;
  recommended_action: string;
  recommended_channel: string;
  suggested_timing: string;
  confidence_score: number;
  confidence_tier: string;
  primary_reason: string;
  supporting_customer_data: Array<{ metric: string; value: string }>;
  why_this_recommendation: {
    data_signals: string[];
    counter_actions_evaluated: Array<{ action: string; rejected_reason: string }>;
    expected_outcome: string;
  };
  status: string;
  action_options: string[];
}

export interface DashboardStats {
  summary: {
    total_customers: number;
    active_collections_cases: number;
    total_overdue: number;
    broken_promises: number;
    high_priority_cases: number;
    pending_human_reviews: number;
    recent_interactions_count: number;
  };
  charts: {
    dpd_buckets: Array<{ bucket: string; count: number; total_overdue: number }>;
    channel_effectiveness: Array<{ channel: string; total: number; successful: number; success_rate: number }>;
  };
  recent_cases: Array<{
    customer_id: number;
    customer_ref: string;
    customer_name: string;
    case_ref: string;
    dpd_bucket: string;
    total_overdue: number;
    priority: string;
    status: string;
    agent: string;
  }>;
  is_synthetic: boolean;
  data_notice: string;
}

export interface AuditLog {
  id: number;
  customer_id: number;
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
  created_at: string;
}

export interface AssistantResponse {
  answer: string;
  query_type: string;
  sql_query?: string | null;
  data_sources: string[];
  tabular_data?: any[] | null;
  notes_retrieved?: Array<{ source: string; text: string; date?: string }>;
  confidence: number;
}
