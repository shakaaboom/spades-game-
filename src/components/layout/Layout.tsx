
import { ReactNode, useState } from "react";
import Footer from "@/components/layout/Footer";
import MobileNavBar from "@/components/layout/MobileNavBar";
import Navbar from "./Navbar";
interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  onContactAdmin?: () => void;
}

export const Layout = ({ children, hideFooter = false, onContactAdmin }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-safe pt-20">{children}</main>
      {!hideFooter && <Footer onContactAdmin={onContactAdmin} />}
      <MobileNavBar />
    </div>
  );
};
