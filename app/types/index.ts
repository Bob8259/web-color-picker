export interface ColorInfo {
  x: number
  y: number
  r: number
  g: number
  b: number
  hex: string // RGB hex, e.g. "#RRGGBB"
  bgrHex: string // BGR hex for OpenCV, e.g. "#BBGGRR"
}

export interface Region {
  x1: number // top-left
  y1: number
  x2: number // bottom-right
  y2: number
}
