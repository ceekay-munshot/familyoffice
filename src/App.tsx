import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { UploadPortfolio } from "@/pages/UploadPortfolio";
import { MorningCIO } from "@/pages/MorningCIO";
import { PortfolioMonitor } from "@/pages/PortfolioMonitor";
import { CoreSatellite } from "@/pages/CoreSatellite";
import { SectorComposition } from "@/pages/SectorComposition";
import { RiskPerformance } from "@/pages/RiskPerformance";
import { BrokerResearch } from "@/pages/BrokerResearch";
import { SectorIntelligence } from "@/pages/SectorIntelligence";
import { Recommendations } from "@/pages/Recommendations";
import { UploadHistory } from "@/pages/UploadHistory";
import { SourcesEvidence } from "@/pages/SourcesEvidence";
import { usePortfolio } from "@/context/PortfolioContext";
import { EmptyState } from "@/components/EmptyState";

function Gate({ children }: { children: React.ReactNode }) {
  const { portfolio } = usePortfolio();
  if (!portfolio) return <EmptyState />;
  return <>{children}</>;
}

// Root + unknown-path landing. Sends users straight to the Morning CIO
// Dashboard once they've uploaded a portfolio; otherwise routes them to
// the upload screen so the very-first-visit experience still starts at
// onboarding.
function RootRedirect() {
  const { portfolio } = usePortfolio();
  return <Navigate to={portfolio ? "/cio" : "/upload"} replace />;
}

export default function App() {
  return (
    <div className="flex h-screen bg-ink-950 text-slate-200 bg-grid">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/upload" element={<UploadPortfolio />} />
            <Route path="/cio" element={<Gate><MorningCIO /></Gate>} />
            <Route path="/monitor" element={<Gate><PortfolioMonitor /></Gate>} />
            <Route path="/core-satellite" element={<Gate><CoreSatellite /></Gate>} />
            <Route path="/sectors" element={<Gate><SectorComposition /></Gate>} />
            <Route path="/risk" element={<Gate><RiskPerformance /></Gate>} />
            <Route path="/research" element={<Gate><BrokerResearch /></Gate>} />
            <Route path="/intelligence" element={<Gate><SectorIntelligence /></Gate>} />
            <Route path="/recommendations" element={<Gate><Recommendations /></Gate>} />
            <Route path="/history" element={<UploadHistory />} />
            <Route path="/sources" element={<Gate><SourcesEvidence /></Gate>} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
