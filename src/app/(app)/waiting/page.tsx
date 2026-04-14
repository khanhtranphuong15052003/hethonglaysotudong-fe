"use client";

import { tickets } from "@/mock/data";

export default function WaitingPage() {
  return (
    <div>
      <h1>Trạng thái hồ sơ</h1>

      {tickets.map((t) => (
        <div key={t.id}>
          {t.number} - {t.status}
        </div>
      ))}
    </div>
  );
}
