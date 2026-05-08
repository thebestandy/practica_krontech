import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
} from "../../../utils/ui/sheet";

interface DataEntry {
    name: string;
    description: string;
    links: string[];
}

export default function Datasheet({
    data,
    isOpen,
    onClose,
}: {
    data: object;
    isOpen: boolean;
    onClose: (open: boolean) => void;
}) {
    const [loading, setloading] = useState(false);

    if (!data) {
        console.log("what the fuck why am I here");
        return null;
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="flex flex-col h-full w-full sm:max-w-100 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-0 shadow-2xl">
                <SheetHeader className="p-6 mb-0 mt-8 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {data.type}
                        </span>
                        <h2 className="text-2xl font-bold text-white-900 mt-1">
                            {data.label}
                        </h2>
                    </div>
                </SheetHeader>
                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-white-700 mb-1">
                            Summary
                        </h3>
                        <p className="text-sm text-white-600 leading-relaxed">
                            {data.summary}
                        </p>
                    </div>
                </div>

                <SheetFooter>
                    <div className="flex justify-between">
                        {data.url !== "N/A" && (
                            <div>
                                <h3 className="text-sm font-semibold text-white-700 mb-1">
                                    Source:
                                </h3>
                                <a
                                    href={data.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 hover:underline break-all"
                                >
                                    {data.url}
                                </a>
                            </div>
                        )}

                        <div className="text-xs text-fuchsia-500">
                            ID: {data.id}
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
