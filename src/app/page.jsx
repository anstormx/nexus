"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "./components/header";
import { useIsMounted } from "@/hooks/useIsMounted";
import chain from "../assets/chain.png";
import price from "../assets/price.png";
import rewards from "../assets/rewards.png";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
// import 'swiper/css/pagination';
import { Pagination, Autoplay } from "swiper/modules";

export default function Home() {
  const [totalLiquidity, setTotalLiquidity] = useState("0");
  const [totalVolume, setTotalVolume] = useState("0");
  const isMounted = useIsMounted();

  useEffect(() => {
    if (isMounted) {
      let prevLiquidity = 19563920000; // Starting value for liquidity
      let prevVolume = 5176342000; // Starting value for volume

      const updateValues = () => {
        const liquidityIncrement = Math.floor(Math.random() * 9000) + 1000;
        prevLiquidity += liquidityIncrement;

        const volumeIncrement = Math.floor(Math.random() * 4500) + 5000;
        prevVolume += volumeIncrement;

        setTotalLiquidity(
          `$${prevLiquidity.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
        );
        setTotalVolume(
          `$${prevVolume.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
        );
      };

      updateValues();
      const interval = setInterval(updateValues, 2000);

      return () => clearInterval(interval);
    }
  }, [isMounted]);
  if (!isMounted) return null;

  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <section className="text-center mb-16 font-semibold">
          {/* <h1 className="text-6xl font-bold mb-4">Welcome to NEXUS</h1> */}
          <p className="text-6xl mb-12 font-semibold">
            Build on the leading decentralized crypto trading protocol
          </p>
          <div className="flex justify-center gap-6">
            <Link
              href="/trade"
              className="bg-pink-500 hover:bg-pink-600 font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Start Trading
            </Link>
            <Link
              href="/pool"
              className="bg-zinc-500 hover:bg-zinc-600 font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Add Liquidity
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 px-[8%]">
          <div className="bg-zinc-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Total Liquidity</h2>
            <p className="text-4xl font-bold text-pink-500">{totalLiquidity}</p>
          </div>
          <div className="bg-zinc-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">24h Trading Volume</h2>
            <p className="text-4xl font-bold text-pink-500">{totalVolume}</p>
          </div>
        </section>

        <section>
          <Swiper
            slidesPerView={1}
            spaceBetween={30}
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            loop={true}
            modules={[Pagination, Autoplay]}
          >
            <SwiperSlide>
              <FeatureCard
                title="Low Fees"
                description="Enjoy minimal trading fees and maximum returns on your trades."
                icon={price}
              />
            </SwiperSlide>
            <SwiperSlide>
              <FeatureCard
                title="Multi-Chain Support"
                description="Trade across multiple blockchains seamlessly."
                icon={chain}
              />
            </SwiperSlide>
            <SwiperSlide>
              <FeatureCard
                title="Earn Rewards"
                description="Provide liquidity and earn rewards on your idle assets."
                icon={rewards}
              />
            </SwiperSlide>
          </Swiper>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-zinc-500 p-6 mx-[30%] rounded-lg flex items-center h-full">
      <div className="mr-6">
        <Image
          src={icon}
          alt={title}
          width={120}
          height={120}
          className="mb-4"
        />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
}
