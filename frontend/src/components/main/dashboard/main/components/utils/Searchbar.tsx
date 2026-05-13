import { SearchIcon, XIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useWebSocket } from "../../../utils/WebsocketProvider";

export default function Search() {
    const [companyTarget, setCompanyTarget] = useState("");
    const [personTarget, setPersonTarget] = useState("");

    const { startScan } = useWebSocket();
    const [isOpen, setIsOpen] = useState(false);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();

        console.log("search submitted");

        if (companyTarget.trim() || personTarget.trim()) {
            startScan({
                company: companyTarget.trim(),
                person: personTarget.trim(),
            });

            console.log("scan should start");
            setCompanyTarget("");
            setPersonTarget("");
        }
    };

    return (
        <form
            onSubmit={(e) => {
                console.log("submit bro");
                handleSearch(e);
            }}
            className={`flex items-center w-full h-10 bg-primary rounded-md overflow-hidden transition-all duration-500 ease-in-out ${
                isOpen ? "max-w-[500px]" : "max-w-[60px]"
            }`}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex shrink-0 justify-center items-center w-[60px] h-full cursor-pointer bg-secondary-highlight/30"
            >
                <div className="relative flex items-center justify-center w-6 h-6">
                    <SearchIcon
                        className={`absolute size-4 transition-all duration-300 ease-in-out text-highlight ${
                            isOpen
                                ? "opacity-0 scale-50 rotate-90"
                                : "opacity-100 scale-100 rotate-0"
                        }`}
                    />

                    <XIcon
                        className={`absolute size-4 transition-all duration-300 ease-in-out text-highlight ${
                            isOpen
                                ? "opacity-100 scale-100 rotate-0"
                                : "opacity-0 scale-50 -rotate-90"
                        }`}
                    />
                </div>
            </button>

            <div className="flex grow min-w-0 h-full border-4 border-l-0 border-secondary-highlight/30">
                <input
                    type="text"
                    onChange={(e) => setCompanyTarget(e.target.value)}
                    value={companyTarget}
                    placeholder="Companies..."
                    tabIndex={isOpen ? 0 : -1}
                    className="w-1/2 min-w-0 h-full px-[15px] text-base font-normal text-foreground bg-transparent outline-none border-r border-secondary-highlight/30"
                />

                <input
                    type="text"
                    onChange={(e) => setPersonTarget(e.target.value)}
                    value={personTarget}
                    placeholder="People..."
                    tabIndex={isOpen ? 0 : -1}
                    className="w-1/2 min-w-0 h-full px-[15px] text-base font-normal text-foreground bg-transparent outline-none"
                />
            </div>

            <button type="submit" className="hidden"></button>
        </form>
    );
}
