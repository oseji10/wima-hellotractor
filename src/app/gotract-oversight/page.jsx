import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import FarmersTable from "@/components/Farmers";
import GoTractApplication from "@/components/GoTract";
import GoTractApplicationsTable from "@/components/GoTractApplications";
import GoTractOversight from "@/components/GoTractOversight";
import MSPSTable from "@/components/MSPs";
import TableDataLayer from "@/components/TableDataLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "GoTract Applications - Women In Mechanized Agriculture",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      {/* <MasterLayout> */}
        {/* Breadcrumb */}
        {/* <Breadcrumb title='GoTract Applications' /> */}

        {/* TableDataLayer */}
        <GoTractOversight />
      {/* </MasterLayout> */}
    </>
  );
};

export default Page;
