'use client'

// Build 3: cache-busting rebuild so stale edge-cached chunks are abandoned.
import { useEffect, useId, useMemo, useState } from 'react'
import { API_BASE, ApiError, apiFetch, downloadFile, fetchCurrentUser, login, logout, type AuthUser } from '../lib/api'
import { HrDataProvider, useHrData, EmptyState } from '../lib/hr-data'
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
  type Department as ApiDepartment,
  type DocCategory,
  type Employee,
  type HrDocument,
  type JobRole,
  type LeaveBalance,
  type LeaveRequest as ApiLeaveRequest,
  type LeaveTypeRef,
  type MeDashboard,
  type MoneyRequest as ApiMoneyRequest,
  type MoneyTypeRef,
  type MonthlyReport,
  type Payslip,
  type PayrollRun,
  type Registration,
} from '../lib/data'
import { formatMonth } from '../lib/data'

const noticeKinds: NoticeKind[] = ['payroll', 'money', 'contract', 'role', 'department', 'employee', 'document', 'security', 'leave']

const noticeKindFor = (value: string | null): NoticeKind =>
  (noticeKinds.find((kind) => kind === value) ?? 'security')

function formatRelative(value: string | null): string {
  if (!value) return ''
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''
  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  FolderOpen,
  Grid2X2,
  Download,
  Eye,
  FileUp,
  Pencil,
  Trash2,
  Upload,
  UserPlus,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

type Portal = 'HR' | 'Employee'

/** Two-letter avatar initials from the signed-in account. */
function initialsOf(name?: string | null): string {
  if (!name) return 'GH'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'GH'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (first + last).toUpperCase() || 'GH'
}

/** Human label for the account's role, shown under the name. */
function roleLabelOf(user: AuthUser | null): string {
  if (!user) return ''
  if (user.role === 'hr_admin') return 'HR Administrator'
  if (user.role === 'hr_officer') return 'HR Officer'
  return user.employee?.job_role ?? 'Employee'
}

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
  section?: string
}

const hrNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Add employee', icon: Plus },
  { label: 'Employee management', icon: Users },
  { label: 'Department & role', icon: Building2 },
  { label: 'Leave approval', icon: ClipboardCheck },
  { label: 'Payroll', icon: WalletCards },
  { label: 'Contracts', icon: FileCheck2 },
  { label: 'Documents', icon: FolderOpen },
  { label: 'Reports', icon: Activity },
  { label: 'Money request', icon: CircleDollarSign },
  { label: 'Notifications', icon: Bell },
  { label: 'Settings', icon: Settings },
]

const employeeNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Payslip', icon: WalletCards },
  { label: 'Notifications', icon: Bell },
  { label: 'Settings', icon: Settings },
  { label: 'Contract', icon: FileCheck2 },
  { label: 'Registration info', icon: FileText },
  { label: 'Work progress', icon: Activity },
  { label: 'Leave request', icon: CalendarDays },
  { label: 'Money request', icon: CircleDollarSign },
]

function GoldMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  return <svg className={className} viewBox="470 40 610 610" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B88618" />
        <stop offset="45%" stopColor="#D4A62F" />
        <stop offset="100%" stopColor="#B88618" />
      </linearGradient>
    </defs>
    <g stroke={`url(#${id})`} strokeWidth="26" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M 768 55 L 1000 210 L 1000 480 L 768 635 L 548 480 L 548 210 Z" />
      <path d="M 642 138 L 642 330 L 685 373" />
      <path d="M 570 225 L 570 425 L 700 515 L 845 515 L 845 275 L 715 275 L 715 405 L 805 405 L 805 330" />
      <path d="M 805 330 L 805 255 L 705 255 L 705 385 L 825 385 L 825 220" />
      <path d="M 850 180 L 900 225 L 850 275" />
      <path d="M 870 260 L 915 300 L 915 445" />
      <path d="M 845 515 L 915 470 L 915 300" />
    </g>
  </svg>
}

function SideNav({ portal, active, onChange, collapsed, onToggle, unread, user }: { portal: Portal; active: string; onChange: (item: string) => void; collapsed: boolean; onToggle: () => void; unread: number; user: AuthUser | null }) {
  const nav = portal === 'HR' ? hrNav : employeeNav
  return <aside className={`side-nav ${collapsed ? 'collapsed' : ''}`}>
    <div className="brand-wrap">
      <div className="brand-mark"><GoldMark /></div>
      {!collapsed && <div><div className="brand-name">GOLDEN<span>HR</span></div><small>People, elevated.</small></div>}
      <button className="icon-button nav-toggle" onClick={onToggle} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{collapsed ? <Menu /> : <PanelLeftClose />}</button>
    </div>
    {!collapsed && <div className="portal-label">{portal} PORTAL</div>}
    <nav className="nav-list" aria-label={`${portal} navigation`}>
      {nav.map((item) => { const Icon = item.icon; return <button key={item.label} className={`nav-item ${active === item.label ? 'active' : ''}`} onClick={() => onChange(item.label)} title={collapsed ? item.label : undefined}><Icon />{!collapsed && <span>{item.label}</span>}{!collapsed && item.label === 'Notifications' && unread > 0 && <b className="nav-badge">{unread}</b>}</button> })}
    </nav>
    {!collapsed && <div className="side-footer"><div className="upgrade-card"><ShieldCheck /><div><strong>People-first security</strong><p>Your workspace is protected.</p></div></div><div className="profile-mini"><div className="avatar avatar-sand">{initialsOf(user?.name)}</div><div><strong>{user?.name ?? 'Guest'}</strong><span>{roleLabelOf(user)}</span></div><ChevronDown /></div></div>}
  </aside>
}

const TONES = ['saffron', 'olive', 'plum', 'clay'] as const

/** Stable avatar tone from any numeric id, so lists look consistent. */
function toneFor(id: number | string): string {
  const n = typeof id === 'number' ? id : [...String(id)].reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return TONES[Math.abs(n) % TONES.length]
}

/** Two-letter initials from any display name. */
function initialsFor(name?: string | null): string {
  if (!name) return 'GH'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'GH'
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase() || 'GH'
}

/** Human message from any API failure, for banners and form errors. */
function apiMessage(cause: unknown): string {
  if (cause instanceof ApiError) {
    const fields = cause.fieldErrors()
    if (fields.length > 0) return fields.join(' ')
    return cause.message
  }
  return cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/** Upload guard: rejects oversized files locally with a clear message. */
async function uploadDocument(form: FormData) {
  const file = form.get('file')
  if (file instanceof File && file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError('That file is larger than the 10 MB upload limit. Compress it or choose a smaller file.', 413)
  }
  return documentsApi.upload(form)
}

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'part_time', label: 'Part-time' },
] as const

const ROLE_LEVELS = ['lead', 'senior', 'mid', 'junior', 'intern'] as const

function roleLevelLabel(level?: string | null): string {
  if (!level) return '—'
  const map: Record<string, string> = { lead: 'Lead', senior: 'Senior', mid: 'Mid level', junior: 'Junior', intern: 'Intern' }
  return map[level] ?? level
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) { return <div className={`field ${full ? 'full' : ''}`}><label>{label}</label>{children}</div> }

type ProfileTab = 'registration' | 'contract' | 'leave' | 'payslip' | 'documents'

const profileTabs: { key: ProfileTab; label: string; icon: typeof Users }[] = [
  { key: 'registration', label: 'Registration', icon: FileText },
  { key: 'contract', label: 'Contract', icon: FileCheck2 },
  { key: 'leave', label: 'Leave requests', icon: CalendarDays },
  { key: 'payslip', label: 'Payslips', icon: WalletCards },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
]

type ModalStat = { label: string; value: string }

function AppModal({ eyebrow, title, meta, icon: Icon, status, statusTone = 'ok', heroLabel, heroValue, heroNote, rows, aside, asideLabel, footer, children, onClose }: {
  eyebrow: string; title: string; meta?: string; icon: typeof Users; status?: string; statusTone?: string
  heroLabel?: string; heroValue?: string; heroNote?: string; rows?: [string, string][]; aside?: ModalStat[]; asideLabel?: string
  footer?: React.ReactNode; children?: React.ReactNode; onClose: () => void
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  return <div className="app-modal-backdrop" onClick={onClose} role="presentation">
    <div className="app-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
      <header className="app-modal-head">
        <span className="app-modal-icon"><Icon /></span>
        <div className="app-modal-title">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {meta && <p className="app-modal-meta">{meta}</p>}
        </div>
        {status && <span className={`app-modal-status ${statusTone}`}>{status}</span>}
        <button className="app-modal-close" onClick={onClose} aria-label="Close"><X /></button>
      </header>

      <div className="app-modal-body">
        {heroValue && <div className="app-modal-hero"><p className="eyebrow">{heroLabel}</p><strong>{heroValue}</strong>{heroNote && <span>{heroNote}</span>}</div>}
        {children}
        {rows && rows.length > 0 && <section className="app-modal-section"><p className="eyebrow">Details</p><div className="app-modal-rows">{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>}
        {aside && aside.length > 0 && <section className="app-modal-section app-modal-aside"><p className="eyebrow">{asideLabel ?? 'Summary'}</p><div className="app-modal-aside-card">{aside.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div></section>}
      </div>

      {footer && <footer className="app-modal-foot">{footer}<button className="app-modal-cancel" onClick={onClose}>Close</button></footer>}
    </div>
  </div>
}

function ProfileStat({ label, value, accent }: { label: string; value: string; accent?: string }) { return <div className="profile-stat"><p>{label}</p><strong className={accent}>{value}</strong></div> }



type EmployeeFiles = { avatar: File | null; document: File | null }

function toIsoDate(value: string | null | undefined) {
  if (!value) return ''
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

function EmployeeForm({ employee, departments, saving, serverError, onSubmit, onDone }: {
  employee: Employee | null
  departments: ApiDepartment[]
  saving: boolean
  serverError: string | null
  onSubmit: (body: Record<string, unknown>, files: EmployeeFiles) => Promise<void>
  onDone: () => void
}) {
  const [values, setValues] = useState(() => ({
    name: employee?.name ?? '',
    email: employee?.email ?? '',
    birth: toIsoDate(employee?.date_of_birth),
    start: toIsoDate(employee?.start_date),
    hire: toIsoDate(employee?.hire_date),
    tin: employee?.tin ?? '',
    departmentId: employee?.department_id != null ? String(employee.department_id) : '',
    roleId: employee?.job_role_id != null ? String(employee.job_role_id) : '',
    type: employee?.employment_type ?? '',
    salary: employee?.base_salary_minor != null ? String(employee.base_salary_minor) : '',
    nida: employee?.nida_number ?? '',
    phone: employee?.phone ?? '',
    address: employee?.address ?? '',
    emergencyName: employee?.emergency_contact_name ?? '',
    emergencyPhone: employee?.emergency_contact_phone ?? '',
  }))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }))
  const roles = useMemo(() => {
    if (!values.departmentId) return departments.flatMap((department) => department.roles)
    return departments.find((department) => String(department.id) === values.departmentId)?.roles ?? []
  }, [departments, values.departmentId])
  const editing = employee !== null
  const title = editing ? 'Edit employee' : 'Add employee'
  const subtitle = editing ? 'Update this profile and employment details.' : 'Create a complete employee profile and securely attach their records.'
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing && (password.length < 8 || password !== confirmPassword)) {
      setPasswordError(password.length < 8 ? 'Set a password of at least 8 characters' : 'Both passwords must match')
      return
    }
    if (editing && password && (password.length < 8 || password !== confirmPassword)) {
      setPasswordError(password.length < 8 ? 'Set a password of at least 8 characters' : 'Both passwords must match')
      return
    }
    setPasswordError('')
    const body: Record<string, unknown> = {
      name: values.name.trim(),
      email: values.email.trim(),
      employment_type: values.type,
      base_salary_minor: Number(values.salary || 0),
      phone: values.phone.trim() || null,
      date_of_birth: values.birth || null,
      tin: values.tin.trim() || null,
      nida_number: values.nida.trim() || null,
      address: values.address.trim() || null,
      emergency_contact_name: values.emergencyName.trim() || null,
      emergency_contact_phone: values.emergencyPhone.trim() || null,
      department_id: values.departmentId ? Number(values.departmentId) : null,
      job_role_id: values.roleId ? Number(values.roleId) : null,
      start_date: values.start || null,
      hire_date: values.hire || null,
    }
    if (password) {
      body.password = password
      body.password_confirmation = confirmPassword
    }
    await onSubmit(body, { avatar, document: attachment })
  }
  return <section className="form-page">
    <div className="workspace-hero"><div><p className="eyebrow">PEOPLE OPERATIONS</p><h1>{title}</h1><p>{subtitle}</p></div><button className="primary-button" form="employee-form" type="submit" disabled={saving}><UserPlus /> {saving ? 'Saving…' : editing ? 'Save changes' : 'Save employee'}</button></div>
    <form className="panel" id="employee-form" onSubmit={submit} autoComplete="off">
      {editing && employee && <div className="contract-saved profile-edit-banner"><Sparkles /><div><strong>Editing an existing profile</strong><p>Changes apply to {employee.name} in the people directory.</p></div></div>}
      {serverError && <div className="password-error"><X /> {serverError}</div>}
      <div className="form-grid">
        <Field label="Full names"><input required value={values.name} onChange={(event) => set({ name: event.target.value })} placeholder="e.g. Amara Okafor" /></Field>
        <Field label="Email address"><input required type="email" autoComplete="off" value={values.email} onChange={(event) => set({ email: event.target.value })} placeholder="employee@goldenhr.com" /></Field>
        <Field label="Birth date"><input type="date" value={values.birth} onChange={(event) => set({ birth: event.target.value })} /></Field>
        <Field label="Start working date"><input type="date" value={values.start} onChange={(event) => set({ start: event.target.value })} /></Field>
        <Field label="Hire date"><input type="date" value={values.hire} onChange={(event) => set({ hire: event.target.value })} /></Field>
        <Field label="TIN"><input value={values.tin} onChange={(event) => set({ tin: event.target.value })} placeholder="Tax identification number" /></Field>
        <Field label="Department"><select value={values.departmentId} onChange={(event) => set({ departmentId: event.target.value, roleId: '' })}><option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field>
        <Field label="Role"><select value={values.roleId} onChange={(event) => set({ roleId: event.target.value })}><option value="">Select role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.title}</option>)}</select></Field>
        <Field label="Employee type"><select required value={values.type} onChange={(event) => set({ type: event.target.value })}><option value="" disabled>Select employee type</option>{EMPLOYMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
        <Field label="Salary (TSh)"><input required type="number" min="0" value={values.salary} onChange={(event) => set({ salary: event.target.value })} placeholder="Monthly salary in shillings" /></Field>
        <Field label="NIDA"><input value={values.nida} onChange={(event) => set({ nida: event.target.value })} placeholder="NIDA number" /></Field>
        <Field label="Phone"><input type="tel" value={values.phone} onChange={(event) => set({ phone: event.target.value })} placeholder="+255 700 000 000" /></Field>
        <Field label="Address" full><textarea rows={3} value={values.address} onChange={(event) => set({ address: event.target.value })} placeholder="Residential address" /></Field>
        <Field label="Emergency contact name"><input value={values.emergencyName} onChange={(event) => set({ emergencyName: event.target.value })} placeholder="Contact full name" /></Field>
        <Field label="Emergency contact phone"><input type="tel" value={values.emergencyPhone} onChange={(event) => set({ emergencyPhone: event.target.value })} placeholder="Contact phone number" /></Field>
        <Field label="Profile image"><label className="upload-box"><Upload /><span>{avatar ? avatar.name : editing ? 'Replace employee image' : 'Upload employee image'}</span><input type="file" accept="image/*" onChange={(event) => setAvatar(event.target.files?.[0] ?? null)} /></label></Field>
        <Field label="Employee document" full><label className="upload-box"><FileUp /><span>{attachment ? attachment.name : 'Upload CV, contract, ID, or supporting document'}</span><input type="file" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} /></label></Field>
      </div>
      <div className="account-panel">
        <div className="panel-heading"><div><p className="eyebrow">SYSTEM ACCESS</p><h3 className="attachment-title">{editing ? 'Reset portal password' : 'Create their login'}</h3></div><ShieldCheck className="sparkle" /></div>
        {editing ? <><p className="settings-hint">Leave both fields empty to keep the current password.</p><div className="form-grid"><Field label="New password"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></Field><Field label="Confirm password"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat the password" /></Field></div></> : <><p className="settings-hint">The employee signs in with their email address and this password to open their portal.</p><div className="form-grid"><Field label="Login email address"><input required type="email" autoComplete="off" value={values.email} readOnly placeholder="Set the email address above" /></Field><Field label="Employee type access"><input readOnly value="Employee portal" /></Field><Field label="Password"><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></Field><Field label="Confirm password"><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat the password" /></Field></div></>}
        {passwordError && <div className="password-error"><X /> {passwordError}</div>}
        <label className="settings-toggle"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show password</label>
      </div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={onDone}>Cancel</button><button className="primary-button" type="submit" disabled={saving}><UserPlus /> {saving ? 'Saving…' : editing ? 'Save changes' : 'Create employee'}</button></div>
    </form>
  </section>
}

function AddEmployeePage({ onDone }: { onDone: () => void }) {
  const { departments, reloadOne } = useHrData()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async (body: Record<string, unknown>, files: EmployeeFiles) => {
    setSaving(true)
    setError(null)
    try {
      const created = await employeesApi.create(body)
      const id = created.employee.id
      if (files.avatar) {
        const form = new FormData()
        form.append('file', files.avatar)
        await employeesApi.avatar(id, form)
      }
      if (files.document) {
        const form = new FormData()
        form.append('employee_id', String(id))
        form.append('file', files.document)
        await uploadDocument(form)
        await reloadOne('documents')
      }
      await reloadOne('employees')
      onDone()
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setSaving(false)
    }
  }
  if (departments.status === 'loading') return <EmptyState label="Loading departments" />
  if (departments.status === 'error') return <EmptyState label="Could not load departments" detail={departments.error ?? undefined} />
  return <EmployeeForm employee={null} departments={departments.items} saving={saving} serverError={error} onSubmit={submit} onDone={onDone} />
}

function EmployeeManagementPage() {
  const { employees, departments, reloadOne } = useHrData()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState<Employee | null>(null)

  const records = employees.items
  const filtered = records.filter((person) =>
    `${person.name} ${person.role ?? ''} ${person.department ?? ''} ${person.email}`.toLowerCase().includes(query.toLowerCase()),
  )

  const submitEdit = async (body: Record<string, unknown>, files: EmployeeFiles) => {
    if (editingId === null) return
    setSaving(true)
    setError(null)
    try {
      const updated = await employeesApi.update(editingId, body)
      if (files.avatar) {
        const form = new FormData()
        form.append('file', files.avatar)
        await employeesApi.avatar(editingId, form)
      }
      if (files.document) {
        const form = new FormData()
        form.append('employee_id', String(editingId))
        form.append('file', files.document)
        await uploadDocument(form)
        await reloadOne('documents')
      }
      await reloadOne('employees')
      setEditingId(null)
      const person = records.find((item) => item.id === editingId)
      setNotice(updated.password_reset ? `Password reset for ${person?.email ?? person?.name ?? 'employee'} — they can now sign in with the new password` : 'Employee record updated (password unchanged)')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  const terminate = async () => {
    if (!confirming) return
    setError(null)
    try {
      await employeesApi.terminate(confirming.id)
      await reloadOne('employees')
      setNotice(`${confirming.name} terminated`)
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setConfirming(null)
    }
  }

  if (editingId !== null) {
    const employee = records.find((item) => item.id === editingId) ?? null
    if (!employee) return <EmptyState label="Employee not found" />

  if (departments.status === 'loading') return <EmptyState label="Loading departments" />
    return <EmployeeForm employee={employee} departments={departments.items} saving={saving} serverError={error} onSubmit={submitEdit} onDone={() => setEditingId(null)} />
  }
  if (selectedId !== null) return <RegistrationInfo employeeId={selectedId} mode="hr" onBack={() => { setSelectedId(null); void reloadOne('employees') }} />
  if (employees.status === 'loading') return <EmptyState label="Loading employees" />
  if (employees.status === 'error') return <EmptyState label="Could not load employees" detail={employees.error ?? undefined} />
  return <section className="management-page"><div className="workspace-hero"><div><p className="eyebrow">PEOPLE DIRECTORY</p><h1>Employee management</h1><p>Manage profiles, employment details, and secure employee records.</p></div></div>{notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>Complete the profile and attach the supporting records.</p></div></div>}{error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}<div className="panel"><div className="management-toolbar"><div><p className="eyebrow">{records.length} ACTIVE PROFILES</p><h2>All employees</h2></div><div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people" /></div></div><div className="employee-list">{filtered.map((person) => <div className="employee-card" key={person.id}><div className={`avatar ${toneFor(person.id)}`}>{person.initials}</div><div><strong>{person.name}</strong><span>{person.role ?? 'No role'} · {person.department ?? 'No department'}</span></div><span className="status-pill">{person.employment_type_label}</span><div className="employee-actions"><button aria-label={`View ${person.name}`} onClick={() => setSelectedId(person.id)}><Eye /></button><button aria-label={`Edit ${person.name}`} onClick={() => setEditingId(person.id)}><Pencil /></button><button aria-label={`Terminate ${person.name}`} onClick={() => setConfirming(person)}><Trash2 /></button></div></div>)}</div>{filtered.length === 0 && <EmptyState label="No employees match your search" />}</div>
    {confirming && <AppModal eyebrow="People directory" title={`Terminate ${confirming.name}?`} meta={`${confirming.employee_code} · ${confirming.email}`} icon={Trash2} footer={<><button className="secondary-button" onClick={() => setConfirming(null)}>Cancel</button><button className="primary-button" onClick={() => void terminate()}><Trash2 /> Terminate employee</button></>} onClose={() => setConfirming(null)}>
      <p className="settings-hint">The profile is soft-terminated and kept on record. Their portal login stops working immediately.</p>
    </AppModal>}
  </section>
}

type DepartmentDetail = {
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
}

function RoleComposer({ roles, onChange, placeholder = 'Type a role, then press enter' }: { roles: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  const [value, setValue] = useState('')
  const add = () => {
    const name = value.trim()
    if (!name || roles.some((role) => role.toLowerCase() === name.toLowerCase())) { setValue(''); return }
    onChange([...roles, name])
    setValue('')
  }
  return <div className="role-composer">
    <div className="role-input-row">
      <input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add() } }} placeholder={placeholder} />
      <button className="secondary-button" onClick={add}><Plus /> Add role</button>
    </div>
    {roles.length === 0 ? <p className="role-empty">No roles defined yet.</p> : <div className="role-chips">{roles.map((role) => <span className="role-chip" key={role}>{role}<button aria-label={`Remove ${role}`} onClick={() => onChange(roles.filter((item) => item !== role))}><X /></button></span>)}</div>}
  </div>
}

const roleLevels = ['Lead', 'Senior', 'Mid level', 'Junior', 'Intern']

const roleLevelValue = (label: string): string => {
  const map: Record<string, string> = { Lead: 'lead', Senior: 'senior', 'Mid level': 'mid', Junior: 'junior', Intern: 'intern' }
  return map[label] ?? 'mid'
}

function DepartmentRolesDetail({ departmentId, onBack }: { departmentId: number; onBack: () => void }) {
  const { reloadOne } = useHrData()
  const [detail, setDetail] = useState<DepartmentDetail | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [bulk, setBulk] = useState(false)
  const [bulkValue, setBulkValue] = useState('')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'roles' | 'employees'>('roles')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setStatus('loading')
    setError(null)
    try {
      setDetail(await departmentsApi.detail(departmentId))
      setStatus('ready')
    } catch (cause) {
      setError(apiMessage(cause))
      setStatus('error')
    }
  }

  useEffect(() => { void load() }, [departmentId])

  if (status === 'loading' || !detail) return status === 'error'
    ? <EmptyState label="Could not load department" detail={error ?? undefined} />
    : <EmptyState label="Loading department" />

  const { department, roles, employees } = detail
  const setRoles = (next: JobRole[]) => setDetail({ ...detail, roles: next })

  const refreshAll = async () => {
    await load()
    await reloadOne('departments')
    await reloadOne('employees')
  }

  const addRoles = async (names: string[]) => {
    const clean = names.map((name) => name.trim()).filter(Boolean)
    if (clean.length === 0) return
    setBusy(true)
    try {
      await departmentsApi.addRoles(department.id, clean)
      setBulkValue('')
      setBulk(false)
      setNotice(`${clean.length} role${clean.length === 1 ? '' : 's'} added`)
      await refreshAll()
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const removeRole = async (role: JobRole) => {
    setBusy(true)
    try {
      await departmentsApi.deleteRole(department.id, role.id)
      setNotice(`${role.title} removed`)
      await refreshAll()
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const changeLevel = async (role: JobRole, label: string) => {
    try {
      await departmentsApi.updateRole(department.id, role.id, { level: roleLevelValue(label) })
      setRoles(roles.map((item) => (item.id === role.id ? { ...item, level: roleLevelValue(label) } : item)))
    } catch (cause) {
      setError(apiMessage(cause))
    }
  }

  const assign = async (employeeId: number, roleId: string) => {
    try {
      await employeesApi.update(employeeId, {
        department_id: department.id,
        job_role_id: roleId ? Number(roleId) : null,
      })
      const updated = await departmentsApi.detail(department.id)
      setDetail(updated)
      const target = updated.employees.find((item) => item.id === employeeId)
      setNotice(`${target?.name ?? 'Employee'} assigned to ${target?.assigned_role || 'no role'}`)
      await reloadOne('employees')
    } catch (cause) {
      setError(apiMessage(cause))
    }
  }

  const unassigned = employees.filter((employee) => !employee.assigned_role_id)
  const headcount = (roleId: number) => employees.filter((employee) => employee.assigned_role_id === roleId).length
  const visibleEmployees = employees.filter((employee) => `${employee.name} ${employee.assigned_role ?? ''}`.toLowerCase().includes(query.toLowerCase()))

  return <section className="management-page profile-page">
    <button className="back-link" onClick={onBack}><ChevronDown /> Back to departments</button>
    <div className="panel profile-hero">
      <div className="profile-hero-main"><div className="department-icon"><Building2 /></div><div><p className="eyebrow">DEPARTMENT</p><h1>{department.name}</h1><p className="muted-copy">{employees.length} employees · {roles.length} roles defined</p></div></div>
      <div className="form-actions"><button className="secondary-button" onClick={() => setBulk(!bulk)}><Plus /> Add more roles</button><button className="primary-button" onClick={() => setTab('employees')}><UserPlus /> Assign employees</button></div>
    </div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>The role library for this department is up to date.</p></div></div>}
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    {bulk && <div className="panel bulk-roles bulk-roles-panel"><div className="panel-heading"><div><p className="eyebrow">BULK ADD</p><h3 className="attachment-title">Paste several roles at once</h3></div><button className="icon-button" onClick={() => setBulk(false)}><X /></button></div><textarea rows={4} placeholder="One role per line, or separate with commas" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} /><div className="form-actions"><button className="primary-button" disabled={busy} onClick={() => void addRoles(bulkValue.split(/[\n,]/))}><Plus /> {busy ? 'Adding…' : 'Add roles'}</button></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={`${roles.length}`} hint="roles defined" tone="tone-gold" icon={FileCheck2} foot="Role library for this team" />
      <CountWidget value={`${employees.length}`} hint="employees" tone="tone-blue" icon={Users} foot="People in the department" />
      <CountWidget value={`${employees.length - unassigned.length}`} hint="fully assigned" tone="tone-green" icon={ShieldCheck} foot="Holding a defined role" />
      <CountWidget value={`${unassigned.length}`} hint="unassigned" tone="tone-rose" icon={Clock3} foot="Need a role assignment" />
    </div>
    <div className="profile-tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'roles'} className={`profile-tab ${tab === 'roles' ? 'active' : ''}`} onClick={() => setTab('roles')}><FileCheck2 />Roles · {roles.length}</button>
      <button role="tab" aria-selected={tab === 'employees'} className={`profile-tab ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}><Users />Employees · {employees.length}</button>
    </div>

    {tab === 'roles' && <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">ROLE LIBRARY</p><h2>Roles in {department.name}</h2></div></div>
      <RoleComposer roles={[]} onChange={(next) => { if (next.length > 0) void addRoles([next[next.length - 1]]) }} />
      <div className="profile-table role-table"><div className="profile-table-row profile-table-head"><span>Role</span><span>Level</span><span>Headcount</span><span>Assigned people</span><span /></div>
        {roles.map((role) => <div className="profile-table-row" key={role.id}><strong>{role.title}</strong>
          <span><select className="inline-select" value={roleLevelLabel(role.level)} onChange={(event) => void changeLevel(role, event.target.value)}>{roleLevels.map((item) => <option key={item}>{item}</option>)}</select></span>
          <span>{headcount(role.id)} {headcount(role.id) === 1 ? 'person' : 'people'}</span>
          <span className="role-people">{employees.filter((employee) => employee.assigned_role_id === role.id).slice(0, 4).map((employee, index) => <span className={`avatar avatar-mini ${TONES[index % 4]}`} key={employee.id} title={employee.name}>{initialsFor(employee.name)}</span>)}</span>
          <button className="ghost-icon" onClick={() => void removeRole(role)} aria-label={`Remove ${role.title}`}><Trash2 /></button>
        </div>)}
        {roles.length === 0 && <div className="leave-empty"><FileCheck2 /><p>No roles defined yet. Add the first role above.</p></div>}
      </div>
    </div>}

    {tab === 'employees' && <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">TEAM</p><h2>Employees in {department.name}</h2></div><div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or roles" /></div></div>
      <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Employee</span><span>Assigned role</span><span>Level</span><span>Status</span><span /></div>
        {visibleEmployees.map((employee) => {
          return <div className="profile-table-row" key={employee.id}>
            <span className="role-person"><span className={`avatar avatar-mini ${toneFor(employee.id)}`}>{initialsFor(employee.name)}</span><strong>{employee.name}</strong></span>
            <span><select className="inline-select" value={employee.assigned_role_id ?? ''} onChange={(event) => void assign(employee.id, event.target.value)}><option value="">Unassigned</option>{roles.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></span>
            <span>{roleLevelLabel(employee.level)}</span>
            <span className={`status-pill ${employee.assigned_role_id ? 'ok' : 'off'}`}>{employee.assigned_role_id ? 'Assigned' : 'Unassigned'}</span>
            <button className="ghost-icon" aria-label={`View ${employee.name}`}><Eye /></button>
          </div>
        })}
        {visibleEmployees.length === 0 && <div className="leave-empty"><Users /><p>No employees match your search.</p></div>}
      </div>
    </div>}
  </section>
}
function DepartmentRolesPage() {
  const { departments, reloadOne } = useHrData()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [quickRoles, setQuickRoles] = useState<Record<number, string[]>>({})
  const [confirming, setConfirming] = useState<ApiDepartment | null>(null)

  if (selectedId !== null) return <DepartmentRolesDetail departmentId={selectedId} onBack={() => { setSelectedId(null); void reloadOne('departments') }} />

  const create = async () => {
    const clean = name.trim()
    if (!clean) return
    setBusy(true)
    setError(null)
    try {
      const created = await departmentsApi.create({ name: clean, description: description.trim() || null }) as { department: { id: number } }
      if (roles.length > 0) await departmentsApi.addRoles(created.department.id, roles)
      setName('')
      setDescription('')
      setRoles([])
      setShowForm(false)
      setSaved(true)
      await reloadOne('departments')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const quickAdd = async (id: number, next: string[]) => {
    const current = departments.items.find((item) => item.id === id)
    const existing = (current?.roles ?? []).map((role) => role.title.toLowerCase())
    const added = next.filter((role) => !existing.includes(role.toLowerCase()))
    setQuickRoles((state) => ({ ...state, [id]: next }))
    if (added.length === 0) return
    try {
      await departmentsApi.addRoles(id, added)
      await reloadOne('departments')
    } catch (cause) {
      setError(apiMessage(cause))
    }
  }

  const removeDepartment = async () => {
    if (!confirming) return
    setBusy(true)
    setError(null)
    try {
      const result = await departmentsApi.remove(confirming.id)
      setNotice(result.message)
      setConfirming(null)
      await reloadOne('departments')
      await reloadOne('employees')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (departments.status === 'loading') return <EmptyState label="Loading departments" />
  if (departments.status === 'error') return <EmptyState label="Could not load departments" detail={departments.error ?? undefined} />

  const items = departments.items
  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">ORGANIZATION</p><h1>Departments & roles</h1><p>Create departments, define roles, and understand every team at a glance.</p></div><button className="primary-button" onClick={() => { setShowForm(true); setSaved(false) }}><Plus /> Create department</button></div>
    {saved && <div className="panel contract-saved"><Sparkles /><div><strong>Department created</strong><p>The new team is ready with its role library.</p></div></div>}
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong></div></div>}
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    <div className="department-grid">{items.map((department) => {
      const lead = department.leads.find((item) => item.is_primary) ?? department.leads[0]
      const titles = (quickRoles[department.id] ?? department.roles.map((role) => role.title))
      return <article className="panel department-card" key={department.id}>
        <div className="department-card-head"><div className="department-icon"><Building2 /></div><span className="department-count">{department.headcount}<small>people</small></span><button className="more-button" onClick={() => setSelectedId(department.id)}><Eye /> Summary</button></div>
        <h2>{department.name}</h2><p>Led by <strong>{lead?.name ?? 'Not assigned'}</strong></p>
        <div className="role-list">{department.roles.map((role) => <span key={role.id}>{role.title}</span>)}</div>
        <div className="role-composer-boxed"><p className="eyebrow">ADD ROLE · {department.name}</p><RoleComposer roles={titles} onChange={(next) => void quickAdd(department.id, next)} placeholder="Type a role, then press enter" /></div>
        <div className="department-card-actions"><button className="more-button" onClick={() => setSelectedId(department.id)}>Manage <ArrowUpRight /></button><button className="ghost-icon" onClick={() => setConfirming(department)} aria-label={`Delete ${department.name}`}><Trash2 /></button></div>
        <div className="department-people"><div className="avatar-stack"><div className="avatar saffron">{initialsFor(lead?.name ?? department.name)}</div></div><span>{department.roles.length} roles defined · {department.fully_assigned} fully assigned</span></div>
      </article>
    })}</div>
    {items.length === 0 && <EmptyState label="No departments yet" detail="Create the first department above." />}
    {confirming && <AppModal eyebrow="Organization" title={`Delete ${confirming.name}?`} meta={`${confirming.headcount} employees · ${confirming.roles.length} roles`} icon={Trash2} footer={<><button className="secondary-button" onClick={() => setConfirming(null)}>Cancel</button><button className="primary-button" disabled={busy} onClick={() => void removeDepartment()}><Trash2 /> {busy ? 'Deleting…' : 'Delete department'}</button></>} onClose={() => setConfirming(null)}>
      <p className="settings-hint">A department with people in it is deactivated instead of erased, so history stays intact. An empty one is deleted permanently.</p>
    </AppModal>}
    {showForm && <AppModal eyebrow="Organization" title="Create department" meta="Define the team and the roles it owns." icon={Building2} footer={<><button className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" disabled={busy} onClick={() => void create()}><Building2 /> {busy ? 'Creating…' : 'Create department'}</button></>} onClose={() => setShowForm(false)}>
      {error && <div className="password-error"><X /> {error}</div>}
      <div className="form-grid"><Field label="Department name"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Customer Success" /></Field><Field label="Description"><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What this team owns" /></Field><div className="field full"><label>Roles in this department</label><RoleComposer roles={roles} onChange={setRoles} /></div></div>
    </AppModal>}
  </section>
}

function LeaveApprovalPage() {
  const { leaveRequests, reloadOne } = useHrData()
  const [filter, setFilter] = useState<'All' | 'pending' | 'approved' | 'declined'>('pending')
  const [openId, setOpenId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [balances, setBalances] = useState<LeaveBalance[]>([])

  const requests = leaveRequests.items
  const statusOf = (status: string) => status.toLowerCase()
  const visible = requests.filter((request) => filter === 'All' || statusOf(request.status) === filter)
  const counts = {
    pending: requests.filter((r) => statusOf(r.status) === 'pending').length,
    approved: requests.filter((r) => statusOf(r.status) === 'approved').length,
    declined: requests.filter((r) => statusOf(r.status) === 'declined').length,
  }
  const open = requests.find((request) => request.id === openId) ?? null

  const openDetail = async (request: ApiLeaveRequest) => {
    setOpenId(request.id)
    setNote('')
    setBalances([])
    if (request.employee) {
      try {
        const result = await leaveApi.balancesFor(request.employee.id)
        setBalances(result.balances)
      } catch {
        /* balances are supplementary; the request still reviews fine */
      }
    }
  }

  const balanceFor = (leaveTypeId: number): LeaveBalance | null =>
    balances.find((balance) => balance.leave_type_id === leaveTypeId) ?? null

  const decide = async (request: ApiLeaveRequest, decision: 'approve' | 'decline') => {
    setBusy(true)
    setError(null)
    try {
      if (decision === 'approve') await leaveApi.approve(request.id, note || undefined)
      else await leaveApi.decline(request.id, note || undefined)
      setNotice(`${request.employee?.name ?? 'Request'} ${decision === 'approve' ? 'approved' : 'declined'}`)
      await reloadOne('leaveRequests')
      await reloadOne('notifications')
      setOpenId(null)
      setNote('')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (leaveRequests.status === 'loading') return <EmptyState label="Loading leave requests" />
  if (leaveRequests.status === 'error') return <EmptyState label="Could not load leave requests" detail={leaveRequests.error ?? undefined} />

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">TIME OFF</p><h1>Leave approval</h1><p>Review team requests, keep coverage balanced, and record every decision.</p></div></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>The decision was recorded and the employee has been notified.</p></div></div>}
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={`${counts.pending}`} hint="awaiting review" tone="tone-gold" icon={ClipboardCheck} foot="Requests in the queue" />
      <CountWidget value={`${counts.approved}`} hint="approved" tone="tone-green" icon={FileCheck2} foot="Granted requests" />
      <CountWidget value={`${counts.declined}`} hint="declined" tone="tone-rose" icon={X} foot="Sent back to employees" />
      <CountWidget value={`${requests.length}`} hint="total requests" tone="tone-blue" icon={CalendarDays} foot="Across all staff" />
    </div>
    <div className="profile-tabs" role="tablist">{(['pending', 'approved', 'declined', 'All'] as const).map((key) => <button key={key} role="tab" aria-selected={filter === key} className={`profile-tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}><ClipboardCheck />{key === 'All' ? 'All requests' : `${key} · ${counts[key]}`}</button>)}</div>
    <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">{visible.length} SHOWN</p><h2>{filter === 'All' ? 'All requests' : `${filter} requests`}</h2></div></div>
      <div className="leave-list">
        {visible.map((request) => <article className="leave-row" key={request.id}>
          <div className={`avatar ${toneFor(request.employee?.id ?? request.id)}`}>{request.employee?.initials ?? initialsFor(request.employee?.name)}</div>
          <div className="leave-row-main"><div className="leave-row-head"><strong>{request.employee?.name ?? 'Unknown employee'}</strong><span className="status-pill">{request.leave_type ?? 'Leave'}</span></div><p className="leave-row-dates">{formatDate(request.start_date)} — {formatDate(request.end_date)} <i>·</i> {request.days} working days</p><p className="leave-row-meta">Coverage: {request.coverage?.name ?? '—'} <i>·</i> Approver: {request.approver ?? '—'}{request.created_at ? <> <i>·</i> Submitted {formatRelative(request.created_at)}</> : null}</p><p className="leave-row-reason">{request.reason}</p></div>
          <div className="leave-row-actions">{statusOf(request.status) === 'pending' ? <><button className="secondary-button" disabled={busy} onClick={() => void decide(request, 'decline')}>Decline</button><button className="primary-button" disabled={busy} onClick={() => void decide(request, 'approve')}><FileCheck2 /> Approve</button></> : <span className={`status-pill ${statusOf(request.status) === 'approved' ? 'ok' : 'off'}`}>{request.status}</span>}<button className="more-button" onClick={() => void openDetail(request)}><Eye /> Review</button></div>
        </article>)}
        {visible.length === 0 && <div className="leave-empty"><ClipboardCheck /><p>No {filter === 'All' ? '' : filter + ' '}requests right now.</p></div>}
      </div>
    </div>
  {open && <AppModal
    eyebrow={`${open.reference} · LEAVE REQUEST`}
    title={open.leave_type ?? 'Leave request'}
    meta={`${open.employee?.name ?? 'Unknown employee'} · submitted ${open.created_at ? formatRelative(open.created_at) : 'recently'}`}
    icon={CalendarDays}
    status={open.status}
    statusTone={statusOf(open.status) === 'approved' ? 'ok' : statusOf(open.status) === 'declined' ? 'off' : 'warn'}
    heroLabel="REQUESTED LEAVE"
    heroValue={`${open.days} working days`}
    heroNote={`${formatDate(open.start_date)} — ${formatDate(open.end_date)}`}
    rows={[
      ['Employee', open.employee?.name ?? '—'],
      ['Leave type', open.leave_type ?? '—'],
      ['Start date', formatDate(open.start_date)],
      ['End date', formatDate(open.end_date)],
      ['Working days', `${open.days} days`],
      ['Coverage during leave', open.coverage?.name ?? '—'],
      ['Approver', open.approver ?? '—'],
      ['Decided', open.decided_at ? formatDate(open.decided_at) : 'Awaiting decision'],
    ]}
    asideLabel="BALANCE"
    aside={(() => { const balance = balanceFor(open.leave_type_id); return balance ? [{ label: 'Entitled', value: `${balance.entitled_days} days` }, { label: 'Used', value: `${balance.used_days} days` }, { label: 'Booked', value: `${balance.booked_days} days` }, { label: 'Remaining', value: `${balance.remaining_days} days` }] : [] })()}
    footer={statusOf(open.status) === 'pending' ? <><button className="secondary-button" disabled={busy} onClick={() => void decide(open, 'decline')}><X /> Decline</button><button className="primary-button" disabled={busy} onClick={() => void decide(open, 'approve')}><FileCheck2 /> Approve request</button></> : undefined}
    onClose={() => { setOpenId(null); setNote('') }}
  >
    <div className="profile-note"><FileText /><div><strong>Reason given</strong><p>{open.reason || 'No reason given.'}</p></div></div>
    {statusOf(open.status) === 'pending'
      ? <div className="field full"><label>Reviewer note</label><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note for the employee record" /></div>
      : open.reviewer_note ? <div className="profile-note"><ShieldCheck /><div><strong>Reviewer note</strong><p>{open.reviewer_note}</p></div></div> : null}
    {error && <div className="password-error"><X /> {error}</div>}
  </AppModal>}
  </section>
}

function LeaveRequestPage() {
  const { leaveRequests, leaveBalances, reloadOne } = useHrData()
  const [submitted, setSubmitted] = useState(false)
  const [types, setTypes] = useState<LeaveTypeRef[]>([])
  const [typesError, setTypesError] = useState<string | null>(null)
  const [typeId, setTypeId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [days, setDays] = useState('1')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    leaveApi.types()
      .then((result) => {
        setTypes(result.data)
        if (result.data.length > 0) setTypeId((current) => current || String(result.data[0].id))
      })
      .catch((cause) => setTypesError(apiMessage(cause)))
  }, [])

  const selectedType = types.find((item) => String(item.id) === typeId) ?? null
  const balance = leaveBalances.items.find((item) => item.leave_type_id === Number(typeId)) ?? null
  const remaining = balance ? balance.remaining_days : null
  const mine = leaveRequests.items

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await leaveApi.submit({
        leave_type_id: Number(typeId),
        start_date: start,
        end_date: end,
        days: Number(days),
        reason: reason.trim() || null,
      })
      setSubmitted(true)
      setReason('')
      await reloadOne('leaveRequests')
      await reloadOne('leaveBalances')
      await reloadOne('notifications')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const withdraw = async (id: number) => {
    setError(null)
    try {
      await leaveApi.withdraw(id)
      setNotice('Request withdrawn')
      await reloadOne('leaveRequests')
      await reloadOne('leaveBalances')
    } catch (cause) {
      setError(apiMessage(cause))
    }
  }

  if (submitted) return <section className="form-page"><div className="panel success-panel"><Sparkles /><h2>Request submitted</h2><p>Your leave request is now with your manager for review.</p><div className="form-actions" style={{ justifyContent: 'center' }}><button className="secondary-button" onClick={() => setSubmitted(false)}>Create another request</button></div></div></section>
  return <section className="form-page">
    <div className="workspace-hero"><div><p className="eyebrow">TIME OFF</p><h1>Request leave</h1><p>Plan time away while keeping your team informed.</p></div></div>
    {typesError && <div className="panel contract-saved"><X /><div><strong>{typesError}</strong></div></div>}
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong></div></div>}
    <form className="panel" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Leave type"><select value={typeId} onChange={(event) => setTypeId(event.target.value)}>{types.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Working days requested"><input type="number" min="1" value={days} onChange={(event) => setDays(event.target.value)} /></Field>
        <Field label="Start date"><input required type="date" value={start} onChange={(event) => setStart(event.target.value)} /></Field>
        <Field label="End date"><input required type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></Field>
        <Field label="Leave balance after request" full><div className="leave-balance"><Sparkles /><div><strong>{remaining !== null ? `${Math.max(0, remaining - Number(days || 0))} days remaining` : 'Balance unavailable'}</strong><p>{selectedType?.name ?? 'Leave'} · {start && end ? `${formatDate(start)} — ${formatDate(end)}` : 'Add dates to see the period'}</p></div></div></Field>
        <Field label="Reason" full><textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add context for your manager" /></Field>
      </div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setSubmitted(false)}>Cancel</button><button className="primary-button" type="submit" disabled={busy || types.length === 0}><CalendarDays /> {busy ? 'Sending…' : 'Submit request'}</button></div>
    </form>
    <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">{mine.length} SUBMITTED</p><h2>My requests</h2></div></div>
      {leaveRequests.status === 'loading' ? <EmptyState label="Loading your requests" /> : <div className="leave-list">
        {mine.map((request) => <article className="leave-row" key={request.id}>
          <div className={`avatar ${toneFor(request.id)}`}>{initialsFor(request.leave_type)}</div>
          <div className="leave-row-main"><div className="leave-row-head"><strong>{request.leave_type ?? 'Leave'}</strong><span className={`status-pill ${request.status.toLowerCase() === 'approved' ? 'ok' : request.status.toLowerCase() === 'declined' ? 'off' : ''}`}>{request.status}</span></div><p className="leave-row-dates">{formatDate(request.start_date)} — {formatDate(request.end_date)} <i>·</i> {request.days} working days</p><p className="leave-row-reason">{request.reason}</p></div>
          <div className="leave-row-actions">{request.status.toLowerCase() === 'pending' && <button className="secondary-button" onClick={() => void withdraw(request.id)}>Withdraw</button>}</div>
        </article>)}
        {mine.length === 0 && <div className="leave-empty"><CalendarDays /><p>No leave requests yet.</p></div>}
      </div>}
    </div>
  </section>
}

const money = (value: number) => `TSh ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`

const deductionOptions = [
  { key: 'tax' as const, label: 'PAYE income tax' },
  { key: 'pension' as const, label: 'NSSF pension' },
  { key: 'other' as const, label: 'Other deductions' },
]

type PayAmounts = { basic: number; overtime: number; bonus: number; allowance: number; tax: number; pension: number; other: number }

const emptyAmounts: PayAmounts = { basic: 0, overtime: 0, bonus: 0, allowance: 0, tax: 0, pension: 0, other: 0 }

const grossOf = (entry: PayAmounts) => entry.basic + entry.overtime + entry.bonus + entry.allowance

const deductionsOf = (entry: PayAmounts) => entry.tax + entry.pension + entry.other

function PayrollBreakdown({ basic, overtime, bonus, allowance, tax, pension, other }: PayAmounts) {
  const gross = basic + overtime + bonus + allowance
  const total = tax + pension + other
  const net = gross - total
  return <div className="payroll-breakdown">
    <div className="payroll-breakdown-head"><p className="eyebrow">PAY SUMMARY</p><span>Gross {money(gross)}</span></div>
    <div className="payroll-lines">
      {[['Basic salary', basic], ['Overtime', overtime], ['Bonus', bonus], ['Allowance', allowance]].map(([label, value]) => <div key={label as string}><span>{label}</span><strong>{money(value as number)}</strong></div>)}
      <div className="payroll-lines-total"><span>Gross pay</span><strong>{money(gross)}</strong></div>
    </div>
    <div className="payroll-lines payroll-lines-deduct">
      {deductionOptions.map(({ key, label }) => <div key={key}><span>{label}</span><strong>− {money(key === 'tax' ? tax : key === 'pension' ? pension : other)}</strong></div>)}
      <div className="payroll-lines-total"><span>Total deductions</span><strong>− {money(total)}</strong></div>
    </div>
    <div className="payroll-net"><span>Net pay</span><strong>{money(net)}</strong></div>
  </div>
}

type PayLine = PayAmounts & { employeeId: number; method: string }

const currentMonth = () => new Date().toISOString().slice(0, 7)

const methodLabel = (method: string) => (method === 'mobile_money' ? 'Mobile money' : 'Bank transfer')

function CreatePayrollPage({ onCreated, onCancel }: { onCreated: (run: PayrollRun) => void; onCancel: () => void }) {
  const { employees } = useHrData()
  const [step, setStep] = useState(1)
  const [person, setPerson] = useState<Employee | null>(null)
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState(currentMonth())
  const [entry, setEntry] = useState<PayAmounts>(emptyAmounts)
  const [method, setMethod] = useState('bank_transfer')
  const [lines, setLines] = useState<PayLine[]>([])
  const [done, setDone] = useState<PayrollRun | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const candidates = employees.items.filter((record) =>
    `${record.name} ${record.role ?? ''} ${record.department ?? ''}`.toLowerCase().includes(query.toLowerCase()) &&
    !lines.some((line) => line.employeeId === record.id),
  )
  const set = (patch: Partial<PayAmounts>) => setEntry((current) => ({ ...current, ...patch }))

  const choose = (record: Employee) => {
    setPerson(record)
    const base = record.base_salary_minor ?? 0
    setEntry({ basic: base, overtime: 0, bonus: 0, allowance: 0, tax: Math.round(base * 0.1), pension: Math.round(base * 0.08), other: 0 })
    setStep(2)
  }

  const gross = grossOf(entry)
  const deductions = deductionsOf(entry)
  const net = gross - deductions

  const addLine = () => {
    if (!person) return
    setLines((current) => [...current, { employeeId: person.id, method, ...entry }])
    setPerson(null)
    setEntry(emptyAmounts)
    setStep(1)
    setQuery('')
  }

  const submit = async () => {
    if (lines.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const [year, mon] = month.split('-').map(Number)
      const created = await payrollApi.createRun({
        period_year: year,
        period_month: mon,
        lines: lines.map((line) => ({
          employee_id: line.employeeId,
          basic_minor: Math.round(line.basic),
          overtime_minor: Math.round(line.overtime),
          bonus_minor: Math.round(line.bonus),
          allowance_minor: Math.round(line.allowance),
          tax_minor: Math.round(line.tax),
          pension_minor: Math.round(line.pension),
          other_deduction_minor: Math.round(line.other),
          payment_method: line.method,
        })),
      })
      setDone(created.run)
      onCreated(created.run)
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const nameOf = (id: number) => employees.items.find((item) => item.id === id)?.name ?? `#${id}`

  if (done) return <section className="form-page">
    <div className="panel success-panel"><Sparkles /><h2>Payroll created</h2><p>{done.period} run with {done.payslip_count} payslip{done.payslip_count === 1 ? '' : 's'} ({money(done.net_total_minor)} net) is ready for approval.</p><div className="form-actions" style={{ justifyContent: 'center' }}><button className="secondary-button" onClick={onCancel}><ArrowUpRight /> Back to payroll center</button></div></div>
  </section>

  if (employees.status === 'loading') return <EmptyState label="Loading employees" />
  if (employees.status === 'error') return <EmptyState label="Could not load employees" detail={employees.error ?? undefined} />

  return <section className="management-page payroll-create">
    <button className="back-link" onClick={onCancel}><ChevronDown /> Back to payroll center</button>
    <div className="workspace-hero"><div><p className="eyebrow">COMPENSATION</p><h1>Create payroll</h1><p>Select employees, review their records, then build the monthly pay run.</p></div></div>
    <div className="payroll-steps">
      {[['01', 'Select employee', 'Employee details load automatically'], ['02', 'Build the pay run', 'Earnings and deductions'], ['03', 'Review and save', 'Confirm the net amount']].map(([number, title, detail], index) => <div className={`payroll-step ${step > index + 1 ? 'done' : ''} ${step === index + 1 ? 'current' : ''}`} key={number}><span>{step > index + 1 ? <FileCheck2 /> : number}</span><div><strong>{title}</strong><p>{detail}</p></div></div>)}
    </div>
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}

    {lines.length > 0 && <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">{lines.length} LINED UP</p><h2>Lines in the {month} run</h2></div></div>
      <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Employee</span><span>Gross</span><span>Deductions</span><span>Net pay</span><span /></div>
        {lines.map((line, index) => <div className="profile-table-row" key={`${line.employeeId}-${index}`}>
          <span><strong>{nameOf(line.employeeId)}</strong></span>
          <span>{money(grossOf(line))}</span>
          <span>{money(deductionsOf(line))}</span>
          <span className="payroll-net-cell">{money(grossOf(line) - deductionsOf(line))}</span>
          <button className="ghost-icon" onClick={() => setLines(lines.filter((_, i) => i !== index))} aria-label="Remove line"><Trash2 /></button>
        </div>)}
      </div>
      <div className="form-actions"><button className="primary-button" disabled={busy} onClick={() => void submit()}><FileCheck2 /> {busy ? 'Creating…' : `Create ${month} run`}</button></div>
    </div>}

    {step === 1 && <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">STEP 01</p><h2>Who is on this payroll?</h2></div><div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees" /></div></div>
      <div className="employee-select-list">{candidates.map((record) => <button className="employee-select-row" key={record.id} onClick={() => choose(record)}><span className={`avatar ${toneFor(record.id)}`}>{record.initials}</span><span><strong>{record.name}</strong><span>{record.role ?? 'No role'} · {record.department ?? 'No department'} · {record.employment_type_label}</span></span><span className="employee-select-salary">{money(record.base_salary_minor ?? 0)}<small>per month</small></span><ArrowUpRight /></button>)}</div>
      {candidates.length === 0 && <div className="leave-empty"><Users /><p>No employees match your search.</p></div>}
    </div>}

    {step > 1 && person && <div className="payroll-layout">
      <div className="payroll-main">
        <article className="panel payroll-employee">
          <div className="panel-heading"><div><p className="eyebrow">EMPLOYEE ON THIS PAY RUN</p><h2>{person.name}</h2></div><button className="secondary-button" onClick={() => setStep(1)}><Pencil /> Change</button></div>
          <div className="profile-hero-main payroll-employee-main"><div className={`avatar avatar-large ${toneFor(person.id)}`}>{person.initials}</div><div><p className="muted-copy">{person.role ?? 'No role'} · {person.department ?? 'No department'} · {person.employment_type_label}</p><div className="profile-hero-tags"><span className="status-pill">{person.hire_date ? formatDate(person.hire_date) : '—'}</span><span className="status-pill">NIDA {person.nida_number ?? '—'}</span><span className="status-pill ok">{person.status}</span></div></div></div>
          <div className="detail-fields profile-fields">
            {[['Phone', person.phone ?? '—'], ['Email', person.email], ['NIDA', person.nida_number ?? '—'], ['TIN', person.tin ?? '—'], ['Base salary', money(person.base_salary_minor ?? 0)], ['Employment type', person.employment_type_label]].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}
          </div>
          <div className="profile-note"><ShieldCheck /><div><strong>Record verified</strong><p>Identity, tax number and base salary were fetched from the employee record.</p></div></div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">STEP 02 · EARNINGS</p><h2>Pay period</h2></div></div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Pay month</small><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></div>
            <div className="detail-field"><small>Payment method</small><select value={method} onChange={(event) => setMethod(event.target.value)}><option value="bank_transfer">Bank transfer</option><option value="mobile_money">Mobile money</option></select></div>
            <div className="detail-field"><small>Basic salary</small><input type="number" value={entry.basic} onChange={(event) => set({ basic: Number(event.target.value) })} /></div>
            <div className="detail-field"><small>Overtime</small><input type="number" value={entry.overtime} onChange={(event) => set({ overtime: Number(event.target.value) })} /></div>
            <div className="detail-field"><small>Bonus</small><input type="number" value={entry.bonus} onChange={(event) => set({ bonus: Number(event.target.value) })} /></div>
            <div className="detail-field"><small>Allowance</small><input type="number" value={entry.allowance} onChange={(event) => set({ allowance: Number(event.target.value) })} /></div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">STEP 02 · DEDUCTIONS</p><h2>Statutory and other</h2></div></div>
          <div className="detail-fields profile-fields">
            {deductionOptions.map(({ key, label }) => <div className="detail-field" key={key}><small>{label}</small><input type="number" value={entry[key]} onChange={(event) => set({ [key]: Number(event.target.value) } as Partial<PayAmounts>)} /></div>)}
          </div>
          <div className="profile-note"><CircleDollarSign /><div><strong>Net pay is {money(net)}</strong><p>Deductions are pre-filled from the statutory rates. Adjust before saving if needed.</p></div></div>
        </article>

        <div className="form-actions"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button" onClick={addLine}><Plus /> Add {person.name.split(' ')[0]} to run</button></div>
      </div>
      <aside className="payroll-side">
        <PayrollBreakdown {...entry} />
        <div className="panel payroll-side-note"><WalletCards /><div><strong>{person.name}</strong><p>{formatMonth(month)} · {methodLabel(method)}</p></div></div>
      </aside>
    </div>}
  </section>
}

function PayrollCenterPage() {
  const { payrollRuns, reloadOne } = useHrData()
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [detail, setDetail] = useState<{ run: PayrollRun; payslips: Payslip[] } | null>(null)
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const openRun = async (run: PayrollRun) => {
    setOpenId(run.id)
    setDetailStatus('loading')
    setError(null)
    try {
      setDetail(await payrollApi.run(run.id))
      setDetailStatus('ready')
    } catch (cause) {
      setError(apiMessage(cause))
      setDetailStatus('error')
    }
  }

  const act = async (run: PayrollRun, action: 'approve' | 'pay') => {
    setBusy(true)
    setError(null)
    try {
      if (action === 'approve') await payrollApi.approve(run.id)
      else await payrollApi.pay(run.id)
      setNotice(`${formatMonth(run.period)} run ${action === 'approve' ? 'approved' : 'paid'}`)
      await reloadOne('payrollRuns')
      await reloadOne('notifications')
      await openRun({ ...run, status: action === 'approve' ? 'approved' : 'paid' })
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (creating) return <CreatePayrollPage onCancel={() => setCreating(false)} onCreated={(run) => { setCreating(false); setNotice(`${formatMonth(run.period)} run created`); void reloadOne('payrollRuns'); void openRun(run) }} />

  const runs = payrollRuns.items
  const pending = runs.filter((run) => run.status !== 'paid' && run.status !== 'approved').length
  const totalNet = runs.reduce((sum, run) => sum + run.net_total_minor, 0)
  const totalGross = runs.reduce((sum, run) => sum + run.gross_total_minor, 0)

  if (openId !== null) {
    if (detailStatus === 'loading' || !detail) return detailStatus === 'error'
      ? <EmptyState label="Could not load pay run" detail={error ?? undefined} />
      : <EmptyState label="Loading pay run" />
    const { run, payslips } = detail
    return <section className="management-page profile-page">
      <button className="back-link" onClick={() => { setOpenId(null); setDetail(null) }}><ChevronDown /> Back to payroll center</button>
      <div className="panel profile-hero">
        <div className="profile-hero-main"><div className="avatar avatar-large avatar-sand"><WalletCards /></div><div><p className="eyebrow">PAY RUN</p><h1>{formatMonth(run.period)}</h1><p className="muted-copy">{run.payslip_count} payslips · {money(run.net_total_minor)} net{run.paid_at ? ` · paid ${formatDate(run.paid_at)}` : ''}</p><div className="profile-hero-tags"><span className={`status-pill ${run.status === 'paid' ? 'ok' : ''}`}>{run.status}</span></div></div></div>
        <div className="form-actions"><button className="secondary-button" onClick={() => void downloadFile(`/api/payroll/runs/${run.id}/pdf`, `${run.period}.pdf`).catch((cause) => setError(apiMessage(cause)))}><Download /> Export as PDF</button>{run.status !== 'approved' && run.status !== 'paid' && <button className="primary-button" disabled={busy} onClick={() => void act(run, 'approve')}><FileCheck2 /> Approve run</button>}{run.status === 'approved' && <button className="primary-button" disabled={busy} onClick={() => void act(run, 'pay')}><WalletCards /> Mark as paid</button>}</div>
      </div>
      {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
      <div className="count-widget-row count-widget-row-4">
        <CountWidget value={money(run.gross_total_minor)} hint="gross payroll" tone="tone-gold" icon={WalletCards} foot="This run" />
        <CountWidget value={money(run.net_total_minor)} hint="net payroll" tone="tone-green" icon={CircleDollarSign} foot="Take-home total" />
        <CountWidget value={`${run.payslip_count}`} hint="payslips" tone="tone-blue" icon={Users} foot="Employees on this run" />
        <CountWidget value={money(run.gross_total_minor - run.net_total_minor)} hint="deductions" tone="tone-rose" icon={ShieldCheck} foot="Withheld total" />
      </div>
      <div className="panel">
        <div className="panel-heading"><div><p className="eyebrow">PAYSLIPS IN THIS RUN</p><h2>{payslips.length} statements</h2></div></div>
        <div className="profile-table payroll-table"><div className="profile-table-row profile-table-head"><span>Employee</span><span>Reference</span><span>Gross</span><span>Deductions</span><span>Net pay</span><span>Status</span><span /></div>
          {payslips.map((slip) => <div className="profile-table-row" key={slip.id}>
            <span className="role-person"><span className={`avatar avatar-mini ${toneFor(slip.employee?.id ?? slip.id)}`}>{slip.employee?.initials ?? '—'}</span><strong>{slip.employee?.name ?? '—'}</strong></span>
            <span>{slip.reference}</span>
            <span>{money(slip.gross_minor)}</span>
            <span>{money(slip.total_deductions_minor)}</span>
            <span className="payroll-net-cell">{money(slip.net_minor)}</span>
            <span className={`status-pill ${slip.status === 'paid' ? 'ok' : ''}`}>{slip.status}</span>
            <span className="employee-actions"><button onClick={() => void downloadFile(`/api/payslips/${slip.id}/pdf`, `${slip.reference}.pdf`).catch((cause) => setError(apiMessage(cause)))} aria-label={`Download ${slip.reference}`}><Download /></button></span>
          </div>)}
        </div>
      </div>
    </section>
  }

  if (payrollRuns.status === 'loading') return <EmptyState label="Loading payroll" />
  if (payrollRuns.status === 'error') return <EmptyState label="Could not load payroll" detail={payrollRuns.error ?? undefined} />

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">COMPENSATION</p><h1>Payroll center</h1><p>Create, review, and approve accurate monthly payroll.</p></div><button className="primary-button" onClick={() => setCreating(true)}><Plus /> Create payroll</button></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>The pay run is recorded in the payroll register.</p></div></div>}
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={money(totalNet)} hint="net payroll" tone="tone-gold" icon={WalletCards} foot="Across recorded runs" />
      <CountWidget value={money(totalGross)} hint="gross payroll" tone="tone-blue" icon={CircleDollarSign} foot="Across recorded runs" />
      <CountWidget value={`${pending}`} hint="awaiting approval" tone="tone-amber" icon={Clock3} foot="Queued for sign off" />
      <CountWidget value={`${runs.length}`} hint="pay runs" tone="tone-rose" icon={ShieldCheck} foot="On record" />
    </div>
    <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">PAYROLL REGISTER</p><h2>{runs.length} pay runs</h2></div></div>
      <div className="profile-table payroll-table"><div className="profile-table-row profile-table-head"><span>Period</span><span>Payslips</span><span>Gross</span><span>Net pay</span><span>Status</span><span>Paid on</span><span /></div>
        {runs.map((run) => <div className="profile-table-row" key={run.id}>
          <span><strong>{formatMonth(run.period)}</strong></span>
          <span>{run.payslip_count}</span>
          <span>{money(run.gross_total_minor)}</span>
          <span className="payroll-net-cell">{money(run.net_total_minor)}</span>
          <span className={`status-pill ${run.status === 'paid' || run.status === 'approved' ? 'ok' : ''}`}>{run.status}</span>
          <span>{run.paid_at ? formatDate(run.paid_at) : '—'}</span>
          <span className="employee-actions"><button onClick={() => void openRun(run)} aria-label={`View ${run.period}`}><Eye /></button><button onClick={() => void downloadFile(`/api/payroll/runs/${run.id}/pdf`, `${run.period}.pdf`).catch((cause) => setError(apiMessage(cause)))} aria-label={`Download ${run.period} report`}><Download /></button></span>
        </div>)}
        {runs.length === 0 && <div className="leave-empty"><WalletCards /><p>No pay runs yet. Create the first run above.</p></div>}
      </div>
    </div>
  </section>
}

function EmployeePayslipsPage() {
  const { payslips, registration } = useHrData()
  const [openId, setOpenId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')

  const mine = payslips.items
  const open = mine.find((record) => record.id === openId) ?? null
  const totalNet = mine.reduce((sum, record) => sum + record.net_minor, 0)
  const last = mine[0] ?? null
  const bank = registration?.bank_accounts.find((account) => account.is_primary) ?? registration?.bank_accounts[0] ?? null
  const profile = registration?.profile ?? null

  if (payslips.status === 'loading') return <EmptyState label="Loading payslips" />
  if (payslips.status === 'error') return <EmptyState label="Could not load payslips" detail={payslips.error ?? undefined} />

  return <section className="form-page">
    <div className="workspace-hero"><div><p className="eyebrow">COMPENSATION</p><h1>My payslips</h1><p>Your approved salary statements, ready whenever you need them.</p></div></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>Your payslip archive is up to date.</p></div></div>}

    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={last ? money(last.net_minor) : '—'} hint="latest net pay" tone="tone-gold" icon={WalletCards} delta={4} foot="vs previous month" />
      <CountWidget value={money(totalNet)} hint="total received" tone="tone-green" icon={CircleDollarSign} delta={6} foot={'across ' + mine.length + ' payslips'} />
      <CountWidget value={String(mine.length)} hint="payslips available" tone="tone-blue" icon={FileText} delta={8} foot="Ready to download" />
      <CountWidget value={String(mine.filter((record) => record.status === 'paid' || record.status === 'approved').length)} hint="paid and approved" tone="tone-violet" icon={ShieldCheck} delta={0} foot="Cleared by payroll" />
    </div>

    <div className="payslip-grid">
      {mine.map((record) => {
        return <article className="panel payslip-card" key={record.id}>
          <div className="payslip-card-head"><span className="payslip-card-icon"><WalletCards /></span><span className={'status-pill ' + (record.status === 'paid' || record.status === 'approved' ? 'ok' : '')}>{record.status}</span></div>
          <p className="eyebrow">{formatMonth(record.period)}</p>
          <h2>{money(record.net_minor)}</h2>
          <p className="payslip-card-note">Net salary · gross {money(record.gross_minor)}</p>
          <div className="payslip-card-stats"><span><small>Paid on</small><strong>{record.paid_at ? formatDate(record.paid_at) : '—'}</strong></span><span><small>Deductions</small><strong>{money(record.total_deductions_minor)}</strong></span></div>
          <div className="payslip-card-foot"><span className="payslip-ref">{record.reference}</span><div className="form-actions"><button className="secondary-button" onClick={() => setOpenId(record.id)}><Eye /> View</button><button className="primary-button" onClick={() => void downloadFile(`/api/payslips/${record.id}/pdf`, `${record.reference}.pdf`).then(() => setNotice('Payslip download started')).catch((cause) => setNotice(apiMessage(cause)))}><Download /> PDF</button></div></div>
        </article>
      })}
      {mine.length === 0 && <EmptyState label="No payslips yet" />}
    </div>

    {open && <AppModal
      eyebrow="Pay statement"
      title={formatMonth(open.period) + ' payslip'}
      meta={open.reference + ' · paid via ' + open.payment_method + ' · ' + (open.paid_at ? formatDate(open.paid_at) : 'not yet paid')}
      icon={WalletCards}
      status={open.status}
      statusTone={open.status === 'paid' || open.status === 'approved' ? 'ok' : 'warn'}
      heroLabel="Net paid"
      heroValue={money(open.net_minor)}
      heroNote={'Gross ' + money(open.gross_minor) + ' · deductions ' + money(open.total_deductions_minor)}
      rows={[
        ['Basic salary', money(open.basic_minor)],
        ['Overtime', money(open.overtime_minor)],
        ['Bonus', money(open.bonus_minor)],
        ['Allowance', money(open.allowance_minor)],
        ['PAYE income tax', '− ' + money(open.tax_minor)],
        ['NSSF pension', '− ' + money(open.pension_minor)],
        ['Other deductions', '− ' + money(open.other_deduction_minor)],
        ['Payment method', open.payment_method],
        ['Paid on', open.paid_at ? formatDate(open.paid_at) : '—'],
      ]}
      asideLabel="Account"
      aside={[
        { label: 'Employee', value: open.employee?.name ?? profile?.name ?? '—' },
        { label: 'Role', value: profile?.role ?? '—' },
        { label: 'Bank', value: bank?.bank_name ?? '—' },
        { label: 'Account no', value: bank?.account_number ?? '—' },
        { label: 'Reference', value: open.reference },
      ]}
      footer={<><button className="primary-button" onClick={() => void downloadFile(`/api/payslips/${open.id}/pdf`, `${open.reference}.pdf`).then(() => setNotice('Payslip download started')).catch((cause) => setNotice(apiMessage(cause)))}><Download /> Download PDF</button></>}
      onClose={() => setOpenId(null)}
    />}
  </section>
}

function addDays(iso: string, days: number) {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  date.setMonth(date.getMonth() + Math.floor(days / 30))
  date.setDate(date.getDate() + (days % 30))
  return date.toISOString().slice(0, 10)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const contractDurations = [
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
  { label: '2 years', days: 730 },
  { label: '3 years', days: 1095 },
  { label: 'Unlimited', days: 0 },
]

type ContractDraft = {
  id: string
  employeeId: string
  typeId: string
  durationDays: number
  start: string
  salary: string
  description: string
  termination: string
  file: File | null
}

function newDraft(index: number): ContractDraft {
  return { id: `draft-${index}`, employeeId: '', typeId: '', durationDays: 365, start: new Date().toISOString().slice(0, 10), salary: '', description: '', termination: '', file: null }
}

function ContractsPage() {
  const { contracts, employees, reloadOne } = useHrData()
  const [drafts, setDrafts] = useState<ContractDraft[]>([newDraft(0)])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [types, setTypes] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    contractsApi.types()
      .then((result) => {
        setTypes(result.data)
        setDrafts((items) => items.map((draft) => ({ ...draft, typeId: draft.typeId || String(result.data[0]?.id ?? '') })))
      })
      .catch((cause) => setError(apiMessage(cause)))
  }, [])

  const open = contracts.items.find((item) => item.id === openId) ?? null
  if (open) return <ContractDetailPage contract={open} onBack={() => { setOpenId(null); void reloadOne('contracts') }} />

  const update = (id: string, patch: Partial<ContractDraft>) => setDrafts((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  const save = async (draft: ContractDraft) => {
    if (!draft.employeeId || !draft.typeId || !draft.start) {
      setError('Select an employee, a contract type, and a start date first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const person = employees.items.find((item) => item.id === Number(draft.employeeId))
      const created = await contractsApi.create({
        employee_id: Number(draft.employeeId),
        contract_type_id: Number(draft.typeId),
        start_date: draft.start,
        base_salary_minor: Number(draft.salary || person?.base_salary_minor || 0),
        duration_days: draft.durationDays,
        description: draft.description.trim() || null,
        termination_terms: draft.termination.trim() || null,
        status: 'draft',
      })
      await contractsApi.send(created.contract.id)
      if (draft.file) {
        const form = new FormData()
        form.append('employee_id', String(draft.employeeId))
        form.append('contract_id', String(created.contract.id))
        form.append('file', draft.file)
        await uploadDocument(form)
        await reloadOne('documents')
      }
      setDrafts([newDraft(0)])
      setSaved(true)
      await reloadOne('contracts')
      await reloadOne('notifications')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (contracts.status === 'loading') return <EmptyState label="Loading contracts" />
  if (contracts.status === 'error') return <EmptyState label="Could not load contracts" detail={contracts.error ?? undefined} />
  if (employees.status === 'loading') return <EmptyState label="Loading employees" />

  const items = contracts.items
  return <section className="management-page contract-page">
    <div className="workspace-hero"><div><p className="eyebrow">PEOPLE DOCUMENTS</p><h1>Contracts</h1><p>Draft agreements, control renewal dates, and keep every signed document on file.</p></div><button className="primary-button" onClick={() => setDrafts((items) => [...items, newDraft(items.length)])}><Plus /> Add contract</button></div>

    <div className="contract-steps">
      <div className="contract-step"><span>01</span><div><strong>Select employee</strong><p>Key personal and payroll details load automatically.</p></div></div>
      <div className="contract-step"><span>02</span><div><strong>Set terms</strong><p>Duration and dates, salary, description, termination.</p></div></div>
      <div className="contract-step"><span>03</span><div><strong>Send for signature</strong><p>The employee accepts from their portal.</p></div></div>
    </div>
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}

    {drafts.map((draft, index) => {
      const person = employees.items.find((record) => record.id === Number(draft.employeeId)) ?? null
      const end = draft.durationDays === 0 ? '' : addDays(draft.start, draft.durationDays - 1)
      const duration = contractDurations.find((item) => item.days === draft.durationDays)
      const kind = types.find((item) => String(item.id) === draft.typeId)?.name ?? ''
      return <div className="panel contract-draft" key={draft.id}>
        <div className="panel-heading"><div><p className="eyebrow">CONTRACT {String(index + 1).padStart(2, '0')}</p><h2>{person ? person.name : 'New contract'}</h2></div><div className="form-actions">{drafts.length > 1 && <button className="secondary-button" onClick={() => setDrafts((items) => items.filter((item) => item.id !== draft.id))}><Trash2 /> Remove</button>}<span className="status-pill">Draft</span></div></div>

        <div className="detail-fields profile-fields">
          <div className="detail-field"><small>Employee</small><select value={draft.employeeId} onChange={(event) => update(draft.id, { employeeId: event.target.value })}><option value="">Select employee</option>{employees.items.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></div>
          <div className="detail-field"><small>Contract type</small><select value={draft.typeId} onChange={(event) => update(draft.id, { typeId: event.target.value })}><option value="">Select type</option>{types.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        </div>

        {person ? <div className="contract-verified">
          <p className="eyebrow">VERIFIED EMPLOYEE DETAILS</p>
          <div className="detail-fields profile-fields">
            {[['Role', person.role ?? '—'], ['Department', person.department ?? '—'], ['Phone', person.phone ?? '—'], ['Email', person.email], ['NIDA', person.nida_number ?? '—'], ['TIN', person.tin ?? '—'], ['Base salary', money(person.base_salary_minor ?? 0)], ['Hire date', person.hire_date ? formatDate(person.hire_date) : '—']].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}
          </div>
        </div> : <div className="contract-placeholder"><ShieldCheck /><p>Select an employee to review their contact details, NIDA, TIN number and base salary before drafting terms.</p></div>}

        <div className="detail-fields profile-fields">
          <div className="detail-field"><small>Start date</small><input type="date" value={draft.start} onChange={(event) => update(draft.id, { start: event.target.value })} /></div>
          <div className="detail-field"><small>Contract duration</small><select value={draft.durationDays} onChange={(event) => update(draft.id, { durationDays: Number(event.target.value) })}>{contractDurations.map((item) => <option key={item.label} value={item.days}>{item.label}</option>)}</select></div>
          <div className="detail-field"><small>End date (auto)</small><input readOnly value={draft.durationDays === 0 ? 'No end date' : formatDate(end)} /></div>
          <div className="detail-field"><small>Base salary (TSh)</small><input type="number" min="0" value={draft.salary} onChange={(event) => update(draft.id, { salary: event.target.value })} placeholder={person ? String(person.base_salary_minor ?? '') : 'e.g. 4860000'} /></div>
          <div className="detail-field full"><small>Description</small><textarea rows={3} value={draft.description} onChange={(event) => update(draft.id, { description: event.target.value })} placeholder="Scope of duties, reporting line, and any special conditions" /></div>
          <div className="detail-field full"><small>Reason to terminate</small><textarea rows={3} value={draft.termination} onChange={(event) => update(draft.id, { termination: event.target.value })} placeholder="Notice period, severance terms, and conditions that end the agreement" /></div>
          <div className="detail-field full"><small>Signed contract PDF (optional)</small><label className="upload-box"><FileUp /><span>{draft.file ? draft.file.name : 'Upload the signed PDF or scanned image'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => update(draft.id, { file: event.target.files?.[0] ?? null })} /></label></div>
        </div>

        <div className="contract-summary"><p className="eyebrow">CONTRACT PREVIEW</p><div><span>Employee<strong>{person ? person.name : 'Not selected'}</strong></span><span>Type<strong>{kind || '—'}</strong></span><span>Duration<strong>{duration ? duration.label : '—'}</strong></span><span>Period<strong>{formatDate(draft.start)} — {draft.durationDays === 0 ? 'Open ended' : formatDate(end)}</strong></span></div></div>

        <div className="form-actions"><button className="secondary-button" onClick={() => setDrafts((items) => [...items, newDraft(items.length)])}><Plus /> Add more contract</button><button className="primary-button" disabled={busy} onClick={() => void save(draft)}><FileCheck2 /> {busy ? 'Saving…' : 'Save and send for signature'}</button></div>
      </div>
    })}

    {saved && <div className="panel contract-saved"><Sparkles /><div><strong>Contract saved and sent for signature</strong><p>The employee has been notified and can accept or decline from their portal.</p></div></div>}

    <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">{items.length} ON RECORD</p><h2>All contracts</h2></div></div>
      <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Reference</span><span>Employee</span><span>Period</span><span>Salary</span><span>Status</span><span /></div>{items.map((contract) => <div className="profile-table-row" key={contract.id}><strong>{contract.reference}</strong><span>{contract.employee?.name ?? '—'}</span><span>{formatDate(contract.start_date)} — {contract.open_ended ? 'Open ended' : formatDate(contract.end_date)}</span><span>{money(contract.base_salary_minor)}</span><span className="status-pill">{contract.status}</span><button className="ghost-icon" onClick={() => setOpenId(contract.id)} aria-label={`View ${contract.reference}`}><Eye /></button></div>)}
        {items.length === 0 && <div className="leave-empty"><FileCheck2 /><p>No contracts on record yet.</p></div>}</div>
    </div>
  </section>
}

function ContractDetailPage({ contract, onBack }: { contract: Contract; onBack: () => void }) {
  const { documents, reloadOne } = useHrData()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const uploads = documents.items.filter((item) => item.contract_id === contract.id)
  const send = async () => {
    setBusy(true)
    setError(null)
    try {
      await contractsApi.send(contract.id)
      await reloadOne('contracts')
      onBack()
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }
  return <section className="management-page profile-page">
    <button className="back-link" onClick={onBack}><ChevronDown /> Back to contracts</button>
    <div className="panel contract-hero">
      <div className="profile-hero-main"><div className="avatar avatar-large avatar-sand">{initialsFor(contract.employee?.name)}</div><div><p className="eyebrow">{contract.reference}</p><h1>{contract.kind ?? 'Contract'}</h1><p className="muted-copy">{contract.employee?.name ?? 'Unassigned'}{contract.signed_at ? ` · signed ${formatDate(contract.signed_at)}` : ''}</p><div className="profile-hero-tags"><span className="status-pill">{contract.status}</span><span className="status-pill">{formatDate(contract.start_date)} — {contract.open_ended ? 'Open ended' : formatDate(contract.end_date)}</span></div></div></div>
      <div className="form-actions"><button className="secondary-button" onClick={() => void downloadFile(`/api/contracts/${contract.id}/pdf`, `${contract.reference}.pdf`).catch((cause) => setError(apiMessage(cause)))}><Download /> Export as PDF</button>{contract.status === 'draft' && <button className="primary-button" disabled={busy} onClick={() => void send()}><FileText /> {busy ? 'Sending…' : 'Send for signature'}</button>}</div>
    </div>
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    <div className="count-widget-row count-widget-row-4"><CountWidget value={money(contract.base_salary_minor)} hint="base salary" tone="tone-gold" icon={WalletCards} foot="Monthly gross before deductions" /><CountWidget value={contract.days_left !== null && contract.days_left !== undefined ? `${contract.days_left} days` : 'Open ended'} hint="time remaining" tone="tone-blue" icon={Clock3} foot="Agreed term length" /><CountWidget value={formatDate(contract.start_date)} hint="start date" tone="tone-green" icon={CalendarDays} foot="Agreement commences" /><CountWidget value={contract.open_ended ? 'Open ended' : formatDate(contract.end_date)} hint="end date" tone="tone-rose" icon={FileCheck2} foot="Confirmed end of term" /></div>
    <div className="contract-columns">
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">TERMS</p><h2>Agreement overview</h2></div></div><div className="detail-fields profile-fields">{[['Employee', contract.employee?.name ?? '—'], ['Contract type', contract.kind ?? '—'], ['Reference', contract.reference], ['Signature status', contract.signed_at ? `Signed ${formatDate(contract.signed_at)}` : contract.status], ['Base salary', money(contract.base_salary_minor)], ['Description', contract.description ?? '—'], ['Termination terms', contract.termination_terms ?? '—'], ['Status', contract.status]].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div></article>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">DOCUMENT</p><h2>Contract file</h2></div><button className="secondary-button" onClick={() => void downloadFile(`/api/contracts/${contract.id}/pdf`, `${contract.reference}.pdf`).catch((cause) => setError(apiMessage(cause)))}><Download /> Download</button></div><div className="profile-document"><div className="department-icon"><FileText /></div><div><strong>{contract.reference}.pdf</strong><span>PDF document generated from this record</span></div></div><div className="profile-note"><ShieldCheck /><div><strong>Securely stored</strong><p>Only HR administrators and the contract owner can access this document.</p></div></div></article>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">UPLOADS</p><h2>Signed files on this contract</h2></div><span className="report-chip">{uploads.length} files</span></div>{uploads.length === 0 ? <EmptyState label="No signed files yet" detail="Upload the signed PDF when drafting the contract." /> : <div className="reg-documents">{uploads.map((item) => <div className="profile-document" key={item.id}><span className={`document-type-icon ${item.type === 'Image' ? 'is-image' : 'is-pdf'}`}>{item.type === 'Image' ? <FolderOpen /> : <FileText />}</span><div><strong>{item.name}</strong><span>{item.category ?? 'Document'} · {item.size} · {item.created_at ? formatDate(item.created_at) : ''}</span></div><span className={`status-pill ${item.status === 'verified' ? 'ok' : ''}`}>{item.status}</span><div className="employee-actions"><button onClick={() => void downloadFile(item.url, item.name).catch((cause) => setError(apiMessage(cause)))} aria-label={`Download ${item.name}`}><Download /></button></div></div>)}</div>}</article>
    </div>
  </section>
}

function EmployeeContractPage() {
  const { contracts, reloadOne } = useHrData()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mine = contracts.items
  const contract = mine.find((item) => item.status === 'pending_signature') ?? mine[0] ?? null

  const respond = async (decision: 'accepted' | 'declined') => {
    if (!contract) return
    setBusy(true)
    setError(null)
    try {
      await contractsApi.respond(contract.id, decision)
      await reloadOne('contracts')
      await reloadOne('notifications')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (contracts.status === 'loading') return <EmptyState label="Loading contract" />
  if (contracts.status === 'error') return <EmptyState label="Could not load contract" detail={contracts.error ?? undefined} />
  if (!contract) return <EmptyState label="No contract on file" detail="People Operations has not issued an agreement yet." />
  if (open) return <ContractDetailPage contract={contract} onBack={() => setOpen(false)} />
  const awaiting = contract.status === 'pending_signature'
  return <section className="management-page profile-page">
    <div className="workspace-hero"><div><p className="eyebrow">EMPLOYMENT</p><h1>My contract</h1><p>Review your current employment agreement, terms, and signed documents.</p></div></div>
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    <article className="panel contract-card-contract">
      <div className="contract-card-head"><div className="department-icon"><FileCheck2 /></div><div><p className="eyebrow">{contract.reference}</p><h2>{contract.kind ?? 'Contract'}</h2><p className="muted-copy">{contract.signed_at ? `Signed ${formatDate(contract.signed_at)}` : contract.status}</p></div><span className={`status-pill ${contract.status === 'active' ? 'ok' : contract.status === 'terminated' ? 'off' : ''}`}>{contract.status}</span></div>
      <div className="detail-fields profile-fields">{[['Start date', formatDate(contract.start_date)], ['End date', contract.open_ended ? 'Open ended' : formatDate(contract.end_date)], ['Base salary', money(contract.base_salary_minor)], ['Description', contract.description ?? '—'], ['Termination terms', contract.termination_terms ?? '—'], ['Reference', contract.reference]].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div className="profile-note"><FileText /><div><strong>{contract.reference}.pdf</strong><p>Issued by GoldenHR People Operations</p></div></div>
      <div className="form-actions"><button className="secondary-button" onClick={() => setOpen(true)}><Eye /> View contract</button><button className="secondary-button" onClick={() => void downloadFile(`/api/contracts/${contract.id}/pdf`, `${contract.reference}.pdf`).catch((cause) => setError(apiMessage(cause)))}><Download /> Download</button>{awaiting ? <><button className="primary-button" disabled={busy} onClick={() => void respond('accepted')}><FileCheck2 /> Accept contract</button><button className="secondary-button" disabled={busy} onClick={() => void respond('declined')}><X /> Decline</button></> : <span className="muted-copy">Status · {contract.status}</span>}</div>
    </article>
  </section>
}

function DocumentPreview({ doc, onClose }: { doc: HrDocument; onClose: () => void }) {
  const { reloadOne } = useHrData()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isImage = doc.type === 'Image'
  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await documentsApi.remove(doc.id)
      await reloadOne('documents')
      onClose()
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }
  const replace = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      await documentsApi.replace(doc.id, form)
      await reloadOne('documents')
      onClose()
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }
  return <AppModal
    eyebrow={(doc.category ?? 'Document') + ' · ' + doc.type}
    title={doc.name}
    meta={doc.reference + ' · ' + (doc.employee?.full_name ?? 'Unassigned') + ' · ' + doc.size + ' · added ' + formatDate(doc.created_at)}
    icon={isImage ? FolderOpen : FileText}
    status={doc.status}
    statusTone={doc.status === 'verified' ? 'ok' : 'warn'}
    asideLabel="Record"
    aside={[
      { label: 'Employee', value: doc.employee?.full_name ?? '—' },
      { label: 'Category', value: doc.category ?? '—' },
      { label: 'File type', value: doc.type },
      { label: 'Size', value: doc.size },
      { label: 'Status', value: doc.status },
    ]}
    footer={<><button className="primary-button" onClick={() => void downloadFile(doc.url, doc.name).catch((cause) => setError(apiMessage(cause)))}><Download /> Download {doc.type}</button><label className="secondary-button"><FileUp /> Replace<input hidden type="file" onChange={(event) => void replace(event.target.files?.[0] ?? null)} /></label><button className="secondary-button" disabled={busy} onClick={() => void remove()}><Trash2 /> Delete</button></>}
    onClose={onClose}
  >
    {error && <div className="password-error"><X /> {error}</div>}
    <div className={'document-canvas ' + (isImage ? 'is-image' : 'is-pdf')}>
      {isImage ? <img src={doc.preview_url} alt={'Preview of ' + doc.name} /> : <div className="document-sheet">
        <div className="document-sheet-head"><div className="brand-mark"><GoldMark /></div><div><strong>GOLDENHR</strong><span>People, elevated.</span></div></div>
        <h3>{doc.name.replace(/\.[a-z]+$/i, '')}</h3>
        <p className="document-sheet-meta">{doc.employee?.full_name ?? 'Unassigned'} · {doc.category ?? 'Document'}</p>
        <div className="document-sheet-lines">{[100, 92, 96, 70, 88, 94, 60, 90, 84, 72].map((width, index) => <i key={index} style={{ width: width + '%' }} />)}</div>
        <div className="document-sheet-sign"><span>Employee signature</span><span>Authorised signature</span></div>
        <p className="document-sheet-foot">Document reference {doc.reference} · issued by GoldenHR People Operations · {doc.status} record</p>
      </div>}
    </div>
  </AppModal>
}

function DocumentsPage() {
  const { documents, employees, reloadOne } = useHrData()
  const [category, setCategory] = useState('All')
  const [person, setPerson] = useState('All')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadEmployee, setUploadEmployee] = useState('')
  const [uploadCategory, setUploadCategory] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<DocCategory[]>([])

  useEffect(() => {
    documentsApi.categories().then((result) => setCategories(result.data)).catch(() => {})
  }, [])

  const items = documents.items
  const open = items.find((item) => item.id === openId) ?? null

  const visible = items.filter((item) =>
    (category === 'All' || (item.category ?? 'Uncategorized') === category) &&
    (person === 'All' || String(item.employee?.id ?? '') === person) &&
    `${item.name} ${item.employee?.full_name ?? ''} ${item.category ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  )
  const byEmployee = new Map<string, HrDocument[]>()
  for (const item of visible) {
    const key = item.employee ? `${item.employee.id}` : 'unassigned'
    byEmployee.set(key, [...(byEmployee.get(key) ?? []), item])
  }
  const grouped = [...byEmployee.entries()].map(([key, docs]) => ({ key, name: docs[0].employee?.full_name ?? 'Unassigned', docs }))

  const upload = async () => {
    if (!uploadEmployee || !uploadFile) {
      setError('Select an employee and a file to upload.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('employee_id', uploadEmployee)
      form.append('file', uploadFile)
      if (uploadCategory) form.append('category_id', uploadCategory)
      await uploadDocument(form)
      setShowUpload(false)
      setUploadFile(null)
      setUploadEmployee('')
      setUploadCategory('')
      setNotice('Document uploaded')
      await reloadOne('documents')
      await reloadOne('notifications')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setUploading(false)
    }
  }

  if (documents.status === 'loading') return <EmptyState label="Loading documents" />
  if (documents.status === 'error') return <EmptyState label="Could not load documents" detail={documents.error ?? undefined} />

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">DOCUMENT HUB</p><h1>Documents</h1><p>Every employee record in one place. Preview, download, and manage attachments.</p></div><button className="primary-button" onClick={() => setShowUpload(true)}><Upload /> Upload document</button></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>Document activity is recorded against the employee record.</p></div></div>}
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={`${items.length}`} hint="documents on file" tone="tone-gold" icon={FolderOpen} foot="Across every employee record" />
      <CountWidget value={`${new Set(items.map((item) => item.employee?.id ?? 0)).size}`} hint="employees covered" tone="tone-blue" icon={Users} foot="Profiles with attachments" />
      <CountWidget value={`${items.filter((item) => item.status === 'pending_review').length}`} hint="pending review" tone="tone-amber" icon={Clock3} foot="Waiting on People Ops" />
      <CountWidget value={`${items.filter((item) => item.status === 'expiring_soon').length}`} hint="expiring soon" tone="tone-rose" icon={FileCheck2} foot="Needs renewal this quarter" />
    </div>
    <div className="document-filters">
      <div className="profile-tabs" role="tablist">{['All', ...categories.map((item) => item.name)].map((item) => <button key={item} role="tab" aria-selected={category === item} className={`profile-tab ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="document-filters-right">
        <select className="inline-select" value={person} onChange={(event) => setPerson(event.target.value)}><option value="All">All employees</option>{employees.items.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select>
        <div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents" /></div>
      </div>
    </div>
    <div className="document-groups">
      {grouped.map(({ key, name, docs }) => {
        return <article className="panel document-group" key={key}>
          <div className="document-group-head">
            <div className={`avatar avatar-sand ${toneFor(key)}`}>{initialsFor(name)}</div>
            <div><strong>{name}</strong><span>{docs.length} document{docs.length === 1 ? '' : 's'}</span></div>
            <span className="status-pill">{docs.length} document{docs.length === 1 ? '' : 's'}</span>
          </div>
          <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Document</span><span>Category</span><span>Type</span><span>Size</span><span>Status</span><span>Added</span><span /></div>
            {docs.map((item) => <div className="profile-table-row" key={item.id}>
              <span className="role-person"><span className={`document-type-icon ${item.type === 'Image' ? 'is-image' : 'is-pdf'}`}>{item.type === 'Image' ? <FolderOpen /> : <FileText />}</span><strong>{item.name}</strong></span>
              <span>{item.category ?? '—'}</span>
              <span>{item.type}</span>
              <span>{item.size}</span>
              <span className={`status-pill ${item.status === 'verified' ? 'ok' : item.status === 'expiring_soon' ? 'off' : ''}`}>{item.status}</span>
              <span>{formatDate(item.created_at)}</span>
              <span className="employee-actions"><button onClick={() => setOpenId(item.id)} aria-label={`View ${item.name}`}><Eye /></button><button onClick={() => void downloadFile(item.url, item.name).catch((cause) => setError(apiMessage(cause)))} aria-label={`Download ${item.name}`}><Download /></button></span>
            </div>)}
          </div>
          <div className="document-group-foot"><span><ShieldCheck /> Only HR administrators and {name} can access these files.</span></div>
        </article>
      })}
      {grouped.length === 0 && <div className="panel leave-empty"><FolderOpen /><p>No documents match your filters.</p></div>}
    </div>
    {open && <DocumentPreview doc={open} onClose={() => setOpenId(null)} />}
    {showUpload && <AppModal eyebrow="Document hub" title="Upload document" meta="Attach a file to an employee record." icon={Upload} footer={<><button className="secondary-button" onClick={() => setShowUpload(false)}>Cancel</button><button className="primary-button" disabled={uploading} onClick={() => void upload()}><Upload /> {uploading ? 'Uploading…' : 'Upload'}</button></>} onClose={() => setShowUpload(false)}>
      {error && <div className="password-error"><X /> {error}</div>}
      <div className="form-grid">
        <Field label="Employee"><select value={uploadEmployee} onChange={(event) => setUploadEmployee(event.target.value)}><option value="">Select employee</option>{employees.items.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></Field>
        <Field label="Category"><select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)}><option value="">No category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="File" full><label className="upload-box"><FileUp /><span>{uploadFile ? uploadFile.name : 'Choose a PDF or image'}</span><input type="file" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} /></label></Field>
      </div>
    </AppModal>}
  </section>
}
const methodValue = (method: string) => (method === 'Bank transfer' ? 'bank_transfer' : 'mobile_money')

function ReceiptSheet({ request, onPrint }: { request: ApiMoneyRequest; onPrint: () => void }) {
  const [error, setError] = useState<string | null>(null)
  return <article className="panel receipt-sheet" id="receipt-sheet">
    <div className="receipt-top">
      <div className="receipt-brand"><div className="brand-mark"><GoldMark /></div><div><strong>GOLDENHR</strong><span>People, elevated.</span></div></div>
      <div className="receipt-stamp"><ShieldCheck /><span>{request.receipt_number ?? request.reference}</span><small>OFFICIAL RECEIPT</small></div>
    </div>
    <div className="receipt-title"><h2>Money request receipt</h2><p>Issued {request.created_at ? formatDate(request.created_at) : ''}</p></div>
    <div className="receipt-parties">
      <div><small>REQUESTED BY</small><strong>{request.employee?.name ?? '-'}</strong><span>{request.kind ?? 'Money request'}</span></div>
      <div><small>ISSUED BY</small><strong>GoldenHR People Operations</strong><span>{request.decided_by || 'Pending approval'}</span></div>
    </div>
    <div className="receipt-table">
      <div className="receipt-row receipt-row-head"><span>Description</span><span>Amount</span></div>
      <div className="receipt-row"><span>{request.kind ?? '-'}</span><span>{money(request.amount_minor)}</span></div>
      <div className="receipt-row"><span>Payment method</span><span>{request.method}</span></div>
      <div className="receipt-row"><span>Needed by</span><span>{request.needed_by ? formatDate(request.needed_by) : '-'}</span></div>
      <div className="receipt-row receipt-row-total"><span>Total requested</span><span>{money(request.amount_minor)}</span></div>
    </div>
    <div className="receipt-reason"><small>REASON GIVEN</small><p>{request.reason || 'No reason given.'}</p></div>
    <div className="receipt-status">
      <span className={`status-pill ${request.status === 'paid' ? 'ok' : request.status === 'declined' ? 'off' : ''}`}>{request.status}</span>
      {request.decided_on && <p>{request.status} by {request.decided_by} on {formatDate(request.decided_on)}{request.note ? ` - ${request.note}` : ''}</p>}
      {!request.decided_on && <p>Awaiting a decision from the People Operations team.</p>}
    </div>
    <div className="receipt-sign"><div><span>Employee signature</span></div><div><span>Authorised signature</span></div></div>
    <p className="receipt-foot">This receipt confirms a money request submitted through GoldenHR. Retain it for your records. Reference {request.reference} - {request.receipt_number ?? 'no receipt yet'}</p>
    {error && <div className="password-error"><X /> {error}</div>}
    <div className="form-actions no-print"><button className="secondary-button" onClick={() => void downloadFile(`/api/money-requests/${request.id}/receipt-pdf`, `${request.receipt_number ?? request.reference}.pdf`).catch((cause) => setError(apiMessage(cause)))}><Download /> Download receipt</button><button className="primary-button" onClick={onPrint}><FileText /> Export as PDF</button></div>
  </article>
}
function MoneyRequestDetail({ request, isEmployee, onBack, onDecide }: { request: ApiMoneyRequest; isEmployee: boolean; onBack: () => void; onDecide: (id: number, action: 'approved' | 'declined' | 'paid') => void }) {
  return <section className="management-page profile-page">
    <button className="back-link" onClick={onBack}><ChevronDown /> Back to money requests</button>
    <div className="panel profile-hero">
      <div className="profile-hero-main"><div className={`avatar avatar-large ${toneFor(request.employee?.id ?? request.id)}`}>{request.employee?.initials ?? '-'}</div><div><p className="eyebrow">{request.reference} - {request.receipt_number ?? 'no receipt'}</p><h1>{request.kind ?? 'Money request'}</h1><p className="muted-copy">{request.employee?.name ?? '-'} - {money(request.amount_minor)}{request.created_at ? ` - submitted ${formatRelative(request.created_at)}` : ''}</p><div className="profile-hero-tags"><span className={`status-pill ${request.status === 'paid' ? 'ok' : request.status === 'declined' ? 'off' : ''}`}>{request.status}</span><span className="status-pill">{request.method}</span></div></div></div>
      {!isEmployee && request.status === 'pending' && <div className="form-actions"><button className="secondary-button" onClick={() => onDecide(request.id, 'declined')}><X /> Decline</button><button className="primary-button" onClick={() => onDecide(request.id, 'approved')}><FileCheck2 /> Approve</button></div>}
      {!isEmployee && request.status === 'approved' && <div className="form-actions"><button className="primary-button" onClick={() => onDecide(request.id, 'paid')}><WalletCards /> Mark as paid</button></div>}
    </div>
    <ReceiptSheet request={request} onPrint={() => window.print()} />
  </section>
}
function MoneyRequestPage({ isEmployee }: { isEmployee: boolean }) {
  const { moneyRequests, employeeId, reloadOne } = useHrData()
  const [openId, setOpenId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'All' | 'pending' | 'approved' | 'paid' | 'declined'>('All')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [types, setTypes] = useState<MoneyTypeRef[]>([])
  const [limit, setLimit] = useState<number | null>(null)
  const [typeId, setTypeId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [neededBy, setNeededBy] = useState('')
  const [method, setMethod] = useState('Mobile money')
  const [receipt, setReceipt] = useState<File | null>(null)

  useEffect(() => {
    moneyApi.types().then((result) => {
      setTypes(result.data)
      if (result.data.length > 0) setTypeId((current) => current || String(result.data[0].id))
    }).catch(() => {})
    moneyApi.list({ per_page: 1 }).then((result) => setLimit(result.meta.limit_minor ?? null)).catch(() => {})
  }, [])

  const requests = moneyRequests.items
  const open = requests.find((request) => request.id === openId) ?? null
  const requested = requests.filter((request) => request.status === 'pending' || request.status === 'approved').reduce((sum, request) => sum + request.amount_minor, 0)
  const available = limit !== null ? Math.max(0, limit - requested) : null
  const visible = requests.filter((request) => filter === 'All' || request.status === filter)

  const decide = async (id: number, action: 'approved' | 'declined' | 'paid') => {
    setBusy(true)
    setError(null)
    try {
      if (action === 'approved') await moneyApi.approve(id)
      else if (action === 'declined') await moneyApi.decline(id)
      else await moneyApi.markPaid(id)
      const record = requests.find((item) => item.id === id)
      setNotice(`${record?.employee?.name ?? 'Request'} ${action}`)
      await reloadOne('moneyRequests')
      await reloadOne('notifications')
      setOpenId(null)
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const value = Number(amount)
    if (!value || !typeId) return
    const selected = types.find((item) => String(item.id) === typeId) ?? null
    if (selected?.requires_receipt && !receipt) {
      setError('This request type needs a supporting receipt. Attach the file below.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      let documentId: number | null = null
      if (receipt) {
        if (!employeeId) throw new Error('No employee record is linked to this account.')
        const form = new FormData()
        form.append('employee_id', String(employeeId))
        form.append('file', receipt)
        const uploaded = await uploadDocument(form)
        documentId = uploaded.document.id
      }
      await moneyApi.submit({
        money_request_type_id: Number(typeId),
        amount_minor: Math.round(value),
        reason: reason.trim() || null,
        needed_by: neededBy || null,
        payment_method: methodValue(method),
        document_id: documentId,
      })
      setAmount('')
      setReason('')
      setNeededBy('')
      setReceipt(null)
      setCreating(false)
      setNotice('Money request submitted')
      await reloadOne('moneyRequests')
      await reloadOne('documents')
      await reloadOne('notifications')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (moneyRequests.status === 'loading') return <EmptyState label="Loading money requests" />
  if (moneyRequests.status === 'error') return <EmptyState label="Could not load money requests" detail={moneyRequests.error ?? undefined} />

  if (open) return <MoneyRequestDetail request={open} isEmployee={isEmployee} onBack={() => setOpenId(null)} onDecide={(id, action) => void decide(id, action)} />

  if (isEmployee && creating) return <section className="form-page">
    <button className="back-link" onClick={() => setCreating(false)}><ChevronDown /> Back to money requests</button>
    <div className="workspace-hero"><div><p className="eyebrow">FINANCE</p><h1>Request money</h1><p>Send an advance or claim to People Operations and track the decision.</p></div></div>
    <div className="leave-balance money-limit"><CircleDollarSign /><div><strong>{available !== null ? `${money(available)} available` : 'Limit unavailable'}</strong><p>{limit !== null ? `Advance limit ${money(limit)} - ${money(requested)} already requested` : 'Your current requests total ' + money(requested)}</p></div></div>
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    <form className="panel" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Request type"><select value={typeId} onChange={(event) => setTypeId(event.target.value)}>{types.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Amount requested"><input required type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="e.g. 500000" /></Field>
        <Field label="Needed by"><input type="date" value={neededBy} onChange={(event) => setNeededBy(event.target.value)} /></Field>
        <Field label="Payment method"><select value={method} onChange={(event) => setMethod(event.target.value)}><option>Mobile money</option><option>Bank transfer</option></select></Field>
        <Field label="Supporting receipt" full><label className="upload-box"><FileUp /><span>{receipt ? receipt.name : 'Attach the receipt, invoice, or prescription'}</span><input type="file" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} /></label></Field>
        <Field label="Reason for the request" full><textarea required rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain what the money is for and attach any supporting detail" /></Field>
        {amount && available !== null && <Field label="Remaining after approval" full><div className="leave-balance money-limit"><Sparkles /><div><strong>{money(Math.max(0, available - Number(amount)))} remaining</strong><p>{types.find((item) => String(item.id) === typeId)?.name ?? ''} - {neededBy ? `needed by ${formatDate(neededBy)}` : 'add a date'}</p></div></div></Field>}
      </div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setCreating(false)}>Cancel</button><button className="primary-button" type="submit" disabled={busy}><CircleDollarSign /> {busy ? 'Sending...' : 'Send request to HR'}</button></div>
    </form>
  </section>

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">FINANCE</p><h1>{isEmployee ? 'Money request' : 'Money requests'}</h1><p>{isEmployee ? 'Request an advance or claim, and keep every receipt in one place.' : 'Review advances and claims, approve them, and issue official receipts.'}</p></div>{isEmployee && <button className="primary-button" onClick={() => setCreating(true)}><Plus /> New request</button>}</div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>{isEmployee ? 'People Operations has been notified.' : 'The employee has been notified and the receipt updated.'}</p></div></div>}
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={limit !== null && isEmployee ? compact(available ?? 0) : compact(requests.reduce((sum, request) => sum + request.amount_minor, 0))} hint={isEmployee ? 'available limit' : 'total requested'} tone="tone-gold" icon={CircleDollarSign} foot={isEmployee ? (limit !== null ? `Of ${compact(limit)} advance limit` : 'Your open requests') : 'All requests raised'} />
      <CountWidget value={`${requests.filter((request) => request.status === 'pending').length}`} hint="pending approval" tone="tone-amber" icon={Clock3} foot="Waiting on a decision" />
      <CountWidget value={compact(requests.filter((request) => request.status === 'approved' || request.status === 'paid').reduce((sum, request) => sum + request.amount_minor, 0))} hint="approved" tone="tone-green" icon={FileCheck2} foot="Cleared for payment" />
      <CountWidget value={compact(requests.filter((request) => request.status === 'paid').reduce((sum, request) => sum + request.amount_minor, 0))} hint="paid out" tone="tone-blue" icon={WalletCards} foot="Disbursed to date" />
    </div>
    <div className="profile-tabs" role="tablist">{(['pending', 'approved', 'paid', 'declined', 'All'] as const).map((key) => <button key={key} role="tab" aria-selected={filter === key} className={`profile-tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}><WalletCards />{key === 'All' ? 'All requests' : key}</button>)}</div>
    <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">{visible.length} SHOWN</p><h2>{filter === 'All' ? 'All requests' : `${filter} requests`}</h2></div></div>
      <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Request</span><span>Employee</span><span>Amount</span><span>Method</span><span>Status</span><span>Receipt</span><span /></div>
        {visible.map((request) => <div className="profile-table-row" key={request.id}>
          <span><strong>{request.kind ?? '-'}</strong></span>
          <span>{isEmployee ? 'You' : request.employee?.name ?? '-'}</span>
          <span className="payroll-net-cell">{money(request.amount_minor)}</span>
          <span>{request.method}</span>
          <span className={`status-pill ${request.status === 'paid' ? 'ok' : request.status === 'declined' ? 'off' : ''}`}>{request.status}</span>
          <span className="receipt-no">{request.receipt_number ?? request.reference}</span>
          <span className="employee-actions"><button onClick={() => setOpenId(request.id)} aria-label={`View receipt for ${request.reference}`}><Eye /></button>{!isEmployee && request.status === 'pending' && <><button disabled={busy} onClick={() => void decide(request.id, 'declined')} aria-label={`Decline ${request.reference}`}><X /></button><button disabled={busy} onClick={() => void decide(request.id, 'approved')} aria-label={`Approve ${request.reference}`}><FileCheck2 /></button></>}{!isEmployee && request.status === 'approved' && <button disabled={busy} onClick={() => void decide(request.id, 'paid')} aria-label={`Mark ${request.reference} paid`}><WalletCards /></button>}<button onClick={() => void downloadFile(`/api/money-requests/${request.id}/receipt-pdf`, `${request.receipt_number ?? request.reference}.pdf`).catch((cause) => setError(apiMessage(cause)))} aria-label={`Download receipt for ${request.reference}`}><Download /></button></span>
        </div>)}
        {visible.length === 0 && <div className="leave-empty"><WalletCards /><p>No {filter === 'All' ? '' : filter + ' '}requests right now.</p></div>}
      </div>
    </div>
  </section>
}
function RegistrationInfo({ employeeId, mode, onBack }: { employeeId: number | null; mode: 'self' | 'hr'; onBack: () => void }) {
  const { documents, contracts, reloadOne } = useHrData()
  const isSelf = mode === 'self'
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selfReg, setSelfReg] = useState<Registration | null>(null)
  const [selfStatus, setSelfStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hrProfile, setHrProfile] = useState<Employee | null>(null)
  const [hrStatus, setHrStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [values, setValues] = useState({ name: '', email: '', phone: '', birth: '', start: '', hire: '', nida: '', tin: '', address: '', emergencyName: '', emergencyPhone: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }))

  useEffect(() => {
    if (!isSelf) return
    setSelfStatus('loading')
    registrationApi.get()
      .then((result) => { setSelfReg(result); setSelfStatus('ready') })
      .catch(() => setSelfStatus('error'))
  }, [isSelf])

  useEffect(() => {
    if (isSelf || employeeId === null) return
    setHrStatus('loading')
    employeesApi.get(employeeId)
      .then((result) => {
        const person = result.employee
        setHrProfile(person)
        setValues({
          name: person.name ?? '', email: person.email ?? '', phone: person.phone ?? '',
          birth: toIsoDate(person.date_of_birth), start: toIsoDate(person.start_date), hire: toIsoDate(person.hire_date),
          nida: person.nida_number ?? '', tin: person.tin ?? '', address: person.address ?? '',
          emergencyName: person.emergency_contact_name ?? '', emergencyPhone: person.emergency_contact_phone ?? '',
        })
        setHrStatus('ready')
      })
      .catch(() => setHrStatus('error'))
  }, [isSelf, employeeId])

  if (isSelf && selfStatus === 'loading') return <EmptyState label="Loading registration info" detail="Fetching your personal record." />
  if (isSelf && (selfStatus === 'error' || !selfReg)) return <EmptyState label="Could not load registration info" />
  if (!isSelf && hrStatus === 'loading') return <EmptyState label="Loading employee record" />
  if (!isSelf && (hrStatus === 'error' || !hrProfile)) return <EmptyState label="Could not load employee record" />

  const profile = isSelf ? selfReg!.profile : hrProfile!
  const bankAccounts = isSelf ? selfReg!.bank_accounts : []
  const primaryBank = bankAccounts.find((account) => account.is_primary) ?? bankAccounts[0] ?? null
  const docs = isSelf
    ? selfReg!.documents.map((item) => ({ id: item.id, name: item.name, kind: item.category ?? 'Document', type: item.type, added: item.created_at ? formatDate(item.created_at) : '', status: item.status, url: item.url }))
    : documents.items.filter((item) => item.employee?.id === employeeId).map((item) => ({ id: item.id, name: item.name, kind: item.category ?? 'Document', type: item.type, size: item.size, added: item.created_at ? formatDate(item.created_at) : '', status: item.status, url: item.url }))
  const contract = isSelf
    ? selfReg!.contract
    : contracts.items.find((item) => item.employee?.id === employeeId) ?? null

  const name = profile.name ?? ''
  const email = profile.email ?? ''
  const department = profile.department ?? 'No department'
  const role = profile.role ?? 'No role'
  const empType = profile.employment_type_label ?? profile.employment_type
  const salaryMinor = !isSelf ? (hrProfile?.base_salary_minor ?? null) : null

  const filled = [name, email, profile.phone, profile.date_of_birth, profile.address, profile.nida_number, department !== 'No department' ? department : '', bankAccounts.length > 0 ? 'bank' : ''].filter(Boolean).length
  const completeness = Math.round((filled / 8) * 100)

  const save = async () => {
    if (isSelf || !hrProfile) return
    setBusy(true)
    setError(null)
    try {
      await employeesApi.update(hrProfile.id, {
        name: values.name.trim(), email: values.email.trim(),
        phone: values.phone.trim() || null, date_of_birth: values.birth || null,
        start_date: values.start || null, hire_date: values.hire || null,
        nida_number: values.nida.trim() || null, tin: values.tin.trim() || null,
        address: values.address.trim() || null,
        emergency_contact_name: values.emergencyName.trim() || null,
        emergency_contact_phone: values.emergencyPhone.trim() || null,
      })
      if (avatarFile) {
        const form = new FormData()
        form.append('file', avatarFile)
        await employeesApi.avatar(hrProfile.id, form)
        setAvatarFile(null)
      }
      const result = await employeesApi.get(hrProfile.id)
      setHrProfile(result.employee)
      setEditing(false)
      setSaved(true)
      await reloadOne('employees')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const docTotal = docs.length
  const docPdfs = docs.filter((item) => item.type === 'PDF').length
  const docImages = docs.filter((item) => item.type === 'Image').length
  const docVerified = docs.filter((item) => item.status === 'verified').length
  const tone = toneFor(employeeId ?? 0)

  return <section className="management-page profile-page">
    <button className="back-link" onClick={onBack}><ChevronDown /> {isSelf ? 'Back to workspace' : `Back to employee management`}</button>
    <div className="workspace-hero"><div><p className="eyebrow">{isSelf ? 'Personal details' : 'People directory'}</p><h1>{isSelf ? 'Registration info' : `${name} - registration`}</h1><p>{isSelf ? 'Your personal, legal and banking details as held on your employee record.' : `Personal, legal and banking details on file for ${name}.`}</p></div>{!editing && !isSelf && <button className="primary-button" onClick={() => setEditing(true)}><Pencil /> Edit information</button>}</div>
    {saved && <div className="panel contract-saved"><Sparkles /><div><strong>Registration info updated</strong><p>{isSelf ? 'People Operations has been notified of your changes.' : `Changes were written to ${name}'s record in the people directory.`}</p></div></div>}
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}

    <article className="panel reg-hero">
      <div className="reg-hero-top">
        <div className="reg-photo"><div className={`reg-photo-frame ${tone}`}>{initialsFor(name)}</div>{editing && <label className="reg-photo-upload"><Upload /><span>{avatarFile ? avatarFile.name : 'Replace'}</span><input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} /></label>}</div>
        <div className="reg-hero-copy">
          <p className="eyebrow">Employee profile</p>
          <h1>{editing ? values.name : name}</h1>
          <p className="muted-copy">{role} - {department} - {empType}</p>
          <div className="profile-hero-tags"><span className="status-pill ok">{profile.status}</span><span className="status-pill">Hired {profile.hire_date ? formatDate(profile.hire_date) : '-'}</span><span className="status-pill">Verified</span></div>
        </div>
        <div className="reg-hero-meta">
          <div><small>Employee ID</small><strong>{profile.employee_code}</strong></div>
          <div><small>Reports to</small><strong>{department} lead</strong></div>
          <div><small>Work location</small><strong>Dar es Salaam, TZ</strong></div>
        </div>
      </div>
      <div className="reg-progress">
        <div><span style={{ width: `${completeness}%` }} /></div>
        <p>Profile completeness <strong>{completeness}%</strong></p>
      </div>
    </article>

    <div className="reg-columns">
      <div className="reg-main">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Personal</p><h2>Personal details</h2></div>{editing ? <button className="secondary-button" disabled={busy} onClick={() => void save()}><FileCheck2 /> {busy ? 'Saving...' : 'Save changes'}</button> : !isSelf ? <button className="more-button" onClick={() => setEditing(true)}><Pencil /> Edit</button> : null}</div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Full legal name</small>{editing ? <input value={values.name} onChange={(event) => set({ name: event.target.value })} /> : <strong>{name}</strong>}</div>
            <div className="detail-field"><small>Date of birth</small>{editing ? <input type="date" value={values.birth} onChange={(event) => set({ birth: event.target.value })} /> : <strong>{profile.date_of_birth ? formatDate(profile.date_of_birth) : '-'}</strong>}</div>
            <div className="detail-field"><small>Email address</small>{editing ? <input type="email" value={values.email} onChange={(event) => set({ email: event.target.value })} /> : <strong>{email}</strong>}</div>
            <div className="detail-field"><small>Phone number</small>{editing ? <input type="tel" value={values.phone} onChange={(event) => set({ phone: event.target.value })} /> : <strong>{profile.phone ?? '-'}</strong>}</div>
            <div className="detail-field full"><small>Residential address</small>{editing ? <textarea rows={2} value={values.address} onChange={(event) => set({ address: event.target.value })} /> : <strong>{profile.address ?? '-'}</strong>}</div>
            <div className="detail-field full"><small>Emergency contact</small>{editing ? <input value={values.emergencyName} onChange={(event) => set({ emergencyName: event.target.value })} /> : <strong>{profile.emergency_contact_name ?? '-'}{profile.emergency_contact_phone ? ` - ${profile.emergency_contact_phone}` : ''}</strong>}</div>
          </div>
          {isSelf && <div className="profile-note"><ShieldCheck /><div><strong>Need a change?</strong><p>Legal name, NIDA and TIN changes need a supporting document. Email people@goldenhr.com.</p></div></div>}
        </article>

        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Employment</p><h2>Work and registration</h2></div>{editing && !isSelf && <span className="status-pill">HR edit access</span>}</div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Start working date</small>{editing ? <input type="date" value={values.start} onChange={(event) => set({ start: event.target.value })} /> : <strong>{profile.start_date ? formatDate(profile.start_date) : '-'}</strong>}</div>
            <div className="detail-field"><small>Hire date</small>{editing ? <input type="date" value={values.hire} onChange={(event) => set({ hire: event.target.value })} /> : <strong>{profile.hire_date ? formatDate(profile.hire_date) : '-'}</strong>}</div>
            <div className="detail-field"><small>NIDA number</small>{editing ? <input value={values.nida} onChange={(event) => set({ nida: event.target.value })} /> : <strong>{profile.nida_number ?? '-'}</strong>}</div>
            <div className="detail-field"><small>TIN</small>{editing ? <input value={values.tin} onChange={(event) => set({ tin: event.target.value })} /> : <strong>{profile.tin ?? '-'}</strong>}</div>
            <div className="detail-field"><small>Department</small><strong>{department}</strong></div>
            <div className="detail-field"><small>Role</small><strong>{role}</strong></div>
            <div className="detail-field"><small>Employment type</small><strong>{empType}</strong></div>
            {isSelf
              ? <div className="detail-field reg-locked"><small>Monthly salary</small><strong>Managed by People Operations <ShieldCheck /></strong><small>Salary details are held by People Operations</small></div>
              : <div className="detail-field"><small>Monthly salary</small><strong>{salaryMinor !== null ? money(salaryMinor) : '-'}</strong></div>}
          </div>
        </article>

        {contract && <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">AGREEMENT</p><h2>Current contract</h2></div><span className="status-pill">{contract.status}</span></div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Reference</small><strong>{contract.reference}</strong></div>
            <div className="detail-field"><small>Type</small><strong>{contract.kind ?? '-'}</strong></div>
            <div className="detail-field"><small>Start date</small><strong>{contract.start_date ? formatDate(contract.start_date) : '-'}</strong></div>
            <div className="detail-field"><small>End date</small><strong>{contract.end_date ? formatDate(contract.end_date) : 'Open ended'}</strong></div>
          </div>
        </article>}

        {isSelf && <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Banking</p><h2>Payment details</h2></div></div>
          {bankAccounts.length === 0 && <EmptyState label="No bank details on file" />}
          <div className="detail-fields profile-fields">
            {bankAccounts.map((account) => <div className="detail-field" key={account.id}><small>{account.type}{account.is_primary ? ' - primary' : ''}</small><strong>{account.bank_name ?? '-'} - {account.account_number ?? '-'}</strong></div>)}
          </div>
          {primaryBank?.is_verified && <div className="profile-note"><ShieldCheck /><div><strong>Bank details verified</strong><p>Confirmed against the submitted bank confirmation document.</p></div></div>}
        </article>}
      </div>

      <aside className="reg-side">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Attached documents</p><h2>On this record</h2></div><span className="report-chip">{docTotal} files</span></div><div className="doc-summary"><div><small>Total files</small><strong>{docTotal}</strong></div><div><small>PDF</small><strong>{docPdfs}</strong></div><div><small>Images</small><strong>{docImages}</strong></div><div><small>Verified</small><strong>{docVerified}</strong></div></div>
          <div className="reg-documents">{docs.map((item) => <div className="profile-document" key={item.id}><span className={`document-type-icon ${item.type === 'Image' ? 'is-image' : 'is-pdf'}`}>{item.type === 'Image' ? <FolderOpen /> : <FileText />}</span><div><strong>{item.name}</strong><span>{item.kind} - {item.added}</span></div><span className={`status-pill ${item.status === 'verified' ? 'ok' : ''}`}>{item.status}</span><div className="employee-actions"><button onClick={() => void downloadFile(item.url, item.name).catch((cause) => setError(apiMessage(cause)))} aria-label={`Download ${item.name}`}><Download /></button></div></div>)}</div>
        </article>
        <article className="panel reg-support"><div className="department-icon"><LifeBuoy /></div><div><strong>{isSelf ? 'Need a change?' : 'Verification note'}</strong><p>{isSelf ? 'Legal name, NIDA and TIN changes need a supporting document. Email people@goldenhr.com.' : 'Name, NIDA and TIN edits are recorded against the employee record with your administrator ID.'}</p></div></article>
      </aside>
    </div>
  </section>
}
type NoticeKind = 'payroll' | 'money' | 'contract' | 'role' | 'department' | 'employee' | 'document' | 'leave' | 'security'
type NoticeItem = {
  id: string; kind: NoticeKind; title: string; detail: string; actor: string
  time: string; audience: 'HR' | 'Employee' | 'Both'; read: boolean
}

const kindMeta: Record<NoticeKind, { label: string; icon: typeof Users }> = {
  payroll: { label: 'Payroll', icon: WalletCards },
  money: { label: 'Money request', icon: CircleDollarSign },
  contract: { label: 'Contract', icon: FileCheck2 },
  role: { label: 'Role change', icon: ShieldCheck },
  department: { label: 'Department', icon: Building2 },
  employee: { label: 'Employee', icon: UserPlus },
  document: { label: 'Document', icon: FolderOpen },
  leave: { label: 'Leave', icon: CalendarDays },
  security: { label: 'Security', icon: Settings },
}

function NotificationsPage({ isEmployee }: { isEmployee: boolean }) {
  const { notifications, unreadCount, reloadOne } = useHrData()
  const [filter, setFilter] = useState<'All' | NoticeKind>('All')

  const notices: NoticeItem[] = notifications.items.map((entry) => ({
    id: String(entry.id),
    kind: noticeKindFor(entry.kind),
    title: entry.title ?? '',
    detail: entry.detail ?? '',
    actor: 'GoldenHR',
    time: formatRelative(entry.created_at) ?? '',
    audience: 'Both',
    read: entry.read,
  }))

  const visible = notices.filter((item) => filter === 'All' || item.kind === filter)
  const unread = unreadCount
  const kinds = Array.from(new Set(visible.map((item) => item.kind)))

  const markAll = async () => {
    await notificationsApi.markAllRead()
    reloadOne('notifications')
  }

  const markOne = async (id: string) => {
    await notificationsApi.markRead(id)
    reloadOne('notifications')
  }

  const dismissOne = async (id: string) => {
    await notificationsApi.remove(id)
    reloadOne('notifications')
  }

  if (notifications.status === 'loading') return <EmptyState label="Loading notifications" />
  if (notifications.status === 'error') return <EmptyState label="Could not load notifications" detail={notifications.error ?? undefined} />

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">UPDATES</p><h1>Notifications</h1><p>Payroll, money requests, contracts, roles and security events in one feed.</p></div>{unread > 0 && <button className="secondary-button" onClick={markAll}><FileCheck2 /> Mark all as read</button>}</div>
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={`${unread}`} hint="unread" tone="tone-gold" icon={Bell} foot="Waiting for you to open" />
      <CountWidget value={`${visible.length}`} hint="total updates" tone="tone-blue" icon={Activity} foot="Across this feed" />
      <CountWidget value={`${visible.filter((item) => item.kind === 'payroll').length}`} hint="payroll events" tone="tone-green" icon={WalletCards} foot="Runs created and approved" />
      <CountWidget value={`${visible.filter((item) => item.kind === 'money').length}`} hint="money requests" tone="tone-amber" icon={CircleDollarSign} foot="Submitted and decided" />
    </div>
    <div className="profile-tabs" role="tablist"><button role="tab" aria-selected={filter === 'All'} className={`profile-tab ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}><Bell />All</button>{kinds.map((kind) => { const Icon = kindMeta[kind].icon; return <button key={kind} role="tab" aria-selected={filter === kind} className={`profile-tab ${filter === kind ? 'active' : ''}`} onClick={() => setFilter(kind)}><Icon />{kindMeta[kind].label}</button> })}</div>
    <div className="panel">
      <div className="notification-list">
        {visible.map((item) => { const Icon = kindMeta[item.kind].icon; return <article className={`notification-row ${item.read ? '' : 'unread'}`} key={item.id}>
          <span className={`notification-icon ${item.kind}`}><Icon /></span>
          <div className="notification-copy"><div className="notification-head"><strong>{item.title}</strong><span className="notification-kind">{kindMeta[item.kind].label}</span>{!item.read && <i className="notification-dot" />}</div><p>{item.detail}</p><span className="notification-meta">{item.actor} · {item.time}</span></div>
          <div className="employee-actions"><button onClick={() => markOne(item.id)} aria-label={`Mark ${item.title} as read`}><FileCheck2 /></button><button onClick={() => dismissOne(item.id)} aria-label={`Dismiss ${item.title}`}><Trash2 /></button></div>
        </article> })}
        {visible.length === 0 && <div className="leave-empty"><Bell /><p>No notifications in this category.</p></div>}
      </div>
    </div>
  </section>
}

type ThemeName = 'gold' | 'white' | 'dark'

const themeMeta: { key: ThemeName; label: string; note: string; swatch: string[] }[] = [
  { key: 'gold', label: 'GoldenHR gold', note: 'The signature warm gold theme.', swatch: ['#a86f2d', '#f8f5f0', '#211b16'] },
  { key: 'white', label: 'White', note: 'Clean neutral canvas, design coming next.', swatch: ['#8a8f98', '#ffffff', '#1b1d21'] },
  { key: 'dark', label: 'Dark', note: 'Low light workspace with gold accents.', swatch: ['#d8a35c', '#1b1815', '#f4ece1'] },
]

function SettingsPage({ isEmployee, theme, setTheme }: { isEmployee: boolean; theme: ThemeName; setTheme: (theme: ThemeName) => void }) {
  const { user, employees, reloadOne } = useHrData()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetDone, setResetDone] = useState(false)
  const [passwords, setPasswords] = useState({ visible: false, confirm: false })

  const strength = (() => {
    let score = 0
    if (next.length >= 8) score += 1
    if (/[A-Z]/.test(next)) score += 1
    if (/\d/.test(next)) score += 1
    if (/[^A-Za-z0-9]/.test(next)) score += 1
    return score
  })()

  const changePassword = async () => {
    if (!current || next.length < 8 || next !== confirm) { setError('Check the current password and make sure both new passwords match'); return }
    setBusy(true)
    setError(null)
    try {
      await apiFetch('/api/auth/password', { method: 'PUT', body: { current_password: current, new_password: next, new_password_confirmation: confirm } })
      setCurrent(''); setNext(''); setConfirm('')
      setNotice('Password updated successfully')
      await reloadOne('notifications')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const runReset = async () => {
    const target = employees.items.find((item) => item.email.toLowerCase() === resetEmail.trim().toLowerCase())
    if (!target) { setError('No employee found with that email address.'); return }
    if (resetPassword.length < 8 || resetPassword !== resetConfirm) { setError('Set a new password of at least 8 characters and confirm it.'); return }
    setBusy(true)
    setError(null)
    try {
      await employeesApi.update(target.id, { password: resetPassword, password_confirmation: resetConfirm })
      setResetDone(true)
      setNotice(`Password reset for ${target.email}. Share it with them securely.`)
      await reloadOne('notifications')
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">WORKSPACE</p><h1>Settings</h1><p>Manage your login credentials, password, and workspace appearance.</p></div></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>Update saved to your account.</p></div></div>}
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}
    <div className="contract-columns">
      <div className="reg-main">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">LOGIN CREDENTIALS</p><h2>Your account</h2></div><span className="status-pill ok">{isEmployee ? 'Employee access' : 'HR administrator'}</span></div>
          <div className="profile-hero-main settings-identity"><div className="avatar avatar-sand">{initialsOf(user?.name)}</div><div><strong>{user?.name ?? '—'}</strong><p className="muted-copy">{roleLabelOf(user)}</p></div></div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Email address (username)</small><strong>{user?.email ?? '—'}</strong></div>
            <div className="detail-field"><small>Current password</small><input type={passwords.visible ? 'text' : 'password'} autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} placeholder="Enter current password" /></div>
            <div className="detail-field"><small>New password</small><input type={passwords.visible ? 'text' : 'password'} autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} placeholder="At least 8 characters" /></div>
            <div className="detail-field"><small>Confirm new password</small><input type={passwords.confirm ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repeat the new password" /></div>
          </div>
          {next && <div className="password-meter"><div><i className={`s${strength}`} /><i className={`s${strength > 1 ? strength : 0}`} /><i className={`s${strength > 2 ? strength : 0}`} /><i className={`s${strength > 3 ? strength : 0}`} /></div><p>{['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][strength]} password</p></div>}
          <div className="settings-toggles"><label><input type="checkbox" checked={passwords.visible} onChange={(event) => setPasswords((value) => ({ ...value, visible: event.target.checked }))} />Show passwords</label><label><input type="checkbox" checked={passwords.confirm} onChange={(event) => setPasswords((value) => ({ ...value, confirm: event.target.checked }))} />Show confirmation</label></div>
          <div className="form-actions"><button className="primary-button" disabled={busy} onClick={() => void changePassword()}><ShieldCheck /> {busy ? 'Updating…' : 'Update password'}</button></div>
        </article>

        {!isEmployee && <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">FORGOTTEN PASSWORD</p><h2>Reset a worker password</h2></div></div>
          {resetDone ? <><div className="profile-note"><FileCheck2 /><div><strong>Password reset complete</strong><p>{resetEmail} can now sign in with the new password. Share it with them securely.</p></div></div><div className="form-actions"><button className="secondary-button" onClick={() => { setResetDone(false); setResetEmail(''); setResetPassword(''); setResetConfirm('') }}><Plus /> Reset another worker</button></div></> : <><p className="settings-hint">If a worker cannot sign in, reset their password here. They keep the same email address as their username.</p><div className="detail-fields profile-fields"><div className="detail-field full"><small>Worker email address</small><input autoComplete="off" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="worker@goldenhr.com" /></div><div className="detail-field"><small>New password</small><input type="password" autoComplete="new-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="At least 8 characters" /></div><div className="detail-field"><small>Confirm password</small><input type="password" autoComplete="new-password" value={resetConfirm} onChange={(event) => setResetConfirm(event.target.value)} placeholder="Repeat the password" /></div></div><div className="form-actions"><button className="primary-button" disabled={busy} onClick={() => void runReset()}><ShieldCheck /> {busy ? 'Resetting…' : 'Set new password'}</button></div></>}
        </article>}
      </div>

      <aside className="reg-side">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">APPEARANCE</p><h2>Workspace theme</h2></div></div>
          <div className="theme-list">{themeMeta.map((item) => <button className={`theme-card ${theme === item.key ? 'active' : ''}`} key={item.key} onClick={() => setTheme(item.key)}><span className="theme-swatch">{item.swatch.map((color) => <i key={color} style={{ background: color }} />)}</span><span><strong>{item.label}</strong><small>{item.note}</small></span>{theme === item.key && <FileCheck2 className="theme-check" />}</button>)}</div>
          <p className="settings-hint">The theme applies to this account across every page and portal.</p>
        </article>
        <article className="panel reg-support"><div className="department-icon"><ShieldCheck /></div><div><strong>Account security</strong><p>Last password change was made from this device. Enable two factor authentication in the next release.</p></div></article>
      </aside>
    </div>
  </section>
}
type MonthRow = {
  month: string
  monthIndex: number
  payrollGross: number
  payrollNet: number
  requested: number
  leaveApproved: number
  leaveDeclined: number
  contracts: number
  headcount: number
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const currentYear = () => new Date().getFullYear()

/** Twelve month rows from a monthly report, zero-filled for missing months. */
function rowsOf(report: MonthlyReport | null): MonthRow[] {
  const byIndex = new Map((report?.rows ?? []).map((row) => [row.month_index, row]))
  return MONTH_NAMES.map((month, monthIndex) => {
    const row = byIndex.get(monthIndex + 1)
    return {
      month,
      monthIndex,
      payrollGross: row?.payroll_gross ?? 0,
      payrollNet: row?.payroll_net ?? 0,
      requested: row?.money_requested ?? 0,
      leaveApproved: row?.leave_approved ?? 0,
      leaveDeclined: row?.leave_declined ?? 0,
      contracts: row?.contracts ?? 0,
      headcount: row?.headcount ?? 0,
    }
  })
}
const compact = (value: number) => (value >= 1000000 ? `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M` : `${Math.round(value / 1000)}k`)

const pct = (value: number, before: number) => (before === 0 ? 0 : Math.round(((value - before) / before) * 100))
function CountWidget({ value, hint, tone, icon: Icon, delta, foot }: { value: string; hint: string; tone: string; icon: typeof Users; delta?: number; foot?: string }) {
  return <div className={`count-widget ${tone}`}>
    <div className="count-widget-top"><span className="count-icon"><Icon /></span>{delta !== undefined && <span className={`count-delta ${delta < 0 ? 'negative' : ''}`}>{delta >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}{Math.abs(delta)}%</span>}</div>
    <small>{hint}</small>
    <strong>{value}</strong>
    {foot && <div className="count-widget-foot"><Activity />{foot}</div>}
  </div>
}

function SparkBars({ values, highlight }: { values: number[]; highlight: number }) {
  const max = Math.max(...values, 1)
  return <div className="spark-bars">{values.map((value, index) => <span key={index} className={index === highlight ? 'on' : ''} style={{ height: `${Math.max(4, (value / max) * 100)}%` }} />)}</div>
}

function GraphTip({ show, x, y, title, rows }: { show: boolean; x: number; y: number; title: string; rows: { label: string; value: string; tone?: string }[] }) {
  if (!show) return null
  return <div className="graph-tip" style={{ left: `${x}%`, top: `${y}%` }} role="tooltip">
    <strong>{title}</strong>
    {rows.map((row) => <span key={row.label} className={row.tone ?? ''}><i className="graph-tip-dot" />{row.label}<b>{row.value}</b></span>)}
  </div>
}

function TrendChart({ primary, secondary, labels, highlight, primaryLabel, secondaryLabel, gid }: { primary: number[]; secondary: number[]; labels: string[]; highlight: number; primaryLabel: string; secondaryLabel: string; gid: string }) {
  const width = 680
  const height = 200
  if (primary.length === 0) return <div className="trend-chart"><div className="chart-legend"><span className="legend-primary" />{primaryLabel}<span className="legend-secondary" />{secondaryLabel}</div><div className="leave-empty"><p>No data for this period yet.</p></div></div>
  const all = [...primary, ...secondary]
  const max = Math.max(...all, 1)
  const stepX = primary.length > 1 ? width / (primary.length - 1) : width
  const toY = (value: number) => height - (value / max) * (height - 30) - 10
  const toPath = (series: number[]) => series.map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * stepX).toFixed(1)} ${toY(value).toFixed(1)}`).join(' ')
  const [hover, setHover] = useState<number | null>(null)
  return <div className="trend-chart" onMouseLeave={() => setHover(null)}>
    <div className="chart-legend"><span className="legend-primary" />{primaryLabel}<span className="legend-secondary" />{secondaryLabel}</div>
    <div className="graph-canvas">
      <svg viewBox={`0 0 ${width} ${height + 22}`} preserveAspectRatio="none" role="img" aria-label={`${primaryLabel} against ${secondaryLabel}`}>
        <defs><linearGradient id={`${gid}Area`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d8a35c" stopOpacity=".38" /><stop offset="1" stopColor="#d8a35c" stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75, 1].map((step) => <line key={step} x1="0" x2={width} y1={height - height * step} y2={height - height * step} stroke="#e8e0d5" strokeWidth="1" />)}
        <path d={`${toPath(primary)} L${width} ${height} L0 ${height} Z`} fill={`url(#${gid}Area)`} />
        <path d={toPath(primary)} fill="none" stroke="#a86f2d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={toPath(secondary)} fill="none" stroke="#3f6280" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
        {primary.map((value, index) => <g key={index} className={hover === index ? 'on' : ''}>
          <circle cx={index * stepX} cy={toY(value)} r={index === highlight || hover === index ? 7 : 3.5} fill={index === highlight ? '#a86f2d' : '#fffaf3'} stroke="#a86f2d" strokeWidth="2.5" />
        </g>)}
      </svg>
      <div className="graph-hits">{primary.map((_, index) => <button key={index} aria-label={`${labels[index]} data`} onMouseEnter={() => setHover(index)} onFocus={() => setHover(index)} className={index === highlight ? 'current' : ''} style={{ left: `${(index / Math.max(primary.length - 1, 1)) * 100}%` }} />)}</div>
      {hover !== null && <GraphTip show x={Math.min(Math.max((hover / Math.max(primary.length - 1, 1)) * 100, 12), 88)} y={8} title={`${labels[hover]}`} rows={[{ label: primaryLabel, value: money(primary[hover]), tone: 'primary' }, { label: secondaryLabel, value: money(secondary[hover]), tone: 'secondary' }]} />}
    </div>
    <div className="chart-axis">{labels.map((label, index) => <span key={label} className={index === highlight || index === hover ? 'on' : ''}>{label.slice(0, 3)}</span>)}</div>
  </div>
}

function LeaveBars({ values, labels, highlight }: { values: number[]; labels: string[]; highlight: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...values, 1)
  return <div className="report-leave-bars" onMouseLeave={() => setHover(null)}>
    {values.map((value, index) => <div className={`report-leave-col ${hover === index ? 'on' : ''}`} key={labels[index]} onMouseEnter={() => setHover(index)}>
      <span className={index === highlight ? 'on' : ''} style={{ height: `${Math.max(4, (value / max) * 100)}%` }} />
      {hover === index && <div className="graph-tip graph-tip-inline"><strong>{labels[index]}</strong><span className="primary"><i className="graph-tip-dot" />Leave days<b>{value} days</b></span></div>}
    </div>)}
  </div>
}
function TrendBars({ values, labels, highlight, secondary, primaryLabel, secondaryLabel }: { values: number[]; labels: string[]; highlight: number; secondary: number[]; primaryLabel: string; secondaryLabel: string }) {
  const max = Math.max(...values, 1)
  const [hover, setHover] = useState<number | null>(null)
  return <div className="trend-bars" onMouseLeave={() => setHover(null)}>
    {values.map((value, index) => <div className={`trend-col ${hover === index ? 'hovered' : ''}`} key={labels[index]} onMouseEnter={() => setHover(index)}>
      <span className={index === highlight ? 'on' : ''} style={{ height: `${Math.max(4, (value / max) * 100)}%` }} />
      {(index === highlight || hover === index) && <em>{compact(value)}</em>}
      <small className={index === highlight ? 'on' : ''}>{labels[index].slice(0, 3)}</small>
      {hover === index && <div className="graph-tip graph-tip-inline"><strong>{labels[index]}</strong><span className="primary"><i className="graph-tip-dot" />{primaryLabel}<b>{money(value)}</b></span><span className="secondary"><i className="graph-tip-dot" />{secondaryLabel}<b>{money(secondary[index])}</b></span></div>}
    </div>)}
  </div>
}

function ColumnChart({ values, labels, highlight, suffix = '', unit = '' }: { values: number[]; labels: string[]; highlight: number; suffix?: string; unit?: string }) {
  const max = Math.max(...values, 1)
  const [hover, setHover] = useState<number | null>(null)
  return <div className="column-chart" onMouseLeave={() => setHover(null)}>
    {values.map((value, index) => <div className={`column ${hover === index ? 'hovered' : ''}`} key={labels[index]} onMouseEnter={() => setHover(index)}>
      <span className={index === highlight ? 'on' : ''} style={{ height: `${Math.max(3, (value / max) * 100)}%` }} />
      <em className={index === highlight ? 'on' : ''}>{compact(value)}{suffix}</em>
      <small className={index === highlight ? 'on' : ''}>{labels[index].slice(0, 3)}</small>
      {hover === index && <div className="graph-tip graph-tip-inline"><strong>{labels[index]}</strong><span className="primary"><i className="graph-tip-dot" />{unit || 'Total'}<b>{money(value)}</b></span></div>}
    </div>)}
  </div>
}

function Donut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1
  // A brand-new record can legitimately have nothing to chart yet (no
  // requests, no balances). The empty array used to crash on slices[0].
  if (slices.length === 0) return <div className="donut-wrap"><div className="leave-empty"><p>No data yet.</p></div></div>
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const [hover, setHover] = useState<number | null>(null)
  let offset = 0
  const active = hover === null ? slices[0] : slices[hover]
  return <div className="donut-wrap" onMouseLeave={() => setHover(null)}>
    <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Distribution">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#efe7db" strokeWidth="19" />
      {slices.map((slice, index) => { const length = (slice.value / total) * circumference; const node = <circle key={slice.label} cx="70" cy="70" r={radius} fill="none" stroke={slice.color} strokeWidth={hover === index ? 23 : 19} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} className={hover === index ? 'on' : ''} onMouseEnter={() => setHover(index)} transform="rotate(-90 70 70)" />; offset += length; return node })}
      <text x="70" y="67" textAnchor="middle" className="donut-value">{Math.round((active.value / total) * 100)}%</text>
      <text x="70" y="85" textAnchor="middle" className="donut-label">{active.label}</text>
    </svg>
    <div className="donut-legend">{slices.map((slice, index) => <div key={slice.label} className={hover === index ? 'on' : ''} onMouseEnter={() => setHover(index)}><span className="legend-dot" style={{ background: slice.color }} />{slice.label}<strong>{money(slice.value)}</strong></div>)}</div>
  </div>
}
function ReportTable({ rows, highlight, onOpen }: { rows: MonthRow[]; highlight: number; onOpen: (index: number) => void }) {
  return <div className="profile-table report-table"><div className="profile-table-row profile-table-head"><span>Month</span><span>Gross</span><span>Net</span><span>Requested</span><span>Leave</span><span>Contracts</span><span>Staff</span><span /></div>
    {rows.map((row, index) => <div className={`profile-table-row ${index === highlight ? 'is-current' : ''}`} key={row.month}>
      <strong>{row.month}</strong><span>{compact(row.payrollGross)}</span><span>{compact(row.payrollNet)}</span><span>{compact(row.requested)}</span><span>{row.leaveApproved + row.leaveDeclined}</span><span>{row.contracts}</span><span>{row.headcount}</span>
      <button className="ghost-icon" onClick={() => onOpen(index)} aria-label={`Open ${row.month}`}><Eye /></button>
    </div>)}</div>
}

function PortalSummary({ row, previous }: { row: MonthRow; previous: MonthRow }) {
  const delta = (value: number, before: number) => (before === 0 ? 0 : Math.round(((value - before) / before) * 100))
  return <div className="portal-stream">
    <article className="portal-stream-card">
      <header><span className="portal-stream-icon"><ShieldCheck /></span><div><strong>Payroll</strong><small>this month</small></div></header>
      <div className="portal-stream-rows">{[['Gross payroll', compact(row.payrollGross)], ['Net payroll', compact(row.payrollNet)], ['Money requested', compact(row.requested)], ['Contracts', `${row.contracts}`], ['Headcount', `${row.headcount}`]].map(([label, value]) => <div key={label as string}><span>{label as string}</span><strong>{value as string}</strong></div>)}</div>
    </article>
    <article className="portal-stream-card">
      <header><span className="portal-stream-icon"><Users /></span><div><strong>Time off</strong><small>this month</small></div></header>
      <div className="portal-stream-rows">{[['Leave approved', `${row.leaveApproved}`], ['Leave declined', `${row.leaveDeclined}`], ['Total requests', `${row.leaveApproved + row.leaveDeclined}`]].map(([label, value]) => <div key={label as string}><span>{label as string}</span><strong>{value as string}</strong></div>)}</div>
    </article>
    <article className="portal-stream-card portal-stream-wide">
      <header><span className="portal-stream-icon"><TrendingUpIcon /></span><div><strong>Month on month</strong><small>against {previous.month}</small></div></header>
      <div className="portal-deltas">{[['Gross payroll', delta(row.payrollGross, previous.payrollGross)], ['Net payroll', delta(row.payrollNet, previous.payrollNet)], ['Requested', delta(row.requested, previous.requested)], ['Headcount', delta(row.headcount, previous.headcount)]].map(([label, value]) => <div key={label as string}><span>{label as string}</span><strong className={Number(value) >= 0 ? 'up' : 'down'}>{Number(value) >= 0 ? '+' : ''}{value as number}%</strong></div>)}</div>
    </article>
  </div>
}

function TrendingUpIcon() { return <Activity /> }

function PayrollReportPage({ onBack }: { onBack: () => void }) {
  const { payrollRuns, reloadOne } = useHrData()
  const [openId, setOpenId] = useState<number | null>(null)
  const [detail, setDetail] = useState<{ run: PayrollRun; payslips: Payslip[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const year = currentYear()

  const openRun = async (run: PayrollRun) => {
    setOpenId(run.id)
    setError(null)
    try {
      setDetail(await payrollApi.run(run.id))
    } catch (cause) {
      setError(apiMessage(cause))
    }
  }

  const act = async (run: PayrollRun, action: 'approve' | 'pay') => {
    setBusy(true)
    setError(null)
    try {
      if (action === 'approve') await payrollApi.approve(run.id)
      else await payrollApi.pay(run.id)
      await reloadOne('payrollRuns')
      await openRun(run)
    } catch (cause) {
      setError(apiMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const runs = payrollRuns.items
  const selected = detail && openId !== null ? detail : null
  const yearNet = runs.reduce((sum, run) => sum + run.net_total_minor, 0)
  const yearGross = runs.reduce((sum, run) => sum + run.gross_total_minor, 0)

  if (payrollRuns.status === 'loading') return <EmptyState label="Loading payroll report" />
  if (payrollRuns.status === 'error') return <EmptyState label="Could not load payroll report" detail={payrollRuns.error ?? undefined} />

  return <section className="management-page payroll-report">
    <button className="back-link" onClick={() => { if (openId !== null) { setOpenId(null); setDetail(null) } else onBack() }}><ChevronDown /> Back to reports</button>
    <div className="report-welcome">
      <div><p className="eyebrow">{year} PAYROLL REPORT</p><h1>Payroll overview</h1><p className="muted-copy">Pay runs, totals and the monthly cycle.</p></div>
      <div className="report-controls"><button className="primary-button" onClick={() => window.print()}><Download /> Export PDF</button></div>
    </div>
    {error && <div className="panel contract-saved"><X /><div><strong>{error}</strong></div></div>}

    <div className="report-top-grid">
      <article className="report-card report-card-total">
        <header><p className="eyebrow">Total payroll</p><span className="report-chip">{runs.length} runs</span></header>
        <h2>{money(yearGross)}</h2>
        <div className="report-card-foot"><span>Gross across recorded runs</span></div>
        <SparkBars values={runs.map((run) => run.gross_total_minor)} highlight={0} />
      </article>
      <article className="report-card report-card-balance">
        <header><p className="eyebrow">Year to date</p><span className="report-chip">{year}</span></header>
        <p className="report-balance-label">Net paid</p>
        <h2>{compact(yearNet)}</h2>
        <div className="report-area">{runs.map((run, index) => <i key={run.id} style={{ height: `${Math.max(6, (run.net_total_minor / Math.max(yearNet, 1)) * 100)}%` }} />)}</div>
        <div className="report-card-foot"><span>{runs.length} runs on record</span></div>
      </article>
      <article className="report-card">
        <header><p className="eyebrow">Pay runs</p><span className="report-chip">select a run</span></header>
        <div className="report-detail-rows">{runs.map((run) => <div key={run.id}><span>{formatMonth(run.period)} · {run.status}</span><strong>{compact(run.net_total_minor)}</strong></div>)}</div>
        {runs.length === 0 && <p className="muted-copy">No pay runs yet.</p>}
      </article>
    </div>

    {selected && <article className="panel">
      <div className="panel-heading"><div><p className="eyebrow">RUN DETAIL</p><h2>{formatMonth(selected.run.period)} · {selected.run.status}</h2></div><div className="form-actions">{selected.run.status !== 'approved' && selected.run.status !== 'paid' && <button className="primary-button" disabled={busy} onClick={() => void act(selected.run, 'approve')}><FileCheck2 /> Approve</button>}{selected.run.status === 'approved' && <button className="primary-button" disabled={busy} onClick={() => void act(selected.run, 'pay')}><WalletCards /> Mark paid</button>}</div></div>
      <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Employee</span><span>Gross</span><span>Net pay</span><span>Status</span><span /></div>
        {selected.payslips.map((slip) => <div className="profile-table-row" key={slip.id}>
          <span><strong>{slip.employee?.name ?? '-'}</strong></span>
          <span>{money(slip.gross_minor)}</span>
          <span className="payroll-net-cell">{money(slip.net_minor)}</span>
          <span className={`status-pill ${slip.status === 'paid' ? 'ok' : ''}`}>{slip.status}</span>
          <span className="employee-actions"><button onClick={() => void downloadFile(`/api/payslips/${slip.id}/pdf`, `${slip.reference}.pdf`).catch((cause) => setError(apiMessage(cause)))} aria-label={`Download ${slip.reference}`}><Download /></button></span>
        </div>)}
      </div>
    </article>}

    <div className="report-mid-grid">
      {runs.map((run) => <article className="report-card" key={run.id}>
        <header><p className="eyebrow">{formatMonth(run.period)}</p><span className="report-chip">{run.status}</span></header>
        <h2>{compact(run.net_total_minor)}</h2>
        <div className="report-split"><div><span>Gross</span><strong className="up">{compact(run.gross_total_minor)}</strong></div><div><span>Payslips</span><strong>{run.payslip_count}</strong></div></div>
        <div className="form-actions"><button className="secondary-button" onClick={() => void openRun(run)}><Eye /> Open run</button></div>
      </article>)}
    </div>
  </section>
}
function ReportsPage() {
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth())
  const [year, setYear] = useState(currentYear())
  const [tab, setTab] = useState<'overview' | 'payroll' | 'money' | 'contracts'>('overview')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [payrollOpen, setPayrollOpen] = useState(false)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setStatus('loading')
    reportsApi.monthly(year)
      .then((result) => { setReport(result); setStatus('ready') })
      .catch((cause) => { setError(apiMessage(cause)); setStatus('error') })
  }, [year])

  if (payrollOpen) return <PayrollReportPage onBack={() => setPayrollOpen(false)} />
  if (status === 'loading') return <EmptyState label="Loading reports" />
  if (status === 'error' || !report) return <EmptyState label="Could not load reports" detail={error ?? undefined} />

  const rows = rowsOf(report)
  const row = rows[Math.min(monthIndex, 11)]
  const previous = rows[(Math.min(monthIndex, 11) - 1 + 12) % 12]
  const labels = rows.map((entry) => entry.month)

  if (openIndex !== null) {
    const detail = rows[openIndex]
    const detailPrevious = rows[(openIndex - 1 + 12) % 12]
    return <section className="management-page report-inner">
      <button className="back-link" onClick={() => setOpenIndex(null)}><ChevronDown /> Back to reports</button>
      <div className="panel report-inner-hero">
        <div><p className="eyebrow">{year} DETAIL</p><h1>{detail.month} {year}</h1><p className="muted-copy">{detail.headcount} employees on payroll</p></div>
        <div className="form-actions"><button className="secondary-button" onClick={() => window.print()}><Download /> Export PDF</button><button className="primary-button" onClick={() => window.print()}><FileText /> Full report</button></div>
      </div>
      <div className="count-widget-row">
        <CountWidget value={compact(detail.payrollGross)} hint="gross payroll" tone="tone-gold" icon={WalletCards} delta={pct(detail.payrollGross, detailPrevious.payrollGross)} foot="Gross vs last month" />
        <CountWidget value={compact(detail.payrollNet)} hint="net payroll" tone="tone-blue" icon={CreditCard} delta={pct(detail.payrollNet, detailPrevious.payrollNet)} foot="Net vs last month" />
        <CountWidget value={compact(detail.requested)} hint="money requested" tone="tone-amber" icon={CircleDollarSign} delta={pct(detail.requested, detailPrevious.requested)} foot="Requested vs last month" />
        <CountWidget value={`${detail.leaveApproved + detail.leaveDeclined}`} hint="leave requests" tone="tone-rose" icon={CalendarDays} delta={pct(detail.leaveApproved + detail.leaveDeclined, detailPrevious.leaveApproved + detailPrevious.leaveDeclined)} foot="Requests vs last month" />
        <CountWidget value={`${detail.contracts}`} hint="contracts" tone="tone-green" icon={FileCheck2} delta={pct(detail.contracts, detailPrevious.contracts)} foot="Contracts vs last month" />
      </div>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAYROLL COST</p><h2>Gross against net</h2></div></div><TrendChart primary={rows.map((entry) => entry.payrollGross)} secondary={rows.map((entry) => entry.payrollNet)} labels={labels} highlight={openIndex} primaryLabel="Gross" secondaryLabel="Net" gid={`trend1`} /></article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAY SPLIT</p><h2>Net against requested</h2></div></div><Donut slices={[{ label: 'Net pay', value: detail.payrollNet, color: '#3f6280' }, { label: 'Money requested', value: detail.requested, color: '#a86f2d' }, { label: 'Contracts', value: detail.contracts, color: '#5d7145' }]} /></article>
      </div>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PORTAL ACTIVITY</p><h2>HR and employee streams</h2></div></div><PortalSummary row={detail} previous={detailPrevious} /></article>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">{year}</p><h2>Every month compared</h2></div></div><ReportTable rows={rows} highlight={openIndex} onOpen={setOpenIndex} /></article>
    </section>
  }

  const tabRows = tab === 'payroll' ? [['Gross payroll', compact(row.payrollGross)], ['Net payroll', compact(row.payrollNet)], ['Headcount', `${row.headcount}`]] : tab === 'money' ? [['Requested', compact(row.requested)], ['Leave approved', `${row.leaveApproved}`], ['Leave declined', `${row.leaveDeclined}`]] : [['Active contracts', `${row.contracts}`], ['Headcount', `${row.headcount}`], ['Leave requests', `${row.leaveApproved + row.leaveDeclined}`]]

  return <section className="management-page reports-page">
    <div className="workspace-hero"><div><p className="eyebrow">INSIGHTS</p><h1>Reports & insights</h1><p>Payroll, money requests and contract coverage.</p></div><div className="report-controls">
      <select className="inline-select" value={year} onChange={(event) => setYear(Number(event.target.value))}>{[currentYear(), currentYear() - 1, currentYear() - 2].map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select className="inline-select" value={monthIndex} onChange={(event) => setMonthIndex(Number(event.target.value))}>{rows.map((entry, index) => <option key={entry.month} value={index}>{entry.month} {year}</option>)}</select>
      <button className="primary-button" onClick={() => setPayrollOpen(true)}><FileText /> Payroll report</button><button className="secondary-button" onClick={() => window.print()}><Download /> Export</button>
    </div></div>

    <div className="count-widget-row count-widget-hero">
      <CountWidget value={compact(row.payrollGross)} hint="total payroll" tone="tone-gold" icon={WalletCards} delta={pct(row.payrollGross, previous.payrollGross)} foot="Gross vs last month" />
      <CountWidget value={compact(row.payrollNet)} hint="net payroll" tone="tone-blue" icon={CreditCard} delta={pct(row.payrollNet, previous.payrollNet)} foot="Net vs last month" />
      <CountWidget value={compact(row.requested)} hint="money requested" tone="tone-amber" icon={CircleDollarSign} delta={pct(row.requested, previous.requested)} foot="Requested vs last month" />
      <CountWidget value={`${row.headcount}`} hint="employees" tone="tone-green" icon={Users} delta={pct(row.headcount, previous.headcount)} foot="Headcount vs last month" />
    </div>

    <div className="profile-tabs" role="tablist">{(['overview', 'payroll', 'money', 'contracts'] as const).map((key) => <button key={key} role="tab" aria-selected={tab === key} className={`profile-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{key === 'overview' ? <LayoutDashboard /> : (() => { const Icon = key === 'payroll' ? WalletCards : key === 'money' ? CircleDollarSign : FileCheck2; return <Icon /> })()}{key === 'overview' ? 'Overview' : key === 'payroll' ? 'Payroll' : key === 'money' ? 'Money requests' : 'Contracts'}</button>)}</div>

    {tab === 'overview' ? <>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">TOTAL PAYROLL USED</p><h2>Gross payroll by month</h2></div><span className="report-chip">{year}</span></div><ColumnChart values={rows.map((entry) => entry.payrollGross)} labels={labels} highlight={monthIndex} unit="Total payroll" /><div className="chart-summary"><div><span className="summary-dot gold-dot" />{row.month} <strong>{compact(row.payrollGross)}</strong></div><div><span className="summary-dot dark-dot" />Year total <strong>{compact(rows.reduce((sum, entry) => sum + entry.payrollGross, 0))}</strong></div></div></article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">MONEY REQUESTS</p><h2>Requested by month</h2></div></div><TrendChart primary={rows.map((entry) => entry.requested)} secondary={rows.map((entry) => entry.leaveApproved + entry.leaveDeclined)} labels={labels} highlight={monthIndex} primaryLabel="Requested" secondaryLabel="Leave requests" gid={`trend2`} /></article>
      </div>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAYROLL COST</p><h2>Gross against net pay</h2></div></div><TrendChart primary={rows.map((entry) => entry.payrollGross)} secondary={rows.map((entry) => entry.payrollNet)} labels={labels} highlight={monthIndex} primaryLabel="Gross" secondaryLabel="Net" gid={`trend3`} /></article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">DISTRIBUTION</p><h2>{row.month} pay split</h2></div></div><Donut slices={[{ label: 'Net pay', value: row.payrollNet, color: '#3f6280' }, { label: 'Requested', value: row.requested, color: '#a86f2d' }, { label: 'Contracts', value: row.contracts, color: '#5d7145' }]} /></article>
      </div>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PORTAL ACTIVITY</p><h2>{row.month} across both portals</h2></div></div><PortalSummary row={row} previous={previous} /></article>
    </> : <>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">{row.month} {year}</p><h2>{tab === 'money' ? 'Requests by month' : tab === 'contracts' ? 'Contracts by month' : 'Payroll by month'}</h2></div></div>
          <TrendChart primary={tab === 'money' ? rows.map((entry) => entry.requested) : tab === 'contracts' ? rows.map((entry) => entry.contracts) : rows.map((entry) => entry.payrollGross)} secondary={tab === 'money' ? rows.map((entry) => entry.leaveApproved + entry.leaveDeclined) : tab === 'contracts' ? rows.map((entry) => entry.headcount) : rows.map((entry) => entry.payrollNet)} labels={labels} highlight={monthIndex} primaryLabel={tab === 'money' ? 'Requested' : tab === 'contracts' ? 'Contracts' : 'Gross'} secondaryLabel={tab === 'money' ? 'Leave' : tab === 'contracts' ? 'Headcount' : 'Net'} gid={`trend4`} />
        </article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">THIS MONTH</p><h2>Key figures</h2></div></div>
          <div className="report-figure-list">{tabRows.map(([label, value]) => <div key={label as string}><span>{label as string}</span><strong>{value as string}</strong><SparkBars values={rows.map((entry) => tab === 'payroll' ? entry.payrollGross : tab === 'money' ? entry.requested : entry.contracts)} highlight={monthIndex} /></div>)}</div>
        </article>
      </div>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PORTAL ACTIVITY</p><h2>Where the work happened</h2></div></div><PortalSummary row={row} previous={previous} /></article>
    </>}

    <article className="panel"><div className="panel-heading"><div><p className="eyebrow">{year}</p><h2>Every month compared</h2></div></div><ReportTable rows={rows} highlight={monthIndex} onOpen={setOpenIndex} /></article>
  </section>
}
function EmployeeDashboard() {
  const { user, employeeDashboard, leaveBalances, moneyRequests, payslips, contracts, notifications } = useHrData()
  const firstName = (user?.name ?? '').split(' ')[0] || 'there'
  const dash = employeeDashboard
  const balances = leaveBalances.items
  const totalRemaining = balances.reduce((sum, item) => sum + item.remaining_days, 0)
  const requestedTotal = dash?.money_requests.requested_minor ?? moneyRequests.items.reduce((sum, item) => sum + item.amount_minor, 0)
  const series = dash?.payslips.series ?? []
  const netTrend = series.length > 0 ? series.map((item) => item.net_minor) : payslips.items.map((item) => item.net_minor).reverse()
  const latestNet = dash?.payslips.latest_net_minor ?? payslips.items[0]?.net_minor ?? 0
  const contractEnd = dash?.contract?.end_date ?? null
  const contractDaysLeft = contractEnd ? Math.max(0, Math.round((new Date(contractEnd).getTime() - Date.now()) / 86400000)) : null
  const growth = (value: number, before: number) => (before === 0 ? 0 : Math.round(((value - before) / before) * 100))

  const feed = notifications.items.slice(0, 6).map((item) => ({
    id: String(item.id),
    title: item.title ?? 'Update',
    meta: item.created_at ? formatRelative(item.created_at) : '',
    amount: '',
    status: item.read ? 'Seen' : 'New',
    time: item.created_at ? formatRelative(item.created_at) : '',
    kind: noticeKindFor(item.kind),
  }))

  return <section className="hr-dashboard">
    <div className="workspace-hero"><div><div className="eyebrow"><span className="live-dot" /> {new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div><h1>Good morning, {firstName}.</h1><p>Here is your personal workspace at a glance.</p></div></div>

    <div className="dash-layout">
      <div className="dash-metrics">
        <MetricTile label="Net pay this month" value={money(latestNet)} delta={netTrend.length > 1 ? growth(netTrend[netTrend.length - 1], netTrend[netTrend.length - 2]) : 0} foot="Latest payslip" icon={WalletCards} trend={netTrend.length > 0 ? netTrend : [0]} colour="tone-gold" />
        <MetricTile label="Leave balance" value={`${totalRemaining} days`} delta={0} foot="Remaining" icon={CalendarDays} trend={balances.map((item) => item.remaining_days)} colour="tone-blue" />
        <MetricTile label="Money requested" value={money(requestedTotal)} delta={0} foot={`${dash?.money_requests.count ?? moneyRequests.items.length} requests`} icon={CircleDollarSign} trend={[requestedTotal]} colour="tone-amber" />
        <MetricTile label="Contract days left" value={contractDaysLeft !== null ? `${contractDaysLeft}` : '-'} delta={0} foot={dash?.contract ? dash.contract.status : 'No contract'} icon={FileCheck2} trend={[contractDaysLeft ?? 0]} colour="tone-violet" />
        <MetricTile label="Payslips" value={`${dash?.payslips.count ?? payslips.items.length}`} delta={0} foot="Available to date" icon={CreditCard} trend={netTrend.length > 0 ? netTrend : [0]} colour="tone-rose" />
      </div>

      <PnlChart payroll={netTrend.length > 0 ? netTrend : [0]} requests={balances.map((item) => item.used_days)} labels={series.length > 0 ? series.map((item) => item.month) : balances.map((item) => item.leave_type)} primaryLabel="Net pay" secondaryLabel="Leave used" />
    </div>

    <div className="dash-lower">
      <article className="panel dash-credit">
        <header><p className="eyebrow">Money summary</p><button className="icon-button" aria-label="Open money requests"><ArrowUpRight /></button></header>
        <h2>{money(requestedTotal)}</h2>
        <span className="metric-delta up">+0%<small>requested to date</small></span>
        <div className="dash-credit-block">
          <div className="dash-credit-head"><strong>Request history</strong><button className="more-button">View all <ArrowUpRight /></button></div>
          <div className="dash-request-list">
            {moneyRequests.items.slice(0, 3).map((item) => <div key={item.id}><span><strong>{item.kind ?? 'Request'}</strong><small>{item.status}</small></span><b>{compact(item.amount_minor)}</b></div>)}
            {moneyRequests.items.length === 0 && <div><span><strong>No requests yet</strong></span></div>}
          </div>
        </div>
      </article>

      <article className="panel dash-activity">
        <div className="panel-heading"><div><p className="eyebrow">Latest changes</p><h2>Recent activity</h2></div></div>
        <div className="profile-table dash-table"><div className="profile-table-row profile-table-head"><span /><span>Activity</span><span>Amount</span><span>Status</span><span>Date</span><span /></div>
          {feed.map((row) => { const Icon = kindMeta[row.kind].icon; return <div className="profile-table-row" key={row.id}>
            <span><label className="dash-check"><input type="checkbox" /><i /></label></span>
            <span className="dash-activity-cell"><span className={`document-type-icon ${row.kind === 'money' ? 'is-image' : 'is-pdf'}`}><Icon /></span><span><strong>{row.title}</strong><small>{row.id} - {row.meta}</small></span></span>
            <span className="payroll-net-cell">{row.amount}</span>
            <span><span className={`status-pill ${row.status === 'Seen' ? 'ok' : ''}`}><i className="status-dot" />{row.status}</span></span>
            <span>{row.time}</span>
            <span><button className="ghost-icon" aria-label={`More actions for ${row.id}`}><MoreHorizontal /></button></span>
          </div> })}
          {feed.length === 0 && <div className="leave-empty"><Activity /><p>No recent activity.</p></div>}
        </div>
      </article>
    </div>
  </section>
}
function WorkChart({ primary, secondary, labels, highlight, format, primaryLabel, secondaryLabel }: { primary: number[]; secondary?: number[]; labels: string[]; highlight: number; format: (value: number) => string; primaryLabel: string; secondaryLabel?: string }) {
  const width = 660
  const height = 190
  if (primary.length === 0) return <div className="trend-chart work-chart"><div className="chart-legend"><span className="legend-primary" />{primaryLabel}</div><div className="leave-empty"><p>No data for this period yet.</p></div></div>
  const series = secondary ? [...primary, ...secondary] : primary
  const max = Math.max(...series, 1)
  const stepX = primary.length > 1 ? width / (primary.length - 1) : width
  const toY = (value: number) => height - (value / max) * (height - 26) - 10
  const toPath = (data: number[]) => data.map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * stepX).toFixed(1)} ${toY(value).toFixed(1)}`).join(' ')
  const [hover, setHover] = useState<number | null>(null)
  const id = `work-${primaryLabel.replace(/\W/g, '')}`
  return <div className="trend-chart work-chart" onMouseLeave={() => setHover(null)}>
    <div className="chart-legend"><span className="legend-primary" />{primaryLabel}{secondaryLabel && <><span className="legend-secondary" />{secondaryLabel}</>}</div>
    <div className="graph-canvas">
      <svg viewBox={`0 0 ${width} ${height + 22}`} preserveAspectRatio="none" role="img" aria-label={primaryLabel}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#108652" stopOpacity=".3" /><stop offset="1" stopColor="#108652" stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75, 1].map((step) => <line key={step} x1="0" x2={width} y1={height - height * step} y2={height - height * step} stroke="#e8e0d5" strokeWidth="1" />)}
        <path d={`${toPath(primary)} L${width} ${height} L0 ${height} Z`} fill={`url(#${id})`} />
        <path d={toPath(primary)} fill="none" stroke="#108652" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {secondary && <path d={toPath(secondary)} fill="none" stroke="#b3762c" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />}
        {primary.map((value, index) => <circle key={index} cx={index * stepX} cy={toY(value)} r={index === highlight || hover === index ? 6.5 : 3.5} fill={index === highlight ? '#108652' : '#fffaf3'} stroke="#108652" strokeWidth="2.5" />)}
      </svg>
      <div className="graph-hits">{primary.map((_, index) => <button key={index} aria-label={`${labels[index]} data`} onMouseEnter={() => setHover(index)} onFocus={() => setHover(index)} style={{ left: `${(index / Math.max(primary.length - 1, 1)) * 100}%` }} />)}</div>
      {hover !== null && <GraphTip show x={Math.min(Math.max((hover / Math.max(primary.length - 1, 1)) * 100, 14), 86)} y={8} title={`${labels[hover]}`} rows={[{ label: primaryLabel, value: format(primary[hover]), tone: 'primary' }, ...(secondary ? [{ label: secondaryLabel ?? '', value: format(secondary[hover]), tone: 'secondary' }] : [])]} />}
    </div>
    <div className="chart-axis">{labels.map((label, index) => <span key={label} className={index === highlight || index === hover ? 'on' : ''}>{label.slice(0, 3)}</span>)}</div>
  </div>
}

function WorkProgressPage() {
  const { employeeDashboard, leaveBalances, moneyRequests, payslips, contracts, registration } = useHrData()
  const [tab, setTab] = useState<'overview' | 'money' | 'contract' | 'leave' | 'payslip'>('overview')
  const year = currentYear()
  const dash = employeeDashboard
  const series = dash?.payslips.series ?? []
  const labels = series.length > 0 ? series.map((item) => item.month.slice(5)) : ['-']
  const paidTrend = series.length > 0 ? series.map((item) => item.net_minor) : [0]
  const balances = leaveBalances.items
  const usedLeave = balances.reduce((sum, item) => sum + item.used_days, 0)
  const remainingLeave = balances.reduce((sum, item) => sum + item.remaining_days, 0)
  const bookedLeave = balances.reduce((sum, item) => sum + item.booked_days, 0)
  const requested = moneyRequests.items.reduce((sum, item) => sum + item.amount_minor, 0)
  const contract = dash?.contract ?? null
  const contractEnd = contract?.end_date ?? null
  const contractDaysLeft = contractEnd ? Math.max(0, Math.round((new Date(contractEnd).getTime() - Date.now()) / 86400000)) : null
  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { key: 'money' as const, label: 'Money requested', icon: CircleDollarSign },
    { key: 'contract' as const, label: 'Contract health', icon: FileCheck2 },
    { key: 'leave' as const, label: 'Leave requests', icon: CalendarDays },
    { key: 'payslip' as const, label: 'Payslips', icon: WalletCards },
  ]

  return <section className="management-page work-page">
    <div className="workspace-hero"><div><p className="eyebrow">PERFORMANCE</p><h1>Work progress</h1><p>Money, contract health, payslips and leave across your year.</p></div><div className="report-controls"><select className="inline-select" defaultValue={year}><option>{year}</option></select><button className="primary-button" onClick={() => window.print()}><Download /> Export analysis</button></div></div>

    <div className="count-widget-row">
      <CountWidget value={money(requested)} hint="money requested" tone="tone-amber" icon={CircleDollarSign} delta={0} foot={`across ${moneyRequests.items.length} requests`} />
      <CountWidget value={contractDaysLeft !== null ? `${contractDaysLeft}` : '-'} hint="contract days left" tone="tone-violet" icon={FileCheck2} delta={0} foot={contract ? contract.status : 'No contract'} />
      <CountWidget value={`${payslips.items.length}`} hint="payslips" tone="tone-gold" icon={WalletCards} delta={0} foot="net pay received" />
      <CountWidget value={`${usedLeave}`} hint="leave days used" tone="tone-rose" icon={CalendarDays} delta={0} foot={`of ${usedLeave + remainingLeave} available`} />
    </div>

    <div className="profile-tabs" role="tablist">{tabs.map(({ key, label, icon: Icon }) => <button key={key} role="tab" aria-selected={tab === key} className={`profile-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}><Icon />{label}</button>)}</div>

    {tab === 'overview' && <>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAY</p><h2>Net pay by month</h2></div><span className="report-chip">{year}</span></div><WorkChart primary={paidTrend} labels={series.length > 0 ? series.map((item) => item.month) : labels} highlight={paidTrend.length - 1} format={(value) => money(value)} primaryLabel="Net pay" /></article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">LEAVE BALANCE</p><h2>Available against used</h2></div></div><Donut slices={[{ label: 'Remaining', value: remainingLeave, color: '#108652' }, { label: 'Used', value: usedLeave, color: '#b3762c' }, { label: 'Booked', value: bookedLeave, color: '#9a4a5f' }]} /><div className="report-detail-rows"><div><span>Taken this year</span><strong>{usedLeave} days</strong></div><div><span>Booked ahead</span><strong>{bookedLeave} days</strong></div><div><span>Still available</span><strong>{remainingLeave} days</strong></div></div></article>
      </div>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">ANALYSIS</p><h2>What your numbers say</h2></div></div><div className="analysis-grid">{[
        { tone: 'tone-amber', icon: CircleDollarSign, title: 'Money requests', body: `${money(requested)} requested across ${moneyRequests.items.length} requests.` },
        { tone: 'tone-violet', icon: FileCheck2, title: 'Contract status', body: contract ? `${contract.reference} is ${contract.status}${contractDaysLeft !== null ? ` with ${contractDaysLeft} days remaining` : ''}.` : 'No contract on file yet.' },
        { tone: 'tone-blue', icon: WalletCards, title: 'Pay history', body: payslips.items.length > 0 ? `${payslips.items.length} payslips on record totalling ${money(payslips.items.reduce((sum, item) => sum + item.net_minor, 0))} net.` : 'No payslips issued yet.' },
        { tone: 'tone-green', icon: CalendarDays, title: 'Leave position', body: `${usedLeave} days taken, ${bookedLeave} booked, ${remainingLeave} still available.` },
      ].map((item) => { const Icon = item.icon; return <div className={`analysis-card ${item.tone}`} key={item.title}><span className="analysis-icon"><Icon /></span><strong>{item.title}</strong><p>{item.body}</p></div> })}</div></article>
    </>}

    {tab === 'money' && <div className="report-grid-two"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">MONEY REQUESTS</p><h2>Your requests</h2></div></div><ColumnChart values={moneyRequests.items.map((item) => item.amount_minor)} labels={moneyRequests.items.map((item) => item.reference)} highlight={0} unit="Requested" /></article><article className="panel"><div className="panel-heading"><div><p className="eyebrow">BREAKDOWN</p><h2>Request mix</h2></div></div><Donut slices={[...new Map(moneyRequests.items.map((item) => [item.kind ?? 'Request', moneyRequests.items.filter((entry) => (entry.kind ?? 'Request') === (item.kind ?? 'Request')).reduce((sum, entry) => sum + entry.amount_minor, 0)])).entries()].map(([label, value], index) => ({ label, value, color: ['#108652', '#b3762c', '#9a4a5f', '#3f6280'][index % 4] }))} /></article></div>}

    {tab === 'contract' && <article className="panel"><div className="panel-heading"><div><p className="eyebrow">CONTRACT HEALTH</p><h2>Employment term analysis</h2></div></div><div className="contract-health"><div className="contract-health-ring"><div><strong>{contractDaysLeft !== null ? contractDaysLeft : '-'}</strong><span>days left</span></div></div><div className="contract-health-rows"><div><span>Reference</span><strong>{contract?.reference ?? '-'}</strong></div><div><span>Status</span><strong>{contract?.status ?? '-'}</strong></div><div><span>Start date</span><strong>{contract?.start_date ? formatDate(contract.start_date) : '-'}</strong></div><div><span>End date</span><strong>{contract?.end_date ? formatDate(contract.end_date) : 'Open ended'}</strong></div><div><span>Days remaining</span><strong>{contractDaysLeft !== null ? contractDaysLeft : '-'}</strong></div></div></div></article>}

    {tab === 'leave' && <div className="report-grid-two"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">LEAVE</p><h2>Balances by type</h2></div></div><ColumnChart values={balances.map((item) => item.used_days)} labels={balances.map((item) => item.leave_type)} highlight={0} unit="Days" /></article><article className="panel"><div className="panel-heading"><div><p className="eyebrow">BALANCE</p><h2>Allowance remaining</h2></div></div><Donut slices={[{ label: 'Remaining', value: remainingLeave, color: '#108652' }, { label: 'Used', value: usedLeave, color: '#b3762c' }, { label: 'Booked', value: bookedLeave, color: '#9a4a5f' }]} /><div className="report-detail-rows">{balances.map((item) => <div key={item.leave_type_id}><span>{item.leave_type}</span><strong>{item.remaining_days} left</strong></div>)}</div></article></div>}

    {tab === 'payslip' && <div className="report-grid-two"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAY</p><h2>Net pay by month</h2></div></div><WorkChart primary={paidTrend} labels={series.length > 0 ? series.map((item) => item.month) : labels} highlight={paidTrend.length - 1} format={(value) => money(value)} primaryLabel="Net pay" /></article><article className="panel"><div className="panel-heading"><div><p className="eyebrow">RECORD</p><h2>Registration</h2></div></div><div className="report-detail-rows"><div><span>Employee</span><strong>{registration?.profile.name ?? '-'}</strong></div><div><span>Department</span><strong>{registration?.profile.department ?? '-'}</strong></div><div><span>Role</span><strong>{registration?.profile.role ?? '-'}</strong></div><div><span>Payslips</span><strong>{payslips.items.length}</strong></div><div><span>Contracts</span><strong>{contracts.items.length}</strong></div></div></article></div>}

  </section>
}
function WorkspacePage({ portal, page }: { portal: Portal; page: string }) {
  return <section className="workspace-page"><div className="workspace-hero"><div><p className="eyebrow">WORKSPACE</p><h1>{page}</h1><p>Select a section from the {portal} navigation to continue.</p></div></div></section>
}

function LoginPage({ onLogin }: { onLogin: (portal: Portal, user: AuthUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Sign in against the API. The portal is decided by the role the backend
  // returns, not by which button was pressed.
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)

    try {
      const user = await login(email.trim(), password)
      onLogin(user.is_hr ? 'HR' : 'Employee', user)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed. Please try again.')

      // The password is cleared so a rejected attempt cannot be repeated by
      // resubmitting, and so the next attempt is typed deliberately rather
      // than accepted from a stale autofill. Capitalisation and a trailing
      // space are both rejected by the API.
      setPassword('')
      setBusy(false)
    }
  }

  return <main className="login-screen"><section className="login-widget"><div className="login-brand"><div className="brand-mark"><GoldMark /></div><div><strong>GOLDENHR</strong><span>People, elevated.</span></div></div><h1>Welcome back.</h1><p>Sign in to your people workspace and keep better work moving.</p><form className="login-form" onSubmit={submit}><div className="login-field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="username" placeholder="you@goldenhr.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><div className="login-field"><label htmlFor="login-password">Password</label><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>{error && <div className="login-error" role="alert"><X />{error}</div>}<button className="login-submit" type="submit" disabled={busy}>{busy ? 'Signing in·¦' : 'Sign in to GoldenHR'}</button></form><p className="login-footnote">Passwords are case sensitive and a trailing space is rejected. Your portal is chosen automatically from your account.</p><p className="login-footnote">Build 2026.10.13c</p></section></main>
}

type ActivityRow = { id: string; title: string; meta: string; amount: string; status: string; time: string; kind: NoticeKind }

function Sparkline({ values, tone = 'up' }: { values: number[]; tone?: 'up' | 'down' }) {
  const width = 120
  const height = 40
  const clean = values.map((value) => (Number.isFinite(value) ? value : 0))
  // No data yet (e.g. a brand-new employee with no payslips): render a
  // flat placeholder instead of NaN coordinates that throw in the console.
  if (clean.length === 0) return <svg className={`sparkline ${tone}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2={width} y1={height - 6} y2={height - 6} stroke="#d8cfc0" strokeWidth="2" strokeDasharray="5 4" /></svg>
  const max = Math.max(...clean)
  const min = Math.min(...clean)
  const range = max - min || 1
  const stepX = width / Math.max(clean.length - 1, 1)
  const toY = (value: number) => height - 6 - ((value - min) / range) * (height - 14)
  const path = clean.map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * stepX).toFixed(1)} ${toY(value).toFixed(1)}`).join(' ')
  const id = `spark-${tone}-${clean.length}-${Math.round(max)}-${Math.round(min)}`
  const lastX = (clean.length - 1) * stepX
  const lastY = toY(clean[clean.length - 1])
  const stroke = tone === 'up' ? '#108652' : '#c0563a'
  return <svg className={`sparkline ${tone}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor={stroke} stopOpacity=".26" />
      <stop offset="1" stopColor={stroke} stopOpacity="0" />
    </linearGradient></defs>
    <path d={`${path} L${lastX} ${height} L0 ${height} Z`} fill={`url(#${id})`} />
    <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    <circle cx={lastX} cy={lastY} r="2.6" fill={stroke} vectorEffect="non-scaling-stroke" />
  </svg>
}
function MetricTile({ label, value, delta, foot, icon: Icon, trend, tone = 'up', colour = 'tone-gold' }: { label: string; value: string; delta: number; foot: string; icon: typeof Users; trend: number[]; tone?: 'up' | 'down'; colour?: string }) {
  const rising = delta >= 0
  return <article className={`metric-tile ${colour} ${rising ? 'is-up' : 'is-down'}`}>
    <header><span className="metric-tile-icon"><Icon /></span><span className="metric-tile-label">{label}</span></header>
    <div className="metric-tile-value">{value}</div>
    <footer>
      <span className={`metric-delta ${rising ? 'up' : 'down'}`}>{rising ? <ArrowUpRight /> : <ArrowDownRight />}{Math.abs(delta)}%<small>{foot}</small></span>
      <Sparkline values={trend} tone={tone} />
    </footer>
  </article>
}
function PnlChart({ payroll, requests, labels, primaryLabel = 'Payroll', secondaryLabel = 'Money requested' }: { payroll: number[]; requests: number[]; labels: string[]; primaryLabel?: string; secondaryLabel?: string }) {
  const clean = (series: number[]) => series.map((value) => (Number.isFinite(value) ? value : 0))
  const safePayroll = clean(payroll)
  const safeRequests = clean(requests)
  // Series can differ in length (e.g. a new employee with payslips but no
  // balances yet): index defensively so a missing label never throws.
  const points = safePayroll.length > 0 ? safePayroll : [0]
  const max = Math.max(...points, ...safeRequests, 1)
  const ceil = Math.ceil(max / 10) * 10
  const scale = (value: number) => Math.max(3, (value / (ceil * 1.6)) * 100)
  const [hover, setHover] = useState<number | null>(null)
  return <article className="panel pnl-panel">
    <div className="panel-heading">
      <div><h2 className="pnl-title">{primaryLabel} against {secondaryLabel.toLowerCase()}</h2><p className="muted-copy">Share of total system activity across each month</p></div>
      <div className="pnl-legend"><span><i className="legend-payroll" />{primaryLabel}</span><span><i className="legend-requests" />{secondaryLabel}</span></div>
    </div>
    <div className="pnl-chart" onMouseLeave={() => setHover(null)}>
      <div className="pnl-axis">{[60, 45, 30, 15, 0].map((tick) => <span key={tick}>{tick}k</span>)}</div>
      <div className="pnl-plot">
        {points.map((value, index) => <div className={`pnl-col ${hover === index ? 'hovered' : ''}`} key={index} onMouseEnter={() => setHover(index)}>
          <div className="pnl-bars"><span className="pnl-bar requests" style={{ height: `${scale(safeRequests[index] ?? 0)}%` }} /><span className="pnl-bar payroll" style={{ height: `${scale(value)}%` }} /></div>
          <small className={hover === index ? 'on' : ''}>{(labels[index] ?? '').slice(0, 3)}</small>
          {hover === index && <div className="graph-tip graph-tip-inline"><strong>{labels[index] ?? ''}</strong><span className="primary"><i className="graph-tip-dot" />{primaryLabel}<b>{money(value)}</b></span><span className="secondary"><i className="graph-tip-dot" />{secondaryLabel}<b>{money(safeRequests[index] ?? 0)}</b></span></div>}
        </div>)}
      </div>
    </div>
  </article>
}
function HrDashboard() {
  const { dashboard, monthlyReport, moneyRequests, notifications } = useHrData()
  const rows = rowsOf(monthlyReport)
  const growth = (value: number, before: number) => (before === 0 ? 0 : Math.round(((value - before) / before) * 100))
  const payrollTrend = rows.map((entry) => entry.payrollGross)
  const requestTrend = rows.map((entry) => entry.requested)
  const leaveTrend = rows.map((entry) => entry.leaveApproved + entry.leaveDeclined)
  const headcountTrend = rows.map((entry) => entry.headcount)

  const current = {
    payrollGross: dashboard?.payroll.year_gross_minor ?? 0,
    requested: dashboard?.money_requests.pending_amount_minor ?? 0,
    leave: (dashboard?.leave.pending ?? 0) + (dashboard?.leave.approved_this_month ?? 0) + (dashboard?.leave.declined_this_month ?? 0),
    contracts: dashboard?.contracts.active ?? 0,
    headcount: dashboard?.headcount.active ?? 0,
    rejected: dashboard?.leave.declined_this_month ?? 0,
    requestsCount: dashboard?.money_requests.pending ?? 0,
  }
  const previous = { payrollGross: 0, requested: 0, leave: 0, contracts: 0, headcount: 0, rejected: 0 }

  const feed: ActivityRow[] = notifications.items.slice(0, 6).map((item) => ({
    id: String(item.id),
    title: item.title ?? 'Update',
    meta: item.created_at ? formatRelative(item.created_at) : '',
    amount: '',
    status: item.read ? 'Seen' : 'New',
    time: item.created_at ? formatRelative(item.created_at) : '',
    kind: noticeKindFor(item.kind),
  }))

  if (!dashboard) return <EmptyState label="Loading dashboard" detail="Fetching workspace figures." />

  return <section className="hr-dashboard">
    <div className="workspace-hero"><div><div className="eyebrow"><span className="live-dot" /> {new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div><h1>Good morning.</h1><p>Here is what is happening across your people today.</p></div><div className="header-actions"><button className="secondary-button"><CalendarDays /> This month <ChevronDown /></button></div></div>

    <div className="dash-layout">
      <div className="dash-metrics">
        <MetricTile label="Total payroll" value={compact(current.payrollGross)} delta={growth(current.payrollGross, previous.payrollGross)} foot="This year gross" icon={WalletCards} trend={payrollTrend} colour="tone-gold" />
        <MetricTile label="Money requested" value={compact(current.requested)} delta={growth(current.requested, previous.requested)} foot="Pending advances" icon={CircleDollarSign} trend={requestTrend} colour="tone-amber" />
        <MetricTile label="Leave requests" value={`${current.leave}`} delta={growth(current.leave, previous.leave)} foot="Pending and decided" icon={CalendarDays} trend={leaveTrend} colour="tone-blue" />
        <MetricTile label="Active contracts" value={`${current.contracts}`} delta={growth(current.contracts, previous.contracts)} foot="On record" icon={FileCheck2} trend={rows.map((entry) => entry.contracts)} colour="tone-violet" />
        <MetricTile label="Total employees" value={`${current.headcount}`} delta={growth(current.headcount, previous.headcount)} foot="Headcount" icon={Users} trend={headcountTrend} colour="tone-green" />
        <MetricTile label="Leave declined" value={compact(current.rejected)} delta={-growth(current.rejected, previous.rejected)} foot="This month" icon={X} trend={rows.map((entry) => entry.leaveDeclined)} tone="down" colour="tone-rose" />
      </div>

      <PnlChart payroll={payrollTrend} requests={requestTrend} labels={rows.map((entry) => entry.month)} />
    </div>

    <div className="dash-lower">
      <article className="panel dash-credit">
        <header><p className="eyebrow">Pending money requests</p><button className="icon-button" aria-label="Open money requests"><ArrowUpRight /></button></header>
        <h2>{compact(current.requested)}</h2>
        <span className={`metric-delta ${growth(current.requested, previous.requested) >= 0 ? 'up' : 'down'}`}>{growth(current.requested, previous.requested) >= 0 ? '+' : ''}{growth(current.requested, previous.requested)}%</span>
        <div className="dash-credit-block">
          <div className="dash-credit-head"><strong>Latest requests</strong><button className="more-button">View all <ArrowUpRight /></button></div>
          <div className="dash-request-list">
            {moneyRequests.items.slice(0, 3).map((item) => <div key={item.id}><span><strong>{item.employee?.name ?? 'Request'}</strong><small>{item.status}</small></span><b>{compact(item.amount_minor)}</b></div>)}
            {moneyRequests.items.length === 0 && <div><span><strong>No pending requests</strong></span></div>}
          </div>
        </div>
      </article>

      <article className="panel dash-activity">
        <div className="panel-heading"><div><p className="eyebrow">Latest changes</p><h2>Recent activity</h2></div><div className="dash-activity-tools"><div className="search-field"><Search /><input placeholder="Search" /></div><button className="secondary-button"><Settings /> Filters</button></div></div>
        <div className="profile-table dash-table"><div className="profile-table-row profile-table-head"><span /><span>Activity</span><span>Amount</span><span>Status</span><span>Date</span><span /></div>
          {feed.map((row) => { const Icon = kindMeta[row.kind].icon; return <div className="profile-table-row" key={row.id}>
            <span><label className="dash-check"><input type="checkbox" /><i /></label></span>
            <span className="dash-activity-cell"><span className={`document-type-icon ${row.kind === 'money' ? 'is-image' : 'is-pdf'}`}><Icon /></span><span><strong>{row.title}</strong><small>{row.id} - {row.meta}</small></span></span>
            <span className="payroll-net-cell">{row.amount}</span>
            <span><span className={`status-pill ${row.status === 'Seen' ? 'ok' : ''}`}><i className="status-dot" />{row.status}</span></span>
            <span>{row.time}</span>
            <span><button className="ghost-icon" aria-label={`More actions for ${row.id}`}><MoreHorizontal /></button></span>
          </div> })}
          {feed.length === 0 && <div className="leave-empty"><Activity /><p>No recent activity.</p></div>}
        </div>
      </article>
    </div>

    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={`${dashboard.headcount.on_leave}`} hint="on leave today" tone="tone-blue" icon={CalendarDays} foot="Out of office" />
      <CountWidget value={`${dashboard.leave.pending}`} hint="leave to review" tone="tone-gold" icon={ClipboardCheck} foot="Awaiting decision" />
      <CountWidget value={`${dashboard.contracts.renewal_due}`} hint="renewals due" tone="tone-violet" icon={FileCheck2} foot="Contracts expiring" />
      <CountWidget value={`${dashboard.documents.pending_review}`} hint="documents to review" tone="tone-amber" icon={FolderOpen} foot="Waiting on People Ops" />
    </div>
  </section>
}
function Dashboard({ portal }: { portal: Portal }) {
  return portal === 'HR' ? <HrDashboard /> : <EmployeeDashboard />
}

function Workspace({ portal, active, setActive, currentUser, signOut, collapsed, setCollapsed, mobileOpen, setMobileOpen, pageTitle, theme, setTheme }: {
  portal: Portal
  active: string
  setActive: (item: string) => void
  currentUser: AuthUser | null
  signOut: () => void
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (value: boolean) => void
  pageTitle: string
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}) {
  const { unreadCount } = useHrData()
  return <main className="app-shell">
    <div className={`mobile-overlay ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
    <div className={mobileOpen ? 'mobile-nav-open' : ''}><SideNav portal={portal} active={active} onChange={(item) => { setActive(item); setMobileOpen(false) }} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} unread={unreadCount} user={currentUser} /></div>{collapsed && <button className="sidebar-reopen icon-button" onClick={() => setCollapsed(false)} aria-label="Open sidebar" title="Open sidebar"><Menu /></button>}
    <section className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button><div className="breadcrumb"><Grid2X2 /> <span>Workspace</span><span>/</span><strong>{pageTitle}</strong></div><div className="topbar-right"><button className="top-icon" aria-label="Search"><Search /></button><button className="top-icon notification-button" onClick={() => setActive('Notifications')} aria-label="Notifications"><Bell />{unreadCount > 0 && <i>{unreadCount}</i>}</button><div className="top-profile"><div className="avatar avatar-sand">{initialsOf(currentUser?.name)}</div><ChevronDown /></div><button className="logout-button" onClick={signOut}><LogOut /> Logout</button></div></header>
      <div className="page-content">{active === 'Dashboard' ? <Dashboard portal={portal} /> : active === 'Add employee' && portal === 'HR' ? <AddEmployeePage onDone={() => setActive('Employee management')} /> : active === 'Employee management' && portal === 'HR' ? <EmployeeManagementPage /> : active === 'Department & role' && portal === 'HR' ? <DepartmentRolesPage /> : active === 'Reports' ? <ReportsPage /> : active === 'Contracts' && portal === 'HR' ? <ContractsPage /> : active === 'Documents' && portal === 'HR' ? <DocumentsPage /> : active === 'Work progress' && portal === 'Employee' ? <WorkProgressPage /> : active === 'Contract' && portal === 'Employee' ? <EmployeeContractPage /> : active === 'Leave approval' && portal === 'HR' ? <LeaveApprovalPage /> : active === 'Leave request' && portal === 'Employee' ? <LeaveRequestPage /> : active === 'Payroll' && portal === 'HR' ? <PayrollCenterPage /> : active === 'Notifications' ? <NotificationsPage isEmployee={portal === 'Employee'} /> : active === 'Settings' ? <SettingsPage isEmployee={portal === 'Employee'} theme={theme} setTheme={setTheme} /> : active === 'Registration info' && portal === 'Employee' ? <RegistrationInfo employeeId={null} mode="self" onBack={() => setActive('Dashboard')} /> : active === 'Payslip' && portal === 'Employee' ? <EmployeePayslipsPage /> : active === 'Money request' ? <MoneyRequestPage isEmployee={portal === 'Employee'} /> : <WorkspacePage portal={portal} page={active} />}</div>
      <footer className="main-footer"><span><span className="live-dot" /> All systems operational</span><span>© {new Date().getFullYear()} GoldenHR <span className="footer-divider">·</span> Built for better work. <span className="footer-divider">·</span> build 2026.10.13c</span></footer>
    </section>
  </main>
}

export default function Page() {
  const [authenticated, setAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [portal, setPortal] = useState<Portal>('HR')
  const [active, setActive] = useState('Dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeName>('gold')

  // Restore an existing session on load instead of demanding a fresh
  // sign-in on every refresh.
  useEffect(() => {
    let cancelled = false

    fetchCurrentUser()
      .then((user) => {
        if (cancelled || !user) return
        setCurrentUser(user)
        setPortal(user.is_hr ? 'HR' : 'Employee')
        setAuthenticated(true)
      })
      .catch(() => {
        /* no stored session, or the API is unreachable: show the login screen */
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  const pageTitle = useMemo(() => active === 'Dashboard' ? `${portal} dashboard` : active, [active, portal])

  const signOut = async () => {
    await logout()
    setAuthenticated(false)
    setCurrentUser(null)
    setActive('Dashboard')
  }

  if (!authenticated)
    return (
      <HrDataProvider user={currentUser}>
        <LoginPage onLogin={(next, user) => { setPortal(next); setCurrentUser(user); setActive('Dashboard'); setAuthenticated(true) }} />
      </HrDataProvider>
    )
  return (
    <HrDataProvider user={currentUser}>
      <Workspace portal={portal} active={active} setActive={setActive} currentUser={currentUser} signOut={() => void signOut()} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} pageTitle={pageTitle} theme={theme} setTheme={setTheme} />
    </HrDataProvider>
  )
}