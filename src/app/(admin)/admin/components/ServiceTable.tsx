"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import * as RiIcons from "react-icons/ri";
import {
  getServices,
  getCounters,
  createService,
  updateService,
  deleteService,
  addServicesToCounter,
  removeServiceFromCounter,
  Counter,
  Service,
} from "@/services/admin.service";
import { FONTAWESOME_ICONS } from "@/constants/icons";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";
import Pagination from "./Pagination";
import "@/styles/admin-table.css";

// Helper function to get icon component from name
const getIconComponent = (iconName: string) => {
  const Icon = (RiIcons as Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>>)[iconName];
  return Icon || null;
};

export default function ServiceTable() {
  const { toasts, removeToast, success, error } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCounters, setSelectedCounters] = useState<string[]>([]);
  const [initialCounters, setInitialCounters] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Đặt 10 items mỗi trang để chuyên nghiệp hơn, hoặc 1 theo yêu cầu

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<
    boolean | null
  >(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    icon: "",
    description: "",
    displayOrder: 1,
    isActive: true,
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const data = await getServices();
    setServices(data);
    setLoading(false);
  }, []);

  const fetchCounters = useCallback(async () => {
    const data = await getCounters();
    setCounters(data);
  }, []);

  useEffect(() => {
    void fetchServices();
    void fetchCounters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingId(service._id);
      setFormData({
        code: service.code,
        name: service.name,
        icon: service.icon,
        description: service.description,
        displayOrder: service.displayOrder,
        isActive: service.isActive,
      });
      const counterIds = service.counters?.map((counter) => counter._id) || [];
      setSelectedCounters(counterIds);
      setInitialCounters(counterIds);
    } else {
      setEditingId(null);
      setFormData({
        code: "",
        name: "",
        icon: "",
        description: "",
        displayOrder: 1,
        isActive: true,
      });
      setSelectedCounters([]);
      setInitialCounters([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      icon: "",
      description: "",
      displayOrder: 1,
      isActive: true,
    });
    setSelectedCounters([]);
    setInitialCounters([]);
  };

  const handleCounterToggle = (counterId: string) => {
    if (selectedCounters.includes(counterId)) {
      setSelectedCounters((prev) => prev.filter((id) => id !== counterId));
      return;
    }
    setSelectedCounters((prev) => [...prev, counterId]);
  };

  const handleStatusChange = (newStatus: boolean) => {
    setPendingStatusChange(newStatus);
    setShowStatusConfirm(true);
  };

  const handleConfirmStatus = () => {
    if (pendingStatusChange !== null) {
      setFormData({ ...formData, isActive: pendingStatusChange });
    }
    setShowStatusConfirm(false);
    setPendingStatusChange(null);
  };

  const handleDelete = (serviceId: string) => {
    setPendingDeleteId(serviceId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      try {
        await deleteService(pendingDeleteId);
        success("Xóa dịch vụ thành công");
        fetchServices();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Xóa dịch vụ thất bại";
        error(errorMessage);
      }
    }
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      error("Vui lòng nhập mã và tên dịch vụ");
      return;
    }

    try {
      if (editingId) {
        await updateService(editingId, formData);

        const removedCounterIds = initialCounters.filter(
          (counterId) => !selectedCounters.includes(counterId),
        );
        if (removedCounterIds.length > 0) {
          await Promise.all(
            removedCounterIds.map((counterId) =>
              removeServiceFromCounter(counterId, editingId),
            ),
          );
        }

        const addedCounterIds = selectedCounters.filter(
          (counterId) => !initialCounters.includes(counterId),
        );
        if (addedCounterIds.length > 0) {
          await Promise.all(
            addedCounterIds.map((counterId) =>
              addServicesToCounter(counterId, [editingId]),
            ),
          );
        }

        success("Cập nhật dịch vụ thành công");
        fetchServices();
        fetchCounters();
        handleCloseModal();
      } else {
        const createdService = await createService({
          code: formData.code,
          name: formData.name,
          icon: formData.icon,
          description: formData.description,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        });

        await Promise.all(
          selectedCounters.map((counterId) =>
            addServicesToCounter(counterId, [createdService._id]),
          ),
        );

        success("Tạo dịch vụ thành công");
        fetchServices();
        fetchCounters();
        handleCloseModal();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi lưu dịch vụ";
      error(errorMessage);
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedServices = filteredServices.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="admin-table-container">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      <div className="admin-table-header">
        <div className="font-bold text-2xl" style={{ color: "#003366" }}>
          QUẢN LÝ DỊCH VỤ
        </div>
        <div className="admin-table-actions">
          <input
            type="text"
            className="admin-table-search"
            placeholder="Tìm kiếm mã hoặc tên dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="admin-table-btn" onClick={() => handleOpenModal()}>
            + Thêm Mới
          </button>
        </div>
      </div>
      <div className="admin-table-body">
        <table className="admin-table service-table">
          <thead>
            <tr>
              <th>Thứ tự</th>
              <th>Mã dịch vụ</th>
              <th>Tên dịch vụ</th>
              <th>Quầy dịch vụ</th>
              <th>Trạng thái</th>
              <th>Mô tả</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-table-loading">
                  Đang tải...
                </td>
              </tr>
            ) : paginatedServices.length > 0 ? (
              paginatedServices.map((service) => (
                <tr key={service._id}>
                  <td>{service.displayOrder}</td>
                  <td>{service.code}</td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {service.icon &&
                        getIconComponent(service.icon) &&
                        React.createElement(getIconComponent(service.icon)!, {
                          size: 16,
                          style: { marginRight: "8px" },
                        })}
                      {service.name}
                    </span>
                  </td>
                  <td>
                    <div className="table-cell-counters">
                      {service.counters?.map((counter) => (
                        <span key={counter._id}>
                          {counter.name} ({counter.code})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`table-cell-status ${
                        service.isActive ? "status-active" : "status-inactive"
                      }`}
                    >
                      {service.isActive ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td>{service.description}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action-edit"
                        onClick={() => handleOpenModal(service)}
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        className="table-action-delete"
                        onClick={() => handleDelete(service._id)}
                      >
                        <RiDeleteBin6Line size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  Không có dịch vụ nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="admin-table-footer">
        <span>
          Hiển thị {paginatedServices.length} trên tổng số {filteredServices.length}{" "}
          kết quả
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
      {showModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <button className="admin-modal-close" onClick={handleCloseModal}>
              ×
            </button>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>
              {editingId ? "Chỉnh Sửa Dịch Vụ" : "Thêm Dịch Vụ Mới"}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "30px",
              }}
            >
              {/* Left Column - Info & Status */}
              <div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mã Dịch Vụ:</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    disabled={!!editingId}
                    style={{
                      backgroundColor: editingId ? "#f0f0f0" : "#fff",
                      cursor: editingId ? "not-allowed" : "text",
                      opacity: editingId ? 0.6 : 1,
                    }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Số Thứ Tự:</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Tên Dịch Vụ:</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label
                    className="admin-form-label"
                    style={{ marginBottom: "12px" }}
                  >
                    Trạng Thái:
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={formData.isActive}
                        onChange={() => handleStatusChange(true)}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px", color: "#333" }}>
                        Hoạt động
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={!formData.isActive}
                        onChange={() => handleStatusChange(false)}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px", color: "#333" }}>
                        Vô hiệu
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Icon & Description */}
              <div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Biểu tượng</label>
                  <div
                    style={{
                      border: "1px solid #d0d0d0",
                      borderRadius: "4px",
                      padding: "12px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: "8px",
                      marginBottom: "15px",
                    }}
                  >
                    {FONTAWESOME_ICONS.map((icon: any) => {
                      const IconComponent = getIconComponent(icon.class);
                      return (
                        <button
                          key={icon.id}
                          onClick={() =>
                            setFormData({ ...formData, icon: icon.class })
                          }
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "12px",
                            border:
                              formData.icon === icon.class
                                ? "2px solid #003366"
                                : "1px solid #e0e0e0",
                            borderRadius: "4px",
                            backgroundColor:
                              formData.icon === icon.class ? "#f0f7ff" : "#fff",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: formData.icon === icon.class ? 600 : 400,
                            color:
                              formData.icon === icon.class ? "#003366" : "#333",
                            transition: "all 0.2s ease",
                            minHeight: "60px",
                          }}
                          title={icon.name}
                        >
                          {IconComponent ? (
                            <IconComponent
                              size={24}
                              style={{
                                color: "#000",
                                marginBottom: "4px",
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "12px", color: "#999" }}>
                              N/A
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "8px",
                    }}
                  >
                    {/* Đã chọn: <strong>{formData.icon || "Chưa chọn"}</strong> */}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Mô Tả:</label>
                  <textarea
                    className="admin-form-textarea"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    style={{ minHeight: "80px" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label className="admin-form-label">Thêm dịch vụ vào quầy đã có:</label>
                <div
                  style={{
                    border: "1px solid #d0d0d0",
                    borderRadius: "4px",
                    padding: "12px",
                    maxHeight: "160px",
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
                    gap: "10px 14px",
                  }}
                >
                  {counters.length === 0 ? (
                    <span style={{ color: "#999", fontSize: "14px" }}>
                      Chưa có quầy nào
                    </span>
                  ) : (
                    counters.map((counter) => (
                      <label
                        key={counter._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "#333",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCounters.includes(counter._id)}
                          onChange={() => handleCounterToggle(counter._id)}
                          style={{ cursor: "pointer" }}
                        />
                        <span>
                          {counter.name} ({counter.code})
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="admin-form-actions" style={{ marginTop: "30px" }}>
              <button className="submit" onClick={handleSave}>
                Cập nhật
              </button>
              <button className="cancel" onClick={handleCloseModal}>
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Dialog */}
      {showStatusConfirm && (
        <div className="admin-modal">
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "30px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#333" }}>
              Xác Thực Thay Đổi Trạng Thái
            </h3>
            <p
              style={{ marginBottom: "20px", color: "#666", fontSize: "14px" }}
            >
              Bạn có chắc chắn muốn chuyển trạng thái dịch vụ thành{" "}
              <strong
                style={{ color: pendingStatusChange ? "#28a745" : "#dc3545" }}
              >
                {pendingStatusChange ? "Hoạt động" : "Vô hiệu"}
              </strong>
              ?
            </p>
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={handleConfirmStatus}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Xác nhận
              </button>
              <button
                onClick={() => setShowStatusConfirm(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="admin-modal">
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "30px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#333" }}>
              Xác Nhận Xóa Dịch Vụ
            </h3>
            <p
              style={{ marginBottom: "20px", color: "#666", fontSize: "14px" }}
            >
              Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể
              hoàn tác.
            </p>
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Xóa
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
