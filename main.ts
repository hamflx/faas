import * as path from "https://deno.land/std@0.137.0/path/mod.ts"
import { Application, Router } from "https://deno.land/x/oak@v10.5.1/mod.ts"
import init, { text_to_png } from "./pkg/render_font.js"
import { helpers } from "https://deno.land/x/oak@v10.5.1/mod.ts"

const { getQuery } = helpers

const router = new Router()
const fontMap: Map<string, Uint8Array> = new Map()

router.get("/:font/:size/:text", (ctx) => {
  const { font, text = '', size } = ctx.params
  const { color = 'red' } = getQuery(ctx)

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

  ctx.response.type = "image/png"
  ctx.response.body = text_to_png(fontData, text, color)
})

init()
initializeFonts()

const app = new Application()

app.use(router.routes())
app.use(router.allowedMethods())

app.addEventListener(
  "listen",
  () => console.log("Listening on http://localhost:8091"),
)
await app.listen({ port: 8091 })

async function initializeFonts() {
  for await (const entry of Deno.readDir('./fonts')) {
    const fontFamily = removeFilenameExt(path.basename(entry.name))
    const fontPath = path.resolve('./fonts', entry.name)
    console.log(`==> loading font ${fontFamily}:${fontPath}`)
    fontMap.set(fontFamily, await Deno.readFile(fontPath))
  }
}

function removeFilenameExt(filename: string): string {
  const indexOfDot = filename.lastIndexOf('.')
  if (indexOfDot >= 0) {
    return filename.slice(0, indexOfDot)
  }
  return filename
}
