"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import api from '../../../lib/api';

const LatestRegisteredOne = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/latest-registered-members');
        setData(response.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusClass = (status) => {
    if (status === 'approved') return 'bg-success-focus text-success-main';
    return 'bg-warning-focus text-warning-main';
  };

  const getStatusText = (status) => {
    if (status === 'approved') return 'Active';
    return 'Pending';
  };

  if (loading) {
    return (
      <div className='col-xxl-9 col-xl-12'>
        <div className='card h-100'>
          <div className='card-body p-24'>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='col-xxl-9 col-xl-12'>
        <div className='card h-100'>
          <div className='card-body p-24'>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  const tableRows = data.slice(0, 5).map((item) => (
    <tr key={item.id}>
      <td>
        <div className='d-flex align-items-center'>
          <div className='flex-grow-1'>
            <h6 className='text-md mb-0 fw-medium'>
              {item.fullName}
            </h6>
            <span className='text-sm text-secondary-light fw-medium'>
              {item.email}
            </span>
          </div>
        </div>
      </td>
      <td>{formatDate(item.created_at)}</td>
      <td>{item.membershipType}</td>
      <td className='text-center'>
        <span className={`${getStatusClass(item.status)} px-24 py-4 rounded-pill fw-medium text-sm`}>
          {getStatusText(item.status)}
        </span>
      </td>
    </tr>
  ));

  return (
    <div className='col-xxl-9 col-xl-12'>
      <div className='card h-100'>
        <div className='card-body p-24'>
          <div className='d-flex flex-wrap align-items-center gap-1 justify-content-between mb-16'>
            <h6 className='mb-0 fw-semibold text-lg'>Latest Registered Members</h6>
            <Link
              href='#'
              className='text-primary-600 hover-text-primary d-flex align-items-center gap-1'
            >
              View All
              <Icon icon='solar:alt-arrow-right-linear' className='icon' />
            </Link>
          </div>
          <div className='table-responsive scroll-sm'>
            <table className='table bordered-table sm-table mb-0'>
              <thead>
                <tr>
                  <th scope='col'>Users </th>
                  <th scope='col'>Registered On</th>
                  <th scope='col'>Plan</th>
                  <th scope='col' className='text-center'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestRegisteredOne;