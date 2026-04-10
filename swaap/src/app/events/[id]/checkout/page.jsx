import { dummyEvents } from "@/lib/dummy-data";
import CheckoutClient from "../CheckoutClient";

export function generateStaticParams() {
  return dummyEvents.map((e) => ({ id: e.id }));
}

export default async function CheckoutPage({ params }) {
  const { id } = await params;
  return <CheckoutClient id={id} />;
}
