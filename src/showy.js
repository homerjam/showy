const CubeTransition = { // from "glsl-transitions"
  "glsl" : "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nuniform float persp;\nuniform float unzoom;\nuniform float reflection;\nuniform float floating;\n\nvec2 project (vec2 p) {\n  return p * vec2(1.0, -1.2) + vec2(0.0, -floating/100.);\n}\n\nbool inBounds (vec2 p) {\n  return all(lessThan(vec2(0.0), p)) && all(lessThan(p, vec2(1.0)));\n}\n\nvec4 bgColor (vec2 p, vec2 pfr, vec2 pto) {\n  vec4 c = vec4(0.0, 0.0, 0.0, 1.0);\n  pfr = project(pfr);\n  if (inBounds(pfr)) {\n    c += mix(vec4(0.0), texture2D(from, pfr), reflection * mix(1.0, 0.0, pfr.y));\n  }\n  pto = project(pto);\n  if (inBounds(pto)) {\n    c += mix(vec4(0.0), texture2D(to, pto), reflection * mix(1.0, 0.0, pto.y));\n  }\n  return c;\n}\n\n// p : the position\n// persp : the perspective in [ 0, 1 ]\n// center : the xcenter in [0, 1] \\ 0.5 excluded\nvec2 xskew (vec2 p, float persp, float center) {\n  float x = mix(p.x, 1.0-p.x, center);\n  return (\n    (\n      vec2( x, (p.y - 0.5*(1.0-persp) * x) / (1.0+(persp-1.0)*x) )\n      - vec2(0.5-distance(center, 0.5), 0.0)\n    )\n    * vec2(0.5 / distance(center, 0.5) * (center<0.5 ? 1.0 : -1.0), 1.0)\n    + vec2(center<0.5 ? 0.0 : 1.0, 0.0)\n  );\n}\n\nvoid main() {\n  vec2 op = gl_FragCoord.xy / resolution.xy;\n  float uz = unzoom * 2.0*(0.5-distance(0.5, progress));\n  vec2 p = -uz*0.5+(1.0+uz) * op;\n  vec2 fromP = xskew(\n    (p - vec2(progress, 0.0)) / vec2(1.0-progress, 1.0),\n    1.0-mix(progress, 0.0, persp),\n    0.0\n  );\n  vec2 toP = xskew(\n    p / vec2(progress, 1.0),\n    mix(pow(progress, 2.0), 1.0, persp),\n    1.0\n  );\n  if (inBounds(fromP)) {\n    gl_FragColor = texture2D(from, fromP);\n  }\n  else if (inBounds(toP)) {\n    gl_FragColor = texture2D(to, toP);\n  }\n  else {\n    gl_FragColor = bgColor(op, fromP, toP);\n  }\n}",
  "uniforms": { "persp": 0.7, "unzoom": 0.3, "reflection": 0.4, "floating": 3.0 }
};

class Showy {
  constructor(config) {
    const defaultConfig = {};

    this.config = Object.assign({}, defaultConfig, config);

    if (typeof this.config.container === 'string') {
      this.container = document.querySelector(this.config.container);
    } else {
      this.container = this.config.container;
    }

    this._slides = this.config.slides;
    this._currentSlideIndex = this._previousSlideIndex = 0;
    this._imageMap = {};
    this._videoMap = {};
    this._slideContentMap = {};

    this.createCanvas();

    window.addEventListener('resize', event => {
      this.resize();

      this.drawSlide();
    });

    this.animate();
  }

  nextSlide() {
    this._currentSlideIndex = this._currentSlideIndex < this._slides.length - 1 ? this._currentSlideIndex + 1 : 0;
  }

  animate(time, skip) {
    window.requestAnimationFrame(time => {
      this.animate(time, !skip);
    });

    // if (!skip) {
      this.drawSlide(time);
    // }
  }

  _createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    this._resize(canvas);
    return canvas;
  }

  createCanvas() {
    if (this.canvas) {
      this.container.removeChild(this.canvas);
    }

    this.canvas = this._createCanvas();

    this.container.appendChild(this.canvas);

    this.context = this.canvas.getContext('2d');

    this.resize();

    return this.canvas;
  }

  _resize(canvas) {
    this._scale = window.devicePixelRatio;
    canvas.width = this.container.clientWidth * this._scale;
    canvas.height = this.container.clientHeight * this._scale;
  }

  resize() {
    this._resize(this.canvas);
  }

  _drawSlide(context, slide) {
    if (slide.content.length) {
      this.drawSlideContent(context, slide, 0);
    }
  }

  drawSlide(time, slide) {
    if (!slide) {
      slide = this._slides[this._previousSlideIndex];
    }

    if (this._previousSlideIndex !== this._currentSlideIndex) {

      if (!this.transition) {
        const nextSlide = this._slides[this._currentSlideIndex];
        this.toCanvas = this._createCanvas();
        const toContext = this.toCanvas.getContext('2d');
        this._drawSlide(toContext, nextSlide);

        const transitionCanvas = this._createCanvas();
        this.gl = transitionCanvas.getContext('webgl') || transitionCanvas.getContext('experimental-webgl');
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.container.appendChild(transitionCanvas);

        this.transition = createTransition(this.gl, CubeTransition.glsl);
      }

      const fromTexture = createTexture(this.gl, this.canvas);
      const toTexture = createTexture(this.gl, this.toCanvas);

      this.transition.render((time % 1500) / 1500, fromTexture, toTexture, CubeTransition.uniforms);

      // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      return;
    }

    this._drawSlide(this.context, slide);

    this._previousSlideIndex = this._currentSlideIndex;
  }

  drawSlideContent(context, slide, index) {
    const object = slide.content[index];

    if (!object) {
      return;
    }

    const callback = this.drawSlideContent.bind(this, context, slide, index + 1);

    switch (object.type) {
      case 'image':
        this.drawImage(context, object, callback);
        break;
      case 'video':
        this.drawVideo(context, object, callback);
        break;
      default:
        throw new Error('Unknown content type');
    }
  }

  position2Pixels(position, scale = 1) {
    const pixels = [];

    position.forEach((val, index) => {
      let pixel;

      let length = [this.canvas.width, this.canvas.height, this.canvas.width, this.canvas.height][index];

      length /= scale;

      if (val <= 1) {
        if (index < 2) {
          pixel = val * length;
        } else {
          pixel = (val * length) - pixels[index - 2];
        }
      } else {
        if (index < 2) {
          pixel = val;
        } else {
          pixel = length - pixels[index - 2] - val;
        }
      }

      pixels.push(pixel);
    });

    return {
      x: pixels[0] * scale,
      y: pixels[1] * scale,
      width: pixels[2] * scale,
      height: pixels[3] * scale,
    };
  }

  updateCoords(src, dst, scaleMode) {
    const srcRatio = src.width / src.height;
    const dstRatio = dst.width / dst.height;

    if (scaleMode && scaleMode === 'fill') {
      if (srcRatio < dstRatio) {
        const newHeight = dst.height * (src.width / dst.width);
        src.y = src.y + ((src.height - newHeight) * 0.5);
        src.height = newHeight;
      }
      if (srcRatio > dstRatio) {
        const newWidth = dst.width * (src.height / dst.height);
        src.x = src.x + ((src.width - newWidth) * 0.5);
        src.width = newWidth;
      }
    } else {
      if (srcRatio > dstRatio) {
        const newHeight = dst.width * (src.height / src.width);
        dst.y = dst.y + ((dst.height - newHeight) * 0.5);
        dst.height = newHeight;
      }
      if (srcRatio < dstRatio) {
        const newWidth = dst.height * srcRatio;
        dst.x = dst.x + ((dst.width - newWidth) * 0.5);
        dst.width = newWidth;
      }
    }

    // Round properties for pica
    const roundProps = ['x', 'y', 'width', 'height'];

    roundProps.forEach(prop => {
      src[prop] = Math.round(src[prop]);
      dst[prop] = Math.round(dst[prop]);
    });

    return {
      src,
      dst,
    };
  }

  getTile(dst, size) {
    return {
      x: dst.x,
      y: dst.y,
      width: size[0] <= 1 ? dst.width * size[0] : size[0],
      height: size[1] <= 1 ? dst.height * size[1] : size[1],
    };
  }

  drawTiles(dst, tile, scaleMode, callback) {
    let rows;
    let columns;

    let offsetWidth = 0;
    let offsetHeight = 0;

    if (scaleMode && scaleMode === 'fill') {
      rows = Math.ceil(dst.height / tile.height);
      columns = Math.ceil(dst.width / tile.width);

      offsetWidth = ((tile.width * columns) - dst.width) * 0.5;
      offsetHeight = ((tile.height * rows) - dst.height) * 0.5;

    } else {
      rows = Math.floor(dst.height / tile.height);
      columns = Math.floor(dst.width / tile.width);
    }

    let row = 0;
    let column = 0;

    const totalTiles = rows * columns;

    for (let i = 0; i < totalTiles; i++) {
      callback({
        x: tile.x + (column * tile.width) - offsetWidth,
        y: tile.y + (row * tile.height) - offsetHeight,
      });

      if (column === columns - 1) {
        row++;
      }

      column = column < columns - 1 ? column + 1 : 0;
    }
  }

  getImageData(image, x, y, width, height) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    return tempContext.getImageData(x, y, width, height).data;
  }

  getImage(imageUrl, callback) {
    if (this._imageMap[imageUrl]) {
      callback(this._imageMap[imageUrl]);
      return;
    }

    const image = new Image();
    image.src = imageUrl;
    image.onload = event => {
      this._imageMap[imageUrl] = image;
      callback(image);
    };
  }

  _drawImage(image, src, dst, callback) {
    const resizedImageKey = JSON.stringify(dst);

    if (this._slideContentMap[resizedImageKey]) {
      callback(this._slideContentMap[resizedImageKey]);
      return;
    }

    pica.resizeBuffer({
      src: this.getImageData(image, src.x, src.y, src.width, src.height),
      width: src.width,
      height: src.height,
      toWidth: dst.width,
      toHeight: dst.height,
      quality: 1,
      alpha: false,
      unsharpAmount: 0,
      unsharpRadius: 0.5,
      unsharpThreshold: 0,
    }, (error, buffer) => {
      const resizedImageData = new ImageData(new Uint8ClampedArray(buffer), dst.width, dst.height);

      this._slideContentMap[resizedImageKey] = resizedImageData;

      callback(this._slideContentMap[resizedImageKey]);
    });
  }

  drawImage(context, object, callback) {
    this.getImage(object.url, image => {
      let src = {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

      let dst = this.position2Pixels(object.position, this._scale);

      if (object.tile) {
        let tile = this.getTile(dst, object.tile.size);

        const updatedCoords = this.updateCoords(src, tile, object.tile.scaleMode);

        this._drawImage(image, updatedCoords.src, updatedCoords.dst, resizedImageData => {

          this.drawTiles(dst, updatedCoords.dst, object.scaleMode, tileCoord => {
            context.putImageData(resizedImageData, tileCoord.x, tileCoord.y);
          });

          callback();
        });

        return;
      }

      const updatedCoords = this.updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      this._drawImage(image, src, dst, resizedImageData => {
        context.putImageData(resizedImageData, dst.x, dst.y);

        callback();
      });
    });
  }

  getVideoData(video) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    return tempContext.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
  }

  getVideo(sources, callback) {
    const videoKey = JSON.stringify(sources);

    if (this._videoMap[videoKey]) {
      callback(this._videoMap[videoKey]);
      return;
    }

    const video = document.createElement('video');
    video.style.display = 'none';
    video.crossOrigin = 'anonymous';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    document.body.appendChild(video);

    sources.forEach(source => {
      const _source = document.createElement('source');
      _source.src = source.url;
      _source.type = source.type;
      video.appendChild(_source);
    });

    this._videoMap[videoKey] = video;

    video.addEventListener('play', () => {
      callback(video);
    });
  }

  drawVideo(context, object, callback) {
    this.getVideo(object.sources, video => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      let src = {
        x: 0,
        y: 0,
        width: video.videoWidth,
        height: video.videoHeight,
      };

      let dst = this.position2Pixels(object.position, this._scale);

      if (object.tile) {
        let tile = this.getTile(dst, object.tile.size);

        const updatedCoords = this.updateCoords(src, tile, object.tile.scaleMode);

        this.drawTiles(dst, updatedCoords.dst, object.scaleMode, tileCoord => {
          context.drawImage(video, src.x, src.y, src.width, src.height, tileCoord.x, tileCoord.y, tile.width, tile.height);
        });

        callback();

        return;
      }

      const updatedCoords = this.updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      context.drawImage(video, src.x, src.y, src.width, src.height, dst.x, dst.y, dst.width, dst.height);

      callback();
    });
  }
}

export default Showy;
