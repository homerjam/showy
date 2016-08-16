var transitions = {
  none: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        gl_FragColor = texture2D(to, p);
      }
    `,
    uniforms: {},
  },
  crossfade: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        gl_FragColor = mix(texture2D(from, p), texture2D(to, p), progress);
      }
    `,
    uniforms: {},
  },
  wipeUp: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        vec4 a = texture2D(from, p);
        vec4 b = texture2D(to, p);
        gl_FragColor = mix(a, b, step(0.0 + p.y, progress));
      }
    `,
    uniforms: {},
  },
  wipeDown: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        vec4 a = texture2D(from, p);
        vec4 b = texture2D(to, p);
        gl_FragColor = mix(a, b, step(1.0 - p.y, progress));
      }
    `,
    uniforms: {},
  },
  wipeRight: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        vec4 a = texture2D(from, p);
        vec4 b = texture2D(to, p);
        gl_FragColor = mix(a, b, step(0.0 + p.x, progress));
      }
    `,
    uniforms: {},
  },
  wipeLeft: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        vec4 a = texture2D(from, p);
        vec4 b = texture2D(to, p);
        gl_FragColor = mix(a, b, step(1.0 - p.x, progress));
      }
    `,
    uniforms: {},
  },
  circle: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif

      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float centerX;
      uniform float centerY;
      uniform float smoothness;
      uniform bool grow;

      vec2 center = vec2(centerX, 1.0 - centerY);
      float scale = sqrt(min(resolution[0] / resolution[1], resolution[1] / resolution[0]) / max(centerX, 1.0 - centerY));

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        float size = grow ? progress : 1.0 - progress;
        float dist = distance(center, p);
        float circle = smoothstep(-smoothness, 0.0, scale * dist - size * (1.0 + smoothness));
        gl_FragColor = mix(texture2D(from, p), texture2D(to, p), grow ? 1.0 - circle : circle);
      }
    `,
    uniforms: {
      centerX: 0.5,
      centerY: 0.5,
      smoothness: 0,
      grow: true,
    },
  },
  circleInOut: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      float maxRadius = resolution.x + resolution.y;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;

        float distX = gl_FragCoord.x - resolution.x / 2.0;
        float distY = gl_FragCoord.y - resolution.y / 2.0;
        float dist = sqrt(distX * distX + distY * distY);

        float step = 2.0 * abs(progress - 0.5);
        step = step * step * step;

        if (dist < step * maxRadius)
        {
          if (progress < 0.5)
            gl_FragColor = texture2D(from, p);
          else
            gl_FragColor = texture2D(to, p);
        }
        else
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    `,
    uniforms: {},
  },
  splitVertical: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif

      // General parameters
      uniform sampler2D from;
      uniform sampler2D to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float reflection;
      uniform float perspective;
      uniform float depth;

      const vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
      const vec2 boundMin = vec2(0.0, 0.0);
      const vec2 boundMax = vec2(1.0, 1.0);

      bool inBounds (vec2 p) {
        return all(lessThan(boundMin, p)) && all(lessThan(p, boundMax));
      }

      vec2 project (vec2 p) {
        return p * vec2(1.0, -1.2) + vec2(0.0, -0.02);
      }

      vec4 bgColor (vec2 p, vec2 pto) {
        vec4 c = black;
        pto = project(pto);
        if (inBounds(pto)) {
          c += mix(black, texture2D(to, pto), reflection * mix(1.0, 0.0, pto.y));
        }
        return c;
      }

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;

        vec2 pfr = vec2(-1.), pto = vec2(-1.);

        float middleSlit = 2.0 * abs(p.x-0.5) - progress;
        if (middleSlit > 0.0) {
          pfr = p + (p.x > 0.5 ? -1.0 : 1.0) * vec2(0.5*progress, 0.0);
          float d = 1.0/(1.0+perspective*progress*(1.0-middleSlit));
          pfr.y -= d/2.;
          pfr.y *= d;
          pfr.y += d/2.;
        }

        float size = mix(1.0, depth, 1.-progress);
        pto = (p + vec2(-0.5, -0.5)) * vec2(size, size) + vec2(0.5, 0.5);

        if (inBounds(pfr)) {
          gl_FragColor = texture2D(from, pfr);
        }
        else if (inBounds(pto)) {
          gl_FragColor = texture2D(to, pto);
        }
        else {
          gl_FragColor = bgColor(p, pto);
        }
      }
    `,
    uniforms: {
      reflection: 0,
      perspective: 0,
      depth: 1,
    },
  },
  slideUp: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float translateX;
      uniform float translateY;

      void main() {
          vec2 texCoord = gl_FragCoord.xy / resolution.xy;
          float x = progress * translateX;
          float y = progress * translateY;

          if (x >= 0.0 && y >= 0.0) {
              if (texCoord.x >= x && texCoord.y >= y) {
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              }
              else {
                  vec2 uv;
                  if (x > 0.0)
                      uv = vec2(x - 1.0, y);
                  else if (y > 0.0)
                      uv = vec2(x, y - 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else if (x <= 0.0 && y <= 0.0) {
              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              else {
                  vec2 uv;
                  if (x < 0.0)
                      uv = vec2(x + 1.0, y);
                  else if (y < 0.0)
                      uv = vec2(x, y + 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else
              gl_FragColor = vec4(0.0);
      }
    `,
    uniforms: {
      translateX: 0,
      translateY: 1,
    },
  },
  slideDown: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float translateX;
      uniform float translateY;

      void main() {
          vec2 texCoord = gl_FragCoord.xy / resolution.xy;
          float x = progress * translateX;
          float y = progress * translateY;

          if (x >= 0.0 && y >= 0.0) {
              if (texCoord.x >= x && texCoord.y >= y) {
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              }
              else {
                  vec2 uv;
                  if (x > 0.0)
                      uv = vec2(x - 1.0, y);
                  else if (y > 0.0)
                      uv = vec2(x, y - 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else if (x <= 0.0 && y <= 0.0) {
              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              else {
                  vec2 uv;
                  if (x < 0.0)
                      uv = vec2(x + 1.0, y);
                  else if (y < 0.0)
                      uv = vec2(x, y + 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else
              gl_FragColor = vec4(0.0);
      }
    `,
    uniforms: {
      translateX: 0,
      translateY: -1,
    },
  },
  slideLeft: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float translateX;
      uniform float translateY;

      void main() {
          vec2 texCoord = gl_FragCoord.xy / resolution.xy;
          float x = progress * translateX;
          float y = progress * translateY;

          if (x >= 0.0 && y >= 0.0) {
              if (texCoord.x >= x && texCoord.y >= y) {
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              }
              else {
                  vec2 uv;
                  if (x > 0.0)
                      uv = vec2(x - 1.0, y);
                  else if (y > 0.0)
                      uv = vec2(x, y - 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else if (x <= 0.0 && y <= 0.0) {
              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              else {
                  vec2 uv;
                  if (x < 0.0)
                      uv = vec2(x + 1.0, y);
                  else if (y < 0.0)
                      uv = vec2(x, y + 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else
              gl_FragColor = vec4(0.0);
      }
    `,
    uniforms: {
      translateX: 1,
      translateY: 0,
    },
  },
  slideRight: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float translateX;
      uniform float translateY;

      void main() {
          vec2 texCoord = gl_FragCoord.xy / resolution.xy;
          float x = progress * translateX;
          float y = progress * translateY;

          if (x >= 0.0 && y >= 0.0) {
              if (texCoord.x >= x && texCoord.y >= y) {
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              }
              else {
                  vec2 uv;
                  if (x > 0.0)
                      uv = vec2(x - 1.0, y);
                  else if (y > 0.0)
                      uv = vec2(x, y - 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else if (x <= 0.0 && y <= 0.0) {
              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              else {
                  vec2 uv;
                  if (x < 0.0)
                      uv = vec2(x + 1.0, y);
                  else if (y < 0.0)
                      uv = vec2(x, y + 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else
              gl_FragColor = vec4(0.0);
      }
    `,
    uniforms: {
      translateX: -1,
      translateY: 0,
    },
  },
};

module.exports = transitions;
