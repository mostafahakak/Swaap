import { dummyEvents } from "@/lib/dummy-data";
import EventDetailClient from "./EventDetailClient";

export function generateStaticParams() {
  return dummyEvents.map((e) => ({ id: e.id }));
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  return <EventDetailClient id={id} />;
}
