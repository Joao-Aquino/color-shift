import { ColorShiftApp } from "@/components/color-shift-app";
import { LegalUnderlay } from "@/components/legal-underlay";

export default function Home() {
  return (
    <LegalUnderlay>
      <ColorShiftApp />
    </LegalUnderlay>
  );
}
