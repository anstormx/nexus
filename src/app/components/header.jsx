import Logo from "../logo.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";

function Header() {
  return (
    <div className="w-full flex justify-between items-center px-[2%] py-[1%]">
      <div className="flex flex-row items-center text-gray-400">
        <Image src={Logo} alt="logo" className="h-10 w-10"/>
        <div className="font-semibold text-2xl ml-[2%] text-pink-500">
          nexus
        </div>
        <div className="ml-8 hover:text-gray-300 transition duration-200">
          <Link href="/">
            Trade
          </Link>
        </div>
        <div className="ml-6 hover:text-gray-300 transition duration-200">
          Explore
        </div>
        <div className="ml-6 hover:text-gray-300 transition duration-200">
          Pool
        </div>
      </div>
      <ConnectButton />
    </div>
  );
}

export default Header;
