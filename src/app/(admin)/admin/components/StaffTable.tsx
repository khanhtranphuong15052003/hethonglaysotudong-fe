"use client";

import { useEffect, useState, useCallback } from "react";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  assignCounterToStaff,
  getCounters,
  Staff,
  Counter,
} from "@/services/admin.service";
import { useToast } from "@/hooks/useToast";
import { useAdminSessionGuard } from "@/hooks/useAdminSessionGuard";
import ToastContainer from "@/components/ToastContainer";
import Pagination from "./Pagination";
import AdminTableFilter from "./AdminTableFilter";
import "@/styles/admin-table.css";

export default function StaffTable() {
  const { toasts, removeToast, success, error } = useToast();
  const guardSession = useAdminSessionGuard();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCounterId, setFilterCounterId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    counterId: null as string | null,
    isActive: true,
  });

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStaff();
      setStaffList(data);
    } catch (err) {
      if (guardSession(err)) {
        return;
      }
      console.error("Failed to fetch staff:", err);
      error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }, [error, guardSession]);

  const fetchCounters = useCallback(async () => {
    try {
      const data = await getCounters();
      setCounters(data);
    } catch (err) {
      if (guardSession(err)) {
        return;
      }
      console.error("Failed to fetch counters:", err);
      error("Không thể tải danh sách quầy");
    }
  }, [error, guardSession]);

  useEffect(() => {
    void fetchStaff();
    void fetchCounters();
  }, [fetchStaff, fetchCounters]);

  const handleOpenModal = (staff?: Staff) => {
    if (staff) {
      setEditingId(staff._id);
      setFormData({
        username: staff.username,
        password: "", // Don't pre-fill password
        fullName: staff.fullName,
        counterId: staff.counterId?._id || null,
        isActive: staff.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        username: "",
        password: "",
        fullName: "",
        counterId: null,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleDelete = (staffId: string) => {
    setPendingDeleteId(staffId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      try {
        await deleteStaff(pendingDeleteId);
        success("Xóa nhân viên thành công");
        fetchStaff();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Xóa nhân viên thất bại";
        error(errorMessage);
      }
    }
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  };

  const handleSave = async () => {
    if (!formData.username || !formData.fullName) {
      error("Vui lòng nhập tên đăng nhập và họ tên");
      return;
    }
    if (!editingId && !formData.password) {
      error("Vui lòng nhập mật khẩu cho nhân viên mới");
      return;
    }

    try {
      let savedStaff;
      if (editingId) {
        const payload: {
          fullName: string;
          isActive: boolean;
          password?: string;
        } = {
          fullName: formData.fullName,
          isActive: formData.isActive,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        savedStaff = await updateStaff(editingId, payload);
        if (formData.counterId !== (staffList.find(s => s._id === editingId)?.counterId?._id || null)) {
            await assignCounterToStaff(editingId, formData.counterId);
        }
      } else {
        savedStaff = await createStaff({
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
        });
        if (formData.counterId) {
            await assignCounterToStaff(savedStaff._id, formData.counterId);
        }
      }
      success(editingId ? "Cập nhật thành công" : "Tạo nhân viên thành công");
      fetchStaff();
      handleCloseModal();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lưu thông tin thất bại";
      error(errorMessage);
    }
  };

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCounter =
      filterCounterId === "all" ||
      (filterCounterId === "unassigned"
        ? !staff.counterId
        : staff.counterId?._id === filterCounterId);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" ? staff.isActive : !staff.isActive);

    return matchesSearch && matchesCounter && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const currentItems = filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCounterId, filterStatus]);

  return (
    <div className="admin-table-container">
      <div className="admin-table-header">
        <div className="font-bold text-2xl" style={{ color: "#003366" }}>
          QUẢN LÝ NHÂN VIÊN
        </div>
        <div className="admin-table-actions">
          <AdminTableFilter
            activeCount={[filterCounterId, filterStatus].filter(
              (value) => value !== "all",
            ).length}
            onReset={() => {
              setFilterCounterId("all");
              setFilterStatus("all");
            }}
            sections={[
              {
                id: "staff-counter",
                label: "Quầy trực",
                value: filterCounterId,
                onChange: setFilterCounterId,
                options: [
                  { label: "Tất cả quầy", value: "all" },
                  { label: "Chưa gán quầy", value: "unassigned" },
                  ...[...counters]
                    .sort((a, b) => a.number - b.number)
                    .map((counter) => ({
                      label: `${counter.name} (${counter.code})`,
                      value: counter._id,
                    })),
                ],
              },
              {
                id: "staff-status",
                label: "Trạng thái",
                value: filterStatus,
                onChange: setFilterStatus,
                options: [
                  { label: "Tất cả trạng thái", value: "all" },
                  { label: "Hoạt động", value: "active" },
                  { label: "Vô hiệu", value: "inactive" },
                ],
              },
            ]}
          />
          <input
            type="text"
            className="admin-table-search"
            placeholder="Tìm kiếm nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="admin-table-btn" onClick={() => handleOpenModal()}>
            + Thêm Mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-table-loading">Đang tải...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên đăng nhập</th>
              <th>Họ và tên</th>
              <th>Quầy trực</th>
              <th>Trạng thái</th>
              <th>Đăng nhập lần cuối</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((staff) => (
              <tr key={staff._id}>
                <td><strong>{staff.username}</strong></td>
                <td>{staff.fullName}</td>
                <td>{staff.counterId ? `${staff.counterId.name} (${staff.counterId.code})` : <span style={{color: '#999'}}>Chưa gán</span>}</td>
                <td>
                  <span className={`table-cell-status ${staff.isActive ? "status-true" : "status-false"}`}>
                    {staff.isActive ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </td>
                <td>{staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : "Chưa đăng nhập"}</td>
                <td>
                  <div className="table-actions">
                    <button className="table-action-btn table-action-edit" onClick={() => handleOpenModal(staff)} title="Sửa">
                      <FiEdit size={18} />
                    </button>
                    <button className="table-action-btn table-action-delete" onClick={() => handleDelete(staff._id)} title="Xóa">
                      <RiDeleteBin6Line size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {filteredStaff.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <div className="admin-table-footer">
        <span>Tổng cộng: {filteredStaff.length} nhân viên (Trang {currentPage}/{totalPages})</span>
      </div>

      {showModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <button className="admin-modal-close" onClick={handleCloseModal}>×</button>
            <h3>{editingId ? "Chỉnh Sửa Nhân Viên" : "Thêm Nhân Viên Mới"}</h3>

            <div className="admin-form-group">
              <label className="admin-form-label">Tên đăng nhập:</label>
              <input type="text" className="admin-form-input" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} disabled={!!editingId} />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Mật khẩu:</label>
              <input type="password" className="admin-form-input" placeholder={editingId ? "Để trống nếu không đổi" : ""} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Họ và tên:</label>
              <input type="text" className="admin-form-input" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Gán quầy:</label>
              <select className="admin-form-input" value={formData.counterId || ""} onChange={(e) => setFormData({ ...formData, counterId: e.target.value || null })}>
                <option value="">Không gán</option>
                {counters.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
             <div className="admin-form-group">
                <label>
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}/>
                    Kích hoạt tài khoản
                </label>
            </div>

            <div className="admin-form-actions">
              <button className="submit" onClick={handleSave}>Lưu</button>
              <button className="cancel" onClick={handleCloseModal}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="admin-modal">
          <div style={{ background: "white", borderRadius: "8px", padding: "30px", maxWidth: "400px", textAlign: "center" }}>
            <h3>Xác Nhận Xóa</h3>
            <p>Bạn có chắc chắn muốn xóa nhân viên này?</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={handleConfirmDelete} style={{ padding: "10px 20px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px" }}>Xóa</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px" }}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
