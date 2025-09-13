"use client";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { getCommunity, getLoggedInState, getRole } from "../../../lib/auth";
import { useEffect, useState } from "react";

const DefaultCard = () => {
  const [loggedInState, setLoggedInState] = useState("");
  const [community, setCommunity] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setLoggedInState(getLoggedInState());
    setCommunity(getCommunity());
    setRole(getRole());

  }, []);
  return (
    <div className='mb-40'>
      <div className='row gy-4'>
        <div className='col-xxl-12 col-sm-6'>
          <div className='card h-100 radius-12'>
            <img
              src='assets/images/card-component/card-img1.png'
              className='card-img-top'
              alt=''
            />
            <div className='card-body p-16'>
              <h5
                className='card-title text-lg text-primary-light
             mb-6'
              >
               Logged in as {loggedInState ? loggedInState : ""} {community ? community : ""} {" "}
               {role ? role : "N/A"}
              </h5>
              <p className='card-text text-neutral-600'>
                <i className="icon-class" style={{ fontStyle: "italic" }}>Always remember that your most unhappy customers are your greatest source of learning</i>
              </p>
              {/* <Link
                href='#'
                className='btn text-primary-600 hover-text-primary px-0 py-10 d-inline-flex align-items-center gap-2'
              >
                Read More{" "}
                <Icon icon='iconamoon:arrow-right-2' className='text-xl' />
              </Link> */}
            </div>
          </div>
        </div>
      
      
     
      </div>
    </div>
  );
};

export default DefaultCard;
