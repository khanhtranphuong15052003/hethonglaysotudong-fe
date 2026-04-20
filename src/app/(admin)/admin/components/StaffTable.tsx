"use client";

import { useEffect, useState, useCallback } from "react";
import { FiEdit, FiRepeat } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  assignCounterToStaff,
  getCounters,
  updateStaffServices,
  Staff,
  Counter,
  StaffServiceInfo,
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

  // Service assignment modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceModalStaff, setServiceModalStaff] = useState<Staff | null>(null);
  const [availableServices, setAvailableServices] = useState<StaffServiceInfo[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [serviceModalLoading, setServiceModalLoading] = useState(false);
  const [serviceModalSaving, setServiceModalSaving] = useState(false);
  const [serviceRestrictionConfigured, setServiceRestrictionConfigured] = useState(false);
  const [formAvailableServices, setFormAvailableServices] = useState<StaffServiceInfo[]>([]);
  const [formSelectedServiceIds, setFormSelectedServiceIds] = useState<Set<string>>(new Set());

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
////const parse errors
const parseApiError = (err: any): string => {
  // axios style
  const data = err?.response?.data;

  if (!data) return err.message || "Lỗi không xác định";

  // 1. Nếu có errors detail
  if (data.errors) {
    const firstErrorKey = Object.keys(data.errors)[0];
    const firstError = data.errors[firstErrorKey];

    if (typeof firstError === "string") return firstError;
    if (firstError?.message) return firstError.message;
  }

  // 2. fallback message
  if (data.message) return data.message;

  return "Lỗi không xác định";
};
/////////////////////////////////////
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
      const counterServices =
        counters.find((counter) => counter._id === (staff.counterId?._id || ""))?.services || [];
      const normalizedAvailableServices: StaffServiceInfo[] = counterServices.map((service) => ({
        id: service._id,
        _id: service._id,
        code: service.code,
        name: service.name,
        icon: service.icon,
        displayOrder: service.displayOrder,
      }));
      const initialSelectedServiceIds =
        staff.serviceRestrictionConfigured && staff.assignedServices
          ? new Set(staff.assignedServices.map((service) => service.id || service._id))
          : new Set(normalizedAvailableServices.map((service) => service.id || service._id));

      setEditingId(staff._id);
      setFormData({
        username: staff.username,
        password: "",
        fullName: staff.fullName,
        counterId: staff.counterId?._id || null,
        isActive: staff.isActive,
      });
      setFormAvailableServices(normalizedAvailableServices);
      setFormSelectedServiceIds(initialSelectedServiceIds);
    } else {
      setEditingId(null);
      setFormData({
        username: "",
        password: "",
        fullName: "",
        counterId: null,
        isActive: true,
      });
      setFormAvailableServices([]);
      setFormSelectedServiceIds(new Set());
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormAvailableServices([]);
    setFormSelectedServiceIds(new Set());
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

    let savedStaff: Staff | undefined;
    const previousCounterId = editingId
      ? (staffList.find((s) => s._id === editingId)?.counterId?._id ?? null)
      : null;

    try {
     if (editingId) {
  // ===== BUILD PAYLOAD =====
  const payload: {
    fullName: string;
    isActive: boolean;
    password?: string;
    counterId?: string | null;
  } = {
    fullName: formData.fullName,
    isActive: formData.isActive,
  };

  if (formData.password) {
    payload.password = formData.password;
  }

  // ✅ xử lý phòng (quan trọng nhất)
if (formData.counterId !== previousCounterId) {
  if (formData.counterId) {
    // có phòng → assign API
    savedStaff = await assignCounterToStaff(
      editingId,
      formData.counterId
    );
  } else {
    // bỏ phòng → update trực tiếp
    savedStaff = await updateStaff(editingId, {
      fullName: formData.fullName,
      isActive: formData.isActive,
      counterId: null,
    });
  }
}
  // ===== UPDATE 1 LẦN DUY NHẤT =====
 savedStaff = await updateStaff(editingId, {
  fullName: formData.fullName,
  isActive: formData.isActive,
  counterId: formData.counterId,
});

  // ===== GÁN QUẦY =====
  if (formData.counterId) {
    try {
      await updateStaffServices(
        savedStaff._id,
        Array.from(formSelectedServiceIds)
      );
    } catch (svcErr) {
      const msg = svcErr instanceof Error ? svcErr.message : "";
      console.warn("Gán quầy thất bại:", msg);
    }
  } else {
    // ✅ nếu bỏ phòng → reset luôn quầy
    setFormSelectedServiceIds(new Set());
  }

  success("Cập nhật thành công");
} else {

  // ===== CREATE MODE =====
  savedStaff = await createStaff({
    username: formData.username,
    password: formData.password,
    fullName: formData.fullName,
  });

  if (formData.counterId) {
    // 1. Gán phòng
    savedStaff = await assignCounterToStaff(
      savedStaff._id,
      formData.counterId
    );

    // tránh BE chưa kịp cập nhật
    await new Promise((r) => setTimeout(r, 200));

    // 2. Gán quầy
    if (formSelectedServiceIds.size > 0) {
      try {
        await updateStaffServices(
          savedStaff._id,
          Array.from(formSelectedServiceIds)
        );
      } catch (svcErr) {
        const msg = svcErr instanceof Error ? svcErr.message : "";
        console.warn("Gán quầy khi tạo lỗi:", msg);

        error("Tạo thành công nhưng gán quầy thất bại");
      }
    }
  }

  success("Tạo nhân viên thành công");
}


} catch (err) {
  await fetchStaff();

const errorMessage = parseApiError(err);
error(errorMessage);

  return;
}

    handleCloseModal();
    await fetchStaff();
  };

  const handleOpenServiceModal = async (staff: Staff) => {
    setServiceModalStaff(staff);
    setShowServiceModal(true);
    setServiceModalLoading(true);
    try {
      const counterServices =
        counters.find((counter) => counter._id === (staff.counterId?._id || ""))?.services || [];
      const normalizedAvailableServices: StaffServiceInfo[] = counterServices.map((service) => ({
        id: service._id,
        _id: service._id,
        code: service.code,
        name: service.name,
        icon: service.icon,
        displayOrder: service.displayOrder,
      }));
      const initialSelectedServiceIds =
        staff.serviceRestrictionConfigured && staff.assignedServices
          ? new Set(staff.assignedServices.map((service) => service.id || service._id))
          : new Set(normalizedAvailableServices.map((service) => service.id || service._id));
      setAvailableServices(normalizedAvailableServices);
      setSelectedServiceIds(initialSelectedServiceIds);
      setServiceRestrictionConfigured(Boolean(staff.serviceRestrictionConfigured));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi tải quầy";
      error(msg);
      setShowServiceModal(false);
    } finally {
      setServiceModalLoading(false);
    }
  };

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const handleFormCounterChange = (counterId: string | null) => {
    const counterServices =
      counters.find((counter) => counter._id === (counterId || ""))?.services || [];
    const normalizedAvailableServices: StaffServiceInfo[] = counterServices.map((service) => ({
      id: service._id,
      _id: service._id,
      code: service.code,
      name: service.name,
      icon: service.icon,
      displayOrder: service.displayOrder,
    }));

    setFormData((prev) => ({ ...prev, counterId }));
    setFormAvailableServices(normalizedAvailableServices);
    setFormSelectedServiceIds(
      new Set(normalizedAvailableServices.map((service) => service.id || service._id)),
    );
  };

  const handleToggleFormService = (serviceId: string) => {
    setFormSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const handleSaveServices = async () => {
    if (!serviceModalStaff) return;
    setServiceModalSaving(true);
    try {
      await updateStaffServices(serviceModalStaff._id, Array.from(selectedServiceIds));
      success("Cập nhật quầy thành công");
      setShowServiceModal(false);
      fetchStaff();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi lưu quầy";
      const is404 = msg.includes("404") || msg.toLowerCase().includes("not found");
      if (is404) {
        error("API gán quầy trả 404 — route chưa được deploy trên server. Vui lòng kiểm tra backend.");
      } else {
        error(msg);
      }
    } finally {
      setServiceModalSaving(false);
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

  const getCounterDisplay = (staff: Staff) => {
    if (!staff.counterId) {
      return null;
    }

    const matchedCounter = counters.find(
      (counter) => counter._id === staff.counterId?._id,
    );
    const counterCode = staff.counterId.code || matchedCounter?.code || "";

    return `${staff.counterId.name}${counterCode ? ` (${counterCode})` : ""}`;
  };

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
                label: "Phòng trực",
                value: filterCounterId,
                onChange: setFilterCounterId,
                options: [
                  { label: "Tất cả phòng", value: "all" },
                  { label: "Chưa gán phòng", value: "unassigned" },
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
              <th>Phòng trực</th>
              <th>Quầy trực</th>
              <th>Trạng thái</th>
              <th>Đăng nhập</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((staff) => (
              <tr key={staff._id}>
                <td><strong>{staff.username}</strong></td>
                <td>{staff.fullName}</td>
                <td>{staff.counterId ? getCounterDisplay(staff) : <span style={{color: '#999'}}>Chưa gán</span>}</td>
                <td>
                  {staff.serviceRestrictionConfigured === false ? (
                    <span style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9em' }}>Tất cả (mặc định)</span>
                  ) : staff.effectiveServices && staff.effectiveServices.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {staff.effectiveServices.slice(0, 2).map((s) => (
                        <span key={s.id || s._id} style={{ background: '#e8f0fe', color: '#003366', borderRadius: 4, padding: '2px 7px', fontSize: '0.82em', fontWeight: 600 }}>
                          {s.name}
                        </span>
                      ))}
                      {staff.effectiveServices.length > 2 && (
                        <span style={{ color: '#888', fontSize: '0.82em' }}>+{staff.effectiveServices.length - 2}</span>
                      )}
                    </div>
                  ) : staff.serviceRestrictionConfigured ? (
                    <span style={{ color: '#dc3545', fontSize: '0.9em' }}>Không có quầy</span>
                  ) : (
                    <span style={{ color: '#999', fontStyle: 'italic', fontSize: '0.9em' }}>Chưa cấu hình</span>
                  )}
                </td>
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
                    <button
                      className="table-action-btn"
                      style={{ background: "transparent", color: "#000", border: "none" }}
                      onClick={() => handleOpenServiceModal(staff)}
                      title="Phân quyền quầy"
                      disabled={!staff.counterId}
                    >
                      <FiRepeat size={16} color="#000" />
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
  <span>
    Hiển thị {currentItems.length} trên tổng số {filteredStaff.length} kết quả
  </span>

</div>

    {showModal && (
  <div className="admin-modal">
    <div className="admin-modal-content">
      <button className="admin-modal-close" onClick={handleCloseModal}>✕</button>
      <h3>{editingId ? "Chỉnh Sửa Nhân Viên" : "Thêm Nhân Viên Mới"}</h3>

      <div className="admin-form-grid">
        {/* ===== LEFT COLUMN ===== */}
        <div className="admin-form-left">
          <div className="admin-form-group">
            <label className="admin-form-label">Tên đăng nhập:</label>
            <input
              type="text"
              className="admin-form-input"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              disabled={!!editingId}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Mật khẩu:</label>
            <input
              type="password"
              className="admin-form-input"
              placeholder={editingId ? "Để trống nếu không đổi mật khẩu" : ""}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Họ và tên:</label>
            <input
              type="text"
              className="admin-form-input"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="admin-form-right">
          <div className="admin-form-group">
            <label className="admin-form-label">Gán phòng:</label>
            <select
              className="admin-form-input"
              value={formData.counterId || ""}
              onChange={(e) =>
                handleFormCounterChange(e.target.value || null)
              }
            >
              <option value="">Không gán</option>
              {counters.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            <div className="admin-form-hint">
              Sau khi lưu gán phòng, hệ thống sẽ chuyển sang bước chọn quầy.
            </div>
          </div>

          {/* ===== SERVICES (EDIT MODE) ===== */}
         {formData.counterId && (
            <div className="admin-form-group">
              <label className="admin-form-label">
                Quầy áp dụng cho nhân viên
              </label>

              {formAvailableServices.length === 0 ? (
                <div className="admin-empty">
                  Phòng này chưa có quầy nào.
                </div>
              ) : (
                <div className="admin-service-list">
                  {formAvailableServices.map((service) => {
                    const id = service.id || service._id;
                    const checked = formSelectedServiceIds.has(id);

                    return (
                      <label
                        key={id}
                        className={`admin-service-item ${
                          checked ? "active" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleFormService(id)}
                        />
                        <div>
                          <div className="service-name">
                            {service.name}
                          </div>
                          <div className="service-code">
                            {service.code}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {formAvailableServices.length > 0 &&
                formSelectedServiceIds.size === 0 && (
                  <div className="admin-error">
                    Không chọn quầy nào.
                  </div>
                )}
            </div>
          )}

          {/* ===== CREATE MODE NOTE ===== */}
    

          <div className="admin-form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isActive: e.target.checked,
                  })
                }
              />
              {" "}Kích hoạt tài khoản
            </label>
          </div>
        </div>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="admin-form-actions">
        <button className="submit" onClick={handleSave}>
          Lưu
        </button>
        <button className="cancel" onClick={handleCloseModal}>
          Hủy
        </button>
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

      {/* Service Assignment Modal */}
      {showServiceModal && serviceModalStaff && (
        <div className="admin-modal">
          <div className="admin-modal-content" style={{ maxWidth: 480 }}>
            <button className="admin-modal-close" onClick={() => setShowServiceModal(false)}>✕</button>
            <h3>Phân quyền quầy - {serviceModalStaff.fullName}</h3>
            {!serviceModalStaff.counterId && (
              <p style={{ color: '#856404', background: '#fff3cd', padding: '8px 12px', borderRadius: 6, fontSize: 14 }}>
                Nhân viên chưa được gán phòng, vui lòng gán phòng trước.
              </p>
            )}
            {serviceModalLoading ? (
              <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>Đang tải quầy...</p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
                  {serviceRestrictionConfigured
                    ? 'Nhân viên đang áp dụng giới hạn quầy riêng. Hãy chọn rõ quầy nào được áp dụng cho nhân viên này.'
                    : 'Chưa cấu hình — nhân viên đang xử lý tất cả quầy của phòng.'}
                </p>
                {availableServices.length === 0 ? (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>Phòng không có quầy nào.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {availableServices.map((svc) => {
                      const id = svc.id || svc._id;
                      const checked = selectedServiceIds.has(id);
                      return (
                        <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 6, background: checked ? '#e8f0fe' : '#f9f9f9', border: `1px solid ${checked ? '#4a7fd4' : '#ddd'}` }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleService(id)}
                            style={{ width: 16, height: 16 }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#003366' }}>{svc.name}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{svc.code}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
               
                <div className="admin-form-actions">
                  <button className="submit" onClick={handleSaveServices} disabled={serviceModalSaving}>
                    {serviceModalSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button className="cancel" onClick={() => setShowServiceModal(false)}>Hủy</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
