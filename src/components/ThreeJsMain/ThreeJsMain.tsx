'use client';

import { GlobalProvider } from "@/src/libs/context/GlobalContext";
import { PreviewDecals } from "./PreviewDecals/PreviewDecals";
import ThreeSceneServer from "./Scene/ThreeSceneServer";
import React, { useMemo, useRef, useState } from 'react';
import styles from "./ThreeJsMain.module.css";

export const ThreeJsMain = () => {
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
      <section className={styles.threeJsMain}>
      <div
        ref={previewDecalsRef}
        className={styles.left} id={'previewDecals'}><PreviewDecals /></div>
      <div className={styles.right}><ThreeSceneServer previewDecalsRef={previewDecalsRef} /></div>
      </section>
    </GlobalProvider>
  );
};
