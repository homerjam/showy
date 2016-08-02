/**
 * TODO
 * - play/pause
 * - background color
 * - events (ready, progress etc)
 * - cache video frames (assume frame rate and round currentTime to get frame)
 * - video options (loop?)
 * - fallback for no-video / autoplay on mobile
 * - effects/filters (sepia / grayscale etc)
 * - fallback for no-webgl (use gsap?)
 */

import transitions from './transitions';

const TRANSITION_FORWARDS = 'forwards';
const TRANSITION_BACKWARDS = 'backwards';
const TRANSITION_RANDOM = 'random';

// Polyfill playing status
Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
  get: function () {
    return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
  },
});

class Showy {
  constructor(config) {
    const defaultConfig = {
      container: 'body',
      slides: [],
      transitions,
      autoplay: true,
      slideDuration: 3000,
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

    this._slides = this.config.slides;
    this._currentSlideIndex = this._transitionToIndex = 0;
    this._currentSlideRendered = false;
    this._transitionProgress = 0;
    this._imageMap = {};
    this._videoMap = {};
    this._slideContentMap = {};
    this._ready = false;
    this._destroyed = false;

    this._createCanvases();

    this.transition = this._getTransition();

    this._resizeHandler = this.resize.bind(this);
    window.addEventListener('resize', this._resizeHandler);

    this._lastFrameTime = 0;
    window.requestAnimationFrame(this._animate.bind(this));
  }

  goToSlide(index, direction) {
    this._transitionToIndex = index;
    this._transitionDirection = direction;

    this._currentSlideRendered = false;

    this._playSlideContent(this._transitionToIndex);
  }

  nextSlide() {
    if (this._transitionToIndex === this._currentSlideIndex - 1 || (this._transitionToIndex === this._slides.length - 1 && this._currentSlideIndex === 0)) {
      // Cancel and reverse the transition
      this.goToSlide(this._currentSlideIndex, TRANSITION_FORWARDS);

    } else {
      this.goToSlide(this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1, TRANSITION_FORWARDS);
    }
  }

  prevSlide() {
    if (this._transitionToIndex === this._currentSlideIndex + 1 || (this._transitionToIndex === 0 && this._currentSlideIndex === this._slides.length - 1)) {
      // Cancel and reverse the transition
      this.goToSlide(this._currentSlideIndex, TRANSITION_BACKWARDS);

    } else {
      this.goToSlide(this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1, TRANSITION_BACKWARDS);
    }
  }

  destroy() {
    this._destroyed = true;

    window.removeEventListener('resize', this._resizeHandler);

    for (let i in this._videoMap) {
      let video = this._videoMap[i];
      this.container.removeChild(video);
      video = null;
    }
    this._videoMap = null;
  }

  _transitionEnded() {
    // console.log('Transition Ended', this._currentSlideIndex, this._slides[this._currentSlideIndex]);
  }

  _videoEnded(video, videoObject) {
    // console.log('Video Ended', video._playCount, videoObject);

    const slide = this._slides[this._transitionToIndex];

    if (this.config.autoplay) {
      if (slide.duration && _.isFunction(slide.duration)) {
        let object = slide.duration();

        if (object.type === 'video') {
          this.nextSlide();
        }
      }
    }
  }

  _slideLoaded(slide, slideIndex) {
    // console.log('Slide Loaded', slideIndex, slide);
  }

  _slideRendered() {
    // console.log('Slide Rendered', this._transitionToIndex, this._slides[this._transitionToIndex]);

    if (!this._ready) {
      this._ready = true;
      this.container.classList.add('ready');
    }

    const slide = this._slides[this._transitionToIndex];

    if (this.config.autoplay) {
      let slideDuration = this.config.slideDuration;

      if (slide.duration) {
        if (_.isFunction(slide.duration)) {
          let object = slide.duration();

          if (object.type === 'video') {
            return;
          }
        }

        if (_.isNumber(slide.duration)) {
          slideDuration = slide.duration;
        }
      }

      setTimeout(() => {
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
      console.error(error.stack);
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

  _getTransition(currentSlideTransition = {}, nextPrevSlideTransition = {}) {
    const _currentSlideTransition = _.merge({}, this.config.transition, currentSlideTransition || {});
    const _nextPrevSlideTransition = _.merge({}, this.config.transition, nextPrevSlideTransition || {});
    if (_currentSlideTransition.name === TRANSITION_RANDOM) {
      _currentSlideTransition.shader = _.sample(this.config.transitions);
    } else {
      _currentSlideTransition.shader = this.config.transitions[_currentSlideTransition.name];
    }
    if (_nextPrevSlideTransition.name === TRANSITION_RANDOM) {
      _nextPrevSlideTransition.shader = _.sample(this.config.transitions);
    } else {
      _nextPrevSlideTransition.shader = this.config.transitions[_nextPrevSlideTransition.name];
    }
    return _currentSlideTransition.priority >= _nextPrevSlideTransition.priority ? _currentSlideTransition : _nextPrevSlideTransition;
  }

  _drawSlides(reset) {
    const currentSlide = this._slides[this._currentSlideIndex];
    const nextSlide = this._slides[this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1];
    const prevSlide = this._slides[this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1];

    let transition;

    // Rerender the current slide eg. if canvas has been resized
    if (reset) {
      currentSlide._rendered = false;
    }

    // Only render if we need to ie. only during transitions
    // or if the current slide contains video(s)
    if (!currentSlide._hasVideo &&
      currentSlide._rendered &&
      !this._transitionInProgress() &&
      this._currentSlideIndex === this._transitionToIndex) {
      return;
    }

    this._drawSlide(this._currentContext, currentSlide);
    this._drawSlide(this._nextContext, nextSlide);
    this._drawSlide(this._prevContext, prevSlide);

    if (this._fromTexture) {
      this._fromTexture.dispose();
    }

    if (this._toTexture) {
      this._toTexture.dispose();
    }

    // Transition is already running or has been triggered by a change of _transitionToIndex
    if (this._transitionToIndex !== this._currentSlideIndex || this._transitionInProgress()) {
      // We're heading to the next slide (or the transition has been cancelled halfway through)
      if ((this._transitionToIndex !== this._currentSlideIndex && this._transitionDirection === TRANSITION_FORWARDS) ||
        (this._transitionToIndex === this._currentSlideIndex && this._transitionDirection === TRANSITION_BACKWARDS)) {
        this._fromTexture = createTexture(this._renderContext, this._currentCanvas);
        this._toTexture = createTexture(this._renderContext, this._nextCanvas);
        transition = this._getTransition(currentSlide.transitionNext, nextSlide.transitionPrev);
      }
      // We're heading to the previous slide (or the transition has been cancelled halfway through)
      if ((this._transitionToIndex !== this._currentSlideIndex && this._transitionDirection === TRANSITION_BACKWARDS) ||
        (this._transitionToIndex === this._currentSlideIndex && this._transitionDirection === TRANSITION_FORWARDS)) {
        this._fromTexture = createTexture(this._renderContext, this._prevCanvas);
        this._toTexture = createTexture(this._renderContext, this._currentCanvas);
        transition = this._getTransition(currentSlide.transitionPrev, prevSlide.transitionNext);
      }

      // console.log(this._fps);
      const progressIncrement = 60 / transition.duration;

      // Increment the transition progress depending on the direction
      if (this._transitionDirection === TRANSITION_FORWARDS) {
        this._transitionProgress = this._transitionInProgress() ? this._transitionProgress + progressIncrement : progressIncrement;
      }
      if (this._transitionDirection === TRANSITION_BACKWARDS) {
        this._transitionProgress = this._transitionInProgress() ? this._transitionProgress - progressIncrement : 1 - progressIncrement;
      }

      // We've reached the end of the transition
      if (this._transitionProgress > 1) {
        this._transitionProgress = 1;
      }
      if (this._transitionProgress < 0) {
        this._transitionProgress = 0;
      }

    } else {
      // We're not transitioning so just rerender current slide (only if needed)
      this._fromTexture = createTexture(this._renderContext, this._currentCanvas);
      this._toTexture = this._fromTexture;
    }

    if (transition && !this._transitionInProgress() && (this.transition.name !== transition.name || this.transition.name === TRANSITION_RANDOM)) {
      this.transition = transition;
      if (this._transition) {
        this._transition.dispose();
        this._transition = null;
      }
    }

    if (!this._transition) {
      this._transition = createTransition(this._renderContext, this.transition.shader.glsl);
    }

    const easedTransitionProgress = eases[this.transition.ease](this._transitionProgress);

    this._transition.render(easedTransitionProgress, this._fromTexture, this._toTexture, this.transition.shader.uniforms);

    // We have rendered the current slide for the first time
    if (currentSlide._ready) {
      currentSlide._rendered = true;

      if (!this._currentSlideRendered) {
        this._currentSlideRendered = true;
        this._slideRendered();
      }
    }

    // Transition is finished
    if (this._transitionToIndex !== this._currentSlideIndex && !this._transitionInProgress()) {
      this._currentSlideIndex = this._transitionToIndex;

      this._clearContext(this._currentContext);
      this._clearContext(this._nextContext);
      this._clearContext(this._prevContext);

      this._pauseSlideContent();

      this._transitionEnded();
    }
  }

  _drawSlide(context, slide) {
    slide._hasVideo = slide.content.filter(object => object.type === 'video').length > 0;
    slide._rendered = false;
    slide._ready = false;
    if (!slide._loaded) {
      slide._loaded = false;
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
    image.crossOrigin = 'Anonymous';
    image.src = imageUrl;
    image.onload = event => {
      this._imageMap[imageUrl] = image;
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

  _getVideo(object, callback = () => {}) {
    const videoKey = JSON.stringify(object.sources);

    if (this._videoMap[videoKey]) {
      callback(this._videoMap[videoKey]);

      return this._videoMap[videoKey];
    }

    const video = document.createElement('video');
    video.style.display = 'none';
    video.crossOrigin = 'anonymous';
    video.muted = true;
    this.container.appendChild(video);

    object.sources.forEach(source => {
      const _source = document.createElement('source');
      _source.src = source.url;
      _source.type = source.type;
      video.appendChild(_source);
    });

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
    this._getVideo(object, video => {
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

  _playSlideContent(index) {
    this._slides[index].content.forEach(object => {
      if (object.type === 'video') {
        this._getVideo(object, video => {
          video._playCount = 0;
          video.currentTime = 0;
          video.play();
        });
      }
    });
  }

  _pauseSlideContent() {
    const currentSlideVideos = [];

    this._slides[this._currentSlideIndex].content.forEach(object => {
      if (object.type === 'video') {
        currentSlideVideos.push(this._getVideo(object));
      }
    });

    this._slides.forEach((slide, index) => {
      if (index === this._currentSlideIndex) {
        return;
      }

      slide.content.forEach(object => {
        if (object.type === 'video') {
          this._getVideo(object, video => {
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
