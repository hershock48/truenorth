import LocationPage, { locationMetadata } from "@/components/LocationPage";
import { locationBySlug } from "@/data/site";

const location = locationBySlug("battle-creek")!;

export const metadata = locationMetadata(location);

export default function BattleCreekPage() {
  return <LocationPage location={location} />;
}
