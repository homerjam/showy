/**
 * TODO
 * - cache video frames (assume frame rate and round currentTime to get frame)
 * - fallback for no-webgl (use gsap?)
 * - fallback for no-video / autoplay on mobile
 * - priority based transitions
 */

const TRANSITION_FORWARDS = 'forwards';
const TRANSITION_BACKWARDS = 'backwards';
const SKIP_ALTERNATE_FRAMES = false;

class Showy {
  constructor(config) {
    const defaultConfig = {
      container: 'body',
      slides: [],
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

    this._createCanvases();

    window.addEventListener('resize', this.resize.bind(this));

    this._lastFrameTime = 0;
    window.requestAnimationFrame(this._animate.bind(this, false));
  }

  nextSlide() {
    this._transitionDirection = TRANSITION_FORWARDS;

    if (this._transitionToIndex === this._currentSlideIndex - 1 || (this._transitionToIndex === this._slides.length - 1 && this._currentSlideIndex === 0)) {
      this._transitionToIndex = this._currentSlideIndex;

    } else {
      this._transitionToIndex = this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1;
    }
  }

  prevSlide() {
    this._transitionDirection = TRANSITION_BACKWARDS;

    if (this._transitionToIndex === this._currentSlideIndex + 1 || (this._transitionToIndex === 0 && this._currentSlideIndex === this._slides.length - 1)) {
      this._transitionToIndex = this._currentSlideIndex;

    } else {
      this._transitionToIndex = this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1;
    }
  }

  _animate(skipFrame, frameTime) {
    this._fps = 1000 / (frameTime - this._lastFrameTime);

    window.requestAnimationFrame(this._animate.bind(this, !skipFrame));

    if (!(skipFrame && SKIP_ALTERNATE_FRAMES)) {
      this._lastFrameTime = frameTime;

      this._drawSlides();
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

  _createCanvases() {
    this._currentCanvas = this._createCanvas();
    this._currentContext = this._currentCanvas.getContext('2d');

    this._nextCanvas = this._createCanvas();
    this._nextContext = this._nextCanvas.getContext('2d');

    this._prevCanvas = this._createCanvas();
    this._prevContext = this._prevCanvas.getContext('2d');

    this._renderCanvas = this._createCanvas();
    this._renderContext = this._renderCanvas.getContext('webgl') || this._renderCanvas.getContext('experimental-webgl');
    this._renderContext.pixelStorei(this._renderContext.UNPACK_FLIP_Y_WEBGL, true);

    this.container.appendChild(this._renderCanvas);
  }

  _resizeCanvas(canvas) {
    this._scale = window.devicePixelRatio;
    canvas.width = this.container.clientWidth * this._scale;
    canvas.height = this.container.clientHeight * this._scale;
  }

  resize() {
    // Remove all cached imageData as this will be redundant now
    this._slideContentMap = {};

    this._resizeCanvas(this._currentCanvas);
    this._resizeCanvas(this._nextCanvas);
    this._resizeCanvas(this._prevCanvas);
    this._resizeCanvas(this._renderCanvas);

    this._drawSlides(true);
  }

  _clearContext(context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  }

  _transitionInProgress() {
    return this._transitionProgress > 0 && this._transitionProgress < 1;
  }

  _drawSlides(reset) {
    const currentSlide = this._slides[this._currentSlideIndex];
    const transition = glslTransitions[currentSlide.transition || this.config.transition];
    const transitionSpeed = currentSlide.transitionSpeed !== undefined ? currentSlide.transitionSpeed : this.config.transitionSpeed;
    const transitionEase = currentSlide.transitionEase || this.config.transitionEase;
    const progressIncrement = this._fps / transitionSpeed; // fps / transition in ms
    // const progressIncrement = (SKIP_ALTERNATE_FRAMES ? 30 : 60) / transitionSpeed; // fps / transition in ms
    const nextSlideIndex = this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1;
    const prevSlideIndex = this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1;

    if (reset) {
      currentSlide._rendered = false;
    }

    if (!currentSlide._hasVideo && currentSlide._rendered && !this._transitionInProgress() && this._currentSlideIndex === this._transitionToIndex) {
      return;
    }

    this._drawSlide(this._currentContext, currentSlide);
    this._drawSlide(this._nextContext, this._slides[nextSlideIndex]);
    this._drawSlide(this._prevContext, this._slides[prevSlideIndex]);

    if (!this.transition || this.transition.name !== transition.name) {
      this.transition = transition;
      if (this._transition) {
        this._transition.dispose();
      }
      this._transition = createTransition(this._renderContext, this.transition.glsl);
    }

    if (this._fromTexture) {
      this._fromTexture.dispose();
    }

    if (this._toTexture) {
      this._toTexture.dispose();
    }

    if (this._transitionToIndex !== this._currentSlideIndex || this._transitionInProgress()) {

      if ((this._transitionToIndex !== this._currentSlideIndex && this._transitionDirection === TRANSITION_FORWARDS) ||
        (this._transitionToIndex === this._currentSlideIndex && this._transitionDirection === TRANSITION_BACKWARDS)) {
        this._fromTexture = createTexture(this._renderContext, this._currentCanvas);
        this._toTexture = createTexture(this._renderContext, this._nextCanvas);
      }
      if ((this._transitionToIndex !== this._currentSlideIndex && this._transitionDirection === TRANSITION_BACKWARDS) ||
       (this._transitionToIndex === this._currentSlideIndex && this._transitionDirection === TRANSITION_FORWARDS)) {
        this._fromTexture = createTexture(this._renderContext, this._prevCanvas);
        this._toTexture = createTexture(this._renderContext, this._currentCanvas);
      }

      if (this._transitionDirection === TRANSITION_FORWARDS) {
        this._transitionProgress = this._transitionInProgress() ? this._transitionProgress + progressIncrement : progressIncrement;
      }
      if (this._transitionDirection === TRANSITION_BACKWARDS) {
        this._transitionProgress = this._transitionInProgress() ? this._transitionProgress - progressIncrement : 1 - progressIncrement;
      }

      if (this._transitionProgress > 1) {
        this._transitionProgress = 1;
      }
      if (this._transitionProgress < 0) {
        this._transitionProgress = 0;
      }

    } else {
      this._fromTexture = createTexture(this._renderContext, this._currentCanvas);
      this._toTexture = this._fromTexture;
    }

    const easedTransitionProgress = eases[transitionEase](this._transitionProgress);

    this._transition.render(easedTransitionProgress, this._fromTexture, this._toTexture, transition.uniforms);

    if (currentSlide._ready) {
      currentSlide._rendered = true;
    }

    if (this._transitionToIndex !== this._currentSlideIndex && !this._transitionInProgress()) {
      this._currentSlideIndex = this._transitionToIndex;

      this._clearContext(this._currentContext);
      this._clearContext(this._nextContext);
      this._clearContext(this._prevContext);
    }
  }

  _drawSlide(context, slide) {
    slide._hasVideo = slide.content.filter(object => object.type === 'video').length > 0;
    slide._rendered = false;
    slide._ready = false;

    if (slide.content.length) {
      this._drawSlideContent(context, slide, 0);
    }
  }

  _drawSlideContent(context, slide, index) {
    const object = slide.content[index];

    if (!object) {
      slide._ready = true;
      return;
    }

    const callback = this._drawSlideContent.bind(this, context, slide, index + 1);

    switch (object.type) {
      case 'image':
        this._drawImage(context, object, callback);
        break;
      case 'video':
        this._drawVideo(context, object, callback);
        break;
      default:
        throw new Error('Unknown content type');
    }
  }

  _position2Pixels(position, scale = 1) {
    const pixels = [];

    position.forEach((val, index) => {
      let pixel;

      let length = [this._currentCanvas.width, this._currentCanvas.height, this._currentCanvas.width, this._currentCanvas.height][index];

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

  _updateCoords(src, dst, scaleMode) {
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

  _getTile(dst, size) {
    return {
      x: dst.x,
      y: dst.y,
      width: size[0] <= 1 ? dst.width * size[0] : size[0],
      height: size[1] <= 1 ? dst.height * size[1] : size[1],
    };
  }

  _drawTiles(dst, tile, scaleMode, callback) {
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

  _getImageData(image, x, y, width, height) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    return tempContext.getImageData(x, y, width, height).data;
  }

  _getImage(imageUrl, callback) {
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

  _resizeImage(image, src, dst, callback) {
    const resizedImageKey = JSON.stringify(dst);

    if (this._slideContentMap[resizedImageKey]) {
      callback(this._slideContentMap[resizedImageKey]);
      return;
    }

    pica.resizeBuffer({
      src: this._getImageData(image, src.x, src.y, src.width, src.height),
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

  _drawImage(context, object, callback) {
    this._getImage(object.url, image => {
      let src = {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

      let dst = this._position2Pixels(object.position, this._scale);

      if (object.tile) {
        let tile = this._getTile(dst, object.tile.size);

        const updatedCoords = this._updateCoords(src, tile, object.tile.scaleMode);

        this._resizeImage(image, updatedCoords.src, updatedCoords.dst, resizedImageData => {

          this._drawTiles(dst, updatedCoords.dst, object.scaleMode, tileCoord => {
            context.putImageData(resizedImageData, tileCoord.x, tileCoord.y);
          });

          callback();
        });

        return;
      }

      const updatedCoords = this._updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      this._resizeImage(image, src, dst, resizedImageData => {
        context.putImageData(resizedImageData, dst.x, dst.y);

        callback();
      });
    });
  }

  _getVideoData(video) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    return tempContext._getImageData(0, 0, video.videoWidth, video.videoHeight).data;
  }

  _getVideo(sources, callback) {
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

  _drawVideo(context, object, callback) {
    this._getVideo(object.sources, video => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      let src = {
        x: 0,
        y: 0,
        width: video.videoWidth,
        height: video.videoHeight,
      };

      let dst = this._position2Pixels(object.position, this._scale);

      if (object.tile) {
        let tile = this._getTile(dst, object.tile.size);

        const updatedCoords = this._updateCoords(src, tile, object.tile.scaleMode);

        this._drawTiles(dst, updatedCoords.dst, object.scaleMode, tileCoord => {
          context.drawImage(video, src.x, src.y, src.width, src.height, tileCoord.x, tileCoord.y, tile.width, tile.height);
        });

        callback();

        return;
      }

      const updatedCoords = this._updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      context.drawImage(video, src.x, src.y, src.width, src.height, dst.x, dst.y, dst.width, dst.height);

      callback();
    });
  }
}

export default Showy;
