# 📋 ROSTER MODULE - HƯỚNG DẪN SỬ DỤNG

## 🎯 **Tóm tắt thay đổi**

### ✅ **Backend (main.py)**
- ✅ Thêm 2 Pydantic models: `ShiftTemplateCreate`, `ShiftAssignment`
- ✅ Thêm 5 API endpoints mới:
  - `GET /api/shift-templates` - Lấy danh sách cấu hình ca
  - `POST /api/shift-templates` - Tạo ca mới (có validation time overlap)
  - `DELETE /api/shift-templates/{id}` - Xóa ca (chỉ khi chưa có ai được phân công)
  - `GET /api/roster?start_date=...&end_date=...` - Lấy lịch làm việc theo tuần
  - `POST /api/assign-shift` - Phân công nhân viên (có validation capacity + double-booking)
  - `DELETE /api/roster/{id}` - Xóa phân công

### ✅ **Frontend (HRManagement.tsx)**
- ✅ Thêm 8 state variables cho roster module
- ✅ Thêm 2 useEffect: fetch shift templates + roster assignments theo tuần
- ✅ Thêm 5 utility functions: getWeekDates, formatDate, getAssignmentsForCell, getAvailableStaff
- ✅ Thêm 7 handlers: week navigation (Prev/This Week/Next), shift template CRUD, staff assignment
- ✅ UI hoàn toàn mới:
  - **Dynamic roster matrix** (số slot thay đổi theo maxCapacity)
  - **Week navigation bar** với hiển thị ngày tháng động
  - **Shift management modal** (danh sách + form thêm mới)
  - **Staff assignment modal** (lọc theo chi nhánh + hiển thị nhân viên khả dụng)

### ✅ **Database (migrate_roster.sql)**
- ✅ Tạo bảng `cau_hinh_ca` với các cột: ten_ca, gio_bat_dau, gio_ket_thuc, so_luong_max
- ✅ Tạo lại bảng `lich_lam_viec` với UNIQUE constraint: (nhan_vien_id, ngay_lam, ca_lam_id)
- ✅ INSERT 3 ca mẫu: Ca Sáng (06:00-14:00), Ca Chiều (14:00-22:00), Ca Tối (18:00-02:00)
- ✅ Tạo 4 indexes cho performance

---

## 🚀 **Cách chạy**

### **Bước 1: Chạy Migration Script**
```bash
# Windows PowerShell
psql -U postgres -d postgres -p 5433 -f backend/migrate_roster.sql

# Hoặc chạy thủ công trong pgAdmin/DBeaver
```

### **Bước 2: Restart Backend Server**
```bash
cd backend
python main.py
```

### **Bước 3: Test Frontend**
1. Mở trình duyệt: http://localhost:3001/RestaurantAI/
2. Navigate: **Quản lý nhân sự** → **Xếp lịch làm việc**
3. Click **"Quản lý ca làm"** để tạo ca mới hoặc xem danh sách ca hiện có
4. Click **"+ Thêm"** trong bất kỳ ô nào để phân công nhân viên
5. Hover vào slot đã có người → Click nút **X** để xóa

---

## 📊 **Logic nghiệp vụ**

### **1. Dynamic Slot Rendering (Số slot động)**
```typescript
// Frontend tự động render số slot dựa trên maxCapacity của từng ca
const slots = Array(shift.maxCapacity).fill(null).map((_, i) => assignments[i] || null);

// VD: Ca Sáng có maxCapacity = 3 → Hiển thị 3 slots
// VD: Ca Tối có maxCapacity = 2 → Hiển thị 2 slots
```

### **2. Double-Booking Prevention (Chặn trùng lịch)**
```python
# Backend kiểm tra: 1 nhân viên chỉ làm 1 ca trong 1 ngày
cursor.execute("""
    SELECT id FROM lich_lam_viec 
    WHERE nhan_vien_id = %s AND ngay_lam = %s
""", (staffId, date))

if cursor.fetchone():
    raise HTTPException(400, "Staff is already assigned to a shift on this date")
```

```sql
-- Database constraint level
CONSTRAINT unique_assignment UNIQUE (nhan_vien_id, ngay_lam, ca_lam_id)
```

### **3. Capacity Validation (Giới hạn số người)**
```python
# Backend đếm số người đã được phân công vào ca
cursor.execute("""
    SELECT COUNT(*) as count FROM lich_lam_viec 
    WHERE ca_lam_id = %s AND ngay_lam = %s
""", (shiftId, date))

if count >= shift_template['so_luong_max']:
    raise HTTPException(400, "Shift has reached maximum capacity")
```

### **4. Time Overlap Check (Kiểm tra giờ trùng)**
```python
# Backend kiểm tra khi tạo ca mới
cursor.execute("""
    SELECT id, ten_ca FROM cau_hinh_ca
    WHERE (gio_bat_dau, gio_ket_thuc) OVERLAPS (%s::time, %s::time)
""", (startTime, endTime))
```

### **5. Available Staff Filter (Lọc nhân viên khả dụng)**
```typescript
// Frontend exclude nhân viên đã được phân công vào BẤT KỲ ca nào trong ngày đó
const getAvailableStaff = (date: string) => {
  const assignedStaffIds = rosterAssignments
    .filter(a => a.date === date)
    .map(a => a.staffId);
  
  return staffList.filter(s => !assignedStaffIds.includes(s.id));
};
```

### **6. Week Navigation Logic (Tính tuần bắt đầu từ Thứ 2)**
```typescript
const today = new Date();
const day = today.getDay();
const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
const monday = new Date(today.setDate(diff));
```

---

## 🔍 **Testing Checklist**

### **Backend API Testing (Postman/curl)**
```bash
# 1. Get shift templates
curl http://127.0.0.1:8000/api/shift-templates

# 2. Create shift template
curl -X POST http://127.0.0.1:8000/api/shift-templates \
  -H "Content-Type: application/json" \
  -d '{"name": "Ca Test", "startTime": "08:00", "endTime": "16:00", "maxCapacity": 2}'

# 3. Get roster for week (example: Dec 28 - Jan 3)
curl "http://127.0.0.1:8000/api/roster?start_date=2025-12-28&end_date=2026-01-03"

# 4. Assign shift
curl -X POST http://127.0.0.1:8000/api/assign-shift \
  -H "Content-Type: application/json" \
  -d '{"staffId": 1, "shiftTemplateId": 1, "date": "2025-12-30", "branchId": 1}'

# 5. Delete assignment
curl -X DELETE http://127.0.0.1:8000/api/roster/1
```

### **Frontend UI Testing**
- [ ] Click "Quản lý ca làm" → Modal hiển thị danh sách ca + form thêm mới
- [ ] Tạo ca mới với thời gian hợp lệ → Ca xuất hiện trong bảng
- [ ] Tạo ca với thời gian trùng → Hiển thị lỗi "Time overlaps..."
- [ ] Click "Tuần này" → Tuần hiện tại được highlight
- [ ] Click "◀" / "▶" → Tuần trước/sau load đúng data
- [ ] Click "+ Thêm" → Modal phân công hiển thị đúng nhân viên khả dụng
- [ ] Chọn nhân viên → Slot hiển thị avatar + tên + chi nhánh
- [ ] Hover vào slot đã có người → Nút X xuất hiện
- [ ] Click X → Xác nhận xóa → Slot trở về trạng thái trống
- [ ] Phân công 1 nhân viên vào 2 ca cùng ngày → Lỗi "already assigned"
- [ ] Phân công quá số lượng maxCapacity → Lỗi "reached maximum capacity"

---

## 🐛 **Troubleshooting**

### **Lỗi: "Connection refused" khi fetch API**
**Nguyên nhân:** Backend server chưa chạy  
**Giải pháp:** 
```bash
cd backend
python main.py
```

### **Lỗi: "relation 'cau_hinh_ca' does not exist"**
**Nguyên nhân:** Chưa chạy migration script  
**Giải pháp:** 
```bash
psql -U postgres -d postgres -p 5433 -f backend/migrate_roster.sql
```

### **Lỗi: "Time overlaps with existing shift"**
**Nguyên nhân:** Backend validation chặn ca trùng giờ  
**Giải pháp:** Đây là hành vi đúng - chọn khoảng thời gian khác

### **Lỗi: "Staff is already assigned to a shift on this date"**
**Nguyên nhân:** 1 nhân viên chỉ làm 1 ca/ngày  
**Giải pháp:** Xóa phân công cũ trước khi gán ca mới

### **Lỗi: "Shift has reached maximum capacity"**
**Nguyên nhân:** Số người đã đủ theo maxCapacity  
**Giải pháp:** Xóa phân công cũ hoặc tăng maxCapacity của ca

### **Lỗi: Matrix không hiển thị data**
**Nguyên nhân:** 
1. Chưa có shift templates trong database
2. Tuần đang xem không có assignments

**Giải pháp:** 
1. Click "Quản lý ca làm" → Tạo ca mới
2. Click "Tuần này" để về tuần hiện tại

---

## 📈 **Performance Tips**

### **Database Indexes**
Migration script đã tạo 4 indexes:
- `idx_lich_lam_viec_ngay_lam` - Tìm kiếm theo ngày
- `idx_lich_lam_viec_ca_lam_id` - Tìm kiếm theo ca
- `idx_lich_lam_viec_nhan_vien_id` - Tìm kiếm theo nhân viên
- `idx_lich_lam_viec_composite` - Tìm kiếm kết hợp (ca + ngày)

### **Frontend Optimization**
- Chỉ fetch roster data khi `activeSubModule === 'roster'`
- Chỉ re-fetch khi `currentWeekStart` thay đổi
- Filter staff locally (không gọi API mỗi lần chọn chi nhánh)

---

## 🎨 **UI/UX Features**

### **Color Coding**
- **Blue slots:** Nhân viên đã được phân công
- **Dashed border:** Slot trống (click để thêm)
- **Hover effect:** Nút X xuất hiện khi hover vào slot đã có người

### **Responsive Design**
- Table có horizontal scroll trên mobile
- Modal responsive với max-height và vertical scroll
- Sticky header trong shift management modal

### **User Feedback**
- Loading state khi submit form
- Alert messages cho success/error
- Confirmation dialog trước khi xóa
- Badge counter trong branch filter

---

## 📝 **Sample Data**

### **Shift Templates**
```sql
INSERT INTO cau_hinh_ca (ten_ca, gio_bat_dau, gio_ket_thuc, so_luong_max) VALUES
    ('Ca Sáng', '06:00', '14:00', 3),
    ('Ca Chiều', '14:00', '22:00', 3),
    ('Ca Tối', '18:00', '02:00', 2);
```

### **Sample Assignments (test data)**
```sql
-- Giả sử bạn có staff IDs: 1, 2, 3
-- Giả sử bạn có branch IDs: 1, 2
INSERT INTO lich_lam_viec (nhan_vien_id, ca_lam_id, ngay_lam, chi_nhanh_id) VALUES
    (1, 1, '2025-12-30', 1),  -- Staff 1 → Ca Sáng → Dec 30 → Branch 1
    (2, 1, '2025-12-30', 1),  -- Staff 2 → Ca Sáng → Dec 30 → Branch 1
    (3, 2, '2025-12-30', 2),  -- Staff 3 → Ca Chiều → Dec 30 → Branch 2
    (1, 1, '2025-12-31', NULL),  -- Staff 1 → Ca Sáng → Dec 31 → No Branch
    (2, 2, '2025-12-31', 2);  -- Staff 2 → Ca Chiều → Dec 31 → Branch 2
```

---

## 🔐 **Security Notes**

### **Input Validation**
- ✅ Backend validates all input fields (name, time, capacity)
- ✅ Frontend validates before sending request
- ✅ SQL injection prevented by parameterized queries

### **Business Logic Validation**
- ✅ Time overlap check prevents conflicting shifts
- ✅ Capacity check prevents overbooking
- ✅ Double-booking check prevents staff conflicts
- ✅ Foreign key constraints ensure data integrity

### **Error Handling**
- ✅ All API endpoints have try-catch blocks
- ✅ Database rollback on error
- ✅ User-friendly error messages
- ✅ Console logging for debugging

---

## 🚧 **Future Enhancements**

### **Phase 2 Features**
- [ ] Drag & drop để reassign nhân viên
- [ ] Bulk assignment (phân công nhiều người cùng lúc)
- [ ] Copy lịch tuần trước
- [ ] Export roster to Excel/PDF
- [ ] Email notification khi được phân công ca
- [ ] Shift swap requests (nhân viên đổi ca)
- [ ] Overtime tracking
- [ ] Break time management

### **UI Improvements**
- [ ] Color coding theo chi nhánh
- [ ] Timeline view option (thay vì table)
- [ ] Calendar integration
- [ ] Mobile app version
- [ ] Dark mode support

---

## 📞 **Support**

### **Common Questions**

**Q: Làm sao để thay đổi số lượng slot của 1 ca?**  
A: Hiện tại chưa có chức năng edit shift template. Cần xóa ca cũ (nếu chưa có ai) và tạo ca mới.

**Q: Có thể phân công 1 nhân viên vào 2 ca cùng ngày không?**  
A: Không. System chặn để tránh overwork. Nếu cần, phải xóa phân công cũ trước.

**Q: Làm sao để xem lịch của 1 nhân viên cụ thể?**  
A: Hiện tại chưa có filter theo nhân viên. Sẽ bổ sung trong phase 2.

**Q: Database bị lỗi constraint violation?**  
A: Kiểm tra UNIQUE constraint. Đảm bảo không trùng (nhan_vien_id, ngay_lam, ca_lam_id).

---

**🎉 MODULE ROSTER HOÀN TẤT - SẴN SÀNG SỬ DỤNG!**
