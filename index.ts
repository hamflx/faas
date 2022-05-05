import * as path from "https://deno.land/std@0.137.0/path/mod.ts"
import { Application, Router } from "https://deno.land/x/oak@v10.5.1/mod.ts"
import CanvasKit, { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts"

const router = new Router()

const fontMap: Map<string, Uint8Array> = new Map()

router.get("/:font/:size/:text", (ctx) => {
  const { font, text = '', size } = ctx.params
  const sizeInPx = parseInt(size, 10)
  if (isNaN(sizeInPx) || sizeInPx > 1024 || sizeInPx < 0) {
    ctx.response.status = 400
    return
  }

  const fontData = fontMap.get(font)
  if (!fontData) {
    ctx.response.status = 400
    return
  }

  const tmpCanvas = createCanvas(1, 1)
  tmpCanvas.loadFont(fontData, { family: font })

  const tmpCtx = tmpCanvas.getContext("2d")
  tmpCtx.font = `${sizeInPx}px ${font}`
  const metrics = measureText(text, { fontData, fontSize: sizeInPx })

  const width = Math.ceil(metrics.width)
  const height = Math.ceil(metrics.height)
  const canvas = createCanvas(width, height)
  canvas.loadFont(fontData, { family: font })
  
  const fontCtx = canvas.getContext("2d")
  fontCtx.font = `${sizeInPx}px ${font}`
  fontCtx.fillText(text, 0, metrics.ascent)

  ctx.response.type = "image/png"
  ctx.response.body = canvas.toBuffer("image/png")
})

initializeFonts()

const app = new Application()

app.use(router.routes())
app.use(router.allowedMethods())

app.addEventListener(
  "listen",
  () => console.log("Listening on http://localhost:8091"),
)
await app.listen({ port: 8091 })

function initializeFonts() {
  for (const entry of Deno.readDirSync('./fonts')) {
    const fontFamily = removeFilenameExt(path.basename(entry.name))
    const fontPath = path.resolve('./fonts', entry.name)
    console.log(`==> loading font ${fontFamily}:${fontPath}`)
    fontMap.set(fontFamily, Deno.readFileSync(fontPath))
  }
}

function removeFilenameExt(filename: string): string {
  const indexOfDot = filename.lastIndexOf('.')
  if (indexOfDot >= 0) {
    return filename.slice(0, indexOfDot)
  }
  return filename
}

function measureText(text: string, fontInfo: { fontData: Uint8Array, fontSize: number }) {
  // I assume I can find fontInfo somewhere else inside the context class
  const { fontData, fontSize } = fontInfo
  const fontMgr = CanvasKit.FontMgr.FromData(fontData)
  if (fontMgr === null)  throw new Error('idk why but fontMgr is null')
  const paraStyle = new CanvasKit.ParagraphStyle({
    textStyle: {
      color: CanvasKit.BLACK,
      fontFamilies: [fontMgr.getFamilyName(0)],
      fontSize,
    },
  })
  const builder = CanvasKit.ParagraphBuilder.Make(paraStyle, fontMgr)
  builder.addText(text)
  const paragraph = builder.build()
  paragraph.layout(Infinity)
  const left = Math.max(...paragraph.getLineMetrics().map(l => l.left))
  const right = paragraph.getLongestLine() + left
  const ascent = Math.max(...paragraph.getLineMetrics().map(l => l.ascent))
  const descent = Math.max(...paragraph.getLineMetrics().map(l => l.descent))
  const height = ascent + descent
  const width = right
  const metrics = { ascent, descent, left, right, width, height }
  paragraph.delete()
  fontMgr.delete()
  return metrics
}
