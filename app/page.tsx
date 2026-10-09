'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { fetchCurrentUser, login, logout, type AuthUser } from '../lib/api'
import { HrDataProvider } from '../lib/hr-data'
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

const employeeRecords = [
  { name: 'Amara Okafor', role: 'Product Designer', department: 'Design', email: 'amara@goldenhr.com', phone: '+255 712 448 201', type: 'Full time', salary: 'TSh 4,860,000', hire: 'May 12, 2023', nida: '19901234-56789-00001-12' },
  { name: 'Noah Williams', role: 'Engineering Lead', department: 'Engineering', email: 'noah@goldenhr.com', phone: '+255 713 982 114', type: 'Full time', salary: 'TSh 6,420,000', hire: 'Jan 08, 2022', nida: '19870321-90876-00002-33' },
  { name: 'Sofia Martin', role: 'People Operations', department: 'Human Resources', email: 'sofia@goldenhr.com', phone: '+255 716 229 810', type: 'Contract', salary: 'TSh 3,920,000', hire: 'Aug 21, 2023', nida: '19941122-12098-00003-44' },
  { name: 'Liam Chen', role: 'Growth Manager', department: 'Marketing', email: 'liam@goldenhr.com', phone: '+255 718 102 442', type: 'Part-time', salary: 'TSh 3,100,000', hire: 'Mar 15, 2024', nida: '19920516-33210-00004-55' },
]

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) { return <div className={`field ${full ? 'full' : ''}`}><label>{label}</label>{children}</div> }

type ProfileRecord = typeof employeeRecords[number]

type ProfileTab = 'registration' | 'contract' | 'leave' | 'payslip' | 'documents'

const profileLeave = [
  { type: 'Annual leave', dates: 'Jul 18 Ã¢¬·œ Jul 22, 2024', days: '5 days', status: 'Approved', approver: 'Sofia Martin' },
  { type: 'Sick leave', dates: 'Mar 04 Ã¢¬·œ Mar 05, 2024', days: '2 days', status: 'Approved', approver: 'Sofia Martin' },
  { type: 'Personal leave', dates: 'Feb 12, 2024', days: '1 day', status: 'Declined', approver: 'Sofia Martin' },
]

const profilePayslips = [
  { month: 'June 2024', gross: 'TSh 5,240,000', net: 'TSh 4,860,000', status: 'Paid', paidOn: 'Jun 28, 2024' },
  { month: 'May 2024', gross: 'TSh 5,240,000', net: 'TSh 4,860,000', status: 'Paid', paidOn: 'May 28, 2024' },
  { month: 'April 2024', gross: 'TSh 5,180,000', net: 'TSh 4,812,000', status: 'Paid', paidOn: 'Apr 26, 2024' },
]

const profileDocuments = [
  { name: 'Employment contract.pdf', kind: 'Contract', size: '482 KB', added: 'May 12, 2023' },
  { name: 'CV - full name.pdf', kind: 'Personal', size: '218 KB', added: 'May 12, 2023' },
  { name: 'NIDA registration card.pdf', kind: 'Registration', size: '96 KB', added: 'May 14, 2023' },
  { name: 'Passport scan.jpg', kind: 'Identity', size: '1.2 MB', added: 'May 14, 2023' },
  { name: 'Bank statement June.pdf', kind: 'Payroll', size: '164 KB', added: 'Jun 30, 2024' },
]

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



type EmployeeFormValues = {
  name: string; email: string; birth: string; start: string; hire: string; tin: string
  department: string; role: string; type: string; salary: string; nida: string; phone: string
  address: string; emergency: string
}

const emptyEmployeeForm: EmployeeFormValues = { name: '', email: '', birth: '', start: '', hire: '', tin: '', department: '', role: '', type: '', salary: '', nida: '', phone: '', address: '', emergency: '' }

function toIsoDate(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

function EmployeeForm({ editing, onDone }: { editing: typeof employeeRecords[number] | null; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [values, setValues] = useState<EmployeeFormValues>(() => editing ? {
    name: editing.name, email: editing.email, birth: '', start: toIsoDate(editing.hire), hire: toIsoDate(editing.hire),
    tin: 'TIN-4482-9917', department: editing.department, role: editing.role, type: editing.type,
    salary: editing.salary.replace(/[^\d.]/g, ''), nida: editing.nida, phone: editing.phone, address: '', emergency: '',
  } : emptyEmployeeForm)
  const set = (patch: Partial<EmployeeFormValues>) => setValues((current) => ({ ...current, ...patch }))
  const roles = values.department ? (departmentData.find((department) => department.name === values.department)?.roles ?? []) : departmentData.flatMap((department) => department.roles)
  const title = editing ? 'Edit employee' : 'Add employee'
  const subtitle = editing ? 'Update this profile and employment details.' : 'Create a complete employee profile and securely attach their records.'
  return <section className="form-page">
    <div className="workspace-hero"><div><p className="eyebrow">PEOPLE OPERATIONS</p><h1>{title}</h1><p>{subtitle}</p></div><button className="primary-button" form="employee-form" type="submit"><UserPlus /> {editing ? 'Save changes' : 'Save employee'}</button></div>
    <form className="panel" id="employee-form" onSubmit={(event) => { event.preventDefault(); onDone() }}>
      {editing && <div className="contract-saved profile-edit-banner"><Sparkles /><div><strong>Editing an existing profile</strong><p>Changes apply to this employee record in the people directory.</p></div></div>}
      <div className="form-grid">
        <Field label="Full names"><input required value={values.name} onChange={(event) => set({ name: event.target.value })} placeholder="e.g. Amara Okafor" /></Field>
        <Field label="Email address"><input required type="email" value={values.email} onChange={(event) => set({ email: event.target.value })} placeholder="employee@goldenhr.com" /></Field>
        <Field label="Birth date"><input type="date" value={values.birth} onChange={(event) => set({ birth: event.target.value })} /></Field>
        <Field label="Start working date"><input type="date" value={values.start} onChange={(event) => set({ start: event.target.value })} /></Field>
        <Field label="Hire date"><input type="date" value={values.hire} onChange={(event) => set({ hire: event.target.value })} /></Field>
        <Field label="TIN"><input value={values.tin} onChange={(event) => set({ tin: event.target.value })} placeholder="Tax identification number" /></Field>
        <Field label="Department"><select value={values.department} onChange={(event) => set({ department: event.target.value, role: '' })}><option value="" disabled>Select department</option>{departmentData.map((department) => <option key={department.name}>{department.name}</option>)}</select></Field>
        <Field label="Role"><select value={values.role} onChange={(event) => set({ role: event.target.value })}><option value="" disabled>Select role</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></Field>
        <Field label="Employee type"><select value={values.type} onChange={(event) => set({ type: event.target.value })}><option value="" disabled>Select employee type</option><option>Full time</option><option>Contract</option><option>Temporary</option><option>Part-time</option></select></Field>
        <Field label="Salary"><input type="number" value={values.salary} onChange={(event) => set({ salary: event.target.value })} placeholder="Monthly salary" /></Field>
        <Field label="NIDA"><input value={values.nida} onChange={(event) => set({ nida: event.target.value })} placeholder="NIDA number" /></Field>
        <Field label="Phone"><input type="tel" value={values.phone} onChange={(event) => set({ phone: event.target.value })} placeholder="+255 700 000 000" /></Field>
        <Field label="Address" full><textarea rows={3} value={values.address} onChange={(event) => set({ address: event.target.value })} placeholder="Residential address" /></Field>
        <Field label="Emergency contact"><input value={values.emergency} onChange={(event) => set({ emergency: event.target.value })} placeholder="Name and phone number" /></Field>
        <Field label="Profile image"><label className="upload-box"><Upload /><span>{editing ? 'Replace employee image' : 'Upload employee image'}</span><input type="file" accept="image/*" /></label></Field>
        <Field label="CV"><label className="upload-box"><FileUp /><span>Upload CV / resume</span><input type="file" accept=".pdf,.doc,.docx" /></label></Field>
        <Field label="Employee document" full><label className="upload-box"><FileUp /><span>Upload contract, ID, or supporting document</span><input type="file" /></label></Field>
      </div>
      <div className="account-panel">
        <div className="panel-heading"><div><p className="eyebrow">SYSTEM ACCESS</p><h3 className="attachment-title">{editing ? 'Reset portal password' : 'Create their login'}</h3></div><ShieldCheck className="sparkle" /></div>
        {editing ? <><p className="settings-hint">Leave both fields empty to keep the current password. Share the new password with {editing.name} securely.</p><div className="form-grid"><Field label="New password"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></Field><Field label="Confirm password"><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat the password" /></Field></div></> : <><p className="settings-hint">The employee signs in with their email address and this password to open their portal.</p><div className="form-grid"><Field label="Login email address"><input required type="email" value={values.email} readOnly placeholder="Set the email address above" /></Field><Field label="Employee type access"><input readOnly value="Employee portal" /></Field><Field label="Password"><input required minLength={8} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></Field><Field label="Confirm password"><input required minLength={8} type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat the password" /></Field></div></>}
        {passwordError && <div className="password-error"><X /> {passwordError}</div>}
        <label className="settings-toggle"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show password</label>
      </div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={onDone}>Cancel</button><button className="primary-button" type="submit" onClick={(event) => {
        if (!editing && (password.length < 8 || password !== confirmPassword)) { event.preventDefault(); setPasswordError(password.length < 8 ? 'Set a password of at least 8 characters' : 'Both passwords must match'); return }
        setPasswordError('')
        if (!editing) pushNotice({ kind: 'employee', title: `New employee added: ${values.name}`, detail: `${values.role || 'Role not set'} · ${values.department || 'No department'} · login created for ${values.email}.`, actor: 'Jordan Davis', time: 'Just now', audience: 'HR' })
      }}><UserPlus /> {editing ? 'Save changes' : 'Create employee'}</button></div>
    </form>
  </section>
}

function AddEmployeePage({ editing, onDone }: { editing: typeof employeeRecords[number] | null; onDone: () => void }) {
  return <EmployeeForm editing={editing} onDone={onDone} />
}

function EmployeeManagementPage() {
  const [query, setQuery] = useState(''); const [selected, setSelected] = useState<typeof employeeRecords[number] | null>(null); const [editing, setEditing] = useState<typeof employeeRecords[number] | null>(null); const [records, setRecords] = useState(employeeRecords); const [notice, setNotice] = useState('')
  const filtered = records.filter((person) => `${person.name} ${person.role} ${person.department}`.toLowerCase().includes(query.toLowerCase()))
  if (editing) return <AddEmployeePage editing={editing} onDone={() => { setRecords(records.map((item) => (item.email === editing.email ? { ...item, name: editing.name } : item))); setEditing(null) }} />
  if (selected) return <RegistrationInfo person={selected} mode="hr" onBack={() => setSelected(null)} onSaved={(updated) => { setRecords(records.map((item) => (item.email === updated.email ? updated : item))); setNotice(`${updated.name} record updated`); setSelected(updated) }} />
  return <section className="management-page"><div className="workspace-hero"><div><p className="eyebrow">PEOPLE DIRECTORY</p><h1>Employee management</h1><p>Manage profiles, employment details, and secure employee records.</p></div><button className="primary-button" onClick={() => setNotice('New employee form ready')}><UserPlus /> Add employee</button></div>{notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>Complete the profile and attach the supporting records.</p></div></div>}<div className="panel"><div className="management-toolbar"><div><p className="eyebrow">{records.length} ACTIVE PROFILES</p><h2>All employees</h2></div><div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people" /></div></div><div className="employee-list">{filtered.map((person, index) => <div className="employee-card" key={person.email}><div className={`avatar ${['saffron','olive','plum','clay'][index % 4]}`}>{person.name.split(' ').map((name) => name[0]).join('')}</div><div><strong>{person.name}</strong><span>{person.role} · {person.department}</span></div><span className="status-pill">{person.type}</span><div className="employee-actions"><button aria-label={`View ${person.name}`} onClick={() => setSelected(person)}><Eye /></button><button aria-label={`Edit ${person.name}`} onClick={() => setEditing(person)}><Pencil /></button><button aria-label={`Delete ${person.name}`} onClick={() => setRecords(records.filter((item) => item.email !== person.email))}><Trash2 /></button></div></div>)}</div></div></section>
}

const departmentData = [{ name: 'Engineering', lead: 'Noah Williams', roles: ['Engineering Lead', 'Frontend Engineer', 'QA Specialist'], employees: ['Noah Williams', 'Maya Patel', 'Ethan Cole'] }, { name: 'Design', lead: 'Amara Okafor', roles: ['Product Designer', 'UX Researcher'], employees: ['Amara Okafor', 'Luca Rossi'] }, { name: 'Human Resources', lead: 'Sofia Martin', roles: ['People Operations', 'Recruiter'], employees: ['Sofia Martin', 'Jordan Davis'] }, { name: 'Marketing', lead: 'Liam Chen', roles: ['Growth Manager', 'Content Strategist'], employees: ['Liam Chen', 'Nia Johnson'] }]
const payrollRecords = [{ employee: 'Amara Okafor', month: 'June 2024', gross: 'TSh 5,240,000', net: 'TSh 4,860,000', status: 'Approved' }, { employee: 'Noah Williams', month: 'June 2024', gross: 'TSh 6,900,000', net: 'TSh 6,420,000', status: 'Pending approval' }, { employee: 'Sofia Martin', month: 'June 2024', gross: 'TSh 4,180,000', net: 'TSh 3,920,000', status: 'Approved' }]

type Department = (typeof departmentData)[number]

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

function DepartmentRolesDetail({ department, setDepartments, onBack }: { department: Department; setDepartments: React.Dispatch<React.SetStateAction<Department[]>>; onBack: () => void }) {
  const [bulk, setBulk] = useState(false)
  const [bulkValue, setBulkValue] = useState('')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'roles' | 'employees'>('roles')
  const [assignments, setAssignments] = useState<Record<string, string>>(() => Object.fromEntries(department.employees.map((employee, index) => [employee, department.roles[index % Math.max(department.roles.length, 1)] ?? ''])))
  const [level, setLevel] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')

  const setRoles = (roles: string[]) => setDepartments((items) => items.map((item) => (item.name === department.name ? { ...item, roles } : item)))
const addRoles = (names: string[]) => {
    const merged = [...department.roles]
    const added: string[] = []
    for (const name of names) { const clean = name.trim(); if (clean && !merged.some((role) => role.toLowerCase() === clean.toLowerCase())) { merged.push(clean); added.push(clean) } }
    setRoles(merged)
    setBulkValue('')
    setBulk(false)
    if (added.length) pushNotice({ kind: 'department', title: `${added.length} role${added.length === 1 ? '' : 's'} added to ${department.name}`, detail: added.join(', '), actor: 'Jordan Davis', time: 'Just now', audience: 'HR' })
  }
  const removeRole = (role: string) => {
    setRoles(department.roles.filter((item) => item !== role))
    setNotice(`${role} removed from ${department.name}`)
  }
  const unassigned = department.employees.filter((employee) => !assignments[employee])
  const headcount = (role: string) => department.employees.filter((employee) => assignments[employee] === role).length
  const visibleEmployees = department.employees.filter((employee) => `${employee} ${assignments[employee] ?? ''}`.toLowerCase().includes(query.toLowerCase()))

  return <section className="management-page profile-page">
    <button className="back-link" onClick={onBack}><ChevronDown /> Back to departments</button>
    <div className="panel profile-hero">
      <div className="profile-hero-main"><div className="department-icon"><Building2 /></div><div><p className="eyebrow">DEPARTMENT</p><h1>{department.name}</h1><p className="muted-copy">Led by {department.lead} · {department.employees.length} employees · {department.roles.length} roles defined</p></div></div>
      <div className="form-actions"><button className="secondary-button" onClick={() => setBulk(!bulk)}><Plus /> Add more roles</button><button className="primary-button" onClick={() => setTab('employees')}><UserPlus /> Assign employees</button></div>
    </div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>The role library for this department is up to date.</p></div></div>}
    {bulk && <div className="panel bulk-roles bulk-roles-panel"><div className="panel-heading"><div><p className="eyebrow">BULK ADD</p><h3 className="attachment-title">Paste several roles at once</h3></div><button className="icon-button" onClick={() => setBulk(false)}><X /></button></div><textarea rows={4} placeholder="One role per line, or separate with commas" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} /><div className="form-actions"><button className="primary-button" onClick={() => addRoles(bulkValue.split(/[\n,]/))}><Plus /> Add roles</button></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={`${department.roles.length}`} hint="roles defined" tone="tone-gold" icon={FileCheck2} foot="Role library for this team" />
      <CountWidget value={`${department.employees.length}`} hint="employees" tone="tone-blue" icon={Users} foot="People in the department" />
      <CountWidget value={`${department.employees.length - unassigned.length}`} hint="fully assigned" tone="tone-green" icon={ShieldCheck} foot="Holding a defined role" />
      <CountWidget value={`${unassigned.length}`} hint="unassigned" tone="tone-rose" icon={Clock3} foot="Need a role assignment" />
    </div>
    <div className="profile-tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'roles'} className={`profile-tab ${tab === 'roles' ? 'active' : ''}`} onClick={() => setTab('roles')}><FileCheck2 />Roles · {department.roles.length}</button>
      <button role="tab" aria-selected={tab === 'employees'} className={`profile-tab ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}><Users />Employees · {department.employees.length}</button>
    </div>

    {tab === 'roles' && <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">ROLE LIBRARY</p><h2>Roles in {department.name}</h2></div></div>
      <RoleComposer roles={department.roles} onChange={setRoles} />
      <div className="profile-table role-table"><div className="profile-table-row profile-table-head"><span>Role</span><span>Level</span><span>Headcount</span><span>Assigned people</span><span /></div>
        {department.roles.map((role) => <div className="profile-table-row" key={role}><strong>{role}</strong>
          <span><select className="inline-select" value={level[role] ?? 'Mid level'} onChange={(event) => setLevel((current) => ({ ...current, [role]: event.target.value }))}>{roleLevels.map((item) => <option key={item}>{item}</option>)}</select></span>
          <span>{headcount(role)} {headcount(role) === 1 ? 'person' : 'people'}</span>
          <span className="role-people">{department.employees.filter((employee) => assignments[employee] === role).slice(0, 4).map((employee, index) => <span className={`avatar avatar-mini ${['saffron', 'olive', 'plum', 'clay'][index % 4]}`} key={employee} title={employee}>{employee.split(' ').map((part) => part[0]).join('')}</span>)}</span>
          <button className="ghost-icon" onClick={() => removeRole(role)} aria-label={`Remove ${role}`}><Trash2 /></button>
        </div>)}
        {department.roles.length === 0 && <div className="leave-empty"><FileCheck2 /><p>No roles defined yet. Add the first role above.</p></div>}
      </div>
    </div>}

    {tab === 'employees' && <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">TEAM</p><h2>Employees in {department.name}</h2></div><div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or roles" /></div></div>
      <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Employee</span><span>Assigned role</span><span>Level</span><span>Status</span><span /></div>
        {visibleEmployees.map((employee, index) => {
          const role = assignments[employee] ?? ''
          return <div className="profile-table-row" key={employee}>
            <span className="role-person"><span className={`avatar avatar-mini ${['saffron', 'olive', 'plum', 'clay'][index % 4]}`}>{employee.split(' ').map((part) => part[0]).join('')}</span><strong>{employee}</strong></span>
            <span><select className="inline-select" value={role} onChange={(event) => { setAssignments((current) => ({ ...current, [employee]: event.target.value })); setNotice(`${employee} assigned to ${event.target.value || 'no role'}`); pushNotice({ kind: 'role', title: 'Role assignment updated', detail: `${employee} is now ${event.target.value || 'unassigned'} in ${department.name}.`, actor: 'Jordan Davis', time: 'Just now', audience: 'Both' }) }}><option value="">Unassigned</option>{department.roles.map((item) => <option key={item}>{item}</option>)}</select></span>
            <span>{role && level[role] ? level[role] : 'Ã¢¬·'}</span>
            <span className={`status-pill ${role ? 'ok' : 'off'}`}>{role ? 'Assigned' : 'Unassigned'}</span>
            <button className="ghost-icon" aria-label={`View ${employee}`}><Eye /></button>
          </div>
        })}
        {visibleEmployees.length === 0 && <div className="leave-empty"><Users /><p>No employees match your search.</p></div>}
      </div>
    </div>}
  </section>
}
function DepartmentRolesPage() {
  const [departments, setDepartments] = useState(departmentData)
  const [selected, setSelected] = useState<Department | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [lead, setLead] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [addingTo, setAddingTo] = useState<string | null>(null)

  if (selected) return <DepartmentRolesDetail department={selected} setDepartments={setDepartments} onBack={() => setSelected(null)} />

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">ORGANIZATION</p><h1>Departments & roles</h1><p>Create departments, define roles, and understand every team at a glance.</p></div><button className="primary-button" onClick={() => { setShowForm(true); setSaved(false) }}><Plus /> Create department</button></div>
    {saved && <div className="panel contract-saved"><Sparkles /><div><strong>Department created</strong><p>{name} now has {roles.length} role{roles.length === 1 ? '' : 's'} defined.</p></div></div>}
    <div className="department-grid">{departments.map((department) => <article className="panel department-card" key={department.name}>
      <div className="department-card-head"><div className="department-icon"><Building2 /></div><span className="department-count">{department.employees.length}<small>people</small></span><button className="more-button" onClick={() => setSelected(department)}><Eye /> Summary</button></div>
      <h2>{department.name}</h2><p>Led by <strong>{department.lead}</strong></p>
      {addingTo === department.name ? <RoleComposer roles={department.roles} onChange={(next) => setDepartments((items) => items.map((item) => (item.name === department.name ? { ...item, roles: next } : item)))} placeholder="Type a role, then press enter" /> : <div className="role-list">{department.roles.map((role) => <span key={role}>{role}</span>)}</div>}
      <div className="department-card-actions"><button className="secondary-button" onClick={() => setAddingTo(addingTo === department.name ? null : department.name)}><Plus /> Add role</button><button className="more-button" onClick={() => setSelected(department)}>Manage <ArrowUpRight /></button></div>
      <div className="department-people"><div className="avatar-stack">{department.employees.map((employee, index) => <div className={`avatar ${['saffron', 'olive', 'plum'][index % 3]}`} key={employee}>{employee.split(' ').map((part) => part[0]).join('')}</div>)}</div><span>{department.roles.length} roles defined · {department.roles.length} roles</span></div>
    </article>)}</div>
{showForm && <AppModal eyebrow="Organization" title="Create department" meta="Define the team, its lead and the roles it owns." icon={Building2} footer={<><button className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" onClick={() => { const clean = name.trim(); if (!clean) return; setDepartments([...departments, { name: clean, lead: lead || 'Not assigned', roles, employees: [] }]); setName(''); setLead(''); setRoles([]); setShowForm(false); setSaved(true); pushNotice({ kind: 'department', title: `Department created: ${clean}`, detail: `${roles.length} role${roles.length === 1 ? '' : 's'} defined. Lead: ${lead || 'Not assigned'}.`, actor: 'Jordan Davis', time: 'Just now', audience: 'HR' }) }}><Building2 /> Create department</button></>} onClose={() => setShowForm(false)}>
    <div className="form-grid"><Field label="Department name"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Customer Success" /></Field><Field label="Department lead"><select value={lead} onChange={(event) => setLead(event.target.value)} defaultValue=""><option value="" disabled>Select lead</option>{employeeRecords.map((employee) => <option key={employee.email}>{employee.name}</option>)}</select></Field><div className="field full"><label>Roles in this department</label><RoleComposer roles={roles} onChange={setRoles} /></div></div>
  </AppModal>}
  </section>
}

type LeaveRequest = {
  id: string; employee: string; initials: string; tone: string; type: string
  start: string; end: string; days: number; reason: string; submitted: string
  approver: string; coverage: string; status: 'Pending' | 'Approved' | 'Declined'
}

const initialLeaveRequests: LeaveRequest[] = [
  { id: 'LV-2024-041', employee: 'Amara Okafor', initials: 'AO', tone: 'saffron', type: 'Annual leave', start: '2024-07-18', end: '2024-07-22', days: 5, reason: 'Family visit in Arusha. Handover notes are filed with Luca Rossi before I leave.', submitted: '2 hours ago', approver: 'Sofia Martin', coverage: 'Luca Rossi', status: 'Pending' },
  { id: 'LV-2024-042', employee: 'Liam Chen', initials: 'LC', tone: 'clay', type: 'Personal leave', start: '2024-07-25', end: '2024-07-25', days: 1, reason: 'Personal appointment that cannot be rescheduled during working hours.', submitted: 'Today, 8:12 AM', approver: 'Sofia Martin', coverage: 'Nia Johnson', status: 'Pending' },
  { id: 'LV-2024-043', employee: 'Sofia Martin', initials: 'SM', tone: 'plum', type: 'Medical leave', start: '2024-08-02', end: '2024-08-06', days: 5, reason: 'Medical procedure recommended by my specialist. Medical certificate attached.', submitted: 'Yesterday', approver: 'Jordan Davis', coverage: 'Jordan Davis', status: 'Pending' },
  { id: 'LV-2024-044', employee: 'Noah Williams', initials: 'NW', tone: 'olive', type: 'Annual leave', start: '2024-06-10', end: '2024-06-14', days: 5, reason: 'Annual leave booked in January.', submitted: 'Jun 02', approver: 'Sofia Martin', coverage: 'Ethan Cole', status: 'Approved' },
  { id: 'LV-2024-045', employee: 'Luca Rossi', initials: 'LR', tone: 'olive', type: 'Sick leave', start: '2024-05-20', end: '2024-05-21', days: 2, reason: 'Recovering from flu, doctor advised rest.', submitted: 'May 20', approver: 'Sofia Martin', coverage: 'Amara Okafor', status: 'Declined' },
]

function LeaveApprovalPage() {
  const [requests, setRequests] = useState(initialLeaveRequests)
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Declined'>('Pending')
  const [openId, setOpenId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [notice, setNotice] = useState('')

  const visible = requests.filter((request) => filter === 'All' || request.status === filter)
  const counts = { Pending: requests.filter((r) => r.status === 'Pending').length, Approved: requests.filter((r) => r.status === 'Approved').length, Declined: requests.filter((r) => r.status === 'Declined').length }
  const open = requests.find((request) => request.id === openId)

const decide = (request: LeaveRequest, status: 'Approved' | 'Declined') => {
    setRequests((items) => items.map((item) => (item.id === request.id ? { ...item, status } : item)))
    setNotice(`${request.employee} request ${status.toLowerCase()}`)
    pushNotice({ kind: 'leave', title: `Leave request ${status.toLowerCase()}`, detail: `${request.employee}'s ${request.type.toLowerCase()} of ${request.days} days was ${status.toLowerCase()}.`, actor: 'Sofia Martin', time: 'Just now', audience: status === 'Approved' ? 'Employee' : 'Both' })
    setOpenId(null)
    setNote('')
  }

  if (open) return <section className="management-page profile-page">
    <button className="back-link" onClick={() => { setOpenId(null); setNote('') }}><ChevronDown /> Back to leave approval</button>
    <div className="panel contract-hero">
      <div className="profile-hero-main"><div className={`avatar avatar-large ${open.tone}`}>{open.initials}</div><div><p className="eyebrow">{open.id}</p><h1>{open.type}</h1><p className="muted-copy">{open.employee} · submitted {open.submitted}</p><div className="profile-hero-tags"><span className={`status-pill ${open.status === 'Approved' ? 'ok' : open.status === 'Declined' ? 'off' : ''}`}>{open.status}</span><span className="status-pill">{open.days} working days</span></div></div></div>
      {open.status === 'Pending' && <div className="form-actions"><button className="secondary-button" onClick={() => decide(open, 'Declined')}><X /> Decline</button><button className="primary-button" onClick={() => decide(open, 'Approved')}><FileCheck2 /> Approve request</button></div>}
    </div>
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={open.type} hint="leave type" tone="tone-blue" icon={CalendarDays} foot="Requested category" />
      <CountWidget value={`${open.days}`} hint="working days" tone="tone-gold" icon={Clock3} foot={`${formatDate(open.start)} Ã¢· ·™ ${formatDate(open.end)}`} />
      <CountWidget value={`${18 - open.days}`} hint="days balance left" tone="tone-green" icon={WalletCards} foot="After this request" />
      <CountWidget value={open.approver} hint="approver" tone="tone-violet" icon={ShieldCheck} foot={open.coverage === open.approver ? 'Also covering the leave' : `Cover: ${open.coverage}`} />
    </div>
    <div className="contract-columns">
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">REQUEST DETAIL</p><h2>Dates and reason</h2></div></div><div className="detail-fields profile-fields">{[['Start date', formatDate(open.start)], ['End date', formatDate(open.end)], ['Working days', `${open.days} days`], ['Coverage during leave', open.coverage], ['Leave balance before', '18 days'], ['Leave balance after', `${18 - open.days} days`]].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="profile-note"><FileText /><div><strong>Reason given</strong><p>{open.reason}</p></div></div></article>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">DECISION</p><h2>Reviewer note</h2></div></div><textarea rows={6} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note for the employee record" /><div className="form-actions">{open.status === 'Pending' ? <><button className="secondary-button" onClick={() => decide(open, 'Declined')}><X /> Decline</button><button className="primary-button" onClick={() => decide(open, 'Approved')}><FileCheck2 /> Approve</button></> : <span className="muted-copy">Decided as {open.status.toLowerCase()}</span>}</div></article>
    </div>
  </section>

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">TIME OFF</p><h1>Leave approval</h1><p>Review team requests, keep coverage balanced, and record every decision.</p></div></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>The decision was recorded and the employee has been notified.</p></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={`${counts.Pending}`} hint="awaiting review" tone="tone-gold" icon={ClipboardCheck} foot="Requests in the queue" />
      <CountWidget value={`${counts.Approved}`} hint="approved this month" tone="tone-green" icon={FileCheck2} foot="Granted this period" />
      <CountWidget value={`${counts.Declined}`} hint="declined" tone="tone-rose" icon={X} foot="Sent back to employees" />
      <CountWidget value="12" hint="on leave today" tone="tone-blue" icon={CalendarDays} foot="Across all departments" />
    </div>
    <div className="profile-tabs" role="tablist">{(['Pending', 'Approved', 'Declined', 'All'] as const).map((key) => <button key={key} role="tab" aria-selected={filter === key} className={`profile-tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}><ClipboardCheck />{key === 'All' ? 'All requests' : `${key} · ${counts[key]}`}</button>)}</div>
    <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">{visible.length} SHOWN</p><h2>{filter === 'All' ? 'All requests' : `${filter} requests`}</h2></div></div>
      <div className="leave-list">
        {visible.map((request) => <article className="leave-row" key={request.id}>
          <div className={`avatar ${request.tone}`}>{request.initials}</div>
          <div className="leave-row-main"><div className="leave-row-head"><strong>{request.employee}</strong><span className="status-pill">{request.type}</span></div><p className="leave-row-dates">{formatDate(request.start)} Ã¢· ·™ {formatDate(request.end)} <i>·</i> {request.days} working days</p><p className="leave-row-meta">Coverage: {request.coverage} <i>·</i> Approver: {request.approver} <i>·</i> Submitted {request.submitted}</p><p className="leave-row-reason">{request.reason}</p></div>
          <div className="leave-row-actions">{request.status === 'Pending' ? <><button className="secondary-button" onClick={() => decide(request, 'Declined')}>Decline</button><button className="primary-button" onClick={() => decide(request, 'Approved')}><FileCheck2 /> Approve</button></> : <span className={`status-pill ${request.status === 'Approved' ? 'ok' : 'off'}`}>{request.status}</span>}<button className="more-button" onClick={() => setOpenId(request.id)}><Eye /> Review</button></div>
        </article>)}
        {visible.length === 0 && <div className="leave-empty"><ClipboardCheck /><p>No {filter.toLowerCase()} requests right now.</p></div>}
      </div>
    </div>
  </section>
}

function LeaveRequestPage() {
  const [submitted, setSubmitted] = useState(false)
  const [type, setType] = useState('Annual leave')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [days, setDays] = useState('1')
  if (submitted) return <section className="form-page"><div className="panel success-panel"><Sparkles /><h2>Request submitted</h2><p>Your leave request is now with your manager for review.</p><div className="form-actions" style={{ justifyContent: 'center' }}><button className="secondary-button" onClick={() => setSubmitted(false)}>Create another request</button></div></div></section>
  return <section className="form-page">
    <div className="workspace-hero"><div><p className="eyebrow">TIME OFF</p><h1>Request leave</h1><p>Plan time away while keeping your team informed.</p></div></div>
    <form className="panel" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}>
      <div className="form-grid">
        <Field label="Leave type"><select value={type} onChange={(event) => setType(event.target.value)}><option>Annual leave</option><option>Sick leave</option><option>Personal leave</option><option>Medical leave</option><option>Parental leave</option></select></Field>
        <Field label="Working days requested"><input type="number" min="1" value={days} onChange={(event) => setDays(event.target.value)} /></Field>
        <Field label="Start date"><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></Field>
        <Field label="End date"><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></Field>
        <Field label="Leave balance after request" full><div className="leave-balance"><Sparkles /><div><strong>{Math.max(0, 18 - Number(days || 0))} days remaining</strong><p>{type} · {start && end ? `${formatDate(start)} Ã¢· ·™ ${formatDate(end)}` : 'Add dates to see the period'}</p></div></div></Field>
        <Field label="Reason" full><textarea rows={4} placeholder="Add context for your manager" /></Field>
      </div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setSubmitted(false)}>Cancel</button><button className="primary-button" type="submit"><CalendarDays /> Submit request</button></div>
    </form>
  </section>
}

type PayrollRecord = {
  id: string; employee: string; initials: string; tone: string; month: string
  basic: number; overtime: number; bonus: number; allowance: number; tax: number; pension: number; other: number
  gross: number; net: number; method: string; status: 'Paid' | 'Approved' | 'Pending approval'; paidOn: string
}

const money = (value: number) => `TSh ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`

function buildGross(entry: Omit<PayrollRecord, 'id' | 'gross' | 'net' | 'status' | 'paidOn' | 'initials' | 'tone'>) {
  return entry.basic + entry.overtime + entry.bonus + entry.allowance
}

const initialPayroll: PayrollRecord[] = [
  { id: 'PR-2024-062', employee: 'Amara Okafor', initials: 'AO', tone: 'saffron', month: '2024-06', basic: 4500000, overtime: 340000, bonus: 400000, allowance: 0, tax: 470000, pension: 360000, other: 0, gross: 5240000, net: 4410000, method: 'Bank transfer', status: 'Approved', paidOn: 'Jun 28, 2024' },
  { id: 'PR-2024-063', employee: 'Noah Williams', initials: 'NW', tone: 'olive', month: '2024-06', basic: 6000000, overtime: 500000, bonus: 400000, allowance: 0, tax: 630000, pension: 480000, other: 0, gross: 6900000, net: 5790000, method: 'Bank transfer', status: 'Pending approval', paidOn: 'Pending' },
  { id: 'PR-2024-064', employee: 'Sofia Martin', initials: 'SM', tone: 'plum', month: '2024-06', basic: 3600000, overtime: 280000, bonus: 300000, allowance: 0, tax: 410000, pension: 290000, other: 0, gross: 4180000, net: 3480000, method: 'Bank transfer', status: 'Approved', paidOn: 'Jun 28, 2024' },
  { id: 'PR-2024-065', employee: 'Liam Chen', initials: 'LC', tone: 'clay', month: '2024-06', basic: 2800000, overtime: 180000, bonus: 120000, allowance: 0, tax: 320000, pension: 224000, other: 0, gross: 3100000, net: 2556000, method: 'Mobile money', status: 'Paid', paidOn: 'Jun 28, 2024' },
]

const deductionOptions = [
  { key: 'tax' as const, label: 'PAYE income tax' },
  { key: 'pension' as const, label: 'NSSF pension' },
  { key: 'other' as const, label: 'Other deductions' },
]

function PayrollBreakdown({ basic, overtime, bonus, allowance, tax, pension, other }: Pick<PayrollRecord, 'basic' | 'overtime' | 'bonus' | 'allowance' | 'tax' | 'pension' | 'other'>) {
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
      {deductionOptions.map(({ key, label }) => <div key={key}><span>{label}</span><strong>Ã¢Ë†·™ {money(key === 'tax' ? tax : key === 'pension' ? pension : other)}</strong></div>)}
      <div className="payroll-lines-total"><span>Total deductions</span><strong>Ã¢Ë†·™ {money(total)}</strong></div>
    </div>
    <div className="payroll-net"><span>Net pay</span><strong>{money(net)}</strong></div>
  </div>
}

function CreatePayrollPage({ onCreated, onCancel }: { onCreated: (record: PayrollRecord) => void; onCancel: () => void }) {
  const [step, setStep] = useState(1)
  const [person, setPerson] = useState<typeof employeeRecords[number] | null>(null)
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState('2024-07')
  const [entry, setEntry] = useState({ basic: 0, overtime: 0, bonus: 0, allowance: 0, tax: 0, pension: 0, other: 0 })
  const [method, setMethod] = useState('Bank transfer')
  const [done, setDone] = useState(false)

  const candidates = employeeRecords.filter((record) => `${record.name} ${record.role} ${record.department}`.toLowerCase().includes(query.toLowerCase()))
  const set = (patch: Partial<typeof entry>) => setEntry((current) => ({ ...current, ...patch }))

  const choose = (record: typeof employeeRecords[number]) => {
    setPerson(record)
    const base = Number(record.salary.replace(/[^\d.]/g, '')) || 0
    setEntry({ basic: base, overtime: 0, bonus: 0, allowance: 0, tax: Math.round(base * 0.11), pension: Math.round(base * 0.08), other: 0 })
    setStep(2)
  }

  const gross = entry.basic + entry.overtime + entry.bonus + entry.allowance
  const deductions = entry.tax + entry.pension + entry.other
  const net = gross - deductions

  if (done && person) return <section className="form-page">
    <div className="panel success-panel"><Sparkles /><h2>Payroll created</h2><p>{person.name}'s {month} payroll of {money(net)} net is ready for approval.</p><div className="form-actions" style={{ justifyContent: 'center' }}><button className="secondary-button" onClick={onCancel}><ArrowUpRight /> Back to payroll center</button><button className="primary-button" onClick={() => { setDone(false); setPerson(null); setStep(1) }}><Plus /> Create another</button></div></div>
  </section>

  return <section className="management-page payroll-create">
    <button className="back-link" onClick={onCancel}><ChevronDown /> Back to payroll center</button>
    <div className="workspace-hero"><div><p className="eyebrow">COMPENSATION</p><h1>Create payroll</h1><p>Select an employee, review their record, then build the monthly pay run.</p></div></div>
    <div className="payroll-steps">
      {[['01', 'Select employee', 'Employee details load automatically'], ['02', 'Build the pay run', 'Earnings and deductions'], ['03', 'Review and save', 'Confirm the net amount']].map(([number, title, detail], index) => <div className={`payroll-step ${step > index + 1 ? 'done' : ''} ${step === index + 1 ? 'current' : ''}`} key={number}><span>{step > index + 1 ? <FileCheck2 /> : number}</span><div><strong>{title}</strong><p>{detail}</p></div></div>)}
    </div>

    {step === 1 && <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">STEP 01</p><h2>Who is this payroll for?</h2></div><div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees" /></div></div>
      <div className="employee-select-list">{candidates.map((record, index) => <button className="employee-select-row" key={record.email} onClick={() => choose(record)}><span className={`avatar ${['saffron', 'olive', 'plum', 'clay'][index % 4]}`}>{record.name.split(' ').map((part) => part[0]).join('')}</span><span><strong>{record.name}</strong><span>{record.role} · {record.department} · {record.type}</span></span><span className="employee-select-salary">{record.salary}<small>per month</small></span><ArrowUpRight /></button>)}</div>
      {candidates.length === 0 && <div className="leave-empty"><Users /><p>No employees match your search.</p></div>}
    </div>}

    {step > 1 && person && <div className="payroll-layout">
      <div className="payroll-main">
        <article className="panel payroll-employee">
          <div className="panel-heading"><div><p className="eyebrow">EMPLOYEE ON THIS PAY RUN</p><h2>{person.name}</h2></div><button className="secondary-button" onClick={() => setStep(1)}><Pencil /> Change</button></div>
          <div className="profile-hero-main payroll-employee-main"><div className={`avatar avatar-large ${['saffron', 'olive', 'plum', 'clay'][employeeRecords.indexOf(person) % 4]}`}>{person.name.split(' ').map((part) => part[0]).join('')}</div><div><p className="muted-copy">{person.role} · {person.department} · {person.type}</p><div className="profile-hero-tags"><span className="status-pill">{person.hire}</span><span className="status-pill">NIDA {person.nida}</span><span className="status-pill ok">Active</span></div></div></div>
          <div className="detail-fields profile-fields">
            {[['Phone', person.phone], ['Email', person.email], ['NIDA', person.nida], ['TIN', 'TIN-4482-9917'], ['Base salary', person.salary], ['Employment type', person.type]].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}
          </div>
          <div className="profile-note"><ShieldCheck /><div><strong>Record verified</strong><p>Identity, tax number and base salary were fetched from the employee record.</p></div></div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">STEP 02 · EARNINGS</p><h2>Pay period</h2></div></div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Pay month</small><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></div>
            <div className="detail-field"><small>Payment method</small><select value={method} onChange={(event) => setMethod(event.target.value)}><option>Bank transfer</option><option>Mobile money</option><option>Cash</option></select></div>
            <div className="detail-field"><small>Basic salary</small><input type="number" value={entry.basic} onChange={(event) => set({ basic: Number(event.target.value) })} /></div>
            <div className="detail-field"><small>Overtime</small><input type="number" value={entry.overtime} onChange={(event) => set({ overtime: Number(event.target.value) })} /></div>
            <div className="detail-field"><small>Bonus</small><input type="number" value={entry.bonus} onChange={(event) => set({ bonus: Number(event.target.value) })} /></div>
            <div className="detail-field"><small>Allowance</small><input type="number" value={entry.allowance} onChange={(event) => set({ allowance: Number(event.target.value) })} /></div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">STEP 02 · DEDUCTIONS</p><h2>Statutory and other</h2></div></div>
          <div className="detail-fields profile-fields">
            {deductionOptions.map(({ key, label }) => <div className="detail-field" key={key}><small>{label}</small><input type="number" value={entry[key]} onChange={(event) => set({ [key]: Number(event.target.value) } as Partial<typeof entry>)} /></div>)}
          </div>
          <div className="profile-note"><CircleDollarSign /><div><strong>Net pay is {money(net)}</strong><p>Deductions are pre-filled from the statutory rates. Adjust before saving if needed.</p></div></div>
        </article>

        <div className="form-actions"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button" onClick={() => { onCreated({ id: `PR-2024-0${66 + Math.floor(Math.random() * 9)}`, employee: person.name, initials: person.name.split(' ').map((part) => part[0]).join(''), tone: ['saffron', 'olive', 'plum', 'clay'][employeeRecords.indexOf(person) % 4], month, ...entry, gross, net, method, status: 'Pending approval', paidOn: 'Pending' }); setDone(true) }}><FileCheck2 /> Create payroll</button></div>
      </div>
      <aside className="payroll-side">
        <PayrollBreakdown {...entry} />
        <div className="panel payroll-side-note"><WalletCards /><div><strong>{person.name}</strong><p>{new Date(`${month}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} · {method}</p></div></div>
      </aside>
    </div>}
  </section>
}

function PayrollCenterPage() {
  const [records, setRecords] = useState(initialPayroll)
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  if (creating) return <CreatePayrollPage onCancel={() => setCreating(false)} onCreated={(record) => { setRecords([record, ...records]); setCreating(false); setNotice(`${record.employee} payroll created`); pushNotice({ kind: 'payroll', title: `Payroll created for ${record.employee}`, detail: `A new pay run of ${money(record.net)} net is awaiting approval.`, actor: 'Jordan Davis', time: 'Just now', audience: 'Both' }) }} />

  const open = records.find((record) => record.id === openId)
  if (open) return <section className="management-page profile-page">
    <button className="back-link" onClick={() => setOpenId(null)}><ChevronDown /> Back to payroll center</button>
    <div className="panel profile-hero">
      <div className="profile-hero-main"><div className={`avatar avatar-large ${open.tone}`}>{open.initials}</div><div><p className="eyebrow">{open.id}</p><h1>{open.employee}</h1><p className="muted-copy">{new Date(`${open.month}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} · {open.method} · {open.paidOn === 'Pending' ? 'not yet paid' : `paid ${open.paidOn}`}</p><div className="profile-hero-tags"><span className={`status-pill ${open.status === 'Pending approval' ? '' : 'ok'}`}>{open.status}</span></div></div></div>
      <div className="form-actions"><button className="secondary-button" onClick={() => window.print()}><Download /> Export as PDF</button>{open.status === 'Pending approval' && <button className="primary-button" onClick={() => { setRecords(records.map((item) => (item.id === open.id ? { ...item, status: 'Approved', paidOn: 'Jul 28, 2024' } : item))); setNotice(`${open.employee} payroll approved`); pushNotice({ kind: 'payroll', title: `Payroll approved for ${open.employee}`, detail: `${money(open.net)} net was approved and queued for payment.`, actor: 'Jordan Davis', time: 'Just now', audience: 'Both' }) }}><FileCheck2 /> Approve payroll</button>}</div>
    </div>
    <div className="contract-columns">
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAYSLIP DETAIL</p><h2>Earnings and deductions</h2></div></div><PayrollBreakdown basic={open.basic} overtime={open.overtime} bonus={open.bonus} allowance={open.allowance} tax={open.tax} pension={open.pension} other={open.other} /></article>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">RECORD</p><h2>Payment info</h2></div></div><div className="detail-fields profile-fields">{[['Reference', open.id], ['Employee', open.employee], ['Pay month', new Date(`${open.month}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })], ['Method', open.method], ['Status', open.status], ['Paid on', open.paidOn], ['Gross pay', money(open.gross)], ['Total deductions', money(open.tax + open.pension + open.other)], ['Net pay', money(open.net)]].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="form-actions"><button className="primary-button" onClick={() => window.print()}><Download /> Download payslip</button></div></article>
    </div>
  </section>

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">COMPENSATION</p><h1>Payroll center</h1><p>Create, review, and approve accurate monthly payroll.</p></div><button className="primary-button" onClick={() => setCreating(true)}><Plus /> Create payroll</button></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>The pay run is recorded in the payroll register.</p></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={compact(records.reduce((sum, record) => sum + record.net, 0))} hint="net payroll" tone="tone-gold" icon={WalletCards} foot="This month across all staff" />
      <CountWidget value={`${records.length}`} hint="on payroll" tone="tone-blue" icon={Users} foot="Employees paid this run" />
      <CountWidget value={`${records.filter((record) => record.status === 'Pending approval').length}`} hint="awaiting approval" tone="tone-amber" icon={Clock3} foot="Queued for sign off" />
      <CountWidget value={compact(records.reduce((sum, record) => sum + record.tax + record.pension + record.other, 0))} hint="deductions" tone="tone-rose" icon={ShieldCheck} foot="PAYE, NSSF and other" />
    </div>
    <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">PAYROLL REGISTER</p><h2>{records.length} pay runs</h2></div></div>
      <div className="profile-table payroll-table"><div className="profile-table-row profile-table-head"><span>Employee</span><span>Month</span><span>Gross</span><span>Deductions</span><span>Net pay</span><span>Status</span><span /></div>
        {records.map((record) => <div className="profile-table-row" key={record.id}>
          <span className="role-person"><span className={`avatar avatar-mini ${record.tone}`}>{record.initials}</span><strong>{record.employee}</strong></span>
          <span>{new Date(`${record.month}-01`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
          <span>{money(record.gross)}</span>
          <span>{money(record.tax + record.pension + record.other)}</span>
          <span className="payroll-net-cell">{money(record.net)}</span>
          <span className={`status-pill ${record.status === 'Pending approval' ? '' : 'ok'}`}>{record.status}</span>
          <span className="employee-actions"><button onClick={() => setOpenId(record.id)} aria-label={`View ${record.id}`}><Eye /></button>{record.status === 'Pending approval' && <button onClick={() => { setRecords(records.map((item) => (item.id === record.id ? { ...item, status: 'Approved', paidOn: 'Jul 28, 2024' } : item))); setNotice(`${record.employee} payroll approved`); pushNotice({ kind: 'payroll', title: `Payroll approved for ${record.employee}`, detail: `${money(record.net)} net was approved and queued for payment.`, actor: 'Jordan Davis', time: 'Just now', audience: 'Both' }) }} aria-label={`Approve ${record.id}`}><FileCheck2 /></button>}<button onClick={() => window.print()} aria-label={`Download ${record.id}`}><Download /></button></span>
        </div>)}
      </div>
    </div>
  </section>
}

function EmployeePayslipsPage() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const mine = initialPayroll.filter((record) => record.employee === 'Amara Okafor').concat(initialPayroll[0])
  const open = mine.find((record) => record.id === openId)
  const totalNet = mine.reduce((sum, record) => sum + record.net, 0)
  const last = mine[0]

  return <section className="form-page">
    <div className="workspace-hero"><div><p className="eyebrow">COMPENSATION</p><h1>My payslips</h1><p>Your approved salary statements, ready whenever you need them.</p></div></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>Your payslip archive is up to date.</p></div></div>}

    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={money(last.net)} hint="latest net pay" tone="tone-gold" icon={WalletCards} delta={4} foot="vs previous month" />
      <CountWidget value={money(totalNet)} hint="total received" tone="tone-green" icon={CircleDollarSign} delta={6} foot={'across ' + mine.length + ' payslips'} />
      <CountWidget value={String(mine.length)} hint="payslips available" tone="tone-blue" icon={FileText} delta={8} foot="Ready to download" />
      <CountWidget value={String(mine.filter((record) => record.status === 'Paid' || record.status === 'Approved').length)} hint="paid and approved" tone="tone-violet" icon={ShieldCheck} delta={0} foot="Cleared by payroll" />
    </div>

    <div className="payslip-grid">
      {mine.map((record, index) => {
        const deductions = record.tax + record.pension + record.other
        return <article className="panel payslip-card" key={record.id + '-' + index}>
          <div className="payslip-card-head"><span className="payslip-card-icon"><WalletCards /></span><span className={'status-pill ' + (record.status === 'Paid' || record.status === 'Approved' ? 'ok' : '')}>{record.status}</span></div>
          <p className="eyebrow">{new Date(record.month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
          <h2>{money(record.net)}</h2>
          <p className="payslip-card-note">Net salary Â· gross {money(record.gross)}</p>
          <div className="payslip-card-stats"><span><small>Paid on</small><strong>{record.paidOn}</strong></span><span><small>Deductions</small><strong>{money(deductions)}</strong></span></div>
          <div className="payslip-card-foot"><span className="payslip-ref">{record.id}</span><div className="form-actions"><button className="secondary-button" onClick={() => setOpenId(record.id)}><Eye /> View</button><button className="primary-button" onClick={() => { window.print(); setNotice('Payslip download started') }}><Download /> PDF</button></div></div>
        </article>
      })}
    </div>

    {open && <AppModal
      eyebrow="Pay statement"
      title={new Date(open.month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + ' payslip'}
      meta={open.id + ' Â· paid via ' + open.method.toLowerCase() + ' Â· ' + open.paidOn}
      icon={WalletCards}
      status={open.status}
      statusTone={open.status === 'Paid' || open.status === 'Approved' ? 'ok' : 'warn'}
      heroLabel="Net paid"
      heroValue={money(open.net)}
      heroNote={'Gross ' + money(open.gross) + ' Â· deductions ' + money(open.tax + open.pension + open.other)}
      rows={[
        ['Basic salary', money(open.basic)],
        ['Overtime', money(open.overtime)],
        ['Bonus', money(open.bonus)],
        ['Allowance', money(open.allowance)],
        ['PAYE income tax', 'âˆ’ ' + money(open.tax)],
        ['NSSF pension', 'âˆ’ ' + money(open.pension)],
        ['Other deductions', 'âˆ’ ' + money(open.other)],
        ['Payment method', open.method],
        ['Paid on', open.paidOn],
      ]}
      asideLabel="Account"
      aside={[
        { label: 'Employee', value: 'Amara Okafor' },
        { label: 'Role', value: 'Product Designer' },
        { label: 'Bank', value: 'CRDB Bank' },
        { label: 'Account no', value: '0001 2345 6789 01' },
        { label: 'Reference', value: open.id },
      ]}
      footer={<><button className="primary-button" onClick={() => window.print()}><Download /> Download PDF</button><button className="secondary-button" onClick={() => window.print()}><FileText /> Export as PDF</button></>}
      onClose={() => setOpenId(null)}
    />}
  </section>
}

function addDays(iso: string, days: number) {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  date.setMonth(date.getMonth() + Math.floor(days / 30))
  date.setDate(date.getDate() + (days % 30))
  return date.toISOString().slice(0, 10)
}

function formatDate(iso: string) {
  if (!iso) return 'Ã¢¬·'
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
  employee: string
  kind: string
  durationDays: number
  start: string
  salary: string
  description: string
  termination: string
  files: { name: string; size: string; kind: string }[]
}

function newDraft(index: number): ContractDraft {
  return { id: `draft-${index}`, employee: '', kind: 'Full time employment', durationDays: 365, start: '2024-07-01', salary: '', description: '', termination: '', files: [] }
}

const seededContracts = [
  { id: 'GH-2024-018', employee: 'Amara Okafor', kind: 'Full time employment', start: '2023-05-12', end: '2026-05-11', days: 1095, salary: 'TSh 4,860,000', status: 'Active', signed: 'Signed May 10, 2023', file: 'Amara Okafor · Employment Agreement.pdf' },
  { id: 'GH-2024-019', employee: 'Noah Williams', kind: 'Full time employment', start: '2022-01-08', end: '2026-01-07', days: 1460, salary: 'TSh 6,420,000', status: 'Renewal due', signed: 'Signed Jan 05, 2022', file: 'Noah Williams · Contract 2022.pdf' },
  { id: 'GH-2024-020', employee: 'Sofia Martin', kind: 'Fixed term contract', start: '2023-08-21', end: '2024-08-20', days: 365, status: 'Renewal due', signed: 'Signed Aug 19, 2023', salary: 'TSh 3,920,000', file: 'Sofia Martin · Fixed Term.pdf' },
  { id: 'GH-2024-021', employee: 'Liam Chen', kind: 'Part time employment', start: '2024-03-15', end: '2025-03-14', days: 365, salary: 'TSh 3,100,000', status: 'Active', signed: 'Signed Mar 13, 2024', file: 'Liam Chen · Part Time.pdf' },
]

function ContractsPage() {
  const [drafts, setDrafts] = useState<ContractDraft[]>([newDraft(0)])
  const [created, setCreated] = useState(seededContracts)
  const [saved, setSaved] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  if (openId) {
    const contract = created.find((item) => item.id === openId)
    if (contract) return <ContractDetailPage contract={contract} onBack={() => setOpenId(null)} />
  }

  const update = (id: string, patch: Partial<ContractDraft>) => setDrafts((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  return <section className="management-page contract-page">
    <div className="workspace-hero"><div><p className="eyebrow">PEOPLE DOCUMENTS</p><h1>Contracts</h1><p>Draft agreements, control renewal dates, and keep every signed document on file.</p></div><button className="primary-button" onClick={() => setDrafts((items) => [...items, newDraft(items.length)])}><Plus /> Add contract</button></div>

    <div className="contract-steps">
      <div className="contract-step"><span>01</span><div><strong>Select employee</strong><p>Key personal and payroll details load automatically.</p></div></div>
      <div className="contract-step"><span>02</span><div><strong>Set terms</strong><p>Duration and dates, salary, description, termination.</p></div></div>
      <div className="contract-step"><span>03</span><div><strong>Attach document</strong><p>Upload the signed PDF or a scanned image.</p></div></div>
    </div>

    {drafts.map((draft, index) => {
      const person = employeeRecords.find((record) => record.name === draft.employee)
      const end = draft.durationDays === 0 ? '' : addDays(draft.start, draft.durationDays - 1)
      const duration = contractDurations.find((item) => item.days === draft.durationDays)
      return <div className="panel contract-draft" key={draft.id}>
        <div className="panel-heading"><div><p className="eyebrow">CONTRACT {String(index + 1).padStart(2, '0')}</p><h2>{person ? person.name : 'New contract'}</h2></div><div className="form-actions">{drafts.length > 1 && <button className="secondary-button" onClick={() => setDrafts((items) => items.filter((item) => item.id !== draft.id))}><Trash2 /> Remove</button>}<span className="status-pill">Draft</span></div></div>

        <div className="detail-fields profile-fields">
          <div className="detail-field"><small>Employee</small><select value={draft.employee} onChange={(event) => update(draft.id, { employee: event.target.value })}><option value="">Select employee</option>{employeeRecords.map((record) => <option key={record.email}>{record.name}</option>)}</select></div>
          <div className="detail-field"><small>Contract type</small><select value={draft.kind} onChange={(event) => update(draft.id, { kind: event.target.value })}><option>Full time employment</option><option>Fixed term contract</option><option>Part time employment</option><option>Probation contract</option><option>Consultancy agreement</option></select></div>
        </div>

        {person ? <div className="contract-verified">
          <p className="eyebrow">VERIFIED EMPLOYEE DETAILS</p>
          <div className="detail-fields profile-fields">
            {[['Role', person.role], ['Department', person.department], ['Phone', person.phone], ['Email', person.email], ['NIDA', person.nida], ['TIN', 'TIN-4482-9917'], ['Base salary', person.salary], ['Hire date', person.hire]].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}
          </div>
        </div> : <div className="contract-placeholder"><ShieldCheck /><p>Select an employee to review their contact details, NIDA, TIN number and base salary before drafting terms.</p></div>}

        <div className="detail-fields profile-fields">
          <div className="detail-field"><small>Start date</small><input type="date" value={draft.start} onChange={(event) => update(draft.id, { start: event.target.value })} /></div>
          <div className="detail-field"><small>Contract duration</small><select value={draft.durationDays} onChange={(event) => update(draft.id, { durationDays: Number(event.target.value) })}>{contractDurations.map((item) => <option key={item.label} value={item.days}>{item.label}</option>)}</select></div>
          <div className="detail-field"><small>End date (auto)</small><input readOnly value={draft.durationDays === 0 ? 'No end date' : formatDate(end)} /></div>
          <div className="detail-field"><small>Base salary</small><input value={draft.salary} onChange={(event) => update(draft.id, { salary: event.target.value })} placeholder={person ? person.salary : 'e.g. TSh 4,860,000'} /></div>
          <div className="detail-field full"><small>Description</small><textarea rows={3} value={draft.description} onChange={(event) => update(draft.id, { description: event.target.value })} placeholder="Scope of duties, reporting line, and any special conditions" /></div>
          <div className="detail-field full"><small>Reason to terminate</small><textarea rows={3} value={draft.termination} onChange={(event) => update(draft.id, { termination: event.target.value })} placeholder="Notice period, severance terms, and conditions that end the agreement" /></div>
        </div>

        <div className="contract-attachments">
          <div className="panel-heading"><div><p className="eyebrow">ATTACHMENTS</p><h3 className="attachment-title">Contract document</h3></div><button className="secondary-button" onClick={() => update(draft.id, { files: [...draft.files, { name: `contract-${index + 1}.pdf`, size: '312 KB', kind: 'PDF' }] })}><FileUp /> Upload PDF or image</button></div>
          {draft.files.length === 0 ? <div className="upload-box contract-upload"><Upload /><span>Drop the signed contract here, or upload a PDF or scanned image.</span></div> : <div className="profile-documents">{draft.files.map((file, fileIndex) => <div className="profile-document" key={`${file.name}-${fileIndex}`}><div className="department-icon"><FileText /></div><div><strong>{file.name}</strong><span>{file.kind} · {file.size}</span></div><div className="employee-actions"><button aria-label={`Remove ${file.name}`} onClick={() => update(draft.id, { files: draft.files.filter((_, i) => i !== fileIndex) })}><Trash2 /></button></div></div>)}</div>}
        </div>

        <div className="contract-summary"><p className="eyebrow">CONTRACT PREVIEW</p><div><span>Employee<strong>{person ? person.name : 'Not selected'}</strong></span><span>Type<strong>{draft.kind}</strong></span><span>Duration<strong>{duration ? duration.label : 'Ã¢¬·'}</strong></span><span>Period<strong>{formatDate(draft.start)} Ã¢· ·™ {draft.durationDays === 0 ? 'Open ended' : formatDate(end)}</strong></span></div></div>

        <div className="form-actions"><button className="secondary-button" onClick={() => setDrafts((items) => [...items, newDraft(items.length)])}><Plus /> Add more contract</button><button className="primary-button" onClick={() => {
          const record = created.length + 22
          setCreated([{ id: `GH-2024-0${record}`, employee: person ? person.name : 'Unassigned', kind: draft.kind, start: draft.start, end: end || 'Open ended', days: draft.durationDays, salary: draft.salary || (person ? person.salary : 'Ã¢¬·'), status: 'Pending signature', signed: 'Awaiting employee signature', file: draft.files[0]?.name ?? 'No document attached' }, ...created])
          setDrafts([newDraft(0)])
          setSaved(true)
          pushNotice({ kind: 'contract', title: `Contract sent to ${person ? person.name : 'employee'}`, detail: `${draft.kind} starting ${draft.start} was sent for signature.`, actor: 'Jordan Davis', time: 'Just now', audience: 'Both' })
        }}><FileCheck2 /> Save and send for signature</button></div>
      </div>
    })}

    {saved && <div className="panel contract-saved"><Sparkles /><div><strong>Contract saved and sent for signature</strong><p>The employee has been notified and can accept or decline from their portal.</p></div></div>}

    <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">{created.length} ON RECORD</p><h2>All contracts</h2></div></div>
      <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Reference</span><span>Employee</span><span>Period</span><span>Salary</span><span>Status</span><span /></div>{created.map((contract) => <div className="profile-table-row" key={contract.id}><strong>{contract.id}</strong><span>{contract.employee}</span><span>{formatDate(contract.start)} Ã¢· ·™ {contract.end === 'Open ended' ? 'Open ended' : formatDate(contract.end)}</span><span>{contract.salary}</span><span className="status-pill">{contract.status}</span><button className="ghost-icon" onClick={() => setOpenId(contract.id)} aria-label={`View ${contract.id}`}><Eye /></button></div>)}</div>
    </div>
  </section>
}

type SeededContract = typeof seededContracts[number]

function ContractDetailPage({ contract, onBack }: { contract: SeededContract; onBack: () => void }) {
  return <section className="management-page profile-page">
    <button className="back-link" onClick={onBack}><ChevronDown /> Back to contracts</button>
    <div className="panel contract-hero">
      <div className="profile-hero-main"><div className="avatar avatar-large avatar-sand">{contract.employee.split(' ').map((part) => part[0]).join('')}</div><div><p className="eyebrow">{contract.id}</p><h1>{contract.kind}</h1><p className="muted-copy">{contract.employee} · {contract.signed}</p><div className="profile-hero-tags"><span className="status-pill">{contract.status}</span><span className="status-pill">{formatDate(contract.start)} Ã¢· ·™ {contract.end === 'Open ended' ? 'Open ended' : formatDate(contract.end)}</span></div></div></div>
      <div className="form-actions"><button className="secondary-button" onClick={() => window.print()}><Download /> Export as PDF</button><button className="primary-button" onClick={() => window.print()}><FileText /> Download contract</button></div>
    </div>
    <div className="count-widget-row count-widget-row-4"><CountWidget value={contract.salary} hint="base salary" tone="tone-gold" icon={WalletCards} foot="Monthly gross before deductions" /><CountWidget value={`${contract.days} days`} hint="contract duration" tone="tone-blue" icon={Clock3} foot="Agreed term length" /><CountWidget value={formatDate(contract.start)} hint="start date" tone="tone-green" icon={CalendarDays} foot="Agreement commences" /><CountWidget value={contract.end === 'Open ended' ? 'Open ended' : formatDate(contract.end)} hint="end date" tone="tone-rose" icon={FileCheck2} foot={contract.status === 'Renewal due' ? 'Renewal window open' : 'Confirmed end of term'} /></div>
    <div className="contract-columns">
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">TERMS</p><h2>Agreement overview</h2></div></div><div className="detail-fields profile-fields">{[['Employee', contract.employee], ['Contract type', contract.kind], ['Reference', contract.id], ['Signature status', contract.signed], ['Base salary', contract.salary], ['Annual leave', '21 days per year'], ['Working hours', '40 hours per week'], ['Notice period', '30 days']].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div></article>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">DOCUMENT</p><h2>Attached file</h2></div><button className="secondary-button" onClick={() => window.print()}><Download /> Download</button></div><div className="profile-document"><div className="department-icon"><FileText /></div><div><strong>{contract.file}</strong><span>PDF document · 412 KB</span></div></div><div className="profile-note"><ShieldCheck /><div><strong>Securely stored</strong><p>Only HR administrators and the contract owner can access this document.</p></div></div></article>
    </div>
  </section>
}

function EmployeeContractPage() {
  const [status, setStatus] = useState<'Awaiting signature' | 'Accepted' | 'Declined'>('Awaiting signature')
  const [open, setOpen] = useState(false)
  const contract = { id: 'GH-2024-018', employee: 'Amara Okafor', kind: 'Full time employment', start: '2024-07-01', end: '2027-06-30', days: 1095, salary: 'TSh 4,860,000', status, signed: status === 'Accepted' ? 'Signed today' : 'Awaiting your signature', file: 'Employment Agreement · Amara Okafor.pdf' }
  if (open) return <ContractDetailPage contract={contract} onBack={() => setOpen(false)} />
  return <section className="management-page profile-page">
    <div className="workspace-hero"><div><p className="eyebrow">EMPLOYMENT</p><h1>My contract</h1><p>Review your current employment agreement, terms, and signed documents.</p></div></div>
    <article className="panel contract-card-contract">
      <div className="contract-card-head"><div className="department-icon"><FileCheck2 /></div><div><p className="eyebrow">{contract.id}</p><h2>{contract.kind}</h2><p className="muted-copy">{contract.signed}</p></div><span className={`status-pill ${status === 'Accepted' ? 'ok' : status === 'Declined' ? 'off' : ''}`}>{status}</span></div>
      <div className="detail-fields profile-fields">{[['Start date', formatDate(contract.start)], ['End date', formatDate(contract.end)], ['Base salary', contract.salary], ['Annual leave', '21 days'], ['Notice period', '30 days'], ['Working hours', '40 hours per week']].map(([label, value]) => <div className="detail-field" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div className="profile-note"><FileText /><div><strong>{contract.file}</strong><p>PDF document · 412 KB · issued by GoldenHR People Operations</p></div></div>
      <div className="form-actions"><button className="secondary-button" onClick={() => setOpen(true)}><Eye /> View contract</button><button className="secondary-button" onClick={() => window.print()}><Download /> Download</button>{status === 'Awaiting signature' ? <><button className="primary-button" onClick={() => setStatus('Accepted')}><FileCheck2 /> Accept contract</button><button className="secondary-button" onClick={() => setStatus('Declined')}><X /> Decline</button></> : <span className="muted-copy">Decision recorded · {status.toLowerCase()}</span>}</div>
    </article>
  </section>
}

type EmployeeDocument = {
  id: string; employee: string; name: string; category: string; type: 'PDF' | 'Image'
  size: string; added: string; owner: string; status: 'Verified' | 'Pending review' | 'Expiring soon'
}

const initialDocuments: EmployeeDocument[] = [
  { id: 'DOC-001', employee: 'Amara Okafor', name: 'Employment agreement 2023.pdf', category: 'Contract', type: 'PDF', size: '482 KB', added: 'May 12, 2023', owner: 'Sofia Martin', status: 'Verified' },
  { id: 'DOC-002', employee: 'Amara Okafor', name: 'NIDA registration card.jpg', category: 'Identity', type: 'Image', size: '96 KB', added: 'May 14, 2023', owner: 'Amara Okafor', status: 'Verified' },
  { id: 'DOC-003', employee: 'Amara Okafor', name: 'Passport scan.jpg', category: 'Identity', type: 'Image', size: '1.2 MB', added: 'May 14, 2023', owner: 'Amara Okafor', status: 'Verified' },
  { id: 'DOC-004', employee: 'Amara Okafor', name: 'Curriculum vitae.pdf', category: 'Personal', type: 'PDF', size: '218 KB', added: 'May 12, 2023', owner: 'Amara Okafor', status: 'Verified' },
  { id: 'DOC-005', employee: 'Noah Williams', name: 'Contract 2022 renewal.pdf', category: 'Contract', type: 'PDF', size: '540 KB', added: 'Jan 05, 2022', owner: 'Sofia Martin', status: 'Expiring soon' },
  { id: 'DOC-006', employee: 'Noah Williams', name: 'TIN registration certificate.pdf', category: 'Registration', type: 'PDF', size: '164 KB', added: 'Jan 08, 2022', owner: 'Noah Williams', status: 'Verified' },
  { id: 'DOC-007', employee: 'Noah Williams', name: 'Bank statement June.pdf', category: 'Payroll', type: 'PDF', size: '164 KB', added: 'Jun 30, 2024', owner: 'Payroll', status: 'Pending review' },
  { id: 'DOC-008', employee: 'Sofia Martin', name: 'Fixed term agreement.pdf', category: 'Contract', type: 'PDF', size: '398 KB', added: 'Aug 19, 2023', owner: 'Jordan Davis', status: 'Expiring soon' },
  { id: 'DOC-009', employee: 'Sofia Martin', name: 'Medical leave certificate.jpg', category: 'Leave', type: 'Image', size: '212 KB', added: 'Jul 28, 2024', owner: 'Sofia Martin', status: 'Pending review' },
  { id: 'DOC-010', employee: 'Sofia Martin', name: 'Professional development cert.pdf', category: 'Training', type: 'PDF', size: '720 KB', added: 'Apr 11, 2024', owner: 'Sofia Martin', status: 'Verified' },
  { id: 'DOC-011', employee: 'Liam Chen', name: 'Part time agreement.pdf', category: 'Contract', type: 'PDF', size: '301 KB', added: 'Mar 13, 2024', owner: 'Sofia Martin', status: 'Verified' },
  { id: 'DOC-012', employee: 'Liam Chen', name: 'National ID front.jpg', category: 'Identity', type: 'Image', size: '88 KB', added: 'Mar 15, 2024', owner: 'Liam Chen', status: 'Verified' },
  { id: 'DOC-013', employee: 'Liam Chen', name: 'Salary adjustment letter.pdf', category: 'Payroll', type: 'PDF', size: '124 KB', added: 'Jun 02, 2024', owner: 'Payroll', status: 'Verified' },
  { id: 'DOC-014', employee: 'Liam Chen', name: 'Reference letter.pdf', category: 'Personal', type: 'PDF', size: '96 KB', added: 'Mar 14, 2024', owner: 'Liam Chen', status: 'Verified' },
]

const documentCategories = ['All', 'Contract', 'Identity', 'Registration', 'Payroll', 'Leave', 'Training', 'Personal']

function DocumentPreview({ item, employee, onClose }: { item: EmployeeDocument; employee: typeof employeeRecords[number]; onClose: () => void }) {
  return <AppModal
    eyebrow={item.category + ' Â· ' + item.type}
    title={item.name}
    meta={item.id + ' Â· ' + item.employee + ' Â· ' + item.size + ' Â· added ' + item.added}
    icon={item.type === 'Image' ? FolderOpen : FileText}
    status={item.status}
    statusTone={item.status === 'Verified' ? 'ok' : 'warn'}
    asideLabel="Record"
    aside={[
      { label: 'Employee', value: item.employee },
      { label: 'Department', value: employee.department },
      { label: 'Role', value: employee.role },
      { label: 'Category', value: item.category },
      { label: 'File type', value: item.type },
      { label: 'Size', value: item.size },
      { label: 'Added by', value: item.owner },
    ]}
    footer={<><button className="primary-button" onClick={() => window.print()}><Download /> Download {item.type}</button><button className="secondary-button" onClick={() => window.print()}><FileText /> Export as PDF</button></>}
    onClose={onClose}
  >
    <div className={'document-canvas ' + (item.type === 'Image' ? 'is-image' : 'is-pdf')}>
      {item.type === 'Image' ? <img src="/icon.svg" alt={'Preview of ' + item.name} /> : <div className="document-sheet">
        <div className="document-sheet-head"><div className="brand-mark"><GoldMark /></div><div><strong>GOLDENHR</strong><span>People, elevated.</span></div></div>
        <h3>{item.name.replace(/\.[a-z]+$/i, '')}</h3>
        <p className="document-sheet-meta">Employee: {item.employee} Â· {employee.role} Â· {employee.department}</p>
        <div className="document-sheet-lines">{[100, 92, 96, 70, 88, 94, 60, 90, 84, 72].map((width, index) => <i key={index} style={{ width: width + '%' }} />)}</div>
        <div className="document-sheet-sign"><span>Employee signature</span><span>Authorised signature</span></div>
        <p className="document-sheet-foot">Document reference {item.id} Â· issued by GoldenHR People Operations Â· verified record</p>
      </div>}
    </div>
  </AppModal>
}

function DocumentsPage() {
  const [documents, setDocuments] = useState(initialDocuments)
  const [category, setCategory] = useState('All')
  const [person, setPerson] = useState('All')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const open = documents.find((item) => item.id === openId)
  const openEmployee = employeeRecords.find((record) => record.name === open?.employee)

  const visible = documents.filter((item) => (category === 'All' || item.category === category) && (person === 'All' || item.employee === person) && `${item.name} ${item.employee} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
  const grouped = employeeRecords.map((record) => ({ record, items: visible.filter((item) => item.employee === record.name) })).filter((group) => group.items.length > 0)
  const totalSize = documents.length

  const download = (item: EmployeeDocument) => {
    const body = `GoldenHR document export\n\nFile: ${item.name}\nReference: ${item.id}\nEmployee: ${item.employee}\nCategory: ${item.category}\nType: ${item.type}\nAdded: ${item.added}\nAdded by: ${item.owner}\nStatus: ${item.status}\n`
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${item.name.replace(/\.[a-z]+$/i, '')}.txt`
    link.click()
    URL.revokeObjectURL(url)
    setNotice(`${item.name} downloaded`)
  }

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">DOCUMENT HUB</p><h1>Documents</h1><p>Every employee record in one place. Preview, download, and manage attachments.</p></div><button className="primary-button" onClick={() => setNotice('Upload panel ready')}><Upload /> Upload document</button></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>Document activity is recorded against the employee record.</p></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={`${totalSize}`} hint="documents on file" tone="tone-gold" icon={FolderOpen} foot="Across every employee record" />
      <CountWidget value={`${employeeRecords.length}`} hint="employees covered" tone="tone-blue" icon={Users} foot="Profiles with attachments" />
      <CountWidget value={`${documents.filter((item) => item.status === 'Pending review').length}`} hint="pending review" tone="tone-amber" icon={Clock3} foot="Waiting on People Ops" />
      <CountWidget value={`${documents.filter((item) => item.status === 'Expiring soon').length}`} hint="expiring soon" tone="tone-rose" icon={FileCheck2} foot="Needs renewal this quarter" />
    </div>
    <div className="document-filters">
      <div className="profile-tabs" role="tablist">{documentCategories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={`profile-tab ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="document-filters-right">
        <select className="inline-select" value={person} onChange={(event) => setPerson(event.target.value)}><option value="All">All employees</option>{employeeRecords.map((record) => <option key={record.email}>{record.name}</option>)}</select>
        <div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents" /></div>
      </div>
    </div>
    <div className="document-groups">
      {grouped.map(({ record, items }) => {
        const employee = employeeRecords.find((entry) => entry.name === record.name) ?? record
        return <article className="panel document-group" key={record.email}>
          <div className="document-group-head">
            <div className={`avatar avatar-sand ${['saffron', 'olive', 'plum', 'clay'][employeeRecords.indexOf(record) % 4]}`}>{record.name.split(' ').map((part) => part[0]).join('')}</div>
            <div><strong>{record.name}</strong><span>{record.role} · {record.department} · {record.nida}</span></div>
            <span className="status-pill">{items.length} document{items.length === 1 ? '' : 's'}</span>
          </div>
          <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Document</span><span>Category</span><span>Type</span><span>Size</span><span>Status</span><span>Added</span><span /></div>
            {items.map((item) => <div className="profile-table-row" key={item.id}>
              <span className="role-person"><span className={`document-type-icon ${item.type === 'Image' ? 'is-image' : 'is-pdf'}`}>{item.type === 'Image' ? <FolderOpen /> : <FileText />}</span><strong>{item.name}</strong></span>
              <span>{item.category}</span>
              <span>{item.type}</span>
              <span>{item.size}</span>
              <span className={`status-pill ${item.status === 'Verified' ? 'ok' : item.status === 'Expiring soon' ? 'off' : ''}`}>{item.status}</span>
              <span>{item.added}</span>
              <span className="employee-actions"><button onClick={() => setOpenId(item.id)} aria-label={`View ${item.name}`}><Eye /></button><button onClick={() => download(item)} aria-label={`Download ${item.name}`}><Download /></button></span>
            </div>)}
          </div>
          <div className="document-group-foot"><span><ShieldCheck /> Only HR administrators and {record.name} can access these files.</span><div className="form-actions"><button className="secondary-button" onClick={() => { setPerson(record.name); setCategory('All'); setQuery('') }}><Eye /> Only this employee</button></div></div>
        </article>
      })}
      {grouped.length === 0 && <div className="panel leave-empty"><FolderOpen /><p>No documents match your filters.</p></div>}
    </div>
    {open && openEmployee && <DocumentPreview item={open} employee={openEmployee} onClose={() => setOpenId(null)} />}
  </section>
}
type MoneyRequestStatus = 'Pending' | 'Approved' | 'Paid' | 'Declined'
type MoneyRequestKind = 'Salary advance' | 'Expense reimbursement' | 'Emergency advance' | 'Travel allowance' | 'Medical claim'

type MoneyRequest = {
  id: string; employee: string; initials: string; tone: string; kind: MoneyRequestKind
  amount: number; reason: string; neededBy: string; method: string
  status: MoneyRequestStatus; submitted: string; decidedBy: string; decidedOn: string; note: string
  receiptNo: string
}

const moneyKinds: MoneyRequestKind[] = ['Salary advance', 'Expense reimbursement', 'Emergency advance', 'Travel allowance', 'Medical claim']
const advanceLimit = 2500000

const initialMoneyRequests: MoneyRequest[] = [
  { id: 'MR-2024-118', employee: 'Amara Okafor', initials: 'AO', tone: 'saffron', kind: 'Expense reimbursement', amount: 486000, reason: 'Design software licences and a client workshop flight booked for the Q3 research sprint.', neededBy: '2024-07-10', method: 'Mobile money', status: 'Pending', submitted: 'Today, 9:14 AM', decidedBy: '', decidedOn: '', note: '', receiptNo: 'RCP-2024-0918' },
  { id: 'MR-2024-117', employee: 'Liam Chen', initials: 'LC', tone: 'clay', kind: 'Emergency advance', amount: 1250000, reason: 'Family medical emergency. Discharge invoice and prescription attached.', neededBy: '2024-07-05', method: 'Mobile money', status: 'Pending', submitted: 'Yesterday, 4:02 PM', decidedBy: '', decidedOn: '', note: '', receiptNo: 'RCP-2024-0917' },
  { id: 'MR-2024-116', employee: 'Sofia Martin', initials: 'SM', tone: 'plum', kind: 'Salary advance', amount: 900000, reason: 'Advance against the July payroll to cover a deposit on a new apartment.', neededBy: '2024-07-01', method: 'Bank transfer', status: 'Approved', submitted: 'Jun 24, 2024', decidedBy: 'Sofia Martin', decidedOn: 'Jun 25, 2024', note: 'Approved against the July payroll run.', receiptNo: 'RCP-2024-0916' },
  { id: 'MR-2024-115', employee: 'Noah Williams', initials: 'NW', tone: 'olive', kind: 'Travel allowance', amount: 2100000, reason: 'Travel and accommodation for the Arusha engineering offsite.', neededBy: '2024-06-20', method: 'Bank transfer', status: 'Paid', submitted: 'Jun 10, 2024', decidedBy: 'Jordan Davis', decidedOn: 'Jun 11, 2024', note: 'Paid on the June payroll cycle.', receiptNo: 'RCP-2024-0915' },
  { id: 'MR-2024-114', employee: 'Luca Rossi', initials: 'LR', tone: 'olive', kind: 'Expense reimbursement', amount: 320000, reason: 'Conference ticket and local transport.', neededBy: '2024-06-18', method: 'Mobile money', status: 'Declined', submitted: 'Jun 14, 2024', decidedBy: 'Sofia Martin', decidedOn: 'Jun 15, 2024', note: 'Declined Ã¢¬· the conference is covered by the learning budget.', receiptNo: 'RCP-2024-0914' },
]

function ReceiptSheet({ request, onPrint }: { request: MoneyRequest; onPrint: () => void }) {
  const person = employeeRecords.find((record) => record.name === request.employee)
  return <article className="panel receipt-sheet" id="receipt-sheet">
    <div className="receipt-top">
      <div className="receipt-brand"><div className="brand-mark"><GoldMark /></div><div><strong>GOLDENHR</strong><span>People, elevated.</span></div></div>
      <div className="receipt-stamp"><ShieldCheck /><span>{request.receiptNo}</span><small>OFFICIAL RECEIPT</small></div>
    </div>
    <div className="receipt-title"><h2>Money request receipt</h2><p>Issued {request.submitted}</p></div>
    <div className="receipt-parties">
      <div><small>REQUESTED BY</small><strong>{request.employee}</strong><span>{person ? `${person.role} · ${person.department}` : 'Employee'}</span><span>{person?.nida ?? 'Ã¢¬·'}</span></div>
      <div><small>ISSUED BY</small><strong>GoldenHR People Operations</strong><span>{request.decidedBy || 'Pending approval'}</span><span>{person ? `${person.phone}` : 'Ã¢¬·'}</span></div>
    </div>
    <div className="receipt-table">
      <div className="receipt-row receipt-row-head"><span>Description</span><span>Amount</span></div>
      <div className="receipt-row"><span>{request.kind}</span><span>{money(request.amount)}</span></div>
      <div className="receipt-row"><span>Payment method</span><span>{request.method}</span></div>
      <div className="receipt-row"><span>Needed by</span><span>{formatDate(request.neededBy)}</span></div>
      <div className="receipt-row receipt-row-total"><span>Total requested</span><span>{money(request.amount)}</span></div>
    </div>
    <div className="receipt-reason"><small>REASON GIVEN</small><p>{request.reason}</p></div>
    <div className="receipt-status">
      <span className={`status-pill ${request.status === 'Paid' ? 'ok' : request.status === 'Declined' ? 'off' : ''}`}>{request.status}</span>
      {request.decidedOn && <p>{request.status} by {request.decidedBy} on {request.decidedOn}{request.note ? ` Ã¢¬· ${request.note}` : ''}</p>}
      {!request.decidedOn && <p>Awaiting a decision from the People Operations team.</p>}
    </div>
    <div className="receipt-sign"><div><span>Employee signature</span></div><div><span>Authorised signature</span></div></div>
    <p className="receipt-foot">This receipt confirms a money request submitted through GoldenHR. Retain it for your records. Reference {request.id} · {request.receiptNo}</p>
    <div className="form-actions no-print"><button className="secondary-button" onClick={onPrint}><Download /> Download receipt</button><button className="primary-button" onClick={() => window.print()}><FileText /> Export as PDF</button></div>
  </article>
}

function MoneyRequestDetail({ request, onBack, isEmployee }: { request: MoneyRequest; onBack: () => void; isEmployee: boolean }) {
  return <section className="management-page profile-page">
    <button className="back-link" onClick={onBack}><ChevronDown /> Back to money requests</button>
    <div className="panel profile-hero">
      <div className="profile-hero-main"><div className={`avatar avatar-large ${request.tone}`}>{request.initials}</div><div><p className="eyebrow">{request.id} · {request.receiptNo}</p><h1>{request.kind}</h1><p className="muted-copy">{request.employee} · {money(request.amount)} · submitted {request.submitted}</p><div className="profile-hero-tags"><span className={`status-pill ${request.status === 'Paid' ? 'ok' : request.status === 'Declined' ? 'off' : ''}`}>{request.status}</span><span className="status-pill">{request.method}</span></div></div></div>
      {!isEmployee && request.status === 'Pending' && <div className="form-actions"><button className="secondary-button" onClick={onBack}><X /> Decline</button><button className="primary-button" onClick={onBack}><FileCheck2 /> Approve</button></div>}
    </div>
    <ReceiptSheet request={request} onPrint={() => window.print()} />
  </section>
}

function MoneyRequestPage({ isEmployee, requests, setRequests }: { isEmployee: boolean; requests: MoneyRequest[]; setRequests: React.Dispatch<React.SetStateAction<MoneyRequest[]>> }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'All' | MoneyRequestStatus>('All')
  const [notice, setNotice] = useState('')
  const [kind, setKind] = useState<MoneyRequestKind>('Salary advance')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [neededBy, setNeededBy] = useState('')
  const [method, setMethod] = useState('Mobile money')

  const me = 'Amara Okafor'
  const mine = requests.filter((request) => request.employee === me)
  const open = requests.find((request) => request.id === openId)
  const requested = mine.filter((request) => request.status === 'Pending' || request.status === 'Approved').reduce((sum, request) => sum + request.amount, 0)
  const available = Math.max(0, advanceLimit - requested)
  const visible = (isEmployee ? mine : requests).filter((request) => filter === 'All' || request.status === filter)

  const decide = (id: string, status: MoneyRequestStatus) => {
    setRequests((items) => items.map((item) => (item.id === id ? { ...item, status, decidedBy: 'Sofia Martin', decidedOn: 'Jul 02, 2024', note: status === 'Declined' ? 'Declined by People Operations.' : 'Approved against the July payroll run.' } : item)))
const record = requests.find((item) => item.id === id)
    setNotice(`${record?.employee} request ${status.toLowerCase()}`)
    pushNotice({ kind: 'money', title: `Money request ${status.toLowerCase()}`, detail: `${record?.employee}'s ${record?.kind.toLowerCase()} of ${money(record?.amount ?? 0)} was ${status.toLowerCase()}.`, actor: 'Sofia Martin', time: 'Just now', audience: status === 'Approved' || status === 'Paid' ? 'Employee' : 'Both' })
    setOpenId(null)
  }

  if (open) return <MoneyRequestDetail request={open} isEmployee={isEmployee} onBack={() => (open.status === 'Pending' && !isEmployee ? decide(open.id, 'Approved') : setOpenId(null))} />

  if (isEmployee && creating) return <section className="form-page">
    <button className="back-link" onClick={() => setCreating(false)}><ChevronDown /> Back to money requests</button>
    <div className="workspace-hero"><div><p className="eyebrow">FINANCE</p><h1>Request money</h1><p>Send an advance or claim to People Operations and track the decision.</p></div></div>
    <div className="leave-balance money-limit"><CircleDollarSign /><div><strong>{money(available)} available</strong><p>Advance limit {money(advanceLimit)} · {money(requested)} already requested</p></div></div>
    <form className="panel" onSubmit={(event) => { event.preventDefault(); const value = Number(amount); if (!value) return; setRequests([{ id: `MR-2024-${119 + mine.length}`, employee: me, initials: 'AO', tone: 'saffron', kind, amount: value, reason, neededBy, method, status: 'Pending', submitted: 'Just now', decidedBy: '', decidedOn: '', note: '', receiptNo: `RCP-2024-${919 + mine.length}` }, ...requests]); setAmount(''); setReason(''); setNeededBy(''); setCreating(false); setNotice('Money request submitted'); pushNotice({ kind: 'money', title: 'New money request from Amara Okafor', detail: `A ${kind.toLowerCase()} of ${money(Number(amount))} was sent to People Operations for approval.`, actor: 'Amara Okafor', time: 'Just now', audience: 'HR' }) }}>
      <div className="form-grid">
        <Field label="Request type"><select value={kind} onChange={(event) => setKind(event.target.value as MoneyRequestKind)}>{moneyKinds.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Amount requested"><input required type="number" min="1" max={available} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="e.g. 500000" /></Field>
        <Field label="Needed by"><input type="date" value={neededBy} onChange={(event) => setNeededBy(event.target.value)} /></Field>
        <Field label="Payment method"><select value={method} onChange={(event) => setMethod(event.target.value)}><option>Mobile money</option><option>Bank transfer</option><option>Cash</option></select></Field>
        <Field label="Reason for the request" full><textarea required rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain what the money is for and attach any supporting detail" /></Field>
        {amount && <Field label="Remaining after approval" full><div className="leave-balance money-limit"><Sparkles /><div><strong>{money(Math.max(0, available - Number(amount)))} remaining</strong><p>{kind} · {neededBy ? `needed by ${formatDate(neededBy)}` : 'add a date'}</p></div></div></Field>}
      </div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setCreating(false)}>Cancel</button><button className="primary-button" type="submit"><CircleDollarSign /> Send request to HR</button></div>
    </form>
  </section>

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">FINANCE</p><h1>{isEmployee ? 'Money request' : 'Money requests'}</h1><p>{isEmployee ? 'Request an advance or claim, and keep every receipt in one place.' : 'Review advances and claims, approve them, and issue official receipts.'}</p></div>{isEmployee && <button className="primary-button" onClick={() => setCreating(true)}><Plus /> New request</button>}</div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>{isEmployee ? 'People Operations has been notified.' : 'The employee has been notified and the receipt updated.'}</p></div></div>}
    <div className="count-widget-row count-widget-row-4">
      <CountWidget value={compact(isEmployee ? available : requests.reduce((sum, request) => sum + request.amount, 0))} hint={isEmployee ? 'available limit' : 'total requested'} tone="tone-gold" icon={CircleDollarSign} foot={isEmployee ? `Of ${compact(advanceLimit)} advance limit` : 'All requests raised this year'} />
      <CountWidget value={`${(isEmployee ? mine : requests).filter((request) => request.status === 'Pending').length}`} hint="pending approval" tone="tone-amber" icon={Clock3} foot="Waiting on a decision" />
      <CountWidget value={compact((isEmployee ? mine : requests).filter((request) => request.status === 'Approved' || request.status === 'Paid').reduce((sum, request) => sum + request.amount, 0))} hint="approved" tone="tone-green" icon={FileCheck2} foot="Cleared for payment" />
      <CountWidget value={compact((isEmployee ? mine : requests).filter((request) => request.status === 'Paid').reduce((sum, request) => sum + request.amount, 0))} hint="paid out" tone="tone-blue" icon={WalletCards} foot="Disbursed to date" />
    </div>
    <div className="profile-tabs" role="tablist">{(['Pending', 'Approved', 'Paid', 'Declined', 'All'] as const).map((key) => <button key={key} role="tab" aria-selected={filter === key} className={`profile-tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}><WalletCards />{key === 'All' ? 'All requests' : key}</button>)}</div>
    <div className="panel">
      <div className="panel-heading"><div><p className="eyebrow">{visible.length} SHOWN</p><h2>{filter === 'All' ? 'All requests' : `${filter} requests`}</h2></div></div>
      <div className="profile-table"><div className="profile-table-row profile-table-head"><span>Request</span><span>Employee</span><span>Amount</span><span>Method</span><span>Status</span><span>Receipt</span><span /></div>
        {visible.map((request) => <div className="profile-table-row" key={request.id}>
          <span><strong>{request.kind}</strong></span>
          <span>{isEmployee ? 'You' : request.employee}</span>
          <span className="payroll-net-cell">{money(request.amount)}</span>
          <span>{request.method}</span>
          <span className={`status-pill ${request.status === 'Paid' ? 'ok' : request.status === 'Declined' ? 'off' : ''}`}>{request.status}</span>
          <span className="receipt-no">{request.receiptNo}</span>
          <span className="employee-actions"><button onClick={() => setOpenId(request.id)} aria-label={`View receipt for ${request.id}`}><Eye /></button>{!isEmployee && request.status === 'Pending' && <><button onClick={() => decide(request.id, 'Declined')} aria-label={`Decline ${request.id}`}><X /></button><button onClick={() => decide(request.id, 'Approved')} aria-label={`Approve ${request.id}`}><FileCheck2 /></button></>}<button onClick={() => window.print()} aria-label={`Download receipt for ${request.id}`}><Download /></button></span>
        </div>)}
        {visible.length === 0 && <div className="leave-empty"><WalletCards /><p>No {filter.toLowerCase()} requests right now.</p></div>}
      </div>
    </div>
  </section>
}
const employeeDocuments = [
  { id: 'ED-1', name: 'Employment agreement 2023.pdf', kind: 'Contract', type: 'PDF' as const, size: '482 KB', added: 'May 12, 2023', status: 'Verified' },
  { id: 'ED-2', name: 'NIDA registration card.jpg', kind: 'Identity', type: 'Image' as const, size: '96 KB', added: 'May 14, 2023', status: 'Verified' },
  { id: 'ED-3', name: 'Passport scan.jpg', kind: 'Identity', type: 'Image' as const, size: '1.2 MB', added: 'May 14, 2023', status: 'Verified' },
  { id: 'ED-4', name: 'Curriculum vitae.pdf', kind: 'Personal', type: 'PDF' as const, size: '218 KB', added: 'May 12, 2023', status: 'Verified' },
  { id: 'ED-5', name: 'TIN registration certificate.pdf', kind: 'Registration', type: 'PDF' as const, size: '164 KB', added: 'May 20, 2023', status: 'Verified' },
]

function RegistrationInfo({ person, mode, onBack, onSaved }: { person: ProfileRecord; mode: 'self' | 'hr'; onBack: () => void; onSaved?: (person: ProfileRecord) => void }) {
  const isSelf = mode === 'self'
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [values, setValues] = useState({ name: person.name, email: person.email, phone: person.phone, birth: '1996-04-18', start: toIsoDate(person.hire), hire: toIsoDate(person.hire), nida: person.nida, tin: 'TIN-4482-9917', address: 'Mbeachibe Beach Road, Dar es Salaam', emergency: 'Grace Okafor Â· +255 712 900 114', bank: 'CRDB 0001 2345 6789 01' })
  const [documents, setDocuments] = useState(employeeDocuments)
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }))
  const tone = employeeRecords.indexOf(person) % 4

  const save = () => {
    setEditing(false)
    setSaved(true)
    onSaved?.({ ...person, name: values.name, email: values.email, phone: values.phone, nida: values.nida })
  }

  const docTotal = documents.length
  const docPdfs = documents.filter((item) => item.type === 'PDF').length
  const docImages = documents.filter((item) => item.type === 'Image').length
  const docVerified = documents.filter((item) => item.status === 'Verified').length

  return <section className="management-page profile-page">
    <button className="back-link" onClick={onBack}><ChevronDown /> {isSelf ? 'Back to workspace' : `Back to employee management`}</button>
    <div className="workspace-hero"><div><p className="eyebrow">{isSelf ? 'Personal details' : 'People directory'}</p><h1>{isSelf ? 'Registration info' : `${person.name} Â· registration`}</h1><p>{isSelf ? 'Your personal, legal and banking details as held on your employee record.' : `Personal, legal and banking details on file for ${person.name}.`}</p></div>{!editing && <button className="primary-button" onClick={() => setEditing(true)}><Pencil /> Edit information</button>}</div>
    {saved && <div className="panel contract-saved"><Sparkles /><div><strong>Registration info updated</strong><p>{isSelf ? 'People Operations has been notified of your changes.' : `Changes were written to ${person.name}'s record in the people directory.`}</p></div></div>}

    <article className="panel reg-hero">
      <div className="reg-hero-top">
        <div className="reg-photo"><div className={`reg-photo-frame ${['saffron', 'olive', 'plum', 'clay'][tone]}`}>{values.name.split(' ').map((part) => part[0]).join('')}</div>{editing && <label className="reg-photo-upload"><Upload /><span>Replace</span><input type="file" accept="image/*" /></label>}</div>
        <div className="reg-hero-copy">
          <p className="eyebrow">Employee profile</p>
          <h1>{values.name}</h1>
          <p className="muted-copy">{person.role} Â· {person.department} Â· {person.type}</p>
          <div className="profile-hero-tags"><span className="status-pill ok">Active</span><span className="status-pill">Hired {formatDate(values.hire)}</span><span className="status-pill">Verified</span></div>
        </div>
        <div className="reg-hero-meta">
          <div><small>Employee ID</small><strong>GH-0248</strong></div>
          <div><small>Reports to</small><strong>{person.department} lead</strong></div>
          <div><small>Work location</small><strong>Dar es Salaam, TZ</strong></div>
        </div>
      </div>
      <div className="reg-progress">
        <div><span style={{ width: '92%' }} /></div>
        <p>Profile completeness <strong>92%</strong> Â· add the bank confirmation to finish</p>
      </div>
    </article>

    <div className="reg-columns">
      <div className="reg-main">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Personal</p><h2>Personal details</h2></div>{editing ? <button className="secondary-button" onClick={save}><FileCheck2 /> Save changes</button> : <button className="more-button" onClick={() => setEditing(true)}><Pencil /> Edit</button>}</div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Full legal name</small>{editing ? <input value={values.name} onChange={(event) => set({ name: event.target.value })} /> : <strong>{values.name}</strong>}</div>
            <div className="detail-field"><small>Date of birth</small>{editing ? <input type="date" value={values.birth} onChange={(event) => set({ birth: event.target.value })} /> : <strong>{formatDate(values.birth)}</strong>}</div>
            <div className="detail-field"><small>Email address</small>{editing ? <input type="email" value={values.email} onChange={(event) => set({ email: event.target.value })} /> : <strong>{values.email}</strong>}</div>
            <div className="detail-field"><small>Phone number</small>{editing ? <input type="tel" value={values.phone} onChange={(event) => set({ phone: event.target.value })} /> : <strong>{values.phone}</strong>}</div>
            <div className="detail-field full"><small>Residential address</small>{editing ? <textarea rows={2} value={values.address} onChange={(event) => set({ address: event.target.value })} /> : <strong>{values.address}</strong>}</div>
            <div className="detail-field full"><small>Emergency contact</small>{editing ? <input value={values.emergency} onChange={(event) => set({ emergency: event.target.value })} /> : <strong>{values.emergency}</strong>}</div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Employment</p><h2>Work and registration</h2></div>{editing && !isSelf && <span className="status-pill">HR edit access</span>}</div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Start working date</small>{editing ? <input type="date" value={values.start} onChange={(event) => set({ start: event.target.value })} /> : <strong>{formatDate(values.start)}</strong>}</div>
            <div className="detail-field"><small>Hire date</small>{editing ? <input type="date" value={values.hire} onChange={(event) => set({ hire: event.target.value })} /> : <strong>{formatDate(values.hire)}</strong>}</div>
            <div className="detail-field"><small>NIDA number</small>{editing ? <input value={values.nida} onChange={(event) => set({ nida: event.target.value })} /> : <strong>{values.nida}</strong>}</div>
            <div className="detail-field"><small>TIN</small>{editing ? <input value={values.tin} onChange={(event) => set({ tin: event.target.value })} /> : <strong>{values.tin}</strong>}</div>
            <div className="detail-field"><small>Department</small><strong>{person.department}</strong></div>
            <div className="detail-field"><small>Role</small><strong>{person.role}</strong></div>
            <div className="detail-field"><small>Employment type</small><strong>{person.type}</strong></div>
            {isSelf
              ? <div className="detail-field reg-locked"><small>Monthly salary</small><strong>{person.salary} <ShieldCheck /></strong><small>Managed by People Operations</small></div>
              : <div className="detail-field"><small>Monthly salary</small><input value={person.salary.replace(/[^\d.]/g, '')} onChange={(event) => onSaved?.({ ...person, salary: `TSh ${Number(event.target.value).toLocaleString('en-US')}` })} /></div>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Banking</p><h2>Payment details</h2></div></div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Bank</small>{editing ? <input defaultValue="CRDB Bank" /> : <strong>CRDB Bank</strong>}</div>
            <div className="detail-field"><small>Account number</small>{editing ? <input value={values.bank} onChange={(event) => set({ bank: event.target.value })} /> : <strong>{values.bank}</strong>}</div>
            <div className="detail-field"><small>Mobile money</small>{editing ? <input defaultValue={person.phone} /> : <strong>{person.phone}</strong>}</div>
            <div className="detail-field"><small>Payment method</small><strong>Bank transfer</strong></div>
          </div>
          <div className="profile-note"><ShieldCheck /><div><strong>Bank details verified</strong><p>Confirmed against the submitted bank confirmation document on May 20, 2023.</p></div></div>
        </article>
      </div>

      <aside className="reg-side">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Attached documents</p><h2>On this record</h2></div><span className="report-chip">{docTotal} files</span></div><div className="doc-summary"><div><small>Total files</small><strong>{docTotal}</strong></div><div><small>PDF</small><strong>{docPdfs}</strong></div><div><small>Images</small><strong>{docImages}</strong></div><div><small>Verified</small><strong>{docVerified}</strong></div></div>
          <div className="reg-documents">{documents.map((item) => <div className="profile-document" key={item.id}><span className={`document-type-icon ${item.type === 'Image' ? 'is-image' : 'is-pdf'}`}>{item.type === 'Image' ? <FolderOpen /> : <FileText />}</span><div><strong>{item.name}</strong><span>{item.kind} Â· {item.size} Â· {item.added}</span></div><span className={`status-pill ${item.status === 'Verified' ? 'ok' : ''}`}>{item.status}</span><div className="employee-actions"><button onClick={() => window.print()} aria-label={`Download ${item.name}`}><Download /></button><button onClick={() => setDocuments(documents.filter((entry) => entry.id !== item.id))} aria-label={`Remove ${item.name}`}><Trash2 /></button></div></div>)}</div>
          <button className="secondary-button reg-upload" onClick={() => setDocuments([...documents, { id: `ED-${documents.length + 1}`, name: 'bank-confirmation.pdf', kind: 'Registration', type: 'PDF', size: '188 KB', added: 'Today', status: 'Pending review' }])}><Upload /> Upload document</button>
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

const initialNotices: NoticeItem[] = [
  { id: 'N-101', kind: 'payroll', title: 'Payroll created for Noah Williams', detail: 'June 2024 payroll of TSh 5,790,000 net is awaiting approval.', actor: 'Sofia Martin', time: '4 minutes ago', audience: 'Both', read: false },
  { id: 'N-102', kind: 'money', title: 'Money request approved', detail: 'Sofia Martin approved your TSh 900,000 salary advance against the July run.', actor: 'Sofia Martin', time: '1 hour ago', audience: 'Employee', read: false },
  { id: 'N-103', kind: 'money', title: 'New money request from Liam Chen', detail: 'Emergency advance of TSh 1,250,000 needed by Jul 05.', actor: 'Liam Chen', time: '2 hours ago', audience: 'HR', read: false },
  { id: 'N-104', kind: 'contract', title: 'Contract renewed', detail: 'GH-2024-018 for Amara Okafor was signed and filed.', actor: 'Jordan Davis', time: 'Yesterday', audience: 'Both', read: false },
  { id: 'N-105', kind: 'role', title: 'Role assignment updated', detail: 'Maya Patel moved from Frontend Engineer to Engineering Lead.', actor: 'Sofia Martin', time: 'Yesterday', audience: 'HR', read: true },
  { id: 'N-106', kind: 'department', title: 'Role added to Customer Success', detail: 'Head of Support was added to the department role library.', actor: 'Jordan Davis', time: 'Mon, 4:20 PM', audience: 'HR', read: true },
  { id: 'N-107', kind: 'employee', title: 'New employee added', detail: 'Luca Rossi joined the Design department as Product Designer.', actor: 'Jordan Davis', time: 'Mon, 11:08 AM', audience: 'HR', read: true },
  { id: 'N-108', kind: 'document', title: 'Document uploaded to your record', detail: 'Employment agreement 2023.pdf was added to your profile.', actor: 'Sofia Martin', time: 'Sun, 3:45 PM', audience: 'Employee', read: true },
  { id: 'N-109', kind: 'security', title: 'Password changed', detail: 'Your portal password was reset successfully from the settings page.', actor: 'You', time: 'Fri, 9:02 AM', audience: 'Both', read: true },
  { id: 'N-110', kind: 'leave', title: 'Leave request approved', detail: 'Annual leave for Jul 18 Ã¢¬·œ Jul 22 was approved by Sofia Martin.', actor: 'Sofia Martin', time: 'Thu, 2:30 PM', audience: 'Employee', read: true },
]

let noticeStore: NoticeItem[] = initialNotices
const noticeListeners = new Set<(items: NoticeItem[]) => void>()

function writeNotices(next: NoticeItem[]) {
  noticeStore = next
  noticeListeners.forEach((listener) => listener(noticeStore))
}

function pushNotice(item: Omit<NoticeItem, 'id' | 'read'>) {
  writeNotices([{ ...item, id: `N-${Date.now()}${Math.floor(Math.random() * 99)}`, read: false }, ...noticeStore])
}

function useNotices() {
  const [notices, setLocal] = useState(noticeStore)
  useEffect(() => {
    noticeListeners.add(setLocal)
    return () => { noticeListeners.delete(setLocal) }
  }, [])
  const setNotices = (next: React.SetStateAction<NoticeItem[]>) => writeNotices(typeof next === 'function' ? next(noticeStore) : next)
  return [notices, setNotices] as const
}

function NotificationsPage({ isEmployee, notices, setNotices }: { isEmployee: boolean; notices: NoticeItem[]; setNotices: React.Dispatch<React.SetStateAction<NoticeItem[]>> }) {
  const [filter, setFilter] = useState<'All' | NoticeKind>('All')
  const visible = notices.filter((item) => item.audience !== 'HR' || !isEmployee).filter((item) => filter === 'All' || item.kind === filter)
  const unread = notices.filter((item) => item.audience !== 'HR' || !isEmployee).filter((item) => !item.read).length
  const kinds = Array.from(new Set(visible.map((item) => item.kind)))
  const markAll = () => setNotices((items) => items.map((item) => ({ ...item, read: true })))
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
          <div className="employee-actions"><button onClick={() => setNotices((items) => items.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)))} aria-label={`Mark ${item.title} as read`}><FileCheck2 /></button><button onClick={() => setNotices((items) => items.filter((entry) => entry.id !== item.id))} aria-label={`Dismiss ${item.title}`}><Trash2 /></button></div>
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

type Credentials = { email: string; password: string }

const defaultCredentials: Credentials = { email: 'jordan.davis@goldenhr.com', password: 'GoldenHR2024!' }

function SettingsPage({ isEmployee, credentials, setCredentials, theme, setTheme, setNotices }: { isEmployee: boolean; credentials: Credentials; setCredentials: React.Dispatch<React.SetStateAction<Credentials>>; theme: ThemeName; setTheme: (theme: ThemeName) => void; setNotices: React.Dispatch<React.SetStateAction<NoticeItem[]>> }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [notice, setNotice] = useState('')
  const [resetEmail, setResetEmail] = useState(credentials.email)
  const [resetStep, setResetStep] = useState<'idle' | 'sent' | 'done'>('idle')
  const [resetValue, setResetValue] = useState('')
  const [passwords, setPasswords] = useState({ visible: false, confirm: false })

  const strength = (() => {
    let score = 0
    if (next.length >= 8) score += 1
    if (/[A-Z]/.test(next)) score += 1
    if (/\d/.test(next)) score += 1
    if (/[^A-Za-z0-9]/.test(next)) score += 1
    return score
  })()

  const changePassword = () => {
    if (!current || next.length < 8 || next !== confirm) { setNotice('Check the current password and make sure both new passwords match'); return }
    setCredentials((value) => ({ ...value, password: next }))
    setCurrent(''); setNext(''); setConfirm('')
    setNotice('Password updated successfully')
    setNotices((items) => [{ id: `N-${Date.now()}`, kind: 'security', title: 'Password changed', detail: `Your ${isEmployee ? 'employee' : 'HR'} portal password was reset successfully.`, actor: 'You', time: 'Just now', audience: 'Both', read: false }, ...items])
  }

  const runReset = () => {
    if (resetStep === 'idle') { setResetStep('sent'); return }
    if (resetValue.length < 8) { setNotice('New password must be at least 8 characters'); return }
    setCredentials((value) => ({ ...value, password: resetValue }))
    setResetStep('done')
    setNotice('Password reset. You can sign in with the new password now.')
    setNotices((items) => [{ id: `N-${Date.now()}`, kind: 'security', title: 'Password reset', detail: 'A reset password was set for your portal account.', actor: 'You', time: 'Just now', audience: 'Both', read: false }, ...items])
  }

  return <section className="management-page">
    <div className="workspace-hero"><div><p className="eyebrow">WORKSPACE</p><h1>Settings</h1><p>Manage your login credentials, password, and workspace appearance.</p></div></div>
    {notice && <div className="panel contract-saved"><Sparkles /><div><strong>{notice}</strong><p>Update saved to your account.</p></div></div>}
    <div className="contract-columns">
      <div className="reg-main">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">LOGIN CREDENTIALS</p><h2>Your account</h2></div><span className="status-pill ok">{isEmployee ? 'Employee access' : 'HR administrator'}</span></div>
          <div className="profile-hero-main settings-identity"><div className="avatar avatar-sand">{isEmployee ? 'AO' : 'JD'}</div><div><strong>{isEmployee ? 'Amara Okafor' : 'Jordan Davis'}</strong><p className="muted-copy">{isEmployee ? 'Product Designer · Design' : 'HR Administrator · People Operations'}</p></div></div>
          <div className="detail-fields profile-fields">
            <div className="detail-field"><small>Email address (username)</small><input value={credentials.email} onChange={(event) => setCredentials((value) => ({ ...value, email: event.target.value }))} /></div>
            <div className="detail-field"><small>Current password</small><input type={passwords.visible ? 'text' : 'password'} value={current} onChange={(event) => setCurrent(event.target.value)} placeholder="Enter current password" /></div>
            <div className="detail-field"><small>New password</small><input type={passwords.visible ? 'text' : 'password'} value={next} onChange={(event) => setNext(event.target.value)} placeholder="At least 8 characters" /></div>
            <div className="detail-field"><small>Confirm new password</small><input type={passwords.confirm ? 'text' : 'password'} value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repeat the new password" /></div>
          </div>
          {next && <div className="password-meter"><div><i className={`s${strength}`} /><i className={`s${strength > 1 ? strength : 0}`} /><i className={`s${strength > 2 ? strength : 0}`} /><i className={`s${strength > 3 ? strength : 0}`} /></div><p>{['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][strength]} password</p></div>}
          <div className="settings-toggles"><label><input type="checkbox" checked={passwords.visible} onChange={(event) => setPasswords((value) => ({ ...value, visible: event.target.checked }))} />Show passwords</label><label><input type="checkbox" checked={passwords.confirm} onChange={(event) => setPasswords((value) => ({ ...value, confirm: event.target.checked }))} />Show confirmation</label></div>
          <div className="form-actions"><button className="primary-button" onClick={changePassword}><ShieldCheck /> Update password</button></div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">FORGOTTEN PASSWORD</p><h2>Reset a worker password</h2></div></div>
          {resetStep === 'idle' && <><p className="settings-hint">If a worker cannot sign in, reset their password here. They keep the same email address as their username.</p><div className="detail-fields profile-fields"><div className="detail-field full"><small>Worker email address</small><input value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="worker@goldenhr.com" /></div></div><div className="form-actions"><button className="secondary-button" onClick={runReset}><UserPlus /> Send reset code</button></div></>}
          {resetStep === 'sent' && <><p className="settings-hint">A reset code was sent to {resetEmail}. Set the new password below to complete the reset.</p><div className="detail-fields profile-fields"><div className="detail-field full"><small>New temporary password</small><input value={resetValue} onChange={(event) => setResetValue(event.target.value)} placeholder="At least 8 characters" /></div></div><div className="form-actions"><button className="secondary-button" onClick={() => setResetStep('idle')}>Cancel</button><button className="primary-button" type="button" onClick={runReset}><ShieldCheck /> Set new password</button></div></>}
          {resetStep === 'done' && <><div className="profile-note"><FileCheck2 /><div><strong>Password reset complete</strong><p>{resetEmail} can now sign in with the new password. Share it with them securely.</p></div></div><div className="form-actions"><button className="secondary-button" onClick={() => { setResetStep('idle'); setResetValue('') }}><Plus /> Reset another worker</button></div></>}
        </article>
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
type ReportRow = {
  month: string; monthIndex: number
  payrollGross: number; payrollNet: number; allowances: number; deductions: number; paye: number; pension: number
  requested: number; approved: number; rejected: number; requestsCount: number; rejectedCount: number
  contracts: number; renewals: number; headcount: number; docsAdded: number; employeesAdded: number; rolesAdded: number; departmentsAdded: number; leaveApproved: number; leaveDeclined: number
}

const REPORT_YEAR = 2024

const reportData: ReportRow[] = [
  { month: 'January', monthIndex: 0, payrollGross: 462000000, payrollNet: 398000000, allowances: 41000000, deductions: 97000000, paye: 64000000, pension: 33000000, requested: 98000000, approved: 71000000, rejected: 18000000, requestsCount: 7, rejectedCount: 2, contracts: 6, renewals: 2, headcount: 212, docsAdded: 18, employeesAdded: 4, rolesAdded: 3, departmentsAdded: 1, leaveApproved: 14, leaveDeclined: 3 },
  { month: 'February', monthIndex: 1, payrollGross: 478000000, payrollNet: 412000000, allowances: 44000000, deductions: 101000000, paye: 67000000, pension: 34000000, requested: 86000000, approved: 64000000, rejected: 12000000, requestsCount: 6, rejectedCount: 1, contracts: 3, renewals: 1, headcount: 219, docsAdded: 11, employeesAdded: 7, rolesAdded: 2, departmentsAdded: 0, leaveApproved: 11, leaveDeclined: 2 },
  { month: 'March', monthIndex: 2, payrollGross: 470000000, payrollNet: 405000000, allowances: 43000000, deductions: 99000000, paye: 66000000, pension: 33000000, requested: 131000000, approved: 107000000, rejected: 24000000, requestsCount: 9, rejectedCount: 3, contracts: 2, renewals: 0, headcount: 226, docsAdded: 22, employeesAdded: 5, rolesAdded: 5, departmentsAdded: 1, leaveApproved: 16, leaveDeclined: 4 },
  { month: 'April', monthIndex: 3, payrollGross: 501000000, payrollNet: 431000000, allowances: 48000000, deductions: 108000000, paye: 72000000, pension: 36000000, requested: 118000000, approved: 103000000, rejected: 15000000, requestsCount: 8, rejectedCount: 1, contracts: 5, renewals: 2, headcount: 234, docsAdded: 26, employeesAdded: 8, rolesAdded: 4, departmentsAdded: 2, leaveApproved: 12, leaveDeclined: 2 },
  { month: 'May', monthIndex: 4, payrollGross: 519000000, payrollNet: 447000000, allowances: 52000000, deductions: 116000000, paye: 77000000, pension: 39000000, requested: 169000000, approved: 138000000, rejected: 31000000, requestsCount: 12, rejectedCount: 3, contracts: 3, renewals: 1, headcount: 239, docsAdded: 19, employeesAdded: 5, rolesAdded: 6, departmentsAdded: 0, leaveApproved: 18, leaveDeclined: 5 },
  { month: 'June', monthIndex: 5, payrollGross: 560000000, payrollNet: 482000000, allowances: 56000000, deductions: 122000000, paye: 81000000, pension: 41000000, requested: 149000000, approved: 127000000, rejected: 22000000, requestsCount: 11, rejectedCount: 2, contracts: 4, renewals: 3, headcount: 244, docsAdded: 31, employeesAdded: 6, rolesAdded: 3, departmentsAdded: 1, leaveApproved: 21, leaveDeclined: 3 },
  { month: 'July', monthIndex: 6, payrollGross: 576000000, payrollNet: 496000000, allowances: 58000000, deductions: 128000000, paye: 85000000, pension: 43000000, requested: 196000000, approved: 168000000, rejected: 28000000, requestsCount: 13, rejectedCount: 2, contracts: 4, renewals: 1, headcount: 248, docsAdded: 27, employeesAdded: 5, rolesAdded: 4, departmentsAdded: 1, leaveApproved: 19, leaveDeclined: 2 },
  { month: 'August', monthIndex: 7, payrollGross: 588000000, payrollNet: 508000000, allowances: 60000000, deductions: 132000000, paye: 88000000, pension: 44000000, requested: 172000000, approved: 156000000, rejected: 16000000, requestsCount: 10, rejectedCount: 1, contracts: 5, renewals: 2, headcount: 252, docsAdded: 24, employeesAdded: 4, rolesAdded: 2, departmentsAdded: 0, leaveApproved: 17, leaveDeclined: 1 },
  { month: 'September', monthIndex: 8, payrollGross: 601000000, payrollNet: 519000000, allowances: 62000000, deductions: 136000000, paye: 90000000, pension: 46000000, requested: 188000000, approved: 171000000, rejected: 17000000, requestsCount: 12, rejectedCount: 2, contracts: 3, renewals: 1, headcount: 256, docsAdded: 29, employeesAdded: 6, rolesAdded: 5, departmentsAdded: 1, leaveApproved: 22, leaveDeclined: 4 },
  { month: 'October', monthIndex: 9, payrollGross: 614000000, payrollNet: 530000000, allowances: 64000000, deductions: 140000000, paye: 93000000, pension: 47000000, requested: 204000000, approved: 183000000, rejected: 21000000, requestsCount: 14, rejectedCount: 2, contracts: 4, renewals: 2, headcount: 261, docsAdded: 33, employeesAdded: 7, rolesAdded: 4, departmentsAdded: 1, leaveApproved: 20, leaveDeclined: 3 },
  { month: 'November', monthIndex: 10, payrollGross: 628000000, payrollNet: 542000000, allowances: 66000000, deductions: 144000000, paye: 96000000, pension: 48000000, requested: 196000000, approved: 181000000, rejected: 15000000, requestsCount: 12, rejectedCount: 1, contracts: 5, renewals: 3, headcount: 266, docsAdded: 28, employeesAdded: 5, rolesAdded: 3, departmentsAdded: 0, leaveApproved: 24, leaveDeclined: 2 },
  { month: 'December', monthIndex: 11, payrollGross: 655000000, payrollNet: 566000000, allowances: 70000000, deductions: 152000000, paye: 101000000, pension: 51000000, requested: 224000000, approved: 209000000, rejected: 15000000, requestsCount: 15, rejectedCount: 1, contracts: 6, renewals: 4, headcount: 272, docsAdded: 41, employeesAdded: 6, rolesAdded: 5, departmentsAdded: 2, leaveApproved: 28, leaveDeclined: 1 },
]

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
      {hover !== null && <GraphTip show x={Math.min(Math.max((hover / Math.max(primary.length - 1, 1)) * 100, 12), 88)} y={8} title={`${labels[hover]} ${REPORT_YEAR}`} rows={[{ label: primaryLabel, value: money(primary[hover]), tone: 'primary' }, { label: secondaryLabel, value: money(secondary[hover]), tone: 'secondary' }]} />}
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
      {hover === index && <div className="graph-tip graph-tip-inline"><strong>{labels[index]} {REPORT_YEAR}</strong><span className="primary"><i className="graph-tip-dot" />Leave days<b>{value} days</b></span></div>}
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
      {hover === index && <div className="graph-tip graph-tip-inline"><strong>{labels[index]} {REPORT_YEAR}</strong><span className="primary"><i className="graph-tip-dot" />{primaryLabel}<b>{money(value)}</b></span><span className="secondary"><i className="graph-tip-dot" />{secondaryLabel}<b>{money(secondary[index])}</b></span></div>}
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
      {hover === index && <div className="graph-tip graph-tip-inline"><strong>{labels[index]} {REPORT_YEAR}</strong><span className="primary"><i className="graph-tip-dot" />{unit || 'Total'}<b>{money(value)}</b></span></div>}
    </div>)}
  </div>
}

function Donut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1
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
function ReportTable({ rows, highlight, onOpen }: { rows: ReportRow[]; highlight: number; onOpen: (index: number) => void }) {
  return <div className="profile-table report-table"><div className="profile-table-row profile-table-head"><span>Month</span><span>Gross</span><span>Net</span><span>Allow</span><span>Deduct</span><span>Requests</span><span>Rejected</span><span>Contracts</span><span>Staff</span><span /></div>
    {rows.map((row, index) => <div className={`profile-table-row ${index === highlight ? 'is-current' : ''}`} key={row.month}>
      <strong>{row.month}</strong><span>{compact(row.payrollGross)}</span><span>{compact(row.payrollNet)}</span><span>{compact(row.allowances)}</span><span>{compact(row.deductions)}</span><span>{row.requestsCount}</span><span>{row.rejectedCount}</span><span>{row.contracts}</span><span>{row.headcount}</span>
      <button className="ghost-icon" onClick={() => onOpen(index)} aria-label={`Open ${row.month}`}><Eye /></button>
    </div>)}</div>
}

function PortalSummary({ row, previous }: { row: ReportRow; previous: ReportRow }) {
  const delta = (value: number, before: number) => (before === 0 ? 0 : Math.round(((value - before) / before) * 100))
  const streams = [
    { portal: 'HR portal', icon: ShieldCheck, action: 'approve', rows: [['Payroll approved', `${row.payrollNet === previous.payrollNet ? 0 : row.requestsCount + 1} runs`], ['Money requests approved', `${row.approved / 1000000 | 0}M`], ['Leave approved', `${row.leaveApproved}`], ['Contracts active', `${row.contracts}`], ['Employees added', `${row.employeesAdded}`]] },
    { portal: 'Employee portal', icon: Users, action: 'submit', rows: [['Money requests sent', `${row.requestsCount}`], ['Requests approved', `${row.requestsCount - row.rejectedCount}`], ['Requests rejected', `${row.rejectedCount}`], ['Documents uploaded', `${row.docsAdded}`], ['Leave requested', `${row.leaveApproved + row.leaveDeclined}`]] },
  ]
  return <div className="portal-stream">
    {streams.map((stream) => { const Icon = stream.icon; return <article className="portal-stream-card" key={stream.portal}>
      <header><span className="portal-stream-icon"><Icon /></span><div><strong>{stream.portal}</strong><small>{stream.action} activity</small></div></header>
      <div className="portal-stream-rows">{stream.rows.map(([label, value]) => <div key={label as string}><span>{label as string}</span><strong>{value as string}</strong></div>)}</div>
    </article> })}
    <article className="portal-stream-card portal-stream-wide">
      <header><span className="portal-stream-icon"><TrendingUpIcon /></span><div><strong>Month on month</strong><small>against {previous.month}</small></div></header>
      <div className="portal-deltas">{[['Gross payroll', delta(row.payrollGross, previous.payrollGross)], ['Net payroll', delta(row.payrollNet, previous.payrollNet)], ['Allowances', delta(row.allowances, previous.allowances)], ['Deductions', delta(row.deductions, previous.deductions)], ['Requested', delta(row.requested, previous.requested)], ['Rejected', delta(row.rejected, previous.rejected)], ['Headcount', delta(row.headcount, previous.headcount)]].map(([label, value]) => <div key={label as string}><span>{label as string}</span><strong className={Number(value) >= 0 ? 'up' : 'down'}>{Number(value) >= 0 ? '+' : ''}{value as number}%</strong></div>)}</div>
    </article>
  </div>
}

function TrendingUpIcon() { return <Activity /> }

const leaveTrend = [29, 24, 33, 26, 31, 27, 33, 25, 35, 29, 32, 39]

function PayrollReportPage({ onBack }: { onBack: () => void }) {
  const [monthIndex, setMonthIndex] = useState(6)
  const [cadence, setCadence] = useState<'Monthly' | 'Yearly'>('Monthly')
  const row = reportData[monthIndex]
  const previous = reportData[(monthIndex - 1 + 12) % 12]
  const labels = reportData.map((entry) => entry.month)
  const yearTotal = reportData.reduce((sum, entry) => sum + entry.payrollGross, 0)
  const yearNet = reportData.reduce((sum, entry) => sum + entry.payrollNet, 0)
  const bonus = reportData.reduce((sum, entry) => sum + Math.round(entry.allowances * 0.42), 0)
  const delta = (value: number, before: number) => (before === 0 ? 0 : Math.round(((value - before) / before) * 100))

  return <section className="management-page payroll-report">
    <button className="back-link" onClick={onBack}><ChevronDown /> Back to reports</button>
    <div className="report-welcome">
      <div><p className="eyebrow">{REPORT_YEAR} PAYROLL REPORT</p><h1>Payroll overview</h1><p className="muted-copy">Total payroll, money requests, leave load and the monthly cycle.</p></div>
      <div className="report-controls"><select className="inline-select" value={monthIndex} onChange={(event) => setMonthIndex(Number(event.target.value))}>{reportData.map((entry, index) => <option key={entry.month} value={index}>{entry.month} {REPORT_YEAR}</option>)}</select><button className="primary-button" onClick={() => window.print()}><Download /> Export PDF</button></div>
    </div>

    <div className="report-dash">
      <aside className="report-rail" aria-label="Report sections">
        {[['Total payroll', WalletCards], ['Money requests', CircleDollarSign], ['Leave requests', CalendarDays], ['Payroll trend', Activity], ['Pay cycle', ClipboardCheck], ['Contracts', FileCheck2]].map(([label, Icon], index) => { const Cmp = Icon as typeof Users; return <button key={label as string} className={index === 0 ? 'on' : ''} title={label as string} aria-label={label as string}><Cmp /></button> })}
      </aside>

      <div className="report-dash-main">
        <div className="report-top-grid">
          <article className="report-card report-card-total">
            <header><p className="eyebrow">Total payroll</p><span className="report-chip">monthly</span></header>
            <h2>{money(row.payrollGross)}</h2>
            <div className="report-card-foot"><span>{row.headcount} employees paid</span><span className={`delta ${delta(row.payrollGross, previous.payrollGross) >= 0 ? 'up' : 'down'}`}>{delta(row.payrollGross, previous.payrollGross) >= 0 ? '+' : ''}{delta(row.payrollGross, previous.payrollGross)}%</span></div>
            <SparkBars values={reportData.map((entry) => entry.payrollGross)} highlight={monthIndex} />
          </article>
          <article className="report-card report-card-chart">
            <header><p className="eyebrow">Payroll trend</p><div className="seg-control">{(['Monthly', 'Yearly'] as const).map((key) => <button key={key} className={cadence === key ? 'on' : ''} onClick={() => setCadence(key)}>{key}</button>)}</div></header>
            <TrendBars values={reportData.map((entry) => cadence === 'Monthly' ? entry.payrollGross : entry.payrollNet)} labels={reportData.map((entry) => entry.month)} highlight={monthIndex} secondary={reportData.map((entry) => cadence === 'Monthly' ? entry.payrollNet : entry.paye)} primaryLabel={cadence === 'Monthly' ? 'Gross payroll' : 'Net payroll'} secondaryLabel={cadence === 'Monthly' ? 'Net pay' : 'PAYE withheld'} />
            <div className="report-card-foot"><span>Gross {cadence === 'Monthly' ? compact(row.payrollGross) : compact(yearTotal)}</span><span>Net {cadence === 'Monthly' ? compact(row.payrollNet) : compact(yearNet)}</span></div>
          </article>
          <article className="report-card report-card-balance">
            <header><p className="eyebrow">Year to date</p><span className="report-chip">{REPORT_YEAR}</span></header>
            <p className="report-balance-label">Net paid</p>
            <h2>{compact(yearNet)}</h2>
            <div className="report-area">{(reportData.map((entry, index) => entry.payrollNet)).map((value, index) => <i key={index} style={{ height: `${Math.max(6, (value / Math.max(...reportData.map((e) => e.payrollNet))) * 100)}%` }} />)}</div>
            <div className="report-card-foot"><span>Paid {reportData[0].month} Ã¢¬·œ {row.month}</span></div>
          </article>
        </div>

        <div className="report-mid-grid">
          <article className="report-card">
            <header><p className="eyebrow">Money requests</p><span className="report-chip">{row.requestsCount} raised</span></header>
            <h2>{compact(row.requested)}</h2>
            <div className="report-split"><div><span>Approved</span><strong className="up">{compact(row.approved)}</strong></div><div><span>Rejected</span><strong className="down">{compact(row.rejected)}</strong></div><div><span>Avg per request</span><strong>{compact(Math.round(row.requested / Math.max(row.requestsCount, 1)))}</strong></div></div>
            <div className="report-progress"><span style={{ width: `${Math.round((row.approved / Math.max(row.requested, 1)) * 100)}%` }} /></div>
            <div className="report-card-foot"><span>{row.requestsCount - row.rejectedCount} approved</span><span>{row.rejectedCount} rejected</span></div>
          </article>
          <article className="report-card">
            <header><p className="eyebrow">Leave requests</p><span className="report-chip">{leaveTrend[monthIndex]} total</span></header>
            <h2>{row.leaveApproved + row.leaveDeclined}</h2>
            <div className="report-split"><div><span>Approved</span><strong className="up">{row.leaveApproved}</strong></div><div><span>Declined</span><strong className="down">{row.leaveDeclined}</strong></div><div><span>Approval rate</span><strong>{Math.round((row.leaveApproved / Math.max(row.leaveApproved + row.leaveDeclined, 1)) * 100)}%</strong></div></div>
            <LeaveBars values={leaveTrend.slice(0, 7)} labels={workMonths} highlight={monthIndex} />
          </article>
        </div>

        <div className="report-cycle-grid">
          <article className="report-card">
            <header><p className="eyebrow">Pay cycle</p><span className="report-chip">{row.month}</span></header>
            <Donut slices={[{ label: 'Net pay', value: row.payrollNet, color: '#3f6280' }, { label: 'Deductions', value: row.deductions, color: '#a86f2d' }, { label: 'Bonus', value: Math.round(row.allowances * 0.42), color: '#5d7145' }, { label: 'Allowances', value: Math.round(row.allowances * 0.58), color: '#c08a3a' }]} />
          </article>
          <article className="report-card">
            <header><p className="eyebrow">Bonus, deductions, allowances</p><span className="report-chip">{REPORT_YEAR}</span></header>
            <div className="cycle-rows">
              {[['Bonus paid', reportData.reduce((sum, entry) => sum + Math.round(entry.allowances * 0.42), 0), '#5d7145'], ['Allowances', reportData.reduce((sum, entry) => sum + Math.round(entry.allowances * 0.58), 0), '#c08a3a'], ['PAYE withheld', reportData.reduce((sum, entry) => sum + entry.paye, 0), '#a86f2d'], ['NSSF pension', reportData.reduce((sum, entry) => sum + entry.pension, 0), '#9a5a8f'], ['Other deductions', reportData.reduce((sum, entry) => sum + entry.deductions - entry.paye - entry.pension, 0), '#3f6280']].map(([label, value, color]) => <div key={label as string}><span className="legend-dot" style={{ background: color as string }} />{label as string}<strong>{compact(value as number)}</strong><div className="cycle-track"><i style={{ width: `${Math.round(((value as number) / Math.max(row.deductions + row.allowances, 1)) * 100)}%`, background: color as string }} /></div></div>)}
            </div>
          </article>
          <article className="report-card">
            <header><p className="eyebrow">Month detail</p><span className="report-chip">{row.month}</span></header>
            <div className="report-detail-rows">{[['Gross payroll', row.payrollGross], ['Net payroll', row.payrollNet], ['Allowances', row.allowances], ['Total deductions', row.deductions], ['PAYE', row.paye], ['NSSF pension', row.pension]].map(([label, value]) => <div key={label as string}><span>{label as string}</span><strong>{compact(value as number)}</strong></div>)}</div>
            <PortalSummary row={row} previous={previous} />
          </article>
        </div>
      </div>
    </div>
  </section>
}
function ReportsPage() {
  const [monthIndex, setMonthIndex] = useState(6)
  const [year, setYear] = useState(REPORT_YEAR)
  const [tab, setTab] = useState<'overview' | 'payroll' | 'money' | 'allowance' | 'contracts'>('overview')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [payrollOpen, setPayrollOpen] = useState(false)

  if (payrollOpen) return <PayrollReportPage onBack={() => setPayrollOpen(false)} />

  const row = reportData[monthIndex]
  const previous = reportData[(monthIndex - 1 + 12) % 12]
  const labels = reportData.map((entry) => entry.month)

  if (openIndex !== null) {
    const detail = reportData[openIndex]
    const detailPrevious = reportData[(openIndex - 1 + 12) % 12]
    return <section className="management-page report-inner">
      <button className="back-link" onClick={() => setOpenIndex(null)}><ChevronDown /> Back to reports</button>
      <div className="panel report-inner-hero">
        <div><p className="eyebrow">{REPORT_YEAR} DETAIL</p><h1>{detail.month} {REPORT_YEAR}</h1><p className="muted-copy">{detail.headcount} employees · {detail.docsAdded} documents added · {detail.employeesAdded} joined</p></div>
        <div className="form-actions"><button className="secondary-button" onClick={() => window.print()}><Download /> Export PDF</button><button className="primary-button" onClick={() => window.print()}><FileText /> Full report</button></div>
      </div>
      <div className="count-widget-row">
        <CountWidget value={compact(detail.payrollGross)} hint="gross payroll" tone="tone-gold" icon={WalletCards} />
<CountWidget value={compact(detail.payrollGross)} hint="gross payroll" tone="tone-gold" icon={WalletCards} delta={pct(detail.payrollGross, detailPrevious.payrollGross)} foot="Gross vs last month" />
<CountWidget value={compact(detail.payrollNet)} hint="net payroll" tone="tone-blue" icon={CreditCard} delta={pct(detail.payrollNet, detailPrevious.payrollNet)} foot="Net vs last month" />
<CountWidget value={compact(detail.allowances)} hint="allowances" tone="tone-green" icon={ClipboardCheck} delta={pct(detail.allowances, detailPrevious.allowances)} foot="Allowances vs last month" />
<CountWidget value={compact(detail.deductions)} hint="deductions" tone="tone-rose" icon={ShieldCheck} delta={pct(detail.deductions, detailPrevious.deductions)} foot="Deductions vs last month" />
<CountWidget value={`${detail.requestsCount}`} hint="money requests" tone="tone-amber" icon={CircleDollarSign} delta={pct(detail.requestsCount, detailPrevious.requestsCount)} foot="Requests vs last month" />
      </div>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAYROLL COST</p><h2>Gross against net</h2></div></div><TrendChart primary={reportData.map((entry) => entry.payrollGross)} secondary={reportData.map((entry) => entry.payrollNet)} labels={labels} highlight={openIndex} primaryLabel="Gross" secondaryLabel="Net" gid={`trend1`} /></article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAY SPLIT</p><h2>Net, deductions, allowances</h2></div></div><Donut slices={[{ label: 'Net pay', value: detail.payrollNet, color: '#3f6280' }, { label: 'Deductions', value: detail.deductions, color: '#a86f2d' }, { label: 'Allowances', value: detail.allowances, color: '#5d7145' }]} /></article>
      </div>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PORTAL ACTIVITY</p><h2>HR and employee streams</h2></div></div><PortalSummary row={detail} previous={detailPrevious} /></article>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">{REPORT_YEAR}</p><h2>Every month compared</h2></div></div><ReportTable rows={reportData} highlight={openIndex} onOpen={setOpenIndex} /></article>
    </section>
  }

  const tabRows = tab === 'payroll' ? [['Gross payroll', compact(row.payrollGross)], ['Net payroll', compact(row.payrollNet)], ['PAYE withheld', compact(row.paye)], ['NSSF pension', compact(row.pension)]] : tab === 'money' ? [['Requested', compact(row.requested)], ['Approved', compact(row.approved)], ['Rejected', compact(row.rejected)], ['Requests', `${row.requestsCount}`]] : tab === 'allowance' ? [['Allowances paid', compact(row.allowances)], ['Total deductions', compact(row.deductions)], ['PAYE', compact(row.paye)], ['Pension', compact(row.pension)]] : [['Active contracts', `${row.contracts}`], ['Renewals due', `${row.renewals}`], ['Documents added', `${row.docsAdded}`], ['Staff on payroll', `${row.headcount}`]]

  return <section className="management-page reports-page">
    <div className="workspace-hero"><div><p className="eyebrow">INSIGHTS</p><h1>Reports & insights</h1><p>Payroll, money requests, allowances, deductions and contract coverage.</p></div><div className="report-controls">
      <select className="inline-select" value={year} onChange={(event) => setYear(Number(event.target.value))}><option value={2024}>2024</option><option value={2023}>2023</option></select>
      <select className="inline-select" value={monthIndex} onChange={(event) => setMonthIndex(Number(event.target.value))}>{reportData.map((entry, index) => <option key={entry.month} value={index}>{entry.month} {REPORT_YEAR}</option>)}</select>
      <button className="primary-button" onClick={() => setPayrollOpen(true)}><FileText /> Payroll report</button><button className="secondary-button" onClick={() => window.print()}><Download /> Export</button>
    </div></div>

    <div className="count-widget-row count-widget-hero">
      <CountWidget value={compact(row.payrollGross)} hint="gross payroll" tone="tone-gold" icon={WalletCards} />
<CountWidget value={compact(row.payrollGross)} hint="total payroll" tone="tone-gold" icon={WalletCards} delta={pct(row.payrollGross, previous.payrollGross)} foot="Gross vs last month" />
<CountWidget value={compact(row.payrollNet)} hint="net payroll" tone="tone-blue" icon={CreditCard} delta={pct(row.payrollNet, previous.payrollNet)} foot="Net vs last month" />
<CountWidget value={compact(row.requested)} hint="money requested" tone="tone-amber" icon={CircleDollarSign} delta={pct(row.requested, previous.requested)} foot="Requested vs last month" />
<CountWidget value={compact(row.rejected)} hint="money rejected" tone="tone-rose" icon={X} delta={pct(row.rejected, previous.rejected)} foot="Rejected vs last month" />
      <CountWidget value={`${row.headcount}`} hint="employees" tone="tone-green" icon={Users} />
    </div>

    <div className="profile-tabs" role="tablist">{(['overview', 'payroll', 'money', 'allowance', 'contracts'] as const).map((key) => <button key={key} role="tab" aria-selected={tab === key} className={`profile-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{key === 'overview' ? <LayoutDashboard /> : (() => { const Icon = key === 'payroll' ? WalletCards : key === 'money' ? CircleDollarSign : key === 'allowance' ? ClipboardCheck : FileCheck2; return <Icon /> })()}{key === 'overview' ? 'Overview' : key === 'payroll' ? 'Payroll' : key === 'money' ? 'Money requests' : key === 'allowance' ? 'Allowances' : 'Contracts'}</button>)}</div>

    {tab === 'overview' ? <>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">TOTAL PAYROLL USED</p><h2>Gross payroll by month</h2></div><span className="report-chip">{REPORT_YEAR}</span></div><ColumnChart values={reportData.map((entry) => entry.payrollGross)} labels={labels} highlight={monthIndex} unit="Total payroll" /><div className="chart-summary"><div><span className="summary-dot gold-dot" />{row.month} <strong>{compact(row.payrollGross)}</strong></div><div><span className="summary-dot dark-dot" />Year total <strong>{compact(reportData.reduce((sum, entry) => sum + entry.payrollGross, 0))}</strong></div></div></article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">MONEY REQUESTS</p><h2>Requested against rejected</h2></div></div><TrendChart primary={reportData.map((entry) => entry.requested)} secondary={reportData.map((entry) => entry.rejected)} labels={labels} highlight={monthIndex} primaryLabel="Requested" secondaryLabel="Rejected" gid={`trend2`} /></article>
      </div>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAYROLL COST</p><h2>Gross against net pay</h2></div></div><TrendChart primary={reportData.map((entry) => entry.payrollGross)} secondary={reportData.map((entry) => entry.payrollNet)} labels={labels} highlight={monthIndex} primaryLabel="Gross" secondaryLabel="Net" gid={`trend3`} /></article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">DISTRIBUTION</p><h2>{row.month} pay split</h2></div></div><Donut slices={[{ label: 'Net pay', value: row.payrollNet, color: '#3f6280' }, { label: 'Deductions', value: row.deductions, color: '#a86f2d' }, { label: 'Allowances', value: row.allowances, color: '#5d7145' }]} /></article>
      </div>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PORTAL ACTIVITY</p><h2>{row.month} across both portals</h2></div></div><PortalSummary row={row} previous={previous} /></article>
    </> : <>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">{row.month} {REPORT_YEAR}</p><h2>{tab === 'money' ? 'Requests by month' : tab === 'allowance' ? 'Allowances against deductions' : tab === 'contracts' ? 'Contracts by month' : 'Payroll by month'}</h2></div></div>
          <TrendChart primary={tab === 'money' ? reportData.map((entry) => entry.requested) : tab === 'allowance' ? reportData.map((entry) => entry.deductions) : tab === 'contracts' ? reportData.map((entry) => entry.contracts) : reportData.map((entry) => entry.payrollGross)} secondary={tab === 'money' ? reportData.map((entry) => entry.rejected) : tab === 'allowance' ? reportData.map((entry) => entry.allowances) : reportData.map((entry) => entry.renewals)} labels={labels} highlight={monthIndex} primaryLabel={tab === 'money' ? 'Requested' : tab === 'allowance' ? 'Deductions' : tab === 'contracts' ? 'Contracts' : 'Gross'} secondaryLabel={tab === 'money' ? 'Rejected' : tab === 'allowance' ? 'Allowances' : tab === 'contracts' ? 'Renewals' : 'Net'} gid={`trend4`} />
        </article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">THIS MONTH</p><h2>Key figures</h2></div></div>
          <div className="report-figure-list">{tabRows.map(([label, value]) => <div key={label as string}><span>{label as string}</span><strong>{value as string}</strong><SparkBars values={reportData.map((entry) => tab === 'payroll' ? entry.payrollGross : tab === 'money' ? entry.requested : tab === 'allowance' ? entry.deductions : entry.contracts)} highlight={monthIndex} /></div>)}</div>
        </article>
      </div>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">PORTAL ACTIVITY</p><h2>Where the work happened</h2></div></div><PortalSummary row={row} previous={previous} /></article>
    </>}

    <article className="panel"><div className="panel-heading"><div><p className="eyebrow">{REPORT_YEAR}</p><h2>Every month compared</h2></div></div><ReportTable rows={reportData} highlight={monthIndex} onOpen={setOpenIndex} /></article>
  </section>
}
function EmployeeDashboard() {
  const person = employeeRecords[0]
  const current = reportData[6]
  const previous = reportData[5]
  const growth = (value: number, before: number) => (before === 0 ? 0 : Math.round(((value - before) / before) * 100))
  const netTrend = paidMonths
  const workedTrend = workedDays
  const leaveTrend = leaveDays
  const contractDaysLeft = 241
  const health = Math.round(((1095 - contractDaysLeft) / 1095) * 100)
  const requestedTotal = moneyRequested.reduce((sum, value) => sum + value, 0)
  const approvedMoney = 900000

  const activity: ActivityRow[] = [
    { id: 'PR-2024-065', title: 'Payslip issued', meta: 'June 2026 payslip', amount: compact(4860000), status: 'Verified', time: 'Jun 28 · 09:42', kind: 'payroll' },
    { id: 'MR-2024-118', title: 'Money request', meta: 'Expense reimbursement', amount: '486K', status: 'Pending', time: 'Today · 09:14', kind: 'money' },
    { id: 'LV-2024-041', title: 'Leave approved', meta: 'Annual leave Jul 18 Ã¢¬·œ Jul 22', amount: '5 days', status: 'Approved', time: 'Jun 27 · 16:20', kind: 'leave' },
    { id: 'GH-2024-018', title: 'Contract updated', meta: 'Full time employment', amount: 'Active', status: 'Active', time: 'Jun 25 · 11:05', kind: 'contract' },
    { id: 'DOC-002', title: 'Document uploaded', meta: 'NIDA registration card', amount: '96 KB', status: 'Verified', time: 'Jun 22 · 15:38', kind: 'document' },
    { id: 'WP-2026', title: 'Goal checkpoint', meta: 'Q2 objectives review', amount: '86%', status: 'Completed', time: 'Jun 20 · 08:50', kind: 'leave' },
  ]

  return <section className="hr-dashboard">
    <div className="workspace-hero"><div><div className="eyebrow"><span className="live-dot" /> Tuesday, June 18, {REPORT_YEAR}</div><h1>Good morning, {person.name.split(' ')[0]}.</h1><p>Here is your personal workspace at a glance.</p></div><div className="header-actions"><button className="secondary-button"><CalendarDays /> This month <ChevronDown /></button><button className="primary-button"><Plus /> Request money</button></div></div>

    <div className="dash-layout">
      <div className="dash-metrics">
        <MetricTile label="Net pay this month" value={compact(netTrend[6])} delta={growth(netTrend[6], netTrend[5])} foot="This month" icon={WalletCards} trend={netTrend} colour="tone-gold" />
        <MetricTile label="Leave balance" value="18 days" delta={growth(leaveDays.reduce((sum, value) => sum + value, 0), 8)} foot="Remaining" icon={CalendarDays} trend={leaveTrend} colour="tone-blue" />
        <MetricTile label="Money requested" value={compact(requestedTotal)} delta={12} foot="4 requests" icon={CircleDollarSign} trend={moneyRequested} colour="tone-amber" />
        <MetricTile label="Contract days left" value={`${contractDaysLeft}`} delta={-3} foot={`${health}% elapsed`} icon={FileCheck2} trend={reportData.slice(0, 7).map((entry) => entry.contracts)} colour="tone-violet" />
        <MetricTile label="Work progress" value={`${goalProgress[6]}%`} delta={8} foot="Goal completion" icon={Activity} trend={goalProgress} colour="tone-green" />
        <MetricTile label="Payslips" value="7" delta={8} foot="Available to date" icon={CreditCard} trend={netTrend} colour="tone-rose" />
      </div>

      <PnlChart payroll={workedTrend} requests={leaveTrend} labels={workMonths} />
    </div>

    <div className="dash-lower">
      <article className="panel dash-credit">
        <header><p className="eyebrow">Available advance</p><button className="icon-button" aria-label="Open money requests"><ArrowUpRight /></button></header>
        <h2>{compact(2500000 - approvedMoney)}</h2>
        <span className={`metric-delta ${12 >= 0 ? 'up' : 'down'}`}><ArrowUpRight />12%<small>vs last period</small></span>
        <div className="dash-credit-block">
          <div className="dash-credit-head"><strong>Request history</strong><button className="more-button">View all <ArrowUpRight /></button></div>
          <div className="dash-request-list">
            {[['Expense reimbursement', '486K', 'Pending'], ['Salary advance', '900K', 'Approved'], ['Emergency advance', '0', 'Declined']].map(([label, amount, status]) => <div key={label}><span><strong>{label}</strong><small>{status}</small></span><b>{amount}</b></div>)}
          </div>
        </div>
      </article>

      <article className="panel dash-activity">
        <div className="panel-heading"><div><p className="eyebrow">Latest changes</p><h2>Recent activity</h2></div><div className="dash-activity-tools"><div className="search-field"><Search /><input placeholder="Search" /></div><button className="secondary-button"><Settings /> Filters</button></div></div>
        <div className="profile-table dash-table"><div className="profile-table-row profile-table-head"><span /><span>Activity</span><span>Amount</span><span>Status</span><span>Date</span><span /></div>
          {activity.map((row) => { const Icon = kindMeta[row.kind].icon; return <div className="profile-table-row" key={row.id}>
            <span><label className="dash-check"><input type="checkbox" /><i /></label></span>
            <span className="dash-activity-cell"><span className={`document-type-icon ${row.kind === 'money' ? 'is-image' : 'is-pdf'}`}><Icon /></span><span><strong>{row.title}</strong><small>{row.id} · {row.meta}</small></span></span>
            <span className="payroll-net-cell">{row.amount}</span>
            <span><span className={`status-pill ${row.status === 'Active' || row.status === 'Verified' || row.status === 'Approved' || row.status === 'Completed' ? 'ok' : ''}`}><i className="status-dot" />{row.status}</span></span>
            <span>{row.time}</span>
            <span><button className="ghost-icon" aria-label={`More actions for ${row.id}`}><MoreHorizontal /></button></span>
          </div> })}
        </div>
      </article>
    </div>
  </section>
}
function WorkChart({ primary, secondary, labels, highlight, format, primaryLabel, secondaryLabel }: { primary: number[]; secondary?: number[]; labels: string[]; highlight: number; format: (value: number) => string; primaryLabel: string; secondaryLabel?: string }) {
  const width = 660
  const height = 190
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
      {hover !== null && <GraphTip show x={Math.min(Math.max((hover / Math.max(primary.length - 1, 1)) * 100, 14), 86)} y={8} title={`${labels[hover]} ${REPORT_YEAR}`} rows={[{ label: primaryLabel, value: format(primary[hover]), tone: 'primary' }, ...(secondary ? [{ label: secondaryLabel ?? '', value: format(secondary[hover]), tone: 'secondary' }] : [])]} />}
    </div>
    <div className="chart-axis">{labels.map((label, index) => <span key={label} className={index === highlight || index === hover ? 'on' : ''}>{label.slice(0, 3)}</span>)}</div>
  </div>
}

const workMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const workedDays = [21, 19, 22, 20, 23, 21, 18]
const leaveDays = [2, 3, 5, 1, 2, 4, 0]
const moneyRequested = [0, 486000, 0, 210000, 0, 620000, 486000]
const paidMonths = [3980000, 4120000, 4050000, 4310000, 4470000, 4820000, 4860000]
const goalProgress = [54, 58, 63, 69, 74, 81, 86]

function WorkProgressPage() {
  const [tab, setTab] = useState<'overview' | 'days' | 'money' | 'contract' | 'leave' | 'payslip'>('overview')
  const person = employeeRecords[0]
  const worked = workedDays.reduce((sum, value) => sum + value, 0)
  const leave = leaveDays.reduce((sum, value) => sum + value, 0)
  const requested = moneyRequested.reduce((sum, value) => sum + value, 0)
  const contractDaysLeft = 241
  const contractTotal = 1095
  const health = Math.round(((contractTotal - contractDaysLeft) / contractTotal) * 100)

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { key: 'days' as const, label: 'Days worked', icon: Clock3 },
    { key: 'money' as const, label: 'Money requested', icon: CircleDollarSign },
    { key: 'contract' as const, label: 'Contract health', icon: FileCheck2 },
    { key: 'leave' as const, label: 'Leave requests', icon: CalendarDays },
    { key: 'payslip' as const, label: 'Payslips', icon: WalletCards },
  ]

  return <section className="management-page work-page">
    <div className="workspace-hero"><div><p className="eyebrow">PERFORMANCE</p><h1>Work progress</h1><p>Days, money, contract health, payslips and leave across your year.</p></div><div className="report-controls"><select className="inline-select" defaultValue={REPORT_YEAR}><option>{REPORT_YEAR}</option></select><button className="primary-button" onClick={() => window.print()}><Download /> Export analysis</button></div></div>

    <div className="count-widget-row">
      <CountWidget value={`${worked}`} hint="days worked" tone="tone-green" icon={BriefcaseBusiness} delta={9} foot="vs last period" />
      <CountWidget value={`${21 * 12 - worked - leave}`} hint="days remaining" tone="tone-blue" icon={Clock3} delta={-4} foot="left this year" />
      <CountWidget value={compact(requested)} hint="money requested" tone="tone-amber" icon={CircleDollarSign} delta={12} foot="across 4 requests" />
      <CountWidget value={`${contractDaysLeft}`} hint="contract days left" tone="tone-violet" icon={FileCheck2} delta={-3} foot={`${health}% elapsed`} />
      <CountWidget value="7" hint="payslips" tone="tone-gold" icon={WalletCards} delta={8} foot="net pay received" />
      <CountWidget value={`${leave}`} hint="leave days used" tone="tone-rose" icon={CalendarDays} delta={-6} foot="of 21 available" />
    </div>

    <div className="profile-tabs" role="tablist">{tabs.map(({ key, label, icon: Icon }) => <button key={key} role="tab" aria-selected={tab === key} className={`profile-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}><Icon />{label}</button>)}</div>

    {tab === 'overview' && <>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">ATTENDANCE</p><h2>Days worked against leave taken</h2></div><span className="report-chip">{REPORT_YEAR}</span></div><WorkChart primary={workedDays} secondary={leaveDays} labels={workMonths} highlight={6} format={(value) => `${value} days`} primaryLabel="Days worked" secondaryLabel="Leave taken" /></article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">LEAVE BALANCE</p><h2>Available against used</h2></div></div><Donut slices={[{ label: 'Remaining', value: 21 - leave, color: '#108652' }, { label: 'Used', value: leave, color: '#b3762c' }, { label: 'Booked', value: 5, color: '#9a4a5f' }]} /><div className="report-detail-rows"><div><span>Annual allowance</span><strong>21 days</strong></div><div><span>Taken this year</span><strong>{leave} days</strong></div><div><span>Booked ahead</span><strong>5 days</strong></div><div><span>Still available</span><strong>{21 - leave - 5} days</strong></div></div></article>
      </div>
      <div className="report-grid-two">
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">GOAL PROGRESS</p><h2>Quarterly objectives</h2></div></div><ColumnChart values={goalProgress} labels={workMonths} highlight={6} suffix="%" unit="Progress" /></article>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">CONTRACT HEALTH</p><h2>Term remaining</h2></div></div><div className="contract-health"><div className="contract-health-ring" style={{ '--p': `${health}%` } as React.CSSProperties}><div><strong>{contractDaysLeft}</strong><span>days left</span></div></div><div className="contract-health-rows"><div><span>Contract</span><strong>GH-2024-018</strong></div><div><span>Type</span><strong>Full time</strong></div><div><span>Started</span><strong>May 12, 2023</strong></div><div><span>Renews</span><strong>May 11, 2026</strong></div><div><span>Status</span><strong className="ok">Active</strong></div></div></div></article>
      </div>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">ANALYSIS</p><h2>What your numbers say</h2></div></div><div className="analysis-grid">{[
        { tone: 'tone-green', icon: BriefcaseBusiness, title: 'Attendance is strong', body: `You worked ${worked} days this year, averaging ${(worked / 7).toFixed(1)} days a month. That is ${Math.round((worked / 7) * 10) / 10 > 21 ? 'above' : 'in line with'} the monthly expectation of 21 days.` },
        { tone: 'tone-amber', icon: CircleDollarSign, title: 'Money requests are rising', body: `${compact(requested)} requested across four requests. Two of them were expense claims for design tools and travel, which People Operations approved in full.` },
        { tone: 'tone-violet', icon: FileCheck2, title: 'Contract is healthy', body: `${contractDaysLeft} days remain of a ${contractTotal} day term. You are ${health}% through, with no break clauses or pending amendments on record.` },
        { tone: 'tone-blue', icon: WalletCards, title: 'Pay is trending up', body: `Net pay moved from ${compact(paidMonths[0])} in January to ${compact(paidMonths[6])} in July, a ${Math.round(((paidMonths[6] - paidMonths[0]) / paidMonths[0]) * 100)}% rise driven by overtime and two bonuses.` },
      ].map((item) => { const Icon = item.icon; return <div className={`analysis-card ${item.tone}`} key={item.title}><span className="analysis-icon"><Icon /></span><strong>{item.title}</strong><p>{item.body}</p></div> })}</div></article>
    </>}

    {tab === 'days' && <article className="panel"><div className="panel-heading"><div><p className="eyebrow">ATTENDANCE</p><h2>Days worked per month</h2></div></div><WorkChart primary={workedDays} secondary={leaveDays} labels={workMonths} highlight={6} format={(value) => `${value} days`} primaryLabel="Days worked" secondaryLabel="Leave taken" /><div className="report-summary-grid">{workMonths.map((month, index) => <div className="report-summary-card" key={month}><strong>{month}</strong><span>{workedDays[index]} days worked</span><span>{leaveDays[index]} days leave</span></div>)}</div></article>}

    {tab === 'money' && <div className="report-grid-two"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">MONEY REQUESTS</p><h2>Requested by month</h2></div></div><ColumnChart values={moneyRequested} labels={workMonths} highlight={6} unit="Requested" /></article><article className="panel"><div className="panel-heading"><div><p className="eyebrow">BREAKDOWN</p><h2>Request mix</h2></div></div><Donut slices={[{ label: 'Expense claims', value: 1106000, color: '#108652' }, { label: 'Salary advance', value: 900000, color: '#b3762c' }, { label: 'Emergency', value: 1250000, color: '#9a4a5f' }]} /></article></div>}

    {tab === 'contract' && <article className="panel"><div className="panel-heading"><div><p className="eyebrow">CONTRACT HEALTH</p><h2>Employment term analysis</h2></div></div><div className="contract-health"><div className="contract-health-ring" style={{ '--p': `${health}%` } as React.CSSProperties}><div><strong>{health}%</strong><span>elapsed</span></div></div><div className="contract-health-rows"><div><span>Reference</span><strong>GH-2024-018</strong></div><div><span>Contract type</span><strong>Full time employment</strong></div><div><span>Start date</span><strong>May 12, 2023</strong></div><div><span>End date</span><strong>May 11, 2026</strong></div><div><span>Days remaining</span><strong>{contractDaysLeft}</strong></div><div><span>Renewal window</span><strong>Opens Mar 11, 2026</strong></div><div><span>Health</span><strong className="ok">Active and current</strong></div></div></div></article>}

    {tab === 'leave' && <div className="report-grid-two"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">LEAVE</p><h2>Leave taken by month</h2></div></div><ColumnChart values={leaveDays} labels={workMonths} highlight={6} unit="Days" /></article><article className="panel"><div className="panel-heading"><div><p className="eyebrow">BALANCE</p><h2>Allowance remaining</h2></div></div><Donut slices={[{ label: 'Remaining', value: 21 - leave, color: '#108652' }, { label: 'Used', value: leave, color: '#b3762c' }, { label: 'Booked', value: 5, color: '#9a4a5f' }]} /><div className="report-detail-rows"><div><span>Annual leave</span><strong>21 days</strong></div><div><span>Taken</span><strong>{leave} days</strong></div><div><span>Booked ahead</span><strong>5 days</strong></div><div><span>Available</span><strong>{21 - leave - 5} days</strong></div></div></article></div>}

    {tab === 'payslip' && <div className="report-grid-two"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAY</p><h2>Net pay by month</h2></div></div><WorkChart primary={paidMonths} labels={workMonths} highlight={6} format={(value) => money(value)} primaryLabel="Net pay" /></article><article className="panel"><div className="panel-heading"><div><p className="eyebrow">PAY SPLIT</p><h2>Where July pay goes</h2></div></div><Donut slices={[{ label: 'Net pay', value: 4860000, color: '#108652' }, { label: 'PAYE', value: 850000, color: '#b3762c' }, { label: 'NSSF', value: 430000, color: '#9a4a5f' }, { label: 'Allowances', value: 580000, color: '#3f6280' }]} /></article></div>}

  </section>
}

function WorkspacePage({ portal, page }: { portal: Portal; page: string }) {
  const isEmployee = portal === 'Employee'
  const pageData: Record<string, { eyebrow: string; title: string; description: string; metric: string; metricLabel: string; action: string }> = {
    'Add employee': { eyebrow: 'PEOPLE OPERATIONS', title: 'Add a new teammate', description: 'Bring your next great hire into the GoldenHR workspace.', metric: '12', metricLabel: 'New hires this month', action: 'Start employee profile' },
    'Employee management': { eyebrow: 'PEOPLE DIRECTORY', title: 'Employee management', description: 'Keep every profile, role, and lifecycle detail in one place.', metric: '248', metricLabel: 'Active employees', action: 'Export directory' },
    'Department & role': { eyebrow: 'ORGANIZATION', title: 'Departments & roles', description: 'Shape a clear organization with thoughtful access and ownership.', metric: '14', metricLabel: 'Active departments', action: 'Create department' },
    'Leave approval': { eyebrow: 'TIME OFF', title: 'Leave approval', description: 'Review requests and keep your people moving with confidence.', metric: '07', metricLabel: 'Requests to review', action: 'Review requests' },
    Payroll: { eyebrow: 'COMPENSATION', title: 'Payroll center', description: 'A calm, clear view of every payroll cycle and payment.', metric: 'TSh 482,000,000', metricLabel: 'This month', action: 'Run payroll' },
    Contracts: { eyebrow: 'PEOPLE DOCUMENTS', title: 'Contracts', description: 'Manage agreements, renewals, and important employment terms.', metric: '18', metricLabel: 'Renewals upcoming', action: 'Upload contract' },
    Documents: { eyebrow: 'DOCUMENT HUB', title: 'Documents', description: 'Everything your team needs, organized and easy to find.', metric: '326', metricLabel: 'Secure documents', action: 'Add document' },
    Reports: { eyebrow: 'INSIGHTS', title: 'Reports & insights', description: 'Turn people data into better decisions for your organization.', metric: '92%', metricLabel: 'Engagement score', action: 'Build a report' },
    Notifications: { eyebrow: 'UPDATES', title: 'Notifications', description: 'Stay close to the requests, approvals, and changes that matter.', metric: '04', metricLabel: 'Unread updates', action: 'Mark all as read' },
    Settings: { eyebrow: 'WORKSPACE', title: 'Settings', description: 'Tune GoldenHR to work exactly the way your team works.', metric: '100%', metricLabel: 'Workspace health', action: 'Save changes' },
    Payslip: { eyebrow: 'COMPENSATION', title: 'My payslips', description: 'Your salary history, available whenever you need it.', metric: '06', metricLabel: 'Payslips available', action: 'Download latest' },
    Contract: { eyebrow: 'EMPLOYMENT', title: 'My contract', description: 'Your current employment agreement and key terms.', metric: 'Active', metricLabel: 'Contract status', action: 'View contract' },
    'Registration info': { eyebrow: 'PERSONAL DETAILS', title: 'Registration info', description: 'Review the personal and banking details connected to your profile.', metric: 'Complete', metricLabel: 'Profile status', action: 'Edit information' },
    'Work progress': { eyebrow: 'PERFORMANCE', title: 'Work progress', description: 'Keep your goals, check-ins, and momentum visible.', metric: '86%', metricLabel: 'Goal progress', action: 'Update progress' },
    'Leave request': { eyebrow: 'TIME OFF', title: 'Request leave', description: 'Plan time away while keeping your team informed.', metric: '18 days', metricLabel: 'Available balance', action: 'Create request' },
    'Money request': { eyebrow: 'FINANCE', title: isEmployee ? 'Request money' : 'Money requests', description: 'Handle advances and reimbursements with a clear paper trail.', metric: isEmployee ? 'TSh 2,500,000' : '09', metricLabel: isEmployee ? 'Available limit' : 'Pending requests', action: isEmployee ? 'Create request' : 'Review requests' },
  }
  const data = pageData[page] ?? pageData['Settings']
  return <section className="workspace-page"><div className="workspace-hero"><div><p className="eyebrow">{data.eyebrow}</p><h1>{data.title}</h1><p>{data.description}</p></div><button className="primary-button"><Plus /> {data.action}</button></div><div className="workspace-grid"><article className="panel feature-panel"><div className="feature-orbit"><Sparkles /></div><p className="eyebrow">GOLDENHR WORKSPACE</p><h2>Built for better work.</h2><p>One thoughtful place for your people, their progress, and the details that keep everything moving.</p><button className="text-button">Explore this workspace <ArrowUpRight /></button></article><article className="panel metric-panel"><p className="eyebrow">AT A GLANCE</p><strong>{data.metric}</strong><span>{data.metricLabel}</span><div className="metric-line"><i /></div><p className="muted-copy">Updated just now · visibility set to your role</p></article></div><div className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>{isEmployee ? 'Your latest updates' : 'Latest workspace activity'}</h2></div><button className="more-button">View all <ArrowUpRight /></button></div>{['GoldenHR workspace is ready for your review','A new update was added to your people timeline','Your next action is waiting here'].map((item, index) => <div className="workspace-row" key={item}><div className="row-number">0{index + 1}</div><div><strong>{item}</strong><span>{index === 0 ? 'Today, 9:42 AM' : 'Yesterday'}</span></div><ArrowUpRight /></div>)}</div></section>
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

  return <main className="login-screen"><section className="login-widget"><div className="login-brand"><div className="brand-mark"><GoldMark /></div><div><strong>GOLDENHR</strong><span>People, elevated.</span></div></div><h1>Welcome back.</h1><p>Sign in to your people workspace and keep better work moving.</p><form className="login-form" onSubmit={submit}><div className="login-field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="username" placeholder="you@goldenhr.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><div className="login-field"><label htmlFor="login-password">Password</label><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>{error && <div className="login-error" role="alert"><X />{error}</div>}<button className="login-submit" type="submit" disabled={busy}>{busy ? 'Signing in·¦' : 'Sign in to GoldenHR'}</button></form><p className="login-footnote">Passwords are case sensitive and a trailing space is rejected. Your portal is chosen automatically from your account.</p></section></main>
}

type ActivityRow = { id: string; title: string; meta: string; amount: string; status: string; time: string; kind: NoticeKind }

function Sparkline({ values, tone = 'up' }: { values: number[]; tone?: 'up' | 'down' }) {
  const width = 120
  const height = 40
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const stepX = width / Math.max(values.length - 1, 1)
  const toY = (value: number) => height - 6 - ((value - min) / range) * (height - 14)
  const path = values.map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * stepX).toFixed(1)} ${toY(value).toFixed(1)}`).join(' ')
  const id = `spark-${tone}-${values.length}-${Math.round(max)}-${Math.round(min)}`
  const lastX = (values.length - 1) * stepX
  const lastY = toY(values[values.length - 1])
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
  const max = Math.max(...payroll, ...requests)
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
        {payroll.map((value, index) => <div className={`pnl-col ${hover === index ? 'hovered' : ''}`} key={labels[index]} onMouseEnter={() => setHover(index)}>
          <div className="pnl-bars"><span className="pnl-bar requests" style={{ height: `${scale(requests[index])}%` }} /><span className="pnl-bar payroll" style={{ height: `${scale(value)}%` }} /></div>
          <small className={hover === index ? 'on' : ''}>{labels[index].slice(0, 3)}</small>
          {hover === index && <div className="graph-tip graph-tip-inline"><strong>{labels[index]} {REPORT_YEAR}</strong><span className="primary"><i className="graph-tip-dot" />{primaryLabel}<b>{money(value)}</b></span><span className="secondary"><i className="graph-tip-dot" />{secondaryLabel}<b>{money(requests[index])}</b></span></div>}
        </div>)}
      </div>
    </div>
  </article>
}
function HrDashboard() {
  const current = reportData[6]
  const previous = reportData[5]
  const growth = (value: number, before: number) => (before === 0 ? 0 : Math.round(((value - before) / before) * 100))
  const payrollTrend = reportData.slice(0, 7).map((entry) => entry.payrollGross)
  const requestTrend = reportData.slice(0, 7).map((entry) => entry.requested)
  const leaveTrend = reportData.slice(0, 7).map((entry) => entry.leaveApproved + entry.leaveDeclined)
  const headcountTrend = reportData.slice(0, 7).map((entry) => entry.headcount)

  const activity: ActivityRow[] = [
    { id: 'PR-2024-065', title: 'Payroll created', meta: 'Liam Chen', amount: compact(current.payrollNet), status: 'Pending approval', time: `${current.month} · 09:42`, kind: 'payroll' },
    { id: 'MR-2024-118', title: 'Money request', meta: 'Amara Okafor', amount: '486K', status: 'Pending', time: 'Today · 09:14', kind: 'money' },
    { id: 'GH-2024-021', title: 'Contract renewed', meta: 'Liam Chen', amount: 'Part time', status: 'Active', time: 'Jun 28 · 16:20', kind: 'contract' },
    { id: 'LV-2024-041', title: 'Leave request', meta: 'Amara Okafor', amount: '5 days', status: 'Pending', time: 'Jun 27 · 11:05', kind: 'leave' },
    { id: 'DOC-014', title: 'Document uploaded', meta: 'Liam Chen', amount: '96 KB', status: 'Verified', time: 'Jun 26 · 15:38', kind: 'document' },
    { id: 'EMP-0248', title: 'Employee added', meta: 'Amara Okafor', amount: 'Design', status: 'Active', time: 'Jun 25 · 08:50', kind: 'employee' },
  ]

  return <section className="hr-dashboard">
    <div className="workspace-hero"><div><div className="eyebrow"><span className="live-dot" /> Tuesday, June 18, {REPORT_YEAR}</div><h1>Good morning, Jordan.</h1><p>Here is what is happening across your people today.</p></div><div className="header-actions"><button className="secondary-button"><CalendarDays /> This month <ChevronDown /></button><button className="primary-button"><Plus /> Add employee</button></div></div>

    <div className="dash-layout">
      <div className="dash-metrics">
        <MetricTile label="Total payroll" value={compact(current.payrollGross)} delta={growth(current.payrollGross, previous.payrollGross)} foot="This month" icon={WalletCards} trend={payrollTrend} colour="tone-gold" />
        <MetricTile label="Money requested" value={compact(current.requested)} delta={growth(current.requested, previous.requested)} foot="This month" icon={CircleDollarSign} trend={requestTrend} colour="tone-amber" />
        <MetricTile label="Leave requests" value={`${current.leaveApproved + current.leaveDeclined}`} delta={growth(current.leaveApproved + current.leaveDeclined, previous.leaveApproved + previous.leaveDeclined)} foot="This month" icon={CalendarDays} trend={leaveTrend} colour="tone-blue" />
        <MetricTile label="Active contracts" value={`${current.contracts}`} delta={growth(current.contracts, previous.contracts)} foot="On record" icon={FileCheck2} trend={reportData.slice(0, 7).map((entry) => entry.contracts)} colour="tone-violet" />
        <MetricTile label="Total employees" value={`${current.headcount}`} delta={growth(current.headcount, previous.headcount)} foot="Headcount" icon={Users} trend={headcountTrend} colour="tone-green" />
        <MetricTile label="Money rejected" value={compact(current.rejected)} delta={-growth(current.rejected, previous.rejected)} foot="This month" icon={X} trend={reportData.slice(0, 7).map((entry) => entry.rejected)} tone="down" colour="tone-rose" />
      </div>

      <PnlChart payroll={payrollTrend} requests={requestTrend} labels={reportData.slice(0, 7).map((entry) => entry.month)} />
    </div>

    <div className="dash-lower">
      <article className="panel dash-credit">
        <header><p className="eyebrow">Total requested</p><button className="icon-button" aria-label="Open money requests"><ArrowUpRight /></button></header>
        <h2>{compact(current.requested)}</h2>
        <span className={`metric-delta ${growth(current.requested, previous.requested) >= 0 ? 'up' : 'down'}`}>{growth(current.requested, previous.requested) >= 0 ? '+' : ''}{growth(current.requested, previous.requested)}%</span>
        <div className="dash-credit-block">
          <div className="dash-credit-head"><strong>Employees on advance</strong><button className="more-button">View all <ArrowUpRight /></button></div>
          <div className="avatar-stack">{employeeRecords.map((person, index) => <div className={`avatar ${['saffron', 'olive', 'plum', 'clay'][index % 4]}`} key={person.email}>{person.name.split(' ').map((part) => part[0]).join('')}</div>)}<div className="avatar avatar-more">+{Math.max(0, current.requestsCount * 3)}</div></div>
        </div>
      </article>

      <article className="panel dash-activity">
        <div className="panel-heading"><div><p className="eyebrow">Latest changes</p><h2>Recent activity</h2></div><div className="dash-activity-tools"><div className="search-field"><Search /><input placeholder="Search" /></div><button className="secondary-button"><Settings /> Filters</button></div></div>
        <div className="profile-table dash-table"><div className="profile-table-row profile-table-head"><span /><span>Activity</span><span>Amount</span><span>Status</span><span>Date</span><span /></div>
          {activity.map((row) => { const Icon = kindMeta[row.kind].icon; return <div className="profile-table-row" key={row.id}>
            <span><label className="dash-check"><input type="checkbox" /><i /></label></span>
            <span className="dash-activity-cell"><span className={`document-type-icon ${row.kind === 'money' ? 'is-image' : 'is-pdf'}`}><Icon /></span><span><strong>{row.title}</strong><small>{row.id} · {row.meta}</small></span></span>
            <span className="payroll-net-cell">{row.amount}</span>
            <span><span className={`status-pill ${row.status === 'Active' || row.status === 'Verified' ? 'ok' : row.status === 'Pending' || row.status === 'Pending approval' ? '' : 'off'}`}><i className="status-dot" />{row.status}</span></span>
            <span>{row.time}</span>
            <span><button className="ghost-icon" aria-label={`More actions for ${row.id}`}><MoreHorizontal /></button></span>
          </div> })}
        </div>
      </article>
    </div>
  </section>
}
function Dashboard({ portal }: { portal: Portal }) {
  return portal === 'HR' ? <HrDashboard /> : <EmployeeDashboard />
}

export default function Page() {
  const [authenticated, setAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [portal, setPortal] = useState<Portal>('HR')
  const [active, setActive] = useState('Dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moneyRequests, setMoneyRequests] = useState(initialMoneyRequests)
  const [notices, setNotices] = useNotices()
  const [credentials, setCredentials] = useState(defaultCredentials)
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
  const unread = notices.filter((item) => !item.read && (item.audience !== 'HR' || portal === 'HR')).length

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
<main className="app-shell">
    <div className={`mobile-overlay ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
<div className={mobileOpen ? 'mobile-nav-open' : ''}><SideNav portal={portal} active={active} onChange={(item) => { setActive(item); setMobileOpen(false) }} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} unread={unread} user={currentUser} /></div>{collapsed && <button className="sidebar-reopen icon-button" onClick={() => setCollapsed(false)} aria-label="Open sidebar" title="Open sidebar"><Menu /></button>}
  <section className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button><div className="breadcrumb"><Grid2X2 /> <span>Workspace</span><span>/</span><strong>{pageTitle}</strong></div><div className="topbar-right"><button className="top-icon" aria-label="Search"><Search /></button><button className="top-icon notification-button" onClick={() => setActive('Notifications')} aria-label="Notifications"><Bell />{unread > 0 && <i>{unread}</i>}</button><div className="top-profile"><div className="avatar avatar-sand">{initialsOf(currentUser?.name)}</div><ChevronDown /></div><button className="logout-button" onClick={signOut}><LogOut /> Logout</button></div></header>
      <div className="page-content">{active === 'Dashboard' ? <Dashboard portal={portal} /> : active === 'Add employee' && portal === 'HR' ? <AddEmployeePage editing={null} onDone={() => setActive('Employee management')} /> : active === 'Employee management' && portal === 'HR' ? <EmployeeManagementPage /> : active === 'Department & role' && portal === 'HR' ? <DepartmentRolesPage /> : active === 'Reports' ? <ReportsPage /> : active === 'Contracts' && portal === 'HR' ? <ContractsPage /> : active === 'Documents' && portal === 'HR' ? <DocumentsPage /> : active === 'Work progress' && portal === 'Employee' ? <WorkProgressPage /> : active === 'Contract' && portal === 'Employee' ? <EmployeeContractPage /> : active === 'Leave approval' && portal === 'HR' ? <LeaveApprovalPage /> : active === 'Leave request' && portal === 'Employee' ? <LeaveRequestPage /> : active === 'Payroll' && portal === 'HR' ? <PayrollCenterPage /> : active === 'Notifications' ? <NotificationsPage isEmployee={portal === 'Employee'} notices={notices} setNotices={setNotices} /> : active === 'Settings' ? <SettingsPage isEmployee={portal === 'Employee'} credentials={credentials} setCredentials={setCredentials} theme={theme} setTheme={setTheme} setNotices={setNotices} /> : active === 'Registration info' && portal === 'Employee' ? <RegistrationInfo person={employeeRecords[0]} mode="self" onBack={() => setActive('Dashboard')} /> : active === 'Payslip' && portal === 'Employee' ? <EmployeePayslipsPage /> : active === 'Money request' ? <MoneyRequestPage isEmployee={portal === 'Employee'} requests={moneyRequests} setRequests={setMoneyRequests} /> : <WorkspacePage portal={portal} page={active} />}</div>
      <footer className="main-footer"><span><span className="live-dot" /> All systems operational</span><span>© 2024 GoldenHR <span className="footer-divider">·</span> Built for better work.</span></footer>
    </section>
  </main>
</HrDataProvider>
)
}
