import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

function Header() {
  return (
    <div className="w-full flex justify-between items-center px-[2%] py-[1%]">
      <div className="flex flex-row items-center text-gray-400">
        <div className="font-bold text-3xl ml-[3%] text-pink-500">
          <Link href="/">nexus</Link>
        </div>
        <div className="ml-8 hover:text-gray-300 transition duration-300 mt-2">
          <Link href="/trade">Trade</Link>
        </div>
        <div className="ml-6 hover:text-gray-300 transition duration-300 cursor-pointer mt-2">
          Explore
        </div>
        <div className="ml-6 hover:text-gray-300 transition duration-300 cursor-pointer mt-2">
          <Link href="/pool">Pool</Link>
        </div>
      </div>
      <ConnectButton />
    </div>
  );
}

export default Header;
