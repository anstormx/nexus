import Logo from "../favicon.ico";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";

function Header() {
  return (
    <div className="w-full flex justify-between items-center px-[2%] py-[1%]">
      <div className="flex flex-row items-center text-gray-400">
        <Image src={Logo} alt="logo" className="h-12 w-12"/>
        <div className="font-bold text-2xl ml-[3%] text-pink-500">
          NEXUS
        </div>
        <div className="ml-8 hover:text-gray-300 transition duration-200">
          <Link href="/">
            Trade
          </Link>
        </div>
        <div className="ml-6 hover:text-gray-300 transition duration-200 cursor-pointer">
          Explore
        </div>
        <div className="ml-6 hover:text-gray-300 transition duration-200 cursor-pointer">
          Pool
        </div>
      </div>
      <ConnectButton />
    </div>
  );
}

export default Header;
