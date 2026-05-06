"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  assignCounterToStaff,
  Counter,
  createStaff,
  deleteStaff,
  getCounters,
  getStaff,
  Staff,
  StaffServiceInfo,
  updateStaff,
  updateStaffServices,
} from "@/services/admin.service";
import { useToast } from "@/hooks/useToast";
import { useAdminSessionGuard } from "@/hooks/useAdminSessionGuard";
import { getSequentialTagColorStyle } from "@/lib/adminTagColors";

// ==================== Types ====================

type ApiErrorShape = {
  response?: {
    data?: {
      errors?: Record<string, string | { message?: string }>;
      message?: string;
    };
  };
  message?: string;
};

export type StaffFormData = {
  username: string;
  password: string;
  fullName: string;
  counterId: string | null;
  isActive: boolean;
};

const INITIAL_FORM_DATA: StaffFormData = {
  username: "",
  password: "",
  fullName: "",
  counterId: null,
  isActive: true,
};

// ==================== Helpers ====================

export const parseApiError = (err: unknown): string => {
  const apiError = err as ApiErrorShape;
  const data = apiError?.response?.data;

  if (!data) {
    return apiError?.message || "Lỗi không xác định";
  }

  if (data.errors) {
    const firstErrorKey = Object.keys(data.errors)[0];
    const firstError = data.errors[firstErrorKey];

    if (typeof firstError === "string") {
      return firstError;
    }

    if (firstError?.message) {
      return firstError.message;
    }
  }

  return data.message || "Lỗi không xác định";
};

// ==================== Data Hook ====================

export function useStaffData() {
  const { toasts, removeToast, success, error } = useToast();
  const guardSession = useAdminSessionGuard();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStaff();
      setStaffList(data);
    } catch (err) {
      if (guardSession(err)) return;
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
      if (guardSession(err)) return;
      error("Không thể tải danh sách phòng");
    }
  }, [error, guardSession]);

  useEffect(() => {
    void fetchStaff();
    void fetchCounters();
  }, [fetchStaff, fetchCounters]);

  return {
    staffList, counters, loading,
    fetchStaff, fetchCounters,
    toasts, removeToast, success, error,
  };
}

// ==================== Filter Hook ====================

export function useStaffFilters(staffList: Staff[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCounterIds, setFilterCounterIds] = useState<string[]>(["all"]);
  const [filterServiceIds, setFilterServiceIds] = useState<string[]>(["all"]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>(["all"]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCounter =
      filterCounterIds.includes("all") ||
      (filterCounterIds.includes("unassigned") && !staff.counterId) ||
      (staff.counterId && filterCounterIds.includes(staff.counterId._id));
      
    const matchesService = 
      filterServiceIds.includes("all") ||
      (filterServiceIds.includes("unassigned") && (!staff.effectiveServices || staff.effectiveServices.length === 0)) ||
      (staff.effectiveServices && staff.effectiveServices.some(s => filterServiceIds.includes(s.id || s._id)));

    const matchesStatus =
      filterStatuses.includes("all") ||
      (filterStatuses.includes("active") && staff.isActive) ||
      (filterStatuses.includes("inactive") && !staff.isActive);

    return matchesSearch && matchesCounter && matchesService && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const currentItems = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCounterIds, filterServiceIds, filterStatuses]);

  const activeFilterCount =
    (filterCounterIds.includes("all") ? 0 : filterCounterIds.length) +
    (filterServiceIds.includes("all") ? 0 : filterServiceIds.length) +
    (filterStatuses.includes("all") ? 0 : filterStatuses.length);

  const resetFilters = () => {
    setFilterCounterIds(["all"]);
    setFilterServiceIds(["all"]);
    setFilterStatuses(["all"]);
  };

  return {
    searchTerm, setSearchTerm,
    filterCounterIds, setFilterCounterIds,
    filterServiceIds, setFilterServiceIds,
    filterStatuses, setFilterStatuses,
    currentPage, setCurrentPage,
    filteredStaff, currentItems, totalPages,
    activeFilterCount, resetFilters,
    itemsPerPage,
  };
}

// ==================== Service Color Map ====================

export function useServiceColorMap(counters: Counter[]) {
  const allServices = useMemo(() => {
    const map = new Map();
    counters.forEach((counter) => {
      counter.services?.forEach((service) => {
        map.set(service._id, service);
      });
    });

    return Array.from(map.values()).sort(
      (a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0),
    );
  }, [counters]);

  const serviceColorMap = useMemo(() => {
    const colorMap = new Map<string, ReturnType<typeof getSequentialTagColorStyle>>();
    allServices.forEach((service: any, index: number) => {
      const color = getSequentialTagColorStyle(index);
      if (service._id) colorMap.set(service._id, color);
      if (service.id) colorMap.set(service.id, color);
    });
    return colorMap;
  }, [allServices]);

  return { allServices, serviceColorMap };
}

// ==================== Modal / CRUD Hook ====================

export function useStaffModal(
  counters: Counter[],
  fetchStaff: () => Promise<void>,
  success: (msg: string) => void,
  error: (msg: string) => void,
) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(INITIAL_FORM_DATA);
  const [formAvailableServices, setFormAvailableServices] = useState<StaffServiceInfo[]>([]);
  const [formSelectedServiceIds, setFormSelectedServiceIds] = useState<Set<string>>(new Set());

  // Service modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceModalStaff, setServiceModalStaff] = useState<Staff | null>(null);
  const [availableServices, setAvailableServices] = useState<StaffServiceInfo[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [serviceModalLoading, setServiceModalLoading] = useState(false);
  const [serviceModalSaving, setServiceModalSaving] = useState(false);
  const [serviceRestrictionConfigured, setServiceRestrictionConfigured] = useState(false);

  const mapCounterServices = (counterId: string | null) => {
    const counterServices =
      counters.find((counter) => counter._id === (counterId || ""))?.services || [];

    return counterServices.map((service) => ({
      id: service._id,
      _id: service._id,
      code: service.code,
      name: service.name,
      icon: service.icon,
      displayOrder: service.displayOrder,
    }));
  };

  const handleOpenModal = (staff?: Staff) => {
    if (staff) {
      const normalizedAvailableServices = mapCounterServices(staff.counterId?._id || null);
      const initialSelected =
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
      setFormSelectedServiceIds(initialSelected);
    } else {
      setEditingId(null);
      setFormData(INITIAL_FORM_DATA);
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
    if (!pendingDeleteId) return;

    try {
      await deleteStaff(pendingDeleteId);
      success("Xóa nhân viên thành công");
      await fetchStaff();
    } catch (err) {
      error(err instanceof Error ? err.message : "Xóa nhân viên thất bại");
    } finally {
      setShowDeleteConfirm(false);
      setPendingDeleteId(null);
    }
  };

  const handleFormCounterChange = (counterId: string | null) => {
    const normalizedAvailableServices = mapCounterServices(counterId);
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

  const handleSave = async (staffList: Staff[]) => {
    if (!formData.username || !formData.fullName) {
      error("Vui lòng nhập tên đăng nhập và họ tên");
      return;
    }

    if (!editingId && !formData.password) {
      error("Vui lòng nhập mật khẩu cho nhân viên mới");
      return;
    }

    const previousCounterId = editingId
      ? staffList.find((staff) => staff._id === editingId)?.counterId?._id ?? null
      : null;

    try {
      let savedStaff: Staff;

      if (editingId) {
        if (formData.counterId && formData.counterId !== previousCounterId) {
          await assignCounterToStaff(editingId, formData.counterId);
        }

        savedStaff = await updateStaff(editingId, {
          fullName: formData.fullName,
          isActive: formData.isActive,
          password: formData.password || undefined,
          counterId: formData.counterId,
        });

        if (formData.counterId) {
          await updateStaffServices(savedStaff._id, Array.from(formSelectedServiceIds));
        }

        success("Cập nhật nhân viên thành công");
      } else {
        savedStaff = await createStaff({
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
        });

        if (formData.counterId) {
          await assignCounterToStaff(savedStaff._id, formData.counterId);
          if (formSelectedServiceIds.size > 0) {
            await updateStaffServices(savedStaff._id, Array.from(formSelectedServiceIds));
          }
        }

        success("Tạo nhân viên thành công");
      }
    } catch (err) {
      await fetchStaff();
      error(parseApiError(err));
      return;
    }

    handleCloseModal();
    await fetchStaff();
  };

  // ===== Service Modal =====

  const handleOpenServiceModal = async (staff: Staff) => {
    setServiceModalStaff(staff);
    setShowServiceModal(true);
    setServiceModalLoading(true);

    try {
      const normalizedAvailableServices = mapCounterServices(staff.counterId?._id || null);
      const initialSelected =
        staff.serviceRestrictionConfigured && staff.assignedServices
          ? new Set(staff.assignedServices.map((service) => service.id || service._id))
          : new Set(normalizedAvailableServices.map((service) => service.id || service._id));

      setAvailableServices(normalizedAvailableServices);
      setSelectedServiceIds(initialSelected);
      setServiceRestrictionConfigured(Boolean(staff.serviceRestrictionConfigured));
    } catch (err) {
      error(err instanceof Error ? err.message : "Lỗi tải quầy");
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

  const handleSaveServices = async () => {
    if (!serviceModalStaff) return;

    setServiceModalSaving(true);
    try {
      await updateStaffServices(serviceModalStaff._id, Array.from(selectedServiceIds));
      success("Cập nhật quầy thành công");
      setShowServiceModal(false);
      await fetchStaff();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi lưu quầy";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        error("API gán quầy trả 404, vui lòng kiểm tra backend.");
      } else {
        error(msg);
      }
    } finally {
      setServiceModalSaving(false);
    }
  };

  return {
    // Main modal
    showModal, editingId, formData, setFormData,
    formAvailableServices, formSelectedServiceIds,
    handleOpenModal, handleCloseModal, handleSave,
    handleFormCounterChange, handleToggleFormService,
    // Delete
    showDeleteConfirm, setShowDeleteConfirm,
    handleDelete, handleConfirmDelete,
    // Service modal
    showServiceModal, setShowServiceModal,
    serviceModalStaff, serviceModalLoading, serviceModalSaving,
    availableServices, selectedServiceIds, serviceRestrictionConfigured,
    handleOpenServiceModal, handleToggleService, handleSaveServices,
  };
}

// ==================== Display Helpers ====================

export const getCounterDisplay = (staff: Staff, counters: Counter[]) => {
  if (!staff.counterId) return null;
  const matchedCounter = counters.find((counter) => counter._id === staff.counterId?._id);
  const counterCode = staff.counterId.code || matchedCounter?.code || "";
  return `${staff.counterId.name}${counterCode ? ` (${counterCode})` : ""}`;
};
