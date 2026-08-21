import type { Metadata } from "next";
import { Suspense } from "react";
import OrderForm from "@/components/OrderForm";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Order Ahead",
  description:
    "Order True North Ice Cream ahead for pickup in Marshall or Battle Creek: homemade pints and quarts, ice cream sandwiches, cakes, and pies. Pay at the counter.",
  alternates: { canonical: "/order" },
};

export default function OrderPage() {
  return (
    <>
      <PageHero
        kicker="Order ahead"
        title="Ready when you are"
        lede="Pick your shop, tell us what to pull from the freezer, and it will be waiting at the counter. You pay when you pick up — card or cash."
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        {/*
          Suspense because the form reads ?at= to preselect the shop; the
          fallback is the same form shell so nothing jumps.
        */}
        <Suspense fallback={<div className="min-h-[40rem]" aria-hidden />}>
          <OrderForm />
        </Suspense>
      </section>
    </>
  );
}
