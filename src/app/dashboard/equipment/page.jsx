import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import EquipmentTable from "@/components/Equipment";
import EquipmentManagement from "@/components/EquipmentManagement";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Equipment - Women In Mechanized Agriculture",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Equipment' />

        {/* TableDataLayer */}
        {/* <EquipmentTable /> */}
        <EquipmentManagement/>
      </MasterLayout>
    </>
  );
};

export default Page;
