import type { Area } from "react-easy-crop";

export function imageCrop(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string), false);
    reader.addEventListener('error', () => reject(reader.error), false);
    reader.readAsDataURL(file);
  });
}

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

export async function getCroppedImg(
  {imageSrc, pixelCrop, rotation, zoom, flip}: {
    imageSrc: string,
    pixelCrop: Area,
    rotation: number,
    zoom?: number,
    flip?: { horizontal: false, vertical: false }
  }
): Promise<string> {
  const image: HTMLImageElement = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return ''
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const {width: bBoxWidth, height: bBoxHeight} = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  if (flip) {
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  }
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw rotated image
  ctx.drawImage(image, 0, 0)

  const croppedCanvas = document.createElement('canvas')

  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    return ''
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height

  let sx = pixelCrop.x;
  let sy = pixelCrop.y;
  let sw = pixelCrop.width;
  let sh = pixelCrop.height;
  if (zoom && zoom < 1) {
    sx = pixelCrop.x / zoom;
    sy = pixelCrop.y / zoom;
    sw = pixelCrop.width / zoom;
    sh = pixelCrop.height / zoom;
  }

  // Draw the cropped image onto the new canvas
  // image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number
  croppedCtx.drawImage(
    canvas,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // As Base64 string
  return croppedCanvas.toDataURL('image/png');
}
