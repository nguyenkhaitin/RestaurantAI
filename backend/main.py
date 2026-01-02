from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

app = FastAPI()

# ==========================================
# PYDANTIC MODELS
# ==========================================
class BranchCreate(BaseModel):
    name: str
    address: str
    managerId: Optional[int] = None  # Optional: can be null

class BranchUpdate(BaseModel):
    name: str
    address: str
    managerId: Optional[int] = None  # Optional: can be null

class StaffCreate(BaseModel):
    name: str
    role: str
    phone: str
    status: str
    branchId: Optional[int] = None  # Optional: can be null

class StaffUpdate(BaseModel):
    name: str
    role: str
    phone: str
    status: str
    branchId: Optional[int] = None  # Optional: can be null

class ShiftTemplateCreate(BaseModel):
    name: str
    startTime: str  # Format: "HH:MM" (24-hour)
    endTime: str
    maxCapacity: int

class ShiftAssignment(BaseModel):
    staffId: int
    shiftTemplateId: int
    date: str  # Format: "YYYY-MM-DD"
    branchId: Optional[int] = None

class PayrollConfigCreate(BaseModel):
    staffId: int
    type: str  # 'THEO_GIO' or 'THEO_THANG'
    amount: float  # Hourly rate or monthly salary

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

@app.post("/api/branches", status_code=status.HTTP_201_CREATED)
async def create_branch(branch: BranchCreate):
    """
    Create new branch with automatic manager assignment (manager is optional)
    
    Logic Flow:
    1. Receive JSON: { "name": "...", "address": "...", "managerId": 123 or null }
    2. INSERT into chi_nhanh table (ten_chi_nhanh, dia_chi, quan_ly_id)
    3. GET the new branch ID
    4. If managerId provided: UPDATE nhan_vien SET chi_nhanh_id = [new_branch_id] WHERE id = [managerId]
    5. COMMIT transaction (both steps must succeed)
    """
    print("=" * 70)
    print("[CREATE BRANCH] Received payload:")
    print(f"  name: {branch.name}")
    print(f"  address: {branch.address}")
    print(f"  managerId: {branch.managerId}")
    print("=" * 70)
    
    conn = get_db_connection()
    if not conn: 
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ===== INPUT VALIDATION =====
        if not branch.name or not branch.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branch name cannot be empty"
            )
        
        if not branch.address or not branch.address.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Address cannot be empty"
            )
        
        # Handle managerId (optional now)
        manager_id = branch.managerId if branch.managerId and branch.managerId > 0 else None
        print(f"[STEP 0] Processed managerId: {manager_id}")
        
        # Validate manager exists (only if provided)
        manager_name = 'Chưa có'
        if manager_id is not None:
            print(f"[STEP 0] Validating manager with ID = {manager_id}")
            cursor.execute(
                "SELECT id, ho_ten FROM nhan_vien WHERE id = %s",
                (manager_id,)
            )
            manager = cursor.fetchone()
            
            if not manager:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Manager with ID {manager_id} not found"
                )
            
            manager_name = manager['ho_ten']
            print(f"[STEP 0] ✓ Manager found: {manager_name}")
        else:
            print("[STEP 0] ⚠️  No manager assigned (optional)")
        
        # ===== STEP 1: INSERT BRANCH =====
        # SQL has exactly 3 placeholders (%s)
        insert_sql = """
            INSERT INTO chi_nhanh (ten_chi_nhanh, dia_chi, quan_ly_id)
            VALUES (%s, %s, %s)
            RETURNING id, ten_chi_nhanh, dia_chi, quan_ly_id
        """
        
        # Tuple has exactly 3 values matching the 3 placeholders
        insert_params = (
            branch.name.strip(),
            branch.address.strip(),
            manager_id  # Can be None/NULL
        )
        
        print(f"[STEP 1] Executing INSERT with params: {insert_params}")
        cursor.execute(insert_sql, insert_params)
        new_branch_row = cursor.fetchone()
        
        if not new_branch_row:
            raise Exception("Failed to insert branch - no row returned")
        
        new_branch_id = new_branch_row['id']
        print(f"[STEP 1] ✓ Branch inserted with ID = {new_branch_id}")
        
        # ===== STEP 2: UPDATE EMPLOYEE (ASSIGN BRANCH TO MANAGER) - ONLY IF MANAGER PROVIDED =====
        if manager_id is not None:
            update_sql = """
                UPDATE nhan_vien
                SET chi_nhanh_id = %s
                WHERE id = %s
            """
            
            print(f"[STEP 2] Executing UPDATE nhan_vien: chi_nhanh_id={new_branch_id}, manager_id={manager_id}")
            cursor.execute(update_sql, (new_branch_id, manager_id))
            rows_updated = cursor.rowcount
            print(f"[STEP 2] ✓ Updated {rows_updated} employee record(s)")
        else:
            print("[STEP 2] ⚠️  Skipped (no manager to assign)")
        
        # ===== STEP 3: COMMIT TRANSACTION =====
        conn.commit()
        print("[STEP 3] ✓ Transaction COMMITTED successfully")
        print("=" * 70)
        
        # ===== RETURN SUCCESS RESPONSE =====
        return {
            "success": True,
            "message": "Branch created successfully" + (" and manager assigned" if manager_id else ""),
            "data": {
                "id": new_branch_id,
                "name": new_branch_row['ten_chi_nhanh'],
                "address": new_branch_row['dia_chi'],
                "managerName": manager_name
            }
        }
        
    except HTTPException as http_err:
        # HTTP exceptions (400, 404, etc.) - rollback and re-raise
        if conn:
            conn.rollback()
        print(f"[ERROR] HTTPException: {http_err.status_code} - {http_err.detail}")
        raise
        
    except psycopg2.Error as db_err:
        # Database errors - rollback and convert to 500
        if conn:
            conn.rollback()
        error_msg = f"Database error: {type(db_err).__name__} - {str(db_err)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    except Exception as e:
        # Unexpected errors - rollback and convert to 500
        if conn:
            conn.rollback()
        error_msg = f"Unexpected error: {type(e).__name__} - {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("[CLEANUP] Database connection closed\n")

@app.put("/api/branches/{branch_id}", status_code=status.HTTP_200_OK)
async def update_branch(branch_id: int, branch: BranchUpdate):
    """
    Update branch information with automatic manager reassignment
    
    Logic Flow:
    1. Validate branch exists
    2. UPDATE chi_nhanh table
    3. If managerId changed: remove old manager and assign new manager to branch
    4. COMMIT transaction
    """
    print("=" * 70)
    print(f"[UPDATE BRANCH] Branch ID: {branch_id}")
    print(f"  name: {branch.name}")
    print(f"  address: {branch.address}")
    print(f"  managerId: {branch.managerId}")
    print("=" * 70)
    
    conn = get_db_connection()
    if not conn: 
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ===== VALIDATE BRANCH EXISTS =====
        cursor.execute("SELECT id, quan_ly_id FROM chi_nhanh WHERE id = %s", (branch_id,))
        existing_branch = cursor.fetchone()
        if not existing_branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branch not found"
            )
        
        old_manager_id = existing_branch['quan_ly_id']
        print(f"[STEP 0] Existing branch found. Old managerId: {old_manager_id}")
        
        # ===== INPUT VALIDATION =====
        if not branch.name or not branch.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branch name cannot be empty"
            )
        
        if not branch.address or not branch.address.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Address cannot be empty"
            )
        
        # Handle managerId (can be None/null now - manager is optional)
        manager_id = branch.managerId if branch.managerId and branch.managerId > 0 else None
        print(f"[STEP 0] New managerId: {manager_id}")
        
        # Validate manager exists (only if provided)
        manager_name = 'Chưa có'
        if manager_id is not None:
            cursor.execute("SELECT id, ho_ten FROM nhan_vien WHERE id = %s", (manager_id,))
            manager = cursor.fetchone()
            if not manager:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Manager with ID {manager_id} not found"
                )
            manager_name = manager['ho_ten']
            print(f"[STEP 0] ✓ Manager found: {manager_name}")
        
        # ===== STEP 1: UPDATE BRANCH INFO =====
        update_branch_sql = """
            UPDATE chi_nhanh
            SET ten_chi_nhanh = %s, dia_chi = %s, quan_ly_id = %s
            WHERE id = %s
        """
        print(f"[STEP 1] Updating chi_nhanh...")
        cursor.execute(update_branch_sql, (branch.name.strip(), branch.address.strip(), manager_id, branch_id))
        print(f"[STEP 1] ✓ Updated chi_nhanh ID {branch_id}")
        
        # ===== STEP 2: REMOVE OLD MANAGER FROM BRANCH (IF DIFFERENT) =====
        if old_manager_id is not None and old_manager_id != manager_id:
            print(f"[STEP 2a] Removing old manager {old_manager_id} from branch {branch_id}")
            cursor.execute(
                "UPDATE nhan_vien SET chi_nhanh_id = NULL WHERE id = %s",
                (old_manager_id,)
            )
            print(f"[STEP 2a] ✓ Old manager {old_manager_id} removed from branch")
        
        # ===== STEP 3: ASSIGN NEW MANAGER TO BRANCH =====
        if manager_id is not None:
            update_employee_sql = """
                UPDATE nhan_vien
                SET chi_nhanh_id = %s
                WHERE id = %s
            """
            print(f"[STEP 2b] Assigning manager {manager_id} to branch {branch_id}")
            cursor.execute(update_employee_sql, (branch_id, manager_id))
            rows_updated = cursor.rowcount
            print(f"[STEP 2b] ✓ Updated {rows_updated} employee record(s)")
        else:
            print("[STEP 2b] ⚠️  Skipped (no manager assigned)")
        
        # ===== STEP 4: COMMIT TRANSACTION =====
        conn.commit()
        print("[STEP 3] ✓ Transaction COMMITTED successfully")
        print("=" * 70)
        
        # ===== RETURN SUCCESS RESPONSE =====
        return {
            "success": True,
            "message": "Branch updated successfully",
            "data": {
                "id": branch_id,
                "name": branch.name,
                "address": branch.address,
                "managerName": manager_name
            }
        }
        
    except HTTPException as http_err:
        if conn:
            conn.rollback()
        print(f"[ERROR] HTTPException: {http_err.status_code} - {http_err.detail}")
        raise
        
    except psycopg2.Error as db_err:
        if conn:
            conn.rollback()
        error_msg = f"Database error: {type(db_err).__name__} - {str(db_err)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    except Exception as e:
        if conn:
            conn.rollback()
        error_msg = f"Unexpected error: {type(e).__name__} - {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("[CLEANUP] Database connection closed\n")

@app.delete("/api/branches/{branch_id}", status_code=status.HTTP_200_OK)
async def delete_branch(branch_id: int):
    """
    Xóa chi nhánh
    """
    conn = get_db_connection()
    if not conn: 
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể kết nối đến cơ sở dữ liệu"
        )
    
    try:
        cursor = conn.cursor()
        
        # Kiểm tra chi nhánh có tồn tại không
        cursor.execute("SELECT id FROM chi_nhanh WHERE id = %s", (branch_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy chi nhánh với ID này"
            )
        
        # Kiểm tra xem có nhân viên nào thuộc chi nhánh này không
        cursor.execute("SELECT COUNT(*) as count FROM nhan_vien WHERE chi_nhanh_id = %s", (branch_id,))
        result = cursor.fetchone()
        if result[0] > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa chi nhánh vì còn {result[0]} nhân viên đang làm việc tại đây"
            )
        
        query = "DELETE FROM chi_nhanh WHERE id = %s"
        cursor.execute(query, (branch_id,))
        conn.commit()
        
        return {
            "success": True,
            "message": "Xóa chi nhánh thành công"
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(f"Error deleting branch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xóa chi nhánh: {str(e)}"
        )
    finally:
        conn.close()

# ==========================================
# 2. API NHÂN VIÊN (Staff)
# ==========================================
@app.get("/api/staff")
def get_staff(search: Optional[str] = None, role: Optional[str] = None, status: Optional[str] = None, branchId: Optional[int] = None):
    """
    Get staff list with optional search and filters
    
    Query Parameters:
    - search: Search by name or phone
    - role: Filter by role
    - status: Filter by status
    - branchId: Filter by branch ID
    """
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Base query
    query = """
       SELECT nv.id, nv.ho_ten as name, nv.chuc_vu as role, 
               nv.so_dien_thoai as phone, nv.trang_thai as status, nv.avatar,
               COALESCE(cn.ten_chi_nhanh, 'Chưa phân bổ') as "branchName",
               nv.chi_nhanh_id as "branchId"
        FROM nhan_vien nv
        LEFT JOIN chi_nhanh cn ON nv.chi_nhanh_id = cn.id
        WHERE 1=1
    """
    params = []
    
    # Add search filter
    if search:
        query += " AND (nv.ho_ten ILIKE %s OR nv.so_dien_thoai ILIKE %s)"
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern])
    
    # Add role filter
    if role:
        query += " AND nv.chuc_vu = %s"
        params.append(role)
    
    # Add status filter
    if status:
        query += " AND nv.trang_thai = %s"
        params.append(status)
    
    # Add branch filter
    if branchId:
        query += " AND nv.chi_nhanh_id = %s"
        params.append(branchId)
    
    query += " ORDER BY nv.id ASC"
    
    cursor.execute(query, tuple(params))
    data = cursor.fetchall()
    conn.close()
    return data

@app.post("/api/staff", status_code=status.HTTP_201_CREATED)
async def create_staff(staff: StaffCreate):
    """
    Create new staff member
    
    Logic:
    1. Validate input
    2. Auto-generate avatar (initials from name)
    3. INSERT into nhan_vien table
    4. Return created staff data
    """
    print("=" * 70)
    print("[CREATE STAFF] Received payload:")
    print(f"  name: {staff.name}")
    print(f"  role: {staff.role}")
    print(f"  phone: {staff.phone}")
    print(f"  status: {staff.status}")
    print(f"  branchId: {staff.branchId}")
    print("=" * 70)
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ===== INPUT VALIDATION =====
        if not staff.name or not staff.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name cannot be empty"
            )
        
        if not staff.role or not staff.role.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be empty"
            )
        
        if not staff.phone or not staff.phone.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone cannot be empty"
            )
        
        if not staff.status or not staff.status.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status cannot be empty"
            )
        
        # Handle branchId (optional)
        branch_id = staff.branchId if staff.branchId and staff.branchId > 0 else None
        
        # Validate branch exists (if provided)
        branch_name = 'Chưa phân bổ'
        if branch_id is not None:
            cursor.execute("SELECT id, ten_chi_nhanh FROM chi_nhanh WHERE id = %s", (branch_id,))
            branch = cursor.fetchone()
            if not branch:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Branch with ID {branch_id} not found"
                )
            branch_name = branch['ten_chi_nhanh']
            print(f"[STEP 0] ✓ Branch found: {branch_name}")
        
        # Auto-generate avatar (initials from name)
        name_parts = staff.name.strip().split()
        if len(name_parts) >= 2:
            avatar = (name_parts[0][0] + name_parts[-1][0]).upper()
        else:
            avatar = name_parts[0][0:2].upper() if len(name_parts[0]) >= 2 else name_parts[0][0].upper()
        
        print(f"[STEP 0] Generated avatar: {avatar}")
        
        # ===== INSERT STAFF =====
        # SQL has exactly 6 placeholders (%s)
        insert_sql = """
            INSERT INTO nhan_vien (ho_ten, chuc_vu, so_dien_thoai, trang_thai, avatar, chi_nhanh_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, ho_ten, chuc_vu, so_dien_thoai, trang_thai, avatar, chi_nhanh_id
        """
        
        # Tuple with exactly 6 values
        insert_params = (
            staff.name.strip(),
            staff.role.strip(),
            staff.phone.strip(),
            staff.status.strip(),
            avatar,
            branch_id
        )
        
        print(f"[STEP 1] Executing INSERT with params: {insert_params}")
        cursor.execute(insert_sql, insert_params)
        new_staff_row = cursor.fetchone()
        
        if not new_staff_row:
            raise Exception("Failed to insert staff - no row returned")
        
        conn.commit()
        print("[STEP 2] ✓ Transaction COMMITTED successfully")
        print("=" * 70)
        
        # ===== RETURN SUCCESS RESPONSE =====
        return {
            "success": True,
            "message": "Staff created successfully",
            "data": {
                "id": new_staff_row['id'],
                "name": new_staff_row['ho_ten'],
                "role": new_staff_row['chuc_vu'],
                "phone": new_staff_row['so_dien_thoai'],
                "status": new_staff_row['trang_thai'],
                "avatar": new_staff_row['avatar'],
                "branchName": branch_name,
                "branchId": new_staff_row['chi_nhanh_id']
            }
        }
        
    except HTTPException as http_err:
        if conn:
            conn.rollback()
        print(f"[ERROR] HTTPException: {http_err.status_code} - {http_err.detail}")
        raise
        
    except psycopg2.Error as db_err:
        if conn:
            conn.rollback()
        error_msg = f"Database error: {type(db_err).__name__} - {str(db_err)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    except Exception as e:
        if conn:
            conn.rollback()
        error_msg = f"Unexpected error: {type(e).__name__} - {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("[CLEANUP] Database connection closed\n")

@app.put("/api/staff/{staff_id}", status_code=status.HTTP_200_OK)
async def update_staff(staff_id: int, staff: StaffUpdate):
    """
    Update staff information
    
    Logic:
    1. Validate staff exists
    2. Update staff data
    3. Return updated staff data
    """
    print("=" * 70)
    print(f"[UPDATE STAFF] Staff ID: {staff_id}")
    print(f"  name: {staff.name}")
    print(f"  role: {staff.role}")
    print(f"  phone: {staff.phone}")
    print(f"  status: {staff.status}")
    print(f"  branchId: {staff.branchId}")
    print("=" * 70)
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ===== VALIDATE STAFF EXISTS =====
        cursor.execute("SELECT id FROM nhan_vien WHERE id = %s", (staff_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff not found"
            )
        
        # ===== INPUT VALIDATION =====
        if not staff.name or not staff.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name cannot be empty"
            )
        
        if not staff.role or not staff.role.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be empty"
            )
        
        if not staff.phone or not staff.phone.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone cannot be empty"
            )
        
        if not staff.status or not staff.status.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status cannot be empty"
            )
        
        # Handle branchId (optional)
        branch_id = staff.branchId if staff.branchId and staff.branchId > 0 else None
        
        # Validate branch exists (if provided)
        branch_name = 'Chưa phân bổ'
        if branch_id is not None:
            cursor.execute("SELECT id, ten_chi_nhanh FROM chi_nhanh WHERE id = %s", (branch_id,))
            branch = cursor.fetchone()
            if not branch:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Branch with ID {branch_id} not found"
                )
            branch_name = branch['ten_chi_nhanh']
        
        # Auto-generate avatar (initials from name)
        name_parts = staff.name.strip().split()
        if len(name_parts) >= 2:
            avatar = (name_parts[0][0] + name_parts[-1][0]).upper()
        else:
            avatar = name_parts[0][0:2].upper() if len(name_parts[0]) >= 2 else name_parts[0][0].upper()
        
        # ===== UPDATE STAFF =====
        # SQL has exactly 7 placeholders (%s)
        update_sql = """
            UPDATE nhan_vien
            SET ho_ten = %s, chuc_vu = %s, so_dien_thoai = %s, 
                trang_thai = %s, avatar = %s, chi_nhanh_id = %s
            WHERE id = %s
        """
        
        # Tuple with exactly 7 values
        update_params = (
            staff.name.strip(),
            staff.role.strip(),
            staff.phone.strip(),
            staff.status.strip(),
            avatar,
            branch_id,
            staff_id
        )
        
        print(f"[STEP 1] Updating staff...")
        cursor.execute(update_sql, update_params)
        
        conn.commit()
        print("[STEP 2] ✓ Transaction COMMITTED successfully")
        print("=" * 70)
        
        # ===== RETURN SUCCESS RESPONSE =====
        return {
            "success": True,
            "message": "Staff updated successfully",
            "data": {
                "id": staff_id,
                "name": staff.name,
                "role": staff.role,
                "phone": staff.phone,
                "status": staff.status,
                "avatar": avatar,
                "branchName": branch_name,
                "branchId": branch_id
            }
        }
        
    except HTTPException as http_err:
        if conn:
            conn.rollback()
        print(f"[ERROR] HTTPException: {http_err.status_code} - {http_err.detail}")
        raise
        
    except psycopg2.Error as db_err:
        if conn:
            conn.rollback()
        error_msg = f"Database error: {type(db_err).__name__} - {str(db_err)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    except Exception as e:
        if conn:
            conn.rollback()
        error_msg = f"Unexpected error: {type(e).__name__} - {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("[CLEANUP] Database connection closed\n")

@app.delete("/api/staff/{staff_id}", status_code=status.HTTP_200_OK)
async def delete_staff(staff_id: int):
    """
    Delete staff member
    """
    print("=" * 70)
    print(f"[DELETE STAFF] Staff ID: {staff_id}")
    print("=" * 70)
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    cursor = None
    try:
        cursor = conn.cursor()
        
        # Validate staff exists
        cursor.execute("SELECT id FROM nhan_vien WHERE id = %s", (staff_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff not found"
            )
        
        # Delete staff
        cursor.execute("DELETE FROM nhan_vien WHERE id = %s", (staff_id,))
        conn.commit()
        
        print("[STEP 1] ✓ Staff deleted successfully")
        print("=" * 70)
        
        return {
            "success": True,
            "message": "Staff deleted successfully"
        }
        
    except HTTPException as http_err:
        if conn:
            conn.rollback()
        print(f"[ERROR] HTTPException: {http_err.status_code} - {http_err.detail}")
        raise
        
    except psycopg2.Error as db_err:
        if conn:
            conn.rollback()
        error_msg = f"Database error: {type(db_err).__name__} - {str(db_err)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    except Exception as e:
        if conn:
            conn.rollback()
        error_msg = f"Unexpected error: {type(e).__name__} - {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("[CLEANUP] Database connection closed\n")

# ==========================================
# 3. API LỊCH LÀM VIỆC (Roster) - MỚI
# ==========================================

# 3.1 API Shift Templates (Cấu hình ca)
@app.get("/api/shift-templates")
def get_shift_templates():
    """
    Get all shift templates from cau_hinh_ca
    """
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT id, ten_ca as "name", 
               TO_CHAR(gio_bat_dau, 'HH24:MI') as "startTime",
               TO_CHAR(gio_ket_thuc, 'HH24:MI') as "endTime",
               so_luong_max as "maxCapacity"
        FROM cau_hinh_ca
        ORDER BY gio_bat_dau ASC
    """
    cursor.execute(query)
    data = cursor.fetchall()
    conn.close()
    return data

@app.post("/api/shift-templates", status_code=status.HTTP_201_CREATED)
async def create_shift_template(shift: ShiftTemplateCreate):
    """
    Create new shift template with time overlap validation
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Validation
        if not shift.name or not shift.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shift name cannot be empty"
            )
        
        if shift.maxCapacity < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Max capacity must be at least 1"
            )
        
        # Check time overlap
        cursor.execute("""
            SELECT id, ten_ca FROM cau_hinh_ca
            WHERE (gio_bat_dau, gio_ket_thuc) OVERLAPS (%s::time, %s::time)
        """, (shift.startTime, shift.endTime))
        
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Time overlaps with existing shift: {existing['ten_ca']}"
            )
        
        # Insert shift template
        insert_sql = """
            INSERT INTO cau_hinh_ca (ten_ca, gio_bat_dau, gio_ket_thuc, so_luong_max)
            VALUES (%s, %s::time, %s::time, %s)
            RETURNING id, ten_ca, TO_CHAR(gio_bat_dau, 'HH24:MI') as "startTime",
                      TO_CHAR(gio_ket_thuc, 'HH24:MI') as "endTime", so_luong_max
        """
        
        cursor.execute(insert_sql, (shift.name.strip(), shift.startTime, shift.endTime, shift.maxCapacity))
        new_shift = cursor.fetchone()
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Shift template created successfully",
            "data": {
                "id": new_shift['id'],
                "name": new_shift['ten_ca'],
                "startTime": new_shift['startTime'],
                "endTime": new_shift['endTime'],
                "maxCapacity": new_shift['so_luong_max']
            }
        }
        
    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating shift template: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.delete("/api/shift-templates/{shift_id}", status_code=status.HTTP_200_OK)
async def delete_shift_template(shift_id: int):
    """
    Delete shift template (only if no assignments exist)
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if shift exists
        cursor.execute("SELECT id FROM cau_hinh_ca WHERE id = %s", (shift_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift template not found"
            )
        
        # Check if any assignments use this shift
        cursor.execute(
            "SELECT COUNT(*) as count FROM lich_lam_viec WHERE ca_lam_id = %s",
            (shift_id,)
        )
        count_result = cursor.fetchone()
        if count_result['count'] > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete shift template with {count_result['count']} existing assignments"
            )
        
        cursor.execute("DELETE FROM cau_hinh_ca WHERE id = %s", (shift_id,))
        conn.commit()
        
        return {
            "success": True,
            "message": "Shift template deleted successfully"
        }
        
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting shift template: {str(e)}"
        )
    finally:
        conn.close()

# 3.2 API Roster Assignments (Phân công ca)
@app.get("/api/roster")
def get_roster(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """
    Get roster assignments with optional date range filter
    Returns full data with staff names, shift names, branch names
    """
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT l.id, l.nhan_vien_id as "staffId", nv.ho_ten as "staffName",
               nv.avatar,
               TO_CHAR(l.ngay_lam, 'YYYY-MM-DD') as date,
               l.ca_lam_id as "shiftTemplateId", ca.ten_ca as "shiftName",
               TO_CHAR(ca.gio_bat_dau, 'HH24:MI') as "shiftStartTime",
               TO_CHAR(ca.gio_ket_thuc, 'HH24:MI') as "shiftEndTime",
               l.chi_nhanh_id as "branchId",
               COALESCE(cn.ten_chi_nhanh, 'Chưa phân bổ') as "branchName"
        FROM lich_lam_viec l
        JOIN nhan_vien nv ON l.nhan_vien_id = nv.id
        JOIN cau_hinh_ca ca ON l.ca_lam_id = ca.id
        LEFT JOIN chi_nhanh cn ON l.chi_nhanh_id = cn.id
        WHERE 1=1
    """
    params = []
    
    if start_date:
        query += " AND l.ngay_lam >= %s"
        params.append(start_date)
    
    if end_date:
        query += " AND l.ngay_lam <= %s"
        params.append(end_date)
    
    query += " ORDER BY l.ngay_lam ASC, ca.gio_bat_dau ASC"
    
    cursor.execute(query, tuple(params))
    data = cursor.fetchall()
    conn.close()
    return data

@app.post("/api/assign-shift", status_code=status.HTTP_201_CREATED)
async def assign_shift(assignment: ShiftAssignment):
    """
    Assign staff to shift with validation:
    - Staff exists
    - Shift template exists
    - Staff not already assigned to any shift on that date
    - Shift capacity not exceeded
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Validate staff exists
        cursor.execute(
            "SELECT id, ho_ten, avatar FROM nhan_vien WHERE id = %s",
            (assignment.staffId,)
        )
        staff = cursor.fetchone()
        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff not found"
            )
        
        # Validate shift template exists
        cursor.execute(
            "SELECT id, ten_ca, so_luong_max FROM cau_hinh_ca WHERE id = %s",
            (assignment.shiftTemplateId,)
        )
        shift_template = cursor.fetchone()
        if not shift_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift template not found"
            )
        
        # Check if staff already assigned to ANY shift on this date
        cursor.execute("""
            SELECT id FROM lich_lam_viec 
            WHERE nhan_vien_id = %s AND ngay_lam = %s
        """, (assignment.staffId, assignment.date))
        
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Staff is already assigned to a shift on this date"
            )
        
        # Check capacity
        cursor.execute("""
            SELECT COUNT(*) as count FROM lich_lam_viec 
            WHERE ca_lam_id = %s AND ngay_lam = %s
        """, (assignment.shiftTemplateId, assignment.date))
        
        count_result = cursor.fetchone()
        if count_result['count'] >= shift_template['so_luong_max']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Shift has reached maximum capacity ({shift_template['so_luong_max']} slots)"
            )
        
        # Handle branchId
        branch_id = assignment.branchId if assignment.branchId and assignment.branchId > 0 else None
        branch_name = 'Chưa phân bổ'
        
        if branch_id:
            cursor.execute(
                "SELECT id, ten_chi_nhanh FROM chi_nhanh WHERE id = %s",
                (branch_id,)
            )
            branch = cursor.fetchone()
            if branch:
                branch_name = branch['ten_chi_nhanh']
        
        # Insert assignment
        insert_sql = """
            INSERT INTO lich_lam_viec (nhan_vien_id, ca_lam_id, ngay_lam, chi_nhanh_id)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """
        
        cursor.execute(insert_sql, (assignment.staffId, assignment.shiftTemplateId, assignment.date, branch_id))
        new_assignment = cursor.fetchone()
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Shift assigned successfully",
            "data": {
                "id": new_assignment['id'],
                "staffId": assignment.staffId,
                "staffName": staff['ho_ten'],
                "avatar": staff['avatar'],
                "date": assignment.date,
                "shiftTemplateId": assignment.shiftTemplateId,
                "shiftName": shift_template['ten_ca'],
                "branchId": branch_id,
                "branchName": branch_name
            }
        }
        
    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error assigning shift: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.delete("/api/roster/{assignment_id}", status_code=status.HTTP_200_OK)
async def delete_assignment(assignment_id: int):
    """
    Delete roster assignment
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    try:
        cursor = conn.cursor()
        
        # Check if assignment exists
        cursor.execute("SELECT id FROM lich_lam_viec WHERE id = %s", (assignment_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        cursor.execute("DELETE FROM lich_lam_viec WHERE id = %s", (assignment_id,))
        conn.commit()
        
        return {
            "success": True,
            "message": "Assignment deleted successfully"
        }
        
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting assignment: {str(e)}"
        )
    finally:
        conn.close()

# ==========================================
# 4. API CHẤM CÔNG (Attendance & Timesheet)
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

@app.get("/api/timesheet")
def get_timesheet(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    branch_id: Optional[int] = None,
    search: Optional[str] = None
):
    """
    Get timesheet data for staff with attendance records
    Returns matrix-friendly structure for Frontend rendering
    """
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Build base query with all JOINs first
    query = """
        SELECT 
            nv.id as "staffId",
            nv.ho_ten as "staffName",
            nv.avatar,
            nv.chuc_vu as "role",
            COALESCE(cn.ten_chi_nhanh, 'Chưa phân bổ') as "branchName",
            TO_CHAR(c.ngay, 'YYYY-MM-DD') as date,
            c.gio_vao as "checkIn",
            c.gio_ra as "checkOut",
            c.trang_thai_checkin as "status"
        FROM nhan_vien nv
        LEFT JOIN chi_nhanh cn ON nv.chi_nhanh_id = cn.id
        LEFT JOIN cham_cong c ON nv.id = c.nhan_vien_id
        WHERE 1=1
    """
    
    params = []
    
    # Add staff filters
    if search:
        query += " AND (nv.ho_ten ILIKE %s OR nv.so_dien_thoai ILIKE %s)"
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern])
    
    if branch_id:
        query += " AND nv.chi_nhanh_id = %s"
        params.append(branch_id)
    
    # Add date range filters
    if start_date and end_date:
        query += " AND (c.ngay IS NULL OR (c.ngay >= %s AND c.ngay <= %s))"
        params.extend([start_date, end_date])
    elif start_date:
        query += " AND (c.ngay IS NULL OR c.ngay >= %s)"
        params.append(start_date)
    elif end_date:
        query += " AND (c.ngay IS NULL OR c.ngay <= %s)"
        params.append(end_date)
    
    query += " ORDER BY nv.id ASC, c.ngay ASC"
    
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    
    # Transform data into matrix-friendly structure
    staff_dict = {}
    
    for row in rows:
        staff_id = row['staffId']
        
        if staff_id not in staff_dict:
            staff_dict[staff_id] = {
                'staffId': staff_id,
                'staffName': row['staffName'],
                'avatar': row['avatar'],
                'role': row['role'],
                'branchName': row['branchName'],
                'totalHours': 0,
                'attendance': {}
            }
        
        # Process attendance record if exists
        if row['date'] and row['checkIn'] and row['checkOut']:
            try:
                date = row['date']
                check_in = row['checkIn']
                check_out = row['checkOut']
                
                # Calculate hours worked (safe parsing inside calculate_work_hours)
                hours = calculate_work_hours(check_in, check_out)
                
                staff_dict[staff_id]['attendance'][date] = {
                    'in': check_in,
                    'out': check_out,
                    'hours': hours,
                    'status': row['status']
                }
                
                staff_dict[staff_id]['totalHours'] += hours
            except Exception as e:
                # Log error but continue processing other rows
                print(f"[ERROR] Failed to process attendance for staff {staff_id} on {row['date']}: {e}")
                continue
    
    # Convert dict to list and round total hours
    result = []
    for staff_data in staff_dict.values():
        staff_data['totalHours'] = round(staff_data['totalHours'], 1)
        result.append(staff_data)
    
    return result

def calculate_work_hours(check_in: str, check_out: str) -> float:
    """
    Calculate work hours from time strings using datetime module
    Format: "HH:MM" (e.g., "08:00", "17:30")
    Logic: Parse with strptime, calculate exact time difference (no auto lunch deduction)
    """
    try:
        # Parse time strings using datetime
        time_format = '%H:%M'
        t_in = datetime.strptime(check_in.strip(), time_format)
        t_out = datetime.strptime(check_out.strip(), time_format)
        
        # Handle overnight shifts (check_out < check_in)
        # Add 24 hours to checkout time if it's earlier than check-in
        if t_out < t_in:
            from datetime import timedelta
            t_out += timedelta(days=1)
        
        # Calculate difference in hours (exact time difference)
        time_diff = t_out - t_in
        work_hours = time_diff.total_seconds() / 3600
        
        return max(0, round(work_hours, 1))  # Ensure non-negative and round to 1 decimal
        
    except (ValueError, AttributeError, TypeError) as e:
        # Log error for debugging but don't crash the API
        print(f"[ERROR] Failed to parse time: check_in={check_in}, check_out={check_out}, error={e}")
        return 0

# ==========================================
# 5. API QUẢN LÝ LƯƠNG (Payroll Management)
# ==========================================

# 5.1 API Payroll Configuration
@app.get("/api/payroll-config")
def get_payroll_config():
    """
    Get salary configurations for all staff
    Returns staff info with their salary type and amount
    """
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT nv.id as "staffId",
               nv.ho_ten as "staffName",
               nv.chuc_vu as "role",
               COALESCE(cn.ten_chi_nhanh, 'Chưa phân bổ') as "branchName",
               cl.loai_luong as "salaryType",
               cl.muc_luong as "amount"
        FROM nhan_vien nv
        LEFT JOIN chi_nhanh cn ON nv.chi_nhanh_id = cn.id
        LEFT JOIN cau_hinh_luong cl ON nv.id = cl.nhan_vien_id
        ORDER BY nv.id ASC
    """
    cursor.execute(query)
    data = cursor.fetchall()
    conn.close()
    return data

@app.post("/api/payroll-config", status_code=status.HTTP_201_CREATED)
async def create_or_update_payroll_config(config: PayrollConfigCreate):
    """
    Create or update salary configuration for a staff member
    If config exists, UPDATE. If not, INSERT.
    """
    print("=" * 70)
    print("[PAYROLL CONFIG] Received payload:")
    print(f"  staffId: {config.staffId}")
    print(f"  type: {config.type}")
    print(f"  amount: {config.amount}")
    print("=" * 70)
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to database"
        )
    
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Validate staff exists
        cursor.execute("SELECT id, ho_ten FROM nhan_vien WHERE id = %s", (config.staffId,))
        staff = cursor.fetchone()
        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff not found"
            )
        
        # Validate salary type
        if config.type not in ['THEO_GIO', 'THEO_THANG']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Salary type must be 'THEO_GIO' or 'THEO_THANG'"
            )
        
        if config.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must be greater than 0"
            )
        
        # Check if config exists
        cursor.execute(
            "SELECT id FROM cau_hinh_luong WHERE nhan_vien_id = %s",
            (config.staffId,)
        )
        existing = cursor.fetchone()
        
        if existing:
            # UPDATE existing config
            update_sql = """
                UPDATE cau_hinh_luong
                SET loai_luong = %s, muc_luong = %s
                WHERE nhan_vien_id = %s
            """
            cursor.execute(update_sql, (config.type, config.amount, config.staffId))
            message = "Cập nhật cấu hình lương thành công"
        else:
            # INSERT new config
            insert_sql = """
                INSERT INTO cau_hinh_luong (nhan_vien_id, loai_luong, muc_luong)
                VALUES (%s, %s, %s)
            """
            cursor.execute(insert_sql, (config.staffId, config.type, config.amount))
            message = "Thêm cấu hình lương thành công"
        
        conn.commit()
        print(f"[SUCCESS] {message}")
        print("=" * 70)
        
        return {
            "success": True,
            "message": message,
            "data": {
                "staffId": config.staffId,
                "staffName": staff['ho_ten'],
                "salaryType": config.type,
                "amount": config.amount
            }
        }
        
    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        error_msg = f"Error saving payroll config: {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("[CLEANUP] Database connection closed\n")

# 5.2 API Payroll Sheet (Salary Calculation)
@app.get("/api/payroll-sheet")
def get_payroll_sheet(
    month: Optional[int] = None,
    year: Optional[int] = None,
    branch_id: Optional[int] = None,
    search: Optional[str] = None
):
    """
    Calculate monthly payroll for staff based on attendance data
    
    Business Rules:
    - THEO_GIO (Hourly): salary = total_hours * hourly_rate
    - THEO_THANG (Monthly): salary = fixed_amount (independent of hours)
    - No config: salary = 0
    
    Query Parameters:
    - month: Month (1-12), default current month
    - year: Year (YYYY), default current year
    - branch_id: Filter by branch
    - search: Search by staff name
    """
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Default to current month/year if not provided
    if not month or not year:
        from datetime import datetime
        today = datetime.now()
        month = month or today.month
        year = year or today.year
    
    print(f"[PAYROLL SHEET] Calculating for month={month}, year={year}")
    
    # Build base query
    query = """
        SELECT nv.id as "staffId",
               nv.ho_ten as "staffName",
               nv.chuc_vu as "role",
               COALESCE(cn.ten_chi_nhanh, 'Chưa phân bổ') as "branchName",
               cl.loai_luong as "salaryType",
               cl.muc_luong as "baseAmount"
        FROM nhan_vien nv
        LEFT JOIN chi_nhanh cn ON nv.chi_nhanh_id = cn.id
        LEFT JOIN cau_hinh_luong cl ON nv.id = cl.nhan_vien_id
        WHERE 1=1
    """
    
    params = []
    
    # Add filters
    if search:
        query += " AND nv.ho_ten ILIKE %s"
        params.append(f"%{search}%")
    
    if branch_id:
        query += " AND nv.chi_nhanh_id = %s"
        params.append(branch_id)
    
    query += " ORDER BY nv.id ASC"
    
    cursor.execute(query, tuple(params))
    staff_rows = cursor.fetchall()
    
    # Calculate total hours and final salary for each staff
    result = []
    
    for staff in staff_rows:
        staff_id = staff['staffId']
        salary_type = staff['salaryType']
        base_amount = staff['baseAmount'] or 0
        
        # Get attendance records for this month
        attendance_query = """
            SELECT gio_vao as "checkIn", gio_ra as "checkOut"
            FROM cham_cong
            WHERE nhan_vien_id = %s
              AND EXTRACT(MONTH FROM ngay) = %s
              AND EXTRACT(YEAR FROM ngay) = %s
              AND gio_vao IS NOT NULL
              AND gio_ra IS NOT NULL
        """
        
        cursor.execute(attendance_query, (staff_id, month, year))
        attendance_records = cursor.fetchall()
        
        # Calculate total hours
        total_hours = 0
        for record in attendance_records:
            hours = calculate_work_hours(record['checkIn'], record['checkOut'])
            total_hours += hours
        
        # Calculate final salary based on type
        if salary_type == 'THEO_GIO':
            final_salary = total_hours * base_amount
        elif salary_type == 'THEO_THANG':
            final_salary = base_amount
        else:
            # No salary config
            final_salary = 0
        
        result.append({
            'id': staff_id,
            'name': staff['staffName'],
            'role': staff['role'],
            'branchName': staff['branchName'],
            'salaryType': 'Theo giờ' if salary_type == 'THEO_GIO' else ('Theo tháng' if salary_type == 'THEO_THANG' else 'Chưa cấu hình'),
            'baseAmount': base_amount,
            'totalHours': round(total_hours, 1),
            'finalSalary': round(final_salary, 0)
        })
    
    conn.close()
    print(f"[PAYROLL SHEET] Calculated for {len(result)} staff members")
    return result

# --- Chạy Server ---
if __name__ == "__main__":
    import uvicorn
    print("🚀 Server đang chạy tại https://8199be435802.ngrok-free.app")
    uvicorn.run(app, host="127.0.0.1", port=8000)