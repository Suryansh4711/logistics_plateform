import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export const socket: Socket = io(BACKEND_URL, {
  transports: ["websocket"],
});

export async function fetchSnapshot() {
  const res = await fetch(`${BACKEND_URL}/api/snapshot`);
  if (!res.ok) throw new Error("Failed to fetch snapshot");
  return res.json();
}
