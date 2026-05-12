import FinalNavbar from "../utils/FinalNavbar";
import HomeContent from "./HomeContent";

export default function Home() {
    return (
<div className="bg-background text-foreground font-mono selection:bg-highlight selection:text-foreground overflow-x-hidden">            <FinalNavbar />
            <HomeContent />
        </div>
    );
}
