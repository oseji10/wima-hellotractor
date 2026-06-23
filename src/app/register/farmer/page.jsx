import FarmerRegistration from "@/components/FarmerRegistration";
import SignUpLayer from "@/components/SignUpLayer";

export const metadata = {
  title: "Register Farmer - MamaTrak App",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* SignUpLayer */}
      <FarmerRegistration />
    </>
  );
};

export default Page;
