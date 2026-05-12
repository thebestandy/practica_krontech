import { useTheme } from "../../../components/theme-provider";
import videoYellow from "../../../assets/animatie_blender/24fpsYellow.mkv";
import videoPurple from "../../../assets/animatie_blender/24fpsPurple.mkv";
import videoTurquoise from "../../../assets/animatie_blender/24fpsTurquoiseCycles.mkv";
import { useState } from "react";

function useThemeAccent() {
    const { theme } = useTheme();

    const accents: Record<string, {
        border: string;
        glow: string;
        badge: string;
        badgeText: string;
        iconBg: string;
        highlight: string;
        highlightRgb: string;
    }> = {
        yellow: {
            border: "border-yellow-400/60",
            glow: "hover:shadow-[0_0_32px_0_rgba(250,204,21,0.25)]",
            badge: "bg-yellow-400/15",
            badgeText: "text-yellow-300",
            iconBg: "bg-yellow-400/10",
            highlight: "text-yellow-400",
            highlightRgb: "250,204,21",
        },
        purple: {
            border: "border-purple-500/60",
            glow: "hover:shadow-[0_0_32px_0_rgba(168,85,247,0.25)]",
            badge: "bg-purple-500/15",
            badgeText: "text-purple-300",
            iconBg: "bg-purple-500/10",
            highlight: "text-purple-400",
            highlightRgb: "168,85,247",
        },
        turquoise: {
            border: "border-teal-400/60",
            glow: "hover:shadow-[0_0_32px_0_rgba(45,212,191,0.25)]",
            badge: "bg-teal-400/15",
            badgeText: "text-teal-300",
            iconBg: "bg-teal-400/10",
            highlight: "text-teal-400",
            highlightRgb: "45,212,191",
        },
    };

    return accents[theme] ?? accents.purple;
}

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
                flex flex-col gap-0
                transition-all duration-300 ease-out overflow-hidden
                ${hovered ? `${accent.border} bg-white/[0.07] -translate-y-1` : "border-white/8"}
            `}
            style={{ willChange: "transform" }}
        >
            <div
                className="absolute inset-x-0 top-0 h-px transition-opacity duration-300"
                style={{
                    background: `linear-gradient(90deg, transparent, rgba(${accent.highlightRgb},0.6), transparent)`,
                    opacity: hovered ? 1 : 0,
                }}
            />

            <div className="p-5 pb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={`
                            w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0
                            transition-colors duration-300
                            ${hovered ? accent.iconBg : "bg-white/5"}
                        `}
                    >
                        {source.icon}
                    </div>
                    <div>
                        <h3 className={`font-bold text-[15px] leading-tight transition-colors duration-300 ${hovered ? accent.highlight : "text-foreground"}`}>
                            {source.name}
                        </h3>
                        <p className="text-[11px] text-secondary-foreground/50 leading-tight mt-0.5 font-mono">
                            {source.fullName}
                        </p>
                    </div>
                </div>
                <div
                    className={`
                        shrink-0 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold
                        transition-colors duration-300
                        ${hovered ? `${accent.badge} ${accent.badgeText}` : "bg-white/5 text-secondary-foreground/40"}
                    `}
                >
                    {source.records}
                </div>
            </div>

            <div className="px-5 pb-4">
                <p className="text-[13px] text-secondary-foreground/60 leading-relaxed">
                    {source.description}
                </p>
            </div>

            <div className="px-5 pb-5 flex flex-wrap gap-1.5">
                {source.dataTypes.map((dt) => (
                    <span
                        key={dt}
                        className={`
                            px-2 py-0.5 rounded-md text-[10px] font-mono font-medium tracking-wide
                            transition-colors duration-300
                            ${hovered ? `${accent.badge} ${accent.badgeText}` : "bg-white/5 text-secondary-foreground/40"}
                        `}
                    >
                        {dt}
                    </span>
                ))}
            </div>

            <div className="mt-auto px-5 py-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-secondary-foreground/30 uppercase tracking-widest">
                    Actualizare
                </span>
                <span className={`text-[10px] font-mono font-semibold uppercase tracking-widest transition-colors duration-300 ${hovered ? accent.highlight : "text-secondary-foreground/40"}`}>
                    {source.updateFreq}
                </span>
            </div>
        </div>
    );
}

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

            <section className="h-screen w-full flex flex-row items-center justify-around px-10 relative overflow-hidden py-20 gap-10">
                <div className="w-1/2 md:w-1/2 flex flex-col justify-center relative z-10 mt-20">

                    <div className="opacity-0 animate-fadeUp delay-[300ms] flex items-center gap-2 mb-8">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${accent.highlight.replace("text-", "bg-")}`} />
                        <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-secondary-foreground/50">
                            Platformă de investigație
                        </span>
                    </div>

                    <h1
                        className="opacity-0 animate-fadeUp delay-[450ms]
                    text-[clamp(3rem,9vw,9rem)] leading-[1] tracking-[-0.08em]
                    font-bold text-foreground mb-10"
                    >
                        Introducing <br />
                        <em className={`italic ${accent.highlight}`}>
                            e-Scraps
                        </em>
                    </h1>

                    <p
                        className="text-[23px] opacity-0 animate-fadeUp delay-[650ms]
                    text-[0.95rem] leading-[1.85]
                    text-secondary-foreground/70 max-w-[40ch] mb-16"
                    >
                        O unealtă digitală pentru verificarea integrității
                        corporațiilor și politicienilor. Date brute, conexiuni reale,
                        căutare simplă.
                    </p>

                    <div
                        className="opacity-0 animate-fadeUp delay-[900ms] flex items-center gap-4 cursor-pointer group w-fit"
                        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
                    >
                        <span className="text-[19px] font-mono tracking-[0.24em] uppercase text-foreground/60 group-hover:text-foreground transition-colors">
                            Scroll
                        </span>
                        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center shrink-0 group-hover:border-white/40 transition-colors">
                            <svg
                                viewBox="0 0 13 13"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-[12px] h-[12px] text-foreground/60 group-hover:text-foreground animate-bounce transition-colors"
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

            <section className="w-full px-10 py-24 relative">

                <div className="max-w-6xl mx-auto mb-14 flex items-end justify-between gap-6 flex-wrap">
                    <div>
                        <p className="text-[15px] font-mono tracking-[0.18em] uppercase text-secondary-foreground/40 mb-3">
                            Surse monitorizate
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
                            7 surse de date.<br />
                            <span className={accent.highlight}>Un singur loc.</span>
                        </h1>
                    </div>
                    <p className="text-[23px] text-secondary-foreground/50 max-w-[42ch] leading-relaxed">
                        Colectăm, procesăm și corelăm informații din sursele publice oficiale ale statului român — automat, zilnic, fără filtre editoriale.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {SOURCES.map((source) => (
                        <SourceCard key={source.id} source={source} />
                    ))}
                </div>

                <div className="max-w-6xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px border border-white/5 rounded-2xl overflow-hidden">
                    {[
                        { label: "Surse monitorizate", value: "7" },
                        { label: "Documente procesate", value: "128" },
                        { label: "Actualizări", value: "Zilnic" },
                        { label: "Entități indexate", value: "50" },
                    ].map((stat, i) => (
                        <div
                            key={stat.label}
                            className="flex flex-col gap-1.5 px-6 py-5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                        >
                            <p className={`text-2xl font-bold font-mono leading-none ${accent.highlight}`}>
                                {stat.value}
                            </p>
                            <p className="text-[11px] font-mono text-secondary-foreground/40 uppercase tracking-widest">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="border-t border-white/8">
                <div className="max-w-6xl mx-auto px-10 pt-16 pb-8">

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 mb-12">

                        <div className="flex flex-col gap-4 max-w-xs">
                            <div className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${accent.highlight.replace("text-", "bg-")}`} />
                                <span className={`text-[15px] font-bold tracking-tight font-mono ${accent.highlight}`}>
                                    e-Scraps
                                </span>
                            </div>
                            <p className="text-[13px] font-mono text-secondary-foreground/50 leading-relaxed">
                                Platformă de agregare și analiză a datelor publice din România. Transparență prin tehnologie.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <p className={`text-[10px] font-mono font-semibold uppercase tracking-[0.18em] ${accent.highlight}`}>
                                Surse
                            </p>
                            <div className="flex flex-col gap-2">
                                {["ANAF", "portal.just.ro", "SEAP / SICAP", "ANI", "Presă"].map((s) => (
                                    <span
                                        key={s}
                                        className="text-[13px] font-mono text-secondary-foreground/40 hover:text-secondary-foreground/70 cursor-pointer transition-colors"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-4 flex-wrap">
                        <span className="text-[11px] font-mono text-secondary-foreground/30">
                            © 2025 e-Scraps. Date publice, analiză deschisă.
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${accent.highlight.replace("text-", "bg-")}`} />
                            <span className="text-[11px] font-mono text-secondary-foreground/30">
                                Date actualizate zilnic
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}