import Breadcrumb from "@/components/Breadcrumb";
import PaginationLayer from "@/components/PaginationLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "WIMA App - Women In Mechanized Agriculture",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Components / Pagination' />

        {/* PaginationLayer */}
        <PaginationLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
