const transitions = {
  none: {
    name: 'none',
    paramsTypes: {},
    defaultParams: {},
    glsl: 'vec4 transition(vec2 p) {\n return getToColor(p);\n }',
  },

  // bounce: {
  //   name: 'Bounce',
  //   paramsTypes: {
  //     shadow_colour: 'vec4',
  //     shadow_height: 'float',
  //     bounces: 'float',
  //   },
  //   defaultParams: {
  //     shadow_colour: [0, 0, 0, 0.6],
  //     shadow_height: 0.075,
  //     bounces: 3,
  //   },
  //   glsl: '// Author: Adrian Purser\n// License: MIT\n\nuniform vec4 shadow_colour; // = vec4(0.,0.,0.,.6)\nuniform float shadow_height; // = 0.075\nuniform float bounces; // = 3.0\n\nconst float PI = 3.14159265358;\n\nvec4 transition (vec2 uv) {\n  float time = progress;\n  float stime = sin(time * PI / 2.);\n  float phase = time * PI * bounces;\n  float y = (abs(cos(phase))) * (1.0 - stime);\n  float d = uv.y - y;\n  return mix(\n    mix(\n      getToColor(uv),\n      shadow_colour,\n      step(d, shadow_height) * (1. - mix(\n        ((d / shadow_height) * shadow_colour.a) + (1.0 - shadow_colour.a),\n        1.0,\n        smoothstep(0.95, 1., progress) // fade-out the shadow at the end\n      ))\n    ),\n    getFromColor(vec2(uv.x, uv.y + (1.0 - y))),\n    step(d, 0.0)\n  );\n}\n',
  //   author: 'Adrian Purser',
  //   license: 'MIT',
  //   createdAt: 'Fri, 10 Nov 2017 17:01:45 +0000',
  //   updatedAt: 'Sat, 11 Nov 2017 08:50:40 +0100',
  // },
  // bowTieHorizontal: {
  //   name: 'BowTieHorizontal',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: huynx\n// License: MIT\n\nvec2 bottom_left = vec2(0.0, 1.0);\nvec2 bottom_right = vec2(1.0, 1.0);\nvec2 top_left = vec2(0.0, 0.0);\nvec2 top_right = vec2(1.0, 0.0);\nvec2 center = vec2(0.5, 0.5);\n\nfloat check(vec2 p1, vec2 p2, vec2 p3)\n{\n  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);\n}\n\nbool PointInTriangle (vec2 pt, vec2 p1, vec2 p2, vec2 p3)\n{\n    bool b1, b2, b3;\n    b1 = check(pt, p1, p2) < 0.0;\n    b2 = check(pt, p2, p3) < 0.0;\n    b3 = check(pt, p3, p1) < 0.0;\n    return ((b1 == b2) && (b2 == b3));\n}\n\nbool in_left_triangle(vec2 p){\n  vec2 vertex1, vertex2, vertex3;\n  vertex1 = vec2(progress, 0.5);\n  vertex2 = vec2(0.0, 0.5-progress);\n  vertex3 = vec2(0.0, 0.5+progress);\n  if (PointInTriangle(p, vertex1, vertex2, vertex3))\n  {\n    return true;\n  }\n  return false;\n}\n\nbool in_right_triangle(vec2 p){\n  vec2 vertex1, vertex2, vertex3;\n  vertex1 = vec2(1.0-progress, 0.5);\n  vertex2 = vec2(1.0, 0.5-progress);\n  vertex3 = vec2(1.0, 0.5+progress);\n  if (PointInTriangle(p, vertex1, vertex2, vertex3))\n  {\n    return true;\n  }\n  return false;\n}\n\nfloat blur_edge(vec2 bot1, vec2 bot2, vec2 top, vec2 testPt)\n{\n  vec2 lineDir = bot1 - top;\n  vec2 perpDir = vec2(lineDir.y, -lineDir.x);\n  vec2 dirToPt1 = bot1 - testPt;\n  float dist1 = abs(dot(normalize(perpDir), dirToPt1));\n  \n  lineDir = bot2 - top;\n  perpDir = vec2(lineDir.y, -lineDir.x);\n  dirToPt1 = bot2 - testPt;\n  float min_dist = min(abs(dot(normalize(perpDir), dirToPt1)), dist1);\n  \n  if (min_dist < 0.005) {\n    return min_dist / 0.005;\n  }\n  else  {\n    return 1.0;\n  };\n}\n\n\nvec4 transition (vec2 uv) {\n  if (in_left_triangle(uv))\n  {\n    if (progress < 0.1)\n    {\n      return getFromColor(uv);\n    }\n    if (uv.x < 0.5)\n    {\n      vec2 vertex1 = vec2(progress, 0.5);\n      vec2 vertex2 = vec2(0.0, 0.5-progress);\n      vec2 vertex3 = vec2(0.0, 0.5+progress);\n      return mix(\n        getFromColor(uv),\n        getToColor(uv),\n        blur_edge(vertex2, vertex3, vertex1, uv)\n      );\n    }\n    else\n    {\n      if (progress > 0.0)\n      {\n        return getToColor(uv);\n      }\n      else\n      {\n        return getFromColor(uv);\n      }\n    }    \n  }\n  else if (in_right_triangle(uv))\n  {\n    if (uv.x >= 0.5)\n    {\n      vec2 vertex1 = vec2(1.0-progress, 0.5);\n      vec2 vertex2 = vec2(1.0, 0.5-progress);\n      vec2 vertex3 = vec2(1.0, 0.5+progress);\n      return mix(\n        getFromColor(uv),\n        getToColor(uv),\n        blur_edge(vertex2, vertex3, vertex1, uv)\n      );  \n    }\n    else\n    {\n      return getFromColor(uv);\n    }\n  }\n  else {\n    return getFromColor(uv);\n  }\n}',
  //   author: 'huynx',
  //   license: 'MIT',
  //   createdAt: 'Sat, 24 Mar 2018 12:54:26 +0100',
  //   updatedAt: 'Sat, 24 Mar 2018 12:54:26 +0100',
  // },
  // bowTieVertical: {
  //   name: 'BowTieVertical',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: huynx\r\n// License: MIT\r\n\r\nfloat check(vec2 p1, vec2 p2, vec2 p3)\r\n{\r\n  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);\r\n}\r\n\r\nbool PointInTriangle (vec2 pt, vec2 p1, vec2 p2, vec2 p3)\r\n{\r\n    bool b1, b2, b3;\r\n    b1 = check(pt, p1, p2) < 0.0;\r\n    b2 = check(pt, p2, p3) < 0.0;\r\n    b3 = check(pt, p3, p1) < 0.0;\r\n    return ((b1 == b2) && (b2 == b3));\r\n}\r\n\r\nbool in_top_triangle(vec2 p){\r\n  vec2 vertex1, vertex2, vertex3;\r\n  vertex1 = vec2(0.5, progress);\r\n  vertex2 = vec2(0.5-progress, 0.0);\r\n  vertex3 = vec2(0.5+progress, 0.0);\r\n  if (PointInTriangle(p, vertex1, vertex2, vertex3))\r\n  {\r\n    return true;\r\n  }\r\n  return false;\r\n}\r\n\r\nbool in_bottom_triangle(vec2 p){\r\n  vec2 vertex1, vertex2, vertex3;\r\n  vertex1 = vec2(0.5, 1.0 - progress);\r\n  vertex2 = vec2(0.5-progress, 1.0);\r\n  vertex3 = vec2(0.5+progress, 1.0);\r\n  if (PointInTriangle(p, vertex1, vertex2, vertex3))\r\n  {\r\n    return true;\r\n  }\r\n  return false;\r\n}\r\n\r\nfloat blur_edge(vec2 bot1, vec2 bot2, vec2 top, vec2 testPt)\r\n{\r\n  vec2 lineDir = bot1 - top;\r\n  vec2 perpDir = vec2(lineDir.y, -lineDir.x);\r\n  vec2 dirToPt1 = bot1 - testPt;\r\n  float dist1 = abs(dot(normalize(perpDir), dirToPt1));\r\n  \r\n  lineDir = bot2 - top;\r\n  perpDir = vec2(lineDir.y, -lineDir.x);\r\n  dirToPt1 = bot2 - testPt;\r\n  float min_dist = min(abs(dot(normalize(perpDir), dirToPt1)), dist1);\r\n  \r\n  if (min_dist < 0.005) {\r\n    return min_dist / 0.005;\r\n  }\r\n  else  {\r\n    return 1.0;\r\n  };\r\n}\r\n\r\n\r\nvec4 transition (vec2 uv) {\r\n  if (in_top_triangle(uv))\r\n  {\r\n    if (progress < 0.1)\r\n    {\r\n      return getFromColor(uv);\r\n    }\r\n    if (uv.y < 0.5)\r\n    {\r\n      vec2 vertex1 = vec2(0.5, progress);\r\n      vec2 vertex2 = vec2(0.5-progress, 0.0);\r\n      vec2 vertex3 = vec2(0.5+progress, 0.0);\r\n      return mix(\r\n        getFromColor(uv),\r\n        getToColor(uv),\r\n        blur_edge(vertex2, vertex3, vertex1, uv)\r\n      );\r\n    }\r\n    else\r\n    {\r\n      if (progress > 0.0)\r\n      {\r\n        return getToColor(uv);\r\n      }\r\n      else\r\n      {\r\n        return getFromColor(uv);\r\n      }\r\n    }    \r\n  }\r\n  else if (in_bottom_triangle(uv))\r\n  {\r\n    if (uv.y >= 0.5)\r\n    {\r\n      vec2 vertex1 = vec2(0.5, 1.0-progress);\r\n      vec2 vertex2 = vec2(0.5-progress, 1.0);\r\n      vec2 vertex3 = vec2(0.5+progress, 1.0);\r\n      return mix(\r\n        getFromColor(uv),\r\n        getToColor(uv),\r\n        blur_edge(vertex2, vertex3, vertex1, uv)\r\n      );  \r\n    }\r\n    else\r\n    {\r\n      return getFromColor(uv);\r\n    }\r\n  }\r\n  else {\r\n    return getFromColor(uv);\r\n  }\r\n}',
  //   author: 'huynx',
  //   license: 'MIT',
  //   createdAt: 'Tue, 27 Mar 2018 10:07:54 +0700',
  //   updatedAt: 'Tue, 27 Mar 2018 10:07:54 +0700',
  // },
  // butterflyWaveScrawler: {
  //   name: 'ButterflyWaveScrawler',
  //   paramsTypes: {
  //     amplitude: 'float',
  //     waves: 'float',
  //     colorSeparation: 'float',
  //   },
  //   defaultParams: {
  //     amplitude: 1,
  //     waves: 30,
  //     colorSeparation: 0.3,
  //   },
  //   glsl: "// Author: mandubian\n// License: MIT\nuniform float amplitude; // = 1.0\nuniform float waves; // = 30.0\nuniform float colorSeparation; // = 0.3\nfloat PI = 3.14159265358979323846264;\nfloat compute(vec2 p, float progress, vec2 center) {\nvec2 o = p*sin(progress * amplitude)-center;\n// horizontal vector\nvec2 h = vec2(1., 0.);\n// butterfly polar function (don't ask me why this one :))\nfloat theta = acos(dot(o, h)) * waves;\nreturn (exp(cos(theta)) - 2.*cos(4.*theta) + pow(sin((2.*theta - PI) / 24.), 5.)) / 10.;\n}\nvec4 transition(vec2 uv) {\n  vec2 p = uv.xy / vec2(1.0).xy;\n  float inv = 1. - progress;\n  vec2 dir = p - vec2(.5);\n  float dist = length(dir);\n  float disp = compute(p, progress, vec2(0.5, 0.5)) ;\n  vec4 texTo = getToColor(p + inv*disp);\n  vec4 texFrom = vec4(\n  getFromColor(p + progress*disp*(1.0 - colorSeparation)).r,\n  getFromColor(p + progress*disp).g,\n  getFromColor(p + progress*disp*(1.0 + colorSeparation)).b,\n  1.0);\n  return texTo*progress + texFrom*inv;\n}\n",
  //   author: 'mandubian',
  //   license: 'MIT',
  //   createdAt: 'Thu, 1 Jun 2017 11:47:17 +0200',
  //   updatedAt: 'Thu, 1 Jun 2017 11:47:17 +0200',
  // },
  // circleCrop: {
  //   name: 'CircleCrop',
  //   paramsTypes: {
  //     bgcolor: 'vec4',
  //   },
  //   defaultParams: {
  //     bgcolor: [0, 0, 0, 1],
  //   },
  //   glsl: "// License: MIT\n// Author: fkuteken\n// ported by gre from https://gist.github.com/fkuteken/f63e3009c1143950dee9063c3b83fb88\n\nuniform vec4 bgcolor; // = vec4(0.0, 0.0, 0.0, 1.0)\n\nvec2 ratio2 = vec2(1.0, 1.0 / ratio);\nfloat s = pow(2.0 * abs(progress - 0.5), 3.0);\n\nvec4 transition(vec2 p) {\n  float dist = length((vec2(p) - 0.5) * ratio2);\n  return mix(\n    progress < 0.5 ? getFromColor(p) : getToColor(p), // branching is ok here as we statically depend on progress uniform (branching won't change over pixels)\n    bgcolor,\n    step(s, dist)\n  );\n}\n",
  //   license: 'MIT',
  //   author: 'fkuteken',
  //   createdAt: 'Mon, 12 Jun 2017 12:52:34 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 12:52:34 +0800',
  // },
  // colourDistance: {
  //   name: 'ColourDistance',
  //   paramsTypes: {
  //     power: 'float',
  //   },
  //   defaultParams: {
  //     power: 5,
  //   },
  //   glsl: '// License: MIT\n// Author: P-Seebauer\n// ported by gre from https://gist.github.com/P-Seebauer/2a5fa2f77c883dd661f9\n\nuniform float power; // = 5.0\n\nvec4 transition(vec2 p) {\n  vec4 fTex = getFromColor(p);\n  vec4 tTex = getToColor(p);\n  float m = step(distance(fTex, tTex), progress);\n  return mix(\n    mix(fTex, tTex, m),\n    tTex,\n    pow(progress, power)\n  );\n}\n',
  //   license: 'MIT',
  //   author: 'P-Seebauer',
  //   createdAt: 'Mon, 12 Jun 2017 12:57:42 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 12:57:42 +0800',
  // },
  // crazyParametricFun: {
  //   name: 'CrazyParametricFun',
  //   paramsTypes: {
  //     a: 'float',
  //     b: 'float',
  //     amplitude: 'float',
  //     smoothness: 'float',
  //   },
  //   defaultParams: {
  //     a: 4,
  //     b: 1,
  //     amplitude: 120,
  //     smoothness: 0.1,
  //   },
  //   glsl: '// Author: mandubian\n// License: MIT\n\nuniform float a; // = 4\nuniform float b; // = 1\nuniform float amplitude; // = 120\nuniform float smoothness; // = 0.1\n\nvec4 transition(vec2 uv) {\n  vec2 p = uv.xy / vec2(1.0).xy;\n  vec2 dir = p - vec2(.5);\n  float dist = length(dir);\n  float x = (a - b) * cos(progress) + b * cos(progress * ((a / b) - 1.) );\n  float y = (a - b) * sin(progress) - b * sin(progress * ((a / b) - 1.));\n  vec2 offset = dir * vec2(sin(progress  * dist * amplitude * x), sin(progress * dist * amplitude * y)) / smoothness;\n  return mix(getFromColor(p + offset), getToColor(p), smoothstep(0.2, 1.0, progress));\n}\n',
  //   author: 'mandubian',
  //   license: 'MIT',
  //   createdAt: 'Thu, 1 Jun 2017 13:03:12 +0200',
  //   updatedAt: 'Thu, 1 Jun 2017 13:03:12 +0200',
  // },
  // crossZoom: {
  //   name: 'CrossZoom',
  //   paramsTypes: {
  //     strength: 'float',
  //   },
  //   defaultParams: {
  //     strength: 0.4,
  //   },
  //   glsl: '// License: MIT\n// Author: rectalogic\n// ported by gre from https://gist.github.com/rectalogic/b86b90161503a0023231\n\n// Converted from https://github.com/rectalogic/rendermix-basic-effects/blob/master/assets/com/rendermix/CrossZoom/CrossZoom.frag\n// Which is based on https://github.com/evanw/glfx.js/blob/master/src/filters/blur/zoomblur.js\n// With additional easing functions from https://github.com/rectalogic/rendermix-basic-effects/blob/master/assets/com/rendermix/Easing/Easing.glsllib\n\nuniform float strength; // = 0.4\n\nconst float PI = 3.141592653589793;\n\nfloat Linear_ease(in float begin, in float change, in float duration, in float time) {\n    return change * time / duration + begin;\n}\n\nfloat Exponential_easeInOut(in float begin, in float change, in float duration, in float time) {\n    if (time == 0.0)\n        return begin;\n    else if (time == duration)\n        return begin + change;\n    time = time / (duration / 2.0);\n    if (time < 1.0)\n        return change / 2.0 * pow(2.0, 10.0 * (time - 1.0)) + begin;\n    return change / 2.0 * (-pow(2.0, -10.0 * (time - 1.0)) + 2.0) + begin;\n}\n\nfloat Sinusoidal_easeInOut(in float begin, in float change, in float duration, in float time) {\n    return -change / 2.0 * (cos(PI * time / duration) - 1.0) + begin;\n}\n\nfloat rand (vec2 co) {\n  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nvec3 crossFade(in vec2 uv, in float dissolve) {\n    return mix(getFromColor(uv).rgb, getToColor(uv).rgb, dissolve);\n}\n\nvec4 transition(vec2 uv) {\n    vec2 texCoord = uv.xy / vec2(1.0).xy;\n\n    // Linear interpolate center across center half of the image\n    vec2 center = vec2(Linear_ease(0.25, 0.5, 1.0, progress), 0.5);\n    float dissolve = Exponential_easeInOut(0.0, 1.0, 1.0, progress);\n\n    // Mirrored sinusoidal loop. 0->strength then strength->0\n    float strength = Sinusoidal_easeInOut(0.0, strength, 0.5, progress);\n\n    vec3 color = vec3(0.0);\n    float total = 0.0;\n    vec2 toCenter = center - texCoord;\n\n    /* randomize the lookup values to hide the fixed number of samples */\n    float offset = rand(uv);\n\n    for (float t = 0.0; t <= 40.0; t++) {\n        float percent = (t + offset) / 40.0;\n        float weight = 4.0 * (percent - percent * percent);\n        color += crossFade(texCoord + toCenter * percent * strength, dissolve) * weight;\n        total += weight;\n    }\n    return vec4(color / total, 1.0);\n}\n',
  //   license: 'MIT',
  //   author: 'rectalogic',
  //   createdAt: 'Mon, 12 Jun 2017 12:33:07 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 12:33:07 +0800',
  // },
  // directional: {
  //   name: 'Directional',
  //   paramsTypes: {
  //     direction: 'vec2',
  //   },
  //   defaultParams: {
  //     direction: [0, 1],
  //   },
  //   glsl: '// Author: Gaëtan Renaudeau\n// License: MIT\n\nuniform vec2 direction; // = vec2(0.0, 1.0)\n\nvec4 transition (vec2 uv) {\n  vec2 p = uv + progress * sign(direction);\n  vec2 f = fract(p);\n  return mix(\n    getToColor(f),\n    getFromColor(f),\n    step(0.0, p.y) * step(p.y, 1.0) * step(0.0, p.x) * step(p.x, 1.0)\n  );\n}\n',
  //   author: 'Gaëtan Renaudeau',
  //   license: 'MIT',
  //   createdAt: 'Thu, 19 Apr 2018 12:20:29 +0200',
  //   updatedAt: 'Thu, 19 Apr 2018 12:20:29 +0200',
  // },
  // doomScreenTransition: {
  //   name: 'DoomScreenTransition',
  //   paramsTypes: {
  //     bars: 'int',
  //     amplitude: 'float',
  //     noise: 'float',
  //     frequency: 'float',
  //     dripScale: 'float',
  //   },
  //   defaultParams: {
  //     bars: 30,
  //     amplitude: 2,
  //     noise: 0.1,
  //     frequency: 0.5,
  //     dripScale: 0.5,
  //   },
  //   glsl: '// Author: Zeh Fernando\n// License: MIT\n\n\n// Transition parameters --------\n\n// Number of total bars/columns\nuniform int bars; // = 30\n\n// Multiplier for speed ratio. 0 = no variation when going down, higher = some elements go much faster\nuniform float amplitude; // = 2\n\n// Further variations in speed. 0 = no noise, 1 = super noisy (ignore frequency)\nuniform float noise; // = 0.1\n\n// Speed variation horizontally. the bigger the value, the shorter the waves\nuniform float frequency; // = 0.5\n\n// How much the bars seem to "run" from the middle of the screen first (sticking to the sides). 0 = no drip, 1 = curved drip\nuniform float dripScale; // = 0.5\n\n\n// The code proper --------\n\nfloat rand(int num) {\n  return fract(mod(float(num) * 67123.313, 12.0) * sin(float(num) * 10.3) * cos(float(num)));\n}\n\nfloat wave(int num) {\n  float fn = float(num) * frequency * 0.1 * float(bars);\n  return cos(fn * 0.5) * cos(fn * 0.13) * sin((fn+10.0) * 0.3) / 2.0 + 0.5;\n}\n\nfloat drip(int num) {\n  return sin(float(num) / float(bars - 1) * 3.141592) * dripScale;\n}\n\nfloat pos(int num) {\n  return (noise == 0.0 ? wave(num) : mix(wave(num), rand(num), noise)) + (dripScale == 0.0 ? 0.0 : drip(num));\n}\n\nvec4 transition(vec2 uv) {\n  int bar = int(uv.x * (float(bars)));\n  float scale = 1.0 + pos(bar) * amplitude;\n  float phase = progress * scale;\n  float posY = uv.y / vec2(1.0).y;\n  vec2 p;\n  vec4 c;\n  if (phase + posY < 1.0) {\n    p = vec2(uv.x, uv.y + mix(0.0, vec2(1.0).y, phase)) / vec2(1.0).xy;\n    c = getFromColor(p);\n  } else {\n    p = uv.xy / vec2(1.0).xy;\n    c = getToColor(p);\n  }\n\n  // Finally, apply the color\n  return c;\n}\n',
  //   author: 'Zeh Fernando',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 09:39:09 -0700',
  //   updatedAt: 'Tue, 30 May 2017 09:39:09 -0700',
  // },
  // dreamy: {
  //   name: 'Dreamy',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: mikolalysenko\n// License: MIT\n\nvec2 offset(float progress, float x, float theta) {\n  float phase = progress*progress + progress + theta;\n  float shifty = 0.03*progress*cos(10.0*(progress+x));\n  return vec2(0, shifty);\n}\nvec4 transition(vec2 p) {\n  return mix(getFromColor(p + offset(progress, p.x, 0.0)), getToColor(p + offset(1.0-progress, p.x, 3.14)), progress);\n}\n',
  //   author: 'mikolalysenko',
  //   license: 'MIT',
  //   createdAt: 'Mon, 12 Jun 2017 12:27:38 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 12:27:38 +0800',
  // },
  // dreamyZoom: {
  //   name: 'DreamyZoom',
  //   paramsTypes: {
  //     rotation: 'float',
  //     scale: 'float',
  //   },
  //   defaultParams: {
  //     rotation: 6,
  //     scale: 1.2,
  //   },
  //   glsl: '// Author: Zeh Fernando\n// License: MIT\n\n// Definitions --------\n#define DEG2RAD 0.03926990816987241548078304229099 // 1/180*PI\n\n\n// Transition parameters --------\n\n// In degrees\nuniform float rotation; // = 6\n\n// Multiplier\nuniform float scale; // = 1.2\n\n\n// The code proper --------\n\nvec4 transition(vec2 uv) {\n  // Massage parameters\n  float phase = progress < 0.5 ? progress * 2.0 : (progress - 0.5) * 2.0;\n  float angleOffset = progress < 0.5 ? mix(0.0, rotation * DEG2RAD, phase) : mix(-rotation * DEG2RAD, 0.0, phase);\n  float newScale = progress < 0.5 ? mix(1.0, scale, phase) : mix(scale, 1.0, phase);\n  \n  vec2 center = vec2(0, 0);\n\n  // Calculate the source point\n  vec2 assumedCenter = vec2(0.5, 0.5);\n  vec2 p = (uv.xy - vec2(0.5, 0.5)) / newScale * vec2(ratio, 1.0);\n\n  // This can probably be optimized (with distance())\n  float angle = atan(p.y, p.x) + angleOffset;\n  float dist = distance(center, p);\n  p.x = cos(angle) * dist / ratio + 0.5;\n  p.y = sin(angle) * dist + 0.5;\n  vec4 c = progress < 0.5 ? getFromColor(p) : getToColor(p);\n\n  // Finally, apply the color\n  return c + (progress < 0.5 ? mix(0.0, 1.0, phase) : mix(1.0, 0.0, phase));\n}\n',
  //   author: 'Zeh Fernando',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 10:44:06 -0700',
  //   updatedAt: 'Tue, 30 May 2017 10:44:06 -0700',
  // },
  // glitchDisplace: {
  //   name: 'GlitchDisplace',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: Matt DesLauriers\n// License: MIT\n\nhighp float random(vec2 co)\n{\n    highp float a = 12.9898;\n    highp float b = 78.233;\n    highp float c = 43758.5453;\n    highp float dt= dot(co.xy ,vec2(a,b));\n    highp float sn= mod(dt,3.14);\n    return fract(sin(sn) * c);\n}\nfloat voronoi( in vec2 x ) {\n    vec2 p = floor( x );\n    vec2 f = fract( x );\n    float res = 8.0;\n    for( float j=-1.; j<=1.; j++ )\n    for( float i=-1.; i<=1.; i++ ) {\n        vec2  b = vec2( i, j );\n        vec2  r = b - f + random( p + b );\n        float d = dot( r, r );\n        res = min( res, d );\n    }\n    return sqrt( res );\n}\n\nvec2 displace(vec4 tex, vec2 texCoord, float dotDepth, float textureDepth, float strength) {\n    float b = voronoi(.003 * texCoord + 2.0);\n    float g = voronoi(0.2 * texCoord);\n    float r = voronoi(texCoord - 1.0);\n    vec4 dt = tex * 1.0;\n    vec4 dis = dt * dotDepth + 1.0 - tex * textureDepth;\n\n    dis.x = dis.x - 1.0 + textureDepth*dotDepth;\n    dis.y = dis.y - 1.0 + textureDepth*dotDepth;\n    dis.x *= strength;\n    dis.y *= strength;\n    vec2 res_uv = texCoord ;\n    res_uv.x = res_uv.x + dis.x - 0.0;\n    res_uv.y = res_uv.y + dis.y;\n    return res_uv;\n}\n\nfloat ease1(float t) {\n  return t == 0.0 || t == 1.0\n    ? t\n    : t < 0.5\n      ? +0.5 * pow(2.0, (20.0 * t) - 10.0)\n      : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;\n}\nfloat ease2(float t) {\n  return t == 1.0 ? t : 1.0 - pow(2.0, -10.0 * t);\n}\n\n\n\nvec4 transition(vec2 uv) {\n  vec2 p = uv.xy / vec2(1.0).xy;\n  vec4 color1 = getFromColor(p);\n  vec4 color2 = getToColor(p);\n  vec2 disp = displace(color1, p, 0.33, 0.7, 1.0-ease1(progress));\n  vec2 disp2 = displace(color2, p, 0.33, 0.5, ease2(progress));\n  vec4 dColor1 = getToColor(disp);\n  vec4 dColor2 = getFromColor(disp2);\n  float val = ease1(progress);\n  vec3 gray = vec3(dot(min(dColor2, dColor1).rgb, vec3(0.299, 0.587, 0.114)));\n  dColor2 = vec4(gray, 1.0);\n  dColor2 *= 2.0;\n  color1 = mix(color1, dColor2, smoothstep(0.0, 0.5, progress));\n  color2 = mix(color2, dColor1, smoothstep(1.0, 0.5, progress));\n  return mix(color1, color2, val);\n  //gl_FragColor = mix(gl_FragColor, dColor, smoothstep(0.0, 0.5, progress));\n  \n   //gl_FragColor = mix(texture2D(from, p), texture2D(to, p), progress);\n}\n',
  //   author: 'Matt DesLauriers',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:53:04 -0400',
  //   updatedAt: 'Tue, 30 May 2017 14:53:04 -0400',
  // },
  // glitchMemories: {
  //   name: 'GlitchMemories',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// author: Gunnar Roth\n// based on work from natewave\n// license: MIT\nvec4 transition(vec2 p) {\n  vec2 block = floor(p.xy / vec2(16));\n  vec2 uv_noise = block / vec2(64);\n  uv_noise += floor(vec2(progress) * vec2(1200.0, 3500.0)) / vec2(64);\n  vec2 dist = progress > 0.0 ? (fract(uv_noise) - 0.5) * 0.3 *(1.0 -progress) : vec2(0.0);\n  vec2 red = p + dist * 0.2;\n  vec2 green = p + dist * .3;\n  vec2 blue = p + dist * .5;\n\n  return vec4(mix(getFromColor(red), getToColor(red), progress).r,mix(getFromColor(green), getToColor(green), progress).g,mix(getFromColor(blue), getToColor(blue), progress).b,1.0);\n}\n\n',
  //   author: 'Gunnar Roth',
  //   license: 'MIT',
  //   createdAt: 'Wed, 21 Feb 2018 00:52:15 +0100',
  //   updatedAt: 'Wed, 21 Feb 2018 19:32:02 +0100',
  // },
  // gridFlip: {
  //   name: 'GridFlip',
  //   paramsTypes: {
  //     size: 'ivec2',
  //     pause: 'float',
  //     dividerWidth: 'float',
  //     bgcolor: 'vec4',
  //     randomness: 'float',
  //   },
  //   defaultParams: {
  //     size: [4, 4],
  //     pause: 0.1,
  //     dividerWidth: 0.05,
  //     bgcolor: [0, 0, 0, 1],
  //     randomness: 0.1,
  //   },
  //   glsl: '// License: MIT\n// Author: TimDonselaar\n// ported by gre from https://gist.github.com/TimDonselaar/9bcd1c4b5934ba60087bdb55c2ea92e5\n\nuniform ivec2 size; // = ivec2(4)\nuniform float pause; // = 0.1\nuniform float dividerWidth; // = 0.05\nuniform vec4 bgcolor; // = vec4(0.0, 0.0, 0.0, 1.0)\nuniform float randomness; // = 0.1\n \nfloat rand (vec2 co) {\n  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nfloat getDelta(vec2 p) {\n  vec2 rectanglePos = floor(vec2(size) * p);\n  vec2 rectangleSize = vec2(1.0 / vec2(size).x, 1.0 / vec2(size).y);\n  float top = rectangleSize.y * (rectanglePos.y + 1.0);\n  float bottom = rectangleSize.y * rectanglePos.y;\n  float left = rectangleSize.x * rectanglePos.x;\n  float right = rectangleSize.x * (rectanglePos.x + 1.0);\n  float minX = min(abs(p.x - left), abs(p.x - right));\n  float minY = min(abs(p.y - top), abs(p.y - bottom));\n  return min(minX, minY);\n}\n\nfloat getDividerSize() {\n  vec2 rectangleSize = vec2(1.0 / vec2(size).x, 1.0 / vec2(size).y);\n  return min(rectangleSize.x, rectangleSize.y) * dividerWidth;\n}\n\nvec4 transition(vec2 p) {\n  if(progress < pause) {\n    float currentProg = progress / pause;\n    float a = 1.0;\n    if(getDelta(p) < getDividerSize()) {\n      a = 1.0 - currentProg;\n    }\n    return mix(bgcolor, getFromColor(p), a);\n  }\n  else if(progress < 1.0 - pause){\n    if(getDelta(p) < getDividerSize()) {\n      return bgcolor;\n    } else {\n      float currentProg = (progress - pause) / (1.0 - pause * 2.0);\n      vec2 q = p;\n      vec2 rectanglePos = floor(vec2(size) * q);\n      \n      float r = rand(rectanglePos) - randomness;\n      float cp = smoothstep(0.0, 1.0 - r, currentProg);\n    \n      float rectangleSize = 1.0 / vec2(size).x;\n      float delta = rectanglePos.x * rectangleSize;\n      float offset = rectangleSize / 2.0 + delta;\n      \n      p.x = (p.x - offset)/abs(cp - 0.5)*0.5 + offset;\n      vec4 a = getFromColor(p);\n      vec4 b = getToColor(p);\n      \n      float s = step(abs(vec2(size).x * (q.x - delta) - 0.5), abs(cp - 0.5));\n      return mix(bgcolor, mix(b, a, step(cp, 0.5)), s);\n    }\n  }\n  else {\n    float currentProg = (progress - 1.0 + pause) / pause;\n    float a = 1.0;\n    if(getDelta(p) < getDividerSize()) {\n      a = currentProg;\n    }\n    return mix(bgcolor, getToColor(p), a);\n  }\n}\n',
  //   license: 'MIT',
  //   author: 'TimDonselaar',
  //   createdAt: 'Mon, 12 Jun 2017 11:32:51 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 11:32:51 +0800',
  // },
  // invertedPageCurl: {
  //   name: 'InvertedPageCurl',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// author: Hewlett-Packard\n// license: BSD 3 Clause\n// Adapted by Sergey Kosarevsky from:\n// http://rectalogic.github.io/webvfx/examples_2transition-shader-pagecurl_8html-example.html\n\n/*\nCopyright (c) 2010 Hewlett-Packard Development Company, L.P. All rights reserved.\n\nRedistribution and use in source and binary forms, with or without\nmodification, are permitted provided that the following conditions are\nmet:\n\n   * Redistributions of source code must retain the above copyright\n     notice, this list of conditions and the following disclaimer.\n   * Redistributions in binary form must reproduce the above\n     copyright notice, this list of conditions and the following disclaimer\n     in the documentation and/or other materials provided with the\n     distribution.\n   * Neither the name of Hewlett-Packard nor the names of its\n     contributors may be used to endorse or promote products derived from\n     this software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\nLIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\nA PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\nOWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\nSPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\nLIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\nDATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\nTHEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\nOF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\nin vec2 texCoord;\n*/\n\nconst float MIN_AMOUNT = -0.16;\nconst float MAX_AMOUNT = 1.5;\nfloat amount = progress * (MAX_AMOUNT - MIN_AMOUNT) + MIN_AMOUNT;\n\nconst float PI = 3.141592653589793;\n\nconst float scale = 512.0;\nconst float sharpness = 3.0;\n\nfloat cylinderCenter = amount;\n// 360 degrees * amount\nfloat cylinderAngle = 2.0 * PI * amount;\n\nconst float cylinderRadius = 1.0 / PI / 2.0;\n\nvec3 hitPoint(float hitAngle, float yc, vec3 point, mat3 rrotation)\n{\n        float hitPoint = hitAngle / (2.0 * PI);\n        point.y = hitPoint;\n        return rrotation * point;\n}\n\nvec4 antiAlias(vec4 color1, vec4 color2, float distanc)\n{\n        distanc *= scale;\n        if (distanc < 0.0) return color2;\n        if (distanc > 2.0) return color1;\n        float dd = pow(1.0 - distanc / 2.0, sharpness);\n        return ((color2 - color1) * dd) + color1;\n}\n\nfloat distanceToEdge(vec3 point)\n{\n        float dx = abs(point.x > 0.5 ? 1.0 - point.x : point.x);\n        float dy = abs(point.y > 0.5 ? 1.0 - point.y : point.y);\n        if (point.x < 0.0) dx = -point.x;\n        if (point.x > 1.0) dx = point.x - 1.0;\n        if (point.y < 0.0) dy = -point.y;\n        if (point.y > 1.0) dy = point.y - 1.0;\n        if ((point.x < 0.0 || point.x > 1.0) && (point.y < 0.0 || point.y > 1.0)) return sqrt(dx * dx + dy * dy);\n        return min(dx, dy);\n}\n\nvec4 seeThrough(float yc, vec2 p, mat3 rotation, mat3 rrotation)\n{\n        float hitAngle = PI - (acos(yc / cylinderRadius) - cylinderAngle);\n        vec3 point = hitPoint(hitAngle, yc, rotation * vec3(p, 1.0), rrotation);\n        if (yc <= 0.0 && (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0))\n        {\n            return getToColor(p);\n        }\n\n        if (yc > 0.0) return getFromColor(p);\n\n        vec4 color = getFromColor(point.xy);\n        vec4 tcolor = vec4(0.0);\n\n        return antiAlias(color, tcolor, distanceToEdge(point));\n}\n\nvec4 seeThroughWithShadow(float yc, vec2 p, vec3 point, mat3 rotation, mat3 rrotation)\n{\n        float shadow = distanceToEdge(point) * 30.0;\n        shadow = (1.0 - shadow) / 3.0;\n\n        if (shadow < 0.0) shadow = 0.0; else shadow *= amount;\n\n        vec4 shadowColor = seeThrough(yc, p, rotation, rrotation);\n        shadowColor.r -= shadow;\n        shadowColor.g -= shadow;\n        shadowColor.b -= shadow;\n\n        return shadowColor;\n}\n\nvec4 backside(float yc, vec3 point)\n{\n        vec4 color = getFromColor(point.xy);\n        float gray = (color.r + color.b + color.g) / 15.0;\n        gray += (8.0 / 10.0) * (pow(1.0 - abs(yc / cylinderRadius), 2.0 / 10.0) / 2.0 + (5.0 / 10.0));\n        color.rgb = vec3(gray);\n        return color;\n}\n\nvec4 behindSurface(vec2 p, float yc, vec3 point, mat3 rrotation)\n{\n        float shado = (1.0 - ((-cylinderRadius - yc) / amount * 7.0)) / 6.0;\n        shado *= 1.0 - abs(point.x - 0.5);\n\n        yc = (-cylinderRadius - cylinderRadius - yc);\n\n        float hitAngle = (acos(yc / cylinderRadius) + cylinderAngle) - PI;\n        point = hitPoint(hitAngle, yc, point, rrotation);\n\n        if (yc < 0.0 && point.x >= 0.0 && point.y >= 0.0 && point.x <= 1.0 && point.y <= 1.0 && (hitAngle < PI || amount > 0.5))\n        {\n                shado = 1.0 - (sqrt(pow(point.x - 0.5, 2.0) + pow(point.y - 0.5, 2.0)) / (71.0 / 100.0));\n                shado *= pow(-yc / cylinderRadius, 3.0);\n                shado *= 0.5;\n        }\n        else\n        {\n                shado = 0.0;\n        }\n        return vec4(getToColor(p).rgb - shado, 1.0);\n}\n\nvec4 transition(vec2 p) {\n\n  const float angle = 100.0 * PI / 180.0;\n        float c = cos(-angle);\n        float s = sin(-angle);\n\n        mat3 rotation = mat3( c, s, 0,\n                                                                -s, c, 0,\n                                                                -0.801, 0.8900, 1\n                                                                );\n        c = cos(angle);\n        s = sin(angle);\n\n        mat3 rrotation = mat3(\tc, s, 0,\n                                                                        -s, c, 0,\n                                                                        0.98500, 0.985, 1\n                                                                );\n\n        vec3 point = rotation * vec3(p, 1.0);\n\n        float yc = point.y - cylinderCenter;\n\n        if (yc < -cylinderRadius)\n        {\n                // Behind surface\n                return behindSurface(p,yc, point, rrotation);\n        }\n\n        if (yc > cylinderRadius)\n        {\n                // Flat surface\n                return getFromColor(p);\n        }\n\n        float hitAngle = (acos(yc / cylinderRadius) + cylinderAngle) - PI;\n\n        float hitAngleMod = mod(hitAngle, 2.0 * PI);\n        if ((hitAngleMod > PI && amount < 0.5) || (hitAngleMod > PI/2.0 && amount < 0.0))\n        {\n                return seeThrough(yc, p, rotation, rrotation);\n        }\n\n        point = hitPoint(hitAngle, yc, point, rrotation);\n\n        if (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0)\n        {\n                return seeThroughWithShadow(yc, p, point, rotation, rrotation);\n        }\n\n        vec4 color = backside(yc, point);\n\n        vec4 otherColor;\n        if (yc < 0.0)\n        {\n                float shado = 1.0 - (sqrt(pow(point.x - 0.5, 2.0) + pow(point.y - 0.5, 2.0)) / 0.71);\n                shado *= pow(-yc / cylinderRadius, 3.0);\n                shado *= 0.5;\n                otherColor = vec4(0.0, 0.0, 0.0, shado);\n        }\n        else\n        {\n                otherColor = getFromColor(p);\n        }\n\n        color = antiAlias(color, otherColor, cylinderRadius - abs(yc));\n\n        vec4 cl = seeThroughWithShadow(yc, p, point, rotation, rrotation);\n        float dist = distanceToEdge(point);\n\n        return antiAlias(color, cl, dist);\n}\n',
  //   author: 'Hewlett-Packard',
  //   license: 'BSD 3 Clause',
  //   createdAt: 'Wed, 21 Feb 2018 01:13:49 +0100',
  //   updatedAt: 'Wed, 21 Feb 2018 16:00:02 +0100',
  // },
  // linearBlur: {
  //   name: 'LinearBlur',
  //   paramsTypes: {
  //     intensity: 'float',
  //   },
  //   defaultParams: {
  //     intensity: 0.1,
  //   },
  //   glsl: '// author: gre\n// license: MIT\nuniform float intensity; // = 0.1\nconst int passes = 6;\n\nvec4 transition(vec2 uv) {\n    vec4 c1 = vec4(0.0);\n    vec4 c2 = vec4(0.0);\n\n    float disp = intensity*(0.5-distance(0.5, progress));\n    for (int xi=0; xi<passes; xi++)\n    {\n        float x = float(xi) / float(passes) - 0.5;\n        for (int yi=0; yi<passes; yi++)\n        {\n            float y = float(yi) / float(passes) - 0.5;\n            vec2 v = vec2(x,y);\n            float d = disp;\n            c1 += getFromColor( uv + d*v);\n            c2 += getToColor( uv + d*v);\n        }\n    }\n    c1 /= float(passes*passes);\n    c2 /= float(passes*passes);\n    return mix(c1, c2, progress);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Fri, 23 Feb 2018 15:18:22 +0100',
  //   updatedAt: 'Fri, 23 Feb 2018 15:18:22 +0100',
  // },
  // mosaic: {
  //   name: 'Mosaic',
  //   paramsTypes: {
  //     endx: 'int',
  //     endy: 'int',
  //   },
  //   defaultParams: {
  //     endx: 2,
  //     endy: -1,
  //   },
  //   glsl: '// License: MIT\n// Author: Xaychru\n// ported by gre from https://gist.github.com/Xaychru/130bb7b7affedbda9df5\n\n#define PI 3.14159265358979323\n#define POW2(X) X*X\n#define POW3(X) X*X*X\nuniform int endx; // = 2\nuniform int endy; // = -1\n\nfloat Rand(vec2 v) {\n  return fract(sin(dot(v.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\nvec2 Rotate(vec2 v, float a) {\n  mat2 rm = mat2(cos(a), -sin(a),\n                 sin(a), cos(a));\n  return rm*v;\n}\nfloat CosInterpolation(float x) {\n  return -cos(x*PI)/2.+.5;\n}\nvec4 transition(vec2 uv) {\n  vec2 p = uv.xy / vec2(1.0).xy - .5;\n  vec2 rp = p;\n  float rpr = (progress*2.-1.);\n  float z = -(rpr*rpr*2.) + 3.;\n  float az = abs(z);\n  rp *= az;\n  rp += mix(vec2(.5, .5), vec2(float(endx) + .5, float(endy) + .5), POW2(CosInterpolation(progress)));\n  vec2 mrp = mod(rp, 1.);\n  vec2 crp = rp;\n  bool onEnd = int(floor(crp.x))==endx&&int(floor(crp.y))==endy;\n  if(!onEnd) {\n    float ang = float(int(Rand(floor(crp))*4.))*.5*PI;\n    mrp = vec2(.5) + Rotate(mrp-vec2(.5), ang);\n  }\n  if(onEnd || Rand(floor(crp))>.5) {\n    return getToColor(mrp);\n  } else {\n    return getFromColor(mrp);\n  }\n}\n',
  //   license: 'MIT',
  //   author: 'Xaychru',
  //   createdAt: 'Mon, 12 Jun 2017 10:26:51 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 10:26:51 +0800',
  // },
  // polkaDotsCurtain: {
  //   name: 'PolkaDotsCurtain',
  //   paramsTypes: {
  //     dots: 'float',
  //     center: 'vec2',
  //   },
  //   defaultParams: {
  //     dots: 20,
  //     center: [0, 0],
  //   },
  //   glsl: '// author: bobylito\n// license: MIT\nconst float SQRT_2 = 1.414213562373;\nuniform float dots;// = 20.0;\nuniform vec2 center;// = vec2(0, 0);\n\nvec4 transition(vec2 uv) {\n  bool nextImage = distance(fract(uv * dots), vec2(0.5, 0.5)) < ( progress / distance(uv, center));\n  return nextImage ? getToColor(uv) : getFromColor(uv);\n}\n',
  //   author: 'bobylito',
  //   license: 'MIT',
  //   createdAt: 'Tue, 20 Feb 2018 23:41:45 +0100',
  //   updatedAt: 'Tue, 20 Feb 2018 23:41:45 +0100',
  // },
  // radial: {
  //   name: 'Radial',
  //   paramsTypes: {
  //     smoothness: 'float',
  //   },
  //   defaultParams: {
  //     smoothness: 1,
  //   },
  //   glsl: '// License: MIT\n// Author: Xaychru\n// ported by gre from https://gist.github.com/Xaychru/ce1d48f0ce00bb379750\n\nuniform float smoothness; // = 1.0\n\nconst float PI = 3.141592653589;\n\nvec4 transition(vec2 p) {\n  vec2 rp = p*2.-1.;\n  return mix(\n    getToColor(p),\n    getFromColor(p),\n    smoothstep(0., smoothness, atan(rp.y,rp.x) - (progress-.5) * PI * 2.5)\n  );\n}\n',
  //   license: 'MIT',
  //   author: 'Xaychru',
  //   createdAt: 'Mon, 12 Jun 2017 10:36:24 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 10:36:24 +0800',
  // },
  // simpleZoom: {
  //   name: 'SimpleZoom',
  //   paramsTypes: {
  //     zoom_quickness: 'float',
  //   },
  //   defaultParams: {
  //     zoom_quickness: 0.8,
  //   },
  //   glsl: '// Author: 0gust1\n// License: MIT\n\nuniform float zoom_quickness; // = 0.8\nfloat nQuick = clamp(zoom_quickness,0.2,1.0);\n\nvec2 zoom(vec2 uv, float amount) {\n  return 0.5 + ((uv - 0.5) * (1.0-amount));\t\n}\n\nvec4 transition (vec2 uv) {\n  return mix(\n    getFromColor(zoom(uv, smoothstep(0.0, nQuick, progress))),\n    getToColor(uv),\n   smoothstep(nQuick-0.2, 1.0, progress)\n  );\n}',
  //   author: '0gust1',
  //   license: 'MIT',
  //   createdAt: 'Tue, 6 Mar 2018 00:43:47 +0100',
  //   updatedAt: 'Tue, 6 Mar 2018 00:43:47 +0100',
  // },
  // stereoViewer: {
  //   name: 'StereoViewer',
  //   paramsTypes: {
  //     zoom: 'float',
  //     corner_radius: 'float',
  //   },
  //   defaultParams: {
  //     zoom: 0.88,
  //     corner_radius: 0.22,
  //   },
  //   glsl: "// Tunable parameters\n// How much to zoom (out) for the effect ~ 0.5 - 1.0\nuniform float zoom; // = 0.88\n// Corner radius as a fraction of the image height\nuniform float corner_radius;  // = 0.22\n\n// author: Ted Schundler\n// license: BSD 2 Clause\n// Free for use and modification by anyone with credit\n\n// Copyright (c) 2016, Theodore K Schundler\n// All rights reserved.\n\n// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n\n// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n\n// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.\n\n// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n\n///////////////////////////////////////////////////////////////////////////////\n// Stereo Viewer Toy Transition                                              //\n//                                                                           //\n// Inspired by ViewMaster / Image3D image viewer devices.                    //\n// This effect is similar to what you see when you press the device's lever. //\n// There is a quick zoom in / out to make the transition 'valid' for GLSL.io //\n///////////////////////////////////////////////////////////////////////////////\n\nconst vec4 black = vec4(0.0, 0.0, 0.0, 1.0);\nconst vec2 c00 = vec2(0.0, 0.0); // the four corner points\nconst vec2 c01 = vec2(0.0, 1.0);\nconst vec2 c11 = vec2(1.0, 1.0);\nconst vec2 c10 = vec2(1.0, 0.0);\n\n// Check if a point is within a given corner\nbool in_corner(vec2 p, vec2 corner, vec2 radius) {\n  // determine the direction we want to be filled\n  vec2 axis = (c11 - corner) - corner;\n\n  // warp the point so we are always testing the bottom left point with the\n  // circle centered on the origin\n  p = p - (corner + axis * radius);\n  p *= axis / radius;\n  return (p.x > 0.0 && p.y > -1.0) || (p.y > 0.0 && p.x > -1.0) || dot(p, p) < 1.0;\n}\n\n// Check all four corners\n// return a float for v2 for anti-aliasing?\nbool test_rounded_mask(vec2 p, vec2 corner_size) {\n  return\n      in_corner(p, c00, corner_size) &&\n      in_corner(p, c01, corner_size) &&\n      in_corner(p, c10, corner_size) &&\n      in_corner(p, c11, corner_size);\n}\n\n// Screen blend mode - https://en.wikipedia.org/wiki/Blend_modes\n// This more closely approximates what you see than linear blending\nvec4 screen(vec4 a, vec4 b) {\n  return 1.0 - (1.0 - a) * (1.0 -b);\n}\n\n// Given RGBA, find a value that when screened with itself\n// will yield the original value.\nvec4 unscreen(vec4 c) {\n  return 1.0 - sqrt(1.0 - c);\n}\n\n// Grab a pixel, only if it isn't masked out by the rounded corners\nvec4 sample_with_corners_from(vec2 p, vec2 corner_size) {\n  p = (p - 0.5) / zoom + 0.5;\n  if (!test_rounded_mask(p, corner_size)) {\n    return black;\n  }\n  return unscreen(getFromColor(p));\n}\n\nvec4 sample_with_corners_to(vec2 p, vec2 corner_size) {\n  p = (p - 0.5) / zoom + 0.5;\n  if (!test_rounded_mask(p, corner_size)) {\n    return black;\n  }\n  return unscreen(getToColor(p));\n}\n\n// special sampling used when zooming - extra zoom parameter and don't unscreen\nvec4 simple_sample_with_corners_from(vec2 p, vec2 corner_size, float zoom_amt) {\n  p = (p - 0.5) / (1.0 - zoom_amt + zoom * zoom_amt) + 0.5;\n  if (!test_rounded_mask(p, corner_size)) {\n    return black;\n  }\n  return getFromColor(p);\n}\n\nvec4 simple_sample_with_corners_to(vec2 p, vec2 corner_size, float zoom_amt) {\n  p = (p - 0.5) / (1.0 - zoom_amt + zoom * zoom_amt) + 0.5;\n  if (!test_rounded_mask(p, corner_size)) {\n    return black;\n  }\n  return getToColor(p);\n}\n\n// Basic 2D affine transform matrix helpers\n// These really shouldn't be used in a fragment shader - I should work out the\n// the math for a translate & rotate function as a pair of dot products instead\n\nmat3 rotate2d(float angle, float ratio) {\n  float s = sin(angle);\n  float c = cos(angle);\n  return mat3(\n    c, s ,0.0,\n    -s, c, 0.0,\n    0.0, 0.0, 1.0);\n}\n\nmat3 translate2d(float x, float y) {\n  return mat3(\n    1.0, 0.0, 0,\n    0.0, 1.0, 0,\n    -x, -y, 1.0);\n}\n\nmat3 scale2d(float x, float y) {\n  return mat3(\n    x, 0.0, 0,\n    0.0, y, 0,\n    0, 0, 1.0);\n}\n\n// Split an image and rotate one up and one down along off screen pivot points\nvec4 get_cross_rotated(vec3 p3, float angle, vec2 corner_size, float ratio) {\n  angle = angle * angle; // easing\n  angle /= 2.4; // works out to be a good number of radians\n\n  mat3 center_and_scale = translate2d(-0.5, -0.5) * scale2d(1.0, ratio);\n  mat3 unscale_and_uncenter = scale2d(1.0, 1.0/ratio) * translate2d(0.5,0.5);\n  mat3 slide_left = translate2d(-2.0,0.0);\n  mat3 slide_right = translate2d(2.0,0.0);\n  mat3 rotate = rotate2d(angle, ratio);\n\n  mat3 op_a = center_and_scale * slide_right * rotate * slide_left * unscale_and_uncenter;\n  mat3 op_b = center_and_scale * slide_left * rotate * slide_right * unscale_and_uncenter;\n\n  vec4 a = sample_with_corners_from((op_a * p3).xy, corner_size);\n  vec4 b = sample_with_corners_from((op_b * p3).xy, corner_size);\n\n  return screen(a, b);\n}\n\n// Image stays put, but this time move two masks\nvec4 get_cross_masked(vec3 p3, float angle, vec2 corner_size, float ratio) {\n  angle = 1.0 - angle;\n  angle = angle * angle; // easing\n  angle /= 2.4;\n\n  vec4 img;\n\n  mat3 center_and_scale = translate2d(-0.5, -0.5) * scale2d(1.0, ratio);\n  mat3 unscale_and_uncenter = scale2d(1.0 / zoom, 1.0 / (zoom * ratio)) * translate2d(0.5,0.5);\n  mat3 slide_left = translate2d(-2.0,0.0);\n  mat3 slide_right = translate2d(2.0,0.0);\n  mat3 rotate = rotate2d(angle, ratio);\n\n  mat3 op_a = center_and_scale * slide_right * rotate * slide_left * unscale_and_uncenter;\n  mat3 op_b = center_and_scale * slide_left * rotate * slide_right * unscale_and_uncenter;\n\n  bool mask_a = test_rounded_mask((op_a * p3).xy, corner_size);\n  bool mask_b = test_rounded_mask((op_b * p3).xy, corner_size);\n\n  if (mask_a || mask_b) {\n    img = sample_with_corners_to(p3.xy, corner_size);\n    return screen(mask_a ? img : black, mask_b ? img : black);\n  } else {\n    return black;\n  }\n}\n\nvec4 transition(vec2 uv) {\n  float a;\n  vec2 p=uv.xy/vec2(1.0).xy;\n  vec3 p3 = vec3(p.xy, 1.0); // for 2D matrix transforms\n\n  // corner is warped to represent to size after mapping to 1.0, 1.0\n  vec2 corner_size = vec2(corner_radius / ratio, corner_radius);\n\n  if (progress <= 0.0) {\n    // 0.0: start with the base frame always\n    return getFromColor(p);\n  } else if (progress < 0.1) {\n    // 0.0-0.1: zoom out and add rounded corners\n    a = progress / 0.1;\n    return  simple_sample_with_corners_from(p, corner_size * a, a);\n  } else if (progress < 0.48) {\n    // 0.1-0.48: Split original image apart\n    a = (progress - 0.1)/0.38;\n    return get_cross_rotated(p3, a, corner_size, ratio);\n  } else if (progress < 0.9) {\n    // 0.48-0.52: black\n    // 0.52 - 0.9: unmask new image\n    return get_cross_masked(p3, (progress - 0.52)/0.38, corner_size, ratio);\n  } else if (progress < 1.0) {\n    // zoom out and add rounded corners\n    a = (1.0 - progress) / 0.1;\n    return simple_sample_with_corners_to(p, corner_size * a, a);\n  } else {\n    // 1.0 end with base frame\n    return getToColor(p);\n  }\n}\n",
  //   author: 'Ted Schundler',
  //   license: 'BSD 2 Clause',
  //   createdAt: 'Tue, 20 Feb 2018 23:20:29 +0100',
  //   updatedAt: 'Wed, 21 Feb 2018 15:42:00 +0100',
  // },
  // swirl: {
  //   name: 'Swirl',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// License: MIT\n// Author: Sergey Kosarevsky\n// ( http://www.linderdaum.com )\n// ported by gre from https://gist.github.com/corporateshark/cacfedb8cca0f5ce3f7c\n\nvec4 transition(vec2 UV)\n{\n\tfloat Radius = 1.0;\n\n\tfloat T = progress;\n\n\tUV -= vec2( 0.5, 0.5 );\n\n\tfloat Dist = length(UV);\n\n\tif ( Dist < Radius )\n\t{\n\t\tfloat Percent = (Radius - Dist) / Radius;\n\t\tfloat A = ( T <= 0.5 ) ? mix( 0.0, 1.0, T/0.5 ) : mix( 1.0, 0.0, (T-0.5)/0.5 );\n\t\tfloat Theta = Percent * Percent * A * 8.0 * 3.14159;\n\t\tfloat S = sin( Theta );\n\t\tfloat C = cos( Theta );\n\t\tUV = vec2( dot(UV, vec2(C, -S)), dot(UV, vec2(S, C)) );\n\t}\n\tUV += vec2( 0.5, 0.5 );\n\n\tvec4 C0 = getFromColor(UV);\n\tvec4 C1 = getToColor(UV);\n\n\treturn mix( C0, C1, T );\n}\n',
  //   license: 'MIT',
  //   author: 'Sergey Kosarevsky',
  //   createdAt: 'Mon, 12 Jun 2017 12:38:27 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 12:38:27 +0800',
  // },
  // waterDrop: {
  //   name: 'WaterDrop',
  //   paramsTypes: {
  //     amplitude: 'float',
  //     speed: 'float',
  //   },
  //   defaultParams: {
  //     amplitude: 30,
  //     speed: 30,
  //   },
  //   glsl: '// author: Paweł Płóciennik\n// license: MIT\nuniform float amplitude; // = 30\nuniform float speed; // = 30\n\nvec4 transition(vec2 p) {\n  vec2 dir = p - vec2(.5);\n  float dist = length(dir);\n\n  if (dist > progress) {\n    return mix(getFromColor( p), getToColor( p), progress);\n  } else {\n    vec2 offset = dir * sin(dist * amplitude - progress * speed);\n    return mix(getFromColor( p + offset), getToColor( p), progress);\n  }\n}\n',
  //   author: 'Paweł Płóciennik',
  //   license: 'MIT',
  //   createdAt: 'Wed, 21 Feb 2018 19:37:15 +0100',
  //   updatedAt: 'Wed, 21 Feb 2018 19:37:15 +0100',
  // },
  // zoomInCircles: {
  //   name: 'ZoomInCircles',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// License: MIT\n// Author: dycm8009\n// ported by gre from https://gist.github.com/dycm8009/948e99b1800e81ad909a\n\nvec2 zoom(vec2 uv, float amount) {\n  return 0.5 + ((uv - 0.5) * amount);\t\n}\n\nvec2 ratio2 = vec2(1.0, 1.0 / ratio);\n\nvec4 transition(vec2 uv) {\n  // TODO: some timing are hardcoded but should be one or many parameters\n  // TODO: should also be able to configure how much circles\n  // TODO: if() branching should be avoided when possible, prefer use of step() & other functions\n  vec2 r = 2.0 * ((vec2(uv.xy) - 0.5) * ratio2);\n  float pro = progress / 0.8;\n  float z = pro * 0.2;\n  float t = 0.0;\n  if (pro > 1.0) {\n    z = 0.2 + (pro - 1.0) * 5.;\n    t = clamp((progress - 0.8) / 0.07, 0.0, 1.0);\n  }\n  if (length(r) < 0.5+z) {\n    // uv = zoom(uv, 0.9 - 0.1 * pro);\n  }\n  else if (length(r) < 0.8+z*1.5) {\n    uv = zoom(uv, 1.0 - 0.15 * pro);\n    t = t * 0.5;\n  }\n  else if (length(r) < 1.2+z*2.5) {\n    uv = zoom(uv, 1.0 - 0.2 * pro);\n    t = t * 0.2;\n  }\n  else {\n    uv = zoom(uv, 1.0 - 0.25 * pro);\n  }\n  return mix(getFromColor(uv), getToColor(uv), t);\n}\n',
  //   license: 'MIT',
  //   author: 'dycm8009',
  //   createdAt: 'Mon, 12 Jun 2017 11:24:34 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 11:24:34 +0800',
  // },
  // angular: {
  //   name: 'angular',
  //   paramsTypes: {
  //     startingAngle: 'float',
  //   },
  //   defaultParams: {
  //     startingAngle: 90,
  //   },
  //   glsl: '// Author: Fernando Kuteken\n// License: MIT\n\n#define PI 3.141592653589\n\nuniform float startingAngle; // = 90;\n\nvec4 transition (vec2 uv) {\n  \n  float offset = startingAngle * PI / 180.0;\n  float angle = atan(uv.y - 0.5, uv.x - 0.5) + offset;\n  float normalizedAngle = (angle + PI) / (2.0 * PI);\n  \n  normalizedAngle = normalizedAngle - floor(normalizedAngle);\n\n  return mix(\n    getFromColor(uv),\n    getToColor(uv),\n    step(normalizedAngle, progress)\n    );\n}\n',
  //   author: 'Fernando Kuteken',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // burn: {
  //   name: 'burn',
  //   paramsTypes: {
  //     color: 'vec3',
  //   },
  //   defaultParams: {
  //     color: [0.9, 0.4, 0.2],
  //   },
  //   glsl: '// author: gre\n// License: MIT\nuniform vec3 color /* = vec3(0.9, 0.4, 0.2) */;\nvec4 transition (vec2 uv) {\n  return mix(\n    getFromColor(uv) + vec4(progress*color, 1.0),\n    getToColor(uv) + vec4((1.0-progress)*color, 1.0),\n    progress\n  );\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // cannabisleaf: {
  //   name: 'cannabisleaf',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: @Flexi23\n// License: MIT\n\n// inspired by http://www.wolframalpha.com/input/?i=cannabis+curve\n\nvec4 transition (vec2 uv) {\n  if(progress == 0.0){\n    return getFromColor(uv);\n  }\n  vec2 leaf_uv = (uv - vec2(0.5))/10./pow(progress,3.5);\n\tleaf_uv.y += 0.35;\n\tfloat r = 0.18;\n\tfloat o = atan(leaf_uv.y, leaf_uv.x);\n  return mix(getFromColor(uv), getToColor(uv), 1.-step(1. - length(leaf_uv)+r*(1.+sin(o))*(1.+0.9 * cos(8.*o))*(1.+0.1*cos(24.*o))*(0.9+0.05*cos(200.*o)), 1.));\n}\n',
  //   author: '@Flexi23',
  //   license: 'MIT',
  //   createdAt: 'Thu, 1 Jun 2017 15:58:58 +0200',
  //   updatedAt: 'Thu, 1 Jun 2017 15:58:58 +0200',
  // },
  // circle: {
  //   name: 'circle',
  //   paramsTypes: {
  //     center: 'vec2',
  //     backColor: 'vec3',
  //   },
  //   defaultParams: {
  //     center: [0.5, 0.5],
  //     backColor: [0.1, 0.1, 0.1],
  //   },
  //   glsl: '// Author: Fernando Kuteken\n// License: MIT\n\nuniform vec2 center; // = vec2(0.5, 0.5);\nuniform vec3 backColor; // = vec3(0.1, 0.1, 0.1);\n\nvec4 transition (vec2 uv) {\n  \n  float distance = length(uv - center);\n  float radius = sqrt(8.0) * abs(progress - 0.5);\n  \n  if (distance > radius) {\n    return vec4(backColor, 1.0);\n  }\n  else {\n    if (progress < 0.5) return getFromColor(uv);\n    else return getToColor(uv);\n  }\n}\n',
  //   author: 'Fernando Kuteken',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // circleopen: {
  //   name: 'circleopen',
  //   paramsTypes: {
  //     smoothness: 'float',
  //     opening: 'bool',
  //   },
  //   defaultParams: {
  //     smoothness: 0.3,
  //     opening: true,
  //   },
  //   glsl: '// author: gre\n// License: MIT\nuniform float smoothness; // = 0.3\nuniform bool opening; // = true\n\nconst vec2 center = vec2(0.5, 0.5);\nconst float SQRT_2 = 1.414213562373;\n\nvec4 transition (vec2 uv) {\n  float x = opening ? progress : 1.-progress;\n  float m = smoothstep(-smoothness, 0.0, SQRT_2*distance(center, uv) - x*(1.+smoothness));\n  return mix(getFromColor(uv), getToColor(uv), opening ? 1.-m : m);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // colorphase: {
  //   name: 'colorphase',
  //   paramsTypes: {
  //     fromStep: 'vec4',
  //     toStep: 'vec4',
  //   },
  //   defaultParams: {
  //     fromStep: [0, 0.2, 0.4, 0],
  //     toStep: [0.6, 0.8, 1, 1],
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n\n// Usage: fromStep and toStep must be in [0.0, 1.0] range \n// and all(fromStep) must be < all(toStep)\n\nuniform vec4 fromStep; // = vec4(0.0, 0.2, 0.4, 0.0)\nuniform vec4 toStep; // = vec4(0.6, 0.8, 1.0, 1.0)\n\nvec4 transition (vec2 uv) {\n  vec4 a = getFromColor(uv);\n  vec4 b = getToColor(uv);\n  return mix(a, b, smoothstep(fromStep, toStep, vec4(progress)));\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // crosshatch: {
  //   name: 'crosshatch',
  //   paramsTypes: {
  //     center: 'vec2',
  //     threshold: 'float',
  //     fadeEdge: 'float',
  //   },
  //   defaultParams: {
  //     center: [0.5, 0.5],
  //     threshold: 3,
  //     fadeEdge: 0.1,
  //   },
  //   glsl: '// License: MIT\n// Author: pthrasher\n// adapted by gre from https://gist.github.com/pthrasher/04fd9a7de4012cbb03f6\n\nuniform vec2 center; // = vec2(0.5)\nuniform float threshold; // = 3.0\nuniform float fadeEdge; // = 0.1\n\nfloat rand(vec2 co) {\n  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\nvec4 transition(vec2 p) {\n  float dist = distance(center, p) / threshold;\n  float r = progress - min(rand(vec2(p.y, 0.0)), rand(vec2(0.0, p.x)));\n  return mix(getFromColor(p), getToColor(p), mix(0.0, mix(step(dist, r), 1.0, smoothstep(1.0-fadeEdge, 1.0, progress)), smoothstep(0.0, fadeEdge, progress)));    \n}\n',
  //   license: 'MIT',
  //   author: 'pthrasher',
  //   createdAt: 'Mon, 12 Jun 2017 10:02:12 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 10:02:12 +0800',
  // },
  // crosswarp: {
  //   name: 'crosswarp',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: Eke Péter <peterekepeter@gmail.com>\n// License: MIT\nvec4 transition(vec2 p) {\n  float x = progress;\n  x=smoothstep(.0,1.0,(x*2.0+p.x-1.0));\n  return mix(getFromColor((p-.5)*(1.-x)+.5), getToColor((p-.5)*x+.5), x);\n}\n',
  //   author: 'Eke Péter <peterekepeter@gmail.com>',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // cube: {
  //   name: 'cube',
  //   paramsTypes: {
  //     persp: 'float',
  //     unzoom: 'float',
  //     reflection: 'float',
  //     floating: 'float',
  //   },
  //   defaultParams: {
  //     persp: 0.7,
  //     unzoom: 0.3,
  //     reflection: 0.4,
  //     floating: 3,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\nuniform float persp; // = 0.7\nuniform float unzoom; // = 0.3\nuniform float reflection; // = 0.4\nuniform float floating; // = 3.0\n\nvec2 project (vec2 p) {\n  return p * vec2(1.0, -1.2) + vec2(0.0, -floating/100.);\n}\n\nbool inBounds (vec2 p) {\n  return all(lessThan(vec2(0.0), p)) && all(lessThan(p, vec2(1.0)));\n}\n\nvec4 bgColor (vec2 p, vec2 pfr, vec2 pto) {\n  vec4 c = vec4(0.0, 0.0, 0.0, 1.0);\n  pfr = project(pfr);\n  // FIXME avoid branching might help perf!\n  if (inBounds(pfr)) {\n    c += mix(vec4(0.0), getFromColor(pfr), reflection * mix(1.0, 0.0, pfr.y));\n  }\n  pto = project(pto);\n  if (inBounds(pto)) {\n    c += mix(vec4(0.0), getToColor(pto), reflection * mix(1.0, 0.0, pto.y));\n  }\n  return c;\n}\n\n// p : the position\n// persp : the perspective in [ 0, 1 ]\n// center : the xcenter in [0, 1] \\ 0.5 excluded\nvec2 xskew (vec2 p, float persp, float center) {\n  float x = mix(p.x, 1.0-p.x, center);\n  return (\n    (\n      vec2( x, (p.y - 0.5*(1.0-persp) * x) / (1.0+(persp-1.0)*x) )\n      - vec2(0.5-distance(center, 0.5), 0.0)\n    )\n    * vec2(0.5 / distance(center, 0.5) * (center<0.5 ? 1.0 : -1.0), 1.0)\n    + vec2(center<0.5 ? 0.0 : 1.0, 0.0)\n  );\n}\n\nvec4 transition(vec2 op) {\n  float uz = unzoom * 2.0*(0.5-distance(0.5, progress));\n  vec2 p = -uz*0.5+(1.0+uz) * op;\n  vec2 fromP = xskew(\n    (p - vec2(progress, 0.0)) / vec2(1.0-progress, 1.0),\n    1.0-mix(progress, 0.0, persp),\n    0.0\n  );\n  vec2 toP = xskew(\n    p / vec2(progress, 1.0),\n    mix(pow(progress, 2.0), 1.0, persp),\n    1.0\n  );\n  // FIXME avoid branching might help perf!\n  if (inBounds(fromP)) {\n    return getFromColor(fromP);\n  }\n  else if (inBounds(toP)) {\n    return getToColor(toP);\n  }\n  return bgColor(op, fromP, toP);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // directionalwarp: {
  //   name: 'directionalwarp',
  //   paramsTypes: {
  //     direction: 'vec2',
  //   },
  //   defaultParams: {
  //     direction: [-1, 1],
  //   },
  //   glsl: '// Author: pschroen\n// License: MIT\n\nuniform vec2 direction; // = vec2(-1.0, 1.0)\n\nconst float smoothness = 0.5;\nconst vec2 center = vec2(0.5, 0.5);\n\nvec4 transition (vec2 uv) {\n  vec2 v = normalize(direction);\n  v /= abs(v.x) + abs(v.y);\n  float d = v.x * center.x + v.y * center.y;\n  float m = 1.0 - smoothstep(-smoothness, 0.0, v.x * uv.x + v.y * uv.y - (d - 0.5 + progress * (1.0 + smoothness)));\n  return mix(getFromColor((uv - 0.5) * (1.0 - m) + 0.5), getToColor((uv - 0.5) * m + 0.5), m);\n}\n',
  //   author: 'pschroen',
  //   license: 'MIT',
  //   createdAt: 'Wed, 13 Dec 2017 12:08:49 -0500',
  //   updatedAt: 'Wed, 13 Dec 2017 12:08:49 -0500',
  // },
  // directionalwipe: {
  //   name: 'directionalwipe',
  //   paramsTypes: {
  //     direction: 'vec2',
  //     smoothness: 'float',
  //   },
  //   defaultParams: {
  //     direction: [1, -1],
  //     smoothness: 0.5,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n\nuniform vec2 direction; // = vec2(1.0, -1.0)\nuniform float smoothness; // = 0.5\n \nconst vec2 center = vec2(0.5, 0.5);\n \nvec4 transition (vec2 uv) {\n  vec2 v = normalize(direction);\n  v /= abs(v.x)+abs(v.y);\n  float d = v.x * center.x + v.y * center.y;\n  float m =\n    (1.0-step(progress, 0.0)) * // there is something wrong with our formula that makes m not equals 0.0 with progress is 0.0\n    (1.0 - smoothstep(-smoothness, 0.0, v.x * uv.x + v.y * uv.y - (d-0.5+progress*(1.+smoothness))));\n  return mix(getFromColor(uv), getToColor(uv), m);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // displacement: {
  //   name: 'displacement',
  //   paramsTypes: {
  //     displacementMap: 'sampler2D',
  //     strength: 'float',
  //   },
  //   defaultParams: {
  //     displacementMap: null,
  //     strength: 0.5,
  //   },
  //   glsl: '// Author: Travis Fischer\n// License: MIT\n//\n// Adapted from a Codrops article by Robin Delaporte\n// https://tympanus.net/Development/DistortionHoverEffect\n\nuniform sampler2D displacementMap;\n\nuniform float strength; // = 0.5\n\nvec4 transition (vec2 uv) {\n  float displacement = texture2D(displacementMap, uv).r * strength;\n\n  vec2 uvFrom = vec2(uv.x + progress * displacement, uv.y);\n  vec2 uvTo = vec2(uv.x - (1.0 - progress) * displacement, uv.y);\n\n  return mix(\n    getFromColor(uvFrom),\n    getToColor(uvTo),\n    progress\n  );\n}\n',
  //   author: 'Travis Fischer',
  //   license: 'MIT',
  //   createdAt: 'Tue, 10 Apr 2018 23:03:38 -0400',
  //   updatedAt: 'Tue, 10 Apr 2018 23:03:38 -0400',
  // },
  // doorway: {
  //   name: 'doorway',
  //   paramsTypes: {
  //     reflection: 'float',
  //     perspective: 'float',
  //     depth: 'float',
  //   },
  //   defaultParams: {
  //     reflection: 0.4,
  //     perspective: 0.4,
  //     depth: 3,
  //   },
  //   glsl: '// author: gre\n// License: MIT \nuniform float reflection; // = 0.4\nuniform float perspective; // = 0.4\nuniform float depth; // = 3\n\nconst vec4 black = vec4(0.0, 0.0, 0.0, 1.0);\nconst vec2 boundMin = vec2(0.0, 0.0);\nconst vec2 boundMax = vec2(1.0, 1.0);\n\nbool inBounds (vec2 p) {\n  return all(lessThan(boundMin, p)) && all(lessThan(p, boundMax));\n}\n\nvec2 project (vec2 p) {\n  return p * vec2(1.0, -1.2) + vec2(0.0, -0.02);\n}\n\nvec4 bgColor (vec2 p, vec2 pto) {\n  vec4 c = black;\n  pto = project(pto);\n  if (inBounds(pto)) {\n    c += mix(black, getToColor(pto), reflection * mix(1.0, 0.0, pto.y));\n  }\n  return c;\n}\n\n\nvec4 transition (vec2 p) {\n  vec2 pfr = vec2(-1.), pto = vec2(-1.);\n  float middleSlit = 2.0 * abs(p.x-0.5) - progress;\n  if (middleSlit > 0.0) {\n    pfr = p + (p.x > 0.5 ? -1.0 : 1.0) * vec2(0.5*progress, 0.0);\n    float d = 1.0/(1.0+perspective*progress*(1.0-middleSlit));\n    pfr.y -= d/2.;\n    pfr.y *= d;\n    pfr.y += d/2.;\n  }\n  float size = mix(1.0, depth, 1.-progress);\n  pto = (p + vec2(-0.5, -0.5)) * vec2(size, size) + vec2(0.5, 0.5);\n  if (inBounds(pfr)) {\n    return getFromColor(pfr);\n  }\n  else if (inBounds(pto)) {\n    return getToColor(pto);\n  }\n  else {\n    return bgColor(p, pto);\n  }\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // fade: {
  //   name: 'fade',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// author: gre\n// license: MIT\n\nvec4 transition (vec2 uv) {\n  return mix(\n    getFromColor(uv),\n    getToColor(uv),\n    progress\n  );\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // fadecolor: {
  //   name: 'fadecolor',
  //   paramsTypes: {
  //     color: 'vec3',
  //     colorPhase: 'float',
  //   },
  //   defaultParams: {
  //     color: [0, 0, 0],
  //     colorPhase: 0.4,
  //   },
  //   glsl: '// author: gre\n// License: MIT\nuniform vec3 color;// = vec3(0.0)\nuniform float colorPhase/* = 0.4 */; // if 0.0, there is no black phase, if 0.9, the black phase is very important\nvec4 transition (vec2 uv) {\n  return mix(\n    mix(vec4(color, 1.0), getFromColor(uv), smoothstep(1.0-colorPhase, 0.0, progress)),\n    mix(vec4(color, 1.0), getToColor(uv), smoothstep(    colorPhase, 1.0, progress)),\n    progress);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // fadegrayscale: {
  //   name: 'fadegrayscale',
  //   paramsTypes: {
  //     intensity: 'float',
  //   },
  //   defaultParams: {
  //     intensity: 0.3,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n\nuniform float intensity; // = 0.3; // if 0.0, the image directly turn grayscale, if 0.9, the grayscale transition phase is very important\n \nvec3 grayscale (vec3 color) {\n  return vec3(0.2126*color.r + 0.7152*color.g + 0.0722*color.b);\n}\n \nvec4 transition (vec2 uv) {\n  vec4 fc = getFromColor(uv);\n  vec4 tc = getToColor(uv);\n  return mix(\n    mix(vec4(grayscale(fc.rgb), 1.0), fc, smoothstep(1.0-intensity, 0.0, progress)),\n    mix(vec4(grayscale(tc.rgb), 1.0), tc, smoothstep(    intensity, 1.0, progress)),\n    progress);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // flyeye: {
  //   name: 'flyeye',
  //   paramsTypes: {
  //     size: 'float',
  //     zoom: 'float',
  //     colorSeparation: 'float',
  //   },
  //   defaultParams: {
  //     size: 0.04,
  //     zoom: 50,
  //     colorSeparation: 0.3,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\nuniform float size; // = 0.04\nuniform float zoom; // = 50.0\nuniform float colorSeparation; // = 0.3\n\nvec4 transition(vec2 p) {\n  float inv = 1. - progress;\n  vec2 disp = size*vec2(cos(zoom*p.x), sin(zoom*p.y));\n  vec4 texTo = getToColor(p + inv*disp);\n  vec4 texFrom = vec4(\n    getFromColor(p + progress*disp*(1.0 - colorSeparation)).r,\n    getFromColor(p + progress*disp).g,\n    getFromColor(p + progress*disp*(1.0 + colorSeparation)).b,\n    1.0);\n  return texTo*progress + texFrom*inv;\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // heart: {
  //   name: 'heart',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: gre\n// License: MIT\n\nfloat inHeart (vec2 p, vec2 center, float size) {\n  if (size==0.0) return 0.0;\n  vec2 o = (p-center)/(1.6*size);\n  float a = o.x*o.x+o.y*o.y-0.3;\n  return step(a*a*a, o.x*o.x*o.y*o.y*o.y);\n}\nvec4 transition (vec2 uv) {\n  return mix(\n    getFromColor(uv),\n    getToColor(uv),\n    inHeart(uv, vec2(0.5, 0.4), progress)\n  );\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // hexagonalize: {
  //   name: 'hexagonalize',
  //   paramsTypes: {
  //     steps: 'int',
  //     horizontalHexagons: 'float',
  //   },
  //   defaultParams: {
  //     steps: 50,
  //     horizontalHexagons: 20,
  //   },
  //   glsl: '// Author: Fernando Kuteken\n// License: MIT\n// Hexagonal math from: http://www.redblobgames.com/grids/hexagons/\n\nuniform int steps; // = 50;\nuniform float horizontalHexagons; //= 20;\n\nstruct Hexagon {\n  float q;\n  float r;\n  float s;\n};\n\nHexagon createHexagon(float q, float r){\n  Hexagon hex;\n  hex.q = q;\n  hex.r = r;\n  hex.s = -q - r;\n  return hex;\n}\n\nHexagon roundHexagon(Hexagon hex){\n  \n  float q = floor(hex.q + 0.5);\n  float r = floor(hex.r + 0.5);\n  float s = floor(hex.s + 0.5);\n\n  float deltaQ = abs(q - hex.q);\n  float deltaR = abs(r - hex.r);\n  float deltaS = abs(s - hex.s);\n\n  if (deltaQ > deltaR && deltaQ > deltaS)\n    q = -r - s;\n  else if (deltaR > deltaS)\n    r = -q - s;\n  else\n    s = -q - r;\n\n  return createHexagon(q, r);\n}\n\nHexagon hexagonFromPoint(vec2 point, float size) {\n  \n  point.y /= ratio;\n  point = (point - 0.5) / size;\n  \n  float q = (sqrt(3.0) / 3.0) * point.x + (-1.0 / 3.0) * point.y;\n  float r = 0.0 * point.x + 2.0 / 3.0 * point.y;\n\n  Hexagon hex = createHexagon(q, r);\n  return roundHexagon(hex);\n  \n}\n\nvec2 pointFromHexagon(Hexagon hex, float size) {\n  \n  float x = (sqrt(3.0) * hex.q + (sqrt(3.0) / 2.0) * hex.r) * size + 0.5;\n  float y = (0.0 * hex.q + (3.0 / 2.0) * hex.r) * size + 0.5;\n  \n  return vec2(x, y * ratio);\n}\n\nvec4 transition (vec2 uv) {\n  \n  float dist = 2.0 * min(progress, 1.0 - progress);\n  dist = steps > 0 ? ceil(dist * float(steps)) / float(steps) : dist;\n  \n  float size = (sqrt(3.0) / 3.0) * dist / horizontalHexagons;\n  \n  vec2 point = dist > 0.0 ? pointFromHexagon(hexagonFromPoint(uv, size), size) : uv;\n\n  return mix(getFromColor(point), getToColor(point), progress);\n  \n}\n',
  //   author: 'Fernando Kuteken',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 21:55:47 -0300',
  //   updatedAt: 'Tue, 30 May 2017 21:55:47 -0300',
  // },
  // kaleidoscope: {
  //   name: 'kaleidoscope',
  //   paramsTypes: {
  //     speed: 'float',
  //     angle: 'float',
  //     power: 'float',
  //   },
  //   defaultParams: {
  //     speed: 1,
  //     angle: 1,
  //     power: 1.5,
  //   },
  //   glsl: '// Author: nwoeanhinnogaehr\n// License: MIT\n\nuniform float speed; // = 1.0;\nuniform float angle; // = 1.0;\nuniform float power; // = 1.5;\n\nvec4 transition(vec2 uv) {\n  vec2 p = uv.xy / vec2(1.0).xy;\n  vec2 q = p;\n  float t = pow(progress, power)*speed;\n  p = p -0.5;\n  for (int i = 0; i < 7; i++) {\n    p = vec2(sin(t)*p.x + cos(t)*p.y, sin(t)*p.y - cos(t)*p.x);\n    t += angle;\n    p = abs(mod(p, 2.0) - 1.0);\n  }\n  abs(mod(p, 1.0));\n  return mix(\n    mix(getFromColor(q), getToColor(q), progress),\n    mix(getFromColor(p), getToColor(p), progress), 1.0 - 2.0*abs(progress - 0.5));\n}\n',
  //   author: 'nwoeanhinnogaehr',
  //   license: 'MIT',
  //   createdAt: 'Wed, 31 May 2017 21:48:26 -0400',
  //   updatedAt: 'Wed, 31 May 2017 21:48:26 -0400',
  // },
  // luma: {
  //   name: 'luma',
  //   paramsTypes: {
  //     luma: 'sampler2D',
  //   },
  //   defaultParams: {
  //     luma: null,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n\nuniform sampler2D luma;\n\nvec4 transition(vec2 uv) {\n  return mix(\n    getToColor(uv),\n    getFromColor(uv),\n    step(progress, texture2D(luma, uv).r)\n  );\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // luminanceMelt: {
  //   name: 'luminance_melt',
  //   paramsTypes: {
  //     direction: 'bool',
  //     l_threshold: 'float',
  //     above: 'bool',
  //   },
  //   defaultParams: {
  //     direction: true,
  //     l_threshold: 0.8,
  //     above: false,
  //   },
  //   glsl: '// Author: 0gust1\n// License: MIT\n//My own first transition — based on crosshatch code (from pthrasher), using  simplex noise formula (copied and pasted)\n//-> cooler with high contrasted images (isolated dark subject on light background f.e.)\n//TODO : try to rebase it on DoomTransition (from zeh)?\n//optimizations :\n//luminance (see http://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color#answer-596241)\n// Y = (R+R+B+G+G+G)/6\n//or Y = (R+R+R+B+G+G+G+G)>>3 \n\n\n//direction of movement :  0 : up, 1, down\nuniform bool direction; // = 1 \n//luminance threshold\nuniform float l_threshold; // = 0.8 \n//does the movement takes effect above or below luminance threshold ?\nuniform bool above; // = false \n\n\n//Random function borrowed from everywhere\nfloat rand(vec2 co){\n  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\n\n// Simplex noise :\n// Description : Array and textureless GLSL 2D simplex noise function.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : ijm\n//     Lastmod : 20110822 (ijm)\n//     License : MIT  \n//               2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               https://github.com/ashima/webgl-noise\n// \n\nvec3 mod289(vec3 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec2 mod289(vec2 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec3 permute(vec3 x) {\n  return mod289(((x*34.0)+1.0)*x);\n}\n\nfloat snoise(vec2 v)\n  {\n  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0\n                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)\n                     -0.577350269189626,  // -1.0 + 2.0 * C.x\n                      0.024390243902439); // 1.0 / 41.0\n// First corner\n  vec2 i  = floor(v + dot(v, C.yy) );\n  vec2 x0 = v -   i + dot(i, C.xx);\n\n// Other corners\n  vec2 i1;\n  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0\n  //i1.y = 1.0 - i1.x;\n  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n  // x0 = x0 - 0.0 + 0.0 * C.xx ;\n  // x1 = x0 - i1 + 1.0 * C.xx ;\n  // x2 = x0 - 1.0 + 2.0 * C.xx ;\n  vec4 x12 = x0.xyxy + C.xxzz;\n  x12.xy -= i1;\n\n// Permutations\n  i = mod289(i); // Avoid truncation effects in permutation\n  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))\n\t\t+ i.x + vec3(0.0, i1.x, 1.0 ));\n\n  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);\n  m = m*m ;\n  m = m*m ;\n\n// Gradients: 41 points uniformly over a line, mapped onto a diamond.\n// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)\n\n  vec3 x = 2.0 * fract(p * C.www) - 1.0;\n  vec3 h = abs(x) - 0.5;\n  vec3 ox = floor(x + 0.5);\n  vec3 a0 = x - ox;\n\n// Normalise gradients implicitly by scaling m\n// Approximation of: m *= inversesqrt( a0*a0 + h*h );\n  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n\n// Compute final noise value at P\n  vec3 g;\n  g.x  = a0.x  * x0.x  + h.x  * x0.y;\n  g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n  return 130.0 * dot(m, g);\n}\n\n// Simplex noise -- end\n\nfloat luminance(vec4 color){\n  //(0.299*R + 0.587*G + 0.114*B)\n  return color.r*0.299+color.g*0.587+color.b*0.114;\n}\n\nvec2 center = vec2(1.0, direction);\n\nvec4 transition(vec2 uv) {\n  vec2 p = uv.xy / vec2(1.0).xy;\n  if (progress == 0.0) {\n    return getFromColor(p);\n  } else if (progress == 1.0) {\n    return getToColor(p);\n  } else {\n    float x = progress;\n    float dist = distance(center, p)- progress*exp(snoise(vec2(p.x, 0.0)));\n    float r = x - rand(vec2(p.x, 0.1));\n    float m;\n    if(above){\n     m = dist <= r && luminance(getFromColor(p))>l_threshold ? 1.0 : (progress*progress*progress);\n    }\n    else{\n     m = dist <= r && luminance(getFromColor(p))<l_threshold ? 1.0 : (progress*progress*progress);  \n    }\n    return mix(getFromColor(p), getToColor(p), m);    \n  }\n}\n',
  //   author: '0gust1',
  //   license: 'MIT',
  //   createdAt: 'Wed, 24 Jan 2018 19:02:32 +0100',
  //   updatedAt: 'Wed, 24 Jan 2018 19:02:32 +0100',
  // },
  // morph: {
  //   name: 'morph',
  //   paramsTypes: {
  //     strength: 'float',
  //   },
  //   defaultParams: {
  //     strength: 0.1,
  //   },
  //   glsl: '// Author: paniq\n// License: MIT\nuniform float strength; // = 0.1\n\nvec4 transition(vec2 p) {\n  vec4 ca = getFromColor(p);\n  vec4 cb = getToColor(p);\n  \n  vec2 oa = (((ca.rg+ca.b)*0.5)*2.0-1.0);\n  vec2 ob = (((cb.rg+cb.b)*0.5)*2.0-1.0);\n  vec2 oc = mix(oa,ob,0.5)*strength;\n  \n  float w0 = progress;\n  float w1 = 1.0-w0;\n  return mix(getFromColor(p+oc*w0), getToColor(p-oc*w1), progress);\n}\n',
  //   author: 'paniq',
  //   license: 'MIT',
  //   createdAt: 'Thu, 10 Aug 2017 00:27:36 +0200',
  //   updatedAt: 'Thu, 10 Aug 2017 00:32:01 +0200',
  // },
  // multiplyBlend: {
  //   name: 'multiply_blend',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: Fernando Kuteken\n// License: MIT\n\nvec4 blend(vec4 a, vec4 b) {\n  return a * b;\n}\n\nvec4 transition (vec2 uv) {\n  \n  vec4 blended = blend(getFromColor(uv), getToColor(uv));\n  \n  if (progress < 0.5)\n    return mix(getFromColor(uv), blended, 2.0 * progress);\n  else\n    return mix(blended, getToColor(uv), 2.0 * progress - 1.0);\n}\n\n',
  //   author: 'Fernando Kuteken',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // perlin: {
  //   name: 'perlin',
  //   paramsTypes: {
  //     scale: 'float',
  //     smoothness: 'float',
  //     seed: 'float',
  //   },
  //   defaultParams: {
  //     scale: 4,
  //     smoothness: 0.01,
  //     seed: 12.9898,
  //   },
  //   glsl: '// Author: Rich Harris\n// License: MIT\n\n#ifdef GL_ES\nprecision mediump float;\n#endif\n\nuniform float scale; // = 4.0\nuniform float smoothness; // = 0.01\n\nuniform float seed; // = 12.9898\n\n// http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/\nfloat random(vec2 co)\n{\n    highp float a = seed;\n    highp float b = 78.233;\n    highp float c = 43758.5453;\n    highp float dt= dot(co.xy ,vec2(a,b));\n    highp float sn= mod(dt,3.14);\n    return fract(sin(sn) * c);\n}\n\n// 2D Noise based on Morgan McGuire @morgan3d\n// https://www.shadertoy.com/view/4dS3Wd\nfloat noise (in vec2 st) {\n    vec2 i = floor(st);\n    vec2 f = fract(st);\n\n    // Four corners in 2D of a tile\n    float a = random(i);\n    float b = random(i + vec2(1.0, 0.0));\n    float c = random(i + vec2(0.0, 1.0));\n    float d = random(i + vec2(1.0, 1.0));\n\n    // Smooth Interpolation\n\n    // Cubic Hermine Curve.  Same as SmoothStep()\n    vec2 u = f*f*(3.0-2.0*f);\n    // u = smoothstep(0.,1.,f);\n\n    // Mix 4 coorners porcentages\n    return mix(a, b, u.x) +\n            (c - a)* u.y * (1.0 - u.x) +\n            (d - b) * u.x * u.y;\n}\n\nvec4 transition (vec2 uv) {\n  vec4 from = getFromColor(uv);\n  vec4 to = getToColor(uv);\n  float n = noise(uv * scale);\n  \n  float p = mix(-smoothness, 1.0 + smoothness, progress);\n  float lower = p - smoothness;\n  float higher = p + smoothness;\n  \n  float q = smoothstep(lower, higher, n);\n  \n  return mix(\n    from,\n    to,\n    1.0 - q\n  );\n}\n',
  //   author: 'Rich Harris',
  //   license: 'MIT',
  //   createdAt: 'Tue, 23 Jan 2018 21:35:10 -0500',
  //   updatedAt: 'Wed, 24 Jan 2018 07:35:04 -0500',
  // },
  // pinwheel: {
  //   name: 'pinwheel',
  //   paramsTypes: {
  //     speed: 'float',
  //   },
  //   defaultParams: {
  //     speed: 2,
  //   },
  //   glsl: '// Author: Mr Speaker\n// License: MIT\n\nuniform float speed; // = 2.0;\n\nvec4 transition(vec2 uv) {\n  \n  vec2 p = uv.xy / vec2(1.0).xy;\n  \n  float circPos = atan(p.y - 0.5, p.x - 0.5) + progress * speed;\n  float modPos = mod(circPos, 3.1415 / 4.);\n  float signed = sign(progress - modPos);\n  \n  return mix(getToColor(p), getFromColor(p), step(signed, 0.5));\n  \n}\n',
  //   author: 'Mr Speaker',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 09:04:31 -0400',
  //   updatedAt: 'Tue, 30 May 2017 09:04:31 -0400',
  // },
  // pixelize: {
  //   name: 'pixelize',
  //   paramsTypes: {
  //     squaresMin: 'ivec2',
  //     steps: 'int',
  //   },
  //   defaultParams: {
  //     squaresMin: [20, 20],
  //     steps: 50,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n// forked from https://gist.github.com/benraziel/c528607361d90a072e98\n\nuniform ivec2 squaresMin/* = ivec2(20) */; // minimum number of squares (when the effect is at its higher level)\nuniform int steps /* = 50 */; // zero disable the stepping\n\nfloat d = min(progress, 1.0 - progress);\nfloat dist = steps>0 ? ceil(d * float(steps)) / float(steps) : d;\nvec2 squareSize = 2.0 * dist / vec2(squaresMin);\n\nvec4 transition(vec2 uv) {\n  vec2 p = dist>0.0 ? (floor(uv / squareSize) + 0.5) * squareSize : uv;\n  return mix(getFromColor(p), getToColor(p), progress);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Wed, 31 May 2017 10:58:26 +0200',
  // },
  // polarFunction: {
  //   name: 'polar_function',
  //   paramsTypes: {
  //     segments: 'int',
  //   },
  //   defaultParams: {
  //     segments: 5,
  //   },
  //   glsl: '// Author: Fernando Kuteken\n// License: MIT\n\n#define PI 3.14159265359\n\nuniform int segments; // = 5;\n\nvec4 transition (vec2 uv) {\n  \n  float angle = atan(uv.y - 0.5, uv.x - 0.5) - 0.5 * PI;\n  float normalized = (angle + 1.5 * PI) * (2.0 * PI);\n  \n  float radius = (cos(float(segments) * angle) + 4.0) / 4.0;\n  float difference = length(uv - vec2(0.5, 0.5));\n  \n  if (difference > radius * progress)\n    return getFromColor(uv);\n  else\n    return getToColor(uv);\n}\n',
  //   author: 'Fernando Kuteken',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // randomsquares: {
  //   name: 'randomsquares',
  //   paramsTypes: {
  //     size: 'ivec2',
  //     smoothness: 'float',
  //   },
  //   defaultParams: {
  //     size: [10, 10],
  //     smoothness: 0.5,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n\nuniform ivec2 size; // = ivec2(10, 10)\nuniform float smoothness; // = 0.5\n \nfloat rand (vec2 co) {\n  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nvec4 transition(vec2 p) {\n  float r = rand(floor(vec2(size) * p));\n  float m = smoothstep(0.0, -smoothness, r - (progress * (1.0 + smoothness)));\n  return mix(getFromColor(p), getToColor(p), m);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // ripple: {
  //   name: 'ripple',
  //   paramsTypes: {
  //     amplitude: 'float',
  //     speed: 'float',
  //   },
  //   defaultParams: {
  //     amplitude: 100,
  //     speed: 50,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\nuniform float amplitude; // = 100.0\nuniform float speed; // = 50.0\n\nvec4 transition (vec2 uv) {\n  vec2 dir = uv - vec2(.5);\n  float dist = length(dir);\n  vec2 offset = dir * (sin(progress * dist * amplitude - progress * speed) + .5) / 30.;\n  return mix(\n    getFromColor(uv + offset),\n    getToColor(uv),\n    smoothstep(0.2, 1.0, progress)\n  );\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 15:15:27 +0200',
  //   updatedAt: 'Tue, 30 May 2017 15:15:27 +0200',
  // },
  // rotateScaleFade: {
  //   name: 'rotate_scale_fade',
  //   paramsTypes: {
  //     center: 'vec2',
  //     rotations: 'float',
  //     scale: 'float',
  //     backColor: 'vec4',
  //   },
  //   defaultParams: {
  //     center: [0.5, 0.5],
  //     rotations: 1,
  //     scale: 8,
  //     backColor: [0.15, 0.15, 0.15, 1],
  //   },
  //   glsl: '// Author: Fernando Kuteken\n// License: MIT\n\n#define PI 3.14159265359\n\nuniform vec2 center; // = vec2(0.5, 0.5);\nuniform float rotations; // = 1;\nuniform float scale; // = 8;\nuniform vec4 backColor; // = vec4(0.15, 0.15, 0.15, 1.0);\n\nvec4 transition (vec2 uv) {\n  \n  vec2 difference = uv - center;\n  vec2 dir = normalize(difference);\n  float dist = length(difference);\n  \n  float angle = 2.0 * PI * rotations * progress;\n  \n  float c = cos(angle);\n  float s = sin(angle);\n  \n  float currentScale = mix(scale, 1.0, 2.0 * abs(progress - 0.5));\n  \n  vec2 rotatedDir = vec2(dir.x  * c - dir.y * s, dir.x * s + dir.y * c);\n  vec2 rotatedUv = center + rotatedDir * dist / currentScale;\n  \n  if (rotatedUv.x < 0.0 || rotatedUv.x > 1.0 ||\n      rotatedUv.y < 0.0 || rotatedUv.y > 1.0)\n    return backColor;\n    \n  return mix(getFromColor(rotatedUv), getToColor(rotatedUv), progress);\n}\n',
  //   author: 'Fernando Kuteken',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // squareswire: {
  //   name: 'squareswire',
  //   paramsTypes: {
  //     squares: 'ivec2',
  //     direction: 'vec2',
  //     smoothness: 'float',
  //   },
  //   defaultParams: {
  //     squares: [10, 10],
  //     direction: [1, -0.5],
  //     smoothness: 1.6,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n \nuniform ivec2 squares;// = ivec2(10,10)\nuniform vec2 direction;// = vec2(1.0, -0.5)\nuniform float smoothness; // = 1.6\n\nconst vec2 center = vec2(0.5, 0.5);\nvec4 transition (vec2 p) {\n  vec2 v = normalize(direction);\n  v /= abs(v.x)+abs(v.y);\n  float d = v.x * center.x + v.y * center.y;\n  float offset = smoothness;\n  float pr = smoothstep(-offset, 0.0, v.x * p.x + v.y * p.y - (d-0.5+progress*(1.+offset)));\n  vec2 squarep = fract(p*vec2(squares));\n  vec2 squaremin = vec2(pr/2.0);\n  vec2 squaremax = vec2(1.0 - pr/2.0);\n  float a = (1.0 - step(progress, 0.0)) * step(squaremin.x, squarep.x) * step(squaremin.y, squarep.y) * step(squarep.x, squaremax.x) * step(squarep.y, squaremax.y);\n  return mix(getFromColor(p), getToColor(p), a);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // squeeze: {
  //   name: 'squeeze',
  //   paramsTypes: {
  //     colorSeparation: 'float',
  //   },
  //   defaultParams: {
  //     colorSeparation: 0.04,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n \nuniform float colorSeparation; // = 0.04\n \nvec4 transition (vec2 uv) {\n  float y = 0.5 + (uv.y-0.5) / (1.0-progress);\n  if (y < 0.0 || y > 1.0) {\n     return getToColor(uv);\n  }\n  else {\n    vec2 fp = vec2(uv.x, y);\n    vec2 off = progress * vec2(0.0, colorSeparation);\n    vec4 c = getFromColor(fp);\n    vec4 cn = getFromColor(fp - off);\n    vec4 cp = getFromColor(fp + off);\n    return vec4(cn.r, c.g, cp.b, c.a);\n  }\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // swap: {
  //   name: 'swap',
  //   paramsTypes: {
  //     reflection: 'float',
  //     perspective: 'float',
  //     depth: 'float',
  //   },
  //   defaultParams: {
  //     reflection: 0.4,
  //     perspective: 0.2,
  //     depth: 3,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n// General parameters\nuniform float reflection; // = 0.4\nuniform float perspective; // = 0.2\nuniform float depth; // = 3.0\n \nconst vec4 black = vec4(0.0, 0.0, 0.0, 1.0);\nconst vec2 boundMin = vec2(0.0, 0.0);\nconst vec2 boundMax = vec2(1.0, 1.0);\n \nbool inBounds (vec2 p) {\n  return all(lessThan(boundMin, p)) && all(lessThan(p, boundMax));\n}\n \nvec2 project (vec2 p) {\n  return p * vec2(1.0, -1.2) + vec2(0.0, -0.02);\n}\n \nvec4 bgColor (vec2 p, vec2 pfr, vec2 pto) {\n  vec4 c = black;\n  pfr = project(pfr);\n  if (inBounds(pfr)) {\n    c += mix(black, getFromColor(pfr), reflection * mix(1.0, 0.0, pfr.y));\n  }\n  pto = project(pto);\n  if (inBounds(pto)) {\n    c += mix(black, getToColor(pto), reflection * mix(1.0, 0.0, pto.y));\n  }\n  return c;\n}\n \nvec4 transition(vec2 p) {\n  vec2 pfr, pto = vec2(-1.);\n \n  float size = mix(1.0, depth, progress);\n  float persp = perspective * progress;\n  pfr = (p + vec2(-0.0, -0.5)) * vec2(size/(1.0-perspective*progress), size/(1.0-size*persp*p.x)) + vec2(0.0, 0.5);\n \n  size = mix(1.0, depth, 1.-progress);\n  persp = perspective * (1.-progress);\n  pto = (p + vec2(-1.0, -0.5)) * vec2(size/(1.0-perspective*(1.0-progress)), size/(1.0-size*persp*(0.5-p.x))) + vec2(1.0, 0.5);\n\n  if (progress < 0.5) {\n    if (inBounds(pfr)) {\n      return getFromColor(pfr);\n    }\n    if (inBounds(pto)) {\n      return getToColor(pto);\n    }  \n  }\n  if (inBounds(pto)) {\n    return getToColor(pto);\n  }\n  if (inBounds(pfr)) {\n    return getFromColor(pfr);\n  }\n  return bgColor(p, pfr, pto);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Sun, 18 Feb 2018 17:45:50 +0100',
  // },
  // undulatingBurnOut: {
  //   name: 'undulatingBurnOut',
  //   paramsTypes: {
  //     smoothness: 'float',
  //     center: 'vec2',
  //     color: 'vec3',
  //   },
  //   defaultParams: {
  //     smoothness: 0.03,
  //     center: [0.5, 0.5],
  //     color: [0, 0, 0],
  //   },
  //   glsl: '// License: MIT\n// Author: pthrasher\n// adapted by gre from https://gist.github.com/pthrasher/8e6226b215548ba12734\n\nuniform float smoothness; // = 0.03\nuniform vec2 center; // = vec2(0.5)\nuniform vec3 color; // = vec3(0.0)\n\nconst float M_PI = 3.14159265358979323846;\n\nfloat quadraticInOut(float t) {\n  float p = 2.0 * t * t;\n  return t < 0.5 ? p : -p + (4.0 * t) - 1.0;\n}\n\nfloat getGradient(float r, float dist) {\n  float d = r - dist;\n  return mix(\n    smoothstep(-smoothness, 0.0, r - dist * (1.0 + smoothness)),\n    -1.0 - step(0.005, d),\n    step(-0.005, d) * step(d, 0.01)\n  );\n}\n\nfloat getWave(vec2 p){\n  vec2 _p = p - center; // offset from center\n  float rads = atan(_p.y, _p.x);\n  float degs = degrees(rads) + 180.0;\n  vec2 range = vec2(0.0, M_PI * 30.0);\n  vec2 domain = vec2(0.0, 360.0);\n  float ratio = (M_PI * 30.0) / 360.0;\n  degs = degs * ratio;\n  float x = progress;\n  float magnitude = mix(0.02, 0.09, smoothstep(0.0, 1.0, x));\n  float offset = mix(40.0, 30.0, smoothstep(0.0, 1.0, x));\n  float ease_degs = quadraticInOut(sin(degs));\n  float deg_wave_pos = (ease_degs * magnitude) * sin(x * offset);\n  return x + deg_wave_pos;\n}\n\nvec4 transition(vec2 p) {\n  float dist = distance(center, p);\n  float m = getGradient(getWave(p), dist);\n  vec4 cfrom = getFromColor(p);\n  vec4 cto = getToColor(p);\n  return mix(mix(cfrom, cto, m), mix(cfrom, vec4(color, 1.0), 0.75), step(m, -2.0));\n}\n',
  //   license: 'MIT',
  //   author: 'pthrasher',
  //   createdAt: 'Mon, 12 Jun 2017 10:23:37 +0800',
  //   updatedAt: 'Mon, 12 Jun 2017 10:23:37 +0800',
  // },
  // wind: {
  //   name: 'wind',
  //   paramsTypes: {
  //     size: 'float',
  //   },
  //   defaultParams: {
  //     size: 0.2,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n\n// Custom parameters\nuniform float size; // = 0.2\n\nfloat rand (vec2 co) {\n  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nvec4 transition (vec2 uv) {\n  float r = rand(vec2(0, uv.y));\n  float m = smoothstep(0.0, -size, uv.x*(1.0-size) + size*r - (progress * (1.0 + size)));\n  return mix(\n    getFromColor(uv),\n    getToColor(uv),\n    m\n  );\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Tue, 30 May 2017 14:26:44 +0200',
  //   updatedAt: 'Tue, 30 May 2017 14:26:44 +0200',
  // },
  // windowblinds: {
  //   name: 'windowblinds',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: Fabien Benetou\n// License: MIT\n\nvec4 transition (vec2 uv) {\n  float t = progress;\n  \n  if (mod(floor(uv.y*100.*progress),2.)==0.)\n    t*=2.-.5;\n  \n  return mix(\n    getFromColor(uv),\n    getToColor(uv),\n    mix(t, progress, smoothstep(0.8, 1.0, progress))\n  );\n}\n',
  //   author: 'Fabien Benetou',
  //   license: 'MIT',
  //   createdAt: 'Wed, 31 May 2017 14:11:48 +0200',
  //   updatedAt: 'Wed, 31 May 2017 14:11:48 +0200',
  // },
  // windowslice: {
  //   name: 'windowslice',
  //   paramsTypes: {
  //     count: 'float',
  //     smoothness: 'float',
  //   },
  //   defaultParams: {
  //     count: 10,
  //     smoothness: 0.5,
  //   },
  //   glsl: '// Author: gre\n// License: MIT\n\nuniform float count; // = 10.0\nuniform float smoothness; // = 0.5\n\nvec4 transition (vec2 p) {\n  float pr = smoothstep(-smoothness, 0.0, p.x - progress * (1.0 + smoothness));\n  float s = step(pr, fract(count * p.x));\n  return mix(getFromColor(p), getToColor(p), s);\n}\n',
  //   author: 'gre',
  //   license: 'MIT',
  //   createdAt: 'Wed, 28 Mar 2018 17:23:26 +0200',
  //   updatedAt: 'Wed, 28 Mar 2018 17:23:26 +0200',
  // },
  // wipeDown: {
  //   name: 'wipeDown',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: Jake Nelson\n// License: MIT\n\nvec4 transition(vec2 uv) {\n  vec2 p=uv.xy/vec2(1.0).xy;\n  vec4 a=getFromColor(p);\n  vec4 b=getToColor(p);\n  return mix(a, b, step(1.0-p.y,progress));\n}\n',
  //   author: 'Jake Nelson',
  //   license: 'MIT',
  //   createdAt: 'Wed, 1 Nov 2017 15:26:01 -0500',
  //   updatedAt: 'Thu, 2 Nov 2017 18:39:26 -0500',
  // },
  // wipeLeft: {
  //   name: 'wipeLeft',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: Jake Nelson\n// License: MIT\n\nvec4 transition(vec2 uv) {\n  vec2 p=uv.xy/vec2(1.0).xy;\n  vec4 a=getFromColor(p);\n  vec4 b=getToColor(p);\n  return mix(a, b, step(1.0-p.x,progress));\n}\n',
  //   author: 'Jake Nelson',
  //   license: 'MIT',
  //   createdAt: 'Wed, 1 Nov 2017 15:26:28 -0500',
  //   updatedAt: 'Fri, 3 Nov 2017 18:03:50 +0100',
  // },
  // wipeRight: {
  //   name: 'wipeRight',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: Jake Nelson\n// License: MIT\n\nvec4 transition(vec2 uv) {\n  vec2 p=uv.xy/vec2(1.0).xy;\n  vec4 a=getFromColor(p);\n  vec4 b=getToColor(p);\n  return mix(a, b, step(0.0+p.x,progress));\n}\n',
  //   author: 'Jake Nelson',
  //   license: 'MIT',
  //   createdAt: 'Wed, 1 Nov 2017 15:27:02 -0500',
  //   updatedAt: 'Thu, 2 Nov 2017 18:40:22 -0500',
  // },
  // wipeUp: {
  //   name: 'wipeUp',
  //   paramsTypes: {},
  //   defaultParams: {},
  //   glsl: '// Author: Jake Nelson\n// License: MIT\n\nvec4 transition(vec2 uv) {\n  vec2 p=uv.xy/vec2(1.0).xy;\n  vec4 a=getFromColor(p);\n  vec4 b=getToColor(p);\n  return mix(a, b, step(0.0+p.y,progress));\n}\n',
  //   author: 'Jake Nelson',
  //   license: 'MIT',
  //   createdAt: 'Wed, 1 Nov 2017 15:24:36 -0500',
  //   updatedAt: 'Thu, 2 Nov 2017 18:37:42 -0500',
  // },

  crossfade: {
    name: 'crossfade',
    paramsTypes: {},
    defaultParams: {},
    glsl: `
      #define SHADER_NAME crossfade

      vec4 transition (vec2 uv) {
        return mix(
          getFromColor(uv),
          getToColor(uv),
          progress
        );
      }
    `,
  },
  circleInOut: {
    name: 'circleInOut',
    paramsTypes: {
      center: 'vec2',
      backColor: 'vec3',
    },
    defaultParams: {
      center: [0.5, 0.5],
      backColor: [0.0, 0.0, 0.0],
    },
    glsl: `
      #define SHADER_NAME circleInOut

      uniform vec2 center; // = vec2(0.5, 0.5);
      uniform vec3 backColor; // = vec3(0.0, 0.0, 0.0);

      vec4 transition (vec2 uv) {
        float distance = length(uv - center);
        float radius = sqrt(8.0) * abs(progress - 0.5);

        if (distance > radius) {
          return vec4(backColor, 1.0);
        }
        else {
          if (progress < 0.5) return getFromColor(uv);
          else return getToColor(uv);
        }
      }
    `,
  },
  splitVertical: {
    name: 'splitVertical',
    paramsTypes: {
      reflection: 'float',
      perspective: 'float',
      depth: 'float',
    },
    defaultParams: {
      reflection: 0,
      perspective: 0,
      depth: 1,
    },
    glsl: `
      #define SHADER_NAME splitVertical

      uniform float reflection; // = 0.0
      uniform float perspective; // = 0.0
      uniform float depth; // = 1.0

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
          c += mix(black, getToColor(pto), reflection * mix(1.0, 0.0, pto.y));
        }

        return c;
      }

      vec4 transition (vec2 p) {
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
          return getFromColor(pfr);
        }
        else if (inBounds(pto)) {
          return getToColor(pto);
        }
        else {
          return bgColor(p, pto);
        }
      }
    `,
  },
  slideUp: {
    name: 'slideUp',
    paramsTypes: {
      direction: 'vec2',
    },
    defaultParams: {
      direction: [0, -1],
    },
    glsl: `
      #define SHADER_NAME slideUp

      uniform vec2 direction; // = vec2(1.0, 0.0)

      vec4 transition (vec2 uv) {
        vec2 p = uv + progress * sign(direction);
        vec2 f = fract(p);
        return mix(
          getToColor(f),
          getFromColor(f),
          step(0.0, p.y) * step(p.y, 1.0) * step(0.0, p.x) * step(p.x, 1.0)
        );
      }
    `,
  },
  slideDown: {
    name: 'slideDown',
    paramsTypes: {
      direction: 'vec2',
    },
    defaultParams: {
      direction: [0, 1],
    },
    glsl: `
      #define SHADER_NAME slideDown

      uniform vec2 direction; // = vec2(1.0, 0.0)

      vec4 transition (vec2 uv) {
        vec2 p = uv + progress * sign(direction);
        vec2 f = fract(p);
        return mix(
          getToColor(f),
          getFromColor(f),
          step(0.0, p.y) * step(p.y, 1.0) * step(0.0, p.x) * step(p.x, 1.0)
        );
      }
    `,
  },
  slideLeft: {
    name: 'slideLeft',
    paramsTypes: {
      direction: 'vec2',
    },
    defaultParams: {
      direction: [1, 0],
    },
    glsl: `
      #define SHADER_NAME slideLeft

      uniform vec2 direction; // = vec2(1.0, 0.0)

      vec4 transition (vec2 uv) {
        vec2 p = uv + progress * sign(direction);
        vec2 f = fract(p);
        return mix(
          getToColor(f),
          getFromColor(f),
          step(0.0, p.y) * step(p.y, 1.0) * step(0.0, p.x) * step(p.x, 1.0)
        );
      }
    `,
  },
  slideRight: {
    name: 'slideRight',
    paramsTypes: {
      direction: 'vec2',
    },
    defaultParams: {
      direction: [-1, 0],
    },
    glsl: `
      #define SHADER_NAME slideRight

      uniform vec2 direction; // = vec2(1.0, 0.0)

      vec4 transition (vec2 uv) {
        vec2 p = uv + progress * sign(direction);
        vec2 f = fract(p);
        return mix(
          getToColor(f),
          getFromColor(f),
          step(0.0, p.y) * step(p.y, 1.0) * step(0.0, p.x) * step(p.x, 1.0)
        );
      }
    `,
  },
};

export default transitions;
