import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import MSPSTable from "@/components/MSPs";
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
        <Breadcrumb title='MSPs' />

        {/* TableDataLayer */}
        <MSPSTable />
      </MasterLayout>
    </>
  );
};

export default Page;
