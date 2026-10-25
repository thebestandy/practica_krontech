import DashboardMain from "./main/DashboardMain";
import DashboardSidebar from "./sidebars/DashboardSidebar";
import { DashboardProvider } from "./utils/DashboardProvider";
import { NotesProvider } from "./utils/NotesProvider";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "./utils/ui/resizable";
import { WebSocketProvider } from "./utils/WebsocketProvider";

export default function Dashboard() {
    return (
        <DashboardProvider>
            <WebSocketProvider>
                <div className="w-full h-screen font-sans">
                    <ResizablePanelGroup orientation="horizontal">
                        <ResizablePanel
                            defaultSize="25%"
                            maxSize="35%"
                            minSize="10%"
                        >
                            <NotesProvider>
                                <DashboardSidebar />
                            </NotesProvider>
                        </ResizablePanel>
                        <ResizableHandle className="bg-highlight/30" />

                        <ResizablePanel defaultSize="75%">
                            <DashboardMain />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </WebSocketProvider>
        </DashboardProvider>
    );
}
