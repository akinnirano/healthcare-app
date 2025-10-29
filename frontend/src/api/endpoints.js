export const ENDPOINTS = {
  users: {
    create: '/users',
    getById: (id) => `/users/${id}`,
    list: '/users',
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
  },
  roles: {
    create: '/roles',
    getById: (id) => `/roles/${id}`,
    list: '/roles',
    update: (id) => `/roles/${id}`,
    delete: (id) => `/roles/${id}`,
  },
  staff: {
    create: '/staff',
    getById: (id) => `/staff/${id}`,
    list: '/staff',
    update: (id) => `/staff/${id}`,
    delete: (id) => `/staff/${id}`,
  },
  patients: {
    create: '/patients',
    getById: (id) => `/patients/${id}`,
    list: '/patients',
    update: (id) => `/patients/${id}`,
    delete: (id) => `/patients/${id}`,
  },
  serviceRequests: {
    create: '/service_requests',
    getById: (id) => `/service_requests/${id}`,
    list: '/service_requests',
    update: (id) => `/service_requests/${id}`,
    delete: (id) => `/service_requests/${id}`,
  },
  assignments: {
    create: '/assignments',
    getById: (id) => `/assignments/${id}`,
    list: '/assignments',
    update: (id) => `/assignments/${id}`,
    delete: (id) => `/assignments/${id}`,
  },
  shifts: {
    start: '/shifts',
    end: (shiftId) => `/shifts/${shiftId}/end`,
  },
  timesheets: {
    create: '/timesheets',
    getById: (id) => `/timesheets/${id}`,
  },
  payroll: {
    create: '/payroll',
    getById: (id) => `/payroll/${id}`,
    update: (id) => `/payroll/${id}`,
  },
  invoices: {
    create: '/invoices',
    getById: (id) => `/invoices/${id}`,
    update: (id) => `/invoices/${id}`,
  },
  compliance: {
    create: '/compliance',
    getById: (id) => `/compliance/${id}`,
    update: (id) => `/compliance/${id}`,
  },
  visits: {
    create: '/visits',
    getById: (id) => `/visits/${id}`,
    update: (id) => `/visits/${id}`,
  },
  feedback: {
    create: '/feedback',
    getById: (id) => `/feedback/${id}`,
  },
  operations: {
    assignStaff: '/operations/assign_staff',
    startShift: '/operations/start_shift',
    endShift: '/operations/end_shift',
    submitTimesheet: '/operations/submit_timesheet',
    processPayroll: '/operations/process_payroll',
    verifyCompliance: '/operations/verify_compliance',
    todayVisits: '/operations/today_visits',
    completeVisit: '/operations/complete_visit',
  },
}

export default ENDPOINTS
