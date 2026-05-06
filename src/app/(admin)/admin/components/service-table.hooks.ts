"use client";

import { useCallback, useEffect, useState } from "react";
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
import { useToast } from "@/hooks/useToast";
import { getSequentialTagColorStyle } from "@/lib/adminTagColors";

// ==================== Constants ====================

export const PREFIX_NUMBER_MIN = 0;
export const PREFIX_NUMBER_MAX = 99;

export type ServiceFormData = {
  code: string;
  name: string;
  icon: string;
  description: string;
  displayOrder: number;
  prefixNumber: number;
  isActive: boolean;
};

const INITIAL_FORM_DATA: ServiceFormData = {
  code: "",
  name: "",
  icon: "",
  description: "",
  displayOrder: 1,
  prefixNumber: 0,
  isActive: true,
};

// ==================== Helpers ====================

export const validatePrefixNumber = (value: number): string => {
  if (!Number.isInteger(value)) {
    return "Số tiền tố phải là số nguyên.";
  }
  if (value < PREFIX_NUMBER_MIN || value > PREFIX_NUMBER_MAX) {
    return `Số tiền tố phải nằm trong khoảng từ ${PREFIX_NUMBER_MIN} đến ${PREFIX_NUMBER_MAX}.`;
  }
  return "";
};

// ==================== Data Hook ====================

export function useServiceData() {
  const { toasts, removeToast, success, error } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);

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

  return {
    services, counters, loading,
    fetchServices, fetchCounters,
    toasts, removeToast, success, error,
  };
}

// ==================== Filter Hook ====================

export function useServiceFilters(services: Service[], counters: Counter[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCounterIds, setFilterCounterIds] = useState<string[]>(["all"]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>(["all"]);
  const [filterPrefixNumbers, setFilterPrefixNumbers] = useState<string[]>(["all"]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCounter =
      filterCounterIds.includes("all") ||
      service.counters?.some((counter) => filterCounterIds.includes(counter._id));
    const matchesStatus =
      filterStatuses.includes("all") ||
      (filterStatuses.includes("active") && service.isActive) ||
      (filterStatuses.includes("inactive") && !service.isActive);
    const matchesPrefix =
      filterPrefixNumbers.includes("all") ||
      filterPrefixNumbers.includes(String(service.prefixNumber ?? 0));

    return matchesSearch && matchesCounter && matchesStatus && matchesPrefix;
  });

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCounterIds, filterStatuses, filterPrefixNumbers]);

  const activeFilterCount =
    (filterCounterIds.includes("all") ? 0 : filterCounterIds.length) +
    (filterStatuses.includes("all") ? 0 : filterStatuses.length) +
    (filterPrefixNumbers.includes("all") ? 0 : filterPrefixNumbers.length);

  const resetFilters = () => {
    setFilterCounterIds(["all"]);
    setFilterStatuses(["all"]);
    setFilterPrefixNumbers(["all"]);
  };

  // Counter color map for tags
  const counterColorMap = new Map(
    [...counters]
      .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name))
      .map((counter, index) => [counter._id, getSequentialTagColorStyle(index)]),
  );

  return {
    searchTerm, setSearchTerm,
    filterCounterIds, setFilterCounterIds,
    filterStatuses, setFilterStatuses,
    filterPrefixNumbers, setFilterPrefixNumbers,
    currentPage, setCurrentPage,
    filteredServices, paginatedServices, totalPages,
    activeFilterCount, resetFilters,
    counterColorMap,
  };
}

// ==================== Modal / CRUD Hook ====================

export function useServiceModal(
  fetchServices: () => Promise<void> | void,
  fetchCounters: () => Promise<void> | void,
  success: (msg: string) => void,
  error: (msg: string) => void,
) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCounters, setSelectedCounters] = useState<string[]>([]);
  const [initialCounters, setInitialCounters] = useState<string[]>([]);
  const [prefixNumberError, setPrefixNumberError] = useState("");
  const [formData, setFormData] = useState<ServiceFormData>(INITIAL_FORM_DATA);

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<boolean | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingId(service._id);
      setFormData({
        code: service.code,
        name: service.name,
        icon: service.icon,
        description: service.description,
        displayOrder: service.displayOrder,
        prefixNumber: service.prefixNumber ?? 0,
        isActive: service.isActive,
      });
      setPrefixNumberError("");
      const counterIds = service.counters?.map((counter) => counter._id) || [];
      setSelectedCounters(counterIds);
      setInitialCounters(counterIds);
    } else {
      setEditingId(null);
      setFormData(INITIAL_FORM_DATA);
      setPrefixNumberError("");
      setSelectedCounters([]);
      setInitialCounters([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(INITIAL_FORM_DATA);
    setPrefixNumberError("");
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

  const handlePrefixNumberChange = (value: string) => {
    const nextValue = Number(value);
    setFormData((prev) => ({ ...prev, prefixNumber: nextValue }));
    setPrefixNumberError(validatePrefixNumber(nextValue));
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      try {
        await deleteService(pendingDeleteId);
        success("Xóa quầy thành công");
        fetchServices();
      } catch (err) {
        error(err instanceof Error ? err.message : "Xóa quầy thất bại");
      }
    }
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      error("Vui lòng nhập mã và tên quầy");
      return;
    }

    const normalizedPrefixNumber = Number(formData.prefixNumber);
    const prefixValidationMessage = validatePrefixNumber(normalizedPrefixNumber);
    if (prefixValidationMessage) {
      setPrefixNumberError(prefixValidationMessage);
      error(prefixValidationMessage);
      return;
    }
    setPrefixNumberError("");

    try {
      if (editingId) {
        await updateService(editingId, { ...formData, prefixNumber: normalizedPrefixNumber });

        const removedCounterIds = initialCounters.filter(
          (counterId) => !selectedCounters.includes(counterId),
        );
        if (removedCounterIds.length > 0) {
          await Promise.all(
            removedCounterIds.map((counterId) => removeServiceFromCounter(counterId, editingId)),
          );
        }

        const addedCounterIds = selectedCounters.filter(
          (counterId) => !initialCounters.includes(counterId),
        );
        if (addedCounterIds.length > 0) {
          await Promise.all(
            addedCounterIds.map((counterId) => addServicesToCounter(counterId, [editingId])),
          );
        }

        success("Cập nhật quầy thành công");
      } else {
        const createdService = await createService({
          code: formData.code,
          name: formData.name,
          icon: formData.icon,
          description: formData.description,
          displayOrder: formData.displayOrder,
          prefixNumber: normalizedPrefixNumber,
          isActive: formData.isActive,
        });

        await Promise.all(
          selectedCounters.map((counterId) =>
            addServicesToCounter(counterId, [createdService._id]),
          ),
        );

        success("Tạo quầy thành công");
      }

      fetchServices();
      fetchCounters();
      handleCloseModal();
    } catch (err) {
      error(err instanceof Error ? err.message : "Lỗi lưu quầy thất bại");
    }
  };

  return {
    showModal, editingId, formData, setFormData,
    selectedCounters, prefixNumberError,
    handleOpenModal, handleCloseModal, handleSave,
    handleCounterToggle, handlePrefixNumberChange,
    showStatusConfirm, setShowStatusConfirm, pendingStatusChange,
    handleStatusChange, handleConfirmStatus,
    showDeleteConfirm, setShowDeleteConfirm,
    handleDelete, handleConfirmDelete,
  };
}
