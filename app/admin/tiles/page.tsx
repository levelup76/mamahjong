import { getSupabaseServer } from "@/lib/supabase/server";
import { LAYOUTS, BOARD_IDS } from "@/lib/layouts";
import { glyphFor } from "@/lib/glyphs";
import AssetUploader from "@/components/AssetUploader";
import AssetItem from "@/components/AssetItem";

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
};

function publicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${path}`;
}

export default async function TilesPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("assets")
    .select("id, board_id, slot_key, storage_path, is_active")
    .eq("kind", "tile")
    .order("uploaded_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Egyedi kövek</h1>
      <p className="opacity-80 text-sm mb-6">
        5 pálya × 7 honőr = 35 családi fotó. Ajánlott formátum: négyzetes PNG
        átlátszó háttérrel, ~256×256 px. Ha nincs feltöltve, alapértelmezett
        glif jelenik meg.
      </p>

      <div className="space-y-8">
        {BOARD_IDS.map((boardId) => (
          <section
            key={boardId}
            className="rounded-xl bg-slate-800/60 p-4"
          >
            <h2 className="font-display text-xl mb-3">
              {boardId}. {LAYOUTS[boardId].name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {HONOR_SLOTS.map((slot) => {
                const active = rows.find(
                  (r) =>
                    r.board_id === boardId &&
                    r.slot_key === slot.key &&
                    r.is_active,
                );
                return (
                  <div
                    key={slot.key}
                    className="rounded bg-slate-900/40 p-2 flex flex-col items-center gap-2"
                  >
                    <div className="text-xs opacity-80">{slot.label}</div>
                    <div className="w-20 h-20 rounded bg-amber-50 flex items-center justify-center overflow-hidden">
                      {active ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={publicUrl(active.storage_path)}
                          alt={slot.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-slate-800">
                          {glyphFor(`honor-${slot.key}`)}
                        </span>
                      )}
                    </div>
                    <AssetUploader
                      kind="tile"
                      boardId={boardId}
                      slotKey={slot.key}
                      accept="image/*"
                      compact
                    />
                    {active && (
                      <AssetItem
                        id={active.id}
                        url={publicUrl(active.storage_path)}
                        kind="tile"
                        isActive
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
