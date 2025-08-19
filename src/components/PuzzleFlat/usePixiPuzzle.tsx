"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { Application, Container, Sprite, Texture, Graphics, Point } from "pixi.js";

type UsePixiPuzzleProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  gridSize?: number;
  gridCount?: number;
};

export function usePixiPuzzle({ containerRef, gridSize = 100, gridCount = 10 }: UsePixiPuzzleProps) {
  const appRef = useRef<Application | null>(null);
  const gridContainerRef = useRef<Container | null>(null);

  /** 拖拽状态 WeakMap */
  const draggingMap = useRef(new WeakMap<Sprite, { dragging: boolean; data?: never }>());

  /** 绘制网格 */
  const drawGrid = (container: Container, size: number, count: number) => {
    const g = new Graphics();
    g.rect(0, 0, count * size, count * size)
      .fill({ color: 0xffffff }); // 白底

    for (let i = 0; i <= count; i++) {
      // 水平线
      g.moveTo(0, i * size);
      g.lineTo(count * size, i * size);
      // 垂直线
      g.moveTo(i * size, 0);
      g.lineTo(i * size, count * size);
    }
    g.stroke({ color: 0xdddddd, width: 1, alpha: 1 });
    container.addChild(g);
  };

  /** 根据容器缩放 */
  const resizeGrid = useCallback(() => {
    if (!containerRef.current || !gridContainerRef.current) return;

    const { clientWidth, clientHeight } = containerRef.current;

    // 网格逻辑大小（固定逻辑尺寸，不变）
    const baseSize = gridCount * gridSize;

    // 计算缩放比例（取最小值保证完全显示）
    const scale = Math.min(clientWidth / baseSize, clientHeight / baseSize);

    gridContainerRef.current.scale.set(scale);

    // 居中对齐
    gridContainerRef.current.x = (clientWidth - baseSize * scale) / 2;
    gridContainerRef.current.y = (clientHeight - baseSize * scale) / 2;
  }, [containerRef, gridSize, gridCount]);

  /** 初始化 Pixi App */
  const initPixi = useCallback(async () => {
    if (!containerRef.current) return;

    const app = new Application();
    await app.init({
      background: "#ffffff",
      resizeTo: containerRef.current!,
      antialias: true,
    });

    containerRef.current.appendChild(app.canvas);
    appRef.current = app;

    const gridContainer = new Container();
    app.stage.addChild(gridContainer);
    gridContainerRef.current = gridContainer;

    drawGrid(gridContainer, gridSize, gridCount);
    resizeGrid();

    // 监听窗口变化
    window.addEventListener("resize", resizeGrid);
  }, [containerRef, gridSize, gridCount, resizeGrid]);

  /** 吸附到网格 */
  const snapToGrid = (sprite: Sprite) => {
    const baseSize = gridSize * gridCount;

    let x = Math.round(sprite.x / gridSize) * gridSize;
    let y = Math.round(sprite.y / gridSize) * gridSize;

    // 限制不能超出网格边界
    x = Math.max(0, Math.min(x, baseSize - gridSize));
    y = Math.max(0, Math.min(y, baseSize - gridSize));

    sprite.x = x;
    sprite.y = y;
  };

  /** 将图片加入网格 */
  const addImageToGrid = useCallback(
    (texture: Texture, position?: {x: number, y: number}) => {
      if (!gridContainerRef.current) return;

      const sprite = new Sprite(texture);
      sprite.width = gridSize;
      sprite.height = gridSize;
      sprite.interactive = true;
      sprite.cursor = "pointer";

      // ✅ 如果是拖拽放置：先让“鼠标指向大致是图片中心”
      if (position) {
        sprite.x = position.x - sprite.width / 2;
        sprite.y = position.y - sprite.height / 2;
      } else {
        sprite.x = 0;
        sprite.y = 0;
      }

      snapToGrid(sprite);
      /** 拖拽事件 */
      sprite.on("pointerdown", (e) => {
        // 重新 addChild，会把它放到最顶层
        sprite?.parent?.addChild(sprite);
        // @ts-expect-error exist
        draggingMap.current.set(sprite, { dragging: true, data: e.data });
      });
      sprite.on("pointerup", () => {
        const state = draggingMap.current.get(sprite);
        if (state) {
          state.dragging = false;
          snapToGrid(sprite);
        }
      });
      sprite.on("pointerupoutside", () => {
        const state = draggingMap.current.get(sprite);
        if (state) {
          state.dragging = false;
          snapToGrid(sprite);
        }
      });
      sprite.on("pointermove", () => {
        const state = draggingMap.current.get(sprite);
        if (state?.dragging && state.data) {
          // @ts-expect-error exist
          const newPos = state.data.getLocalPosition(sprite.parent);
          sprite.x = newPos.x - sprite.width / 2;
          sprite.y = newPos.y - sprite.height / 2;
        }
      });

      gridContainerRef.current.addChild(sprite);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gridSize]
  );

  /** 上传图片并裁剪为正方形 */
  const handleUploadImage = useCallback(
    async (file: File, position?: {x:number, y:number}) => {
      const bitmap = await createImageBitmap(file);
      const size = Math.min(bitmap.width, bitmap.height);

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      //
      ctx.drawImage(bitmap, 0, 0, size, size, 0, 0, size, size);

      const texture = Texture.from(canvas);
      addImageToGrid(texture, position);
    },
    [addImageToGrid]
  );

  const mapDomToPixiPosition = (clientX: number, clientY: number) => {
    if (!appRef.current || !gridContainerRef.current) return { x: 0, y: 0 };

    // 1) DOM 坐标 -> PIXI 全局坐标（注意：这里需要的是 clientX / clientY，**不要**再减 rect）
    const global = new Point();
    appRef.current.renderer.events.mapPositionToPoint(global, clientX, clientY);

    // 2) PIXI 全局坐标 -> 网格容器的本地坐标（自动包含了网格容器的 scale + x/y 偏移）
    const local = gridContainerRef.current.toLocal(global);

    return { x: local.x, y: local.y };
  };
  /** 导出画布 */
  const exportCanvas = useCallback(() => {
    if (!appRef.current) return null;
    const canvas = appRef.current.renderer?.extract.canvas(appRef.current.stage);
    // @ts-expect-error exist
    return canvas?.toDataURL("image/png");
  }, []);

  useEffect(() => {
    initPixi();
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      window.removeEventListener("resize", resizeGrid);
    };
  }, [initPixi, resizeGrid]);

  return { addImageToGrid, handleUploadImage, exportCanvas, mapDomToPixiPosition };
}
