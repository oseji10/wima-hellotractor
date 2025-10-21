"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import api from "../../../lib/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SalesStatisticOne = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Weekly");

  // === Helper: Get ISO week number ===
  const getISOWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  // === Get all ISO week numbers within current month ===
  const getWeeksInCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const weeks = [];
    let current = new Date(firstDay);
    while (current <= lastDay) {
      const week = getISOWeek(current);
      if (!weeks.includes(week)) weeks.push(week);
      current.setDate(current.getDate() + 1);
    }
    return weeks;
  };

  // === Fetch data ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/transaction-analysis");
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount) => `₦${amount?.toLocaleString() || "0"}`;

  // === Build chart data ===
  const getChartData = (period) => {
    let categories = [];
    let seriesData = [];
    const currentYear = new Date().getFullYear();

    if (!data) return { categories, seriesData };

    if (period === "Yearly") {
      const yearly = data.yearly || [];
      categories = yearly.map((item) => item.year.toString());
      seriesData = yearly.map((item) => item.total);
    } else if (period === "Monthly") {
      let monthly = [...(data.monthly || [])];
      monthly = monthly.filter((item) => item.year === currentYear);
      monthly.sort((a, b) => a.month - b.month);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      categories = monthly.map((item) => monthNames[item.month - 1]);
      seriesData = monthly.map((item) => item.total);
    } else if (period === "Weekly") {
      const currentMonthWeeks = getWeeksInCurrentMonth();
      let weekly = [...(data.weekly || [])];
      weekly = weekly.filter((item) => item.year === currentYear && currentMonthWeeks.includes(item.week));
      weekly.sort((a, b) => a.week - b.week);
      categories = weekly.map((item) => `W${item.week}`);
      seriesData = weekly.map((item) => item.total);
    } else if (period === "Today") {
      categories = ["Today"];
      seriesData = [data?.totalTransactions || 0];
    }

    return { categories, seriesData };
  };

  const { categories, seriesData } = getChartData(selectedPeriod);
  const total = seriesData.reduce((sum, val) => sum + val, 0);

  const chartOptions = {
    chart: {
      type: "area",
      height: 264,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        colorStops: [
          { offset: 0, color: "#0d6efd", opacity: 1 },
          { offset: 100, color: "#0d6efd", opacity: 0.3 },
        ],
      },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ["#0d6efd"],
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#8e8ea1", fontSize: "12px" } },
      crosshairs: { show: false },
    },
    yaxis: {
      labels: { style: { colors: "#8e8ea1", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { borderColor: "#f1f1f1" },
  };

  const series = [{ name: "Transactions", data: seriesData }];

  if (loading) {
    return (
      <div className="col-xxl-6 col-xl-12">
        <div className="card h-100">
          <div className="card-body">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-xxl-6 col-xl-12">
        <div className="card h-100">
          <div className="card-body">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-xxl-6 col-xl-12">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between">
            <h6 className="text-lg mb-0">Transactions Statistic</h6>
            <select
              className="form-select bg-base form-select-sm w-auto"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="Yearly">Yearly</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
              <option value="Today">Today</option>
            </select>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 mt-8">
            <h6 className="mb-0">{formatCurrency(total)}</h6>
          </div>

          <ReactApexChart options={chartOptions} series={series} type="area" height={264} />
        </div>
      </div>
    </div>
  );
};

export default SalesStatisticOne;
