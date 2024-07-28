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
  const [totalUsers, setTotalUsers] = useState("0");
  const isMounted = useIsMounted();

  useEffect(() => {
    if (isMounted) {
      let prevLiquidity = 19563920000; // Starting value for liquidity
      let prevVolume = 5176342000; // Starting value for volume
      let prevUsers = 12930; // Starting value for users

      const updateValues = () => {
        const liquidityIncrement = Math.floor(Math.random() * 9000) + 1000;
        prevLiquidity += liquidityIncrement;

        const volumeIncrement = Math.floor(Math.random() * 4500) + 5000;
        prevVolume += volumeIncrement;

        const usersIncrement = Math.floor(Math.random() * 10) + 10;
        prevUsers += usersIncrement;

        setTotalLiquidity(
          `$${prevLiquidity.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
        );
        setTotalVolume(
          `$${prevVolume.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
        );

        setTotalUsers(
          `${prevUsers.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
        );
      };

      updateValues();
      const interval = setInterval(updateValues, 1500);

      return () => clearInterval(interval);
    }
  }, [isMounted]);
  if (!isMounted) return null;

  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <section className="text-center mb-8 font-semibold">
          {/* <h1 className="text-6xl font-bold mb-4">Welcome to NEXUS</h1> */}
          <p className="text-6xl mb-12 font-semibold">
            Shape the future on the leading decentralized crypto trading
            protocol
          </p>
        </section>

        <section className="mb-16 w-full">
          <div className="flex justify-between items-center bg-transparent p-6 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-semibold mb-2">Total Liquidity</p>
              <p className="text-4xl font-bold text-pink-500">
                {totalLiquidity}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold mb-2">Total Users</p>
              <p className="text-4xl font-bold text-pink-500">{totalUsers}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold mb-2">24h Trading Volume</p>
              <p className="text-4xl font-bold text-pink-500">{totalVolume}</p>
            </div>
          </div>
        </section>

        <section>
          <Swiper
            slidesPerView={1}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            loop={true}
            modules={[Pagination, Autoplay]}
            centeredSlides={true}
            speed={1000}
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
    <div className="bg-zinc-600 p-6 mx-[30%] rounded-2xl flex items-center h-full">
      <div className="mr-6">
        <Image
          src={icon}
          alt={title}
          width={300}
          height={300}
          className="mb-4"
        />
      </div>
      <div>
        <h3 className="text-2xl font-semibold mb-2">{title}</h3>
        <p className="text-base">{description}</p>
      </div>
    </div>
  );
}
