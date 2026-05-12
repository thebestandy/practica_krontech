import { useTheme } from "../../../components/theme-provider";
import videoYellow from "../../../assets/animatie_blender/24fpsYellow.mkv";
import videoPurple from "../../../assets/animatie_blender/24fpsPurple.mkv";
import videoTurquoise from "../../../assets/animatie_blender/24fpsTurquoiseCycles.mkv";
import { useState } from "react";

// Theme-aware accent helper — returns Tailwind/CSS classes per theme
function useThemeAccent() {
    const { theme } = useTheme();

    const accents: Record<string, {
        border: string;
        glow: string;
        badge: string;
        badgeText: string;
        iconBg: string;
        highlight: string;
    }> = {
        yellow: {
            border: "border-yellow-400/60",
            glow: "hover:shadow-[0_0_32px_0_rgba(250,204,21,0.25)]",
            badge: "bg-yellow-400/15",
            badgeText: "text-yellow-300",
            iconBg: "bg-yellow-400/10",
            highlight: "text-yellow-400",
        },
        purple: {
            border: "border-purple-500/60",
            glow: "hover:shadow-[0_0_32px_0_rgba(168,85,247,0.25)]",
            badge: "bg-purple-500/15",
            badgeText: "text-purple-300",
            iconBg: "bg-purple-500/10",
            highlight: "text-purple-400",
        },
        turquoise: {
            border: "border-teal-400/60",
            glow: "hover:shadow-[0_0_32px_0_rgba(45,212,191,0.25)]",
            badge: "bg-teal-400/15",
            badgeText: "text-teal-300",
            iconBg: "bg-teal-400/10",
            highlight: "text-teal-400",
        },
    };

    return accents[theme] ?? accents.purple;
}

// ─── Data sources ────────────────────────────────────────────────────────────
const SOURCES = [
    {
        id: "anaf",
        name: "ANAF",
        fullName: "Agenția Națională de Administrare Fiscală",
        url: "https://www.anaf.ro",
        description:
            "Sursa primară pentru datele fiscale ale persoanelor juridice din România. Extragem declarații, bilanțuri, datorii restante și istoricul fiscal al oricărei firme înregistrate.",
        dataTypes: ["Declarații fiscale", "Bilanțuri", "Datorii restante", "CUI lookup"],
        icon: "🏛️",
        records: "4.2M+",
        updateFreq: "Zilnic",
    },
    {
        id: "portal-just",
        name: "portal.just.ro",
        fullName: "Portalul Instanțelor de Judecată",
        url: "https://portal.just.ro",
        description:
            "Accesăm dosarele instanțelor de judecată din întreaga țară — civile, penale, comerciale. Construim istoricul juridic complet al oricărei entități sau persoane.",
        dataTypes: ["Dosare civile", "Dosare penale", "Sentințe", "Termene"],
        icon: "⚖️",
        records: "12M+",
        updateFreq: "Zilnic",
    },
    {
        id: "seap",
        name: "SEAP / SICAP",
        fullName: "Sistemul Electronic de Achiziții Publice",
        url: "https://e-licitatie.ro",
        description:
            "Monitorizăm licitațiile publice și contractele de achiziție. Detectăm tipare de adjudecare, conexiuni între ofertanți și potențiale conflicte de interese.",
        dataTypes: ["Licitații publice", "Contracte adjudecate", "Ofertanți", "Valori contracte"],
        icon: "📋",
        records: "800K+",
        updateFreq: "Zilnic",
    },
    {
        id: "ani",
        name: "ANI",
        fullName: "Agenția Națională de Integritate",
        url: "https://www.integritate.eu",
        description:
            "Procesăm declarațiile de avere și interese ale tuturor demnitarilor și funcționarilor publici. Identificăm neconcordanțe și evoluții patrimoniale suspecte.",
        dataTypes: ["Declarații avere", "Declarații interese", "Incompatibilități", "Conflicte interese"],
        icon: "🔍",
        records: "120K+",
        updateFreq: "Anual",
    },
    {
        id: "presa",
        name: "Presă",
        fullName: "Surse Media Online",
        url: "#",
        description:
            "Agregăm și procesăm articole din sute de publicații românești. Corelăm mențiunile din presă cu entitățile din celelalte baze de date pentru context jurnalistic.",
        dataTypes: ["Articole de presă", "Investigații", "Comunicate", "Analize"],
        icon: "📰",
        records: "50M+",
        updateFreq: "Orar",
    },
    {
        id: "sm-profiles",
        name: "SM Profiles",
        fullName: "Profiluri Social Media",
        url: "#",
        description:
            "Monitorizăm profilurile publice de pe platformele sociale ale persoanelor de interes public — politicieni, manageri, demnitari — pentru declarații și conexiuni relevante.",
        dataTypes: ["Facebook", "LinkedIn", "Twitter/X", "Instagram"],
        icon: "👤",
        records: "35K+",
        updateFreq: "Zilnic",
    },
    {
        id: "pdf-oficiale",
        name: "PDF-uri Oficiale",
        fullName: "Documente Oficiale Scanned",
        url: "#",
        description:
            "Procesăm prin OCR zeci de mii de documente oficiale publicate de instituții ale statului — hotărâri, ordine, rapoarte — transformând imaginile în date structurate căutabile.",
        dataTypes: ["Hotărâri de guvern", "Ordine de ministru", "Rapoarte publice", "Monitorul Oficial"],
        icon: "📄",
        records: "128K+",
        updateFreq: "Zilnic",
    },
];

// ─── Source Card ─────────────────────────────────────────────────────────────
function SourceCard({ source }: { source: typeof SOURCES[0] }) {
    const [hovered, setHovered] = useState(false);
    const accent = useThemeAccent();

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`
                relative group cursor-default
                rounded-2xl border bg-white/[0.03] backdrop-blur-sm
                p-6 flex flex-col gap-4
                transition-all duration-300 ease-out
                ${hovered ? `${accent.border} ${accent.glow} bg-white/[0.06] -translate-y-1` : "border-white/10"}
            `}
            style={{ willChange: "transform, box-shadow" }}
        >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={`
                            w-11 h-11 rounded-xl flex items-center justify-center text-xl
                            transition-colors duration-300
                            ${hovered ? accent.iconBg : "bg-white/5"}
                        `}
                    >
                        {source.icon}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg leading-tight transition-colors duration-300 ${hovered ? accent.highlight : "text-foreground"}`}>
                            {source.name}
                        </h3>
                        <p className="text-xs text-secondary-foreground/60 leading-tight mt-0.5">
                            {source.fullName}
                        </p>
                    </div>
                </div>

                {/* Records badge */}
                <div
                    className={`
                        shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold
                        transition-colors duration-300
                        ${hovered ? `${accent.badge} ${accent.badgeText}` : "bg-white/5 text-secondary-foreground/50"}
                    `}
                >
                    {source.records}
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-secondary-foreground/70 leading-relaxed flex-1">
                {source.description}
            </p>

            {/* Data types */}
            <div className="flex flex-wrap gap-1.5">
                {source.dataTypes.map((dt) => (
                    <span
                        key={dt}
                        className={`
                            px-2 py-0.5 rounded-md text-[11px] font-medium
                            transition-colors duration-300
                            ${hovered ? `${accent.badge} ${accent.badgeText}` : "bg-white/5 text-secondary-foreground/50"}
                        `}
                    >
                        {dt}
                    </span>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[11px] text-secondary-foreground/40 uppercase tracking-widest">
                    Actualizare
                </span>
                <span className={`text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300 ${hovered ? accent.highlight : "text-secondary-foreground/50"}`}>
                    {source.updateFreq}
                </span>
            </div>

            {/* Hover corner accent */}
            <div
                className={`
                    absolute top-0 right-0 w-16 h-16 rounded-tr-2xl overflow-hidden
                    transition-opacity duration-300
                    ${hovered ? "opacity-100" : "opacity-0"}
                `}
            >
                <div
                    className="absolute -top-8 -right-8 w-16 h-16 rounded-full blur-xl opacity-40"
                    style={{
                        background:
                            "var(--highlight, currentColor)",
                    }}
                />
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomeContent() {
    const { theme } = useTheme();
    const accent = useThemeAccent();

    const videoMap: Record<string, string> = {
        yellow: videoYellow,
        purple: videoPurple,
        turquoise: videoTurquoise,
    };

    const currentVideo = videoMap[theme] ?? videoPurple;

    return (
        <>
            <br /><br /><br />

            {/* ── Hero Section ── */}
            <section className="h-screen w-full flex flex-row items-center justify-around px-10 relative overflow-hidden py-20 gap-10">
                <div className="w-1/2 md:w-1/2 flex flex-col justify-center relative z-10 mt-20">
                    <h1
                        className="opacity-0 animate-fadeUp delay-[450ms] 
                    text-[clamp(3rem,9vw,9rem)] leading-[1] tracking-[-0.08em] 
                    font-bold text-foreground mb-10"
                    >
                        Introducing <br />
                        <em className="italic text-highlight">
                            e-Scraps
                        </em>
                    </h1>

                    <p
                        className="opacity-0 animate-fadeUp delay-[650ms]
                    text-0.9em leading-[1.85] 
                    font-bold text-secondary-foreground max-w-[40ch] mb-16"
                    >
                        E-Scraps o unealtă digitală concepută pentru verificarea integrității
                        corporațiilor și politicienilor. Aceasta extrage date brute și le asamblează
                        într-un arbore de conexiuni compromițătoare, transformând haosul birocratic 
                        de a obține date într-o simplă căutare. Go on Stalker.
                    </p>

                    <div 
    className="opacity-0 animate-fadeUp delay-[900ms] flex items-center gap-4 cursor-pointer group"
    onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
>
    <span className="text-[1rem] tracking-[0.24em] uppercase text-foreground group-hover:opacity-70 transition-opacity">
        Scroll
    </span>

                        <div className="w-[46px] h-[46px] rounded-full border border-foreground flex items-center justify-center shrink-0 group-hover:opacity-70 transition-opacity">
                            <svg
                                viewBox="0 0 13 13"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-[13px] h-[13px] text-foreground animate-bounce"
                            >
                                <path d="M6.5 1v11M1 7l5.5 5L12 7" />
                            </svg>
                            
                        </div>
                        
                    </div>
                </div>
            
                <div className="w-full h-full flex items-center justify-center relative opacity-0 animate-fadeUp delay-1100 z-10 mt-10">
                    <div className="relative w-full max-w-450 max-h-350 rounded-3xl overflow-hidden flex items-center justify-center">
                        <video key={currentVideo} autoPlay loop muted playsInline>
                            <source src={currentVideo} type="video/mp4" />
                        </video>
                    </div>
                </div>
            </section>

           
            {/* ── Sources Section ── */}
            <section className="w-full px-10 py-24 relative">
               
                {/* Cards grid */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {SOURCES.map((source) => (
                        <SourceCard key={source.id} source={source} />
                    ))}
                </div>

                {/* Bottom stat bar */}
                <div className="max-w-6xl mx-auto mt-12 flex flex-wrap items-center justify-center gap-8 py-8 border-t border-white/5">
                    {[
                        { label: "Surse monitorizate", value: "7" },
                        { label: "Documente procesate", value: "128.049+" },
                        { label: "Actualizări", value: "Zilnic" },
                        { label: "Entități indexate", value: "4.5M+" },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center">
                            <p className={`text-2xl font-bold font-mono ${accent.highlight}`}>
                                {stat.value}
                            </p>
                            <p className="text-xs text-secondary-foreground/50 uppercase tracking-widest mt-1">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}