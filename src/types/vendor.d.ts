declare module 'imagetracerjs' {
  export interface ImageTracerOptions {
    corsenabled?: boolean
    ltres?: number
    qtres?: number
    pathomit?: number
    rightangleenhance?: boolean
    colorsampling?: number
    numberofcolors?: number
    mincolorratio?: number
    colorquantcycles?: number
    layering?: number
    strokewidth?: number
    linefilter?: boolean
    scale?: number
    roundcoords?: number
    viewbox?: boolean
    desc?: boolean
    blurradius?: number
    blurdelta?: number
  }

  interface ImageTracer {
    imagedataToSVG(
      imagedata: ImageData,
      options?: ImageTracerOptions | string,
    ): string
  }

  const tracer: ImageTracer
  export default tracer
}

declare module 'potrace-wasm' {
  export function loadFromCanvas(canvas: HTMLCanvasElement): Promise<string>
}
