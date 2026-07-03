"use client";
import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react';
import api from '../../../lib/api';
import { getRole } from '../../../lib/auth';

const num = (v) => Number(v || 0);

/* Reusable stat card matching the dashboard's WowDash styling */
const StatCard = ({ label, value, icon, gradient = "bg-gradient-start-1", circle = "bg-cyan" }) => (
    <div className="col">
        <div className={`card shadow-none border ${gradient} h-100`}>
            <div className="card-body p-20">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                        <p className="fw-medium text-primary-light mb-1">{label}</p>
                        <h6 className="mb-0">{value}</h6>
                    </div>
                    <div className={`w-50-px h-50-px ${circle} rounded-circle d-flex justify-content-center align-items-center`}>
                        <Icon icon={icon} className="text-white text-2xl mb-0" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const UnitCountOne = () => {
    const [data, setData] = useState(null);        // /dashboard payload (default view)
    const [gotract, setGotract] = useState(null);  // /gotract/stats payload (govt view)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("");

    useEffect(() => {
        const currentRole = getRole();
        setRole(currentRole);

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (currentRole === 'GOTRACT PARTNER') {
                    // Government officials only see GoTRACT programme figures.
                    const response = await api.get('/gotract/stats');
                    setGotract(response.data?.data || null);
                } else {
                    const response = await api.get('/dashboard');
                    setData(response.data);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

    /* ------------------------------------------------------------------ */
    /*  Government official view — GoTRACT applications only               */
    /* ------------------------------------------------------------------ */
    if (role === 'GOTRACT PARTNER') {
        const byStatus = gotract?.byStatus || {};
        const pending = num(byStatus.pending) + num(byStatus.screening);
        const approved = num(byStatus.approved);
        const rejected = num(byStatus.rejected);
        const totalTarget = num(gotract?.totalTarget);
        const total = num(gotract?.total);
        const coverage = totalTarget ? Math.min(100, Math.round((approved / totalTarget) * 100)) : 0;

        return (
            <div className="row row-cols-xxxl-5 row-cols-lg-4 row-cols-sm-2 row-cols-1 gy-4">
                <StatCard
                    label="Total Applications"
                    value={total.toLocaleString()}
                    icon="mdi:file-document-multiple-outline"
                    gradient="bg-gradient-start-1"
                    circle="bg-cyan"
                />
                <StatCard
                    label="Pending Review"
                    value={pending.toLocaleString()}
                    icon="mdi:clock-outline"
                    gradient="bg-gradient-start-2"
                    circle="bg-purple"
                />
                <StatCard
                    label="Approved"
                    value={approved.toLocaleString()}
                    icon="mdi:check-decagram-outline"
                    gradient="bg-gradient-start-3"
                    circle="bg-success-main"
                />
                <StatCard
                    label="Rejected"
                    value={rejected.toLocaleString()}
                    icon="mdi:close-circle-outline"
                    gradient="bg-gradient-start-4"
                    circle="bg-danger"
                />
                <StatCard
                    label={`Approved of Target (${coverage}%)`}
                    value={`${approved.toLocaleString()} / ${totalTarget.toLocaleString()}`}
                    icon="mdi:target-arrow"
                    gradient="bg-gradient-start-1"
                    circle="bg-info"
                />
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Default view                                                      */
    /* ------------------------------------------------------------------ */
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
            {/* <div className="col">
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
            </div> */}
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
                                <h6 className="mb-0">
                                    {getDisplayValue('totalTransactions', 0)?.toLocaleString()}
                                </h6>
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