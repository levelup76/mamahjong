import Link from "next/link";

const sections = [
  { href: "/admin/backgrounds", title: "Háttérképek", desc: "Globális vagy pályánként." },
  { href: "/admin/audio", title: "Zene és hangok", desc: "Háttérzene + effektek (klikk, párosítás, győzelem)." },
  { href: "/admin/tiles", title: "Egyedi kövek", desc: "5 pálya × 7 honőr = 35 családi fotó." },
  { href: "/admin/scores", title: "Eredmények", desc: "Játékosok és időik pályánként." },
];

export default function AdminHome() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sections.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className="block rounded-xl bg-slate-800/70 hover:bg-slate-700 transition p-6 shadow"
        >
          <div className="font-display text-xl">{s.title}</div>
          <p className="text-sm opacity-80 mt-1">{s.desc}</p>
        </Link>
      ))}
    </div>
  );
}
