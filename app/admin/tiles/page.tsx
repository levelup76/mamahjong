import { getSupabaseServer } from "@/lib/supabase/server";
import { LAYOUTS, BOARD_IDS } from "@/lib/layouts";
import TileSlot from "@/components/TileSlot";

const HONOR_SLOTS: { key: string; label: string }[] = [
  { key: "east", label: "Kelet" },
  { key: "south", label: "Dél" },
  { key: "west", label: "Nyugat" },
  { key: "north", label: "Észak" },
  { key: "red", label: "Vörös sárkány" },
  { key: "green", label: "Zöld sárkány" },
  { key: "white", label: "Fehér sárkány" },
];

type Row = {
  id: string;
  board_id: number | null;
  slot_key: string | null;
  storage_path: string;
  is_active: boolean;
  crop_zoom: number | null;
  crop_x: number | null;
  crop_y: number | null;
};

function publicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${path}`;
}

export default async function TilesPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("assets")
    .select("id, board_id, slot_key, storage_path, is_active, crop_zoom, crop_x, crop_y")
    .eq("kind", "tile")
    .order("uploaded_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Egyedi kövek</h1>
      <p className="opacity-80 text-sm mb-6 max-w-3xl">
        Pályánként 7 honőr-csempe. Kattints egy kőre és nyomj <kbd>⌘V</kbd>-t a
        vágólap tartalmának beillesztéséhez (pl. macOS Photos &rarr; jobb
        klikk &rarr; <em>Másolás (Tárgy)</em>), vagy használd a{" "}
        <strong>Tallózás</strong> gombot. Ajánlott formátum: négyzetes PNG
        átlátszó háttérrel.
      </p>

      <div className="space-y-6">
        {BOARD_IDS.map((boardId) => (
          <section key={boardId} className="rounded-xl bg-slate-800/60 p-4">
            <h2 className="font-display text-xl mb-3">
              {boardId}. {LAYOUTS[boardId].name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {HONOR_SLOTS.map((slot) => {
                const active = rows.find(
                  (r) =>
                    r.board_id === boardId &&
                    r.slot_key === slot.key &&
                    r.is_active,
                );
                return (
                  <TileSlot
                    key={slot.key}
                    boardId={boardId}
                    slotKey={slot.key}
                    label={slot.label}
                    activeAssetId={active?.id ?? null}
                    activeUrl={active ? publicUrl(active.storage_path) : null}
                    activeCropZoom={active?.crop_zoom ?? 1}
                    activeCropX={active?.crop_x ?? 0}
                    activeCropY={active?.crop_y ?? 0}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
