import { X } from "lucide-react";
import { useEffect } from "react";

export default function Settings({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl rounded-xl border border-border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:cursor-pointer"
                >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </button>

                {/* Content */}
                <div className="flex flex-col space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Settings and shi
                    </p>

                    <div className="h-64 w-full rounded-md border-muted-foreground/25 bg-muted/10 grid place-items-center">
                        <span className="text-muted-foreground text-sm">
                            Settings content goes here
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
