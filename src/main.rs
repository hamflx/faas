use tiny_skia::{FillRule, Paint, Pixmap, Transform};
use ttf_parser::OutlineBuilder;

fn main() {
    let text = "Hello World";

    let font = include_bytes!("../fonts/VIVO_medium.otf");
    let face_count = ttf_parser::fonts_in_collection(font);
    println!("Font face count: {:?}", face_count);

    let mut path_builder = PathBuilder { paths: Vec::new() };
    let face = ttf_parser::Face::from_slice(font, 0).unwrap();
    let glyphs: Vec<_> = text.chars().filter_map(|ch| face.glyph_index(ch)).collect();
    for glyph in glyphs.into_iter() {
        face.outline_glyph(glyph, &mut path_builder);
    }

    let mut pix_map = Pixmap::new(500, 500).unwrap();
    let skia_paths = convert_paths(&path_builder.paths);
    for path in skia_paths {
        pix_map.fill_path(
            &path,
            &Paint::default(),
            FillRule::default(),
            Transform::default(),
            None,
        );
    }
}

fn convert_paths(paths: &Vec<PathSegment>) -> Option<tiny_skia::Path> {
    let mut pb = tiny_skia::PathBuilder::new();
    for path in paths.iter() {
        match *path {
            PathSegment::MoveTo(x, y) => pb.move_to(x, y),
            PathSegment::LineTo(x, y) => pb.line_to(x, y),
            PathSegment::QuadTo(x1, y1, x2, y2) => pb.quad_to(x1, y1, x2, y2),
            PathSegment::CurveTo(x1, y1, x2, y2, x3, y3) => pb.cubic_to(x1, y1, x2, y2, x3, y3),
            PathSegment::Close => pb.close(),
        }
    }
    pb.finish()
}

struct PathBuilder {
    pub paths: Vec<PathSegment>,
}

impl OutlineBuilder for PathBuilder {
    fn move_to(&mut self, x: f32, y: f32) {
        self.paths.push(PathSegment::MoveTo(x, y));
        println!("move_to {},{}", x, y);
    }

    fn line_to(&mut self, x: f32, y: f32) {
        self.paths.push(PathSegment::LineTo(x, y));
        println!("line_to {},{}", x, y);
    }

    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        self.paths.push(PathSegment::QuadTo(x1, y1, x, y));
        println!("quad_to {},{},{},{}", x1, y1, x, y);
    }

    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        self.paths.push(PathSegment::CurveTo(x1, y1, x2, y2, x, y));
        println!("curve_to {},{},{},{},{},{}", x1, y1, x2, y2, x, y);
    }

    fn close(&mut self) {
        self.paths.push(PathSegment::Close);
        println!("Close");
    }
}

enum PathSegment {
    MoveTo(f32, f32),
    LineTo(f32, f32),
    QuadTo(f32, f32, f32, f32),
    CurveTo(f32, f32, f32, f32, f32, f32),
    Close,
}
