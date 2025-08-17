"use client";
import times from "lodash/times";
import Image from "next/image";
import React, { useId, useRef } from "react";
import { usePixiPuzzle } from "./usePixiPuzzle";
import { Assets, Texture } from "pixi.js";
import { Button } from '@mantine/core';
import styles from './PuzzleFlat.module.css';

export const PuzzleFlat = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {addImageToGrid, handleUploadImage, exportCanvas} = usePixiPuzzle({containerRef});
  const uniqueId = useId();

  // 示例预制图片
  const addPreset = async (url: string) => {
    const texture = await Assets.load(url);
    addImageToGrid(texture);
  };

  return (
    <section className={styles.PuzzleFlat}>
      <div className={styles.left}>
        <div className={styles.controlsPanel}>
        <div className={styles.exportCanvas}>
          <Button variant="filled"
                  className={styles.exportCanvasButton}
                  onClick={() => {
                    const dataUrl = exportCanvas();
                    if (dataUrl) {
                      const link = document.createElement("a");
                      link.href = dataUrl;
                      link.download = "puzzle.png";
                      link.click();
                    }
                  }}
          >Export Canvas Content</Button>
        </div>
        <div className={styles.upload}>
          <label htmlFor="fileUpload" className={styles.fileInputLabel}>
            + Upload Your Own Image
          </label>
          <input
            id="fileUpload"
            className={styles.fileInput}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) handleUploadImage(e.target.files[0]);
            }}
          />
        </div>
        </div>
        {
          times(54, (i) => {
            const decalPath = '/textures/decal/' + (i + 1) + '.png';
            return <div key={`${uniqueId}-${i + 1}`} className={styles.decal} onClick={() => addPreset(decalPath)}>
              <Image
                src={decalPath}
                alt={`Decal ${i}`}
                width={100}
                height={100}
                key={i}
              /></div>
          })
        }
      </div>
      <div className={styles.right} ref={containerRef}></div>
    </section>
  );
}
