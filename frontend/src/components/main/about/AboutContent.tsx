import { useState } from "react";

// ─── Team Members (Cei 7 "Arhitecți") ─────────────────────────────────────────
// Am păstrat anonimatul cerut, folosind doar specializările și rolurile tehnice.
const TEAM = [
    
];

// ─── Timeline ─────────────────────────────────────────────────────────────────
const TIMELINE = [
    {
        year: "Idee",
        label: "Punctul Zero",
        text: "Unul dintre noi descoperă că datele de pe SEAP sunt publicate într-un format care descurajează analiza. Se naște primul scraper rudimentar.",
    },
    {
        year: "Scrapers",
        label: "Formarea Grupului",
        text: "Cei 7 studenți (AIA + Mate-Info) își unesc forțele. Automatizarea AIA întâlnește rigoarea matematică. Centralizăm primele 3 surse majore.",
    },
    {
        year: "Design",
        label: "Viziunea e-Scraps",
        text: "Platforma devine unelte pentru jurnaliști și investigatori. Obiectivul: transformarea haosului birocratic în dovezi digitale incontestabile.",
    },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
    { value: "7", label: "studenți fondatori" },
    { value: "2", label: "facultăți implicate" },
    { value: "128", label: "Documente procesate" },
    { value: "0", label: "date manipulate" },
];

interface TeamCardProps {
    member: typeof TEAM[0];
}

function TeamCard({ member }: TeamCardProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "relative",
                border: hovered ? "1px solid var(--highlight)" : "1px solid var(--border)",
                borderRadius: "var(--radius, 12px)",
                padding: "2rem",
                background: hovered ? "var(--card)" : "transparent",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: hovered ? "translateY(-4px)" : "translateY(0)",
                cursor: "default",
                overflow: "hidden",
            }}
        >
            {hovered && (
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                    background: "linear-gradient(90deg, transparent, var(--highlight), transparent)",
                }} />
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    border: hovered ? "1.5px solid var(--highlight)" : "1.5px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: hovered ? "color-mix(in oklch, var(--highlight) 10%, transparent)" : "var(--secondary, rgba(255,255,255,0.04))",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "14px", fontWeight: 700,
                    color: hovered ? "var(--highlight)" : "var(--muted-foreground)",
                    transition: "all 0.3s",
                    flexShrink: 0,
                }}>
                    {member.initials}
                </div>
                <div>
                    <p style={{
                        margin: 0, fontSize: "16px", fontWeight: 700,
                        color: hovered ? "var(--highlight)" : "var(--foreground)",
                        lineHeight: 1.2, transition: "color 0.3s",
                    }}>
                        {member.name}
                    </p>
                    <p style={{
                        margin: "4px 0 0", fontSize: "11px",
                        color: "var(--muted-foreground)", letterSpacing: "0.08em",
                        textTransform: "uppercase" as const, fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        {member.role}
                    </p>
                </div>
            </div>

            <p style={{
                margin: "0 0 1.25rem", fontSize: "13px",
                color: "var(--muted-foreground)", lineHeight: 1.7,
            }}>
                {member.description}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                {member.tags.map((tag) => (
                    <span key={tag} style={{
                        fontSize: "10px", padding: "4px 10px", borderRadius: "999px",
                        border: `1px solid ${hovered ? "color-mix(in oklch, var(--highlight) 30%, transparent)" : "var(--border)"}`,
                        background: hovered ? "color-mix(in oklch, var(--highlight) 8%, transparent)" : "transparent",
                        color: hovered ? "var(--highlight)" : "var(--muted-foreground)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600, letterSpacing: "0.06em", transition: "all 0.3s",
                    }}>
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function AboutContent() {
    const [activeTimeline, setActiveTimeline] = useState(TIMELINE.length - 1);

    return (
        <div style={{ minHeight: "100vh", width:"1100px",marginLeft: "auto", marginRight: "auto", background: "var(--background)", position: "relative", overflow: "hidden" }}>
        <div style={{
            minHeight: "100vh",
            background: "var(--background)",
            color: "var(--foreground)",
            overflowX: "hidden",
        }}>

            {/* ── HERO ── */}
            <section style={{
                position: "relative",
                minHeight: "88vh",
                display: "flex",
                flexDirection: "column" as const,
                justifyContent: "flex-end",
                padding: "0 2.5rem 5rem",
                overflow: "hidden",
            }}>

                <div style={{
                    position: "absolute", left: "2.5rem", top: "30%", bottom: "5rem",
                    width: "1px", background: "linear-gradient(to bottom, transparent, var(--border), transparent)",
                }} />

                <div style={{ position: "relative", zIndex: 2, maxWidth: "900px" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "10px",
                        marginBottom: "2rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "11px", letterSpacing: "0.2em",
                        color: "var(--highlight)",
                        textTransform: "uppercase" as const,
                    }}>

                    </div>

                    <h1 style={{
                        margin: "0 0 2rem",
                        fontSize: "clamp(3rem, 8vw, 7rem)",
                        fontWeight: 800,
                        letterSpacing: "-0.05em",
                        lineHeight: 1.0,
                        color: "var(--foreground)",
                    }}>
                        Șapte minți.<br />
                        <em style={{ fontStyle: "italic", color: "var(--highlight)" }}>
                            Integritate prin cod.
                        </em>
                    </h1>

                    <p style={{
                        margin: 0, maxWidth: "520px",
                        fontSize: "18px", lineHeight: 1.75,
                        color: "var(--muted-foreground)", fontWeight: 500,
                    }}>
                        Suntem un grup de 7 studenți de la Automatică și Mate-Info care au decis că 
                        transparența nu trebuie să fie o favoare, ci o certitudine matematică. 
                        Am centralizat datele pentru ca tu să poți pune întrebările care contează.
                    </p>
                </div>
            </section>

            {/* ── STAT BAR ── */}
            <div style={{
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                padding: "2.5rem",
                background: "var(--card, rgba(255,255,255,0.02))",
            }}>
                <div style={{
                    maxWidth: "1100px", margin: "0 auto",
                    display: "flex", flexWrap: "wrap" as const, gap: "3rem",
                    justifyContent: "space-around",
                }}>
                    {STATS.map((s) => (
                        <div key={s.label} style={{ textAlign: "center" }}>
                            <p style={{
                                margin: "0 0 6px",
                                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                                fontWeight: 800, letterSpacing: "-0.04em",
                                color: "var(--highlight)",
                                fontFamily: "'JetBrains Mono', monospace",
                            }}>
                                {s.value}
                            </p>
                            <p style={{
                                margin: 0, fontSize: "11px",
                                color: "var(--muted-foreground)",
                                textTransform: "uppercase" as const, letterSpacing: "0.12em",
                            }}>
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MISSION & ADVANTAGES ── */}
            <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "8rem 2.5rem" }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "4rem",
                    alignItems: "start",
                }}>
                    <div>
                        <div style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            marginBottom: "2rem",
                        }}>
                            <div style={{ height: "1px", width: "30px", background: "var(--border)" }} />
                            <span style={{
                                fontSize: "11px", fontWeight: 600,
                                letterSpacing: "0.15em", textTransform: "uppercase" as const,
                                color: "var(--muted-foreground)",
                                fontFamily: "'JetBrains Mono', monospace",
                            }}>
                                Utilitate
                            </span>
                        </div>
                        <h2 style={{
                            margin: "0 0 1.5rem", fontSize: "clamp(2rem, 4vw, 3rem)",
                            fontWeight: 800, letterSpacing: "-0.04em",
                            lineHeight: 1.1,
                        }}>
                            De ce e-Scraps este<br />arma jurnalistului
                        </h2>
                        <p style={{ margin: "0 0 1.5rem", fontSize: "16px", lineHeight: 1.75, color: "var(--muted-foreground)" }}>
                            Un investigator petrece săptămâni adunând manual date pe care noi le procesăm în secunde. 
                            Fiecare PDF „pierdut” de o instituție publică este o variabilă în grafurile noastre.
                        </p>
                        <p style={{ margin: 0, fontSize: "16px", lineHeight: 1.75, color: "var(--muted-foreground)" }}>
                            Aici, datele nu sunt doar cifre, sunt <strong>legături</strong>. Vezi cine controlează o firmă 
                            și ce contracte a câștigat prin interfața noastră de tip „Stalker”.
                        </p>
                    </div>

                    <div style={{
                        padding: "2.5rem",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius, 12px)",
                        background: "var(--card, rgba(255,255,255,0.02))",
                        display: "flex", flexDirection: "column" as const, gap: "1.5rem",
                    }}>
                         {[
                            { icon: "🛡️", label: "Datele sunt Publice", text: "Fiecare nod din sistem provine dintr-o sursă oficială (ANAF, SEAP, Portal Just)." },
                            { icon: "🔎", label: "Viteză de Analiză", text: "Algoritmii noștri fac corelații cross-platform instantaneu." },
                            { icon: "⚖️", label: "Zero Subiectivitate", text: "Noi nu interpretăm. Noi doar facem informația utilizabilă." },
                        ].map((item) => (
                            <div key={item.label} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700 }}>{item.label}</p>
                                    <p style={{ margin: 0, fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.6 }}>{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TIMELINE ── */}
            <section style={{
                borderTop: "1px solid var(--border)",
                padding: "8rem 2.5rem",
                background: "color-mix(in oklch, var(--foreground) 2%, var(--background))",
            }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "4rem" }}>
                        <div style={{ height: "1px", flex: 1, background: "var(--border)" }} />
                        <span style={{
                            fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em",
                            textTransform: "uppercase" as const, color: "var(--muted-foreground)",
                            fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" as const,
                        }}>
                            Evoluția Proiectului
                        </span>
                        <div style={{ height: "1px", flex: 1, background: "var(--border)" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "3rem", alignItems: "start" }}>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "2px" }}>
                            {TIMELINE.map((item, i) => (
                                <button
                                    key={item.year}
                                    onClick={() => setActiveTimeline(i)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "16px",
                                        background: "none", border: "none", cursor: "pointer",
                                        padding: "1.25rem 1.25rem 1.25rem 0",
                                        borderLeft: activeTimeline === i ? "2px solid var(--highlight)" : "2px solid var(--border)",
                                        paddingLeft: "1.25rem",
                                        transition: "all 0.2s",
                                        textAlign: "left",
                                    }}
                                >
                                    <span style={{
                                        fontSize: "13px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                                        color: activeTimeline === i ? "var(--highlight)" : "var(--muted-foreground)",
                                        minWidth: "70px",
                                    }}>
                                        {item.year}
                                    </span>
                                    <span style={{
                                        fontSize: "13px", fontWeight: 600,
                                        color: activeTimeline === i ? "var(--foreground)" : "var(--muted-foreground)",
                                    }}>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div style={{
                            padding: "2.5rem",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius, 12px)",
                            background: "var(--card, rgba(255,255,255,0.02))",
                            position: "relative", overflow: "hidden",
                            minHeight: "160px",
                        }}>
                            <div style={{
                                position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                                background: "linear-gradient(90deg, transparent, var(--highlight), transparent)",
                            }} />
                            <p style={{
                                margin: "0 0 1rem",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "11px", fontWeight: 600,
                                color: "var(--highlight)",
                            }}>
                                {TIMELINE[activeTimeline].year} — {TIMELINE[activeTimeline].label}
                            </p>
                            <p style={{
                                margin: 0, fontSize: "18px", lineHeight: 1.7,
                                color: "var(--foreground)", fontWeight: 500,
                            }}>
                                {TIMELINE[activeTimeline].text}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TEAM ── */}
            <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "8rem 2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "4rem" }}>
                    <div style={{ height: "1px", flex: 1, background: "var(--border)" }} />
                    <span style={{
                        fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em",
                        textTransform: "uppercase" as const, color: "var(--muted-foreground)",
                        fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" as const,
                    }}>
                        
                    </span>
                    <div style={{ height: "1px", flex: 1, background: "var(--border)" }} />
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "1.25rem",
                }}>
                    {TEAM.map((member) => (
                        <TeamCard key={member.id} member={member} />
                    ))}
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{
                borderTop: "1px solid var(--border)",
                background: "var(--card)",
                padding: "2rem 2.5rem",
                display: "flex", justifyContent: "space-between",
                alignItems: "center", flexWrap: "wrap" as const, gap: "1rem",
            }}>
                <span style={{
                    fontSize: "12px", color: "var(--muted-foreground)",
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    © 2026 e-Scraps. Construit de studenți pentru transparență.
                </span>
                <span style={{
                    fontSize: "12px", color: "var(--muted-foreground)",
                    fontFamily: "'JetBrains Mono', monospace",
                    display: "flex", alignItems: "center", gap: "6px" as const,
                }}>
                    <span style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "var(--highlight)", display: "inline-block",
                    }} />
                    Sursă Deschisă
                </span>
            </footer>
        </div>
        </div>
    );
}