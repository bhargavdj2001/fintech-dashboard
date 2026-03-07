/**
 * FinancialOS API client.
 * All functions call the FastAPI backend at NEXT_PUBLIC_API_URL.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Household {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  external_id: string | null;
  last_synced_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  is_income: boolean;
  parent_id: string | null;
}

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  default_share: number | null;
}

export interface Split {
  id: string;
  profile_id: string;
  share_amount: number;
  share_percent: number | null;
  paid_amount: number;
  profile: Profile | null;
}

export interface Transaction {
  id: string;
  household_id: string;
  account_id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  type: "income" | "expense" | "transfer";
  occurred_at: string;
  merchant: string | null;
  status: string | null;
  is_recurring_instance: boolean;
  category_id: string | null;
  created_by_profile_id: string | null;
  account: Account | null;
  category: Category | null;
  splits: Split[];
  created_at: string | null;
}

export interface PaginatedTransactions {
  total: number;
  limit: number;
  offset: number;
  items: Transaction[];
}

export interface Budget {
  id: string;
  household_id: string;
  name: string;
  category_id: string | null;
  amount: number;
  period_type: string;
  carry_over: boolean;
  start_date: string | null;
  created_at: string | null;
  category: Category | null;
  spent: number;
}

export interface InvestmentTransaction {
  id: string;
  txn_type: string;
  units: number | null;
  price_per_unit: number | null;
  fees: number | null;
  currency: string | null;
  occurred_at: string;
}

export interface Investment {
  id: string;
  household_id: string | null;
  name: string;
  instrument: string | null;
  account_id: string | null;
  created_at: string | null;
  account: Account | null;
  investment_transactions: InvestmentTransaction[];
}

export interface RecurringRule {
  id: string;
  household_id: string | null;
  freq: string | null;
  cron_expr: string | null;
  next_run_at: string | null;
  is_active: boolean;
  template_txn: Record<string, unknown> | null;
  created_at: string | null;
}

export interface DashboardSummary {
  total_balance: number;
  monthly_income: number;
  monthly_expense: number;
  net_cashflow: number;
  recent_transactions: Transaction[];
  category_breakdown: Record<string, number>;
}

export interface PeriodReport {
  total_income: number;
  total_expense: number;
  net_cashflow: number;
  transaction_count: number;
  category_summary: Record<string, number>;
  transactions: Transaction[];
}

export interface SplitSummary {
  your_share: number;
  partner_share: number;
  you_paid: number;
  partner_paid: number;
  net_balance: number;
}

// ---------------------------------------------------------------------------
// Households
// ---------------------------------------------------------------------------

let _cachedHouseholdId: string | null = null;

export function fetchHouseholds(): Promise<Household[]> {
  return apiFetch("/households");
}

export async function fetchHouseholdId(): Promise<string> {
  if (_cachedHouseholdId) return _cachedHouseholdId;
  const households = await fetchHouseholds();
  if (!households.length) throw new Error("No households found");
  _cachedHouseholdId = households[0].id;
  return _cachedHouseholdId;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch("/dashboard/summary");
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export function fetchTransactions(params?: {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  account_id?: string;
  category_id?: string;
}): Promise<PaginatedTransactions> {
  const qs = new URLSearchParams();
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  if (params?.account_id) qs.set("account_id", params.account_id);
  if (params?.category_id) qs.set("category_id", params.category_id);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/transactions${query}`);
}

export interface CreateTransactionPayload {
  household_id: string;
  account_id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  occurred_at: string;
  merchant?: string;
  description?: string;
  category_id?: string;
  status?: string;
  currency?: string;
}

export function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  return apiFetch("/transactions", { method: "POST", body: JSON.stringify(payload) });
}

export interface UpdateTransactionPayload {
  title?: string;
  description?: string;
  merchant?: string;
  category_id?: string;
  status?: string;
  amount?: number;
  type?: string;
  occurred_at?: string;
}

export function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
  return apiFetch(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteTransaction(id: string): Promise<void> {
  return apiFetch(`/transactions/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export function fetchAccounts(): Promise<Account[]> {
  return apiFetch("/accounts");
}

export function updateAccountBalance(id: string, balance: number): Promise<Account> {
  return apiFetch(`/accounts/${id}/balance`, { method: "PATCH", body: JSON.stringify({ balance }) });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export function fetchCategories(params?: { is_income?: boolean }): Promise<Category[]> {
  const qs = new URLSearchParams();
  if (params?.is_income !== undefined) qs.set("is_income", String(params.is_income));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/categories${query}`);
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

export function fetchBudgets(): Promise<Budget[]> {
  return apiFetch("/budgets");
}

export interface CreateBudgetPayload {
  household_id: string;
  name: string;
  amount: number;
  period_type: string;
  category_id?: string;
  carry_over?: boolean;
  start_date?: string;
}

export function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  return apiFetch("/budgets", { method: "POST", body: JSON.stringify(payload) });
}

export interface UpdateBudgetPayload {
  name?: string;
  amount?: number;
  period_type?: string;
  category_id?: string;
  carry_over?: boolean;
  start_date?: string;
}

export function updateBudget(id: string, payload: UpdateBudgetPayload): Promise<Budget> {
  return apiFetch(`/budgets/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteBudget(id: string): Promise<void> {
  return apiFetch(`/budgets/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Investments
// ---------------------------------------------------------------------------

export function fetchInvestments(): Promise<Investment[]> {
  return apiFetch("/investments");
}

// ---------------------------------------------------------------------------
// Recurring rules
// ---------------------------------------------------------------------------

export function fetchRecurringRules(): Promise<RecurringRule[]> {
  return apiFetch("/recurring");
}

export interface CreateRecurringPayload {
  household_id: string;
  freq: string;
  title: string;
  amount: number;
  type: string;
  account_id?: string;
  category_id?: string;
  next_run_at?: string;
  is_active?: boolean;
}

export function createRecurringRule(payload: CreateRecurringPayload): Promise<RecurringRule> {
  return apiFetch("/recurring", { method: "POST", body: JSON.stringify(payload) });
}

export function updateRecurringRule(id: string, payload: { is_active?: boolean; freq?: string }): Promise<RecurringRule> {
  return apiFetch(`/recurring/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteRecurringRule(id: string): Promise<void> {
  return apiFetch(`/recurring/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export function fetchSplitSummary(): Promise<SplitSummary> {
  return apiFetch("/analytics/splits");
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function fetchPeriodReport(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<PeriodReport> {
  const qs = new URLSearchParams();
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/reports/period${query}`);
}
