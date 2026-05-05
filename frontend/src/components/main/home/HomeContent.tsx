export default function HomeContent() {
    return (
        <>
            <section className="h-screen w-full flex flex-row items-center justify-around px-10 relative overflow-hidden py-20 gap-10">
                <div className="w-full md:w-1/2 flex flex-col justify-center relative z-10">
                    <h1
                        className="opacity-0 animate-fadeUp delay-[450ms] 
                    text-[clamp(3rem,9vw,9rem)] leading-[1] tracking-[-0.08em] 
                    font-bold text-[#f5f5dc] mb-10 font-sans"
                    >
                        Introducing <br />
                        <em className="italic font-light text-highlight font-serif">
                            Echipa de 7
                        </em>
                    </h1>

                    <p
                        className="opacity-0 animate-fadeUp delay-[650ms]
                    text-0.9em leading-[1.85] 
                    font-light text-stone-400 max-w-[40ch] mb-16 font-sans"
                    >
                        ttext text text text text text text text text text text
                        text text text text text text text text text text text
                        text text text text text text text text text text text
                        text text text text text text exttext text text text
                        text text text text text
                    </p>

                    <div className="opacity-0 animate-fadeUp delay-[900ms] flex items-center gap-4">
                        <span className="text-[0.6rem] tracking-[0.24em] uppercase text-highlight font-mono">
                            Scroll
                        </span>

                        <div className="w-[46px] h-[46px] rounded-full border border-highlight flex items-center justify-center shrink-0">
                            <svg
                                viewBox="0 0 13 13"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-[13px] h-[13px] text-highlight"
                            >
                                <path d="M6.5 1v11M1 7l5.5 5L12 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="w-full h-full flex items-center justify-center relative opacity-0 animate-fadeUp delay-1100 z-10 mt-10">
                    <div className="relative w-full max-w-250 max-h-150 aspect-square rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl flex items-center justify-center">
                        {/* aice vine video-ul autoPlay, loop, muted, playsInline */}
                        <img
                            src="https://louisemcsharry.com/wp-content/uploads/2012/06/hovering-cats.gif"
                            className="inset-0 w-full h-full object-cover opacity-50"
                        />
                    </div>
                </div>
            </section>

            <section className="relative grid h-screen w-full snap-center place-items-center">
                lol
            </section>
        </>
    );
}
