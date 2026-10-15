import { apiFetch } from './api'

/*
 * Typed accessors for the HR API.
 *
 * Every page reads through here rather than holding its own copy of the
 * data, so a value has one shape and one source. Amounts arrive as integer
 * shillings in *_minor fields and are formatted at the point of display.
 */

export type Employee = {
  id: number
  employee_code: string
  name: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  employment_type: string
  employment_type_label: string
  status: string
  department: string | null
  department_id: number | null
  role: string | null
  role_level: string | null
  job_role_id: number | null
  hire_date: string | null
  start_date: string | null
  has_login: boolean
  last_login_at?: string | null
  avatar_url: string | null
  initials: string
  date_of_birth?: string | null
  tin?: string | null
  nida_number?: string | null
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  base_salary_minor?: number
  currency?: string
  documents_count?: number
  bank_account?: {
    bank_name: string | null
    account_name: string | null
    account_number: string | null
  } | null
}

export type JobRole = { id: number; title: string; level: string }

export type Department = {
  id: number
  name: string
  description: string | null
  is_active: boolean
  leads: { employee_id: number; name: string | null; is_primary: boolean }[]
  roles: JobRole[]
  headcount: number
  fully_assigned: number
}

export type LeaveRequest = {
  id: number
  reference: string
  employee: { id: number; name: string; initials: string } | null
  leave_type: string | null
  leave_type_id: number
  start_date: string | null
  end_date: string | null
  days: number
  reason: string | null
  coverage: { id: number; name: string } | null
  approver: string | null
  status: string
  reviewer_note: string | null
  decided_at: string | null
  created_at: string | null
}

export type LeaveBalance = {
  leave_type: string
  leave_type_id: number
  entitled_days: number
  entitlement_configured: boolean
  used_days: number
  booked_days: number
  remaining_days: number
}

export type Payslip = {
  id: number
  reference: string
  employee: { id: number; name: string; initials: string } | null
  period: string
  period_year: number
  period_month: number
  basic_minor: number
  overtime_minor: number
  bonus_minor: number
  allowance_minor: number
  tax_minor: number
  pension_minor: number
  other_deduction_minor: number
  gross_minor: number
  total_deductions_minor: number
  net_minor: number
  currency: string
  payment_method: string
  status: string
  paid_at: string | null
}

export type PayrollRun = {
  id: number
  period: string
  period_label?: string
  status: string
  gross_total_minor: number
  net_total_minor: number
  payslip_count: number
  paid_at: string | null
}

export type Contract = {
  id: number
  reference: string
  employee: { id: number; name: string } | null
  kind: string | null
  start_date: string | null
  end_date: string | null
  open_ended: boolean
  days_left: number | null
  base_salary_minor: number
  currency: string
  description: string | null
  termination_terms: string | null
  status: string
  signed_at: string | null
}

export type MoneyRequest = {
  id: number
  reference: string
  receipt_number: string | null
  employee: { id: number; name: string; initials: string } | null
  kind: string | null
  amount_minor: number
  currency: string
  reason: string | null
  needed_by: string | null
  method: string
  status: string
  decided_by: string | null
  decided_on: string | null
  note: string | null
  paid_at: string | null
  created_at: string | null
}

export type HrDocument = {
  id: number
  reference: string
  name: string
  employee: { id: number; full_name: string } | null
  category: string | null
  category_slug: string | null
  category_id: number | null
  contract_id: number | null
  type: string
  mime_type: string | null
  size_bytes: number
  size: string
  status: string
  expires_at: string | null
  created_at: string | null
  url: string
  preview_url: string
}

export type Notification = {
  id: string
  kind: string | null
  title: string | null
  detail: string | null
  read: boolean
  read_at: string | null
  subject_type: string | null
  subject_id: number | null
  created_at: string | null
}

export type Dashboard = {
  generated_at: string
  year: number
  headcount: {
    active: number
    on_leave: number
    suspended: number
    terminated_this_year: number
    joined_this_year: number
  }
  departments: number
  leave: {
    pending: number
    approved_this_month: number
    declined_this_month: number
    on_leave_today: number
  }
  payroll: {
    latest_run: PayrollRun | null
    year_net_minor: number
    year_gross_minor: number
  }
  money_requests: {
    pending: number
    pending_amount_minor: number
    paid_this_year_minor: number
  }
  contracts: { active: number; renewal_due: number; pending_signature: number }
  documents: { total: number; pending_review: number; expiring_soon: number }
}

export type MonthlyReport = {
  year: number
  rows: {
    month: string
    month_index: number // 0-based: 0 = January, 11 = December
    payroll_net: number
    payroll_gross: number
    money_requested: number
    leave_approved: number
    leave_declined: number
    contracts: number
    headcount: number
  }[]
  totals: Record<string, number>
}

export type Registration = {
  profile: Employee & { salary_managed_by: string }
  bank_accounts: {
    id: number
    type: string
    bank_name: string | null
    account_number: string | null
    account_name: string | null
    is_primary: boolean
    is_verified: boolean
  }[]
  documents: {
    id: number
    name: string
    category: string | null
    type: string
    mime_type: string | null
    status: string
    created_at: string | null
    url: string
  }[]
  contract: {
    id: number
    reference: string
    status: string
    start_date: string | null
    end_date: string | null
    kind: string | null
  } | null
}

export type Paged<T> = {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    counts?: Record<string, number>
    renewals_upcoming?: number
    net_total_minor?: number
    limit_minor?: number
  }
}

export type LeaveTypeRef = {
  id: number
  name: string
  annual_allowance_days: number | null
  requires_document: boolean
}

export type MoneyTypeRef = {
  id: number
  name: string
  requires_receipt: boolean
}

export type DocCategory = {
  id: number
  name: string
  slug: string
}

export type MeDashboard = {
  generated_at: string
  year: number
  payslips: {
    count: number
    latest_net_minor: number
    year_net_minor: number
    series: { month: string; net_minor: number }[]
  }
  leave: { pending: number; approved_days: number; requests_count: number }
  money_requests: { requested_minor: number; pending_minor: number; count: number }
  contract: {
    reference: string
    status: string
    start_date: string | null
    end_date: string | null
  } | null
}

const qs = (params: Record<string, string | number | boolean | undefined | null>): string => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const out = search.toString()
  return out ? `?${out}` : ''
}

export const employees = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<Paged<Employee>>(`/api/employees${qs({ per_page: 100, ...params })}`),
  get: (id: number) => apiFetch<{ employee: Employee }>(`/api/employees/${id}`),
  create: (body: unknown) => apiFetch<{ message: string; login_created: boolean; employee: Employee }>('/api/employees', { method: 'POST', body }),
  update: (id: number, body: unknown) =>
    apiFetch<{ message: string; password_reset: boolean; employee: Employee }>(`/api/employees/${id}`, { method: 'PATCH', body }),
  terminate: (id: number) => apiFetch<{ message: string }>(`/api/employees/${id}`, { method: 'DELETE' }),
  avatar: (id: number, form: FormData) =>
    apiFetch<{ message: string; url: string }>(`/api/employees/${id}/avatar`, { method: 'POST', form }),
  dashboard: () => apiFetch<Dashboard>('/api/dashboard'),
  meDashboard: () => apiFetch<MeDashboard>('/api/me/dashboard'),
}

export const departments = {
  list: () => apiFetch<{ data: Department[] }>('/api/departments'),
  detail: (id: number) =>
    apiFetch<{
      department: { id: number; name: string; description: string | null }
      roles: JobRole[]
      employees: {
        id: number
        name: string
        assigned_role_id: number | null
        assigned_role: string | null
        level: string | null
        status: string
      }[]
    }>(`/api/departments/${id}`),
  create: (body: unknown) => apiFetch<unknown>('/api/departments', { method: 'POST', body }),
  addRoles: (id: number, roles: string[]) =>
    apiFetch<{ message: string; added: JobRole[] }>(`/api/departments/${id}/roles`, { method: 'POST', body: { roles } }),
  updateRole: (id: number, roleId: number, body: unknown) =>
    apiFetch<unknown>(`/api/departments/${id}/roles/${roleId}`, { method: 'PATCH', body }),
  deleteRole: (id: number, roleId: number) =>
    apiFetch<unknown>(`/api/departments/${id}/roles/${roleId}`, { method: 'DELETE' }),
  remove: (id: number) => apiFetch<{ message: string }>(`/api/departments/${id}`, { method: 'DELETE' }),
}

export const leave = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<Paged<LeaveRequest>>(`/api/leave-requests${qs({ status: 'all', per_page: 100, ...params })}`),
  submit: (body: unknown) => apiFetch<{ message: string; leave_request: LeaveRequest }>('/api/leave-requests', { method: 'POST', body }),
  approve: (id: number, note?: string) =>
    apiFetch<unknown>(`/api/leave-requests/${id}/approve`, { method: 'POST', body: { note } }),
  decline: (id: number, note?: string) =>
    apiFetch<unknown>(`/api/leave-requests/${id}/decline`, { method: 'POST', body: { note } }),
  withdraw: (id: number) => apiFetch<unknown>(`/api/leave-requests/${id}`, { method: 'DELETE' }),
  balances: () => apiFetch<{ year: number; balances: LeaveBalance[] }>('/api/me/leave-balances'),
  balancesFor: (employeeId?: number, year?: number) =>
    apiFetch<{ year: number; balances: LeaveBalance[] }>(`/api/leave-balances${qs({ employee_id: employeeId, year })}`),
  types: () => apiFetch<{ data: LeaveTypeRef[] }>('/api/leave-types'),
}

export const payroll = {
  runs: (params: Record<string, number | undefined> = {}) => apiFetch<{ data: PayrollRun[] }>(`/api/payroll/runs${qs(params)}`),
  run: (id: number) => apiFetch<{ run: PayrollRun; payslips: Payslip[] }>(`/api/payroll/runs/${id}`),
  createRun: (body: unknown) => apiFetch<{ message: string; run: PayrollRun }>('/api/payroll/runs', { method: 'POST', body }),
  approve: (id: number) => apiFetch<unknown>(`/api/payroll/runs/${id}/approve`, { method: 'POST' }),
  pay: (id: number) => apiFetch<unknown>(`/api/payroll/runs/${id}/pay`, { method: 'POST' }),
  remove: (id: number) => apiFetch<{ message: string }>(`/api/payroll/runs/${id}`, { method: 'DELETE' }),
  payslips: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<Paged<Payslip>>(`/api/payslips${qs({ per_page: 100, ...params })}`),
}

export const contracts = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<Paged<Contract>>(`/api/contracts${qs({ status: 'all', per_page: 100, ...params })}`),
  create: (body: unknown) => apiFetch<{ message: string; contract: Contract }>('/api/contracts', { method: 'POST', body }),
  update: (id: number, body: unknown) =>
    apiFetch<{ message: string; contract: Contract }>(`/api/contracts/${id}`, { method: 'PATCH', body }),
  remove: (id: number) => apiFetch<{ message: string }>(`/api/contracts/${id}`, { method: 'DELETE' }),
  send: (id: number) => apiFetch<unknown>(`/api/contracts/${id}/send-for-signature`, { method: 'POST' }),
  respond: (id: number, decision: 'accepted' | 'declined') =>
    apiFetch<unknown>(`/api/contracts/${id}/respond`, { method: 'POST', body: { decision } }),
  types: () => apiFetch<{ data: { id: number; name: string }[] }>('/api/contract-types'),
}

export const money = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<Paged<MoneyRequest>>(`/api/money-requests${qs({ status: 'all', per_page: 100, ...params })}`),
  submit: (body: unknown) => apiFetch<{ message: string; money_request: MoneyRequest }>('/api/money-requests', { method: 'POST', body }),
  approve: (id: number, note?: string) =>
    apiFetch<unknown>(`/api/money-requests/${id}/approve`, { method: 'POST', body: { note } }),
  decline: (id: number, note?: string) =>
    apiFetch<unknown>(`/api/money-requests/${id}/decline`, { method: 'POST', body: { note } }),
  markPaid: (id: number) => apiFetch<unknown>(`/api/money-requests/${id}/mark-paid`, { method: 'POST' }),
  remove: (id: number) => apiFetch<{ message: string }>(`/api/money-requests/${id}`, { method: 'DELETE' }),
  types: () => apiFetch<{ data: MoneyTypeRef[] }>('/api/money-request-types'),
}

export const documents = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<Paged<HrDocument>>(`/api/documents${qs({ per_page: 100, ...params })}`),
  upload: (form: FormData) => apiFetch<{ message: string; document: HrDocument }>('/api/documents', { method: 'POST', form }),
  replace: (id: number, form: FormData) =>
    apiFetch<{ message: string; document: HrDocument }>(`/api/documents/${id}/replace`, { method: 'POST', form }),
  remove: (id: number) => apiFetch<{ message: string }>(`/api/documents/${id}`, { method: 'DELETE' }),
  categories: () => apiFetch<{ data: DocCategory[] }>('/api/document-categories'),
}

export const notifications = {
  list: (params: Record<string, string | number | boolean | undefined> = {}) =>
    apiFetch<{ data: Notification[]; meta: { unread_count: number } }>(`/api/notifications${qs(params)}`),
  markRead: (id: string) => apiFetch<unknown>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiFetch<{ message: string }>('/api/notifications/read-all', { method: 'POST' }),
  remove: (id: string) => apiFetch<unknown>(`/api/notifications/${id}`, { method: 'DELETE' }),
}

export const reports = {
  monthly: (year?: number) => apiFetch<MonthlyReport>(`/api/reports/monthly${qs({ year })}`),
}

export const registration = {
  get: () => apiFetch<Registration>('/api/me/registration'),
}

/* Formatting helpers: the API returns whole shillings, never pre-formatted
   strings, so every displayed amount goes through one of these. */

export function formatMoney(minor: number | null | undefined, currency = 'TSh'): string {
  const value = Number(minor ?? 0)
  return `${currency} ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatMonth(period: string | null | undefined): string {
  if (!period) return '—'
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  if (Number.isNaN(date.getTime())) return period
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}