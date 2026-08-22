import LocationPage, { locationMetadata } from "@/components/LocationPage";
import { locationBySlug } from "@/data/site";

const location = locationBySlug("marshall")!;

export const metadata = locationMetadata(location);
/* ISR so the live board actually goes live, see the note in app/page.tsx. */
export const revalidate = 60;

export default function MarshallPage() {
  return <LocationPage location={location} />;
}
