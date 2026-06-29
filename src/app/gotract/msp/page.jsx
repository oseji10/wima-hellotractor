import FarmerRegistration from "@/components/FarmerRegistration";
import MSPRegistration from "@/components/MSPRegistration";
import SignUpLayer from "@/components/SignUpLayer";

export const metadata = {
  title: "ISSAM Project Attendance Form - MamaTrak App",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* SignUpLayer */}
      <MSPRegistration />
    </>
  );
};

export default Page;
