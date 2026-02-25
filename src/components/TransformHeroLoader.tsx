"use client";

import dynamic from "next/dynamic";

const TransformHero = dynamic(() => import("@/components/TransformHero"), {
  ssr: false,
});

export default function TransformHeroLoader() {
  return <TransformHero />;
}
