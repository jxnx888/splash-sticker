'use client';
import dynamic from "next/dynamic";
import { ThreeSceneServerProps } from "./ThreeScene";

const ThreeScene = dynamic(() => import("./ThreeScene"), {
  ssr: false,
});

export default function ThreeSceneServer({previewDecalsRef}: ThreeSceneServerProps) {
  return <ThreeScene previewDecalsRef={previewDecalsRef} />;
}
