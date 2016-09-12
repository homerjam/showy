(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Showy = require('./src/showy').default;
Showy.DefaultTransitions = require('./src/transitions').default;

window.Showy = Showy;

module.exports = Showy;

},{"./src/showy":2,"./src/transitions":3}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var TRANSITION_FORWARDS = 'forwards';
var TRANSITION_BACKWARDS = 'backwards';
var TRANSITION_RANDOM = 'random';

var TRANSITION_NONE_SHADER = '\n  #ifdef GL_ES\n  precision highp float;\n  #endif\n  uniform sampler2D from, to;\n  uniform float progress;\n  uniform vec2 resolution;\n\n  void main() {\n    vec2 p = gl_FragCoord.xy / resolution.xy;\n    gl_FragColor = texture2D(to, p);\n  }\n';

// Polyfill playing status
if (window.HTMLMediaElement) {
  Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function get() {
      return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
  });
}

var Showy = function () {
  function Showy(config) {
    _classCallCheck(this, Showy);

    var defaultConfig = {
      container: 'body',
      slides: [],
      autoplay: false,
      slideDuration: 3000,
      transitions: Showy.DefaultTransitions,
      transition: {
        name: 'random',
        duration: 2000,
        ease: 'linear',
        priority: 0
      }
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
    this._currentSlideIndex = this._transitionToIndex = 0;
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

    this._createCanvases();

    this._resizeHandler = this.resize.bind(this);
    window.addEventListener('resize', this._resizeHandler);

    this._lastFrameTime = 0;
    window.requestAnimationFrame(this._animate.bind(this));
  }

  _createClass(Showy, [{
    key: 'goToSlide',
    value: function goToSlide(index, direction) {
      this._transitionToIndex = index;
      this._transitionDirection = direction;

      this._currentSlideRendered = false;

      if (this._autoPlayTimeout) {
        clearTimeout(this._autoPlayTimeout);
      }
    }
  }, {
    key: 'nextSlide',
    value: function nextSlide() {
      var index = void 0;

      if (this._transitionToIndex === this._currentSlideIndex - 1 || this._transitionToIndex === this._slides.length - 1 && this._currentSlideIndex === 0) {
        // Cancel and reverse the transition
        index = this._currentSlideIndex;
      } else {
        index = this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1;
      }

      this.goToSlide(index, TRANSITION_FORWARDS);
    }
  }, {
    key: 'prevSlide',
    value: function prevSlide() {
      var index = void 0;

      if (this._transitionToIndex === this._currentSlideIndex + 1 || this._transitionToIndex === 0 && this._currentSlideIndex === this._slides.length - 1) {
        // Cancel and reverse the transition
        index = this._currentSlideIndex;
      } else {
        index = this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1;
      }

      this.goToSlide(index, TRANSITION_BACKWARDS);
    }
  }, {
    key: 'play',
    value: function play() {
      this._playing = true;

      this.nextSlide();
    }
  }, {
    key: 'pause',
    value: function pause() {
      this._playing = false;

      if (this._autoPlayTimeout) {
        clearTimeout(this._autoPlayTimeout);
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var _this = this;

      this._playing = false;

      this._destroyed = true;

      window.removeEventListener('resize', this._resizeHandler);

      _.forEach(this._videoMap, function (video) {
        _this.container.removeChild(video);
        video = null;
      });
      this._videoMap = null;
    }
  }, {
    key: '_transitionEnded',
    value: function _transitionEnded() {
      // console.log('Transition Ended');
    }
  }, {
    key: '_videoEnded',
    value: function _videoEnded(video, videoObject) {
      // console.log('Video Ended');

      var slide = this._slides[this._transitionToIndex];

      if (this._playing) {
        if (slide.duration && _.isFunction(slide.duration)) {
          var object = slide.duration();

          if (object.type === 'video') {
            this.nextSlide();
          }
        }
      }
    }
  }, {
    key: '_slideLoaded',
    value: function _slideLoaded(slide, slideIndex) {
      // console.log('Slide Loaded');
    }
  }, {
    key: '_slideRendered',
    value: function _slideRendered() {
      var _this2 = this;

      // console.log('Slide Rendered');

      if (!this._ready) {
        // Showy is ready for the first time
        this._ready = true;
        this.container.classList.add('showy--ready');
      }

      var slide = this._slides[this._transitionToIndex];

      if (this._playing) {
        var slideDuration = this.config.slideDuration;

        if (slide.duration) {
          if (_.isFunction(slide.duration)) {
            var object = slide.duration();

            if (object.type === 'video') {
              return;
            }
          }

          if (_.isNumber(slide.duration)) {
            slideDuration = slide.duration;
          }
        }

        this._autoPlayTimeout = setTimeout(function () {
          _this2.nextSlide();
        }, slideDuration);
      }
    }
  }, {
    key: '_animate',
    value: function _animate(frameTime) {
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
  }, {
    key: '_createCanvas',
    value: function _createCanvas() {
      var canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      this._resizeCanvas(canvas);
      return canvas;
    }
  }, {
    key: '_createCanvases',
    value: function _createCanvases() {
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
  }, {
    key: '_resizeCanvas',
    value: function _resizeCanvas(canvas) {
      this._scale = window.devicePixelRatio;
      this._width = this.container.clientWidth * this._scale;
      this._height = this.container.clientHeight * this._scale;
      canvas.width = this._width;
      canvas.height = this._height;
    }
  }, {
    key: 'resize',
    value: function resize() {
      // Remove all cached imageData as this will be redundant now
      this._slideContentMap = {};

      this._resizeCanvas(this._currentCanvas);
      this._resizeCanvas(this._nextCanvas);
      this._resizeCanvas(this._prevCanvas);
      this._resizeCanvas(this._renderCanvas);

      this._drawSlides(true);
    }
  }, {
    key: '_clearContext',
    value: function _clearContext(context) {
      context.clearRect(0, 0, this._width, this._height);
    }
  }, {
    key: '_transitionInProgress',
    value: function _transitionInProgress() {
      return this._transitionProgress > 0 && this._transitionProgress < 1;
    }
  }, {
    key: '_getTransition',
    value: function _getTransition() {
      var currentSlideTransition = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var nextPrevSlideTransition = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var _currentSlideTransition = _.merge({}, this.config.transition, currentSlideTransition || {});
      var _nextPrevSlideTransition = _.merge({}, this.config.transition, nextPrevSlideTransition || {});
      if (_currentSlideTransition.name === TRANSITION_RANDOM) {
        _currentSlideTransition.glsl = _.sample(this.config.transitions);
      } else {
        _currentSlideTransition.glsl = this.config.transitions[_currentSlideTransition.name];
      }
      if (_nextPrevSlideTransition.name === TRANSITION_RANDOM) {
        _nextPrevSlideTransition.glsl = _.sample(this.config.transitions);
      } else {
        _nextPrevSlideTransition.glsl = this.config.transitions[_nextPrevSlideTransition.name];
      }
      var transition = _currentSlideTransition.priority >= _nextPrevSlideTransition.priority ? _currentSlideTransition : _nextPrevSlideTransition;
      return transition;
    }
  }, {
    key: '_drawSlides',
    value: function _drawSlides(reset) {
      var currentSlide = this._slides[this._currentSlideIndex];
      var nextSlide = this._slides[this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1];
      var prevSlide = this._slides[this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1];

      var transitionOptions = void 0;

      // Rerender the current slide eg. if canvas has been resized
      if (reset) {
        currentSlide._rendered = false;
      }

      // Only render if we need to ie. only during transitions
      // or if the current slide contains video(s)
      if (!currentSlide._hasVideo && currentSlide._rendered && !this._transitionInProgress() && this._currentSlideIndex === this._transitionToIndex) {
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
      if (this._transitionToIndex !== this._currentSlideIndex || this._transitionInProgress()) {
        // We're heading to the next slide (or the transition has been cancelled halfway through)
        if (this._transitionToIndex !== this._currentSlideIndex && this._transitionDirection === TRANSITION_FORWARDS || this._transitionToIndex === this._currentSlideIndex && this._transitionDirection === TRANSITION_BACKWARDS) {
          this._fromTexture = createTexture(this._renderContext, this._currentCanvas);
          this._toTexture = createTexture(this._renderContext, this._nextCanvas);
          transitionOptions = this._getTransition(currentSlide.transitionNext, nextSlide.transitionPrev);
        }
        // We're heading to the previous slide (or the transition has been cancelled halfway through)
        if (this._transitionToIndex !== this._currentSlideIndex && this._transitionDirection === TRANSITION_BACKWARDS || this._transitionToIndex === this._currentSlideIndex && this._transitionDirection === TRANSITION_FORWARDS) {
          this._fromTexture = createTexture(this._renderContext, this._prevCanvas);
          this._toTexture = createTexture(this._renderContext, this._currentCanvas);
          transitionOptions = this._getTransition(currentSlide.transitionPrev, prevSlide.transitionNext);
        }
      } else {
        // We're not transitioning so just rerender current slide (only if needed)
        this._fromTexture = createTexture(this._renderContext, this._currentCanvas);
        this._toTexture = this._fromTexture;
      }

      if (transitionOptions && !this._transitionInProgress() && (!this._transitionOptions || this._transitionOptions.name !== transitionOptions.name || this._transitionOptions.name === TRANSITION_RANDOM)) {
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
          this._transition = createTransition(this._renderContext, this._transitionOptions.glsl.shader);
        }

        if (this._transitionToIndex !== this._currentSlideIndex || this._transitionInProgress()) {
          // Increment the transition progress depending on the direction
          var progressIncrement = 60 / this._transitionOptions.duration;

          if (this._transitionDirection === TRANSITION_FORWARDS) {
            this._transitionProgress = this._transitionInProgress() ? this._transitionProgress + progressIncrement : progressIncrement;
          }
          if (this._transitionDirection === TRANSITION_BACKWARDS) {
            this._transitionProgress = this._transitionInProgress() ? this._transitionProgress - progressIncrement : 1 - progressIncrement;
          }
        }

        // We've reached the end of the transition
        if (this._transitionProgress > 1) {
          this._transitionProgress = 1;
        }
        if (this._transitionProgress < 0) {
          this._transitionProgress = 0;
        }

        var easedTransitionProgress = eases[this._transitionOptions.ease](this._transitionProgress);

        this._transition.render(easedTransitionProgress, this._fromTexture, this._toTexture, this._transitionOptions.glsl.uniforms);
      } else {
        // No transition specified, just render
        if (!this._transition) {
          this._transition = createTransition(this._renderContext, TRANSITION_NONE_SHADER);
        }

        this._transition.render(1, this._fromTexture, this._toTexture);
      }

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
      if (this._transitionToIndex !== this._currentSlideIndex && !this._transitionInProgress()) {
        this._currentSlideIndex = this._transitionToIndex;

        this._clearContext(this._currentContext);
        this._clearContext(this._nextContext);
        this._clearContext(this._prevContext);

        this._pauseSlideContent();

        this._transitionEnded();
      }
    }
  }, {
    key: '_drawSlide',
    value: function _drawSlide(context, slide) {
      slide._hasVideo = slide.content.filter(function (object) {
        return object.type === 'video';
      }).length > 0;
      slide._rendered = false;
      slide._ready = false;
      if (!slide._loaded) {
        slide._loaded = false;
      }

      if (slide.background) {
        context.fillStyle = slide.background;
        context.fillRect(0, 0, this._width, this._height);
      }

      if (slide.content.length) {
        this._drawSlideContent(context, slide, 0);
      }
    }
  }, {
    key: '_drawSlideContent',
    value: function _drawSlideContent(context, slide, index) {
      var object = slide.content[index];

      if (!object) {
        slide._ready = true;

        if (!slide._loaded) {
          slide._loaded = true;
          this._slideLoaded(slide, this._slides.indexOf(slide));
        }
        return;
      }

      var callback = this._drawSlideContent.bind(this, context, slide, index + 1);

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
  }, {
    key: '_position2Pixels',
    value: function _position2Pixels(position) {
      var _this3 = this;

      var scale = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

      var _pixels = [];

      position.forEach(function (val, index) {
        var pixel = void 0;

        var length = [_this3._width, _this3._height, _this3._width, _this3._height][index];

        length /= scale;

        if (val >= 0 && val <= 1) {
          if (index < 2) {
            pixel = val * length;
          } else {
            pixel = val * length - _pixels[index - 2];
          }
        } else {
          if (index < 2) {
            pixel = val;
          } else {
            pixel = length - _pixels[index - 2] - Math.abs(val);
          }
        }

        _pixels.push(pixel);
      });

      var pixels = {
        x: _pixels[0] * scale,
        y: _pixels[1] * scale,
        width: _pixels[2] * scale,
        height: _pixels[3] * scale
      };

      return pixels;
    }
  }, {
    key: '_updateCoords',
    value: function _updateCoords(src, dst, scaleMode) {
      var srcRatio = src.width / src.height;
      var dstRatio = dst.width / dst.height;

      if (scaleMode && scaleMode === 'fill') {
        if (srcRatio < dstRatio) {
          var newHeight = dst.height * (src.width / dst.width);
          src.y = src.y + (src.height - newHeight) * 0.5;
          src.height = newHeight;
        }
        if (srcRatio > dstRatio) {
          var newWidth = dst.width * (src.height / dst.height);
          src.x = src.x + (src.width - newWidth) * 0.5;
          src.width = newWidth;
        }
      } else {
        if (srcRatio > dstRatio) {
          var _newHeight = dst.width * (src.height / src.width);
          dst.y = dst.y + (dst.height - _newHeight) * 0.5;
          dst.height = _newHeight;
        }
        if (srcRatio < dstRatio) {
          var _newWidth = dst.height * srcRatio;
          dst.x = dst.x + (dst.width - _newWidth) * 0.5;
          dst.width = _newWidth;
        }
      }

      // Round properties for pica (and general speed up)
      var roundProps = ['x', 'y', 'width', 'height'];

      roundProps.forEach(function (prop) {
        src[prop] = Math.round(src[prop]);
        dst[prop] = Math.round(dst[prop]);
      });

      return {
        src: src,
        dst: dst
      };
    }
  }, {
    key: '_getTile',
    value: function _getTile(dst, size) {
      return {
        x: dst.x,
        y: dst.y,
        width: size[0] <= 1 ? dst.width * size[0] : size[0],
        height: size[1] <= 1 ? dst.height * size[1] : size[1]
      };
    }
  }, {
    key: '_drawTiles',
    value: function _drawTiles(dst, tile, scaleMode, callback) {
      var rows = void 0;
      var columns = void 0;

      var offsetWidth = 0;
      var offsetHeight = 0;

      if (scaleMode && scaleMode === 'fill') {
        rows = Math.ceil(dst.height / tile.height);
        columns = Math.ceil(dst.width / tile.width);

        offsetWidth = (tile.width * columns - dst.width) * 0.5;
        offsetHeight = (tile.height * rows - dst.height) * 0.5;
      } else {
        rows = Math.floor(dst.height / tile.height);
        columns = Math.floor(dst.width / tile.width);
      }

      var row = 0;
      var column = 0;

      var totalTiles = rows * columns;

      for (var i = 0; i < totalTiles; i++) {
        callback({
          x: tile.x + column * tile.width - offsetWidth,
          y: tile.y + row * tile.height - offsetHeight
        });

        if (column === columns - 1) {
          row++;
        }

        column = column < columns - 1 ? column + 1 : 0;
      }
    }
  }, {
    key: '_getImageData',
    value: function _getImageData(image, x, y, width, height) {
      var tempCanvas = document.createElement('canvas');
      tempCanvas.width = image.naturalWidth;
      tempCanvas.height = image.naturalHeight;
      var tempContext = tempCanvas.getContext('2d');
      tempContext.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
      return tempContext.getImageData(x, y, width, height).data;
    }
  }, {
    key: '_getImage',
    value: function _getImage(imageUrl, callback) {
      var _this4 = this;

      if (this._imageMap[imageUrl]) {
        callback(this._imageMap[imageUrl]);
        return;
      }

      var image = new Image();
      image.crossOrigin = 'Anonymous';
      image.src = imageUrl;
      image.onerror = function (event) {
        _this4.destroy();

        throw new Error('Image failed to load', imageUrl);
      };
      image.onload = function (event) {
        _this4._imageMap[imageUrl] = image;
        callback(image);
      };
    }
  }, {
    key: '_resizeImage',
    value: function _resizeImage(image, src, dst, callback) {
      var _this5 = this;

      var resizedImageKey = JSON.stringify({
        src: image.src,
        dst: dst
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
        unsharpThreshold: 0
      }, function (error, buffer) {
        if (error) {
          console.error(error);
          return;
        }

        if (buffer.length) {
          _this5._resizedImageData = new ImageData(new Uint8ClampedArray(buffer), dst.width, dst.height);

          _this5._slideContentMap[resizedImageKey] = _this5._resizedImageData;

          callback(_this5._slideContentMap[resizedImageKey]);

          return;
        }

        console.error(new Error('Resize failed'), image.src, src, dst);
      });
    }
  }, {
    key: '_drawImage',
    value: function _drawImage(context, object, callback) {
      var _this6 = this;

      this._getImage(object.url, function (image) {
        var src = {
          x: 0,
          y: 0,
          width: image.naturalWidth,
          height: image.naturalHeight
        };

        var dst = _this6._position2Pixels(object.position, _this6._scale);

        if (object.tile) {
          var _ret = function () {
            var tile = _this6._getTile(dst, object.tile.size);

            var updatedCoords = _this6._updateCoords(src, tile, object.tile.scaleMode);

            _this6._resizeImage(image, updatedCoords.src, updatedCoords.dst, function (resizedImageData) {

              _this6._drawTiles(dst, updatedCoords.dst, object.scaleMode, function (tileCoord) {
                context.putImageData(resizedImageData, tileCoord.x, tileCoord.y);
              });

              callback();
            });

            return {
              v: void 0
            };
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }

        var updatedCoords = _this6._updateCoords(src, dst, object.scaleMode);

        src = updatedCoords.src;
        dst = updatedCoords.dst;

        _this6._resizeImage(image, src, dst, function (resizedImageData) {
          context.putImageData(resizedImageData, dst.x, dst.y);

          callback();
        });
      });
    }
  }, {
    key: '_getVideoData',
    value: function _getVideoData(video) {
      var tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      var tempContext = tempCanvas.getContext('2d');
      tempContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      return tempContext._getImageData(0, 0, video.videoWidth, video.videoHeight).data;
    }
  }, {
    key: '_getVideo',
    value: function _getVideo(object) {
      var _this7 = this;

      var callback = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

      var videoKey = JSON.stringify(object.sources);

      if (this._videoMap[videoKey]) {
        callback(this._videoMap[videoKey]);

        return this._videoMap[videoKey];
      }

      var video = document.createElement('video');
      video.style.display = 'none';
      video.crossOrigin = 'anonymous';
      video.muted = true;
      this.container.appendChild(video);

      object.sources.forEach(function (source) {
        var _source = document.createElement('source');
        _source.src = source.url;
        _source.type = source.type;
        _source.crossOrigin = 'anonymous';
        video.appendChild(_source);
      });

      this._videoMap[videoKey] = video;

      video.addEventListener('loadedmetadata', function () {
        callback(video);
      });

      video._playCount = 0;

      video.addEventListener('ended', function () {
        video.play();

        video._playCount += 1;

        _this7._videoEnded(video, object);
      });

      return video;
    }
  }, {
    key: '_drawVideo',
    value: function _drawVideo(context, object, callback) {
      var _this8 = this;

      this._getVideo(object, function (video) {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          return;
        }

        var src = {
          x: 0,
          y: 0,
          width: video.videoWidth,
          height: video.videoHeight
        };

        var dst = _this8._position2Pixels(object.position, _this8._scale);

        if (object.tile) {
          var _ret2 = function () {
            var tile = _this8._getTile(dst, object.tile.size);

            var updatedCoords = _this8._updateCoords(src, tile, object.tile.scaleMode);

            _this8._drawTiles(dst, updatedCoords.dst, object.scaleMode, function (tileCoord) {
              context.drawImage(video, src.x, src.y, src.width, src.height, tileCoord.x, tileCoord.y, tile.width, tile.height);
            });

            callback();

            return {
              v: void 0
            };
          }();

          if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
        }

        var updatedCoords = _this8._updateCoords(src, dst, object.scaleMode);

        src = updatedCoords.src;
        dst = updatedCoords.dst;

        context.drawImage(video, src.x, src.y, src.width, src.height, dst.x, dst.y, dst.width, dst.height);

        callback();
      });
    }
  }, {
    key: '_playSlideContent',
    value: function _playSlideContent(index) {
      var _this9 = this;

      this._slides[index].content.forEach(function (object) {
        if (object.type === 'video') {
          _this9._getVideo(object, function (video) {
            video._playCount = 0;
            video.currentTime = 0;
            video.play();
          });
        }
      });
    }
  }, {
    key: '_pauseSlideContent',
    value: function _pauseSlideContent() {
      var _this10 = this;

      var currentSlideVideos = [];

      this._slides[this._currentSlideIndex].content.forEach(function (object) {
        if (object.type === 'video') {
          currentSlideVideos.push(_this10._getVideo(object));
        }
      });

      this._slides.forEach(function (slide, index) {
        if (index === _this10._currentSlideIndex) {
          return;
        }

        slide.content.forEach(function (object) {
          if (object.type === 'video') {
            _this10._getVideo(object, function (video) {
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
  }]);

  return Showy;
}();

exports.default = Showy;

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var transitions = {
  none: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      void main() {\n        vec2 p = gl_FragCoord.xy / resolution.xy;\n        gl_FragColor = texture2D(to, p);\n      }\n    ",
    uniforms: {}
  },
  crossfade: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      void main() {\n        vec2 p = gl_FragCoord.xy / resolution.xy;\n        gl_FragColor = mix(texture2D(from, p), texture2D(to, p), progress);\n      }\n    ",
    uniforms: {}
  },
  wipeUp: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      void main() {\n        vec2 p = gl_FragCoord.xy / resolution.xy;\n        vec4 a = texture2D(from, p);\n        vec4 b = texture2D(to, p);\n        gl_FragColor = mix(a, b, step(0.0 + p.y, progress));\n      }\n    ",
    uniforms: {}
  },
  wipeDown: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      void main() {\n        vec2 p = gl_FragCoord.xy / resolution.xy;\n        vec4 a = texture2D(from, p);\n        vec4 b = texture2D(to, p);\n        gl_FragColor = mix(a, b, step(1.0 - p.y, progress));\n      }\n    ",
    uniforms: {}
  },
  wipeRight: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      void main() {\n        vec2 p = gl_FragCoord.xy / resolution.xy;\n        vec4 a = texture2D(from, p);\n        vec4 b = texture2D(to, p);\n        gl_FragColor = mix(a, b, step(0.0 + p.x, progress));\n      }\n    ",
    uniforms: {}
  },
  wipeLeft: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      void main() {\n        vec2 p = gl_FragCoord.xy / resolution.xy;\n        vec4 a = texture2D(from, p);\n        vec4 b = texture2D(to, p);\n        gl_FragColor = mix(a, b, step(1.0 - p.x, progress));\n      }\n    ",
    uniforms: {}
  },
  circle: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      uniform float centerX;\n      uniform float centerY;\n      uniform float smoothness;\n      uniform bool grow;\n\n      vec2 center = vec2(centerX, 1.0 - centerY);\n      float scale = sqrt(min(resolution[0] / resolution[1], resolution[1] / resolution[0]) / max(centerX, 1.0 - centerY));\n\n      void main() {\n        vec2 p = gl_FragCoord.xy / resolution.xy;\n        float size = grow ? progress : 1.0 - progress;\n        float dist = distance(center, p);\n        float circle = smoothstep(-smoothness, 0.0, scale * dist - size * (1.0 + smoothness));\n        gl_FragColor = mix(texture2D(from, p), texture2D(to, p), grow ? 1.0 - circle : circle);\n      }\n    ",
    uniforms: {
      centerX: 0.5,
      centerY: 0.5,
      smoothness: 0,
      grow: true
    }
  },
  circleInOut: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      float maxRadius = resolution.x + resolution.y;\n\n      void main() {\n        vec2 p = gl_FragCoord.xy / resolution.xy;\n\n        float distX = gl_FragCoord.x - resolution.x / 2.0;\n        float distY = gl_FragCoord.y - resolution.y / 2.0;\n        float dist = sqrt(distX * distX + distY * distY);\n\n        float step = 2.0 * abs(progress - 0.5);\n        step = step * step * step;\n\n        if (dist < step * maxRadius)\n        {\n          if (progress < 0.5)\n            gl_FragColor = texture2D(from, p);\n          else\n            gl_FragColor = texture2D(to, p);\n        }\n        else\n          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n      }\n    ",
    uniforms: {}
  },
  splitVertical: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n\n      // General parameters\n      uniform sampler2D from;\n      uniform sampler2D to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      uniform float reflection;\n      uniform float perspective;\n      uniform float depth;\n\n      const vec4 black = vec4(0.0, 0.0, 0.0, 1.0);\n      const vec2 boundMin = vec2(0.0, 0.0);\n      const vec2 boundMax = vec2(1.0, 1.0);\n\n      bool inBounds (vec2 p) {\n        return all(lessThan(boundMin, p)) && all(lessThan(p, boundMax));\n      }\n\n      vec2 project (vec2 p) {\n        return p * vec2(1.0, -1.2) + vec2(0.0, -0.02);\n      }\n\n      vec4 bgColor (vec2 p, vec2 pto) {\n        vec4 c = black;\n        pto = project(pto);\n        if (inBounds(pto)) {\n          c += mix(black, texture2D(to, pto), reflection * mix(1.0, 0.0, pto.y));\n        }\n        return c;\n      }\n\n      void main() {\n        vec2 p = gl_FragCoord.xy / resolution.xy;\n\n        vec2 pfr = vec2(-1.), pto = vec2(-1.);\n\n        float middleSlit = 2.0 * abs(p.x-0.5) - progress;\n        if (middleSlit > 0.0) {\n          pfr = p + (p.x > 0.5 ? -1.0 : 1.0) * vec2(0.5*progress, 0.0);\n          float d = 1.0/(1.0+perspective*progress*(1.0-middleSlit));\n          pfr.y -= d/2.;\n          pfr.y *= d;\n          pfr.y += d/2.;\n        }\n\n        float size = mix(1.0, depth, 1.-progress);\n        pto = (p + vec2(-0.5, -0.5)) * vec2(size, size) + vec2(0.5, 0.5);\n\n        if (inBounds(pfr)) {\n          gl_FragColor = texture2D(from, pfr);\n        }\n        else if (inBounds(pto)) {\n          gl_FragColor = texture2D(to, pto);\n        }\n        else {\n          gl_FragColor = bgColor(p, pto);\n        }\n      }\n    ",
    uniforms: {
      reflection: 0,
      perspective: 0,
      depth: 1
    }
  },
  slideUp: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      uniform float translateX;\n      uniform float translateY;\n\n      void main() {\n          vec2 texCoord = gl_FragCoord.xy / resolution.xy;\n          float x = progress * translateX;\n          float y = progress * translateY;\n\n          if (x >= 0.0 && y >= 0.0) {\n              if (texCoord.x >= x && texCoord.y >= y) {\n                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n              }\n              else {\n                  vec2 uv;\n                  if (x > 0.0)\n                      uv = vec2(x - 1.0, y);\n                  else if (y > 0.0)\n                      uv = vec2(x, y - 1.0);\n                  gl_FragColor = texture2D(to, texCoord - uv);\n              }\n          }\n          else if (x <= 0.0 && y <= 0.0) {\n              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))\n                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n              else {\n                  vec2 uv;\n                  if (x < 0.0)\n                      uv = vec2(x + 1.0, y);\n                  else if (y < 0.0)\n                      uv = vec2(x, y + 1.0);\n                  gl_FragColor = texture2D(to, texCoord - uv);\n              }\n          }\n          else\n              gl_FragColor = vec4(0.0);\n      }\n    ",
    uniforms: {
      translateX: 0,
      translateY: 1
    }
  },
  slideDown: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      uniform float translateX;\n      uniform float translateY;\n\n      void main() {\n          vec2 texCoord = gl_FragCoord.xy / resolution.xy;\n          float x = progress * translateX;\n          float y = progress * translateY;\n\n          if (x >= 0.0 && y >= 0.0) {\n              if (texCoord.x >= x && texCoord.y >= y) {\n                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n              }\n              else {\n                  vec2 uv;\n                  if (x > 0.0)\n                      uv = vec2(x - 1.0, y);\n                  else if (y > 0.0)\n                      uv = vec2(x, y - 1.0);\n                  gl_FragColor = texture2D(to, texCoord - uv);\n              }\n          }\n          else if (x <= 0.0 && y <= 0.0) {\n              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))\n                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n              else {\n                  vec2 uv;\n                  if (x < 0.0)\n                      uv = vec2(x + 1.0, y);\n                  else if (y < 0.0)\n                      uv = vec2(x, y + 1.0);\n                  gl_FragColor = texture2D(to, texCoord - uv);\n              }\n          }\n          else\n              gl_FragColor = vec4(0.0);\n      }\n    ",
    uniforms: {
      translateX: 0,
      translateY: -1
    }
  },
  slideLeft: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      uniform float translateX;\n      uniform float translateY;\n\n      void main() {\n          vec2 texCoord = gl_FragCoord.xy / resolution.xy;\n          float x = progress * translateX;\n          float y = progress * translateY;\n\n          if (x >= 0.0 && y >= 0.0) {\n              if (texCoord.x >= x && texCoord.y >= y) {\n                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n              }\n              else {\n                  vec2 uv;\n                  if (x > 0.0)\n                      uv = vec2(x - 1.0, y);\n                  else if (y > 0.0)\n                      uv = vec2(x, y - 1.0);\n                  gl_FragColor = texture2D(to, texCoord - uv);\n              }\n          }\n          else if (x <= 0.0 && y <= 0.0) {\n              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))\n                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n              else {\n                  vec2 uv;\n                  if (x < 0.0)\n                      uv = vec2(x + 1.0, y);\n                  else if (y < 0.0)\n                      uv = vec2(x, y + 1.0);\n                  gl_FragColor = texture2D(to, texCoord - uv);\n              }\n          }\n          else\n              gl_FragColor = vec4(0.0);\n      }\n    ",
    uniforms: {
      translateX: 1,
      translateY: 0
    }
  },
  slideRight: {
    shader: "\n      #ifdef GL_ES\n      precision highp float;\n      #endif\n      uniform sampler2D from, to;\n      uniform float progress;\n      uniform vec2 resolution;\n\n      uniform float translateX;\n      uniform float translateY;\n\n      void main() {\n          vec2 texCoord = gl_FragCoord.xy / resolution.xy;\n          float x = progress * translateX;\n          float y = progress * translateY;\n\n          if (x >= 0.0 && y >= 0.0) {\n              if (texCoord.x >= x && texCoord.y >= y) {\n                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n              }\n              else {\n                  vec2 uv;\n                  if (x > 0.0)\n                      uv = vec2(x - 1.0, y);\n                  else if (y > 0.0)\n                      uv = vec2(x, y - 1.0);\n                  gl_FragColor = texture2D(to, texCoord - uv);\n              }\n          }\n          else if (x <= 0.0 && y <= 0.0) {\n              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))\n                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n              else {\n                  vec2 uv;\n                  if (x < 0.0)\n                      uv = vec2(x + 1.0, y);\n                  else if (y < 0.0)\n                      uv = vec2(x, y + 1.0);\n                  gl_FragColor = texture2D(to, texCoord - uv);\n              }\n          }\n          else\n              gl_FragColor = vec4(0.0);\n      }\n    ",
    uniforms: {
      translateX: -1,
      translateY: 0
    }
  }
};

exports.default = transitions;

},{}]},{},[1])
//# sourceMappingURL=showy.js.map
