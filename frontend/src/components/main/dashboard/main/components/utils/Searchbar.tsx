import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";

export default function Search() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`relative w-full h-10 bg-primary rounded-md transition-all duration-500 ease-in-out ${
                isOpen ? "max-w-[350px]" : "max-w-[60px]"
            }`}
        >
            <input
                type="text"
                placeholder="Search..."
                className={`relative w-full h-full text-base font-normal text-highlight bg-transparent border-none rounded-md outline-none transition-all duration-500 ease-in-out ${
                    isOpen ? "pl-[65px] pr-[15px]" : "px-[15px]"
                }`}
            />

            <span
                onClick={() => setIsOpen(!isOpen)}
                className={`absolute top-0 left-0 w-[60px] h-full flex justify-center items-center bg-secondary cursor-pointer ${
                    isOpen ? "rounded-l-md" : "rounded-md"
                }`}
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
            </span>
        </div>
    );
}
