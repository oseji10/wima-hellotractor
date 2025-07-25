import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import TableDataLayer from "@/components/TableDataLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Hubs - Women In Mechanized Agriculture",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Active Hubs' />

        {/* TableDataLayer */}
        <ActiveLocations />
      </MasterLayout>
    </>
  );
};

export default Page;
