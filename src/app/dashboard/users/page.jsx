import ActiveLocations from "@/components/ActiveLocations";
import Breadcrumb from "@/components/Breadcrumb";
import UsersTable from "@/components/Users";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Users - Women In Mechanized Agriculture",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Users' />

        {/* TableDataLayer */}
        <UsersTable />
      </MasterLayout>
    </>
  );
};

export default Page;
