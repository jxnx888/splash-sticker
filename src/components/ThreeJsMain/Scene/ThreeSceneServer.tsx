'use client';
import { ThreeSceneServerProps } from "@/src/components/Scene/ThreeScene";
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("./ThreeScene"), {
  ssr: false,
});

export default function ThreeSceneServer({previewDecalsRef}: ThreeSceneServerProps) {
  return <ThreeScene previewDecalsRef={previewDecalsRef} />;
}
