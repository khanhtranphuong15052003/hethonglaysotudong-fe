/**
 * Helper functions and constants for AdminDashboardTech.
 * Extracted to reduce the main component file size.
 */
import {
  ArcElement,
  type Chart,
  type Plugin,
} from "chart.js";

// ==================== Constants ====================

export const STATUS_COLORS = {
  waiting: "#ffb020",
  processing: "#37c2eb",
  completed: "#20c37a",
  skipped: "#ff8b5c",
};

export const PIE_COLORS = ["#4f7cff", "#37c2eb", "#20c37a", "#ff8b5c"];

export const TICKET_STATUS_LABELS: Record<string, string> = {
  waiting: "Đang chờ",
  processing: "Đang xử lý",
  completed: "Hoàn tất",
  skipped: "Bỏ qua",
};

// ==================== Formatters ====================

export const getTicketStatusLabel = (status?: string | null) => {
  if (!status) return "Khong xac dinh";
  return TICKET_STATUS_LABELS[status] || status;
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

export const formatUnit = (value: number, unit: string) =>
  `${formatNumber(value)} ${unit}`;

export const formatDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatMonthInput = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

// ==================== Date Helpers ====================

export const parseYearMonthLabel = (label: string) => {
  const isoMatch = label.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) {
    return { year: isoMatch[1], month: Number(isoMatch[2]) };
  }

  const slashMatch = label.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return { year: slashMatch[2], month: Number(slashMatch[1]) };
  }

  const dateMatch = label.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    return { year: dateMatch[1], month: Number(dateMatch[2]) };
  }

  return null;
};

export const previousDay = () => {
  const value = new Date();
  value.setDate(value.getDate() - 1);
  return formatDateInput(value);
};

export const currentDay = () => formatDateInput(new Date());

export const currentMonth = () => formatMonthInput(new Date());

// ==================== Chart Configs ====================

export const doughnutLabelPlugin: Plugin<"doughnut"> = {
  id: "doughnutLabelPlugin",
  afterDatasetsDraw(chart: Chart<"doughnut">) {
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    if (!dataset || !meta?.data?.length) return;

    const values = (dataset.data as number[]).map((value) => Number(value) || 0);
    const total = values.reduce((sum, value) => sum + value, 0);
    if (!total) return;

    const { ctx } = chart;
    ctx.save();

    meta.data.forEach((arcElement, index) => {
      const value = values[index];
      if (!value) return;

      const arc = arcElement as ArcElement;
      const angle = (arc.startAngle + arc.endAngle) / 2;
      const percent = Math.round((value / total) * 100);
      const x = arc.x + Math.cos(angle) * (arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.55);
      const y = arc.y + Math.sin(angle) * (arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.55);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (percent >= 8) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 11px Arial";
        ctx.fillText(`${formatNumber(value)}`, x, y - 7);
        ctx.font = "600 10px Arial";
        ctx.fillText(`${percent}%`, x, y + 7);
        return;
      }

      const outX = arc.x + Math.cos(angle) * (arc.outerRadius + 18);
      const outY = arc.y + Math.sin(angle) * (arc.outerRadius + 12);
      ctx.fillStyle = "#18324f";
      ctx.font = "700 10px Arial";
      ctx.fillText(`${formatNumber(value)} ${percent}%`, outX, outY);
    });

    ctx.restore();
  },
};

export const chartOptionsBase = {
  maintainAspectRatio: false,
  layout: { padding: 6 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(9, 18, 32, 0.95)",
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      borderColor: "rgba(79, 124, 255, 0.28)",
      borderWidth: 1,
      padding: 10,
      displayColors: true,
    },
  },
};

// ==================== Legend Builder ====================

export const buildStatusLegend = (counts: {
  waiting: number;
  processing: number;
  completed: number;
  skipped: number;
}) => [
  { label: "Đang chờ", value: counts.waiting, color: STATUS_COLORS.waiting },
  { label: "Đang xử lý", value: counts.processing, color: STATUS_COLORS.processing },
  { label: "Hoàn tất", value: counts.completed, color: STATUS_COLORS.completed },
  { label: "Bỏ qua", value: counts.skipped, color: STATUS_COLORS.skipped },
];

// ==================== Doughnut Data Builder ====================

export const buildStatusDoughnutData = (counts: {
  waiting: number;
  processing: number;
  completed: number;
  skipped: number;
}) => ({
  labels: ["Đang chờ", "Đang xử lý", "Hoàn tất", "Bỏ qua"],
  datasets: [
    {
      data: [counts.waiting, counts.processing, counts.completed, counts.skipped],
      backgroundColor: [
        STATUS_COLORS.waiting,
        STATUS_COLORS.processing,
        STATUS_COLORS.completed,
        STATUS_COLORS.skipped,
      ],
      borderWidth: 0,
      hoverOffset: 8,
      cutout: "66%",
    },
  ],
});
