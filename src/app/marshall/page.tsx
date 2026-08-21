import LocationPage, { locationMetadata } from "@/components/LocationPage";
import { locationBySlug } from "@/data/site";

const location = locationBySlug("marshall")!;

export const metadata = locationMetadata(location);

export default function MarshallPage() {
  return <LocationPage location={location} />;
}
