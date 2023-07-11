/* eslint-env browser  */
/* globals _ */

/**
 * TODO
 * - autoplay: wait for slide._loaded
 * - optionally reset video on change
 * - fade objects on load
 * - events (ready, progress etc)
 * - cache video frames (assume frame rate and round currentTime to get frame)
 * - video options (loop?, sound?)
 * - fallback for no-video / autoplay on mobile
 * - effects/filters (sepia / grayscale etc)
 * - fallback for no-webgl (use gsap?)
 */

import Pica from 'pica';
import createTexture from 'gl-texture2d';
import createTransition from 'gl-transition';
import eases from 'eases';
import transitions from './transitions';

const TRANSITION_FORWARDS = 'forwards';
const TRANSITION_BACKWARDS = 'backwards';
const TRANSITION_RANDOM = 'random';

const TRANSITION_NONE = {
  name: 'none',
  paramsTypes: {},
  defaultParams: {},
  glsl: 'vec4 transition(vec2 p) {\n return getToColor(p);\n }',
};

// Polyfill playing status
if (window.HTMLMediaElement) {
  Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get() {
      return !!(
        this.currentTime > 0 &&
        !this.paused &&
        !this.ended &&
        this.readyState > 2
      );
    },
  });
}

const pica = Pica();

class Showy {
  constructor(config) {
    const defaultConfig = {
      container: 'body',
      slides: [],
      autoplay: false,
      slideDuration: 3000,
      transitions,
      transition: {
        name: 'random',
        duration: 2000,
        ease: 'linear',
        priority: 0,
      },
    };

    this.config = _.merge({}, defaultConfig, config);

    if (typeof this.config.container === 'string') {
      this.container = document.querySelector(this.config.container);
    } else {
      this.container = this.config.container;
    }

    this.container.style.display = 'block';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';

    this._slides = this.config.slides;
    this._currentSlideIndex = 0;
    this._transitionToIndex = 0;
    this._currentSlideRendered = false;
    this._transitionProgress = 0;
    this._imageMap = {};
    this._videoMap = {};
    this._slideContentMap = {};
    this._ready = false;
    this._destroyed = false;
    this._playing = this.config.autoplay;
    this._width = 0;
    this._height = 0;
    this._regExp = {
      image: /\.(jpe?g|webp|png)$/i,
      video: /\.(mp4|webm|ogg)$/i,
    };

    this._createCanvases();

    this._resizeHandler = this.resize.bind(this);
    window.addEventListener('resize', this._resizeHandler);

    this._lastFrameTime = 0;
    window.requestAnimationFrame(this._animate.bind(this));
  }

  goToSlide(index, direction) {
    this._transitionToIndex = index;
    this._transitionDirection = direction;

    this._currentSlideRendered = false;

    if (this._autoPlayTimeout) {
      clearTimeout(this._autoPlayTimeout);
    }
  }

  nextSlide() {
    let index;

    if (
      this._transitionToIndex === this._currentSlideIndex - 1 ||
      (this._transitionToIndex === this._slides.length - 1 &&
        this._currentSlideIndex === 0)
    ) {
      // Cancel and reverse the transition
      index = this._currentSlideIndex;
    } else {
      index =
        this._currentSlideIndex === this._slides.length - 1
          ? 0
          : this._currentSlideIndex + 1;
    }

    this.goToSlide(index, TRANSITION_FORWARDS);
  }

  prevSlide() {
    let index;

    if (
      this._transitionToIndex === this._currentSlideIndex + 1 ||
      (this._transitionToIndex === 0 &&
        this._currentSlideIndex === this._slides.length - 1)
    ) {
      // Cancel and reverse the transition
      index = this._currentSlideIndex;
    } else {
      index =
        this._currentSlideIndex === 0
          ? this._slides.length - 1
          : this._currentSlideIndex - 1;
    }

    this.goToSlide(index, TRANSITION_BACKWARDS);
  }

  play() {
    this._playing = true;

    this.nextSlide();
  }

  pause() {
    this._playing = false;

    if (this._autoPlayTimeout) {
      clearTimeout(this._autoPlayTimeout);
    }
  }

  destroy() {
    this._playing = false;

    this._destroyed = true;

    window.removeEventListener('resize', this._resizeHandler);

    _.forEach(this._videoMap, (video) => {
      this.container.removeChild(video);
      video = null;
    });
    this._videoMap = null;
  }

  static _updateCoords(src, dst, scaleMode) {
    const srcRatio = src.width / src.height;
    const dstRatio = dst.width / dst.height;

    if (scaleMode && scaleMode === 'fill') {
      if (srcRatio < dstRatio) {
        const newHeight = dst.height * (src.width / dst.width);
        src.y = src.y + (src.height - newHeight) * 0.5;
        src.height = newHeight;
      }
      if (srcRatio > dstRatio) {
        const newWidth = dst.width * (src.height / dst.height);
        src.x = src.x + (src.width - newWidth) * 0.5;
        src.width = newWidth;
      }
    } else {
      if (srcRatio > dstRatio) {
        const newHeight = dst.width * (src.height / src.width);
        dst.y = dst.y + (dst.height - newHeight) * 0.5;
        dst.height = newHeight;
      }
      if (srcRatio < dstRatio) {
        const newWidth = dst.height * srcRatio;
        dst.x = dst.x + (dst.width - newWidth) * 0.5;
        dst.width = newWidth;
      }
    }

    // Round properties for pica (and general speed up)
    const roundProps = ['x', 'y', 'width', 'height'];

    roundProps.forEach((prop) => {
      src[prop] = Math.round(src[prop]);
      dst[prop] = Math.round(dst[prop]);
    });

    return {
      src,
      dst,
    };
  }

  static _getTile(dst, size) {
    return {
      x: dst.x,
      y: dst.y,
      width: size[0] <= 1 ? dst.width * size[0] : size[0],
      height: size[1] <= 1 ? dst.height * size[1] : size[1],
    };
  }

  static _drawTiles(dst, tile, scaleMode, callback) {
    let rows;
    let columns;

    let offsetWidth = 0;
    let offsetHeight = 0;

    if (scaleMode && scaleMode === 'fill') {
      rows = Math.ceil(dst.height / tile.height);
      columns = Math.ceil(dst.width / tile.width);

      offsetWidth = (tile.width * columns - dst.width) * 0.5;
      offsetHeight = (tile.height * rows - dst.height) * 0.5;
    } else {
      rows = Math.floor(dst.height / tile.height);
      columns = Math.floor(dst.width / tile.width);
    }

    let row = 0;
    let column = 0;

    const totalTiles = rows * columns;

    for (let i = 0; i < totalTiles; i++) {
      callback({
        x: tile.x + column * tile.width - offsetWidth,
        y: tile.y + row * tile.height - offsetHeight,
      });

      if (column === columns - 1) {
        row++;
      }

      column = column < columns - 1 ? column + 1 : 0;
    }
  }

  static _getImageData(image, x, y, width, height) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    return tempContext.getImageData(x, y, width, height).data;
  }

  static _getVideoData(video) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    return tempContext._getImageData(0, 0, video.videoWidth, video.videoHeight)
      .data;
  }

  _transitionEnded() {
    // console.log('Transition Ended');
  }

  // eslint-disable-next-line
  _videoEnded(video, videoObject) {
    // console.log('Video Ended');

    const slide = this._slides[this._transitionToIndex];

    if (this._playing) {
      if (slide.duration && _.isFunction(slide.duration)) {
        let object = slide.duration();

        if (this._isType(object, 'video')) {
          this.nextSlide();
        }
      }
    }
  }

  // eslint-disable-next-line
  _slideLoaded(slide, slideIndex) {
    // console.log('Slide Loaded');
  }

  _slideRendered() {
    // console.log('Slide Rendered');

    if (!this._ready) {
      // Showy is ready for the first time
      this._ready = true;
      this.container.classList.add('showy--ready');
    }

    const slide = this._slides[this._transitionToIndex];

    if (this._playing) {
      let slideDuration = this.config.slideDuration;

      if (slide.duration) {
        if (_.isFunction(slide.duration)) {
          let object = slide.duration();

          if (this._isType(object, 'video')) {
            return;
          }
        }

        if (_.isNumber(slide.duration)) {
          slideDuration = slide.duration;
        }
      }

      this._autoPlayTimeout = setTimeout(() => {
        this.nextSlide();
      }, slideDuration);
    }
  }

  _animate(frameTime) {
    if (this._destroyed) {
      return;
    }

    this._fps = 1000 / (frameTime - this._lastFrameTime);

    try {
      this._drawSlides();

      window.requestAnimationFrame(this._animate.bind(this));
    } catch (error) {
      console.error(error);
    }

    this._lastFrameTime = frameTime;
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
    this._renderContext =
      this._renderCanvas.getContext('webgl') ||
      this._renderCanvas.getContext('experimental-webgl');
    this._renderContext.pixelStorei(
      this._renderContext.UNPACK_FLIP_Y_WEBGL,
      true
    );

    this._buffer = this._renderContext.createBuffer();
    this._renderContext.bindBuffer(
      this._renderContext.ARRAY_BUFFER,
      this._buffer
    );
    this._renderContext.bufferData(
      this._renderContext.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 3, 3, -1]), // see a-big-triangle
      this._renderContext.STATIC_DRAW
    );

    this.container.appendChild(this._renderCanvas);
  }

  _resizeCanvas(canvas) {
    this._scale = window.devicePixelRatio;
    this._width = this.container.clientWidth * this._scale;
    this._height = this.container.clientHeight * this._scale;
    canvas.width = this._width;
    canvas.height = this._height;
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
    context.clearRect(0, 0, this._width, this._height);
  }

  _transitionInProgress() {
    return this._transitionProgress > 0 && this._transitionProgress < 1;
  }

  _getTransition(currentSlideTransition = {}, nextPrevSlideTransition = {}) {
    const _currentSlideTransition = _.merge(
      {},
      this.config.transition,
      currentSlideTransition || {}
    );
    const _nextPrevSlideTransition = _.merge(
      {},
      this.config.transition,
      nextPrevSlideTransition || {}
    );
    if (_currentSlideTransition.name === TRANSITION_RANDOM) {
      _currentSlideTransition.glsl = _.sample(this.config.transitions);
    } else {
      _currentSlideTransition.glsl =
        this.config.transitions[_currentSlideTransition.name];
    }
    if (_nextPrevSlideTransition.name === TRANSITION_RANDOM) {
      _nextPrevSlideTransition.glsl = _.sample(this.config.transitions);
    } else {
      _nextPrevSlideTransition.glsl =
        this.config.transitions[_nextPrevSlideTransition.name];
    }
    const transition =
      _currentSlideTransition.priority >= _nextPrevSlideTransition.priority
        ? _currentSlideTransition
        : _nextPrevSlideTransition;
    return transition;
  }

  _drawSlides(reset) {
    const currentSlide = this._slides[this._currentSlideIndex];
    const nextSlide =
      this._slides[
        this._currentSlideIndex === this._slides.length - 1
          ? 0
          : this._currentSlideIndex + 1
      ];
    const prevSlide =
      this._slides[
        this._currentSlideIndex === 0
          ? this._slides.length - 1
          : this._currentSlideIndex - 1
      ];

    let transitionOptions;

    // Rerender the current slide eg. if canvas has been resized
    if (reset) {
      currentSlide._rendered = false;
    }

    // Only render if we need to ie. only during transitions
    // or if the current slide contains video(s)
    if (
      !currentSlide._hasVideo &&
      currentSlide._rendered &&
      !this._transitionInProgress() &&
      this._currentSlideIndex === this._transitionToIndex
    ) {
      return;
    }

    this._drawSlide(this._currentContext, currentSlide);
    this._drawSlide(this._nextContext, nextSlide);
    this._drawSlide(this._prevContext, prevSlide);

    // Dispose of textures used in previous frame
    if (this._fromTexture) {
      this._fromTexture.dispose();
    }
    if (this._toTexture) {
      this._toTexture.dispose();
    }

    // Transition is already running or has been triggered by a change of _transitionToIndex
    if (
      this._transitionToIndex !== this._currentSlideIndex ||
      this._transitionInProgress()
    ) {
      // We're heading to the next slide (or the transition has been cancelled halfway through)
      if (
        (this._transitionToIndex !== this._currentSlideIndex &&
          this._transitionDirection === TRANSITION_FORWARDS) ||
        (this._transitionToIndex === this._currentSlideIndex &&
          this._transitionDirection === TRANSITION_BACKWARDS)
      ) {
        this._fromTexture = createTexture(
          this._renderContext,
          this._currentCanvas
        );
        this._toTexture = createTexture(this._renderContext, this._nextCanvas);
        transitionOptions = this._getTransition(
          currentSlide.transitionNext,
          nextSlide.transitionPrev
        );
      }
      // We're heading to the previous slide (or the transition has been cancelled halfway through)
      if (
        (this._transitionToIndex !== this._currentSlideIndex &&
          this._transitionDirection === TRANSITION_BACKWARDS) ||
        (this._transitionToIndex === this._currentSlideIndex &&
          this._transitionDirection === TRANSITION_FORWARDS)
      ) {
        this._fromTexture = createTexture(
          this._renderContext,
          this._prevCanvas
        );
        this._toTexture = createTexture(
          this._renderContext,
          this._currentCanvas
        );
        transitionOptions = this._getTransition(
          currentSlide.transitionPrev,
          prevSlide.transitionNext
        );
      }
    } else {
      // We're not transitioning so just rerender current slide (only if needed)
      this._fromTexture = createTexture(
        this._renderContext,
        this._currentCanvas
      );
      this._toTexture = this._fromTexture;
    }

    if (
      transitionOptions &&
      !this._transitionInProgress() &&
      (!this._transitionOptions ||
        this._transitionOptions.name !== transitionOptions.name ||
        this._transitionOptions.name === TRANSITION_RANDOM)
    ) {
      // Update transition options if required
      this._transitionOptions = transitionOptions;

      if (this._transition) {
        // Destroy current transition in preparation to create a new one
        this._transition.dispose();
        this._transition = null;
      }
    }

    if (this._transitionOptions) {
      if (!this._transition) {
        if (!this._transitionOptions.glsl) {
          throw new Error(
            `Missing transition: ${this._transitionOptions.name}`
          );
        }

        this._transition = createTransition(
          this._renderContext,
          this._transitionOptions.glsl,
          { resizeMode: 'cover' }
        );
      }

      if (
        this._transitionToIndex !== this._currentSlideIndex ||
        this._transitionInProgress()
      ) {
        // Increment the transition progress depending on the direction
        const progressIncrement = 60 / this._transitionOptions.duration;

        if (this._transitionDirection === TRANSITION_FORWARDS) {
          this._transitionProgress = this._transitionInProgress()
            ? this._transitionProgress + progressIncrement
            : progressIncrement;
        }
        if (this._transitionDirection === TRANSITION_BACKWARDS) {
          this._transitionProgress = this._transitionInProgress()
            ? this._transitionProgress - progressIncrement
            : 1 - progressIncrement;
        }
      }

      // We've reached the end of the transition
      if (this._transitionProgress > 1) {
        this._transitionProgress = 1;
      }
      if (this._transitionProgress < 0) {
        this._transitionProgress = 0;
      }

      const easedTransitionProgress = eases[this._transitionOptions.ease](
        this._transitionProgress
      );

      this._transition.draw(
        easedTransitionProgress,
        this._fromTexture,
        this._toTexture,
        this._width,
        this._height,
        this._transitionOptions.glsl.defaultParams
      );
    } else {
      // No transition specified, just render
      if (!this._transition) {
        this._transition = createTransition(
          this._renderContext,
          TRANSITION_NONE,
          { resizeMode: 'cover' }
        );
      }

      this._transition.draw(
        1,
        this._fromTexture,
        this._toTexture,
        this._width,
        this._height
      );
    }

    this._renderContext.viewport(
      0,
      0,
      this._renderContext.drawingBufferWidth,
      this._renderContext.drawingBufferHeight
    );

    // We have rendered the current slide for the first time
    if (currentSlide._ready) {
      currentSlide._rendered = true;

      if (!this._currentSlideRendered) {
        this._currentSlideRendered = true;

        this._playSlideContent(this._transitionToIndex);

        this._slideRendered();
      }
    }

    // Transition is finished
    if (
      this._transitionToIndex !== this._currentSlideIndex &&
      !this._transitionInProgress()
    ) {
      this._currentSlideIndex = this._transitionToIndex;

      this._clearContext(this._currentContext);
      this._clearContext(this._nextContext);
      this._clearContext(this._prevContext);

      this._pauseSlideContent();

      this._transitionEnded();
    }
  }

  _isType(object, type) {
    return (
      object.type === type ||
      object[type] ||
      (this._regExp[type] &&
        object.url &&
        this._regExp[type].test(object.url)) ||
      (this._regExp[type] &&
        object.sources &&
        this._regExp[type].test(object.sources[0].url))
    );
  }

  _drawSlide(context, slide) {
    slide._hasVideo =
      slide.content.filter((object) => this._isType(object, 'video')).length >
      0;
    slide._rendered = false;
    slide._ready = false;

    if (slide.background) {
      context.fillStyle = slide.background;
      context.fillRect(0, 0, this._width, this._height);
    }

    if (slide.content.length) {
      this._drawSlideContent(context, slide, 0);
    }
  }

  _drawSlideContent(context, slide, index) {
    const object = slide.content[index];

    if (!object) {
      slide._ready = true;

      if (!slide._loaded) {
        slide._loaded = true;
        this._slideLoaded(slide, this._slides.indexOf(slide));
      }

      return;
    }

    const callback = this._drawSlideContent.bind(
      this,
      context,
      slide,
      index + 1
    );

    if (this._isType(object, 'video')) {
      this._drawVideo(context, object, callback);
      return;
    }

    if (this._isType(object, 'image')) {
      this._drawImage(context, object, callback);
      return;
    }

    if (this._isType(object, 'text')) {
      this._drawText(context, object, callback);
      return;
    }

    throw new Error('Unknown content type');
  }

  _position2Pixels(position, scale = 1) {
    const _pixels = [];

    position.forEach((val, index) => {
      let pixel;

      let length = [this._width, this._height, this._width, this._height][
        index
      ];

      length /= scale;

      if (val >= 0 && val <= 1) {
        if (index < 2) {
          pixel = val * length;
        } else {
          pixel = val * length - _pixels[index - 2];
        }
      } else if (index < 2) {
        pixel = val;
      } else {
        pixel = length - _pixels[index - 2] - Math.abs(val);
      }

      _pixels.push(pixel);
    });

    const pixels = {
      x: _pixels[0] * scale,
      y: _pixels[1] * scale,
      width: _pixels[2] * scale,
      height: _pixels[3] * scale,
    };

    return pixels;
  }

  _getImage(object, callback) {
    const url = typeof object.url === 'function' ? object.url() : object.url;

    if (this._imageMap[url]) {
      callback(this._imageMap[url]);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.src = url;
    image.onerror = () => {
      this.destroy();

      throw new Error('Image failed to load', url);
    };
    image.onload = () => {
      this._imageMap[url] = image;
      callback(image);
    };
  }

  _resizeImage(image, src, dst, callback) {
    const resizedImageKey = JSON.stringify({
      src: image.src,
      dst,
    });

    if (this._slideContentMap[resizedImageKey]) {
      callback(this._slideContentMap[resizedImageKey]);
      return;
    }

    pica
      .resizeBuffer({
        src: Showy._getImageData(image, src.x, src.y, src.width, src.height),
        width: src.width,
        height: src.height,
        toWidth: dst.width,
        toHeight: dst.height,
        // quality: 1,
        alpha: false,
        unsharpAmount: 0,
        unsharpRadius: 0.5,
        unsharpThreshold: 0,
      })
      .then(
        (buffer) => {
          if (buffer.length) {
            this._resizedImageData = new ImageData(
              new Uint8ClampedArray(buffer),
              dst.width,
              dst.height
            );

            this._slideContentMap[resizedImageKey] = this._resizedImageData;

            callback(this._slideContentMap[resizedImageKey]);

            return;
          }

          console.error(new Error('Resize failed'), image.src, src, dst);
        },
        (error) => {
          console.error(error);
        }
      );
  }

  _drawText(context, object, callback) {
    let dst = this._position2Pixels(object.position, this._scale);

    context.font = object.font || '72px sans-serif';
    context.textAlign = object.align || 'center';
    context.fillStyle = object.color || 'rgba(0, 0, 0, 1)';

    let maxWidth = object.maxWidth ? object.maxWidth * this._width : undefined;

    context.fillText(object.text, dst.x, dst.y, maxWidth);

    callback();
  }

  _drawImage(context, object, callback) {
    this._getImage(object, (image) => {
      let src = {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

      let dst = this._position2Pixels(object.position, this._scale);

      if (object.tile) {
        let tile = Showy._getTile(dst, object.tile.size);

        const updatedCoords = Showy._updateCoords(
          src,
          tile,
          object.tile.scaleMode
        );

        this._resizeImage(
          image,
          updatedCoords.src,
          updatedCoords.dst,
          (resizedImageData) => {
            Showy._drawTiles(
              dst,
              updatedCoords.dst,
              object.scaleMode,
              (tileCoord) => {
                context.putImageData(
                  resizedImageData,
                  tileCoord.x,
                  tileCoord.y
                );
              }
            );

            callback();
          }
        );

        return;
      }

      const updatedCoords = Showy._updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      this._resizeImage(image, src, dst, (resizedImageData) => {
        context.putImageData(resizedImageData, dst.x, dst.y);

        callback();
      });
    });
  }

  _getVideo(object, callback = () => {}) {
    const url = typeof object.url === 'function' ? object.url() : object.url;
    const sources =
      typeof object.sources === 'function' ? object.sources() : object.sources;

    const videoKey = JSON.stringify(url || sources);

    if (this._videoMap[videoKey]) {
      callback(this._videoMap[videoKey]);

      return this._videoMap[videoKey];
    }

    const video = document.createElement('video');
    video.style.display = 'none';
    video.crossOrigin = 'anonymous';
    video.muted = true;
    this.container.appendChild(video);

    if (sources) {
      sources.forEach((source) => {
        const _source = document.createElement('source');
        _source.src = source.url;
        if (source.type) {
          _source.type = source.type;
        }
        _source.crossOrigin = 'anonymous';
        video.appendChild(_source);
      });

      if (url) {
        video.poster = url;
      }
    } else if (url) {
      video.src = url;
    }

    this._videoMap[videoKey] = video;

    video.addEventListener('loadedmetadata', () => {
      callback(video);
    });

    video._playCount = 0;

    video.addEventListener('ended', () => {
      video.play();

      video._playCount += 1;

      this._videoEnded(video, object);
    });

    return video;
  }

  _drawVideo(context, object, callback) {
    this._getVideo(object, (video) => {
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
        let tile = Showy._getTile(dst, object.tile.size);

        const updatedCoords = Showy._updateCoords(
          src,
          tile,
          object.tile.scaleMode
        );

        Showy._drawTiles(
          dst,
          updatedCoords.dst,
          object.scaleMode,
          (tileCoord) => {
            context.drawImage(
              video,
              src.x,
              src.y,
              src.width,
              src.height,
              tileCoord.x,
              tileCoord.y,
              tile.width,
              tile.height
            );
          }
        );

        callback();

        return;
      }

      const updatedCoords = Showy._updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      context.drawImage(
        video,
        src.x,
        src.y,
        src.width,
        src.height,
        dst.x,
        dst.y,
        dst.width,
        dst.height
      );

      callback();
    });
  }

  _playSlideContent(index) {
    this._slides[index].content.forEach((object) => {
      if (this._isType(object, 'video')) {
        this._getVideo(object, (video) => {
          video._playCount = 0;
          video.currentTime = 0;
          video.play();
        });
      }
    });
  }

  _pauseSlideContent() {
    const currentSlideVideos = [];

    this._slides[this._currentSlideIndex].content.forEach((object) => {
      if (this._isType(object, 'video')) {
        currentSlideVideos.push(this._getVideo(object));
      }
    });

    this._slides.forEach((slide, index) => {
      if (index === this._currentSlideIndex) {
        return;
      }

      slide.content.forEach((object) => {
        if (this._isType(object, 'video')) {
          this._getVideo(object, (video) => {
            if (currentSlideVideos.indexOf(video) === -1) {
              video._playCount = 0;
              video.currentTime = 0;
              video.pause();
            }
          });
        }
      });
    });
  }
}

export default Showy;
