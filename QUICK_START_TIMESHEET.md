# 🚀 QUICK START - Timesheet Module

## ⚡ 5-Minute Setup

### Step 1: Add Sample Attendance Data (Optional)
```powershell
# Connect to PostgreSQL and run sample data script
psql -U postgres -d postgres -p 5433 -f backend/sample_attendance_data.sql
```

### Step 2: Start Backend
```powershell
cd backend
python main.py
```
✅ Backend running at: http://127.0.0.1:8000

### Step 3: Start Frontend
```powershell
# In a new terminal
npm run dev
```
✅ Frontend running at: http://localhost:5173

### Step 4: Navigate to Timesheet
1. Open browser: http://localhost:5173
2. Sidebar → **Tổ chức** (expand if needed)
3. Click **Bảng chấm công**

## 🎯 What You Should See

### Default View (Monthly)
```
┌─────────────────┬──────────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Nhân viên       │ Tổng giờ │ 1/12│ 2/12│ 3/12│ 4/12│ 5/12│ ... │
├─────────────────┼──────────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ Nguyễn Văn A    │   160h   │ 8h  │ 8h  │ 8h  │ 8h  │ 8h  │ ... │
│ (Nhân viên)     │          │ 🟢  │ 🟢  │ 🟢  │ 🟢  │ 🟢  │     │
├─────────────────┼──────────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ Trần Thị B      │   112h   │ 7h  │ 6.8h│ 7h  │ 7h  │ 6.5h│ ... │
│ (Nhân viên)     │          │ 🔴  │ 🔴  │ 🔴  │ 🔴  │ 🔴  │     │
└─────────────────┴──────────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### Color Legend
- 🟢 **Green cells** = ≥8 hours worked
- 🔴 **Red cells** = <8 hours worked (warning)
- ⚪ **Gray dash** = No attendance data (day off)

## 🧪 Interactive Testing Checklist

### ✅ Basic Navigation
- [ ] Click "Tháng này" → Should show ~30 date columns
- [ ] Click "Tuần này" → Should show 7 date columns (Mon-Sun)
- [ ] Click "Hôm nay" → Should show 1 date column
- [ ] Scroll horizontally → Staff column stays sticky

### ✅ Filtering
- [ ] Type staff name in search → Results filter instantly
- [ ] Click "Bộ lọc" → Filter panel opens
- [ ] Select a branch → Only staff from that branch shown
- [ ] Clear filters → All staff appear again

### ✅ Cell Interaction
- [ ] Click a **green cell** (8h) → Popup shows check-in/out times
- [ ] Click a **red cell** (<8h) → Popup shows reduced hours
- [ ] Click outside popup → Popup closes
- [ ] Verify popup shows:
  - ✅ Full date (Vietnamese)
  - ✅ Check-in time (green clock icon)
  - ✅ Check-out time (red clock icon)
  - ✅ Total hours (color-coded)

### ✅ Data Accuracy
- [ ] Staff 1 total hours ≈ 160h (20 days × 8h)
- [ ] Staff 2 total hours ≈ 112h (16 days × 7h)
- [ ] Weekend dates show gray dashes (no attendance)
- [ ] Late arrivals show red cells

## 🔧 Troubleshooting

### Issue: No data showing
**Solution:**
```powershell
# Check if backend is running
curl http://127.0.0.1:8000/api/timesheet

# Check database has attendance data
psql -U postgres -d postgres -p 5433 -c "SELECT COUNT(*) FROM cham_cong;"
```

### Issue: Hours calculation is wrong
**Check:**
- Database `gio_vao` and `gio_ra` format (should be "HH:MM")
- Backend `calculate_work_hours()` function
- Lunch break logic (auto-deducts 1 hour if worked >4h)

### Issue: Cell colors not showing correctly
**Verify:**
- Cells with ≥8h should be green background
- Cells with <8h should be red background
- Empty cells should show gray dash "-"

## 📊 API Test Commands

### Test Backend API Directly
```powershell
# Get December 2025 timesheet
curl "http://127.0.0.1:8000/api/timesheet?start_date=2025-12-01&end_date=2025-12-31"

# Get current week only
curl "http://127.0.0.1:8000/api/timesheet?start_date=2025-12-23&end_date=2025-12-29"

# Filter by branch ID
curl "http://127.0.0.1:8000/api/timesheet?branch_id=1&start_date=2025-12-01&end_date=2025-12-31"

# Search by staff name
curl "http://127.0.0.1:8000/api/timesheet?search=Nguyễn&start_date=2025-12-01&end_date=2025-12-31"
```

### Expected API Response Structure
```json
[
  {
    "staffId": 1,
    "staffName": "Nguyễn Văn A",
    "avatar": "NVA",
    "role": "Nhân viên",
    "branchName": "Chi nhánh Quận 1",
    "totalHours": 160.0,
    "attendance": {
      "2025-12-01": {
        "in": "08:00",
        "out": "17:00",
        "hours": 8.0,
        "status": "Đúng giờ"
      }
    }
  }
]
```

## 🎓 Key Features Recap

### ✨ What Makes This Timesheet Special

1. **Zero New Tables** - Uses existing `nhan_vien` + `cham_cong`
2. **Smart Hour Calculation** - Auto-deducts lunch break
3. **Flexible Time Views** - Month/Week/Today switch
4. **Sticky Column** - Staff info always visible
5. **Color Psychology** - Instant visual status
6. **Detail Popup** - Full info on demand
7. **Real-time Filters** - Instant search + branch filter
8. **Responsive Design** - Horizontal scroll for many dates

## 📈 Next Steps (Optional Enhancements)

### Easy Wins
- [ ] Export to Excel button
- [ ] Print-friendly stylesheet
- [ ] Custom date range picker

### Advanced Features
- [ ] Overtime calculation (>8h → yellow cells)
- [ ] Absent tracking (expected but didn't clock in)
- [ ] Late penalty calculation
- [ ] Integration with Payroll module

## 🆘 Need Help?

### Common Questions

**Q: Can I change the lunch break duration?**  
A: Yes! Edit `calculate_work_hours()` in `main.py`:
```python
if work_hours > 4:
    work_hours -= 1.5  # Change to 1.5 hours lunch
```

**Q: How to show overtime hours differently?**  
A: Add condition in cell rendering:
```typescript
const isOvertime = hours > 8;
const cellClass = isOvertime ? 'bg-yellow-100' : 
                  hours >= 8 ? 'bg-green-100' : 'bg-red-100';
```

**Q: Can I show weekend dates differently?**  
A: Yes! Check day of week:
```typescript
const isWeekend = date.getDay() === 0 || date.getDay() === 6;
const headerClass = isWeekend ? 'bg-gray-200' : 'bg-gray-50';
```

---

**Status:** ✅ Production Ready  
**Setup Time:** ~5 minutes  
**Complexity:** Intermediate  
**Dependencies:** PostgreSQL 9.6+, Python 3.9+, React 18+
