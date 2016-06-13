(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.Showy = require('./src/showy').default;

},{"./src/showy":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * TODO
 * - cache video frames (assume frame rate and round currentTime to get frame)
 * - fallback for no-video / autoplay on mobile
 * - effects/filters (sepia / grayscale etc)
 * - fallback for no-webgl (use gsap?)
 */

var TRANSITION_FORWARDS = 'forwards';
var TRANSITION_BACKWARDS = 'backwards';

var Showy = function () {
  function Showy(config) {
    _classCallCheck(this, Showy);

    var defaultConfig = {
      container: 'body',
      slides: [],
      glslTransitions: {},
      transition: {
        name: 'slide',
        duration: 2000,
        ease: 'linear',
        priority: 0
      }
    };

    this.config = _.extend({}, defaultConfig, config);

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

    this.transition = this._getTransition();

    window.addEventListener('resize', this.resize.bind(this));

    this._lastFrameTime = 0;
    window.requestAnimationFrame(this._animate.bind(this));
  }

  _createClass(Showy, [{
    key: 'nextSlide',
    value: function nextSlide() {
      this._transitionDirection = TRANSITION_FORWARDS;

      if (this._transitionToIndex === this._currentSlideIndex - 1 || this._transitionToIndex === this._slides.length - 1 && this._currentSlideIndex === 0) {
        // Cancel and reverse the transition
        this._transitionToIndex = this._currentSlideIndex;
      } else {
        this._transitionToIndex = this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1;
      }
    }
  }, {
    key: 'prevSlide',
    value: function prevSlide() {
      this._transitionDirection = TRANSITION_BACKWARDS;

      if (this._transitionToIndex === this._currentSlideIndex + 1 || this._transitionToIndex === 0 && this._currentSlideIndex === this._slides.length - 1) {
        // Cancel and reverse the transition
        this._transitionToIndex = this._currentSlideIndex;
      } else {
        this._transitionToIndex = this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1;
      }
    }
  }, {
    key: '_animate',
    value: function _animate(frameTime) {
      window.requestAnimationFrame(this._animate.bind(this));

      this._fps = 1000 / (frameTime - this._lastFrameTime);

      this._drawSlides();

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
      canvas.width = this.container.clientWidth * this._scale;
      canvas.height = this.container.clientHeight * this._scale;
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
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
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

      var _currentSlideTransition = _.extend({}, this.config.transition, currentSlideTransition || {});
      var _nextPrevSlideTransition = _.extend({}, this.config.transition, nextPrevSlideTransition || {});
      _currentSlideTransition.glsl = this.config.glslTransitions[_currentSlideTransition.name];
      _nextPrevSlideTransition.glsl = this.config.glslTransitions[_nextPrevSlideTransition.name];
      return _currentSlideTransition.priority >= _nextPrevSlideTransition.priority ? _currentSlideTransition : _nextPrevSlideTransition;
    }
  }, {
    key: '_drawSlides',
    value: function _drawSlides(reset) {
      var currentSlide = this._slides[this._currentSlideIndex];
      var nextSlide = this._slides[this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1];
      var prevSlide = this._slides[this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1];

      var transition = void 0;

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
          transition = this._getTransition(currentSlide.transitionNext, nextSlide.transitionPrev);
        }
        // We're heading to the previous slide (or the transition has been cancelled halfway through)
        if (this._transitionToIndex !== this._currentSlideIndex && this._transitionDirection === TRANSITION_BACKWARDS || this._transitionToIndex === this._currentSlideIndex && this._transitionDirection === TRANSITION_FORWARDS) {
          this._fromTexture = createTexture(this._renderContext, this._prevCanvas);
          this._toTexture = createTexture(this._renderContext, this._currentCanvas);
          transition = this._getTransition(currentSlide.transitionPrev, prevSlide.transitionNext);
        }

        // console.log(this._fps);
        var progressIncrement = 60 / transition.duration;

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

      if (transition && this.transition.name !== transition.name) {
        this.transition = transition;
        if (this._transition) {
          this._transition.dispose();
          this._transition = null;
        }
      }

      if (!this._transition) {
        this._transition = createTransition(this._renderContext, this.transition.glsl.glsl);
      }

      var easedTransitionProgress = eases[this.transition.ease](this._transitionProgress);

      this._transition.render(easedTransitionProgress, this._fromTexture, this._toTexture, this.transition.glsl.uniforms);

      // We have rendered the current slide for the first time
      if (currentSlide._ready) {
        currentSlide._rendered = true;
      }

      // Transition is finished
      if (this._transitionToIndex !== this._currentSlideIndex && !this._transitionInProgress()) {
        this._currentSlideIndex = this._transitionToIndex;

        this._clearContext(this._currentContext);
        this._clearContext(this._nextContext);
        this._clearContext(this._prevContext);
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
      var _this = this;

      var scale = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

      var pixels = [];

      position.forEach(function (val, index) {
        var pixel = void 0;

        var length = [_this._currentCanvas.width, _this._currentCanvas.height, _this._currentCanvas.width, _this._currentCanvas.height][index];

        length /= scale;

        if (val <= 1) {
          if (index < 2) {
            pixel = val * length;
          } else {
            pixel = val * length - pixels[index - 2];
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
        height: pixels[3] * scale
      };
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
      var _this2 = this;

      if (this._imageMap[imageUrl]) {
        callback(this._imageMap[imageUrl]);
        return;
      }

      var image = new Image();
      image.src = imageUrl;
      image.onload = function (event) {
        _this2._imageMap[imageUrl] = image;
        callback(image);
      };
    }
  }, {
    key: '_resizeImage',
    value: function _resizeImage(image, src, dst, callback) {
      var _this3 = this;

      var resizedImageKey = JSON.stringify(dst);

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
        var resizedImageData = new ImageData(new Uint8ClampedArray(buffer), dst.width, dst.height);

        _this3._slideContentMap[resizedImageKey] = resizedImageData;

        callback(_this3._slideContentMap[resizedImageKey]);
      });
    }
  }, {
    key: '_drawImage',
    value: function _drawImage(context, object, callback) {
      var _this4 = this;

      this._getImage(object.url, function (image) {
        var src = {
          x: 0,
          y: 0,
          width: image.naturalWidth,
          height: image.naturalHeight
        };

        var dst = _this4._position2Pixels(object.position, _this4._scale);

        if (object.tile) {
          var _ret = function () {
            var tile = _this4._getTile(dst, object.tile.size);

            var updatedCoords = _this4._updateCoords(src, tile, object.tile.scaleMode);

            _this4._resizeImage(image, updatedCoords.src, updatedCoords.dst, function (resizedImageData) {

              _this4._drawTiles(dst, updatedCoords.dst, object.scaleMode, function (tileCoord) {
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

        var updatedCoords = _this4._updateCoords(src, dst, object.scaleMode);

        src = updatedCoords.src;
        dst = updatedCoords.dst;

        _this4._resizeImage(image, src, dst, function (resizedImageData) {
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
    value: function _getVideo(sources, callback) {
      var videoKey = JSON.stringify(sources);

      if (this._videoMap[videoKey]) {
        callback(this._videoMap[videoKey]);
        return;
      }

      var video = document.createElement('video');
      video.style.display = 'none';
      video.crossOrigin = 'anonymous';
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      this.container.appendChild(video);

      sources.forEach(function (source) {
        var _source = document.createElement('source');
        _source.src = source.url;
        _source.type = source.type;
        video.appendChild(_source);
      });

      this._videoMap[videoKey] = video;

      video.addEventListener('play', function () {
        callback(video);
      });
    }
  }, {
    key: '_drawVideo',
    value: function _drawVideo(context, object, callback) {
      var _this5 = this;

      this._getVideo(object.sources, function (video) {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          return;
        }

        var src = {
          x: 0,
          y: 0,
          width: video.videoWidth,
          height: video.videoHeight
        };

        var dst = _this5._position2Pixels(object.position, _this5._scale);

        if (object.tile) {
          var _ret2 = function () {
            var tile = _this5._getTile(dst, object.tile.size);

            var updatedCoords = _this5._updateCoords(src, tile, object.tile.scaleMode);

            _this5._drawTiles(dst, updatedCoords.dst, object.scaleMode, function (tileCoord) {
              context.drawImage(video, src.x, src.y, src.width, src.height, tileCoord.x, tileCoord.y, tile.width, tile.height);
            });

            callback();

            return {
              v: void 0
            };
          }();

          if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
        }

        var updatedCoords = _this5._updateCoords(src, dst, object.scaleMode);

        src = updatedCoords.src;
        dst = updatedCoords.dst;

        context.drawImage(video, src.x, src.y, src.width, src.height, dst.x, dst.y, dst.width, dst.height);

        callback();
      });
    }
  }]);

  return Showy;
}();

exports.default = Showy;

},{}]},{},[1])
//# sourceMappingURL=showy.js.map
