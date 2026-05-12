import Graph from "./Graph";
import GraphTable from "./GraphTable";

export default function EnterpriseContent() {
    return (
        <>
            {/* HERO SECTION - Acoperă tot ecranul */}
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

            {/* TEXT TRANZIȚIE */}
            <section className="w-full py-32 px-4 border-y border-border bg-secondary/20">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-2xl md:text-4xl font-bold leading-snug text-muted-foreground">
                        Investighează ca{" "}
                        <span className="text-foreground">Recorder</span> sau{" "}
                        <span className="text-foreground">
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

            {/* GRAF DEMO & TABEL */}
            <section className="w-full py-24 px-4 bg-background">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                            Simulează un proiect e-Scraps
                        </h2>
                        <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.1em] text-highlight">
                            <span className="w-2 h-2 rounded-full bg-highlight animate-ping"></span>
                            SIMULARE ACTIVA
                        </div>
                    </div>

                    {/* Graful */}
                    <div className="w-full h-[550px] rounded-md overflow-hidden border border-border bg-secondary/10 relative">
                        <Graph />
                    </div>

                    {/* Tabelul de date sub Graf */}
                    <div className="mt-6">
                        <GraphTable />
                    </div>
                </div>
            </section>

            {/* OFERTE */}
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
                            {/* Standard */}
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
                                <button className="w-full py-3 border border-border hover:bg-secondary transition-colors uppercase text-[10px] font-bold tracking-widest">
                                    Selectează
                                </button>
                            </div>

                            {/* Premium Individual */}
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
                                <button className="w-full py-3 bg-highlight text-black hover:opacity-90 transition-opacity uppercase text-[10px] font-bold tracking-widest">
                                    Alege Premium
                                </button>
                            </div>

                            {/* Premium Company */}
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
                                <button className="w-full py-3 border border-border hover:bg-secondary transition-colors uppercase text-[10px] font-bold tracking-widest">
                                    Contactează-ne
                                </button>
                            </div>

                            {/* Student */}
                            <div className="flex-1 bg-secondary/10 border border-dashed border-border p-8 flex flex-col">
                                <h3 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-muted-foreground">
                                    Oferta Student
                                </h3>
                                <div className="mb-8">
                                    <p className="text-4xl font-black text-highlight">
                                        Gratis
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
                                <button className="w-full py-3 bg-border/50 text-foreground hover:bg-border transition-colors uppercase text-[10px] font-bold tracking-widest">
                                    Validează Statut
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="w-full py-12 border-t border-border bg-background text-center">
                <p className="text-[10px] tracking-[0.5em] text-muted-foreground uppercase">
                    ©Copyright e-Scraps 2026
                </p>
            </footer>
        </>
    );
}
