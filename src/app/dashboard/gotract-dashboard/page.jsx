import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import FarmersTable from "@/components/Farmers";
import GoTractAccreditationDesk from "@/components/GoTractAccreditationDesk";
import GoTractDashboard from "@/components/GoTractDashboard";
import MSPSTable from "@/components/MSPs";
import TableDataLayer from "@/components/TableDataLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Accreditation Desk - Women In Mechanized Agriculture",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Accreditation Desk' />

        {/* TableDataLayer */}
        <GoTractDashboard />
      </MasterLayout>
    </>
  );
};

export default Page;
