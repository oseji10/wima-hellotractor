"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import Link from "next/link";
import api from "../../lib/api";
import { Box, CircularProgress } from '@mui/material';
import Image from "next/image";
import { getRole } from "../../lib/auth";

const MasterLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarActive, setSidebarActive] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null indicates loading
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loggedInState, setLoggedInState] = useState('');

  const staffRole = getRole();
  const refreshToken = useCallback(async () => {
    try {
      await api.post('/refresh', {}, { withCredentials: true });
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, { withCredentials: true });
        setIsAuthenticated(true);
        setRole(response.data.role || '');
        setName(`${response.data.firstName || ''} ${response.data.lastName || ''}`.trim());
        setLoggedInState(response.data.state || '');
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.config && !error.config.__isRetryRequest) {
          error.config.__isRetryRequest = true;
          const refreshed = await refreshToken();
          if (refreshed) {
            return api(error.config);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest(".dropdown");

      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains("open");

      // Close all dropdowns
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
        const submenu = dropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = "0px"; // Collapse submenu
        }
      });

      // Toggle the clicked dropdown
      if (!isActive) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
        }
      }
    };

    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        submenuLinks.forEach((link) => {
          if (
            link.getAttribute("href") === pathname ||
            link.getAttribute("to") === pathname
          ) {
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) {
              submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
            }
          }
        });
      });
    };

    // Attach click event listeners to all dropdown triggers
    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

    // Open the submenu that contains the active route
    openActiveDropdown();

    // Cleanup event listeners on unmount
    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [pathname]);

  // Handle redirect after all hooks are called
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const sidebarControl = () => {
    setSidebarActive(!sidebarActive);
  };

  const mobileMenuControl = () => {
    setMobileMenu(!mobileMenu);
  };

  // Function to render menu items based on role
  const renderMenuItems = () => {
    const currentRole = role || getRole();
    
    // Common menu items for all roles
    const commonItems = [
      <li key="dashboard" className="">
        <Link href="/dashboard">
          <Icon
            icon="solar:home-smile-angle-outline"
            className="menu-icon"
          />
          <span>Dashboard</span>
        </Link>
      </li>
    ];

    // Role-specific menu items
    let roleSpecificItems = [];
    
    if (currentRole === 'ADMIN' || currentRole === 'SUPER ADMIN') {
      roleSpecificItems = [
        <li key="users">
          <Link href="/dashboard/users">
            <Icon
              icon="ph:users-four"
              className="menu-icon"
            />
            <span>Users</span>
          </Link>
        </li>,
        <li key="projects">
          <Link href="/dashboard/projects">
            <Icon
              icon="ph:fediverse-logo-duotone"
              className="menu-icon"
            />
            <span>Projects</span>
          </Link>
        </li>,
,
        <li key="hubs">
          <Link href="/dashboard/active-locations">
            <Icon
              icon="solar:map-point-linear"
              className="menu-icon"
            />
            <span>Hubs</span>
          </Link>
        </li>,
        
        <li key="msps">
          <Link href="/dashboard/msps">
            <Icon
              icon="solar:users-group-rounded-line-duotone"
              className="menu-icon"
            />
            <span>MSPs</span>
          </Link>
        </li>,
        <li key="farmers">
          <Link href="/dashboard/farmers">
            <Icon
              icon="healthicons:agriculture-worker-outline"
              className="menu-icon"
            />
            <span>Farmers</span>
          </Link>
        </li>,
        <li key="services">
          <Link href="/dashboard/services">
            <Icon
              icon="vaadin:handshake"
              className="menu-icon"
            />
            <span>Services</span>
          </Link>
        </li>,
        <li key="commodities">
          <Link href="/dashboard/commodities">
            <Icon
              icon="ph:grains"
              className="menu-icon"
            />
            <span>Commodities</span>
          </Link>
        </li>,
        <li key="transactions">
          <Link href="/dashboard/transactions">
            <Icon
              icon="bitcoin-icons:transactions-filled"
              className="menu-icon"
            />
            <span>Transactions</span>
          </Link>
        </li>,
        <li key="memberships">
          <Link href="/dashboard/memberships">
            <Icon
              icon="cil:badge"
              className="menu-icon"
            />
            <span>Memberships</span>
          </Link>
        </li>,
        <li key="investors">
          <Link href="/dashboard/investors">
            <Icon
              icon="material-symbols-light:money-bag-outline"
              className="menu-icon"
            />
            <span>Investors</span>
          </Link>
        </li>,
        <li key="equipment">
          <Link href="/dashboard/equipment">
            <Icon
              icon="fluent:vehicle-tractor-24-regular"
              className="menu-icon"
            />
            <span>Equipment</span>
          </Link>
        </li>,
        <li key="bookings">
          <Link href="/dashboard/bookings">
            <Icon
              icon="majesticons:clock-line"
              className="menu-icon"
            />
            <span>Bookings</span>
          </Link>
        </li>,
        <li key="payments">
          <Link href="/dashboard/payments">
            <Icon
              icon="material-symbols-light:payments-outline"
              className="menu-icon"
            />
            <span>Payments</span>
          </Link>
        </li>,
        <li key="track-equipment">
          <Link href="/dashboard/track-equipment">
            <Icon
              icon="carbon:storm-tracker"
              className="menu-icon"
            />
            <span>Track Equipment</span>
          </Link>
        </li>,
        <li key="analytics">
          <Link href="/dashboard/analytics">
            <Icon icon="solar:pie-chart-outline" className="menu-icon" />
            <span>Analytics</span>
          </Link>
        </li>
      ];
    } else if (currentRole === 'MSP') {
      roleSpecificItems = [
        <li key="farmers">
          <Link href="/dashboard/farmers">
            <Icon
              icon="healthicons:agriculture-worker-outline"
              className="menu-icon"
            />
            <span>Farmers</span>
          </Link>
        </li>,
        <li key="services">
          <Link href="/dashboard/services">
            <Icon
              icon="vaadin:handshake"
              className="menu-icon"
            />
            <span>Services</span>
          </Link>
        </li>,
        <li key="equipment">
          <Link href="/dashboard/equipment">
            <Icon
              icon="fluent:vehicle-tractor-24-regular"
              className="menu-icon"
            />
            <span>Equipment</span>
          </Link>
        </li>,
        <li key="bookings">
          <Link href="/dashboard/bookings">
            <Icon
              icon="majesticons:clock-line"
              className="menu-icon"
            />
            <span>Bookings</span>
          </Link>
        </li>,
        <li key="track-equipment">
          <Link href="/dashboard/track-equipment">
            <Icon
              icon="carbon:storm-tracker"
              className="menu-icon"
            />
            <span>Track Equipment</span>
          </Link>
        </li>
      ];
    } else if (currentRole === 'National Coordinator' || currentRole === 'State Coordinator') {
      roleSpecificItems = [
        <li key="hubs">
          <Link href="/dashboard/active-locations">
            <Icon
              icon="solar:map-point-linear"
              className="menu-icon"
            />
            <span>Hubs</span>
          </Link>
        </li>,
        <li key="msps">
          <Link href="/dashboard/msps">
            <Icon
              icon="solar:users-group-rounded-line-duotone"
              className="menu-icon"
            />
            <span>MSPs</span>
          </Link>
        </li>,
        <li key="farmers">
          <Link href="/dashboard/farmers">
            <Icon
              icon="healthicons:agriculture-worker-outline"
              className="menu-icon"
            />
            <span>Farmers</span>
          </Link>
        </li>,
        <li key="memberships">
          <Link href="/dashboard/memberships">
            <Icon
              icon="cil:badge"
              className="menu-icon"
            />
            <span>Memberships</span>
          </Link>
        </li>,
        <li key="analytics">
          <Link href="/dashboard/analytics">
            <Icon icon="solar:pie-chart-outline" className="menu-icon" />
            <span>Analytics</span>
          </Link>
        </li>
      ];
    } else if (currentRole === 'Community Lead') {
      roleSpecificItems = [
        <li key="farmers">
          <Link href="/dashboard/farmers">
            <Icon
              icon="healthicons:agriculture-worker-outline"
              className="menu-icon"
            />
            <span>Farmers</span>
          </Link>
        </li>,
        <li key="services">
          <Link href="/dashboard/services">
            <Icon
              icon="vaadin:handshake"
              className="menu-icon"
            />
            <span>Services</span>
          </Link>
        </li>,
      
      ];
    }

       const commonItems2 = [
        <li key="feedback">
          <Link href="/dashboard/feedback">
            <Icon icon="fluent-mdl2:feedback" className="menu-icon" />
            <span>Feedback</span>
          </Link>
        </li>,
      <li key="help">
        <Link href="/dashboard/help">
          <Icon icon="material-symbols:help-outline-rounded" className="menu-icon" />
          <span>Help</span>
        </Link>
      </li>
    ];
    return [...commonItems, ...roleSpecificItems, ...commonItems2];
  };

  // Render loading state
  if (isAuthenticated === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Render main content only if authenticated
  return (
    <section className={mobileMenu ? "overlay active" : "overlay"}>
      {/* Sidebar */}
      <aside
        className={
          sidebarActive
            ? "sidebar active"
            : mobileMenu
            ? "sidebar sidebar-open"
            : "sidebar"
        }
      >
        <button
          onClick={mobileMenuControl}
          type="button"
          className="sidebar-close-btn"
        >
          <Icon icon="radix-icons:cross-2" />
        </button>
        <div>
          <Link href="/" className="sidebar-logo">
            <Image 
              className="light-logo"
              src="/assets/images/wima-logo.svg" alt="Home Icon" width={300} height={70} 
            />
            <Image 
              className="dark-logo"
              src="/assets/images/wima-logo.svg" alt="Home Icon" width={300} height={70} 
            />
            <Image 
              className="logo-icon"
              src="/assets/images/wima-logo.svg" alt="Home Icon" width={300} height={70} 
            />
          </Link>
        </div>
        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            {renderMenuItems()}
          </ul>
        </div>
      </aside>

      <main className={sidebarActive ? "dashboard-main active" : "dashboard-main"}>
        <div className="navbar-header">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-4">
                <button
                  type="button"
                  className="sidebar-toggle"
                  onClick={sidebarControl}
                >
                  {sidebarActive ? (
                    <Icon
                      icon="iconoir:arrow-right"
                      className="icon text-2xl non-active"
                    />
                  ) : (
                    <Icon
                      icon="heroicons:bars-3-solid"
                      className="icon text-2xl non-active"
                    />
                  )}
                </button>
                <button
                  onClick={mobileMenuControl}
                  type="button"
                  className="sidebar-mobile-toggle"
                >
                  <Icon icon="heroicons:bars-3-solid" className="icon" />
                </button>
                <form className="navbar-search">
                  <input type="text" name="search" placeholder="Search" />
                  <Icon icon="ion:search-outline" className="icon" />
                </form>
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-3">
                <ThemeToggleButton />
              
                {name || "User"}<br/>
                {role || "Role"}
                <div className="dropdown">
                  <button
                    className="d-flex justify-content-center align-items-center rounded-circle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <img
                      src="/assets/images/profile.jpg"
                      alt="image_user"
                      className="w-40-px h-40-px object-fit-cover rounded-circle"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-sm">
                    
                    <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-2">
                          {name || "User"}
                        </h6>
                        <span className="text-secondary-light fw-medium text-sm">
                          {role || "Role"}
                        </span>
                      </div>
                      <button type="button" className="hover-text-danger">
                        <Icon
                          icon="radix-icons:cross-1"
                          className="icon text-xl"
                        />
                      </button>
                    </div>
                    <ul className="to-top-list">
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          href="/view-profile"
                        >
                          <Icon
                            icon="solar:user-linear"
                            className="icon text-xl"
                          />
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          href="/email"
                        >
                          <Icon
                            icon="tabler:message-check"
                            className="icon text-xl"
                          />
                          Inbox
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          href="/company"
                        >
                          <Icon
                            icon="icon-park-outline:setting-two"
                            className="icon text-xl"
                          />
                          Setting
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3"
                          href="/"
                        >
                          <Icon icon="lucide:power" className="icon text-xl" />
                          Log Out
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Profile dropdown end */}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard main body */}
        <div className="dashboard-main-body">{children}</div>

        {/* Footer section */}
        <footer className="d-footer">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <p className="mb-0">© 2025 Women In Mechanized Agriculture. All Rights Reserved.</p>
            </div>
            <div className="col-auto">
              <p className="mb-0">
                Powered by <span className="text-primary-600">Resilience Nigeria</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
};

export default MasterLayout;