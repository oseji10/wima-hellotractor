"use client";
import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react';
import api from '../../../lib/api';
import { getRole } from '../../../lib/auth';

const UnitCountOne = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/dashboard'); // Replace with your actual endpoint URL
               
                setData(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    
     useEffect(() => {
        
        setRole(getRole());
    
      }, []);

    const formatCurrency = (amount) => `N${amount?.toLocaleString() || '0'}`;

    const getDisplayValue = (totalField, hubField) => {
        if (role === 'State Coordinator' && hubField && data?.[hubField] !== undefined) {
            return data[hubField];
        }
        return data?.[totalField] || 0;
    };

    if (loading) {
        return <div className="row row-cols-xxxl-5 row-cols-lg-4 row-cols-sm-2 row-cols-1 gy-4">Loading...</div>;
    }

    if (error) {
        return <div className="row row-cols-xxxl-5 row-cols-lg-4 row-cols-sm-2 row-cols-1 gy-4">Error: {error}</div>;
    }

    return (
        <div className="row row-cols-xxxl-5 row-cols-lg-4 row-cols-sm-2 row-cols-1 gy-4">
            <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
                    <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                            <div>
                                <p className="fw-medium text-primary-light mb-1">Total Farmers</p>
                                <h6 className="mb-0">{getDisplayValue('totalFarmers', 'farmersInMyHub')}</h6>
                            </div>
                            <div className="w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center">
                                <Icon
                                    icon="gridicons:multiple-users"
                                    className="text-white text-2xl mb-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col">
                <div className="card shadow-none border bg-gradient-start-2 h-100">
                    <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                            <div>
                                <p className="fw-medium text-primary-light mb-1">
                                    Total MSPs
                                </p>
                                <h6 className="mb-0">{getDisplayValue('totalMSPs', 'mspsInMyHub')}</h6>
                            </div>
                            <div className="w-50-px h-50-px bg-purple rounded-circle d-flex justify-content-center align-items-center">
                                <Icon
                                    icon="fa-solid:award"
                                    className="text-white text-2xl mb-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col">
                <div className="card shadow-none border bg-gradient-start-3 h-100">
                    <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                            <div>
                                <p className="fw-medium text-primary-light mb-1">
                                    Total Investors
                                </p>
                                <h6 className="mb-0">{getDisplayValue('totalAgents', null)}</h6>
                            </div>
                            <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                                <Icon
                                    icon="fluent:people-20-filled"
                                    className="text-white text-2xl mb-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                    <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                            <div>
                                <p className="fw-medium text-primary-light mb-1">Total Equipment</p>
                                <h6 className="mb-0">{getDisplayValue('totalEquipment', 'equipmentInMyHub')}</h6>
                            </div>
                            <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                                <Icon
                                    icon="lucide:tractor"
                                    className="text-white text-2xl mb-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                    <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                            <div>
                                <p className="fw-medium text-primary-light mb-1">Total Commodities</p>
                                <h6 className="mb-0">{getDisplayValue('totalCommodities', null)}</h6>
                            </div>
                            <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                                <Icon
                                    icon="fluent:food-grains-24-filled"
                                    className="text-white text-2xl mb-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                    <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                            <div>
                                <p className="fw-medium text-primary-light mb-1">Total Transactions</p>
                                <h6 className="mb-0">{formatCurrency(getDisplayValue('totalTransactions', null))}</h6>
                            </div>
                            <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                                <Icon
                                    icon="solar:wallet-bold"
                                    className="text-white text-2xl mb-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UnitCountOne