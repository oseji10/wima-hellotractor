import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import MembershipsTable from "@/components/Memberships";
import MSPSTable from "@/components/MSPs";
import ServicesTable from "@/components/Services";
import TableDataLayer from "@/components/TableDataLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Services - MamaTrak App",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Services' />

        {/* TableDataLayer */}
        <ServicesTable />
      </MasterLayout>
    </>
  );
};

export default Page;
