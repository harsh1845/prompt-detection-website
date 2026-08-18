import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import DetectorWorkbench from "@/components/DetectorWorkbench";
import ScrollingMarquee from "@/components/ScrollingMarquee";
import FeaturesDashboard from "@/components/FeaturesDashboard";
import ThreatHub from "@/components/ThreatHub";
import GetInTouch from "@/components/GetInTouch";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-base">
      <Nav />
      <Hero />
      <DetectorWorkbench />
      <ScrollingMarquee />
      <FeaturesDashboard />
      <ThreatHub />
      <GetInTouch />
      <Footer />
    </main>
  );
}
