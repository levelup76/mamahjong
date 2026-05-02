import { getSupabaseServer } from "@/lib/supabase/server";
import AssetUploader from "@/components/AssetUploader";
import AssetItem from "@/components/AssetItem";

type Row = {
  id: string;
  kind: "music" | "sound";
  slot_key: string | null;
  storage_path: string;
  is_active: boolean;
};

function publicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${path}`;
}

const SOUND_SLOTS: { key: string; title: string }[] = [
  { key: "click", title: "Kattintás (csempe kijelölés)" },
  { key: "match", title: "Párosítás (sikeres pár)" },
  { key: "win", title: "Győzelem" },
  { key: "stuck", title: "Zsákutca" },
];

export default async function AudioPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("assets")
    .select("id, kind, slot_key, storage_path, is_active")
    .in("kind", ["music", "sound"])
    .order("uploaded_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl mb-4">Háttérzene</h1>
        <p className="opacity-80 text-sm mb-4">
          Több sávot is feltölthetsz. A játékos a beállításokban válthat
          közöttük; minden aktív sáv elérhető.
        </p>
        <AssetUploader kind="music" accept="audio/*" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {rows
            .filter((r) => r.kind === "music")
            .map((r) => (
              <AssetItem
                key={r.id}
                id={r.id}
                url={publicUrl(r.storage_path)}
                kind="music"
                isActive={r.is_active}
                meta={r.storage_path.split("/").pop()}
              />
            ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Hangeffektek</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SOUND_SLOTS.map((slot) => {
            const slotRows = rows.filter(
              (r) => r.kind === "sound" && r.slot_key === slot.key,
            );
            return (
              <div
                key={slot.key}
                className="rounded-xl bg-slate-800/60 p-4"
              >
                <h3 className="font-display text-lg mb-2">{slot.title}</h3>
                <AssetUploader
                  kind="sound"
                  slotKey={slot.key}
                  accept="audio/*"
                />
                {slotRows.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {slotRows.map((r) => (
                      <AssetItem
                        key={r.id}
                        id={r.id}
                        url={publicUrl(r.storage_path)}
                        kind="sound"
                        isActive={r.is_active}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
