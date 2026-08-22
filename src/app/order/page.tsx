import type { Metadata } from "next";
import OrderForm from "@/components/OrderForm";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Order Ahead",
  description:
    "Order True North Ice Cream ahead for pickup in Marshall or Battle Creek: homemade pints and quarts, ice cream sandwiches, cakes, and pies. Pay at the counter.",
  alternates: { canonical: "/order" },
};

/*
  The ?at= preselect is read HERE, server-side, and handed to the form as a
  prop, never via useSearchParams in the client component. That distinction
  is load-bearing: useSearchParams bails the subtree out of the prerendered
  HTML, and an earlier version of this page shipped with NO form in its
  HTML at all, a blank hole before hydration and a dead end without JS,
  which also made the API route's whole no-JS branch unreachable. Reading
  searchParams makes the route request-rendered; for a form page that is the
  right trade.
*/
export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ at?: string }>;
}) {
  const { at } = await searchParams;

  return (
    <>
      <PageHero
        kicker="Order ahead"
        title="Ready when you are"
        lede="Pick your shop, tell us what to pull from the freezer, and it will be waiting at the counter. You pay when you pick up, card or cash."
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <OrderForm preselect={at} />
      </section>
    </>
  );
}
