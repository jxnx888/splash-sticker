declare module "three/examples/jsm/loaders/STLLoader" {
  import { BufferGeometry, LoadingManager } from "three";
  import { Loader } from "three";

  export class STLLoader extends Loader {
    constructor(manager?: LoadingManager);

    load(
      url: string,
      onLoad: (geometry: BufferGeometry) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent) => void
    ): void;

    parse(data: ArrayBuffer | string): BufferGeometry;
  }
}
