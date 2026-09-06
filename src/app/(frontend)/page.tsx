import Hero from "@/components/Hero";
import PeelLetter from "@/components/PeelLetter";
import WaveBand from "@/components/WaveBand";
import TapeSlider from "@/components/TapeSlider";
import GiantPinning from "@/components/GiantPinning";
import MakeItStick from "@/components/MakeItStick";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      {/* The U of BY YOU lifting off the wall. game={false} — the peel and the
          breathing only; the taping is still the lab's (lab/peel-letter). */}
      <PeelLetter game={false} />
      <WaveBand />
      <TapeSlider />
      {/* After the products, not before: TO CREATE / TO FIX / TO PROTECT is the
          slider's six tapes said back as three reasons, and it only reads that
          way once the reader has met them. */}
      <GiantPinning />
      {/* The key visual last, between the reasons and the sign-off: the section
          above says why the tape exists, this one hands it back as the line the
          brand is closing on, and the footer takes the page from there. */}
      <MakeItStick />
      <Footer />
    </>
  );
}
