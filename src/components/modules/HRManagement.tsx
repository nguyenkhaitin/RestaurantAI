import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Calendar, Clock, ChevronLeft, ChevronRight,
  LayoutDashboard, MapPin, Users, CalendarDays, ClipboardCheck, DollarSign,
  Building2, Loader2
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

  // ==========================================
  // FETCH DỮ LIỆU TỪ API - SONG SONG
  // ==========================================
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [branchesRes, staffRes, shiftsRes, attendanceRes, payrollRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/branches'),
          fetch('http://127.0.0.1:8000/api/staff'),
          fetch('http://127.0.0.1:8000/api/shifts'),
          fetch('http://127.0.0.1:8000/api/attendance'),
          fetch('http://127.0.0.1:8000/api/payroll')
        ]);

        const [branchesData, staffData, shiftsData, attendanceDataRes, payrollDataRes] = await Promise.all([
          branchesRes.json(),
          staffRes.json(),
          shiftsRes.json(),
          attendanceRes.json(),
          payrollRes.json()
        ]);

        setBranches(branchesData);
        setStaffList(staffData);
        setShifts(shiftsData);
        setAttendanceData(attendanceDataRes);
        setPayrollData(payrollDataRes);
      } catch (error) {
        console.error('Lỗi khi fetch dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

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

  // Filter staff theo search query
  const filteredStaff = staffList.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.phone.includes(searchQuery)
  );

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
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
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
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Edit2 size={16} className="text-text-secondary" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Plus size={18} />
              Thêm nhân viên
            </button>
          </div>

          <div className="bg-white rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
            {/* Search Bar */}
            <div className="p-6 border-b">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
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
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        {searchQuery ? 'Không tìm thấy nhân viên' : 'Chưa có nhân viên nào'}
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => (
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
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Edit2 size={16} className="text-text-secondary" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Plus size={18} />
              Thêm ca làm
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg flex items-center justify-between" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              <span>Tuần từ 16/12 - 22/12/2025</span>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Tuần này
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 text-sm text-text-secondary min-w-[120px]">Ca làm việc</th>
                    {weekDays.map((day) => (
                      <th key={day} className="text-center py-4 px-4 text-sm text-text-secondary min-w-[140px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Morning Shift Row */}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-amber-600" />
                        <div>
                          <div className="font-medium">Ca Sáng</div>
                          <div className="text-xs text-text-secondary">06:00-14:00</div>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const dayShifts = getShiftsByDayAndTime(day, 'sáng');
                      const slots = Array(3).fill(null).map((_, i) => dayShifts[i] || null);
                      
                      return (
                        <td key={day} className="py-4 px-4">
                          <div className="space-y-1">
                            {slots.map((shift, slotIndex) => (
                              <div key={slotIndex}>
                                {shift ? (
                                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-center cursor-move hover:bg-amber-100 transition-colors">
                                    <div className="font-medium text-amber-900">{shift.staffName}</div>
                                    <div className="text-[10px] text-amber-700">{shift.time}</div>
                                  </div>
                                ) : (
                                  <div className="p-2 border border-dashed border-gray-200 rounded text-xs text-center text-gray-400 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors">
                                    + Thêm
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Evening Shift Row */}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-600" />
                        <div>
                          <div className="font-medium">Ca Chiều</div>
                          <div className="text-xs text-text-secondary">14:00-22:00</div>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const dayShifts = getShiftsByDayAndTime(day, 'chiều');
                      const slots = Array(3).fill(null).map((_, i) => dayShifts[i] || null);
                      
                      return (
                        <td key={day} className="py-4 px-4">
                          <div className="space-y-1">
                            {slots.map((shift, slotIndex) => (
                              <div key={slotIndex}>
                                {shift ? (
                                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-center cursor-move hover:bg-blue-100 transition-colors">
                                    <div className="font-medium text-blue-900">{shift.staffName}</div>
                                    <div className="text-[10px] text-blue-700">{shift.time}</div>
                                  </div>
                                ) : (
                                  <div className="p-2 border border-dashed border-gray-200 rounded text-xs text-center text-gray-400 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors">
                                    + Thêm
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              💡 <strong>Mẹo:</strong> Mỗi ca có 3 slots cho nhân viên. Kéo thả thẻ nhân viên để phân công ca (Tính năng drag & drop sẽ được cập nhật).
            </p>
          </div>
        </div>
      )}

      {/* ==========================================
          MODULE 5: CHẤM CÔNG (ATTENDANCE)
      ========================================== */}
      {activeSubModule === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Chấm công</h1>
              <p className="text-text-secondary">Lịch sử check-in và check-out</p>
            </div>
          </div>

          <div className="bg-white rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="p-6 border-b">
              <h2>Bảng chấm công</h2>
              <p className="text-sm text-text-secondary">Theo dõi giờ làm việc của nhân viên</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Tên nhân viên</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Ngày</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Giờ vào</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Giờ ra</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Tổng giờ</th>
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Chưa có dữ liệu chấm công
                      </td>
                    </tr>
                  ) : (
                    attendanceData.map((record, index) => {
                      const isLate = record.trang_thai_checkin?.toLowerCase() === 'trễ';
                      
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <span className="font-medium">{record.staffName}</span>
                          </td>
                          <td className="py-4 px-6 text-text-secondary">{record.date}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className={isLate ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                {record.checkIn}
                              </span>
                              {isLate && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                  Trễ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-text-secondary">{record.checkOut}</td>
                          <td className="py-4 px-6">
                            <span className="font-medium">{record.totalHours}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isLate 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {record.trang_thai_checkin}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Lưu ý:</strong> Nhân viên đi trễ sẽ được đánh dấu màu đỏ và có badge "Trễ".
            </p>
          </div>
        </div>
      )}

      {/* ==========================================
          MODULE 6: BẢNG LƯƠNG (PAYROLL)
      ========================================== */}
      {activeSubModule === 'payroll' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Bảng lương</h1>
              <p className="text-text-secondary">Quản lý lương và thưởng nhân viên</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Plus size={18} />
              Thêm công thức lương
            </button>
          </div>

          <div className="bg-white rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 text-sm text-text-secondary">Tên nhân viên</th>
                    <th className="text-center py-4 px-6 text-sm text-text-secondary">Số công</th>
                    <th className="text-right py-4 px-6 text-sm text-text-secondary">Lương cứng</th>
                    <th className="text-right py-4 px-6 text-sm text-text-secondary">Thưởng</th>
                    <th className="text-right py-4 px-6 text-sm text-text-secondary">Tổng thực nhận</th>
                    <th className="text-center py-4 px-6 text-sm text-text-secondary">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Chưa có dữ liệu lương
                      </td>
                    </tr>
                  ) : (
                    payrollData.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-primary" />
                            <span className="font-medium">{item.staffName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                            {item.workDays} ngày
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-text-secondary">
                          {formatCurrency(item.baseSalary)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-green-600 font-medium">
                            +{formatCurrency(item.bonus)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-lg text-primary">
                            {formatCurrency(item.totalSalary)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Edit2 size={16} className="text-text-secondary" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td colSpan={4} className="py-4 px-6 text-right font-bold text-lg">
                      Tổng cộng chi trả:
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-bold text-2xl text-green-600">
                        {formatCurrency(payrollData.reduce((sum, item) => sum + item.totalSalary, 0))}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Công thức:</strong> Tổng thực nhận = Lương cứng + Thưởng. Số công được tính từ dữ liệu chấm công.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}