"use client";

import { useCallback, useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
  createPrinter,
  deletePrinter,
  getPrinters,
  Printer,
  updatePrinter,
} from "@/services/admin.service";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import Pagination from "./Pagination";
import AdminTableFilter from "./AdminTableFilter";
import "@/styles/admin-table.css";

export default function PrinterTable() {
  const { toasts, removeToast, success, error } = useToast();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatuses, setFilterStatuses] = useState<string[]>(["all"]);
  const [filterDefaults, setFilterDefaults] = useState<string[]>(["all"]);
  const [filterTypes, setFilterTypes] = useState<string[]>(["all"]);
  const [filterLocations, setFilterLocations] = useState<string[]>(["all"]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  type PrinterFormData = Omit<Printer, "_id" | "services">;

  const [formData, setFormData] = useState<PrinterFormData>({
    name: "",
    code: "",
    type: "network",
    connection: {
      host: "",
      port: 9100,
    },
    location: "",
    isActive: true,
    isDefault: false,
  });

  const fetchPrinters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPrinters();
      setPrinters(data);
    } catch {
      error("Không thể tải danh sách máy in");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchPrinters();
  }, [fetchPrinters]);

  const handleOpenModal = (printer?: Printer) => {
    if (printer) {
      setEditingId(printer._id);
      setFormData({
        name: printer.name,
        code: printer.code,
        type: printer.type,
        connection: {
          host: printer.connection.host || "",
          port: printer.connection.port || 9100,
        },
        location: printer.location,
        isActive: printer.isActive,
        isDefault: printer.isDefault,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        code: "",
        type: "network",
        connection: {
          host: "",
          port: 9100,
        },
        location: "",
        isActive: true,
        isDefault: false,
      });
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleDelete = (printerId: string) => {
    setPendingDeleteId(printerId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deletePrinter(pendingDeleteId);
      success("Xóa máy in thành công");
      await fetchPrinters();
    } catch (err) {
      error(err instanceof Error ? err.message : "Xóa máy in thất bại");
    } finally {
      setShowDeleteConfirm(false);
      setPendingDeleteId(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.connection.host) {
      error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    const payload = {
      ...formData,
      connection: {
        host: formData.connection.host,
        port: Number(formData.connection.port),
      },
    };

    try {
      if (editingId) {
        await updatePrinter(editingId, payload);
        success("Cập nhật máy in thành công");
      } else {
        await createPrinter(payload);
        success("Tạo máy in thành công");
      }

      await fetchPrinters();
      handleCloseModal();
    } catch (err) {
      error(err instanceof Error ? err.message : "Lưu máy in thất bại");
    }
  };

  const filteredPrinters = printers.filter((printer) => {
    const matchesSearch =
      printer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      printer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      printer.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatuses.includes("all") ||
      (filterStatuses.includes("active") && printer.isActive) ||
      (filterStatuses.includes("inactive") && !printer.isActive);
    const matchesDefault =
      filterDefaults.includes("all") ||
      (filterDefaults.includes("default") && printer.isDefault) ||
      (filterDefaults.includes("not-default") && !printer.isDefault);
    const matchesType =
      filterTypes.includes("all") || filterTypes.includes(printer.type);
    const matchesLocation =
      filterLocations.includes("all") || filterLocations.includes(printer.location || "");

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDefault &&
      matchesType &&
      matchesLocation
    );
  });

  const totalPages = Math.ceil(filteredPrinters.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPrinters.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatuses, filterDefaults, filterTypes, filterLocations]);

  return (
    <div className="admin-table-container">
      <div className="admin-table-header">
        <div className="font-bold text-2xl" style={{ color: "#003366" }}>
          QUẢN LÝ MÁY IN
        </div>
        <div className="admin-table-actions">
          <AdminTableFilter
            activeCount={
              (filterStatuses.includes("all") ? 0 : filterStatuses.length) +
              (filterDefaults.includes("all") ? 0 : filterDefaults.length) +
              (filterTypes.includes("all") ? 0 : filterTypes.length) +
              (filterLocations.includes("all") ? 0 : filterLocations.length)
            }
            onReset={() => {
              setFilterStatuses(["all"]);
              setFilterDefaults(["all"]);
              setFilterTypes(["all"]);
              setFilterLocations(["all"]);
            }}
            sections={[
              {
                id: "printer-status",
                label: "Trạng thái",
                value: filterStatuses,
                onChange: setFilterStatuses,
                options: [
                  { label: "Tất cả trạng thái", value: "all" },
                  { label: "Hoạt động", value: "active" },
                  { label: "Vô hiệu", value: "inactive" },
                ],
              },
              {
                id: "printer-default",
                label: "Mặc định",
                value: filterDefaults,
                onChange: setFilterDefaults,
                options: [
                  { label: "Tất cả", value: "all" },
                  { label: "Máy in mặc định", value: "default" },
                  { label: "Không mặc định", value: "not-default" },
                ],
              },
              {
                id: "printer-type",
                label: "Loại kết nối",
                value: filterTypes,
                onChange: setFilterTypes,
                options: [
                  { label: "Tất cả loại", value: "all" },
                  ...Array.from(new Set(printers.map((printer) => printer.type))).map((type) => ({
                    label: type,
                    value: type,
                  })),
                ],
              },
              {
                id: "printer-location",
                label: "Vị trí",
                value: filterLocations,
                onChange: setFilterLocations,
                options: [
                  { label: "Tất cả vị trí", value: "all" },
                  ...Array.from(
                    new Set(
                      printers
                        .map((printer) => printer.location?.trim())
                        .filter((location): location is string => Boolean(location)),
                    ),
                  ).map((location) => ({
                    label: location,
                    value: location,
                  })),
                ],
              },
            ]}
          />
          <input
            type="text"
            className="admin-table-search"
            placeholder="Tìm kiếm máy in..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="admin-table-btn" onClick={() => handleOpenModal()}>
            + Thêm Mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-table-loading">Đang tải dữ liệu...</div>
      ) : filteredPrinters.length === 0 ? (
        <div className="admin-table-empty">Không có máy in nào</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên Máy In</th>
              <th>Mã Máy In</th>
              <th>Vị trí</th>
              <th>Kết nối IP Wifi</th>
              <th>Trạng thái</th>
              <th>Mặc định in</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((printer) => (
              <tr key={printer._id}>
                <td>
                  <strong>{printer.name}</strong>
                </td>
                <td>{printer.code}</td>
                <td>{printer.location}</td>
                <td>
                  {printer.connection.host}:{printer.connection.port}
                </td>
                <td>
                  <span
                    className={`table-cell-status ${
                      printer.isActive ? "status-true" : "status-false"
                    }`}
                  >
                    {printer.isActive ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </td>
                <td>
                  <span
                    className={`table-cell-status ${
                      printer.isDefault ? "status-true" : "status-false"
                    }`}
                  >
                    {printer.isDefault ? "Có" : "Không"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="table-action-btn table-action-edit"
                      onClick={() => handleOpenModal(printer)}
                      title="Sửa"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      className="table-action-btn table-action-delete"
                      onClick={() => handleDelete(printer._id)}
                      title="Xóa"
                    >
                      <RiDeleteBin6Line size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="admin-table-footer">
        <span>Hiển thị {currentItems.length} trên tổng số {filteredPrinters.length} kết quả</span>
      </div>
      {filteredPrinters.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {showModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <button className="admin-modal-close" onClick={handleCloseModal}>
              ×
            </button>
            <h3>{editingId ? "Chỉnh Sửa Máy In" : "Thêm Máy In Mới"}</h3>

            <div className="admin-modal-two-column-grid">
              <div className="admin-form-group">
                <label className="admin-form-label">Tên Máy In:</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Mã Máy In:</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Loại kết nối:</label>
                <select
                  className="admin-form-select"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as PrinterFormData["type"],
                    })
                  }
                >
                  <option value="network">network</option>
                  <option value="serial">serial</option>
                  <option value="usb">usb</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Địa chỉ IP:</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.connection.host}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      connection: { ...formData.connection, host: e.target.value },
                    })
                  }
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Cổng (Port):</label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={formData.connection.port}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      connection: { ...formData.connection, port: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Vị trí:</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="admin-checkbox-row">
              <label className="admin-checkbox-card">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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
              <label className="admin-checkbox-card">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <div>
                  <div className="admin-checkbox-card-title">
                    {formData.isDefault ? "Mặc định" : "Không mặc định"}
                  </div>
                  <div className="admin-checkbox-card-description">
                    Đánh dấu máy in mặc định cho hệ thống
                  </div>
                </div>
              </label>
            </div>

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

      <AdminConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa máy in"
        message="Bạn có chắc chắn muốn xóa máy in này? Hành động này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
