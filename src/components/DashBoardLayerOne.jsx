import { getRole } from "../../lib/auth";
import AlertLayer from "./AlertLayer";
import BadgesLayer from "./BadgesLayer";
import CardLayer from "./CardLayer";
import GeneratedContent from "./child/GeneratedContent";
import LatestRegisteredOne from "./child/LatestRegisteredOne";
import SalesStatisticOne from "./child/SalesStatisticOne";
import TopCountries from "./child/TopCountries";
import TopPerformerOne from "./child/TopPerformerOne";
import TotalSubscriberOne from "./child/TotalSubscriberOne";
import UnitCountOne from "./child/UnitCountOne";
import UsersOverviewOne from "./child/UsersOverviewOne";
import WalletLayer from "./WalletLayer";

const DashBoardLayerOne = () => {
  const role = getRole();

  return (
    <>
      <CardLayer />

      {/* UnitCountOne */}
      <UnitCountOne />

      <section className="row gy-4 mt-1">
        {/* SalesStatisticOne */}
        <SalesStatisticOne />

        {/* TotalSubscriberOne */}
        <TotalSubscriberOne />

        {/* UsersOverviewOne */}
        <UsersOverviewOne />

        {/* LatestRegisteredOne (only visible to specific roles) */}
        {(role === "National Coordinator" ||
          role === "SUPER ADMIN" ||
          role === "ADMIN") && <LatestRegisteredOne />}

        {/* Optional components */}
        {/* <TopPerformerOne /> */}
        {/* <TopCountries /> */}
        {/* <GeneratedContent /> */}
      </section>
    </>
  );
};

export default DashBoardLayerOne;
