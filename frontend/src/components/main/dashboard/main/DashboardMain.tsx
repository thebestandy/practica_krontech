import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "../utils/ui/resizable";
import Graph from "./components/Graph";
import Table from "./components/Table";
import Search from "./components/utils/Searchbar";

export default function DashboardMain() {
    return (
        <div className="w-full h-screen grid place-items-center">
            <ResizablePanelGroup orientation="vertical">
                <ResizablePanel defaultSize="50%" maxSize="95%" minSize="10%">
                    <div className="w-full h-screen">
                        <div className="z-50 absolute top-5 right-10">
                            <Search />
                        </div>
                        <Graph />
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel>
                    <div className="w-full h-full">
                        <Table />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
