from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI()

# --- Cấu hình CORS (Để React gọi được) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Kết nối Database ---
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="postgres", # <--- QUAN TRỌNG: Đã đổi tên DB thành RestaurantAI
            user="postgres",
            password="123",        # <--- Password của bạn
            port="5433"            # <--- Port của bạn
        )
        return conn
    except Exception as e:
        print("Lỗi kết nối Database:", e)
        return None

# ==========================================
# 1. API CHI NHÁNH (Branches) - MỚI
# ==========================================
@app.get("/api/branches")
def get_branches():
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # JOIN với bảng nhân viên để lấy tên Quản lý
    query = """
        SELECT cn.id, cn.ten_chi_nhanh as "name", cn.dia_chi as "address", 
               COALESCE(nv.ho_ten, 'Chưa có') as "managerName"
        FROM chi_nhanh cn
        LEFT JOIN nhan_vien nv ON cn.quan_ly_id = nv.id
        ORDER BY cn.id ASC
    """
    cursor.execute(query)
    data = cursor.fetchall()
    conn.close()
    return data

# ==========================================
# 2. API NHÂN VIÊN (Staff)
# ==========================================
@app.get("/api/staff")
def get_staff():
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Lấy thêm tên chi nhánh nếu cần (nhưng giao diện hiện tại chưa cần nên lấy cơ bản)
    query = """
       SELECT nv.id, nv.ho_ten as name, nv.chuc_vu as role, 
               nv.so_dien_thoai as phone, nv.trang_thai as status, nv.avatar,
               COALESCE(cn.ten_chi_nhanh, 'Chưa phân bổ') as "branchName"
        FROM nhan_vien nv
        LEFT JOIN chi_nhanh cn ON nv.chi_nhanh_id = cn.id
        ORDER BY nv.id ASC
    """
    cursor.execute(query)
    data = cursor.fetchall()
    conn.close()
    return data

# ==========================================
# 3. API LỊCH LÀM VIỆC (Roster) - CẬP NHẬT
# ==========================================
@app.get("/api/shifts")
def get_shifts():
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Ghép giờ bắt đầu và kết thúc thành chuỗi "06:00-14:00" cho khớp Frontend
    query = """
        SELECT l.id, l.nhan_vien_id as "staffId", nv.ho_ten as "staffName", 
               l.thu as day, l.ca_lam as shift, 
               TO_CHAR(l.gio_bat_dau, 'HH24:MI') || '-' || TO_CHAR(l.gio_ket_thuc, 'HH24:MI') as time
        FROM lich_lam_viec l
        JOIN nhan_vien nv ON l.nhan_vien_id = nv.id
    """
    cursor.execute(query)
    data = cursor.fetchall()
    conn.close()
    return data

# ==========================================
# 4. API CHẤM CÔNG (Attendance)
# ==========================================
@app.get("/api/attendance")
def get_attendance():
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT nv.ho_ten as "staffName", 
               TO_CHAR(c.ngay, 'DD/MM/YYYY') as date, 
               c.gio_vao as "checkIn", c.gio_ra as "checkOut",
               c.trang_thai_checkin
        FROM cham_cong c
        JOIN nhan_vien nv ON c.nhan_vien_id = nv.id
        ORDER BY c.ngay DESC, c.gio_vao ASC
    """
    cursor.execute(query)
    data = cursor.fetchall()
    
    # Tính toán tổng giờ (Giả lập đơn giản)
    for row in data:
        row['totalHours'] = '8h' 
        # Logic hiển thị trễ cho frontend
        if row['trang_thai_checkin'] == 'Trễ':
             row['isLate'] = True # Frontend có thể dùng cờ này để tô đỏ
        
    conn.close()
    return data

# ==========================================
# 5. API BẢNG LƯƠNG (Payroll) - MỚI
# ==========================================
@app.get("/api/payroll")
def get_payroll():
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT bl.id, nv.ho_ten as "staffName", 
               bl.so_cong as "workDays", 
               bl.luong_cung as "baseSalary", 
               bl.thuong as "bonus", 
               bl.tong_thuc_nhan as "totalSalary"
        FROM bang_luong bl
        JOIN nhan_vien nv ON bl.nhan_vien_id = nv.id
    """
    cursor.execute(query)
    data = cursor.fetchall()
    conn.close()
    return data

# --- Chạy Server ---
if __name__ == "__main__":
    import uvicorn
    print("🚀 Server đang chạy tại http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)