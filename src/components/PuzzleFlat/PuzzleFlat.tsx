"use client";
import { getCroppedImg, imageCrop } from "@/src/libs/utils/ImageCrop";
import Cropper, { type Area, type Point } from "react-easy-crop";
import times from "lodash/times";
import Image from "next/image";
import React, { useEffect, useId, useRef, useState } from "react";
import { usePixiPuzzle } from "./usePixiPuzzle";
import { Assets } from "pixi.js";
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { AngleSlider, Group, Text, Slider } from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import { Checkbox } from '@mantine/core';
import { Modal, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import '@mantine/dropzone/styles.css';
import styles from './PuzzleFlat.module.css';

export const PuzzleFlat = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enableNetGrid, setEnableNetGrid] = useState(false);
  const {addImageToGrid, handleUploadImage, exportCanvas, mapDomToPixiPosition} = usePixiPuzzle({
    containerRef,
    enableNetGrid
  });
  const uniqueId = useId();
  const cropRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState<string>();
  const [opened, {open: openModal, close: closeModal}] = useDisclosure(false);
  const [crop, setCrop] = useState<Point>({x: 0, y: 0});
  const MAX_ZOOM = 5;
  const MIN_ZOOM = 0.5;
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<number>(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>()
  const [croppedImage, setCroppedImage] = useState<string>()

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }
  const showCroppedImage = async () => {
    try {
      if (uploadedImage && croppedAreaPixels) {
        const croppedImage = await getCroppedImg({
          imageSrc: uploadedImage,
          pixelCrop: croppedAreaPixels,
          rotation,
          zoom,
        })
        setCroppedImage(croppedImage)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 示例预制图片
  const addPreset = async (url: string) => {
    const texture = await Assets.load(url);
    addImageToGrid(texture);
  };

  const initCropData = () => {
    closeModal();
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(undefined);
    setCroppedImage(undefined);
    setUploadedImage(undefined);
  }
  const modalCloseHandler = () => {
    initCropData()
  }
  useEffect(() => {
    if (uploadedImage) {
      openModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImage]);

  useEffect(() => {
    if (croppedImage) {
      addPreset(croppedImage).then(() => {
        initCropData()
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [croppedImage]);

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
          <div className={styles.enableGrid}>
            <Checkbox
              checked={enableNetGrid}
              onChange={(event) => setEnableNetGrid(event.currentTarget.checked)}
              label="Grid mode with adsorption function"
            />
          </div>
          <div className={styles.upload}>
            <Dropzone
              onDrop={async (files) => {
                if (files.length > 0) {
                  const imageDataUrl = await imageCrop(files[0]);
                  setUploadedImage(imageDataUrl)
                }
              }}
              onReject={(files) => console.log('rejected files', files)}
              maxSize={5 * 1024 ** 2}
              accept={IMAGE_MIME_TYPE}
            >
              <Group justify="center" gap="xl" mih={220} style={{pointerEvents: 'none'}}>
                <Dropzone.Accept>
                  <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5}/>
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5}/>
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5}/>
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
      <Modal
        classNames={{
          content: styles.modalContent,
        }}
        ref={cropRef}
        opened={opened}
        onClose={modalCloseHandler}
        size={'lg'}
        closeOnClickOutside={false}
        keepMounted={true}
      >
        <div className={styles.cropContainer}>
          <Cropper
            image={uploadedImage}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
          />
        </div>
        <div className={styles.cropControls}>
          <div className={styles.angleSliderContainer}>
            <Text className={styles.angleSliderLabel} size="sm" mb={5}>Rotation</Text>
            <AngleSlider
              className={styles.angleSlider}
              aria-label="Angle slider"
              size={60}
              thumbSize={8}
              formatLabel={(value) => `${value}°`}
              value={rotation}
              marks={[
                {value: 0},
                {value: 45},
                {value: 90},
                {value: 135},
                {value: 180},
                {value: 225},
                {value: 270},
                {value: 315},
              ]}
              onChange={setRotation}
            />
          </div>
          <div className={styles.zoomSliderContainer}>
            <Text className={styles.zoomSliderLabel} size="sm" mb={5}>Zoom</Text>
            <Slider className={styles.zoomSlider} value={zoom} min={MIN_ZOOM} max={MAX_ZOOM} step={0.1}
                    label={(value) => value} onChange={setZoom}/>
          </div>
          <Button className={styles.applyButton} onClick={async () => {
            await showCroppedImage()
          }}>Apply</Button>
        </div>
      </Modal>
    </section>
  );
}
