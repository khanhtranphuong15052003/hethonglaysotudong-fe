"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CounterDisplayLayout from "../../components/CounterDisplayLayout";
import { getWaitingListByCounter, getNowCallingByCounter } from "@/mock/queue";
import { getCounterById } from "@/mock/counters";
import type { Ticket } from "@/mock/data";

export default function CounterDisplayPage() {
  const params = useParams();
  const counterId = params.counterId as string;

  const [counterName, setCounterName] = useState<string>("");
  const [waitingList, setWaitingList] = useState<Ticket[]>([]);
  const [nowCalling, setNowCalling] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const counter = await getCounterById(counterId);
      if (!counter) {
        setCounterName("");
        setWaitingList([]);
        setNowCalling(null);
        setLoading(false);
        return;
      }

      setCounterName(counter.name);

      const waiting = getWaitingListByCounter(counterId);
      setWaitingList(waiting);

      const calling = getNowCallingByCounter(counterId);
      setNowCalling(calling || null);

      setLoading(false);
    };

    void loadData();
  }, [counterId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <CounterDisplayLayout
      counterName={counterName}
      waitingList={waitingList}
      nowCalling={nowCalling}
    />
  );
}
