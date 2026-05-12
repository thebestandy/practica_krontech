import { useTheme } from "../../../components/theme-provider";
import videoYellow from "../../../assets/animatie_blender/24fpsYellow.mkv";
import videoPurple from "../../../assets/animatie_blender/24fpsPurple.mkv";
import videoTurquoise from "../../../assets/animatie_blender/24fpsTurquoiseCycles.mkv";

export default function HomeContent() {
    const { theme } = useTheme();

    const videoMap: Record<string, string> = {
        yellow: videoYellow,
        purple: videoPurple,
        turquoise: videoTurquoise,
    };

    const currentVideo = videoMap[theme] ?? videoPurple;

    return (
        <><br></br><br></br><br></br>
            <section className="h-screen w-full flex flex-row items-center justify-around px-10 relative overflow-hidden py-20 gap-10">
                <div className="w-1/2 md:w-1/2 flex flex-col justify-center relative z-10 mt-20">
                    
                    <h1
                        className="opacity-0 animate-fadeUp delay-[450ms] 
                    text-[clamp(3rem,9vw,9rem)] leading-[1] tracking-[-0.08em] 
                    font-bold text-foreground mb-10 "
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

                    <div className="opacity-0 animate-fadeUp delay-[900ms] flex items-center gap-4">
                        <span className="text-[1rem] tracking-[0.24em] uppercase text-foreground">
                            Scroll
                        </span>

                        <div className="w-[46px] h-[46px] rounded-full border border-foreground flex items-center justify-center shrink-0">
                            <svg
                                viewBox="0 0 13 13"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-[13px] h-[13px] text-foreground"
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

            <section className="relative grid h-screen w-full snap-center place-items-center text-secondary-foreground">
                lol
            </section>
        </>
    );
}