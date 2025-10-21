"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import api from "../../../lib/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const UsersOverviewOne = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/farmers-by-state");
        setData(response.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // === Define consistent colors ===
  const colors = [
    "#0d6efd",
    "#ffc107",
    "#28a745",
    "#dc3545",
    "#17a2b8",
    "#6f42c1",
    "#fd7e14",
    "#20c997",
    "#6610f2",
  ];

  const donutChartOptions = {
    chart: {
      type: "donut",
      height: 264,
    },
    labels: data.map((item) => item.stateName),
    colors: colors,
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
        },
      },
    },
    stroke: {
      show: false,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}`,
      },
    },
  };

  const donutChartSeries = data.map((item) => item.total);

  if (loading) {
    return (
      <div className="col-xxl-3 col-xl-6">
        <div className="card h-100 radius-8 border-0 overflow-hidden">
          <div className="card-body p-24">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-xxl-3 col-xl-6">
        <div className="card h-100 radius-8 border-0 overflow-hidden">
          <div className="card-body p-24">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-xxl-3 col-xl-6">
      <div className="card h-100 radius-8 border-0 overflow-hidden">
        <div className="card-body p-24">
          <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
            <h6 className="mb-2 fw-bold text-lg">Users Overview</h6>
            <div className="">
              <select
                className="form-select form-select-sm w-auto bg-base border text-secondary-light"
                defaultValue="Today"
              >
                <option value="Today">Today</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          <ReactApexChart
            options={donutChartOptions}
            series={donutChartSeries}
            type="donut"
            height={264}
          />

          {/* Dynamic legend that matches chart colors */}
          <ul className="d-flex flex-wrap align-items-center justify-content-between mt-3 gap-3">
            {data.map((item, index) => (
              <li
                key={item.stateName}
                className="d-flex align-items-center gap-2"
              >
                <span
                  className="w-12-px h-12-px radius-2"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-secondary-light text-sm fw-normal">
                  {item.stateName}:{" "}
                  <span className="text-primary-light fw-semibold">
                    {item.total}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UsersOverviewOne;
