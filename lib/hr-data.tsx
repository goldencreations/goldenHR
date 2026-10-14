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
  type MeDashboard,
  type MoneyRequest,
  type MonthlyReport,
  type Notification,
  type Payslip,
  type PayrollRun,
  type Registration,
} from './data'
import type { AuthUser } from './api'
import { invalidateCache } from './api'

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
  employeeDashboard: MeDashboard | null
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
  | 'employeeDashboard'
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
  const [employeeDashboard, setEmployeeDashboard] = useState<MeDashboard | null>(null)
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

    // A fresh sign-in starts with a clean cache; every reload below then
    // repopulates it, so the rest of the session reads instant.
    invalidateCache()

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
      run('notifications', async () => notificationsApi.list(), (value) => {
        setSlices((current) => ({
          ...current,
          notifications: { items: value.data, status: 'ready' as const, error: null },
        }))
        setUnreadCount(value.meta.unread_count)
      }),
    ])

    if (!user.is_hr) {
      await Promise.all([
        run('leaveBalances', async () => (await leaveApi.balances()).balances),
        run('registration', async () => registrationApi.get(), (value) => setRegistration(value)),
        run('employeeDashboard', async () => employeesApi.meDashboard(), (value) => setEmployeeDashboard(value)),
      ])
    }
  }, [user, run])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const reloadOne = useCallback(
    async (key: CollectionKey) => {
      // Writes always reload fresh: drop this family's cached GETs first so
      // the fetch below hits the wire while every other family stays cached.
      switch (key) {
        case 'employees':
          invalidateCache('/api/employees')
          return run('employees', async () => (await employeesApi.list()).data)
        case 'departments':
          invalidateCache('/api/departments')
          return run('departments', async () => (await departmentsApi.list()).data)
        case 'leaveRequests':
          invalidateCache('/api/leave-requests')
          return run('leaveRequests', async () => (await leaveApi.list()).data)
        case 'leaveBalances':
          invalidateCache('/api/me/leave-balances')
          invalidateCache('/api/leave-balances')
          return run('leaveBalances', async () => (await leaveApi.balances()).balances)
        case 'payslips':
          invalidateCache('/api/payslips')
          invalidateCache('/api/me/payslips')
          return run('payslips', async () => (await payrollApi.payslips()).data)
        case 'payrollRuns':
          invalidateCache('/api/payroll/runs')
          return run('payrollRuns', async () => (await payrollApi.runs()).data)
        case 'contracts':
          invalidateCache('/api/contracts')
          return run('contracts', async () => (await contractsApi.list()).data)
        case 'moneyRequests':
          invalidateCache('/api/money-requests')
          return run('moneyRequests', async () => (await moneyApi.list()).data)
        case 'documents':
          invalidateCache('/api/documents')
          return run('documents', async () => (await documentsApi.list()).data)
        case 'notifications':
          invalidateCache('/api/notifications')
          return run('notifications', async () => notificationsApi.list(), (value) => {
            setSlices((current) => ({
              ...current,
              notifications: { items: value.data, status: 'ready' as const, error: null },
            }))
            setUnreadCount(value.meta.unread_count)
          })
        case 'dashboard':
          invalidateCache('/api/dashboard')
          return run('dashboard', async () => employeesApi.dashboard(), (value) => setDashboard(value))
        case 'employeeDashboard':
          invalidateCache('/api/me/dashboard')
          return run('employeeDashboard', async () => employeesApi.meDashboard(), (value) => setEmployeeDashboard(value))
        case 'monthlyReport':
          invalidateCache('/api/reports/monthly')
          return run('monthlyReport', async () => reportsApi.monthly(), (value) => setMonthlyReport(value))
        case 'registration':
          invalidateCache('/api/me/registration')
          return run('registration', async () => registrationApi.get(), (value) => setRegistration(value))
      }
    },
    [run],
  )

  /*
   * Freshness without websockets.
   *
   * A dedicated socket needs proxy support the shared host does not
   * expose, so liveness comes from three cheap mechanisms instead:
   *
   * - notifications (the feed of other people's actions) refresh every
   *   20 seconds while the tab is visible;
   * - the dashboard follows at 60 seconds;
   * - returning to the tab or window refetches both immediately, so
   *   anything that happened while you were away appears at once.
   *
   * Larger collections (employees, payslips, runs) stay on explicit
   * reload after your own writes: refetching megabytes of records on a
   * timer would cost more than it saves.
   */
  useEffect(() => {
    if (!user) return

    const tick = (keys: CollectionKey[]) => {
      // A hidden tab polling in the background wastes requests and can flip
      // the app back to a loading state when the user returns to it.
      if (document.visibilityState !== 'visible') return

      keys.forEach((key) => { void reloadOne(key) })
    }

    // Each portal polls only its own aggregates: asking for the other
    // side's dashboard is a guaranteed 401/403 and pure noise.
    const slowKeys: CollectionKey[] = user.is_hr ? ['dashboard'] : ['employeeDashboard']

    const fast = setInterval(() => tick(['notifications']), 20_000)
    const slow = setInterval(() => tick(slowKeys), 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick(['notifications', ...slowKeys])
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      clearInterval(fast)
      clearInterval(slow)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [user, reloadOne])

  // Unread count in the tab title, so new activity is visible without sound.
  useEffect(() => {
    if (typeof document === 'undefined') return

    document.title = unreadCount > 0
      ? `(${unreadCount}) GoldenHR — People, elevated.`
      : 'GoldenHR — People, elevated.'
  }, [unreadCount])

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
      employeeDashboard,
      monthlyReport,
      registration,
      loading,
      error,
      reload: loadAll,
      reloadOne,
    }
  }, [slices, user, isHr, employeeId, unreadCount, dashboard, employeeDashboard, monthlyReport, registration, loadAll, reloadOne])

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