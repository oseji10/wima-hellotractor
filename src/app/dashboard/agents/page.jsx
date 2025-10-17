import AgentsTable from "@/components/Agents";
import Breadcrumb from "@/components/Breadcrumb";
import Transactions from "@/components/Transactions";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Transactions - MamaTrak App",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Agents' />

        {/* TableDataLayer */}
        <AgentsTable />
      </MasterLayout>
    </>
  );
};

export default Page;
