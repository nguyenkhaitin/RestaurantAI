import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Calendar, Clock, ChevronLeft, ChevronRight,
  LayoutDashboard, MapPin, Users, CalendarDays, ClipboardCheck, DollarSign,
  Building2, Loader2, X, Filter
} from 'lucide-react';

// ==========================================
// TYPESCRIPT INTERFACES - THEO API CONTRACT
// ==========================================

interface Branch {
  id: number;
  name: string;
  address: string;
  managerName: string;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  phone: string;
  status: string;
  avatar: string;
  branchName?: string;
}

interface Shift {
  id: number;
  staffId: number;
  staffName: string;
  day: string;
  shift: string;
  time: string;
}

interface Attendance {
  staffName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  totalHours: string;
  trang_thai_checkin: string;
}

interface Payroll {
  id: number;
  staffName: string;
  workDays: number;
  baseSalary: number;
  bonus: number;
  totalSalary: number;
}

interface HRManagementProps {
  activeSubModule?: string;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function HRManagement({ activeSubModule = 'dashboard' }: HRManagementProps) {
  // State cho dữ liệu từ API
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [payrollData, setPayrollData] = useState<Payroll[]>([]);
  
  // State cho UI
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State cho Staff filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  
  // State cho Modal (Locations CRUD)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    managerId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho Modal (Staff CRUD)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffModalMode, setStaffModalMode] = useState<'add' | 'edit'>('add');
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: '',
    phone: '',
    status: 'Đang làm',
    branchId: ''
  });
  const [isStaffSubmitting, setIsStaffSubmitting] = useState(false);

  // State cho Roster Module
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [rosterAssignments, setRosterAssignments] = useState<any[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(today.setDate(diff));
  });
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{shiftId: number, date: string} | null>(null);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '', endTime: '', maxCapacity: 3 });
  const [assignmentBranchFilter, setAssignmentBranchFilter] = useState('');
  const [isShiftSubmitting, setIsShiftSubmitting] = useState(false);

  // State cho Attendance/Timesheet Module (Merged)
  const [timesheetData, setTimesheetData] = useState<any[]>([]);
  const [timePeriod, setTimePeriod] = useState<'month' | 'week' | 'today'>('month');
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [attendanceBranchFilter, setAttendanceBranchFilter] = useState('');
  const [showAttendanceFilter, setShowAttendanceFilter] = useState(false);
  const [selectedAttendanceCell, setSelectedAttendanceCell] = useState<{staffId: number, staffName: string, date: string, data: any} | null>(null);

  // State cho Payroll Module
  const [payrollSheetData, setPayrollSheetData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [payrollSearchQuery, setPayrollSearchQuery] = useState('');
  const [payrollBranchFilter, setPayrollBranchFilter] = useState('');
  const [showPayrollFilter, setShowPayrollFilter] = useState(false);
  const [isPayrollConfigModalOpen, setIsPayrollConfigModalOpen] = useState(false);
  const [payrollConfigForm, setPayrollConfigForm] = useState({
    staffId: '',
    type: 'THEO_GIO' as 'THEO_GIO' | 'THEO_THANG',
    amount: ''
  });
  const [isPayrollConfigSubmitting, setIsPayrollConfigSubmitting] = useState(false);

  // ==========================================
  // FETCH DỮ LIỆU TỪ API - SONG SONG
  // ==========================================
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
       // Cấu hình header để vượt qua cảnh báo của Ngrok
        const requestOptions = {
            headers: {
                "ngrok-skip-browser-warning": "69420",
                "Content-Type": "application/json"
            }
        };

        const [branchesRes, staffRes, attendanceRes] = await Promise.all([
            fetch('http://127.0.0.1:8000/api/branches', requestOptions),
            fetch('http://127.0.0.1:8000/api/staff', requestOptions),
            fetch('http://127.0.0.1:8000/api/attendance', requestOptions)
        ]);
        const [branchesData, staffData, attendanceDataRes] = await Promise.all([
          branchesRes.json(),
          staffRes.json(),
          attendanceRes.json()
        ]);

        setBranches(branchesData);
        setStaffList(staffData);
        setAttendanceData(attendanceDataRes);
      } catch (error) {
        console.error('Lỗi khi fetch dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // ==========================================
  // FETCH STAFF WITH FILTERS
  // ==========================================
  useEffect(() => {
    const fetchFilteredStaff = async () => {
      try {
        // Build query params
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (roleFilter) params.append('role', roleFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (branchFilter) params.append('branchId', branchFilter);

        const queryString = params.toString();
        const url = `http://127.0.0.1:8000/api/staff${queryString ? '?' + queryString : ''}`;

        const response = await fetch(url, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();
        setStaffList(data);
      } catch (error) {
        console.error('Lỗi khi fetch staff:', error);
      }
    };

    // Only fetch when activeSubModule is 'staff' to avoid unnecessary calls
    if (activeSubModule === 'staff') {
      fetchFilteredStaff();
    }
  }, [searchQuery, roleFilter, statusFilter, branchFilter, activeSubModule]);

  // ==========================================
  // FETCH ROSTER DATA (Shift Templates + Assignments)
  // ==========================================
  useEffect(() => {
    const fetchRosterData = async () => {
      if (activeSubModule !== 'roster') return;
      
      try {
        const requestOptions = {
          headers: {
            "ngrok-skip-browser-warning": "69420",
            "Content-Type": "application/json"
          }
        };

        // Fetch shift templates
        const templatesRes = await fetch('http://127.0.0.1:8000/api/shift-templates', requestOptions);
        const templatesData = await templatesRes.json();
        setShiftTemplates(templatesData);

        // Fetch roster assignments for current week
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const startStr = currentWeekStart.toISOString().split('T')[0];
        const endStr = weekEnd.toISOString().split('T')[0];
        
        const rosterRes = await fetch(
          `http://127.0.0.1:8000/api/roster?start_date=${startStr}&end_date=${endStr}`,
          requestOptions
        );
        const rosterData = await rosterRes.json();
        setRosterAssignments(rosterData);
      } catch (error) {
        console.error('Lỗi khi fetch roster data:', error);
      }
    };

    fetchRosterData();
  }, [activeSubModule, currentWeekStart]);

  // ==========================================
  // FETCH ATTENDANCE/TIMESHEET DATA (Merged)
  // ==========================================
  useEffect(() => {
    const fetchTimesheetData = async () => {
      if (activeSubModule !== 'attendance') return;
      
      try {
        // Calculate date range based on time period
        const today = new Date();
        let startDate: Date;
        let endDate: Date = new Date(today);
        
        if (timePeriod === 'today') {
          startDate = new Date(today);
        } else if (timePeriod === 'week') {
          // Get Monday of this week
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          startDate = new Date(today);
          startDate.setDate(diff);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
        } else { // month
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        
        const params = new URLSearchParams();
        params.append('start_date', startDate.toISOString().split('T')[0]);
        params.append('end_date', endDate.toISOString().split('T')[0]);
        
        if (attendanceSearchQuery) params.append('search', attendanceSearchQuery);
        if (attendanceBranchFilter) params.append('branch_id', attendanceBranchFilter);
        
        const response = await fetch(
          `http://127.0.0.1:8000/api/timesheet?${params.toString()}`,
          {
            headers: {
              'ngrok-skip-browser-warning': '69420',
              'Content-Type': 'application/json'
            }
          }
        );
        
        const data = await response.json();
        setTimesheetData(data);
      } catch (error) {
        console.error('Lỗi khi fetch timesheet data:', error);
      }
    };
    
    fetchTimesheetData();
  }, [activeSubModule, timePeriod, attendanceSearchQuery, attendanceBranchFilter]);

  // ==========================================
  // FETCH PAYROLL SHEET DATA
  // ==========================================
  useEffect(() => {
    const fetchPayrollSheet = async () => {
      if (activeSubModule !== 'payroll') return;
      
      try {
        const params = new URLSearchParams();
        params.append('month', selectedMonth.toString());
        params.append('year', selectedYear.toString());
        if (payrollSearchQuery) params.append('search', payrollSearchQuery);
        if (payrollBranchFilter) params.append('branch_id', payrollBranchFilter);
        
        const response = await fetch(
          `http://127.0.0.1:8000/api/payroll-sheet?${params.toString()}`,
          {
            headers: {
              'ngrok-skip-browser-warning': '69420',
              'Content-Type': 'application/json'
            }
          }
        );
        
        const data = await response.json();
        setPayrollSheetData(data);
      } catch (error) {
        console.error('Lỗi khi fetch payroll sheet:', error);
      }
    };
    
    fetchPayrollSheet();
  }, [activeSubModule, selectedMonth, selectedYear, payrollSearchQuery, payrollBranchFilter]);

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const weekDays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'quản trị':
      case 'admin': 
        return 'bg-primary text-white';
      case 'quản lý':
      case 'manager': 
        return 'bg-accent text-white';
      case 'nhân viên':
      case 'staff': 
        return 'bg-secondary text-white';
      default: 
        return 'bg-gray-500 text-white';
    }
  };

  const getShiftsByDayAndTime = (day: string, shiftType: string) => {
    return shifts.filter(shift => 
      shift.day === day && shift.shift.toLowerCase() === shiftType.toLowerCase()
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  // Filter staff với role "Quản lý" cho Manager dropdown
  const managerList = staffList.filter(staff => 
    staff.role.toLowerCase() === 'quản lý' || staff.role.toLowerCase() === 'manager'
  );

  // ==========================================
  // ROSTER UTILITY FUNCTIONS
  // ==========================================
  
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Attendance/Timesheet utility functions
  const getAttendanceDateRange = () => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date(today);
    
    if (timePeriod === 'today') {
      return [today];
    } else if (timePeriod === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today);
      startDate.setDate(diff);
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
      return dates;
    } else { // month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const dates = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
      return dates;
    }
  };
  
  const formatAttendanceDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const getAttendanceCellData = (staffId: number, dateStr: string) => {
    const staff = timesheetData.find(s => s.staffId === staffId);
    if (!staff || !staff.attendance) return null;
    return staff.attendance[dateStr] || null;
  };

  const formatDateDisplay = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const getAssignmentsForCell = (shiftId: number, date: string) => {
    return rosterAssignments.filter(
      a => a.shiftTemplateId === shiftId && a.date === date
    );
  };

  const getAvailableStaff = (date: string) => {
    // Exclude staff already assigned to ANY shift on this date
    const assignedStaffIds = rosterAssignments
      .filter(a => a.date === date)
      .map(a => a.staffId);
    
    let available = staffList.filter(s => !assignedStaffIds.includes(s.id));
    
    // Filter by branch if selected
    if (assignmentBranchFilter) {
      const branch = branches.find(b => b.id.toString() === assignmentBranchFilter);
      if (branch) {
        available = available.filter(s => s.branchName === branch.name);
      }
    }
    
    return available;
  };

  // ==========================================
  // CRUD HANDLERS - LOCATIONS MODULE
  // ==========================================
  
  const openAddModal = () => {
    setModalMode('add');
    setBranchForm({ name: '', address: '', managerId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setModalMode('edit');
    setEditingBranchId(branch.id);
    // Tìm managerId từ managerName
    const manager = staffList.find(s => s.name === branch.managerName);
    setBranchForm({
      name: branch.name,
      address: branch.address,
      managerId: manager ? manager.id.toString() : ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBranchForm({ name: '', address: '', managerId: '' });
    setEditingBranchId(null);
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - Manager is now optional
    if (!branchForm.name.trim() || !branchForm.address.trim()) {
      alert('Vui lòng điền tên chi nhánh và địa chỉ!');
      return;
    }

    setIsSubmitting(true);

    try {
      if (modalMode === 'add') {
        // POST request
        const response = await fetch('http://127.0.0.1:8000/api/branches', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '69420'
          },
          body: JSON.stringify({
            name: branchForm.name.trim(),
            address: branchForm.address.trim(),
            managerId: branchForm.managerId ? parseInt(branchForm.managerId) : null
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Backend trả về data đầy đủ
          setBranches([...branches, result.data]);
          closeModal();
          alert(result.message || 'Thêm chi nhánh thành công!');
        } else {
          alert(result.detail || result.message || 'Lỗi khi thêm chi nhánh!');
        }
      } else {
        // PUT request
        const response = await fetch(`http://127.0.0.1:8000/api/branches/${editingBranchId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '69420'
          },
          body: JSON.stringify({
            name: branchForm.name.trim(),
            address: branchForm.address.trim(),
            managerId: branchForm.managerId ? parseInt(branchForm.managerId) : null
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Cập nhật state với data từ backend
          setBranches(branches.map(b => 
            b.id === editingBranchId ? result.data : b
          ));
          closeModal();
          alert(result.message || 'Cập nhật chi nhánh thành công!');
        } else {
          alert(result.detail || result.message || 'Lỗi khi cập nhật chi nhánh!');
        }
      }
    } catch (error) {
      console.error('Lỗi khi gửi request:', error);
      alert('Có lỗi xảy ra khi kết nối đến server!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async (branchId: number) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;

    if (!window.confirm(`Bạn có chắc muốn xóa chi nhánh "${branch.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': '69420'
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setBranches(branches.filter(b => b.id !== branchId));
        alert(result.message || 'Xóa chi nhánh thành công!');
      } else {
        alert(result.detail || result.message || 'Lỗi khi xóa chi nhánh!');
      }
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      alert('Có lỗi xảy ra khi kết nối đến server!');
    }
  };

  // ==========================================
  // CRUD HANDLERS - STAFF PROFILE MODULE
  // ==========================================
  
  const openAddStaffModal = () => {
    setStaffModalMode('add');
    setStaffForm({ 
      name: '', 
      role: '', 
      phone: '', 
      status: 'Đang làm',
      branchId: '' 
    });
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (staff: Staff) => {
    setStaffModalMode('edit');
    setEditingStaffId(staff.id);
    // Tìm branchId từ branchName
    const branch = branches.find(b => b.name === staff.branchName);
    setStaffForm({
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
      status: staff.status,
      branchId: branch ? branch.id.toString() : ''
    });
    setIsStaffModalOpen(true);
  };

  const closeStaffModal = () => {
    setIsStaffModalOpen(false);
    setStaffForm({ 
      name: '', 
      role: '', 
      phone: '', 
      status: 'Đang làm',
      branchId: '' 
    });
    setEditingStaffId(null);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - All fields except branchId required
    if (!staffForm.name.trim() || !staffForm.role.trim() || !staffForm.phone.trim() || !staffForm.status) {
      alert('Vui lòng điền đầy đủ: Họ tên, Chức vụ, Số điện thoại và Trạng thái!');
      return;
    }

    setIsStaffSubmitting(true);

    try {
      if (staffModalMode === 'add') {
        // POST request
        const response = await fetch('http://127.0.0.1:8000/api/staff', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '69420'
          },
          body: JSON.stringify({
            name: staffForm.name.trim(),
            role: staffForm.role.trim(),
            phone: staffForm.phone.trim(),
            status: staffForm.status,
            branchId: staffForm.branchId ? parseInt(staffForm.branchId) : null
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Backend returns full data with branchName
          setStaffList([...staffList, result.data]);
          closeStaffModal();
          alert(result.message || 'Thêm nhân viên thành công!');
        } else {
          alert(result.detail || result.message || 'Lỗi khi thêm nhân viên!');
        }
      } else {
        // PUT request
        const response = await fetch(`http://127.0.0.1:8000/api/staff/${editingStaffId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '69420'
          },
          body: JSON.stringify({
            name: staffForm.name.trim(),
            role: staffForm.role.trim(),
            phone: staffForm.phone.trim(),
            status: staffForm.status,
            branchId: staffForm.branchId ? parseInt(staffForm.branchId) : null
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Update state with data from backend
          setStaffList(staffList.map(s => 
            s.id === editingStaffId ? result.data : s
          ));
          closeStaffModal();
          alert(result.message || 'Cập nhật nhân viên thành công!');
        } else {
          alert(result.detail || result.message || 'Lỗi khi cập nhật nhân viên!');
        }
      }
    } catch (error) {
      console.error('Lỗi khi gửi request:', error);
      alert('Có lỗi xảy ra khi kết nối đến server!');
    } finally {
      setIsStaffSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;

    if (!window.confirm(`Bạn có chắc muốn xóa nhân viên "${staff.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': '69420'
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStaffList(staffList.filter(s => s.id !== staffId));
        alert(result.message || 'Xóa nhân viên thành công!');
      } else {
        alert(result.detail || result.message || 'Lỗi khi xóa nhân viên!');
      }
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      alert('Có lỗi xảy ra khi kết nối đến server!');
    }
  };

  // ==========================================
  // ROSTER HANDLERS
  // ==========================================
  
  const goToThisWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    setCurrentWeekStart(monday);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const openShiftModal = () => {
    setShiftForm({ name: '', startTime: '', endTime: '', maxCapacity: 3 });
    setIsShiftModalOpen(true);
  };

  const closeShiftModal = () => {
    setIsShiftModalOpen(false);
    setShiftForm({ name: '', startTime: '', endTime: '', maxCapacity: 3 });
  };

  const handleCreateShiftTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    if (shiftForm.maxCapacity < 1) {
      alert('Số lượng tối đa phải ít nhất là 1!');
      return;
    }

    setIsShiftSubmitting(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/shift-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420'
        },
        body: JSON.stringify({
          name: shiftForm.name,
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          maxCapacity: shiftForm.maxCapacity
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShiftTemplates([...shiftTemplates, result.data]);
        closeShiftModal();
        alert(result.message || 'Tạo ca làm thành công!');
      } else {
        alert(result.detail || result.message || 'Lỗi khi tạo ca làm!');
      }
    } catch (error) {
      console.error('Lỗi khi tạo shift template:', error);
      alert('Có lỗi xảy ra khi kết nối đến server!');
    } finally {
      setIsShiftSubmitting(false);
    }
  };

  const openAssignModal = (shiftId: number, date: string) => {
    setSelectedCell({ shiftId, date });
    setAssignmentBranchFilter('');
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedCell(null);
    setAssignmentBranchFilter('');
  };

  const handleAssignShift = async (staffId: number) => {
    if (!selectedCell) return;

    try {
      const branchId = assignmentBranchFilter ? parseInt(assignmentBranchFilter) : null;

      const response = await fetch('http://127.0.0.1:8000/api/assign-shift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420'
        },
        body: JSON.stringify({
          staffId: staffId,
          shiftTemplateId: selectedCell.shiftId,
          date: selectedCell.date,
          branchId: branchId
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRosterAssignments([...rosterAssignments, result.data]);
        closeAssignModal();
        alert(result.message || 'Phân công ca thành công!');
      } else {
        alert(result.detail || result.message || 'Lỗi khi phân công ca!');
      }
    } catch (error) {
      console.error('Lỗi khi assign shift:', error);
      alert('Có lỗi xảy ra khi kết nối đến server!');
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa phân công này?')) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/roster/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': '69420'
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRosterAssignments(rosterAssignments.filter(a => a.id !== assignmentId));
        alert(result.message || 'Xóa phân công thành công!');
      } else {
        alert(result.detail || result.message || 'Lỗi khi xóa phân công!');
      }
    } catch (error) {
      console.error('Lỗi khi xóa assignment:', error);
      alert('Có lỗi xảy ra khi kết nối đến server!');
    }
  };

  // ==========================================
  // PAYROLL HANDLERS
  // ==========================================
  
  const openPayrollConfigModal = () => {
    setPayrollConfigForm({
      staffId: '',
      type: 'THEO_GIO',
      amount: ''
    });
    setIsPayrollConfigModalOpen(true);
  };

  const closePayrollConfigModal = () => {
    setIsPayrollConfigModalOpen(false);
    setPayrollConfigForm({
      staffId: '',
      type: 'THEO_GIO',
      amount: ''
    });
  };

  const handlePayrollConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payrollConfigForm.staffId || !payrollConfigForm.amount) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const amount = parseFloat(payrollConfigForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Số tiền phải lớn hơn 0!');
      return;
    }

    setIsPayrollConfigSubmitting(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/payroll-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420'
        },
        body: JSON.stringify({
          staffId: parseInt(payrollConfigForm.staffId),
          type: payrollConfigForm.type,
          amount: amount
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        closePayrollConfigModal();
        alert(result.message || 'Thiết lập lương thành công!');
        // Refresh payroll sheet
        const params = new URLSearchParams();
        params.append('month', selectedMonth.toString());
        params.append('year', selectedYear.toString());
        if (payrollSearchQuery) params.append('search', payrollSearchQuery);
        if (payrollBranchFilter) params.append('branch_id', payrollBranchFilter);
        
        const refreshResponse = await fetch(
          `http://127.0.0.1:8000/api/payroll-sheet?${params.toString()}`,
          {
            headers: {
              'ngrok-skip-browser-warning': '69420',
              'Content-Type': 'application/json'
            }
          }
        );
        const refreshData = await refreshResponse.json();
        setPayrollSheetData(refreshData);
      } else {
        alert(result.detail || result.message || 'Lỗi khi thiết lập lương!');
      }
    } catch (error) {
      console.error('Lỗi khi thiết lập lương:', error);
      alert('Có lỗi xảy ra khi kết nối đến server!');
    } finally {
      setIsPayrollConfigSubmitting(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={48} />
        <span className="ml-3 text-lg text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-6">
      
      {/* ==========================================
          MODULE 1: DASHBOARD
      ========================================== */}
      {activeSubModule === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-text-secondary">Tổng quan thống kê nhân sự</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng nhân viên</p>
                  <p className="text-2xl font-bold text-primary">{staffList.length}</p>
                </div>
                <Users size={32} className="text-primary" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chi nhánh</p>
                  <p className="text-2xl font-bold text-accent">{branches.length}</p>
                </div>
                <Building2 size={32} className="text-accent" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ca làm việc</p>
                  <p className="text-2xl font-bold text-secondary">{shifts.length}</p>
                </div>
                <CalendarDays size={32} className="text-secondary" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng lương tháng</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(payrollData.reduce((sum, p) => sum + p.totalSalary, 0))}
                  </p>
                </div>
                <DollarSign size={32} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-12 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <LayoutDashboard size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Dashboard chi tiết</h3>
            <p className="text-gray-400">(Biểu đồ và phân tích sẽ được cập nhật)</p>
          </div>
        </div>
      )}

      {/* ==========================================
          MODULE 2: CHI NHÁNH (BRANCHES)
      ========================================== */}
      {activeSubModule === 'locations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Chi nhánh</h1>
              <p className="text-text-secondary">Quản lý danh sách chi nhánh</p>
            </div>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              Thêm chi nhánh
            </button>
          </div>

          <div className="bg-white rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">ID</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Tên chi nhánh</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Địa chỉ</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Quản lý</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        Chưa có chi nhánh nào
                      </td>
                    </tr>
                  ) : (
                    branches.map((branch) => (
                      <tr key={branch.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6 text-text-secondary">{branch.id}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Building2 size={18} className="text-primary" />
                            <span className="font-medium">{branch.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-text-secondary">{branch.address}</td>
                        <td className="py-4 px-6">{branch.managerName}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openEditModal(branch)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} className="text-text-secondary" />
                            </button>
                            <button 
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} className="text-alert" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal for Add/Edit Branch */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold">
                    {modalMode === 'add' ? 'Thêm chi nhánh mới' : 'Chỉnh sửa chi nhánh'}
                  </h2>
                  <button 
                    onClick={closeModal}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body - Form */}
                <form onSubmit={handleBranchSubmit} className="p-6 space-y-4">
                  {/* Branch Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên chi nhánh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={branchForm.name}
                      onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      placeholder="Nhập tên chi nhánh"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={branchForm.address}
                      onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                      placeholder="Nhập địa chỉ chi nhánh"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Manager Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quản lý
                    </label>
                    <select
                      value={branchForm.managerId}
                      onChange={(e) => setBranchForm({ ...branchForm, managerId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">-- Chưa có quản lý --</option>
                      {managerList.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                    {managerList.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Chưa có nhân viên với vai trò "Quản lý"
                      </p>
                    )}
                  </div>

                  {/* Modal Footer - Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <span>{modalMode === 'add' ? 'Thêm mới' : 'Cập nhật'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ==========================================
          MODULE 3: HỒ SƠ NHÂN VIÊN (STAFF)
      ========================================== */}
      {activeSubModule === 'staff' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Hồ sơ nhân viên</h1>
              <p className="text-text-secondary">Quản lý thông tin nhân viên</p>
            </div>
            <button 
              onClick={openAddStaffModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              Thêm nhân viên
            </button>
          </div>

          <div className="bg-white rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
            {/* Search and Filter Section */}
            <div className="p-6 border-b space-y-3">
              {/* Top Bar: Search + Filter Button */}
              <div className="flex items-center gap-4">
                {/* Search Input - Left Side */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                
                {/* Filter Toggle Button - Right Side */}
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    showFilter 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Filter size={18} />
                  <span className="font-medium">Bộ lọc</span>
                  {(roleFilter || statusFilter || branchFilter) && (
                    <span className="ml-1 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                      {[roleFilter, statusFilter, branchFilter].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Secondary Bar: Filter Dropdowns (Collapsible) */}
              {showFilter && (
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t">
                  {/* Branch Filter */}
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  >
                    <option value="">Tất cả chi nhánh</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>

                  {/* Role Filter */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  >
                    <option value="">Tất cả vai trò</option>
                    <option value="Quản lý">Quản lý</option>
                    <option value="Nhân viên">Nhân viên</option>
                    <option value="Admin">Admin</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="Đang làm">Đang làm</option>
                    <option value="Nghỉ việc">Nghỉ việc</option>
                  </select>

                  {/* Clear Filters Button */}
                  {(roleFilter || statusFilter || branchFilter) && (
                    <button
                      onClick={() => {
                        setRoleFilter('');
                        setStatusFilter('');
                        setBranchFilter('');
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Staff Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Nhân viên</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Vai trò</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Số điện thoại</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Chi nhánh</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Trạng thái</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        {searchQuery || roleFilter || statusFilter || branchFilter
                          ? 'Không tìm thấy nhân viên'
                          : 'Chưa có nhân viên nào'}
                      </td>
                    </tr>
                  ) : (
                    staffList.map((staff) => (
                      <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-semibold">
                              {staff.avatar}
                            </div>
                            <span className="font-medium">{staff.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(staff.role)}`}>
                            {staff.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-text-secondary">{staff.phone}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <MapPin size={14} className="text-gray-400"/>
                                {staff.branchName}
                            </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 ${
                            staff.status.toLowerCase().includes('đang') ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              staff.status.toLowerCase().includes('đang') ? 'bg-green-600' : 'bg-gray-400'
                            }`}></div>
                            {staff.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openEditStaffModal(staff)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} className="text-text-secondary" />
                            </button>
                            <button 
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} className="text-alert" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal for Add/Edit Staff */}
          {isStaffModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold">
                    {staffModalMode === 'add' ? 'Thêm nhân viên mới' : 'Chỉnh sửa nhân viên'}
                  </h2>
                  <button 
                    onClick={closeStaffModal}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body - Form */}
                <form onSubmit={handleStaffSubmit} className="p-6 space-y-4">
                  {/* Staff Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="Nhập họ và tên nhân viên"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chức vụ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="">-- Chọn chức vụ --</option>
                      <option value="Quản trị">Quản trị</option>
                      <option value="Quản lý">Quản lý</option>
                      <option value="Nhân viên">Nhân viên</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      placeholder="Nhập số điện thoại"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={staffForm.status}
                      onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="Đang làm">Đang làm</option>
                      <option value="Nghỉ việc">Nghỉ việc</option>
                    </select>
                  </div>

                  {/* Branch Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chi nhánh
                    </label>
                    <select
                      value={staffForm.branchId}
                      onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">-- Chưa phân công chi nhánh --</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeStaffModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isStaffSubmitting}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={isStaffSubmitting}
                    >
                      {isStaffSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <span>{staffModalMode === 'add' ? 'Thêm mới' : 'Cập nhật'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODULE 4: XẾP LỊCH LÀM VIỆC (ROSTER)
      ========================================== */}
      {activeSubModule === 'roster' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Xếp lịch làm việc</h1>
              <p className="text-text-secondary">Phân ca cho nhân viên</p>
            </div>
            <button 
              onClick={openShiftModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              Quản lý ca làm
            </button>
          </div>

          {/* Week Navigation */}
          <div className="bg-white p-4 rounded-lg flex items-center justify-between" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              <span>
                Tuần từ {formatDateDisplay(getWeekDates()[0])} - {formatDateDisplay(getWeekDates()[6])}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={goToPreviousWeek}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={goToThisWeek}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tuần này
              </button>
              <button 
                onClick={goToNextWeek}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Dynamic Roster Matrix */}
          <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 text-sm text-text-secondary min-w-[120px]">Ca làm việc</th>
                    {getWeekDates().map((date, idx) => (
                      <th key={idx} className="text-center py-4 px-4 text-sm text-text-secondary min-w-[140px]">
                        {weekDays[idx]}
                        <div className="text-xs font-normal text-gray-400">{formatDateDisplay(date)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shiftTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <Clock size={48} className="mx-auto mb-2 opacity-30" />
                        <p>Chưa có ca làm việc nào.</p>
                        <p className="text-sm">Nhấn "Quản lý ca làm" để thêm ca mới.</p>
                      </td>
                    </tr>
                  ) : (
                    shiftTemplates.map((shift) => (
                      <tr key={shift.id} className="border-b border-gray-100">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-primary" />
                            <div>
                              <div className="font-medium">{shift.name}</div>
                              <div className="text-xs text-text-secondary">
                                {shift.startTime}-{shift.endTime}
                              </div>
                            </div>
                          </div>
                        </td>
                        {getWeekDates().map((date, dayIdx) => {
                          const dateStr = formatDate(date);
                          const assignments = getAssignmentsForCell(shift.id, dateStr);
                          const slots = Array(shift.maxCapacity).fill(null).map((_, i) => assignments[i] || null);
                          
                          return (
                            <td key={dayIdx} className="py-4 px-4">
                              <div className="space-y-1">
                                {slots.map((assignment, slotIndex) => (
                                  <div key={slotIndex}>
                                    {assignment ? (
                                      <div className="group relative p-2 bg-blue-50 border border-blue-200 rounded text-xs text-center hover:bg-blue-100 transition-colors">
                                        <div className="font-medium text-blue-900">{assignment.staffName}</div>
                                        <div className="text-[10px] text-blue-700">
                                          {assignment.branchName}
                                        </div>
                                        <button
                                          onClick={() => handleRemoveAssignment(assignment.id)}
                                          className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => openAssignModal(shift.id, dateStr)}
                                        className="w-full p-2 border border-dashed border-gray-200 rounded text-xs text-center text-gray-400 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                                      >
                                        + Thêm
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Hướng dẫn:</strong> Mỗi ca có số slot động dựa trên "Số lượng tối đa". 
              Click "+ Thêm" để phân công nhân viên. Hover vào slot đã có người để xóa.
            </p>
          </div>

          {/* Modal: Shift Template Management */}
          {isShiftModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                  <h2 className="text-xl font-bold">Quản lý ca làm việc</h2>
                  <button 
                    onClick={closeShiftModal}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Existing Shift Templates Table */}
                  {shiftTemplates.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Danh sách ca hiện có</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-2 px-4 text-sm">Tên ca</th>
                              <th className="text-left py-2 px-4 text-sm">Giờ</th>
                              <th className="text-left py-2 px-4 text-sm">Số lượng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shiftTemplates.map((shift) => (
                              <tr key={shift.id} className="border-t">
                                <td className="py-2 px-4">{shift.name}</td>
                                <td className="py-2 px-4 text-sm text-gray-600">
                                  {shift.startTime} - {shift.endTime}
                                </td>
                                <td className="py-2 px-4 text-sm text-gray-600">
                                  {shift.maxCapacity} slot
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Add New Shift Form */}
                  <div>
                    <h3 className="font-semibold mb-3">Thêm ca mới</h3>
                    <form onSubmit={handleCreateShiftTemplate} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Tên ca <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shiftForm.name}
                          onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                          placeholder="VD: Ca Sáng, Ca Tối"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Giờ bắt đầu <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={shiftForm.startTime}
                            onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Giờ kết thúc <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={shiftForm.endTime}
                            onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Số lượng tối đa <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={shiftForm.maxCapacity}
                          onChange={(e) => setShiftForm({ ...shiftForm, maxCapacity: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Số slot hiển thị trong bảng lịch</p>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={closeShiftModal}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={isShiftSubmitting}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isShiftSubmitting ? 'Đang tạo...' : 'Tạo ca làm'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Assign Staff to Shift */}
          {isAssignModalOpen && selectedCell && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold">Phân công nhân viên</h2>
                  <button 
                    onClick={closeAssignModal}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  {/* Shift info */}
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p><strong>Ca làm:</strong> {shiftTemplates.find(s => s.id === selectedCell.shiftId)?.name}</p>
                    <p><strong>Ngày:</strong> {selectedCell.date}</p>
                  </div>

                  {/* Branch Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Lọc theo chi nhánh</label>
                    <select
                      value={assignmentBranchFilter}
                      onChange={(e) => setAssignmentBranchFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Tất cả chi nhánh</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Available Staff List */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Chọn nhân viên ({getAvailableStaff(selectedCell.date).length} khả dụng)
                    </label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {getAvailableStaff(selectedCell.date).length === 0 ? (
                        <p className="text-center text-gray-400 py-4">
                          Không có nhân viên khả dụng cho ngày này
                        </p>
                      ) : (
                        getAvailableStaff(selectedCell.date).map((staff) => (
                          <button
                            key={staff.id}
                            onClick={() => handleAssignShift(staff.id)}
                            className="w-full p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                                {staff.avatar}
                              </div>
                              <div>
                                <div className="font-medium">{staff.name}</div>
                                <div className="text-xs text-gray-500">
                                  {staff.role} • {staff.branchName || 'Chưa phân bổ'}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODULE 5: CHẤM CÔNG (ATTENDANCE) - MATRIX TIMESHEET
      ========================================== */}
      {activeSubModule === 'attendance' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Bảng Chấm Công</h1>
              <p className="text-text-secondary">Theo dõi giờ làm việc của nhân viên theo thời gian</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              {/* Time Period Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Thời gian:</label>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setTimePeriod('today')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timePeriod === 'today'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={() => setTimePeriod('week')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timePeriod === 'week'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tuần này
                  </button>
                  <button
                    onClick={() => setTimePeriod('month')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timePeriod === 'month'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tháng này
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhân viên..."
                    value={attendanceSearchQuery}
                    onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowAttendanceFilter(!showAttendanceFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showAttendanceFilter
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                Bộ lọc
              </button>
            </div>

            {/* Filter Panel */}
            {showAttendanceFilter && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chi nhánh
                    </label>
                    <select
                      value={attendanceBranchFilter}
                      onChange={(e) => setAttendanceBranchFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Tất cả chi nhánh</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timesheet Matrix Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {/* Sticky Column: Staff Info */}
                    <th className="sticky left-0 z-10 bg-gray-50 text-left py-4 px-6 text-sm font-semibold text-gray-700 border-r border-gray-200">
                      Nhân viên
                    </th>
                    {/* Total Hours Column */}
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700 border-r border-gray-200 bg-blue-50">
                      Tổng công
                    </th>
                    {/* Date Columns */}
                    {getAttendanceDateRange().map((date) => {
                      const dateStr = formatAttendanceDate(date);
                      const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                      const dayNum = date.getDate();
                      const monthNum = date.getMonth() + 1;
                      
                      return (
                        <th key={dateStr} className="text-center py-4 px-4 text-xs text-gray-700 min-w-[80px]">
                          <div className="font-medium">{dayName}</div>
                          <div className="text-gray-500">{dayNum}/{monthNum}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {timesheetData.length === 0 ? (
                    <tr>
                      <td colSpan={getAttendanceDateRange().length + 2} className="text-center py-12 text-gray-500">
                        <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-2" />
                        <p>Không có dữ liệu chấm công</p>
                      </td>
                    </tr>
                  ) : (
                    timesheetData.map((staff) => (
                      <tr key={staff.staffId} className="border-b border-gray-100 hover:bg-gray-50">
                        {/* Sticky Column: Staff Info */}
                        <td className="sticky left-0 z-10 bg-white py-4 px-6 border-r border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                              {staff.avatar}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{staff.staffName}</div>
                              <div className="text-xs text-gray-500">{staff.role} • {staff.branchName}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Total Hours */}
                        <td className="text-center py-4 px-6 border-r border-gray-200 bg-blue-50">
                          <div className="font-bold text-lg text-primary">
                            {staff.totalHours}h
                          </div>
                        </td>
                        
                        {/* Date Cells */}
                        {getAttendanceDateRange().map((date) => {
                          const dateStr = formatAttendanceDate(date);
                          const cellData = getAttendanceCellData(staff.staffId, dateStr);
                          
                          if (!cellData) {
                            // No attendance data
                            return (
                              <td key={dateStr} className="text-center py-4 px-4">
                                <span className="text-gray-300">-</span>
                              </td>
                            );
                          }
                          
                          // Has attendance data
                          const hours = cellData.hours;
                          const isLowHours = hours < 8;
                          
                          return (
                            <td key={dateStr} className="text-center py-4 px-4">
                              <button
                                onClick={() => setSelectedAttendanceCell({ 
                                  staffId: staff.staffId, 
                                  staffName: staff.staffName,
                                  date: dateStr, 
                                  data: cellData 
                                })}
                                className={`font-bold transition-all ${
                                  isLowHours
                                    ? 'text-red-500 hover:text-red-700'
                                    : 'text-gray-900 hover:text-primary'
                                }`}
                              >
                                {hours}h
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Hướng dẫn:</strong> Màu <span className="text-red-500 font-bold">đỏ</span> = dưới 8 tiếng. Màu <span className="text-gray-900 font-bold">đen</span> = đủ 8 tiếng trở lên. Click vào số giờ để xem chi tiết giờ vào/ra.
            </p>
          </div>

          {/* Detail Popup */}
          {selectedAttendanceCell && (
            <div 
              className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
              onClick={() => setSelectedAttendanceCell(null)}
            >
              <div 
                className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Chi tiết chấm công</h3>
                  <button
                    onClick={() => setSelectedAttendanceCell(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Staff Name */}
                  <div className="pb-2 border-b border-gray-200">
                    <div className="text-sm text-gray-500">Nhân viên</div>
                    <div className="font-semibold text-gray-900">{selectedAttendanceCell.staffName}</div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="text-primary" size={18} />
                    <span className="font-medium">Ngày:</span>
                    <span className="text-gray-600">
                      {new Date(selectedAttendanceCell.date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {/* Check-in */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="text-green-600" size={18} />
                    <span className="font-medium">Giờ vào:</span>
                    <span className="text-gray-600 font-semibold text-lg">{selectedAttendanceCell.data.in}</span>
                  </div>
                  
                  {/* Check-out */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="text-red-600" size={18} />
                    <span className="font-medium">Giờ ra:</span>
                    <span className="text-gray-600 font-semibold text-lg">{selectedAttendanceCell.data.out}</span>
                  </div>
                  
                  {/* Total Hours */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Tổng thời gian:</span>
                      <span className={`text-2xl font-bold ${
                        selectedAttendanceCell.data.hours < 8 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {selectedAttendanceCell.data.hours} tiếng
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODULE 6: BẢNG LƯƠNG (PAYROLL)
      ========================================== */}
      {activeSubModule === 'payroll' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Bảng lương</h1>
              <p className="text-text-secondary">Quản lý lương nhân viên theo tháng</p>
            </div>
            <button 
              onClick={openPayrollConfigModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              Thiết lập lương
            </button>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              {/* Month/Year Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Tháng:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>Tháng {month}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Năm:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhân viên..."
                    value={payrollSearchQuery}
                    onChange={(e) => setPayrollSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowPayrollFilter(!showPayrollFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showPayrollFilter
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                Bộ lọc
              </button>
            </div>

            {/* Filter Panel */}
            {showPayrollFilter && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Chi nhánh:</label>
                  <select
                    value={payrollBranchFilter}
                    onChange={(e) => setPayrollBranchFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Tất cả chi nhánh</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                  
                  {payrollBranchFilter && (
                    <button
                      onClick={() => setPayrollBranchFilter('')}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nhân viên</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vai trò</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Chi nhánh</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Loại lương</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Mức cơ bản</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Tổng giờ</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 bg-green-50">Tổng thực nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollSheetData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <Users size={48} className="mx-auto mb-3 text-gray-300" />
                        <p>Không có dữ liệu lương cho tháng này</p>
                      </td>
                    </tr>
                  ) : (
                    payrollSheetData.map((staff) => {
                      const getSalaryTypeBadge = (type: string) => {
                        if (type === 'Theo giờ') {
                          return 'bg-blue-100 text-blue-700';
                        } else if (type === 'Theo tháng') {
                          return 'bg-purple-100 text-purple-700';
                        } else {
                          return 'bg-gray-100 text-gray-700';
                        }
                      };

                      return (
                        <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{staff.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(staff.role)}`}>
                              {staff.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {staff.branchName}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getSalaryTypeBadge(staff.salaryType)}`}>
                              {staff.salaryType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                            {staff.salaryType === 'Theo giờ' 
                              ? `${formatCurrency(staff.baseAmount)}/giờ`
                              : staff.salaryType === 'Theo tháng'
                                ? formatCurrency(staff.baseAmount)
                                : '-'
                            }
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {staff.totalHours > 0 ? `${staff.totalHours}h` : '-'}
                          </td>
                          <td className="px-6 py-4 text-right bg-green-50">
                            <span className="text-base font-bold text-green-600">
                              {staff.finalSalary > 0 ? formatCurrency(staff.finalSalary) : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {payrollSheetData.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={5} className="px-6 py-4 text-right text-gray-700">Tổng cộng:</td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {payrollSheetData.reduce((sum, s) => sum + s.totalHours, 0).toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 text-right bg-green-100">
                        <span className="text-lg font-bold text-green-700">
                          {formatCurrency(payrollSheetData.reduce((sum, s) => sum + s.finalSalary, 0))}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Công thức:</strong> Lương theo giờ = Tổng giờ × Mức lương/giờ. Lương theo tháng = Mức lương cố định (không phụ thuộc giờ làm).
            </p>
          </div>

          {/* Modal: Payroll Config */}
          {isPayrollConfigModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold">Thiết lập lương</h2>
                  <button 
                    onClick={closePayrollConfigModal}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePayrollConfigSubmit} className="p-6 space-y-4">
                  {/* Staff Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhân viên <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={payrollConfigForm.staffId}
                      onChange={(e) => setPayrollConfigForm({ ...payrollConfigForm, staffId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Salary Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại lương <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={payrollConfigForm.type}
                      onChange={(e) => setPayrollConfigForm({ 
                        ...payrollConfigForm, 
                        type: e.target.value as 'THEO_GIO' | 'THEO_THANG' 
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="THEO_GIO">Lương theo giờ</option>
                      <option value="THEO_THANG">Lương theo tháng (Cố định)</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {payrollConfigForm.type === 'THEO_GIO' ? 'Mức lương/giờ (VNĐ)' : 'Mức lương tháng (VNĐ)'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={payrollConfigForm.amount}
                      onChange={(e) => setPayrollConfigForm({ ...payrollConfigForm, amount: e.target.value })}
                      placeholder={payrollConfigForm.type === 'THEO_GIO' ? 'Ví dụ: 25000' : 'Ví dụ: 5000000'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      min="1"
                      step="1000"
                      required
                    />
                    {payrollConfigForm.amount && !isNaN(parseFloat(payrollConfigForm.amount)) && (
                      <p className="mt-1 text-xs text-gray-500">
                        ≈ {formatCurrency(parseFloat(payrollConfigForm.amount))}
                      </p>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closePayrollConfigModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isPayrollConfigSubmitting}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={isPayrollConfigSubmitting}
                    >
                      {isPayrollConfigSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        'Lưu'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}