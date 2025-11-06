import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthProvider'
import api from '../../api/axios'

export default function ManagePayroll() {
  const { user } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [payrolls, setPayrolls] = useState([])
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [filters, setFilters] = useState({ status: 'all', startDate: '', endDate: '' })
  
  // Determine user role
  const userRole = user?.role?.toLowerCase() || ''
  const isFinance = userRole === 'finance' || userRole === 'admin'
  const isHR = userRole === 'hr' || userRole === 'admin'
  const isStaff = userRole === 'staff' || userRole === 'practitioner'
  const isPatient = userRole === 'patient'

  useEffect(() => {
    if (!isPatient) {
      fetchPayrolls()
      if (isFinance || isHR) {
        fetchStaffList()
      }
    }
  }, [selectedPeriod, filters])

  const fetchPayrolls = async () => {
    setLoading(true)
    try {
      const params = {}
      if (isStaff) {
        // Staff only sees their own payroll
        params.staff_id = user?.staff_profile?.id
      }
      if (filters.status !== 'all') params.status = filters.status
      
      const res = await api.get('/payroll-enhanced/', { params })
      setPayrolls(res.data || [])
    } catch (error) {
      console.error('Error fetching payrolls:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/staff/')
      setStaffList(res.data || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const handleProcessPayroll = async (staffId) => {
    try {
      // Calculate pay period (bi-weekly)
      const today = new Date()
      const payPeriodEnd = new Date(today)
      const payPeriodStart = new Date(today)
      payPeriodStart.setDate(payPeriodStart.getDate() - 14)

      await api.post('/payroll-enhanced/process', {
        staff_id: staffId,
        pay_period_start: payPeriodStart.toISOString(),
        pay_period_end: payPeriodEnd.toISOString()
      })

      alert('Payroll processed successfully!')
      fetchPayrolls()
    } catch (error) {
      alert('Error processing payroll: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleBulkProcess = async () => {
    if (!user?.company_id) {
      alert('Company ID not found')
      return
    }

    if (!confirm('Process payroll for all staff in the company?')) return

    try {
      const today = new Date()
      const payPeriodEnd = new Date(today)
      const payPeriodStart = new Date(today)
      payPeriodStart.setDate(payPeriodStart.getDate() - 14)

      await api.post('/payroll-enhanced/process/bulk', {
        company_id: user.company_id,
        pay_period_start: payPeriodStart.toISOString(),
        pay_period_end: payPeriodEnd.toISOString()
      })

      alert('Bulk payroll processing completed!')
      fetchPayrolls()
    } catch (error) {
      alert('Error processing bulk payroll: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleApprovePayroll = async (payrollId) => {
    try {
      await api.put(`/payroll-enhanced/${payrollId}/approve`)
      alert('Payroll approved!')
      fetchPayrolls()
    } catch (error) {
      alert('Error approving payroll: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleMarkPaid = async (payrollId) => {
    try {
      await api.put(`/payroll-enhanced/${payrollId}/mark-paid`)
      alert('Payroll marked as paid!')
      fetchPayrolls()
    } catch (error) {
      alert('Error marking payroll as paid: ' + (error.response?.data?.detail || error.message))
    }
  }

  // Patient cannot access
  if (isPatient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold text-slate-700">Access Denied</h3>
          <p className="text-slate-500 mt-2">Patients do not have access to payroll information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payroll Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isStaff && 'View your payment history and reports'}
            {isHR && 'Manage all staff payments'}
            {isFinance && 'Full payroll management and processing'}
          </p>
        </div>
        {isFinance && (
          <button
            onClick={handleBulkProcess}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
          >
            <ProcessIcon />
            Process All Staff Payroll
          </button>
        )}
      </div>

      {/* Tabs (Finance/HR only) */}
      {(isFinance || isHR) && (
        <div className="flex gap-2 border-b border-slate-200">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
          <TabButton active={activeTab === 'process'} onClick={() => setActiveTab('process')}>Process Payroll</TabButton>
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Reports</TabButton>
          <TabButton active={activeTab === 'staff-config'} onClick={() => setActiveTab('staff-config')}>Staff Configuration</TabButton>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pay Period</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="current">Current Period</option>
            <option value="last">Last Period</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="year-to-date">Year to Date</option>
          </select>
        </div>

        <button
          onClick={fetchPayrolls}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
        >
          Refresh
        </button>
      </div>

      {/* Content based on role and tab */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {isStaff && <StaffPayrollView payrolls={payrolls} />}
          {(isFinance || isHR) && activeTab === 'overview' && (
            <FinanceOverview payrolls={payrolls} />
          )}
          {isFinance && activeTab === 'process' && (
            <ProcessPayroll staffList={staffList} onProcess={handleProcessPayroll} />
          )}
          {(isFinance || isHR) && activeTab === 'reports' && (
            <PayrollReports payrolls={payrolls} onApprove={handleApprovePayroll} onMarkPaid={handleMarkPaid} isFinance={isFinance} />
          )}
          {isFinance && activeTab === 'staff-config' && (
            <StaffConfiguration staffList={staffList} />
          )}
        </>
      )}
    </div>
  )
}

// ========================================
// STAFF VIEW (Staff only sees their payments)
// ========================================
function StaffPayrollView({ payrolls }) {
  const totalEarnings = payrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0)
  const currentPeriod = payrolls[0] || {}

  return (
    <div className="space-y-6">
      {/* Staff Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Current Period Earnings"
          value={`$${currentPeriod.net_pay?.toFixed(2) || '0.00'}`}
          subtitle={`Gross: $${currentPeriod.gross_pay?.toFixed(2) || '0.00'}`}
          icon={<DollarIcon />}
          color="bg-green-100 text-green-600"
        />
        <SummaryCard
          title="Total Deductions"
          value={`$${currentPeriod.total_deductions?.toFixed(2) || '0.00'}`}
          subtitle="Taxes & Benefits"
          icon={<MinusIcon />}
          color="bg-orange-100 text-orange-600"
        />
        <SummaryCard
          title="Hours Worked"
          value={currentPeriod.hours_worked || '0'}
          subtitle={`Rate: $${currentPeriod.hourly_rate?.toFixed(2) || '0.00'}/hr`}
          icon={<ClockIcon />}
          color="bg-blue-100 text-blue-600"
        />
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Payment History (Bi-Monthly)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gross Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Deductions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Net Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No payment records found
                  </td>
                </tr>
              ) : (
                payrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDateRange(payroll.pay_period_start, payroll.pay_period_end)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{payroll.hours_worked}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">${payroll.gross_pay?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-red-600">-${payroll.total_deductions?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">${payroll.net_pay?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={payroll.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Breakdown (Current Period) */}
      {currentPeriod.id && (
        <TaxBreakdown payroll={currentPeriod} />
      )}
    </div>
  )
}

// ========================================
// FINANCE/HR OVERVIEW
// ========================================
function FinanceOverview({ payrolls }) {
  const stats = {
    totalGross: payrolls.reduce((sum, p) => sum + (p.gross_pay || 0), 0),
    totalNet: payrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + (p.total_deductions || 0), 0),
    pending: payrolls.filter(p => p.status === 'pending').length,
    approved: payrolls.filter(p => p.status === 'approved').length,
    paid: payrolls.filter(p => p.status === 'paid').length,
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Gross Pay"
          value={`$${stats.totalGross.toFixed(2)}`}
          subtitle={`${payrolls.length} payrolls`}
          icon={<DollarIcon />}
          color="bg-green-100 text-green-600"
        />
        <SummaryCard
          title="Total Deductions"
          value={`$${stats.totalDeductions.toFixed(2)}`}
          subtitle="All taxes & benefits"
          icon={<MinusIcon />}
          color="bg-red-100 text-red-600"
        />
        <SummaryCard
          title="Total Net Pay"
          value={`$${stats.totalNet.toFixed(2)}`}
          subtitle="After deductions"
          icon={<CheckIcon />}
          color="bg-blue-100 text-blue-600"
        />
        <SummaryCard
          title="Pending Approval"
          value={stats.pending}
          subtitle={`${stats.approved} approved, ${stats.paid} paid`}
          icon={<ClockIcon />}
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* Payroll Summary by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PayrollStatusChart stats={stats} />
        <RecentPayments payrolls={payrolls.slice(0, 5)} />
      </div>
    </div>
  )
}

// ========================================
// PROCESS PAYROLL (Finance only)
// ========================================
function ProcessPayroll({ staffList, onProcess }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Process Individual Payroll</h3>
        <p className="text-sm text-slate-500 mt-1">Select staff to process payroll for current period</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => (
            <div key={staff.id} className="border border-slate-200 rounded-lg p-4 hover:border-teal-500 transition">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(staff.user?.full_name || 'Staff')}&background=14b8a6&color=fff`}
                  alt={staff.user?.full_name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-medium text-slate-800">{staff.user?.full_name}</div>
                  <div className="text-xs text-slate-500">{staff.license_number || 'N/A'}</div>
                </div>
              </div>
              <button
                onClick={() => onProcess(staff.id)}
                className="w-full px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition"
              >
                Process Payroll
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ========================================
// PAYROLL REPORTS (Finance/HR)
// ========================================
function PayrollReports({ payrolls, onApprove, onMarkPaid, isFinance }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">All Staff Payments</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Staff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gross</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Taxes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Net</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              {isFinance && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payrolls.map((payroll) => (
              <tr key={payroll.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-700">
                  Staff ID: {payroll.staff_id}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {formatDateRange(payroll.pay_period_start, payroll.pay_period_end)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{payroll.hours_worked}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">${payroll.gross_pay?.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="text-xs space-y-0.5">
                    <div>Fed: ${payroll.federal_tax?.toFixed(2)}</div>
                    <div>State: ${payroll.state_provincial_tax?.toFixed(2)}</div>
                    <div>SS: ${payroll.social_security_tax?.toFixed(2)}</div>
                    <div>Med: ${payroll.medicare_tax?.toFixed(2)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-green-600">${payroll.net_pay?.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">
                  <StatusBadge status={payroll.status} />
                </td>
                {isFinance && (
                  <td className="px-6 py-4 text-sm space-x-2">
                    {payroll.status === 'pending' && (
                      <button
                        onClick={() => onApprove(payroll.id)}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Approve
                      </button>
                    )}
                    {payroll.status === 'approved' && (
                      <button
                        onClick={() => onMarkPaid(payroll.id)}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ========================================
// STAFF CONFIGURATION (Finance only)
// ========================================
function StaffConfiguration({ staffList }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Staff Salary Configuration</h3>
        <p className="text-sm text-slate-500 mt-1">Manage hourly rates and salary settings</p>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Staff configuration UI - Coming soon</p>
        <p className="text-sm text-slate-500 mt-2">
          This will allow you to set hourly rates, expected hours, overtime rules, and benefits for each staff member.
        </p>
      </div>
    </div>
  )
}

// ========================================
// HELPER COMPONENTS
// ========================================
function TaxBreakdown({ payroll }) {
  const taxDetails = payroll.tax_calculation_details || {}
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Tax Breakdown (Current Period)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Earnings</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Regular Hours ({taxDetails.regular_hours || 0}h)</span>
              <span className="font-medium">${taxDetails.regular_pay?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Overtime Hours ({taxDetails.overtime_hours || 0}h)</span>
              <span className="font-medium">${taxDetails.overtime_pay?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Gross Pay</span>
              <span>${payroll.gross_pay?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Deductions</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Federal Tax</span>
              <span className="text-red-600">-${payroll.federal_tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">State/Provincial Tax</span>
              <span className="text-red-600">-${payroll.state_provincial_tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Social Security/CPP</span>
              <span className="text-red-600">-${payroll.social_security_tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Medicare/EI</span>
              <span className="text-red-600">-${payroll.medicare_tax?.toFixed(2)}</span>
            </div>
            {payroll.other_deductions > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Other Deductions</span>
                <span className="text-red-600">-${payroll.other_deductions?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold text-red-600">
              <span>Total Deductions</span>
              <span>-${payroll.total_deductions?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold text-green-600 text-lg">
              <span>Net Pay</span>
              <span>${payroll.net_pay?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500 mb-1">{title}</div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function PayrollStatusChart({ stats }) {
  const total = stats.pending + stats.approved + stats.paid
  const pendingPct = total > 0 ? (stats.pending / total) * 100 : 0
  const approvedPct = total > 0 ? (stats.approved / total) * 100 : 0
  const paidPct = total > 0 ? (stats.paid / total) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Payroll Status Distribution</h3>
      <div className="space-y-4">
        <StatusBar label="Pending" count={stats.pending} percentage={pendingPct} color="bg-yellow-500" />
        <StatusBar label="Approved" count={stats.approved} percentage={approvedPct} color="bg-blue-500" />
        <StatusBar label="Paid" count={stats.paid} percentage={paidPct} color="bg-green-500" />
      </div>
    </div>
  )
}

function StatusBar({ label, count, percentage, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-700">{label}</span>
        <span className="font-medium text-slate-800">{count} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function RecentPayments({ payrolls }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Payments</h3>
      <div className="space-y-3">
        {payrolls.length === 0 ? (
          <p className="text-sm text-slate-500">No recent payments</p>
        ) : (
          payrolls.map((payroll) => (
            <div key={payroll.id} className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <div className="text-sm font-medium text-slate-800">Staff ID: {payroll.staff_id}</div>
                <div className="text-xs text-slate-500">{formatDateRange(payroll.pay_period_start, payroll.pay_period_end)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">${payroll.net_pay?.toFixed(2)}</div>
                <StatusBadge status={payroll.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700'
  }
  
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.toUpperCase() || 'UNKNOWN'}
    </span>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
        active
          ? 'border-teal-600 text-teal-600'
          : 'border-transparent text-slate-600 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>
  )
}

// Helper functions
function formatDateRange(start, end) {
  if (!start || !end) return 'N/A'
  const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startDate} - ${endDate}`
}

// Icons
function DollarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ProcessIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

