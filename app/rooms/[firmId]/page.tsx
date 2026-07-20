import { RoomDetail } from "@/components/product/room-detail";
import { RoomFallback } from "@/components/product/room-fallback";
import { getRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ firmId: string }>;
}) {
  const { firmId } = await params;
  const room = await getRoom(firmId);
  // A miss here used to mean notFound(). On a deployed build it usually means
  // the opposite: the room was generated seconds ago and could not be written
  // to a read-only filesystem, so the browser is holding the only copy. Hand
  // off to the client, which can look; it renders the not-found state itself
  // if there is genuinely nothing.
  if (!room) return <RoomFallback firmId={firmId} />;
  return <RoomDetail room={room} />;
}
