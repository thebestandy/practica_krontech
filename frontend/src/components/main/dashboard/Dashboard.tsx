import DashboardMain from "./main/DashboardMain";
import DashboardSidebar from "./sidebars/DashboardSidebar";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "./utils/ui/resizable";

export default function Dashboard() {
    return (
        <div className="w-full h-screen">
            <ResizablePanelGroup orientation="horizontal">
                <ResizablePanel defaultSize="25%" maxSize="35%" minSize="10%">
                    <DashboardSidebar />
                </ResizablePanel>
                <ResizableHandle />

                <ResizablePanel defaultSize="75%">
                    <DashboardMain />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
