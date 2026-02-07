# Color Picker — Refactoring & Feature Plan

## Overview

Refactor the monolithic `app/pages/index.vue` (~570 lines) into multiple composables and components, then add:
1. **Region selection** (mouse drag rectangle on canvas)
2. **Auto-pick toggle** (auto-sample 10 evenly-distributed points in selected region)
3. **Region info display** on the right panel
4. **Copy script-format button** to copy find-color script output

---

## New File Structure

```
app/
├── app.vue                          # (unchanged) NuxtPage wrapper
├── pages/
│   └── index.vue                    # Main page — assembles components, slim template
├── composables/
│   ├── useImageLoader.ts            # Image loading, file selection, navigation
│   ├── useColorPicker.ts            # Pixel color reading, saved colors, hover state
│   ├── useMagnifier.ts              # Magnifier canvas drawing logic
│   ├── useRegionSelection.ts        # Rectangle drag selection + auto-pick logic
│   └── useScriptExport.ts           # Generate & copy the find-color script format
├── components/
│   ├── ImageCanvas.vue              # Canvas + crosshair + tooltip + region overlay
│   ├── SavedColorsPanel.vue         # Right panel: saved colors list
│   ├── RegionInfoPanel.vue          # Right panel: region bounds + auto-pick colors
│   ├── ScriptExportButton.vue       # Copy button for script format output
│   └── KeyboardHints.vue            # Keyboard shortcut hints footer
└── types/
    └── index.ts                     # Shared TypeScript interfaces (ColorInfo, Region, etc.)
```

---

## Detailed Changes

### 1. `app/types/index.ts` — Shared Types

```ts
export interface ColorInfo {
  x: number
  y: number
  r: number
  g: number
  b: number
  hex: string  // e.g. "#8684FF"
}

export interface Region {
  x1: number  // top-left
  y1: number
  x2: number  // bottom-right
  y2: number
}
```

---

### 2. `app/composables/useImageLoader.ts`

Extract from current `index.vue`:
- `images`, `filenames`, `currentIndex`, `imageLoaded` refs
- `currentImage` (internal HTMLImageElement)
- `canvasRef` ref
- `drawImageToCanvas()`, `loadCurrentImage()`, `onFilesSelected()`, `prevImage()`, `nextImage()`
- `watch(currentIndex, ...)` and lifecycle logic

Exports: all refs and functions above.

---

### 3. `app/composables/useColorPicker.ts`

Extract from current `index.vue`:
- `savedColors`, `hoverColor`, `showTooltip`, `showCrosshair`, `cursorPos`, `mouseCanvasPos` refs
- `rgbToHex()`, `getPixelColor()`, `cssToImageCoords()`, `imageToCssCoords()`
- `crosshairStyle`, `tooltipStyle` computed properties
- Ctrl+1~0 save logic (part of keyboard handler)

Accepts `canvasRef` and `imageLoaded` as parameters.

---

### 4. `app/composables/useMagnifier.ts`

Extract from current `index.vue`:
- `magnifierRef` ref
- `MAGNIFIER_PIXELS`, `MAGNIFIER_SCALE` constants
- `drawMagnifier()` function

Accepts `canvasRef`, `cursorPos` as parameters.

---

### 5. `app/composables/useRegionSelection.ts` — **NEW**

**State:**
- `region: ref<Region | null>(null)` — current selected region (image coordinates)
- `isSelecting: ref(false)` — whether user is currently dragging
- `selectionStart: ref({ x: 0, y: 0 })` — drag start point
- `autoPickEnabled: ref(false)` — auto-pick toggle
- `autoPickedColors: ref<ColorInfo[]>([])` — the 10 auto-picked colors

**Functions:**
- `onSelectionMouseDown(event)` — record start point, set `isSelecting = true`
- `onSelectionMouseMove(event)` — update region preview (live rectangle)
- `onSelectionMouseUp(event)` — finalize region, if `autoPickEnabled` → call `autoPickColors()`
- `autoPickColors()` — evenly distribute 10 points in the region, read their colors
  - Strategy: divide region into a grid (e.g. 5×2 or approximate sqrt layout), sample center of each cell
  - Store results in `autoPickedColors`
- `clearRegion()` — reset region and auto-picked colors

**Auto-pick algorithm (10 points):**
- Calculate region width `w` and height `h`
- Use a grid layout: `cols = 5, rows = 2` (5×2 = 10 points)
- For each cell `(col, row)`: sample at `(x1 + (col + 0.5) * w/cols, y1 + (row + 0.5) * h/rows)`
- Read pixel color at each point using `getPixelColor()`

---

### 6. `app/composables/useScriptExport.ts` — **NEW**

**Input:** `region`, `autoPickedColors` (or `savedColors` — whichever has colors)

**Output format:**
```
973,
        348,
        1156,
        425,
        "8684FF",
        "33|-5|8785FF,75|-5|8785FF,117|-1|8785FF,54|7|FFFFFF,50|16|FFFFFF,57|16|FFFFFF,107|34|221EF7,53|46|221EF6,3|27|221EF7",
        0,
        0.9,
```

**Logic:**
- Line 1-4: `region.x1`, `region.y1`, `region.x2`, `region.y2`
- Line 5: First color's hex (without `#`), e.g. `"8684FF"`
- Line 6: Remaining colors as `"dx|dy|HEX"` comma-separated, where `dx = color.x - firstColor.x`, `dy = color.y - firstColor.y`
- Line 7: Fixed `0`
- Line 8: Fixed `0.9`

**Function:**
- `generateScriptText()` → returns the formatted string
- `copyScriptToClipboard()` → calls `navigator.clipboard.writeText()`

---

### 7. `app/components/ImageCanvas.vue`

Template contains:
- The `<canvas>` element with gradient border
- Crosshair overlay
- Tooltip with magnifier
- **NEW: Region selection rectangle overlay** (semi-transparent blue rectangle showing the selected area)
- **NEW: Region drag preview** (dashed rectangle while dragging)

Interaction modes:
- **Default mode (no region selection):** mouse move = color picking (existing behavior)
- **Region selection mode:** mouse drag = draw rectangle; single click still picks color
- The mode is determined by whether the user is holding mouse down and dragging

Implementation approach:
- `mousedown` → start potential region selection (record start point)
- `mousemove` while mouse is down → if moved > 3px from start, enter region selection mode, show preview rectangle
- `mouseup` → if was selecting region, finalize it; if was just a click, treat as normal
- When not dragging, `mousemove` still updates hover color/tooltip as before

---

### 8. `app/components/SavedColorsPanel.vue`

Extract the existing right panel saved colors section. Receives `savedColors` as prop.

---

### 9. `app/components/RegionInfoPanel.vue` — **NEW**

Displays on the right panel:
- **Auto-pick toggle switch** (styled toggle button)
- **Region bounds** when a region is selected: `(x1, y1) → (x2, y2)`, width × height
- **Auto-picked colors list** (10 color swatches with hex, position, and relative offset from first point)
- **Clear region button**

---

### 10. `app/components/ScriptExportButton.vue` — **NEW**

- A button "Copy Script Format" 
- Enabled only when region is selected AND at least 1 color is picked (auto-picked or saved)
- On click: generates the script text and copies to clipboard
- Shows a brief "Copied!" feedback

---

### 11. `app/components/KeyboardHints.vue`

Extract the existing keyboard hints footer section.

---

### 12. `app/pages/index.vue` — Refactored Main Page

Slim orchestrator that:
- Calls all composables
- Passes data between composables and components via props/provide
- Handles the global keyboard events
- Assembles the layout: left panel (ImageCanvas) + right panel (SavedColorsPanel + RegionInfoPanel + ScriptExportButton + KeyboardHints)

---

## UI Layout (Right Panel — Updated)

```
┌─────────────────────────┐
│  Saved Colors           │  ← existing, with Ctrl+1~0 slots
│  [1] #8684FF (973,348)  │
│  [2] #FFFFFF (1006,343)  │
│  ...                    │
├─────────────────────────┤
│  Region Selection       │  ← NEW section
│  ┌─ Auto Pick [toggle]─┐│
│  │                      ││
│  │ Region: (973,348) →  ││
│  │         (1156,425)   ││
│  │ Size: 183 × 77      ││
│  │                      ││
│  │ Auto-picked Colors:  ││
│  │ ■ #8684FF (973,348)  ││
│  │ ■ #8785FF (1006,343) ││
│  │ ... (10 colors)      ││
│  │                      ││
│  │ [Clear Region]       ││
│  └──────────────────────┘│
├─────────────────────────┤
│ [📋 Copy Script Format] │  ← NEW button
├─────────────────────────┤
│  Keyboard Hints         │  ← existing
└─────────────────────────┘
```

---

## Implementation Order

1. Create `app/types/index.ts`
2. Create composables: `useImageLoader.ts`, `useColorPicker.ts`, `useMagnifier.ts`
3. Create composables: `useRegionSelection.ts`, `useScriptExport.ts`
4. Create components: `KeyboardHints.vue`, `SavedColorsPanel.vue`
5. Create components: `ImageCanvas.vue` (with region overlay)
6. Create components: `RegionInfoPanel.vue`, `ScriptExportButton.vue`
7. Refactor `app/pages/index.vue` to use all composables and components
8. Test integration and verify all features work together
