import MspCacForm from "@/components/MSPCAC";
import SignUpLayer from "@/components/SignUpLayer";

export const metadata = {
  title: "MSPs CAC Update Form - MamaTrak App",
  description:
    "WIMA is at the forefront of revolutionizing mechanized agriculture in Nigeria",
};

const Page = () => {
  return (
    <>
      {/* SignUpLayer */}
      <MspCacForm />
    </>
  );
};

export default Page;
