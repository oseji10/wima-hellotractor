"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import dynamic from "next/dynamic";
import api from '../../../lib/api';

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const TotalSubscriberOne = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount) => `N${amount?.toLocaleString() || '0'}`;

  const getCurrentWeekData = () => {
    if (!data?.daily) return { categories: [], seriesData: [] };

    const now = new Date();
    const daysSinceSunday = (now.getDay() + 6) % 7; // Adjust for Sunday=0
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - daysSinceSunday);
    sunday.setHours(0, 0, 0, 0);

    const categories = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const seriesData = new Array(7).fill(0);

    (data.daily || []).forEach(item => {
      const itemDate = new Date(item.date);
      const diffTime = itemDate - sunday;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        seriesData[diffDays] = item.total || 0;
      }
    });

    return { categories, seriesData };
  };

  const { categories, seriesData } = getCurrentWeekData();
  const total = seriesData.reduce((sum, val) => sum + val, 0);

  const barChartOptions = {
    chart: {
      type: 'bar',
      height: 264,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: '#8e8ea1',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#8e8ea1',
          fontSize: '12px',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return formatCurrency(val);
        },
      },
    },
    colors: ['#0d6efd'],
    grid: {
      borderColor: '#f1f1f1',
    },
    legend: {
      show: false,
    },
  };

  const barChartSeries = [{
    name: 'Sales',
    data: seriesData,
  }];

  if (loading) {
    return (
      <div className='col-xxl-3 col-xl-6'>
        <div className='card h-100 radius-8 border'>
          <div className='card-body p-24'>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='col-xxl-3 col-xl-6'>
        <div className='card h-100 radius-8 border'>
          <div className='card-body p-24'>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='col-xxl-3 col-xl-6'>
      <div className='card h-100 radius-8 border'>
        <div className='card-body p-24'>
          <h6 className='mb-12 fw-semibold text-lg mb-16'>Total Sales</h6>
          <div className='d-flex align-items-center gap-2 mb-20'>
            <h6 className='fw-semibold mb-0'>{formatCurrency(total)}</h6>
          </div>
          <ReactApexChart
            options={barChartOptions}
            series={barChartSeries}
            type='bar'
            height={264}
          />
        </div>
      </div>
    </div>
  );
};

export default TotalSubscriberOne;