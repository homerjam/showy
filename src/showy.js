const TRANSITION_FORWARDS = 'forwards';
const TRANSITION_BACKWARDS = 'backwards';
const SKIP_ALTERNATE_FRAMES = false;

class Showy {
  constructor(config) {
    const defaultConfig = {
      transitionSpeed: 2000,
      transitionEase: 'linear',
    };

    this.config = Object.assign({}, defaultConfig, config);

    if (typeof this.config.container === 'string') {
      this.container = document.querySelector(this.config.container);
    } else {
      this.container = this.config.container;
    }

    this._slides = this.config.slides;
    this._currentSlideIndex = this._transitionToIndex = 0;
    this._transitionProgress = 0;
    this._imageMap = {};
    this._videoMap = {};
    this._slideContentMap = {};

    this.createCanvases();

    window.addEventListener('resize', this.resize.bind(this));

    this.animate();
  }

  nextSlide() {
    this._transitionDirection = TRANSITION_FORWARDS;
    this._transitionToIndex = this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1;
  }

  prevSlide() {
    this._transitionDirection = TRANSITION_BACKWARDS;
    this._transitionToIndex = this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1;
  }

  animate(time, skip) {
    window.requestAnimationFrame(time => {
      this.animate(time, !skip);
    });

    if (!(skip && SKIP_ALTERNATE_FRAMES)) {
      this.drawSlides(time);
    }
  }

  _createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    this._resizeCanvas(canvas);
    return canvas;
  }

  createCanvases() {
    this.currentCanvas = this._createCanvas();
    this.currentContext = this.currentCanvas.getContext('2d');

    this.nextCanvas = this._createCanvas();
    this.nextContext = this.nextCanvas.getContext('2d');

    this.prevCanvas = this._createCanvas();
    this.prevContext = this.prevCanvas.getContext('2d');

    this.renderCanvas = this._createCanvas();
    this.renderContext = this.renderCanvas.getContext('webgl') || this.renderCanvas.getContext('experimental-webgl');
    this.renderContext.pixelStorei(this.renderContext.UNPACK_FLIP_Y_WEBGL, true);

    this.container.appendChild(this.renderCanvas);
  }

  _resizeCanvas(canvas) {
    this._scale = window.devicePixelRatio;
    canvas.width = this.container.clientWidth * this._scale;
    canvas.height = this.container.clientHeight * this._scale;
  }

  resize() {
    // Remove all cached imageData as this will be redundant now
    this._slideContentMap = {};

    this._resizeCanvas(this.currentCanvas);
    this._resizeCanvas(this.nextCanvas);
    this._resizeCanvas(this.prevCanvas);
    this._resizeCanvas(this.renderCanvas);

    this.drawSlides();
  }

  _clearContext(context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  }

  _drawSlide(context, slide) {
    if (slide.content.length) {
      this.drawSlideContent(context, slide, 0);
    }
  }

  drawSlides(time) {
    const transitionSpeed = this._slides[this._currentSlideIndex].transitionSpeed ? this._slides[this._currentSlideIndex].transitionSpeed : this.config.transitionSpeed;
    const transitionEase = this._slides[this._currentSlideIndex].transitionEase ? this._slides[this._currentSlideIndex].transitionEase : this.config.transitionEase;
    const progressIncrement = (SKIP_ALTERNATE_FRAMES ? 30 : 60) / transitionSpeed; // fps / transition in ms

    const nextSlideIndex = this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1;
    const prevSlideIndex = this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1;

    this._drawSlide(this.currentContext, this._slides[this._currentSlideIndex]);
    this._drawSlide(this.nextContext, this._slides[nextSlideIndex]);
    this._drawSlide(this.prevContext, this._slides[prevSlideIndex]);

    if (!this.transition) {
      this.transition = createTransition(this.renderContext, glslTransitions[this.config.transition].glsl);
    }

    if (this.fromTexture) {
      this.fromTexture.dispose();
    }

    if (this.toTexture) {
      this.toTexture.dispose();
    }

    if (this._transitionToIndex !== this._currentSlideIndex) {

      if (this._transitionDirection === TRANSITION_FORWARDS) {
        this.fromTexture = createTexture(this.renderContext, this.currentCanvas);
        this.toTexture = createTexture(this.renderContext, this.nextCanvas);

        this._transitionProgress = this._transitionProgress === 1 || this._transitionProgress === 0 ? progressIncrement : this._transitionProgress + progressIncrement;

      } else {
        this.fromTexture = createTexture(this.renderContext, this.prevCanvas);
        this.toTexture = createTexture(this.renderContext, this.currentCanvas);

        this._transitionProgress = this._transitionProgress === 1 || this._transitionProgress === 0 ? 1 - progressIncrement : this._transitionProgress - progressIncrement;
      }

      if (this._transitionProgress > 1) {
        this._transitionProgress = 1;
      }
      if (this._transitionProgress < 0) {
        this._transitionProgress = 0;
      }

    } else {
      this.fromTexture = createTexture(this.renderContext, this.currentCanvas);
      this.toTexture = this.fromTexture;
    }

    const easedTransitionProgress = eases[transitionEase](this._transitionProgress);

    this.transition.render(easedTransitionProgress, this.fromTexture, this.toTexture, glslTransitions[this.config.transition].uniforms);

    if (this._transitionToIndex !== this._currentSlideIndex && (this._transitionProgress === 0 || this._transitionProgress === 1)) {
      this._currentSlideIndex = this._transitionToIndex;

      this._clearContext(this.currentContext);
      this._clearContext(this.nextContext);
      this._clearContext(this.prevContext);
    }
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

      let length = [this.currentCanvas.width, this.currentCanvas.height, this.currentCanvas.width, this.currentCanvas.height][index];

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

    // Round properties for pica (and general speed up)
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
    this.container.appendChild(video);

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
