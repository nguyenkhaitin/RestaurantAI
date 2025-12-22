import { useState } from 'react';
import { TrendingUp, Users, Clock, RefreshCw } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function Analytics() {
  const [dateRange, setDateRange] = useState('week');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [activeReport, setActiveReport] = useState('operations');

  // Mock data
  const kpiData = [
    { label: 'Khách hiện tại', value: '124', icon: Users, color: 'text-occupied', subtext: 'người' },
    { label: 'Thời gian TB/Bàn', value: '55', icon: Clock, color: 'text-accent', subtext: 'phút' },
    { label: 'Lưu lượng khách', value: '+18%', icon: TrendingUp, color: 'text-secondary', subtext: 'so với tuần trước' },
    { label: 'Vòng quay bàn', value: '3.5', icon: RefreshCw, color: 'text-primary', subtext: 'lần/ngày' },
  ];

  const trafficData = [
    { time: '06:00', guests: 12 },
    { time: '08:00', guests: 34 },
    { time: '10:00', guests: 78 },
    { time: '12:00', guests: 124 },
    { time: '14:00', guests: 67 },
    { time: '16:00', guests: 56 },
    { time: '18:00', guests: 156 },
    { time: '20:00', guests: 134 },
    { time: '22:00', guests: 45 },
  ];

  const groupSizeData = [
    { name: 'Đi 1', value: 15, color: '#3498DB' },
    { name: 'Đi đôi', value: 35, color: '#2ECC71' },
    { name: 'Nhóm 4+', value: 50, color: '#F2A03D' },
  ];

  const turnoverLeaderboard = [
    { rank: 1, branch: 'CN Quận 1', turnover: 4.2, status: 'Tốt' },
    { rank: 2, branch: 'CN Quận 3', turnover: 3.8, status: 'Tốt' },
    { rank: 3, branch: 'CN Quận 7', turnover: 3.5, status: 'Trung bình' },
    { rank: 4, branch: 'CN Quận 10', turnover: 3.2, status: 'Cần cải thiện' },
  ];

  const overstayAlerts = [
    { branch: 'CN Quận 1', count: 5, severity: 'Thấp' },
    { branch: 'CN Quận 3', count: 8, severity: 'Trung bình' },
    { branch: 'CN Quận 7', count: 12, severity: 'Cao' },
    { branch: 'CN Quận 10', count: 15, severity: 'Cao' },
  ];

  const lowTrafficBranches = [
    { branch: 'CN Quận 10', traffic: 45, target: 100 },
    { branch: 'CN Cầu Giấy', traffic: 52, target: 100 },
    { branch: 'CN Quận 7', traffic: 68, target: 100 },
  ];

  const hrEfficiency = [
    { hour: '08:00', staff: 8, guests: 34 },
    { hour: '10:00', staff: 10, guests: 78 },
    { hour: '12:00', staff: 15, guests: 124 },
    { hour: '14:00', staff: 12, guests: 67 },
    { hour: '16:00', staff: 10, guests: 56 },
    { hour: '18:00', staff: 18, guests: 156 },
    { hour: '20:00', staff: 16, guests: 134 },
  ];

  // Mock heatmap data
  const heatmapZones = [
    { id: 'A1', heat: 0.9, position: { x: 50, y: 50 } },
    { id: 'A2', heat: 0.8, position: { x: 120, y: 50 } },
    { id: 'A3', heat: 0.6, position: { x: 190, y: 50 } },
    { id: 'B1', heat: 0.7, position: { x: 50, y: 120 } },
    { id: 'B2', heat: 0.95, position: { x: 120, y: 120 } },
    { id: 'B3', heat: 0.4, position: { x: 190, y: 120 } },
    { id: 'C1', heat: 0.3, position: { x: 50, y: 190 } },
    { id: 'C2', heat: 0.5, position: { x: 120, y: 190 } },
    { id: 'C3', heat: 0.85, position: { x: 190, y: 190 } },
  ];

  const getHeatColor = (heat: number) => {
    if (heat > 0.8) return 'bg-alert';
    if (heat > 0.6) return 'bg-accent';
    if (heat > 0.4) return 'bg-reserved';
    return 'bg-occupied';
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'Cao') return 'text-alert';
    if (severity === 'Trung bình') return 'text-accent';
    return 'text-secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Quản trị & Phân tích</h1>
          <p className="text-text-secondary">Thống kê và phân tích hiệu suất realtime</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Chi nhánh: Tất cả</option>
            <option value="d1">CN Quận 1</option>
            <option value="d3">CN Quận 3</option>
            <option value="d7">CN Quận 7</option>
            <option value="d10">CN Quận 10</option>
          </select>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Khu vực: Tất cả</option>
            <option value="main">Sảnh chính</option>
            <option value="vip">Khu VIP</option>
            <option value="floor1">Tầng 1</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="day">Thời gian: Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gray-50 ${kpi.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="text-3xl mb-1">{kpi.value}</div>
              <div className="text-sm mb-1">{kpi.label}</div>
              <div className="text-xs text-text-secondary">{kpi.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Traffic Trend Chart */}
      <div className="bg-white p-6 rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="mb-4">Xu hướng khách</h2>
        <p className="text-sm text-text-secondary mb-4">Lưu lượng khách theo giờ trong ngày</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trafficData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="time" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="guests" 
              stroke="#3498DB" 
              strokeWidth={3}
              dot={{ fill: '#3498DB', r: 5 }}
              activeDot={{ r: 7 }}
              name="Số khách"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Three Leaderboards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Turnover Leaderboard */}
        <div className="bg-white p-6 rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="mb-4">Top Vòng quay bàn</h3>
          <div className="space-y-3">
            {turnoverLeaderboard.map((item) => (
              <div key={item.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.rank === 1 ? 'bg-secondary text-white' : 'bg-gray-200'
                  }`}>
                    {item.rank}
                  </div>
                  <div>
                    <div className="text-sm">{item.branch}</div>
                    <div className="text-xs text-text-secondary">{item.status}</div>
                  </div>
                </div>
                <div className="text-secondary">{item.turnover}x</div>
              </div>
            ))}
          </div>
        </div>

        {/* Overstay Alerts */}
        <div className="bg-white p-6 rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="mb-4">Cảnh báo Overstay</h3>
          <div className="space-y-3">
            {overstayAlerts.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm">{item.branch}</div>
                  <div className={`text-xs ${getSeverityColor(item.severity)}`}>{item.severity}</div>
                </div>
                <div className={`text-xl ${getSeverityColor(item.severity)}`}>{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Traffic Branches */}
        <div className="bg-white p-6 rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="mb-4">Chi nhánh vắng khách</h3>
          <div className="space-y-3">
            {lowTrafficBranches.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">{item.branch}</div>
                  <div className="text-sm text-text-secondary">{item.traffic}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-occupied rounded-full h-2 transition-all"
                    style={{ width: `${item.traffic}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="bg-white rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="border-b">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveReport('operations')}
              className={`py-4 border-b-2 transition-colors ${
                activeReport === 'operations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Báo cáo Vận hành
            </button>
            <button
              onClick={() => setActiveReport('marketing')}
              className={`py-4 border-b-2 transition-colors ${
                activeReport === 'marketing'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Báo cáo Marketing
            </button>
            <button
              onClick={() => setActiveReport('hr')}
              className={`py-4 border-b-2 transition-colors ${
                activeReport === 'hr'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Hiệu quả Nhân sự
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeReport === 'operations' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Heatmap */}
              <div>
                <h3 className="mb-4">Sơ đồ nhiệt vị trí ngồi</h3>
                <p className="text-sm text-text-secondary mb-4">Khu vực phổ biến và ít được chọn</p>
                <div className="relative bg-gray-50 rounded-lg p-8" style={{ height: '300px' }}>
                  {heatmapZones.map((zone) => (
                    <div
                      key={zone.id}
                      className="absolute"
                      style={{ left: `${zone.position.x}px`, top: `${zone.position.y}px` }}
                    >
                      <div
                        className={`w-16 h-16 rounded-lg ${getHeatColor(zone.heat)} flex items-center justify-center text-white transition-all hover:scale-110`}
                        style={{ opacity: 0.3 + zone.heat * 0.7 }}
                      >
                        <span className="text-xs">{zone.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-occupied"></div>
                    <span>Thấp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-reserved"></div>
                    <span>Trung bình</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-accent"></div>
                    <span>Cao</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-alert"></div>
                    <span>Rất cao</span>
                  </div>
                </div>
              </div>

              {/* Group Size */}
              <div>
                <h3 className="mb-4">Quy mô nhóm khách</h3>
                <p className="text-sm text-text-secondary mb-4">Phân bổ theo số lượng khách</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={groupSizeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {groupSizeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {groupSizeData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeReport === 'marketing' && (
            <div>
              <h3 className="mb-4">Phân tích khách hàng</h3>
              <div className="text-center py-12 text-text-secondary">
                <p>Dữ liệu báo cáo marketing đang được phát triển</p>
              </div>
            </div>
          )}

          {activeReport === 'hr' && (
            <div>
              <h3 className="mb-4">Phân tích hiệu quả nhân sự</h3>
              <p className="text-sm text-text-secondary mb-4">So sánh số lượng nhân viên và lưu lượng khách</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hrEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="staff" fill="#1C2A46" name="Nhân viên" />
                  <Bar dataKey="guests" fill="#3498DB" name="Khách" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
