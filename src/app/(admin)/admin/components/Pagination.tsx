"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          style={{
            padding: "8px 14px",
            margin: "0 4px",
            borderRadius: "4px",
            border: "1px solid #e0e0e0",
            backgroundColor: currentPage === i ? "#003366" : "white",
            color: currentPage === i ? "white" : "#333",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: currentPage === i ? "600" : "400",
            transition: "all 0.2s ease",
          }}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "20px",
        marginBottom: "20px",
        gap: "4px",
      }}
    >
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{
          padding: "8px 12px",
          borderRadius: "4px",
          border: "1px solid #e0e0e0",
          backgroundColor: "white",
          color: currentPage === 1 ? "#ccc" : "#003366",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
        }}
      >
        Trở lại
      </button>

      {renderPageNumbers()}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{
          padding: "8px 12px",
          borderRadius: "4px",
          border: "1px solid #e0e0e0",
          backgroundColor: "white",
          color: currentPage === totalPages ? "#ccc" : "#003366",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
        }}
      >
        Tiếp
      </button>
    </div>
  );
};

export default Pagination;
