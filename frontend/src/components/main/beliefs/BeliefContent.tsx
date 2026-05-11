import { useState } from "react";

type ColorKey = "blue" | "purple" | "coral" | "teal" | "amber" | "green";

interface Belief {
  id: string;
  icon: string;
  category: string;
  title: string;
  description: string;
  source: string;
  color: ColorKey;
}

interface BeliefCardProps {
  belief: Belief;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const beliefs: Belief[] = [
  {
    id: "Belief 01",
    icon: "🏛️",
    category: "Transparență Fiscală",
    title: "Datele ANAF sunt accesibile oricui",
    description:
      "Credem că informațiile fiscale publice — bilanțuri, declarații, datorii restante — trebuie să fie ușor de accesat, nu îngropate în birocrație digitală.",
    source: "ANAF",
    color: "blue",
  },
  {
    id: "Belief 02",
    icon: "⚖️",
    category: "Justiție & Drept",
    title: "Dosarele instanțelor trebuie să fie usor de umărit în timp real",
    description:
      "Portal.just.ro există, dar este complicat. Noi credem că orice cetățean trebuie să poată urmări dosarele relevante fără efort tehnic.",
    source: "portal.just.ro",
    color: "purple",
  },
  {
    id: "Belief 03",
    icon: "📰",
    category: "Presă & Jurnalism",
    title: "Știrile trebuie verificate de la sursă, nu prelucrate",
    description:
      "Alegem din surse primare de presă și le comparăm cu datele oficiale. Nu filtrăm, nu editoriem ci arătăm contrastele.",
    source: "journalism",
    color: "coral",
  },
  {
    id: "Belief 04",
    icon: "📋",
    category: "Achiziții Publice",
    title: "SEAP nu este doar o bază de date, ci o oglindă a cheltuirii banilor publici.",
    description:
      "Fiecare contract din SEAP/SICAP este o decizie publică. Credem că agregarea și analiza lor automată e un drept civic, nu un privilegiu.",
    source: "SEAP/SICAP",
    color: "teal",
  },
  {
    id: "Belief 05",
    icon: "👤",
    category: "Profiluri Publice",
    title: "Persoanele publice au un profil public verificabil",
    description:
      "Politicieni, directori de companii de stat, funcționari cu declarații de avere - toate aceste informații există oficial. Noi le centralizăm.",
    source: "sm_profiles",
    color: "amber",
  },
  {
    id: "Belief 06",
    icon: "📄",
    category: "Documente Oficiale",
    title: "PDF-urile oficiale nu trebuie să fie black boxes",
    description:
      "Zeci de mii de documente PDF sunt publicate zilnic de instituții. Credem că extragerea automată a datelor din ele este esențială pentru democrație.",
    source: "ani_pdf",
    color: "green",
  },
];

const cardAccents: Record<ColorKey, string> = {
  blue:   "#3b82f6",
  purple: "#8b5cf6",
  coral:  "#f97316",
  teal:   "#14b8a6",
  amber:  "#f59e0b",
  green:  "#22c55e",
};

function BeliefCard({ belief, isActive, onClick }: BeliefCardProps) {
  const accent = cardAccents[belief.color];

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        border: isActive ? `1px solid var(--highlight)` : `1px solid var(--border)`,
        borderRadius: "var(--radius)",
        padding: "1.5rem",
        background: isActive ? "var(--card)" : "var(--background)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isActive ? "translateY(-4px)" : "translateY(0)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isActive && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: `linear-gradient(90deg, transparent, var(--highlight), transparent)`,
        }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "1rem" }}>
        <div style={{ fontSize: "24px", lineHeight: 1, filter: isActive ? "none" : "grayscale(40%)", transition: "filter 0.3s" }}>
          {belief.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" as const }}>
            <span style={{
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: isActive ? "var(--highlight)" : "var(--muted-foreground)",
              fontFamily: "'JetBrains Mono', monospace",
              transition: "color 0.3s",
            }}>
              {belief.category}
            </span>
            <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)", opacity: 0.5 }}>
              #{belief.id}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--foreground)", lineHeight: 1.4 }}>
            {belief.title}
          </h3>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "13px", color: "var(--muted-foreground)", lineHeight: 1.65 }}>
        {belief.description}
      </p>

      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: `1px solid var(--border)`, display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)", opacity: 0.6 }}>
          sursă: {belief.source}
        </span>
      </div>
    </div>
  );
}

export default function BeliefContent() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", position: "relative", overflow: "hidden" }}>

      {/* Glow ambient din culoarea temei */}
      <div style={{
        position: "fixed", top: "-30%", left: "50%", transform: "translateX(-50%)",
        width: "900px", height: "600px",
        background: "radial-gradient(ellipse, color-mix(in oklch, var(--highlight) 8%, transparent) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto", padding: "0 2rem" }}>

        {/* Header */}
   

          <h1 style={{
            margin: "0 0 1.25rem",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1,
            color: "var(--foreground)",
          }}>
            Ce credem noi<br />despre informație
          </h1>

          <p style={{ margin: 0, fontSize: "16px", color: "var(--muted-foreground)", maxWidth: "560px", lineHeight: 1.7 }}>
            e-Scraps nu este doar un motor de căutare ci este o platformă cu un punct de vedere.
            Iată principiile care ghidează ce informații culegem, cum și de ce.
          </p>

          <div style={{ display: "flex", gap: "2rem", marginTop: "2rem", paddingTop: "2rem", borderTop: `1px solid var(--border)`, flexWrap: "wrap" as const }}>
            {[
              { label: "surse monitorizate", val: "7" },
              { label: "principii fundamentale", val: "6" },
              { label: "date actualizate", val: "zilnic" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--highlight)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>
                  {s.val}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </header>

        <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, var(--border), transparent)`, marginBottom: "3rem" }} />

        {/* Grid */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginBottom: "4rem" }}>
            {beliefs.map((belief, i) => (
              <BeliefCard
                key={belief.id}
                belief={belief}
                index={i}
                isActive={activeId === belief.id}
                onClick={() => setActiveId(activeId === belief.id ? null : belief.id)}
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: `1px solid var(--border)`, paddingTop: "2.5rem", paddingBottom: "4rem", display: "flex", gap: "3rem", flexWrap: "wrap" as const }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
              Misiune
            </h4>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted-foreground)", lineHeight: 1.7, maxWidth: "380px" }}>
              Automatizăm accesul la informații publice din România. Datele există iar noi le facem utilizabile.
            </p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
              Surse active
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
              {["ANAF", "portal.just.ro", "SEAP/SICAP", "ANI", "presă", "SM profiles", "PDF-uri oficiale"].map((s) => (
                <span key={s} style={{
                  fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
                  background: "var(--secondary)", border: `1px solid var(--border)`,
                  color: "var(--secondary-foreground)", fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}