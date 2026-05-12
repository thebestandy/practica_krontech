import { SearchIcon, XIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useWebSocket } from "../../../utils/WebsocketProvider";

export default function Search() {
    const [searchTarget, setSearchTarget] = useState("");
    const { startScan } = useWebSocket();
    const [isOpen, setIsOpen] = useState(false);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();

        console.log("search submited");

        if (searchTarget.trim()) {
            startScan(searchTarget);
            console.log("scan should start");
            setSearchTarget("");
        }
    };

    return (
        <form
            onSubmit={handleSearch}
            className={`flex items-center w-full h-10 bg-primary rounded-md overflow-hidden transition-all duration-500 ease-in-out ${
                isOpen ? "max-w-[350px]" : "max-w-[60px]"
            }`}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex shrink-0 justify-center items-center w-[60px] h-full bg-black cursor-pointer"
            >
                <div className="relative flex items-center justify-center w-6 h-6">
                    <SearchIcon
                        className={`absolute size-4 transition-all duration-300 ease-in-out ${
                            isOpen
                                ? "opacity-0 scale-50 rotate-90"
                                : "opacity-100 scale-100 rotate-0"
                        }`}
                    />

                    <XIcon
                        className={`absolute size-4 transition-all duration-300 ease-in-out ${
                            isOpen
                                ? "opacity-100 scale-100 rotate-0"
                                : "opacity-0 scale-50 -rotate-90"
                        }`}
                    />
                </div>
            </button>

            <input
                type="text"
                onChange={(e) => setSearchTarget(e.target.value)}
                value={searchTarget}
                placeholder="Search..."
                tabIndex={isOpen ? 0 : -1}
                className="flex-grow min-w-0 h-full px-[15px] text-base font-normal text-primary-foreground bg-transparent border-2 outline-none border-black"
            />
        </form>
    );
}
