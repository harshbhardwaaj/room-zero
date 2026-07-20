import { RoomIndex } from "@/components/product/room-index";
import { listRoomSummaries } from "@/lib/rooms";

// Always read the store fresh so a room generated moments ago shows up.
export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const rooms = await listRoomSummaries();
  return <RoomIndex rooms={rooms} />;
}
