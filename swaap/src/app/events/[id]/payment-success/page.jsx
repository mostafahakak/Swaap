import { dummyEvents } from "@/lib/dummy-data";
import PaymentSuccessClient from "../PaymentSuccessClient";

export function generateStaticParams() {
  return dummyEvents.map((e) => ({ id: e.id }));
}

export default async function PaymentSuccessPage({ params }) {
  const { id } = await params;
  return <PaymentSuccessClient id={id} />;
}
