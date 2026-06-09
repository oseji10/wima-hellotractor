import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import MSPSTable from "@/components/MSPs";
import SecurityManagement from "@/components/SecurityManagement";
import TableDataLayer from "@/components/TableDataLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "MSPs - Women In Mechanized Agriculture",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Security and Safeguarding' />

        {/* TableDataLayer */}
        <SecurityManagement />
      </MasterLayout>
    </>
  );
};

export default Page;
