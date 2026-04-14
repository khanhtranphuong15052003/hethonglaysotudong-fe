"use client";

import { getServiceStats } from "@/mock/report";

export default function ReportsPage() {
  const stats = getServiceStats();

  return (
    <div>
      <h1>Báo cáo dịch vụ</h1>
     
      {Object.entries(stats).map(([service, count]) => (
        <div key={service}>
          {service}: {count}
        </div>
      ))}
    </div>
  );
}
