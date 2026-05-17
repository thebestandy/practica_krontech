import React, { useState } from "react";
import Graph from "./Graph";
import GraphTable from "./GraphTable";

const MOCK_POOL_NODES = [
    {
        id: "p1",
        type: "Person",
        label: "Radu Ionescu",
        summary:
            "Om de afaceri activ în sectorul infrastructurii și energiei. Fost secretar de stat.",
        link: "#",
    },
    {
        id: "c1",
        type: "Company",
        label: "InfraBuild Solutions SRL",
        summary:
            "Firmă de construcții cu o creștere suspect de rapidă în contracte cu statul.",
        link: "https://recom.onrc.ro/infrabuild",
    },
    {
        id: "case1",
        type: "CourtCase",
        label: "Dosar 441/2/2025",
        summary:
            "Anchetă penală privind nereguli de achiziții publice pentru proiecte de autostrăzi.",
        link: "https://portal.just.ro/441/2025",
    },
    {
        id: "p2",
        type: "Person",
        label: "Gheorghe Munteanu",
        summary:
            "Fost judecător la Tribunalul București, pensionat în 2021. Menționat în interceptări.",
        link: "#",
    },
    {
        id: "c2",
        type: "Company",
        label: "GreenRoute Construct SRL",
        summary:
            "Subcontractor obscur utilizat frecvent de către InfraBuild pentru transfer de capital.",
        link: "https://recom.onrc.ro/greenroute",
    },
    {
        id: "p3",
        type: "Person",
        label: "Cristina Vlad",
        summary:
            "Notar public în Județul Ilfov. A autentificat transferurile suspecte de acțiuni.",
        link: "#",
    },
    {
        id: "doc1",
        type: "Document",
        label: "Raport Audit Intern 2024",
        summary:
            "Document confidențial ce dezvăluie fluxuri financiare către firme paravan din offshore.",
        link: "#",
    },
    {
        id: "soc1",
        type: "SocialProfile",
        label: "LinkedIn: Radu Ionescu",
        summary:
            "Profil public ce confirmă legături vechi cu acționarii subcontractorilor.",
        link: "#",
    },
];

const MOCK_POOL_LINKS = [
    { source: "p1", target: "c1", label: "EXECUTIVE_ROLE" },
    { source: "case1", target: "c1", label: "INVESTIGATES" },
    { source: "case1", target: "p2", label: "JUDGED_BY" },
];

export default function EnterpriseContent() {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [modalStep, setModalStep] = useState<
        "form" | "processing" | "success" | "owned" | null
    >(null);

    const [searchTarget, setSearchTarget] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState(
        "Așteptare țintă de investigație...",
    );
    const [hasSearched, setHasSearched] = useState(false);

    const [tableNodes, setTableNodes] = useState<any[]>([]);
    const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({
        nodes: [],
        links: [],
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTarget.trim() || isScanning) return;

        setIsScanning(true);
        setHasSearched(true);
        setScanProgress(0);
        setTableNodes([]);
        setGraphData({ nodes: [], links: [] });
        setStatusMessage("Inițializare conexiune motor de analiză...");

        setTimeout(() => {
            setScanProgress(25);
            setStatusMessage(
                `Scanare registre publice pentru: ${searchTarget}...`,
            );
            const firstBatch = [MOCK_POOL_NODES[0], MOCK_POOL_NODES[1]];
            setTableNodes(firstBatch);
            setGraphData({
                nodes: JSON.parse(JSON.stringify(firstBatch)),
                links: [MOCK_POOL_LINKS[0]],
            });
        }, 1200);

        setTimeout(() => {
            setScanProgress(60);
            setStatusMessage(
                "Interogare Portal Justiție. Corelare dosare penale active...",
            );
            const secondBatch = [MOCK_POOL_NODES[2], MOCK_POOL_NODES[3]];
            setTableNodes((prev) => [...prev, ...secondBatch]);
            setGraphData((prev) => ({
                nodes: [
                    ...prev.nodes,
                    ...JSON.parse(JSON.stringify(secondBatch)),
                ],
                links: [...prev.links, MOCK_POOL_LINKS[1], MOCK_POOL_LINKS[2]],
            }));
        }, 2800);

        setTimeout(() => {
            setScanProgress(100);
            setStatusMessage(
                "Scanare completă! Trimiteți nodurile rămase pe graf folosind click-dreapta.",
            );
            setIsScanning(false);
            const remainingBatch = [
                MOCK_POOL_NODES[4],
                MOCK_POOL_NODES[5],
                MOCK_POOL_NODES[6],
                MOCK_POOL_NODES[7],
            ];
            setTableNodes((prev) => [...prev, ...remainingBatch]);
        }, 4500);
    };

    const handleSendNodeToGraph = (node: any) => {
        setGraphData((prev) => {
            const nodeExists = prev.nodes.some((n) => n.id === node.id);
            if (nodeExists) return prev;

            return {
                nodes: [...prev.nodes, JSON.parse(JSON.stringify(node))],
                links: prev.links,
            };
        });
    };

    const handleCheckout = (planName: string) => {
        setSelectedPlan(planName);
        if (planName === "Standard") setModalStep("owned");
        else setModalStep("form");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setModalStep("processing");
        setTimeout(() => setModalStep("success"), 1500);
    };

    const closeCheckout = () => {
        setSelectedPlan(null);
        setModalStep(null);
    };

    return (
        <>
            <section className="relative w-full min-h-[90vh] flex flex-col justify-center items-center text-center px-4 pt-32">
                <div className="max-w-5xl space-y-10 mb-10">
                    <div className="space-y-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
                        <p className="text-3xl text-foreground underline underline-offset-8 decoration-highlight/40">
                            Te simți în urmă în{" "}
                            <span className="text-highlight/90 font-medium italic">
                                investigațiile
                            </span>{" "}
                            proprii?
                        </p>
                        <p>
                            Dorești o modalitate de a stoca informații despre
                            investigația ta și a face legături între
                            descoperirile tale?
                        </p>
                        <p className="leading-relaxed">
                            <span className="text-foreground font-bold text-highlight/90">
                                e-Scraps
                            </span>{" "}
                            este aplicația perfectă pentru tine dacă ești un
                            jurnalist, un analist financiar sau oricine
                            interesat în a investiga o persoană sau o companie
                            într-o manieră eficientă.
                        </p>
                    </div>
                    <div className="pt-8">
                        <a
                            href="#oferte"
                            className="rounded-md inline-block px-10 py-4 bg-foreground text-background font-black hover:bg-highlight hover:text-black transition-all duration-300 uppercase tracking-[0.2em] text-sm shadow-lg"
                        >
                            Vezi Ofertele
                        </a>
                    </div>
                </div>
            </section>

            <section className="w-full py-32 px-4 border-y border-border bg-secondary/20">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-2xl md:text-4xl font-bold leading-snug text-muted-foreground">
                        Investighează ca{" "}
                        <span className="text-highlight">Recorder</span> sau{" "}
                        <span className="text-highlight">
                            Cristian Tudor Popescu
                        </span>{" "}
                        cu ajutorul unei interfețe ușor de folosit și unei
                        tehnologii rapide de căutare a informațiilor.
                    </p>
                    <div className="mt-12 max-w-2xl mx-auto text-lg text-highlight/90 font-medium italic">
                        Aplicația noastră excelează în a face legături între
                        informațiile date, legături ce dezvăluie acte ilegale
                        precum fraude financiare, furturi, înșelăciune,
                        amenințări verbale și multe altele.
                    </div>
                </div>
            </section>

            <section className="w-full py-24 px-4 bg-background">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col items-start justify-between gap-6 bg-secondary/5 border border-border p-6 rounded-md">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">
                                Testează modulul de investigație
                            </h2>
                            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                                <strong className="text-highlight">
                                    Atenție:
                                </strong>{" "}
                                Proiectul prezentat aici este doar un{" "}
                                <span className="text-foreground font-bold">
                                    demo interactiv cu date fictive
                                </span>
                                . Nu conține toate funcționalitățile, uneltele
                                de extragere a datelor și complexitatea unui
                                proiect e-Scraps propriu-zis.
                            </p>
                        </div>
                    </div>

                    <div className="w-full bg-secondary/10 border border-border p-6 rounded-md flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex flex-1 w-full gap-3"
                        >
                            <input
                                type="text"
                                value={searchTarget}
                                onChange={(e) =>
                                    setSearchTarget(e.target.value)
                                }
                                placeholder="Introduceți o persoană sau companie (ex: Radu Ionescu)..."
                                className="flex-1 bg-background border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-highlight outline-none rounded-sm font-sans"
                            />
                            <button
                                type="submit"
                                disabled={isScanning}
                                className="bg-highlight text-black font-bold uppercase text-xs tracking-widest px-6 py-3 rounded-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isScanning ? "Scanare..." : "Investighează"}
                            </button>
                        </form>

                        <div className="w-full md:w-80 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-muted-foreground truncate max-w-[200px]">
                                    {statusMessage}
                                </span>
                                <span className="text-highlight">
                                    {scanProgress}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden border border-border/30">
                                <div
                                    className="h-full bg-highlight transition-all duration-500 ease-out"
                                    style={{ width: `${scanProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[750px] items-stretch">
                        <div className="lg:col-span-7 h-full rounded-md overflow-hidden border border-border bg-secondary/10 relative shadow-inner">
                            {hasSearched && (
                                <div className="absolute top-4 right-4 z-10 flex items-center gap-3 px-4 py-2 border border-highlight/50 bg-highlight/10 backdrop-blur-md rounded-sm text-[10px] font-bold tracking-[0.1em] text-highlight whitespace-nowrap shadow-lg pointer-events-none">
                                    <span className="w-2 h-2 rounded-full bg-highlight animate-ping"></span>
                                    DEMO LIVE ACTIV
                                </div>
                            )}

                            <Graph
                                graphData={graphData}
                                setGraphData={setGraphData}
                            />
                        </div>

                        <div className="lg:col-span-5 h-full overflow-hidden">
                            <GraphTable
                                nodes={tableNodes}
                                onSendToGraph={handleSendNodeToGraph}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="oferte"
                className="w-full py-32 px-4 bg-secondary/5 border-t border-border"
            >
                <div className="max-w-[90rem] mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black text-center mb-20 uppercase tracking-tighter">
                        Planuri de achiziționare
                    </h2>
                    <div className="w-full overflow-x-auto pb-8">
                        <div className="flex flex-row items-stretch justify-start lg:justify-center gap-6 min-w-[1000px]">
                            <div className="flex-1 bg-card border border-border p-8 flex flex-col hover:border-highlight/50 transition-colors">
                                <h3 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-muted-foreground">
                                    Standard
                                </h3>
                                <div className="mb-8">
                                    <p className="text-4xl font-black text-foreground">
                                        Free
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                                        Acces de bază
                                    </p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow text-xs font-medium text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-highlight mt-0.5">
                                            ■
                                        </span>{" "}
                                        Accesul la maxim 5 proiecte personale
                                        active deodată.
                                    </li>
                                </ul>
                                <button
                                    onClick={() => handleCheckout("Standard")}
                                    className="w-full py-3 border border-border hover:bg-secondary transition-colors uppercase text-[10px] font-bold tracking-widest"
                                >
                                    Selectează
                                </button>
                            </div>

                            <div className="flex-1 bg-background border-2 border-highlight p-8 flex flex-col relative shadow-[0_0_30px_rgba(234,179,8,0.15)] z-10 scale-[1.02]">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-highlight text-black px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                                    Cel Mai Popular
                                </div>
                                <h3 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-highlight">
                                    Premium Individual
                                </h3>
                                <div className="mb-8 border-b border-border/50 pb-6">
                                    <p className="text-4xl lg:text-5xl font-black text-foreground">
                                        35.49€
                                    </p>
                                    <p className="text-[10px] text-highlight mt-2 uppercase tracking-widest font-bold">
                                        Pe An
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        sau 4.99€{" "}
                                        <span className="text-[10px] font-normal">
                                            / lună
                                        </span>
                                    </p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow text-xs font-medium text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-highlight mt-0.5">
                                            ■
                                        </span>{" "}
                                        Accesul la maxim 20 proiecte personale
                                        active deodată.
                                    </li>
                                </ul>
                                <button
                                    onClick={() =>
                                        handleCheckout("Premium Individual")
                                    }
                                    className="w-full py-3 bg-highlight text-black hover:opacity-90 transition-opacity uppercase text-[10px] font-bold tracking-widest"
                                >
                                    Alege Premium
                                </button>
                            </div>

                            <div className="flex-1 bg-card border border-border p-8 flex flex-col hover:border-highlight/50 transition-colors">
                                <h3 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-muted-foreground">
                                    Premium Company
                                </h3>
                                <div className="mb-8 border-b border-border/50 pb-6">
                                    <p className="text-4xl lg:text-5xl font-black text-foreground">
                                        59.49€
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-bold">
                                        Pe An
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        sau 7.99€{" "}
                                        <span className="text-[10px] font-normal">
                                            / lună
                                        </span>
                                    </p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow text-xs font-medium text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-highlight mt-0.5">
                                            ■
                                        </span>{" "}
                                        Accesul la un număr nelimitat de
                                        proiecte active deodată.
                                    </li>
                                </ul>
                                <button
                                    onClick={() =>
                                        handleCheckout("Premium Company")
                                    }
                                    className="w-full py-3 border border-border hover:bg-secondary transition-colors uppercase text-[10px] font-bold tracking-widest"
                                >
                                    Contactează-ne
                                </button>
                            </div>

                            <div className="flex-1 bg-secondary/10 border border-dashed border-border p-8 flex flex-col">
                                <h3 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-muted-foreground">
                                    Oferta Student
                                </h3>
                                <div className="mb-8">
                                    <p className="text-4xl font-black text-highlight">
                                        Free
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                                        Premium Individual
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground mb-8 flex-grow leading-relaxed">
                                    Acces gratis la premium individual. Este
                                    nevoie de o validare a faptului că
                                    utilizatorul este student.
                                </p>
                                <button
                                    onClick={() => handleCheckout("Student")}
                                    className="w-full py-3 border border-border hover:bg-secondary transition-colors uppercase text-[10px] font-bold tracking-widest"
                                >
                                    VALIDEAZĂ STATUT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer
                style={{
                    borderTop: "1px solid var(--border)",
                    background: "var(--card)",
                }}
            >
                <div
                    style={{
                        maxWidth: "1100px",
                        margin: "0 auto",
                        padding: "4rem 2rem 2rem",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "4rem",
                            flexWrap: "wrap" as const,
                            marginBottom: "4rem",
                        }}
                    >
                        <div style={{ flex: "1 1 280px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "1rem",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "15px",
                                        fontWeight: 700,
                                        color: "var(--foreground)",
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    e-Scraps
                                </span>
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    color: "var(--muted-foreground)",
                                    lineHeight: 1.7,
                                    maxWidth: "300px",
                                }}
                            >
                                Platformă de agregare și analiză a datelor
                                publice din România. Transparență prin
                                tehnologie.
                            </p>
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <h5
                                style={{
                                    margin: "0 0 1rem",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase" as const,
                                    color: "var(--muted-foreground)",
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                Surse
                            </h5>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row" as const,
                                    gap: "40px",
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {[
                                    "ANAF ",
                                    "portal.just.ro",
                                    "SEAP",
                                    "ANI",
                                    "Presă",
                                ].map((s) => (
                                    <span
                                        key={s}
                                        style={{
                                            fontSize: "13px",
                                            color: "var(--muted-foreground)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            paddingTop: "1.5rem",
                            borderTop: "1px solid var(--border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap" as const,
                            gap: "1rem",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "12px",
                                color: "var(--muted-foreground)",
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            © 2026 e-Scraps. Date publice, analiză deschisă.
                        </span>
                        <span
                            style={{
                                fontSize: "12px",
                                color: "var(--muted-foreground)",
                                fontFamily: "'JetBrains Mono', monospace",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <span
                                style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    background: "var(--highlight)",
                                    display: "inline-block",
                                }}
                            />{" "}
                            Date actualizate zilnic
                        </span>
                    </div>
                </div>
            </footer>

            {selectedPlan && modalStep && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-background border border-border rounded-sm max-w-md w-full p-6 relative shadow-2xl font-mono text-xs">
                        {modalStep !== "processing" && (
                            <button
                                onClick={closeCheckout}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-sm transition-colors"
                            >
                                ✕
                            </button>
                        )}

                        {modalStep === "owned" && (
                            <div className="text-center py-6 space-y-6">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-base font-black uppercase tracking-wider text-foreground">
                                        Plan Activ
                                    </h4>
                                    <p className="text-muted-foreground mt-2 leading-relaxed">
                                        Deții deja funcționalitățile incluse în
                                        planul{" "}
                                        <span className="text-highlight font-bold">
                                            {selectedPlan}
                                        </span>
                                        .
                                    </p>
                                </div>
                                <button
                                    onClick={closeCheckout}
                                    className="w-full py-3 bg-secondary text-foreground hover:bg-border transition-colors uppercase text-[10px] font-bold tracking-widest"
                                >
                                    Înapoi la site
                                </button>
                            </div>
                        )}

                        {modalStep === "form" && (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="border-b border-border pb-3">
                                    <h4 className="text-sm font-black uppercase tracking-wider text-highlight">
                                        Configurare Abonament
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Plan selectat: {selectedPlan}
                                    </p>
                                </div>
                                {(selectedPlan === "Premium Individual" ||
                                    selectedPlan === "Premium Company") && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                                Nume Titular Card
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="ION POPESCU"
                                                className="w-full bg-secondary/20 border border-border p-2.5 text-foreground focus:border-highlight outline-none rounded-sm uppercase tracking-wide"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                                Număr Card
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                pattern="\d{16}"
                                                maxLength={16}
                                                placeholder="4111 2222 3333 4444"
                                                className="w-full bg-secondary/20 border border-border p-2.5 text-foreground focus:border-highlight outline-none rounded-sm tracking-widest"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                                    Dată Expirare
                                                </label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                    className="w-full bg-secondary/20 border border-border p-2.5 text-foreground focus:border-highlight outline-none rounded-sm text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                                    CVV
                                                </label>
                                                <input
                                                    required
                                                    type="password"
                                                    pattern="\d{3}"
                                                    maxLength={3}
                                                    placeholder="•••"
                                                    className="w-full bg-secondary/20 border border-border p-2.5 text-foreground focus:border-highlight outline-none rounded-sm text-center tracking-widest"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {selectedPlan === "Premium Company" && (
                                    <div className="space-y-4 border-t border-border/50 pt-4 mt-4">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                                Nume Business / Companie
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="SC SCRAPS TECH SRL"
                                                className="w-full bg-secondary/20 border border-border p-2.5 text-foreground focus:border-highlight outline-none rounded-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                                Email Business
                                            </label>
                                            <input
                                                required
                                                type="email"
                                                placeholder="office@companie.ro"
                                                className="w-full bg-secondary/20 border border-border p-2.5 text-foreground focus:border-highlight outline-none rounded-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                                {selectedPlan === "Student" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                                Nume Complet Student
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Andrei Marinescu"
                                                className="w-full bg-secondary/20 border border-border p-2.5 text-foreground focus:border-highlight outline-none rounded-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                                Email Instituțional (.edu /
                                                .unibuc etc.)
                                            </label>
                                            <input
                                                required
                                                type="email"
                                                placeholder="andrei.marinescu@s.unibuc.ro"
                                                className="w-full bg-secondary/20 border border-border p-2.5 text-foreground focus:border-highlight outline-none rounded-sm lower-case"
                                            />
                                        </div>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-highlight text-black font-black uppercase text-[10px] tracking-widest hover:bg-yellow-400 transition-colors rounded-sm mt-2"
                                >
                                    {selectedPlan === "Student"
                                        ? "Trimite Solicitarea"
                                        : "Finalizează Achiziția"}
                                </button>
                            </form>
                        )}

                        {modalStep === "processing" && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="w-9 h-9 border-4 border-secondary border-t-highlight rounded-full animate-spin"></div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
                                    Se procesează securizat...
                                </p>
                            </div>
                        )}

                        {modalStep === "success" && (
                            <div className="flex flex-col items-center text-center space-y-6 py-4">
                                <div className="w-14 h-14 bg-highlight/20 text-highlight rounded-full flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-7 w-7"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-base font-black uppercase tracking-wider text-foreground">
                                        Procesat cu Succes
                                    </h4>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Solicitarea ta pentru planul{" "}
                                        <span className="text-highlight font-bold">
                                            {selectedPlan}
                                        </span>{" "}
                                        a fost aprobată.
                                    </p>
                                    <p className="text-[10px] text-neutral-500 italic pt-2">
                                        (Acesta este un demo de frontend. Nu
                                        s-au retras bani reali.)
                                    </p>
                                </div>
                                <button
                                    onClick={closeCheckout}
                                    className="w-full py-3 bg-foreground text-background uppercase text-[10px] font-bold tracking-widest hover:bg-highlight hover:text-black transition-colors rounded-sm"
                                >
                                    Continuă spre aplicație
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
