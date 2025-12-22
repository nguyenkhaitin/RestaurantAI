import { useState } from 'react';
import { Clock, Users, DollarSign, X, QrCode, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';

interface Table {
  id: string;
  zone: string;
  status: 'empty' | 'occupied' | 'reserved' | 'alert';
  guests?: number;
  duration?: number;
  booking?: {
    name: string;
    phone: string;
    time: string;
    date: string;
  };
  totalAmount?: number;
  position: { x: number; y: number };
}

export function FloorOperations() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeTab, setActiveTab] = useState<'booking' | 'service' | 'payment'>('booking');
  const [showQR, setShowQR] = useState(false);

  // Mock table data
  const tables: Table[] = [
    { id: 'A1', zone: 'Sảnh chính', status: 'empty', position: { x: 50, y: 80 } },
    { id: 'A2', zone: 'Sảnh chính', status: 'occupied', guests: 4, duration: 45, totalAmount: 1250000, position: { x: 150, y: 80 } },
    { id: 'A3', zone: 'Sảnh chính', status: 'reserved', booking: { name: 'Nguyễn Văn A', phone: '0901234567', time: '19:00', date: '2025-12-08' }, position: { x: 250, y: 80 } },
    { id: 'B1', zone: 'Sảnh chính', status: 'empty', position: { x: 50, y: 180 } },
    { id: 'B2', zone: 'Sảnh chính', status: 'occupied', guests: 2, duration: 30, totalAmount: 450000, position: { x: 150, y: 180 } },
    { id: 'B3', zone: 'Sảnh chính', status: 'alert', guests: 5, duration: 95, totalAmount: 1200000, position: { x: 250, y: 180 } },
    { id: 'C1', zone: 'Khu VIP', status: 'empty', position: { x: 400, y: 80 } },
    { id: 'C2', zone: 'Khu VIP', status: 'alert', guests: 0, duration: 25, totalAmount: 0, position: { x: 500, y: 80 } },
    { id: 'C3', zone: 'Khu VIP', status: 'occupied', guests: 6, duration: 60, totalAmount: 2100000, position: { x: 600, y: 80 } },
    { id: 'D1', zone: 'Sảnh chính', status: 'reserved', booking: { name: 'Trần Thị B', phone: '0909876543', time: '18:30', date: '2025-12-08' }, position: { x: 350, y: 80 } },
    { id: 'D2', zone: 'Khu VIP', status: 'empty', position: { x: 700, y: 80 } },
    { id: 'E1', zone: 'Sảnh chính', status: 'occupied', guests: 3, duration: 20, totalAmount: 380000, position: { x: 350, y: 180 } },
  ];

  // Count by status
  const totalGuests = tables.filter(t => t.status === 'occupied' || t.status === 'alert').reduce((sum, t) => sum + (t.guests || 0), 0);
  const occupiedCount = tables.filter(t => t.status === 'occupied' || t.status === 'alert').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;
  const emptyCount = tables.filter(t => t.status === 'empty').length;

  // Mock alerts
  const alerts = [
    { id: 1, type: 'overstay', table: 'B3', message: 'Overstay - Vượt quá 90 phút' },
    { id: 2, type: 'ghost', table: 'C2', message: 'Ghost Table - Không có order' },
    { id: 3, type: 'mismatch', table: 'A2', message: 'Sai lệch số lượng (POS: 3 - AI: 4)' },
  ];

  const getTableColor = (status: Table['status']) => {
    switch (status) {
      case 'empty': return 'bg-white border-gray-300';
      case 'occupied': return 'bg-occupied border-occupied';
      case 'reserved': return 'bg-reserved border-reserved';
      case 'alert': return 'bg-alert border-alert animate-pulse';
    }
  };

  const getStatusLabel = (status: Table['status']) => {
    switch (status) {
      case 'empty': return 'Trống';
      case 'occupied': return 'Đang phục vụ';
      case 'reserved': return 'Đã đặt';
      case 'alert': return 'Cảnh báo';
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Status Bar */}
      <div className="bg-white rounded-lg p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-primary" />
              <span>Tổng khách: <strong>{totalGuests}</strong></span>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>Đang phục vụ: <strong className="text-occupied">{occupiedCount} bàn</strong></div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>Đã đặt: <strong className="text-reserved">{reservedCount} bàn</strong></div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>Bàn trống: <strong className="text-secondary">{emptyCount} bàn</strong></div>
          </div>
          <div className="text-sm text-text-secondary">
            Cập nhật: {new Date().toLocaleTimeString('vi-VN')}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Main Floor Map */}
        <div className="flex-1 bg-white rounded-lg p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2>Sơ đồ bàn trực tiếp</h2>
              <p className="text-text-secondary text-sm">Giám sát trạng thái bàn realtime</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white"></div>
                <span>Trống</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-occupied"></div>
                <span>Đang phục vụ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-reserved"></div>
                <span>Đã đặt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-alert"></div>
                <span>Cảnh báo</span>
              </div>
            </div>
          </div>

          {/* Floor Layout */}
          <div className="relative bg-gray-50 rounded-lg p-8" style={{ minHeight: '500px' }}>
            {/* Zone Labels */}
            <div className="absolute top-4 left-8 text-text-secondary">Sảnh chính</div>
            <div className="absolute top-4 right-8 text-text-secondary">Khu VIP</div>

            {/* Tables */}
            {tables.map((table) => (
              <div
                key={table.id}
                className="group absolute"
                style={{ left: `${table.position.x}px`, top: `${table.position.y}px` }}
              >
                <button
                  onClick={() => setSelectedTable(table)}
                  className={`w-20 h-20 rounded-lg border-2 ${getTableColor(table.status)} flex flex-col items-center justify-center transition-all hover:scale-110 hover:shadow-lg relative ${
                    table.status === 'empty' ? 'text-gray-700' : 'text-white'
                  }`}
                >
                  <span>{table.id}</span>
                  {table.guests && (
                    <span className="text-xs opacity-90">{table.guests} khách</span>
                  )}
                </button>

                {/* Hover Tooltip */}
                <div className="absolute hidden group-hover:block bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap -top-16 left-1/2 -translate-x-1/2 z-10">
                  <div>Bàn {table.id} | {table.guests || 0} Khách</div>
                  {table.duration && <div>Thời gian: {table.duration} phút</div>}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Alerts */}
        <div className="w-80 flex flex-col gap-4">
          {/* Live Alerts */}
          <div className="bg-white rounded-lg p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-alert" />
              <h3>Cảnh báo</h3>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-alert/10 border border-alert/20 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-alert mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm">Bàn {alert.table}</div>
                      <div className="text-xs text-text-secondary">{alert.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="mb-4">Thống kê sàn</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">Tổng số bàn</span>
                <span>{tables.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">Đang phục vụ</span>
                <span className="text-occupied">{occupiedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">Bàn trống</span>
                <span className="text-secondary">{emptyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">Đã đặt trước</span>
                <span className="text-reserved">{reservedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Action Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl" style={{ boxShadow: 'var(--shadow-elevated)' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2>Bàn {selectedTable.id} - {getStatusLabel(selectedTable.status)}</h2>
                <p className="text-sm text-text-secondary">{selectedTable.zone}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTable(null);
                  setShowQR(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {selectedTable.status === 'empty' || selectedTable.status === 'reserved' ? (
                <>
                  <button
                    onClick={() => setActiveTab('booking')}
                    className={`flex-1 py-3 px-4 text-sm transition-colors ${
                      activeTab === 'booking'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Đặt bàn
                  </button>
                  <button
                    onClick={() => setActiveTab('service')}
                    className={`flex-1 py-3 px-4 text-sm transition-colors ${
                      activeTab === 'service'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Bắt đầu phục vụ
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('payment')}
                    className={`flex-1 py-3 px-4 text-sm transition-colors ${
                      activeTab === 'payment'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Thanh toán
                  </button>
                  <button
                    onClick={() => setActiveTab('service')}
                    className={`flex-1 py-3 px-4 text-sm transition-colors ${
                      activeTab === 'service'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Cập nhật thủ công
                  </button>
                </>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'booking' && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-text-secondary">Tên khách hàng</label>
                    <input
                      type="text"
                      defaultValue={selectedTable.booking?.name}
                      placeholder="Nhập tên khách hàng"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-text-secondary">Số điện thoại</label>
                    <input
                      type="tel"
                      defaultValue={selectedTable.booking?.phone}
                      placeholder="0901234567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-text-secondary">Ngày đến</label>
                      <input
                        type="date"
                        defaultValue={selectedTable.booking?.date}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-text-secondary">Giờ đến</label>
                      <input
                        type="time"
                        defaultValue={selectedTable.booking?.time}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-text-secondary">Số lượng khách</label>
                    <input
                      type="number"
                      defaultValue={selectedTable.guests}
                      placeholder="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-text-secondary">Ghi chú</label>
                    <textarea
                      rows={3}
                      placeholder="Yêu cầu đặc biệt..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    ></textarea>
                  </div>
                  <button className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    Xác nhận đặt bàn
                  </button>
                </div>
              )}

              {activeTab === 'service' && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-text-secondary">Loại dịch vụ</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option>Gọi món (A la carte)</option>
                      <option>Buffet tiêu chuẩn</option>
                      <option>Buffet VIP</option>
                      <option>Set menu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-text-secondary">Số lượng khách</label>
                    <input
                      type="number"
                      defaultValue={selectedTable.guests}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div>Đồng hồ tính giờ</div>
                      <div className="text-sm text-text-secondary">Theo dõi thời gian dùng bữa</div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input type="checkbox" className="peer sr-only" defaultChecked />
                      <div className="w-12 h-6 bg-gray-300 peer-checked:bg-secondary rounded-full transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </label>
                  </div>
                  {selectedTable.duration && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Clock size={18} />
                      <span>Thời gian hiện tại: {selectedTable.duration} phút</span>
                    </div>
                  )}
                  <button className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    Bắt đầu phục vụ
                  </button>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="text-sm text-text-secondary mb-1">Tổng hóa đơn tạm tính</div>
                    <div className="text-3xl text-primary mb-4">
                      {selectedTable.totalAmount?.toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-text-secondary" />
                        <span>Số khách: <strong>{selectedTable.guests} người</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-text-secondary" />
                        <span>Thời gian: <strong>{selectedTable.duration} phút</strong></span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-text-secondary">Phương thức thanh toán</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option>Tiền mặt</option>
                      <option>Chuyển khoản</option>
                      <option>Thẻ tín dụng/ghi nợ</option>
                      <option>Ví điện tử</option>
                    </select>
                  </div>

                  {showQR && (
                    <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                      <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center mb-3">
                        <QrCode size={120} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-text-secondary">Quét mã để thanh toán qua mobile banking</p>
                      <p className="text-xs text-text-secondary mt-1">{selectedTable.totalAmount?.toLocaleString('vi-VN')} ₫</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowQR(!showQR)}
                      className="flex items-center justify-center gap-2 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <QrCode size={18} />
                      {showQR ? 'Ẩn' : 'Tạo'} mã QR
                    </button>
                    <button className="py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors">
                      Đóng phiên & Thanh toán
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
