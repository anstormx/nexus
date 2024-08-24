import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Providers from "./components/provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>NEXUS: Decentralized Swapping</title>
        <meta
          name="description"
          content="NEXUS: A decentralized exchange platform for secure and efficient token swapping."
        />
        <meta
          name="keywords"
          content="decentralized exchange, DEX, crypto swapping, blockchain, NEXUS"
        />
        <meta property="og:title" content="NEXUS: Decentralized Swapping" />
        <meta
          property="og:description"
          content="NEXUS: A decentralized exchange platform for secure and efficient token swapping."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="stylesheet" href={inter.url} />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen bg-zinc-950 bg-opacity-90">
            {/* Background and title */}
            <div className="fixed inset-0 bg-cover bg-center blur-sm z-[-1] bg-[url('https://coincodex.com/en/resources/images//admin/news/5-best-crypto-to-buy/best-crypto-to-buy-before-bitcoin-halving-2023.png:resizeboxcropjpg?1600x900')] animate-background-move"></div>
            {children}
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              newestOnTop={false}
              hideProgressBar={true}
              rtl={false}
              pauseOnFocusLoss
              pauseOnHover
              theme="dark"
              stacked
              transition={Flip}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
