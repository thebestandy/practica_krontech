import FinalNavbar from "../utils/FinalNavbar";
import EnterpriseContent from "./EnterpriseContent";

export default function Enterprise() {
    return (
        <div className="min-h-screen bg-background text-foreground font-mono selection:bg-highlight selection:text-foreground overflow-x-hidden">
            <FinalNavbar />
            <EnterpriseContent />
        </div>
    );
}
