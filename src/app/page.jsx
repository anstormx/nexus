"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "./components/header";
import { useIsMounted } from "@/hooks/useIsMounted";
import chain from "../assets/chain.png";
import price from "../assets/price.png";
import rewards from "../assets/rewards.png";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectCube } from "swiper/modules";
import {
  DollarSign,
  Users,
  TrendingUp,
  ArrowDownToLine,
  Link,
  Gift,
} from "lucide-react";
import "swiper/css";
import "swiper/css/effect-cube";
import "swiper/css/pagination";

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
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-yellow-500">
            Welcome to NEXUS
          </h1>
          <p className="text-3xl mb-12 font-semibold">
            Shape the future on the leading decentralized crypto trading
            protocol
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-14 w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <StatCard
              title="Total Liquidity"
              value={totalLiquidity}
              icon={<DollarSign size={32} />}
            />
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={<Users size={32} />}
            />
            <StatCard
              title="24h Trading Volume"
              value={totalVolume}
              icon={<TrendingUp size={32} />}
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Swiper
            effect="cube"
            grabCursor={true}
            cubeEffect={{
              shadow: true,
              slideShadows: true,
              shadowOffset: 20,
              shadowScale: 0.94,
            }}
            pagination={true}
            modules={[EffectCube, Pagination, Autoplay]}
            className="mySwiper"
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            loop={true}
          >
            <SwiperSlide>
              <FeatureCard
                title="Low Fees"
                description="Minimal fees and maximum returns on your trades."
                icon={<ArrowDownToLine size={96} />}
              />
            </SwiperSlide>
            <SwiperSlide>
              <FeatureCard
                title="Multi-Chain Support"
                description="Trade across multiple blockchains seamlessly."
                icon={<Link size={96} />}
              />
            </SwiperSlide>
            <SwiperSlide>
              <FeatureCard
                title="Earn Rewards"
                description="Provide liquidity and earn rewards on your assets."
                icon={<Gift size={96} />}
              />
            </SwiperSlide>
          </Swiper>
        </motion.section>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl flex items-center justify-between">
      <div>
        <p className="text-xl font-semibold mb-2">{title}</p>
        <p className="text-3xl font-bold text-pink-500">{value}</p>
      </div>
      <div className="text-yellow-400">{icon}</div>
    </div>
  );
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-white/10 mx-[28%] backdrop-blur-lg py-10 rounded-2xl flex flex-col items-center h-full text-center">
      <div className="mb-6 text-yellow-500">{icon}</div>{" "}
      <h3 className="text-2xl font-semibold mb-4 text-pink-500">{title}</h3>
      <p className="text-lg">{description}</p>
    </div>
  );
}
