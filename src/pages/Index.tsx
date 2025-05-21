
import { useEffect } from "react";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import GameModes from "@/components/home/GameModes";
import { useViewportHeight } from "@/hooks/use-viewport-height";
import { Layout } from "@/components/layout/Layout";

const Index = () => {
  // Apply viewport height fix
  useViewportHeight();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout hideFooter>
      <main className="flex-grow">
        <Hero />
        <Features />
        <GameModes />
      </main>
    </Layout>
  );
};

export default Index;
