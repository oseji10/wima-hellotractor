import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import FarmersTable from "@/components/Farmers";
import GoTractAccreditationDesk from "@/components/GoTractAccreditationDesk";
import GoTractScanner from "@/components/GoTractScanner";
import MSPSTable from "@/components/MSPs";
import TableDataLayer from "@/components/TableDataLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Scanner - Women In Mechanized Agriculture",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Scanner' />

        {/* TableDataLayer */}
        <GoTractScanner/>
      </MasterLayout>
    </>
  );
};

export default Page;
