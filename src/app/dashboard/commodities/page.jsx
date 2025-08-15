import Breadcrumb from "@/components/Breadcrumb";
import CommoditiesTable from "@/components/Commodities";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Commodities - MamaTrak App",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Commodities' />

        {/* TableDataLayer */}
        <CommoditiesTable />
      </MasterLayout>
    </>
  );
};

export default Page;
