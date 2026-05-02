import { getSupabaseServer } from "@/lib/supabase/server";
import { LAYOUTS, BOARD_IDS } from "@/lib/layouts";
import AssetUploader from "@/components/AssetUploader";
import AssetItem from "@/components/AssetItem";

type Row = {
  id: string;
  board_id: number | null;
  storage_path: string;
  is_active: boolean;
};

function publicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${path}`;
}

export default async function BackgroundsPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("assets")
    .select("id, board_id, storage_path, is_active")
    .eq("kind", "background")
    .order("uploaded_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  const slots: { boardId: number | null; title: string }[] = [
    { boardId: null, title: "Globális (minden pályán fallback)" },
    ...BOARD_IDS.map((id) => ({
      boardId: id as number,
      title: `${id}. ${LAYOUTS[id].name}`,
    })),
  ];

  return (
    <div>
      <h1 className="font-display text-3xl mb-4">Háttérképek</h1>
      <p className="opacity-80 text-sm mb-6">
        Globális háttér mindenhol érvényes; pálya-specifikus háttér felülírja.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {slots.map((slot) => {
          const slotRows = rows.filter((r) => r.board_id === slot.boardId);
          return (
            <section
              key={String(slot.boardId)}
              className="rounded-xl bg-slate-800/60 p-4"
            >
              <h2 className="font-display text-lg mb-2">{slot.title}</h2>
              <AssetUploader
                kind="background"
                boardId={slot.boardId}
                accept="image/*"
              />
              {slotRows.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {slotRows.map((r) => (
                    <AssetItem
                      key={r.id}
                      id={r.id}
                      url={publicUrl(r.storage_path)}
                      kind="background"
                      isActive={r.is_active}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
