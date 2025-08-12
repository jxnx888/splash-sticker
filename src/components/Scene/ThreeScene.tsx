"use client"; // App Router 用，Pages Router 可以去掉

import { useGlobalContext } from "@/src/libs/context/GlobalContext";
import { RefObject, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import styles from './Scene.module.css'

export type ThreeSceneServerProps = {
  previewDecalsRef?: RefObject<HTMLDivElement | null>;
}

export default function ThreeScene({previewDecalsRef}: ThreeSceneServerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const {currentDecal} = useGlobalContext();
  // refs 保存实例
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseHelperRef = useRef<THREE.Mesh | null>(null);
  const decalsRef = useRef<THREE.Mesh[]>([]);
  const lineRef = useRef<THREE.Line | null>(null);
  const shotDecalsRef = useRef<Array<THREE.Mesh | null>>(null);
  const movedRef = useRef<boolean>(false);

  const intersectionRef = useRef({
    intersects: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3(),
  });

  const paramsRef = useRef({
    scale: 10,
    rotate: true,
    rotation: Math.PI /180, // positive is counter-clockwise   Math.PI = 3.14 = 180°
    clear: () => {
      decalsRef.current.forEach((d) => meshRef.current?.remove(d));
      decalsRef.current.length = 0;
    },
  });
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const decalMaterialRef = useRef<THREE.MeshPhongMaterial | null>(null);

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const decalDiffuse = textureLoader.load(currentDecal);
    decalDiffuse.colorSpace = THREE.SRGBColorSpace;
    const decalNormal = textureLoader.load(currentDecal);
    console.log("currentDecal", currentDecal);
    decalMaterialRef.current = new THREE.MeshPhongMaterial({
      specular: 0x444444,
      map: decalDiffuse,
      normalMap: decalNormal,
      normalScale: new THREE.Vector2(1, 1),
      shininess: 30,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      wireframe: false,
    })
  }, [currentDecal]);

  useEffect(() => {
    if (!mountRef.current) return;

    // 清除旧 canvas
    const existingCanvas = mountRef.current.querySelector("canvas");
    if (existingCanvas) {
      existingCanvas.remove();
      mountRef.current.innerHTML = '';
      console.log("remove existing canvas");
    }

    initScene();
    return () => {
      disposeScene();
    };
  }, []);

  function initScene() {
    const mount = mountRef.current!;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setAnimationLoop(animate);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.name = "scene";
    scene.background = new THREE.Color(0xcce0ff);
    scene.fog = new THREE.Fog(0xcce0ff, 50, 1000);
    sceneRef.current = scene;

    // Ground
    const loaderText = new THREE.TextureLoader();
    const groundTexture = loaderText.load("/textures/decal/grasslight-big.jpg");
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(25, 25);
    groundTexture.colorSpace = THREE.SRGBColorSpace;
    const groundMaterial = new THREE.MeshLambertMaterial({map: groundTexture});
    const meshGround = new THREE.Mesh(
      new THREE.PlaneGeometry(6000, 6000),
      groundMaterial
    );
    meshGround.position.y = -50;
    meshGround.rotation.x = -Math.PI / 2;
    meshGround.receiveShadow = true;
    meshGround.name = "meshGround";
    scene.add(meshGround);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = 120;
    cameraRef.current = camera;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.enablePan = false;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x666666);
    ambientLight.name = 'ambientLight'
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xffddcc, 3);
    dirLight1.position.set(1, 0.75, 0.5);
    dirLight1.name = 'dirLight1'
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xccccff, 3);
    dirLight2.position.set(-1, 0.75, -0.5);
    dirLight2.name = 'dirLight2'
    scene.add(dirLight2);

    // Raycaster
    raycasterRef.current = new THREE.Raycaster();

    // Mouse Helper
    // Red line
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xFF0000,
      linewidth: 100,
      linecap: 'round',
      linejoin: 'round'
    });
    const line = new THREE.Line(geometry, lineMaterial);
    line.name = 'redLine'
    scene.add(line);
    lineRef.current = line;

    const mouseHelper = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 10),
      new THREE.MeshNormalMaterial()
    );
    mouseHelper.visible = false;
    mouseHelper.name = 'mouseHelper';
    mouseHelperRef.current = mouseHelper;
    scene.add(mouseHelper);


    // Events
    window.addEventListener("resize", onWindowResize);
    controls.addEventListener("change", () => (movedRef.current = true));
    window.addEventListener("pointerdown", () => (movedRef.current = false));
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    // GUI
    initGUI();

    // Load model
    loadModelSTL();
  }

  const initGUI = () => {
    const gui = new GUI();
    gui.add(paramsRef.current, "scale", 1, 30).name("Scale");
    gui.add(paramsRef.current, "rotate").name("Rotate");
    gui.add(paramsRef.current, "rotation",  -180, 180).name("Rotate");
    gui.add({ clear: () => clearDecals() }, "clear");
    gui.open();
    gui.domElement.classList.add(styles.gui);
    mountRef.current!.appendChild(gui.domElement);
  };

  function loadModelSTL() {
    const loader = new STLLoader();
    const luggage = {
      name: "luggage",
      url: "/models/stl/luggage.stl",
      scale: 1,
      rotation : [1.6, 0, -0.2],
      position: [0, 0, 0]
    };
    const bag = {
      name: "bag",
      url: "/models/stl/bag.stl",
      scale: 110,
      rotation : [-Math.PI / 2, 0, 0],
      position: [0, -30, 0]
    }
    const cartonSmall = {
      name: "cartonSmall",
      url: "/models/stl/cartonSmall.stl",
      scale: 150,
      rotation : [-Math.PI / 2, 0, 0],
      position: [0, -30, 0]
    }
    const file = bag; // or cartonSmall

    loader.load(file.url, (geometry) => {
        const material = new THREE.MeshPhongMaterial({color: 0xffffff});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(file.position[0], file.position[1], file.position[2]);
        mesh.rotation.set(file.rotation[0], file.rotation[1], file.rotation[2]);
        mesh.scale.set(file.scale, file.scale, file.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = file.name;
        sceneRef.current?.add(mesh);
        meshRef.current = mesh;

        // 加载 shot decalMap
        if (shotDecalsRef?.current && shotDecalsRef?.current?.length > 0) {
          shotDecalsRef.current.forEach((d) => {
            if (d) sceneRef.current?.add(d)
          });
        }

        // decal helper
        const currentScale = paramsRef.current.scale;
        const currentSize = new THREE.Vector3(
          currentScale,
          currentScale,
          currentScale
        );
        const currentMaterial1 = decalMaterialRef.current!.clone();

        const position = new THREE.Vector3();
        const orientation = new THREE.Euler();

        sceneRef.current!.remove(mouseHelperRef.current!);
        mouseHelperRef.current = new THREE.Mesh(
          new DecalGeometry(mesh, position, orientation, currentSize),
          currentMaterial1
        );
        mouseHelperRef.current.name = "mouseHelper";
        sceneRef.current!.add(mouseHelperRef.current);
      }, (xhr) => {
        setLoadingProgress((xhr.loaded / xhr.total) * 100);
      },
      (err) => {
        console.error("An error happened:", err);
      });
  }

  function clearDecals() {
    const mesh = meshRef.current;
    if (!mesh) return;
    decalsRef.current.forEach((d) => mesh.remove(d));
    decalsRef.current.length = 0;
  }

  function checkIntersection(x: number, y: number) {
    const mesh = meshRef.current;
    const camera = cameraRef.current;
    const raycaster = raycasterRef.current;
    const mouseHelper = mouseHelperRef.current;
    const line = lineRef.current;
    if (!mesh || !camera || !raycaster || !mouseHelper || !line) return;

    const width = mountRef.current!.clientWidth;
    const height = mountRef.current!.clientHeight;
    const leftDecalWidth = previewDecalsRef?.current?.clientWidth || 0;

    mouseRef.current.x = (x / (width + leftDecalWidth)) * 2 - 1;
    mouseRef.current.y = -(y / height) * 2 + 1 + 0.12;

    raycaster.setFromCamera(mouseRef.current, camera);
    const intersects = raycaster.intersectObject(mesh, false);
    if (intersects.length > 0) {
      const p = intersects[0].point;
      mouseHelper.position.copy(p);
      intersectionRef.current.point.copy(p);

      const normalMatrix = new THREE.Matrix3().getNormalMatrix(
        mesh.matrixWorld
      );
      const n = intersects[0].face!.normal.clone();
      n.applyNormalMatrix(normalMatrix);
      n.multiplyScalar(10);
      n.add(intersects[0].point);

      intersectionRef.current.normal.copy(intersects[0].face!.normal);
      mouseHelper.lookAt(n);

      const positions = line.geometry.attributes.position as THREE.BufferAttribute;
      positions.setXYZ(0, p.x, p.y, p.z);
      positions.setXYZ(1, n.x, n.y, n.z);
      positions.needsUpdate = true;

      intersectionRef.current.intersects = true;
    } else {
      intersectionRef.current.intersects = false;
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (event.isPrimary) {
      checkIntersection(event.clientX, event.clientY);
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (!movedRef.current) {
      checkIntersection(event.clientX, event.clientY);
      if (intersectionRef.current.intersects) shoot();
    }
  }

  function shoot() {
    const mesh = meshRef.current;
    const intersection = intersectionRef.current;
    if (!mesh) return;

    const position = intersection.point.clone();
    const orientation = mouseHelperRef.current!.rotation.clone();
    if(paramsRef.current.rotate){
      orientation.z= paramsRef.current.rotation / 60;
    }
    const scale = paramsRef.current.scale;
    const size = new THREE.Vector3(scale, scale, scale);
    const material = decalMaterialRef.current!.clone();
    // material.color.setHex(Math.random() * 0xffffff);

    const m = new THREE.Mesh(
      new DecalGeometry(mesh, position, orientation, size),
      material
    );
    m.renderOrder = decalsRef.current.length;
    decalsRef.current.push(m);
    mesh.attach(m);
  }

  function onWindowResize() {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!camera || !renderer || !mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function disposeScene() {
    window.removeEventListener("resize", onWindowResize);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (
        mountRef.current &&
        rendererRef.current.domElement.parentNode
      ) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    rendererRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    meshRef.current = null;
    raycasterRef.current = null;
    mouseHelperRef.current = null;
    decalsRef.current = [];
    lineRef.current = null;
  }

  return (
    <div
      ref={mountRef}
      className={styles.canvasWrapper}
    />
  );
}
