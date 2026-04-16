"use client";

import { useEffect, useState, useCallback } from "react";
import { FiEdit, FiPrinter } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
  getPrinters,
  createPrinter,
  updatePrinter,
  deletePrinter,
  Printer,
} from "@/services/admin.service";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";
import Pagination from "./Pagination";
import "@/styles/admin-table.css";

export default function PrinterTable() {
  const { toasts, removeToast, success, error } = useToast();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  // Pagination state
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
    } catch (err) {
      console.error(err);
      error("Không thể tải danh sách máy in");
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (pendingDeleteId) {
      try {
        await deletePrinter(pendingDeleteId);
        success("Xóa máy in thành công");
        fetchPrinters();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Xóa máy in thất bại";
        error(errorMessage);
      }
    }
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
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
      fetchPrinters();
      handleCloseModal();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lưu máy in thất bại";
      error(errorMessage);
    }
  };

  const filteredPrinters = printers.filter(
    (printer) =>
      printer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      printer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      printer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredPrinters.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPrinters.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="admin-table-container">
      <div className="admin-table-header">
        <div className="font-bold text-2xl" style={{ color: "#003366" }}>
         QUẢN LÝ MÁY IN
        </div>
        <div className="admin-table-actions">
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
              <th>Mã</th>
              <th>Vị trí</th>
              <th>Kết nối</th>
              <th>Trạng thái</th>
              <th>Mặc định</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((printer) => (
              <tr key={printer._id}>
                <td><strong>{printer.name}</strong></td>
                <td>{printer.code}</td>
                <td>{printer.location}</td>
                <td>{printer.connection.host}:{printer.connection.port}</td>
                <td>
                  <span className={`table-cell-status ${printer.isActive ? "status-true" : "status-false"}`}>
                    {printer.isActive ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </td>
                <td>
                  <span className={`table-cell-status ${printer.isDefault ? "status-true" : "status-false"}`}>
                    {printer.isDefault ? "Có" : "Không"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="table-action-btn table-action-edit" onClick={() => handleOpenModal(printer)} title="Sửa">
                      <FiEdit size={18} />
                    </button>
                    <button className="table-action-btn table-action-delete" onClick={() => handleDelete(printer._id)} title="Xóa">
                      <RiDeleteBin6Line size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {filteredPrinters.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <div className="admin-table-footer">
        <span>Tổng cộng: {filteredPrinters.length} máy in (Trang {currentPage}/{totalPages})</span>
      </div>

      {showModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <button className="admin-modal-close" onClick={handleCloseModal}>×</button>
            <h3>{editingId ? "Chỉnh Sửa Máy In" : "Thêm Máy In Mới"}</h3>

            <div className="admin-form-group">
              <label className="admin-form-label">Tên Máy In:</label>
              <input type="text" className="admin-form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Mã Máy In:</label>
              <input type="text" className="admin-form-input" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}/>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Địa chỉ IP:</label>
              <input type="text" className="admin-form-input" value={formData.connection.host} onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, host: e.target.value } })}/>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Cổng (Port):</label>
              <input type="number" className="admin-form-input" value={formData.connection.port} onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, port: Number(e.target.value) } })}/>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Vị trí:</label>
              <input type="text" className="admin-form-input" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}/>
            </div>
            <div className="admin-form-group" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <label>
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}/>
                Hoạt động
              </label>
              <label>
                <input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}/>
                Đặt làm mặc định
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
            <p>Bạn có chắc chắn muốn xóa máy in này?</p>
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
