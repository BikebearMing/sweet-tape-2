import Hero from "@/components/Hero";
import PeelLetter from "@/components/PeelLetter";
import { getPalette } from "@/data/tapes";
import WaveBand from "@/components/WaveBand";
import TapeSlider from "@/components/TapeSlider";
import GiantPinning from "@/components/GiantPinning";
import MakeItStick from "@/components/MakeItStick";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SweetTape — Stick By You | Cloth, Masking & OPP Tapes",
  description:
    "Six tapes made in Malaysia, one for every job — cloth, masking, stationery, double-sided and more. Three generations of tape; meet the one who sticks.",
};

export default async function Home() {
  /* The six tapes' colours, for the backs of the peeling letters. The same
     query the layout runs for the preloader — six rows, one column. */
  const palette = await getPalette();
  return (
    <>
      <Hero />
      {/* The hero's badge coming unstuck, and the reader pressing it back —
          see components/PeelLetter. */}
      <PeelLetter palette={palette} />
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
