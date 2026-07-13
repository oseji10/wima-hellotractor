import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import FarmersTable from "@/components/Farmers";
import GoTractBadgeGenerator from "@/components/GotractBadgeGenerator";
import MSPSTable from "@/components/MSPs";
import TableDataLayer from "@/components/TableDataLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Badge Generator - Women In Mechanized Agriculture",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Badge Generator ' />

        {/* TableDataLayer */}
        <GoTractBadgeGenerator />
      </MasterLayout>
    </>
  );
};

export default Page;
