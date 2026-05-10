import React from "react";

// Date extrase din mock data de scanare
const tableData = [
    {
        type: "Person",
        label: "Radu Ionescu",
        summary:
            "Businessman active in infrastructure and energy sectors. Former state secretary.",
        link: "#",
    },
    {
        type: "Person",
        label: "Gheorghe Munteanu",
        summary:
            "Former judge at Tribunalul București, retired 2021. Linked to multiple cases.",
        link: "#",
    },
    {
        type: "Person",
        label: "Cristina Vlad",
        summary:
            "Notary public in Ilfov County. Authenticated company transfers.",
        link: "#",
    },
    {
        type: "Company",
        label: "InfraBuild Solutions SRL",
        summary:
            "Construction firm with rapid growth in public sector contracts.",
        link: "https://recom.onrc.ro/infrabuild",
    },
    {
        type: "Company",
        label: "GreenRoute Construct SRL",
        summary:
            "Subcontractor frequently used by InfraBuild on motorway projects.",
        link: "https://recom.onrc.ro/greenroute",
    },
    {
        type: "CourtCase",
        label: "Dosar 441/2/2025",
        summary:
            "Investigation into procurement irregularities involving InfraBuild Solutions.",
        link: "https://portal.just.ro/441/2025",
    },
];

export default function GraphTable() {
    return (
        <div className="w-full border border-sidebar-border bg-sidebar/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-sidebar-border bg-sidebar/10">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-32">
                            Type
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-48">
                            Label
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Summary
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20">
                            Link
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-sidebar-border/50 font-mono text-xs">
                    {tableData.map((row, idx) => (
                        <tr
                            key={idx}
                            className="hover:bg-highlight/5 transition-colors group"
                        >
                            <td className="px-6 py-4">
                                <span
                                    className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase ${
                                        row.type === "Person"
                                            ? "bg-blue-500/20 text-blue-400"
                                            : row.type === "Company"
                                              ? "bg-amber-500/20 text-amber-400"
                                              : "bg-red-500/20 text-red-400"
                                    }`}
                                >
                                    {row.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-foreground">
                                {row.label}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground leading-relaxed">
                                {row.summary}
                            </td>
                            <td className="px-6 py-4">
                                <a
                                    href={row.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-highlight opacity-50 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
