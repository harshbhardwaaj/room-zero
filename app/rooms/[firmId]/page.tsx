import { notFound } from "next/navigation";

import { RoomDetail } from "@/components/product/room-detail";
import { getRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ firmId: string }>;
}) {
  const { firmId } = await params;
  const room = await getRoom(firmId);
  if (!room) notFound();
  return <RoomDetail room={room} />;
}
