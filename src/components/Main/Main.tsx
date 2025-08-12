'use client';

import { PreviewDecals } from "@/src/components/PreviewDecals/PreviewDecals";
import ThreeSceneServer from "@/src/components/Scene/ThreeSceneServer";
import { GlobalProvider } from "@/src/libs/context/GlobalContext";
import React, { useMemo, useRef, useState } from 'react';
import styles from "./Main.module.css";

export const Main = () => {
  const previewDecalsRef = useRef<HTMLDivElement>(null);
  const [currentDecal, setCurrentDecal] = useState<string>('/textures/decal/1.png');
  const globalContextValue = useMemo(() => (
    {
      setCurrentDecal,
      currentDecal
    }
  ),[currentDecal])

  return (
    <GlobalProvider value={globalContextValue}>
      <div
        ref={previewDecalsRef}
        className={styles.left} id={'previewDecals'}><PreviewDecals /></div>
      <div className={styles.right}><ThreeSceneServer previewDecalsRef={previewDecalsRef} /></div>
    </GlobalProvider>
  );
};
