"use client";

import { useState, useEffect } from "react";

export default function Clock() {
  const [time, setTime] = useState<string>("00:00:00");
  const [weatherInfo, setWeatherInfo] = useState<string>("...");
  const [dateWithDay, setDateWithDay] = useState<string>("...");

  const getWeatherDescription = (code: number): string => {
    const weatherMap: { [key: number]: string } = {
      0: "Bầu trời quang đãng",
      1: "Hầu như trong sáng",
      2: "Hầu như trong sáng",
      3: "Mây che phủ",
      45: "Sương mù",
      48: "Sương mù",
      51: "Mưa nhẹ",
      53: "Mưa nhẹ",
      55: "Mưa nhẹ",
      61: "Mưa vừa",
      63: "Mưa vừa",
      65: "Mưa nặng",
      71: "Tuyết nhẹ",
      73: "Tuyết vừa",
      75: "Tuyết nặng",
      77: "Hạt tuyết",
      80: "Mưa rào",
      81: "Mưa rào",
      82: "Mưa rào nặng",
      85: "Rào tuyết",
      86: "Rào tuyết",
      95: "Giông bão",
      96: "Giông bão có mưa đá",
      99: "Giông bão có mưa đá",
    };
    return weatherMap[code] || "Không xác định";
  };

  useEffect(() => {
    // Update time
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("vi-VN"));

      // Format ngày với thứ: "Thứ 7, 30 tháng 3 năm 2026"
      const days = [
        "Chủ nhật",
        "Thứ 2",
        "Thứ 3",
        "Thứ 4",
        "Thứ 5",
        "Thứ 6",
        "Thứ 7",
      ];
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const dayName = days[now.getDay()];
      const formattedDate = `${dayName}, ${day} tháng ${month} năm ${year}`;
      setDateWithDay(formattedDate);
    };

    updateTime();

    // Cập nhật mỗi giây
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch temperature and weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://wttr.in/ho-chi-minh-city?format=j1&lang=vi",
        );
        const data = await response.json();
        if (data.current_condition && data.current_condition[0]) {
          const current = data.current_condition[0];
          const temp = current.temp_C;
          const weatherDesc =
            current.weatherDesc?.[0]?.value || "Không xác định";
          setWeatherInfo(`${temp}°C | TP.Hồ Chí Minh, ${weatherDesc}`);
        }
      } catch (error) {
        console.log("Error fetching weather:", error);
        setWeatherInfo("--°C | TP.Hồ Chí Minh");
      }
    };

    fetchWeather();

    // Cập nhật thời tiết mỗi 10 phút
    const weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => clearInterval(weatherInterval);
  }, []);

  return (
    <div>
      <div style={{ fontSize: 14, opacity: 0.8, textAlign: "right" }}>
        {dateWithDay}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, textAlign: "right" }}>
        {time}
      </div>
    </div>
  );
}
