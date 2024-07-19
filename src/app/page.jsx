"use client"; 

import Image from "next/image";
import Header from "./components/Header";
import Swap from "./components/Swap";


export default function Home() {
  
  return (
    <div>
      <Header />
      <Swap />
    </div>
  );
}
