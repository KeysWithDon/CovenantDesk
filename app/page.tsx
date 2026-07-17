import type { Metadata } from "next";
import { ContractStudio } from "./components/ContractStudio";

export const metadata: Metadata = {
  title: "CovenantDesk — Commercial Agreement Studio",
  description: "Build, review, sign, print, and securely preserve professional commercial property rental agreements.",
};

export default function Home() {
  return <ContractStudio />;
}

