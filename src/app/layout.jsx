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
        <title>nexus</title>
        <meta name="description" content="decentralized exchange." />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="stylesheet" href={inter.url} />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen bg-zinc-950 bg-opacity-90">
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
