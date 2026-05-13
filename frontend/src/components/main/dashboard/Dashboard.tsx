import DashboardMain from "./main/DashboardMain";
import DashboardSidebar from "./sidebars/DashboardSidebar";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "./utils/ui/resizable";
import { WebSocketProvider } from "./utils/WebsocketProvider";

export default function Dashboard() {
    return (
        <WebSocketProvider>
            <div className="w-full h-screen font-sans">
                <ResizablePanelGroup orientation="horizontal">
                    <ResizablePanel
                        defaultSize="25%"
                        maxSize="35%"
                        minSize="10%"
                    >
                        <DashboardSidebar />
                    </ResizablePanel>
                    <ResizableHandle className="bg-highlight/30" />

                    <ResizablePanel defaultSize="75%">
                        <DashboardMain />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </WebSocketProvider>
    );
}
