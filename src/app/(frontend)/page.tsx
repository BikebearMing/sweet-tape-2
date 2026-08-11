import Hero from "@/components/Hero";
import WaveBand from "@/components/WaveBand";
import TapeSlider from "@/components/TapeSlider";
import GiantPinning from "@/components/GiantPinning";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <WaveBand />
      <TapeSlider />
      {/* After the products, not before: TO CREATE / TO FIX / TO PROTECT is the
          slider's six tapes said back as three reasons, and it only reads that
          way once the reader has met them. */}
      <GiantPinning />
      <Footer />
    </>
  );
}
