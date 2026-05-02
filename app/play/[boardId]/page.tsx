import { notFound } from "next/navigation";
import Game from "@/components/Game";
import AudioProvider from "@/components/AudioProvider";
import { BOARD_IDS, type BoardId } from "@/lib/layouts";
import { getCurrentUser } from "@/lib/supabase/server";
import { resolveAllAssets, pickBackground } from "@/lib/assets";

type Params = Promise<{ boardId: string }>;

export default async function PlayPage({ params }: { params: Params }) {
  const { boardId: raw } = await params;
  const id = Number.parseInt(raw, 10) as BoardId;
  if (!BOARD_IDS.includes(id)) notFound();
  const user = await getCurrentUser();
  const assets = await resolveAllAssets();
  const bg = pickBackground(assets, id);

  // Convert resolved sound map (string keys) to typed slots for AudioProvider.
  const sounds = new Map<"click" | "match" | "win" | "stuck", string>();
  for (const slot of ["click", "match", "win", "stuck"] as const) {
    const url = assets.sounds.get(slot);
    if (url) sounds.set(slot, url);
  }
  const music = assets.music.map((m) => m.url);

  return (
    <div
      className="min-h-screen"
      style={
        bg
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }
          : undefined
      }
    >
      <AudioProvider sounds={sounds} music={music}>
        <Game
          boardId={id}
          loggedIn={Boolean(user)}
          tileImages={assets.tiles}
        />
      </AudioProvider>
    </div>
  );
}
