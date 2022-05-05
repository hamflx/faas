extern crate wasm_bindgen;

use text_to_png::{Color, TextRenderer};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn text_to_png(font: Vec<u8>, text: String, color: String) -> Vec<u8> {
    let renderer = TextRenderer::try_new_with_ttf_font_data(font).unwrap();
    let color: Color = if color.starts_with("#") {
        let rr = &color[1..3];
        let gg = &color[3..5];
        let bb = &color[5..7];
        Color::new(
            u8::from_str_radix(rr, 16).unwrap(),
            u8::from_str_radix(gg, 16).unwrap(),
            u8::from_str_radix(bb, 16).unwrap(),
        )
    } else {
        color.as_str().try_into().unwrap()
    };
    let text_png = renderer.render_text_to_png_data(text, 64, color).unwrap();
    text_png.data
}
