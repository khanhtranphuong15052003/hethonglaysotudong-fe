"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
  getCounters,
  createCounter,
  updateCounter,
  addServicesToCounter,
  deleteCounter,
  removeServiceFromCounter,
  Counter,
  getServices,
  Service,
} from "@/services/admin.service";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import Pagination from "./Pagination";
import AdminTableFilter from "./AdminTableFilter";
import { getSequentialTagColorStyle } from "@/lib/adminTagColors";
import "@/styles/admin-table.css";

export default function CounterTable() {
  const { toasts, removeToast, success, error } = useToast();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterServiceIds, setFilterServiceIds] = useState<string[]>(["all"]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>(["all"]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [initialServices, setInitialServices] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    number: 1,
    note: "",
    isActive: true,
  });

  const fetchCounters = useCallback(async () => {
    setLoading(true);
    const data = await getCounters();
    setCounters(data);
    setLoading(false);
  }, []);

  const fetchServices = useCallback(async () => {
    const data = await getServices();
    setServices(data);
  }, []);

  useEffect(() => {
    void fetchCounters();
    void fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (counter?: Counter) => {
    if (counter) {
      setEditingId(counter._id);
      setFormData({
        code: counter.code,
        name: counter.name,
        number: counter.number,
        note: counter.note,
        isActive: counter.isActive,
      });
      const serviceIds = counter.services.map((s) => s._id);
      setSelectedServices(serviceIds);
      setInitialServices(serviceIds);
    } else {
      setEditingId(null);
      setFormData({
        code: "",
        name: "",
        number: 1,
        note: "",
        isActive: true,
      });
      setSelectedServices([]);
      setInitialServices([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      number: 1,
      note: "",
      isActive: true,
    });
    setSelectedServices([]);
    setInitialServices([]);
  };

  const handleServiceToggle = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices((prev) => prev.filter((id) => id !== serviceId));
    } else {
      setSelectedServices((prev) => [...prev, serviceId]);
    }
  };

  const handleDelete = (counterId: string) => {
    setPendingDeleteId(counterId);
    setShowDeleteConfirm(true);
  };

  const handleStatusChange = (nextStatus: boolean) => {
    setPendingStatusChange(nextStatus);
    setShowStatusConfirm(true);
  };

  const handleConfirmStatus = () => {
    if (pendingStatusChange !== null) {
      setFormData((prev) => ({ ...prev, isActive: pendingStatusChange }));
    }
    setPendingStatusChange(null);
    setShowStatusConfirm(false);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      try {
        await deleteCounter(pendingDeleteId);
        success("Xóa quầy thành công");
        fetchCounters();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Xóa quầy thất bại";
        error(errorMessage);
      }
    }
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      error("Vui lòng nhập mã và tên phòng");
      return;
    }

    try {
      if (editingId) {
        await updateCounter(editingId, {
          code: formData.code,
          name: formData.name,
          number: formData.number,
          note: formData.note,
          isActive: formData.isActive,
        });

        const removedServiceIds = initialServices.filter(
          (serviceId) => !selectedServices.includes(serviceId),
        );
        if (removedServiceIds.length > 0) {
          await Promise.all(
            removedServiceIds.map((serviceId) =>
              removeServiceFromCounter(editingId, serviceId),
            ),
          );
        }

        const addedServiceIds = selectedServices.filter(
          (serviceId) => !initialServices.includes(serviceId),
        );
        if (addedServiceIds.length > 0) {
          await addServicesToCounter(editingId, addedServiceIds);
        }

        success("Cập nhật phòng thành công");
        fetchCounters();
        handleCloseModal();
      } else {
        const result = await createCounter({
          code: formData.code,
          name: formData.name,
          number: formData.number,
          note: formData.note,
          isActive: formData.isActive,
        });
        
        if (selectedServices.length > 0) {
          await addServicesToCounter(result._id, selectedServices);
        }
        
        success("Tạo phòng thành công");
        fetchCounters();
        handleCloseModal();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi lưu phòng";
      error(errorMessage);
    }
  };

  const filteredCounters = counters.filter((counter) => {
    const matchesSearch =
      counter.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counter.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService =
      filterServiceIds.includes("all") ||
      counter.services.some((service) => filterServiceIds.includes(service._id));
    const matchesStatus =
      filterStatuses.includes("all") ||
      (filterStatuses.includes("active") && counter.isActive) ||
      (filterStatuses.includes("inactive") && !counter.isActive);

    return matchesSearch && matchesService && matchesStatus;
  });

  const serviceColorMap = new Map(
    [...services]
      .sort(
        (a, b) =>
          a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
      )
      .map((service, index) => [
        service._id,
        getSequentialTagColorStyle(index),
      ]),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCounters.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedCounters = filteredCounters.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterServiceIds, filterStatuses]);

  return (
    <div className="admin-table-container">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      <div className="admin-table-header">
        <div className="font-bold text-2xl" style={{ color: "#003366" }}>
          QUẢN LÝ PHÒNG
        </div>
        <div className="admin-table-actions">
          <AdminTableFilter
            activeCount={
              (filterServiceIds.includes("all") ? 0 : filterServiceIds.length) +
              (filterStatuses.includes("all") ? 0 : filterStatuses.length)
            }
            onReset={() => {
              setFilterServiceIds(["all"]);
              setFilterStatuses(["all"]);
            }}
            sections={[
              {
                id: "counter-service",
                label: "Phòng",
                value: filterServiceIds,
                onChange: setFilterServiceIds,
                options: [
                  { label: "Tất cả phòng", value: "all" },
                  ...[...services]
                    .sort(
                      (a, b) =>
                        a.displayOrder - b.displayOrder ||
                        a.name.localeCompare(b.name),
                    )
                    .map((service) => ({
                      label: `${service.name} (${service.code})`,
                      value: service._id,
                    })),
                ],
              },
              {
                id: "counter-status",
                label: "Trạng thái",
                value: filterStatuses,
                onChange: setFilterStatuses,
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
            placeholder="Tìm kiếm mã hoặc tên phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="admin-table-btn" onClick={() => handleOpenModal()}>
            + Thêm Mới
          </button>
        </div>
      </div>
      <div className="admin-table-body">
        <table className="admin-table counter-table">
          <thead>
            <tr>
              <th>Thứ Tự</th>
              <th>Tên Phòng</th>
              <th>Mã Phòng</th>
              <th>Tên Quầy</th>
              <th>Trạng Thái</th>
              <th>Mô tả</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-table-loading">
                  Đang tải...
                </td>
              </tr>
            ) : paginatedCounters.length > 0 ? (
              paginatedCounters.map((counter) => (
                <tr key={counter._id}>
                  <td>{counter.number}</td>
                  <td>{counter.name}</td>
                  <td>{counter.code}</td>
                  <td>
                    <div className="table-cell-counters">
                      {counter.services.map((service) => (
                        <span
                          key={service._id}
                          className="table-cell-tag"
                          style={{
                            background:
                              serviceColorMap.get(service._id)?.background ||
                              "#bfdbfe",
                            borderLeftColor:
                              serviceColorMap.get(service._id)?.border ||
                              "#2563eb",
                            color:
                              serviceColorMap.get(service._id)?.color ||
                              "#1e3a8a",
                          }}
                        >
                          {service.name} ({service.code})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`table-cell-status ${
                        counter.isActive ? "status-active" : "status-inactive"
                      }`}
                    >
                      {counter.isActive ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td>{counter.note}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action-edit"
                        onClick={() => handleOpenModal(counter)}
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        className="table-action-delete"
                        onClick={() => handleDelete(counter._id)}
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
                  Không có quầy nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="admin-table-footer admin-table-footer-inline">
        <span>
          Hiển thị {paginatedCounters.length} trên tổng số {filteredCounters.length}{" "}
          kết quả
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="admin-pagination-inline"
        />
      </div>
      {showModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <button className="admin-modal-close" onClick={handleCloseModal}>
              ×
            </button>
            <h3
              className="text-2xl font-bold"
              style={{ marginTop: 0, marginBottom: 20 }}
            >
              {editingId ? "Chỉnh sửa phòng" : "Thêm Phòng Mới"}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "30px",
              }}
            >
              {/* Left Column - Form Fields */}
              <div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mã Phòng:</label>
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
                  <label className="admin-form-label">Tên Phòng:</label>
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
                  <label className="admin-form-label">Số Thứ Tự:</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        number: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Trạng Thái:</label>
                  <label className="admin-checkbox-card">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleStatusChange(e.target.checked)}
                    />
                    <div>
                      <div className="admin-checkbox-card-title">
                        {formData.isActive ? "Hoạt động" : "Vô hiệu"}
                      </div>
                      <div className="admin-checkbox-card-description">
                        Bật checkbox là hoạt động, bỏ chọn là vô hiệu
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Right Column - Services and Description */}
              <div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Quầy Phục Vụ:</label>
                  <div
                    style={{
                      border: "1px solid #d0d0d0",
                      borderRadius: "4px",
                      padding: "12px",
                      height: "280px",
                      overflowY: "auto",
                      marginBottom: "20px",
                    }}
                  >
                    {services.map((service) => (
                      <label
                        key={service._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "8px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service._id)}
                          onChange={() => handleServiceToggle(service._id)}
                          style={{ marginRight: "8px", cursor: "pointer" }}
                        />
                        {service.name} ({service.code})
                      </label>
                    ))}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả:</label>
                  <textarea
                    className="admin-form-textarea"
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                  />
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

      <AdminConfirmDialog
        isOpen={showStatusConfirm}
        title="Xác thực thay đổi trạng thái"
        message={`Bạn có chắc chắn muốn chuyển trạng thái phòng thành ${pendingStatusChange ? "Hoạt động" : "Vô hiệu"}?`}
        onConfirm={handleConfirmStatus}
        onCancel={() => {
          setShowStatusConfirm(false);
          setPendingStatusChange(null);
        }}
      />

      <AdminConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa phòng"
        message="Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
