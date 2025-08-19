"use client";
import times from "lodash/times";
import Image from "next/image";
import React, { useId, useRef } from "react";
import { usePixiPuzzle } from "./usePixiPuzzle";
import { Assets } from "pixi.js";
import { Button } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { Group, Text } from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';

import '@mantine/dropzone/styles.css';
import styles from './PuzzleFlat.module.css';

export const PuzzleFlat = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {addImageToGrid, handleUploadImage, exportCanvas, mapDomToPixiPosition} = usePixiPuzzle({containerRef});
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
            <Dropzone
              onDrop={(files) => {
                if (files.length > 0) {
                  handleUploadImage(files[0])
                }
              }}
              onReject={(files) => console.log('rejected files', files)}
              maxSize={5 * 1024 ** 2}
              accept={IMAGE_MIME_TYPE}
            >
              <Group justify="center" gap="xl" mih={220} style={{pointerEvents: 'none'}}>
                 <Dropzone.Accept>
                <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
              </Dropzone.Idle>
                <div>
                  <Text size="xl" inline>
                    Drag images here or click to select files
                  </Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                    Attach as many files as you like, each file should not exceed 5mb
                  </Text>
                </div>
              </Group>
            </Dropzone>
          </div>
        </div>
        {
          times(54, (i) => {
            const decalPath = '/textures/decal/' + (i + 1) + '.png';
            return <div
              key={`${uniqueId}-${i + 1}`}
              className={styles.decal}
              onClick={() => addPreset(decalPath)}
              draggable
              onDragStart={(e) => {
                // 把路径放到 drag data
                e.dataTransfer.setData("text/plain", decalPath);
                e.dataTransfer.effectAllowed = "copy";
              }}
            >
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
      <div
        className={styles.right}
        ref={containerRef}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={async (e) => {
          e.preventDefault();
          const position = mapDomToPixiPosition(e.clientX, e.clientY);

          // 1. 检查是否是本地文件
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("image/")) {
              await handleUploadImage(file, position); // 已经有的方法
              return;
            }
          }

          // 2. 如果不是文件，就是左侧 decal 的 URL
          const url = e.dataTransfer.getData("text/plain");
          if (url) {
            const texture = await Assets.load(url);
            addImageToGrid(texture, position);
          }
        }}
      />
    </section>
  );
}
