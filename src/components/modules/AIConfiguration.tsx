import { useState, useRef } from 'react';
import { Plus, Circle, Square, Minus, MousePointer, Save, Play, Video, Wifi, WifiOff, Trash2 } from 'lucide-react';

interface Camera {
  id: string;
  name: string;
  zone: string;
  rtspUrl: string;
  status: 'online' | 'offline' | 'weak';
  branch: string;
}

interface Zone {
  id: string;
  type: 'table' | 'walkway' | 'ignore' | 'entrance';
  points: { x: number; y: number }[];
  label?: string;
  capacity?: number;
}

export function AIConfiguration() {
  const [selectedBranch, setSelectedBranch] = useState('d1');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [drawingTool, setDrawingTool] = useState<'select' | 'polygon' | 'line' | 'rectangle' | null>('select');
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [showAddCamera, setShowAddCamera] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Mock camera data
  const cameras: Camera[] = [
    { id: '1', name: 'Sảnh chính - Phía trước', zone: 'Sảnh chính', rtspUrl: 'rtsp://camera1.local', status: 'online', branch: 'd1' },
    { id: '2', name: 'Sảnh chính - Phía sau', zone: 'Sảnh chính', rtspUrl: 'rtsp://camera2.local', status: 'online', branch: 'd1' },
    { id: '3', name: 'Khu VIP', zone: 'Khu VIP', rtspUrl: 'rtsp://camera3.local', status: 'weak', branch: 'd1' },
    { id: '4', name: 'Cửa vào chính', zone: 'Lối vào', rtspUrl: 'rtsp://camera4.local', status: 'offline', branch: 'd1' },
  ];

  const branches = [
    { id: 'd1', name: 'CN Quận 1' },
    { id: 'd3', name: 'CN Quận 3' },
    { id: 'd7', name: 'CN Quận 7' },
    { id: 'cg', name: 'CN Cầu Giấy' },
  ];

  // Mock zones for demo
  const demoZones: Zone[] = [
    {
      id: 'zone1',
      type: 'table',
      points: [
        { x: 100, y: 100 },
        { x: 180, y: 100 },
        { x: 180, y: 180 },
        { x: 100, y: 180 },
      ],
      label: 'A1',
      capacity: 4,
    },
    {
      id: 'zone2',
      type: 'table',
      points: [
        { x: 220, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 180 },
        { x: 220, y: 180 },
      ],
      label: 'A2',
      capacity: 6,
    },
    {
      id: 'zone3',
      type: 'entrance',
      points: [
        { x: 400, y: 50 },
        { x: 400, y: 350 },
      ],
      label: 'Đường đếm',
    },
    {
      id: 'zone4',
      type: 'ignore',
      points: [
        { x: 500, y: 100 },
        { x: 600, y: 100 },
        { x: 600, y: 200 },
        { x: 500, y: 200 },
      ],
      label: 'Khu vực thu ngân',
    },
  ];

  const getStatusIcon = (status: Camera['status']) => {
    if (status === 'online') return <Wifi size={16} className="text-secondary" />;
    if (status === 'weak') return <Wifi size={16} className="text-accent" />;
    return <WifiOff size={16} className="text-alert" />;
  };

  const getStatusColor = (status: Camera['status']) => {
    if (status === 'online') return 'bg-secondary';
    if (status === 'weak') return 'bg-accent';
    return 'bg-alert';
  };

  const getStatusLabel = (status: Camera['status']) => {
    if (status === 'online') return 'Trực tuyến';
    if (status === 'weak') return 'Yếu';
    return 'Ngoại tuyến';
  };

  const getZoneColor = (type: Zone['type']) => {
    switch (type) {
      case 'table': return '#2ECC71';
      case 'walkway': return '#3498DB';
      case 'ignore': return '#95A5A6';
      case 'entrance': return '#F2A03D';
    }
  };

  const getZoneTypeLabel = (type: Zone['type']) => {
    switch (type) {
      case 'table': return 'Bàn ăn';
      case 'walkway': return 'Lối đi';
      case 'ignore': return 'Loại trừ';
      case 'entrance': return 'Lối vào/ra';
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || drawingTool === 'select') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingTool === 'polygon') {
      setCurrentPoints([...currentPoints, { x, y }]);
      setIsDrawing(true);
    } else if (drawingTool === 'line' && currentPoints.length < 2) {
      setCurrentPoints([...currentPoints, { x, y }]);
      if (currentPoints.length === 1) {
        finishDrawing('entrance');
      }
    }
  };

  const finishDrawing = (type: Zone['type']) => {
    if (currentPoints.length >= 2) {
      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        type,
        points: [...currentPoints],
        label: type === 'table' ? `Bàn mới` : `${getZoneTypeLabel(type)} mới`,
      };
      setZones([...zones, newZone]);
      setCurrentPoints([]);
      setIsDrawing(false);
      setSelectedZone(newZone);
    }
  };

  const renderZone = (zone: Zone) => {
    if (zone.type === 'entrance' && zone.points.length === 2) {
      const [p1, p2] = zone.points;
      return (
        <g key={zone.id}>
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={getZoneColor(zone.type)}
            strokeWidth="4"
            className="cursor-pointer"
            onClick={() => setSelectedZone(zone)}
          />
          <polygon
            points={`${p2.x},${p2.y} ${p2.x - 10},${p2.y - 10} ${p2.x - 10},${p2.y + 10}`}
            fill={getZoneColor(zone.type)}
          />
          <text
            x={(p1.x + p2.x) / 2}
            y={p1.y - 10}
            fill={getZoneColor(zone.type)}
            fontSize="12"
            className="pointer-events-none"
          >
            {zone.label}
          </text>
        </g>
      );
    } else if (zone.points.length >= 3) {
      const pointsStr = zone.points.map(p => `${p.x},${p.y}`).join(' ');
      const centerX = zone.points.reduce((sum, p) => sum + p.x, 0) / zone.points.length;
      const centerY = zone.points.reduce((sum, p) => sum + p.y, 0) / zone.points.length;

      return (
        <g key={zone.id}>
          <polygon
            points={pointsStr}
            fill={getZoneColor(zone.type)}
            fillOpacity="0.2"
            stroke={getZoneColor(zone.type)}
            strokeWidth="2"
            className="cursor-pointer hover:fill-opacity-30"
            onClick={() => setSelectedZone(zone)}
          />
          <text
            x={centerX}
            y={centerY}
            fill={getZoneColor(zone.type)}
            fontSize="14"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none"
          >
            {zone.label}
          </text>
        </g>
      );
    }
    return null;
  };

  const filteredCameras = cameras.filter(c => c.branch === selectedBranch);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header with Branch Tabs */}
      <div className="bg-white rounded-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="border-b px-6 flex items-center justify-between">
          <div className="flex gap-4">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={`py-4 border-b-2 transition-colors ${
                  selectedBranch === branch.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {branch.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddCamera(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Thêm Camera Mới
          </button>
        </div>

        {/* Camera Grid View */}
        <div className="p-6">
          <h3 className="mb-4">Camera đã kết nối</h3>
          <div className="grid grid-cols-4 gap-4">
            {filteredCameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setSelectedCamera(camera)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCamera?.id === camera.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="aspect-video bg-gray-900 rounded mb-3 flex items-center justify-center">
                  <Video size={32} className="text-white/50" />
                </div>
                <div className="text-left">
                  <div className="text-sm mb-1">{camera.name}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">{camera.zone}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`}></div>
                      {getStatusIcon(camera.status)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      {selectedCamera && (
        <div className="flex gap-6 flex-1">
          <div className="flex-1 bg-white rounded-lg p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2>Vẽ vùng AI</h2>
                <p className="text-sm text-text-secondary">{selectedCamera.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setDrawingTool('select')}
                    className={`p-2 rounded transition-colors ${
                      drawingTool === 'select' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Chọn"
                  >
                    <MousePointer size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setDrawingTool('polygon');
                      setCurrentPoints([]);
                    }}
                    className={`p-2 rounded transition-colors ${
                      drawingTool === 'polygon' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Vẽ đa giác"
                  >
                    <Circle size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setDrawingTool('line');
                      setCurrentPoints([]);
                    }}
                    className={`p-2 rounded transition-colors ${
                      drawingTool === 'line' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Vẽ đường"
                  >
                    <Minus size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setDrawingTool('rectangle');
                      setCurrentPoints([]);
                    }}
                    className={`p-2 rounded transition-colors ${
                      drawingTool === 'rectangle' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Vẽ hình chữ nhật"
                  >
                    <Square size={18} />
                  </button>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Save size={18} />
                  Lưu cấu hình
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors">
                  <Play size={18} />
                  Triển khai AI
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative">
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="relative bg-gray-900 rounded-lg overflow-hidden cursor-crosshair"
                style={{ height: '500px' }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                  <Video size={120} />
                </div>
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-xs flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                  {selectedCamera.name} - Live Preview
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {demoZones.map(renderZone)}
                  {zones.map(renderZone)}

                  {isDrawing && currentPoints.length > 0 && (
                    <g>
                      {currentPoints.map((point, index) => (
                        <circle
                          key={index}
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="#2ECC71"
                        />
                      ))}
                      {currentPoints.length > 1 && (
                        <polyline
                          points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                          stroke="#2ECC71"
                          strokeWidth="2"
                          fill="none"
                        />
                      )}
                    </g>
                  )}
                </svg>

                {isDrawing && drawingTool === 'polygon' && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                    Nhấp để thêm điểm. Nhấp đúp hoặc Enter để hoàn thành.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2ECC71' }}></div>
                  <span>Vùng bàn ăn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F2A03D' }}></div>
                  <span>Đếm vào/ra</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3498DB' }}></div>
                  <span>Lối đi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#95A5A6' }}></div>
                  <span>Loại trừ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Zone Properties Panel */}
          {selectedZone && (
            <div className="w-80 bg-white rounded-lg p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="mb-4">Thuộc tính vùng</h3>
              <div className="space-y-3">
                <div>
                  <label className="block mb-2 text-xs text-text-secondary">Loại vùng</label>
                  <select
                    value={selectedZone.type}
                    onChange={(e) => setSelectedZone({ ...selectedZone, type: e.target.value as Zone['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="table">Bàn ăn</option>
                    <option value="walkway">Lối đi</option>
                    <option value="ignore">Vùng loại trừ</option>
                    <option value="entrance">Lối vào/ra</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-xs text-text-secondary">Nhãn / ID</label>
                  <input
                    type="text"
                    value={selectedZone.label}
                    onChange={(e) => setSelectedZone({ ...selectedZone, label: e.target.value })}
                    placeholder="VD: A1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {selectedZone.type === 'table' && (
                  <div>
                    <label className="block mb-2 text-xs text-text-secondary">Sức chứa (ghế)</label>
                    <input
                      type="number"
                      value={selectedZone.capacity || ''}
                      onChange={(e) => setSelectedZone({ ...selectedZone, capacity: parseInt(e.target.value) })}
                      placeholder="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
                <button
                  onClick={() => {
                    setZones(zones.filter(z => z.id !== selectedZone.id));
                    setSelectedZone(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-alert text-alert rounded-lg hover:bg-alert/5 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Xóa vùng
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Camera Modal */}
      {showAddCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md" style={{ boxShadow: 'var(--shadow-elevated)' }}>
            <div className="p-6 border-b">
              <h2>Thêm Camera Mới</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-text-secondary">Tên Camera</label>
                <input
                  type="text"
                  placeholder="VD: Sảnh chính - Camera 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block mb-2 text-text-secondary">Khu vực</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>Sảnh chính</option>
                  <option>Khu VIP</option>
                  <option>Tầng 1</option>
                  <option>Lối vào</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-text-secondary">RTSP URL</label>
                <input
                  type="text"
                  placeholder="rtsp://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button className="w-full py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors">
                Kiểm tra kết nối
              </button>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowAddCamera(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                Thêm Camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
