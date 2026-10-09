'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  contracts as contractsApi,
  departments as departmentsApi,
  documents as documentsApi,
  employees as employeesApi,
  leave as leaveApi,
  money as moneyApi,
  notifications as notificationsApi,
  payroll as payrollApi,
  reports as reportsApi,
  registration as registrationApi,
  type Contract,
  type Dashboard,
  type Department,
  type HrDocument,
  type LeaveBalance,
  type LeaveRequest,
  type MoneyRequest,
  type MonthlyReport,
  type Notification,
  type Payslip,
  type PayrollRun,
  type Registration,
} from './data'
import type { AuthUser } from './api'

/*
 * One place that owns every server-backed collection.
 *
 * The pages previously held module-level arrays and local useState, so data
 * did not survive a refresh and two screens could disagree. Everything now
 * loads here and is shared, which also means a write refreshes every screen
 * that shows the same record.
 *
 * Each collection carries its own status so one failing endpoint leaves the
 * rest of the workspace usable, instead of blanking the whole app.
 */

type Status = 'idle' | 'loading' | 'ready' | 'error'

type Slice<T> = {
  items: T[]
  status: Status
  error: string | null
}

const emptySlice = <T,>(): Slice<T> => ({ items: [], status: 'idle', error: null })

type HrData = {
  user: AuthUser | null
  isHr: boolean
  employeeId: number | null

  employees: Slice<Awaited<ReturnType<typeof employeesApi.list>>['data'][number]>
  departments: Slice<Department>
  leaveRequests: Slice<LeaveRequest>
  leaveBalances: Slice<LeaveBalance>
  payslips: Slice<Payslip>
  payrollRuns: Slice<PayrollRun>
  contracts: Slice<Contract>
  moneyRequests: Slice<MoneyRequest>
  documents: Slice<HrDocument>
  notifications: Slice<Notification>
  unreadCount: number
  dashboard: Dashboard | null
  monthlyReport: MonthlyReport | null
  registration: Registration | null

  /** True until every collection has settled at least once. */
  loading: boolean
  /** First error across all collections, for a single banner. */
  error: string | null
  reload: () => Promise<void>
  reloadOne: (key: CollectionKey) => Promise<void>
}

export type CollectionKey =
  | 'employees'
  | 'departments'
  | 'leaveRequests'
  | 'leaveBalances'
  | 'payslips'
  | 'payrollRuns'
  | 'contracts'
  | 'moneyRequests'
  | 'documents'
  | 'notifications'
  | 'dashboard'
  | 'monthlyReport'
  | 'registration'

const HrDataContext = createContext<HrData | null>(null)

const message = (cause: unknown): string =>
  cause instanceof Error ? cause.message : 'Something went wrong loading data.'

export function HrDataProvider({ user, children }: { user: AuthUser | null; children: ReactNode }) {
  const [slices, setSlices] = useState<Record<string, Slice<unknown>>>(() => ({
    employees: emptySlice(),
    departments: emptySlice(),
    leaveRequests: emptySlice(),
    leaveBalances: emptySlice(),
    payslips: emptySlice(),
    payrollRuns: emptySlice(),
    contracts: emptySlice(),
    moneyRequests: emptySlice(),
    documents: emptySlice(),
    notifications: emptySlice(),
    monthlyReport: emptySlice(),
    registration: emptySlice(),
  }))

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const isHr = user?.is_hr ?? false
  const employeeId = user?.employee?.id ?? null

  /** Runs one loader, recording status for that slice only. */
  const run = useCallback(async <T,>(key: string, loader: () => Promise<T>, apply?: (value: T) => void) => {
    setSlices((current) => ({ ...current, [key]: { ...(current[key] ?? emptySlice()), status: 'loading', error: null } }))

    try {
      const value = await loader()

      if (apply) {
        apply(value)
      } else {
        setSlices((current) => ({ ...current, [key]: { items: value as unknown[], status: 'ready', error: null } }))
      }
    } catch (cause) {
      setSlices((current) => ({
        ...current,
        [key]: { items: current[key]?.items ?? [], status: 'error', error: message(cause) },
      }))
    }
  }, [])

  const loadAll = useCallback(async () => {
    if (!user) return

    // HR-scoped endpoints would return 403 for an employee, so they are only
    // requested on that side of the portal.
    if (user.is_hr) {
      await Promise.all([
        run('employees', async () => (await employeesApi.list()).data),
        run('departments', async () => (await departmentsApi.list()).data),
        run('payrollRuns', async () => (await payrollApi.runs()).data),
        run('monthlyReport', async () => reportsApi.monthly(), (value) => setMonthlyReport(value)),
        run('dashboard', async () => employeesApi.dashboard(), (value) => setDashboard(value)),
      ])
    }

    await Promise.all([
      run('payslips', async () => (await payrollApi.payslips()).data),
      run('leaveRequests', async () => (await leaveApi.list()).data),
      run('contracts', async () => (await contractsApi.list()).data),
      run('moneyRequests', async () => (await moneyApi.list()).data),
      run('documents', async () => (await documentsApi.list()).data),
      run('notifications', async () => notificationsApi.list().then((r) => r.data), (value) =>
        setUnreadCount((value as unknown as { meta: { unread_count: number } }).meta.unread_count),
      ),
    ])

    if (!user.is_hr) {
      await Promise.all([
        run('leaveBalances', async () => (await leaveApi.balances()).balances),
        run('registration', async () => registrationApi.get(), (value) => setRegistration(value)),
      ])
    }
  }, [user, run])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const reloadOne = useCallback(
    async (key: CollectionKey) => {
      switch (key) {
        case 'employees':
          return run('employees', async () => (await employeesApi.list()).data)
        case 'departments':
          return run('departments', async () => (await departmentsApi.list()).data)
        case 'leaveRequests':
          return run('leaveRequests', async () => (await leaveApi.list()).data)
        case 'leaveBalances':
          return run('leaveBalances', async () => (await leaveApi.balances()).balances)
        case 'payslips':
          return run('payslips', async () => (await payrollApi.payslips()).data)
        case 'payrollRuns':
          return run('payrollRuns', async () => (await payrollApi.runs()).data)
        case 'contracts':
          return run('contracts', async () => (await contractsApi.list()).data)
        case 'moneyRequests':
          return run('moneyRequests', async () => (await moneyApi.list()).data)
        case 'documents':
          return run('documents', async () => (await documentsApi.list()).data)
        case 'notifications':
          return run('notifications', async () => (await notificationsApi.list()).data, (value) =>
            setUnreadCount((value as unknown as { meta: { unread_count: number } }).meta.unread_count),
          )
        case 'dashboard':
          return run('dashboard', async () => employeesApi.dashboard(), (value) => setDashboard(value))
        case 'monthlyReport':
          return run('monthlyReport', async () => reportsApi.monthly(), (value) => setMonthlyReport(value))
        case 'registration':
          return run('registration', async () => registrationApi.get(), (value) => setRegistration(value))
      }
    },
    [run],
  )

  const value = useMemo<HrData>(() => {
    const slice = <T,>(key: string) => slices[key] as Slice<T>

    const loading = Object.values(slices).some((s) => s.status === 'loading')
    const error = Object.values(slices).find((s) => s.error)?.error ?? null

    return {
      user,
      isHr,
      employeeId,
      employees: slice('employees'),
      departments: slice('departments'),
      leaveRequests: slice('leaveRequests'),
      leaveBalances: slice('leaveBalances'),
      payslips: slice('payslips'),
      payrollRuns: slice('payrollRuns'),
      contracts: slice('contracts'),
      moneyRequests: slice('moneyRequests'),
      documents: slice('documents'),
      notifications: slice('notifications'),
      unreadCount,
      dashboard,
      monthlyReport,
      registration,
      loading,
      error,
      reload: loadAll,
      reloadOne,
    }
  }, [slices, user, isHr, employeeId, unreadCount, dashboard, monthlyReport, registration, loadAll, reloadOne])

  return <HrDataContext.Provider value={value}>{children}</HrDataContext.Provider>
}

export function useHrData(): HrData {
  const context = useContext(HrDataContext)

  if (!context) {
    throw new Error('useHrData must be used inside HrDataProvider.')
  }

  return context
}

/**
 * Placeholder for a collection that has not arrived. Rendered instead of an
 * invented placeholder row, so an empty API response is never mistaken for
 * real data.
 */
export function EmptyState({ label, detail }: { label: string; detail?: string }) {
  return (
    <div className="leave-empty">
      <Sparkles />
      <p>{label}</p>
      {detail && <p style={{ opacity: 0.7 }}>{detail}</p>}
    </div>
  )
}

// Imported lazily to keep this module free of icon imports at the top.
import { Sparkles } from 'lucide-react'