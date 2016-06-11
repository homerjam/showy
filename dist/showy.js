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
      transition: {
        name: 'slide',
        duration: 2000,
        ease: 'linear',
        priority: 0
      }
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

      var _currentSlideTransition = Object.assign({}, this.config.transition, currentSlideTransition || {});
      var _nextPrevSlideTransition = Object.assign({}, this.config.transition, nextPrevSlideTransition || {});
      _currentSlideTransition.glsl = glslTransitions[_currentSlideTransition.name];
      _nextPrevSlideTransition.glsl = glslTransitions[_nextPrevSlideTransition.name];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5ub2RlL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNob3d5LmJyb3dzZXJpZnkuanMiLCJzcmMvc2hvd3kuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE9BQU8sS0FBUCxHQUFlLFFBQVEsYUFBUixFQUF1QixPQUF0Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNRQSxJQUFNLHNCQUFzQixVQUE1QjtBQUNBLElBQU0sdUJBQXVCLFdBQTdCOztJQUVNLEs7QUFDSixpQkFBWSxNQUFaLEVBQW9CO0FBQUE7O0FBQ2xCLFFBQU0sZ0JBQWdCO0FBQ3BCLGlCQUFXLE1BRFM7QUFFcEIsY0FBUSxFQUZZO0FBR3BCLGtCQUFZO0FBQ1YsY0FBTSxPQURJO0FBRVYsa0JBQVUsSUFGQTtBQUdWLGNBQU0sUUFISTtBQUlWLGtCQUFVO0FBSkE7QUFIUSxLQUF0Qjs7QUFXQSxTQUFLLE1BQUwsR0FBYyxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLGFBQWxCLEVBQWlDLE1BQWpDLENBQWQ7O0FBRUEsUUFBSSxPQUFPLEtBQUssTUFBTCxDQUFZLFNBQW5CLEtBQWlDLFFBQXJDLEVBQStDO0FBQzdDLFdBQUssU0FBTCxHQUFpQixTQUFTLGFBQVQsQ0FBdUIsS0FBSyxNQUFMLENBQVksU0FBbkMsQ0FBakI7QUFDRCxLQUZELE1BRU87QUFDTCxXQUFLLFNBQUwsR0FBaUIsS0FBSyxNQUFMLENBQVksU0FBN0I7QUFDRDs7QUFFRCxTQUFLLE9BQUwsR0FBZSxLQUFLLE1BQUwsQ0FBWSxNQUEzQjtBQUNBLFNBQUssa0JBQUwsR0FBMEIsS0FBSyxrQkFBTCxHQUEwQixDQUFwRDtBQUNBLFNBQUssbUJBQUwsR0FBMkIsQ0FBM0I7QUFDQSxTQUFLLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxTQUFLLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxTQUFLLGdCQUFMLEdBQXdCLEVB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QW9HLEtBQUssTUFBekc7QUFDRCxhQUZEOztBQUlBOztBQUVBO0FBQUE7QUFBQTtBQVhlOztBQUFBO0FBWWhCOztBQUVELFlBQU0sZ0JBQWdCLE9BQUssYUFBTCxDQUFtQixHQUFuQixFQUF3QixHQUF4QixFQUE2QixPQUFPLFNBQXBDLENBQXRCOztBQUVBLGNBQU0sY0FBYyxHQUFwQjtBQUNBLGNBQU0sY0FBYyxHQUFwQjs7QUFFQSxnQkFBUSxTQUFSLENBQWtCLEtBQWxCLEVBQXlCLElBQUksQ0FBN0IsRUFBZ0MsSUFBSSxDQUFwQyxFQUF1QyxJQUFJLEtBQTNDLEVBQWtELElBQUksTUFBdEQsRUFBOEQsSUFBSSxDQUFsRSxFQUFxRSxJQUFJLENBQXpFLEVBQTRFLElBQUksS0FBaEYsRUFBdUYsSUFBSSxNQUEzRjs7QUFFQTtBQUNELE9BcENEO0FBcUNEOzs7Ozs7a0JBR1ksSyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ3aW5kb3cuU2hvd3kgPSByZXF1aXJlKCcuL3NyYy9zaG93eScpLmRlZmF1bHQ7XG4iLCIvKipcbiAqIFRPRE9cbiAqIC0gY2FjaGUgdmlkZW8gZnJhbWVzIChhc3N1bWUgZnJhbWUgcmF0ZSBhbmQgcm91bmQgY3VycmVudFRpbWUgdG8gZ2V0IGZyYW1lKVxuICogLSBmYWxsYmFjayBmb3Igbm8tdmlkZW8gLyBhdXRvcGxheSBvbiBtb2JpbGVcbiAqIC0gZWZmZWN0cy9maWx0ZXJzIChzZXBpYSAvIGdyYXlzY2FsZSBldGMpXG4gKiAtIGZhbGxiYWNrIGZvciBuby13ZWJnbCAodXNlIGdzYXA/KVxuICovXG5cbmNvbnN0IFRSQU5TSVRJT05fRk9SV0FSRFMgPSAnZm9yd2FyZHMnO1xuY29uc3QgVFJBTlNJVElPTl9CQUNLV0FSRFMgPSAnYmFja3dhcmRzJztcblxuY2xhc3MgU2hvd3kge1xuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICBjb25zdCBkZWZhdWx0Q29uZmlnID0ge1xuICAgICAgY29udGFpbmVyOiAnYm9keScsXG4gICAgICBzbGlkZXM6IFtdLFxuICAgICAgdHJhbnNpdGlvbjoge1xuICAgICAgICBuYW1lOiAnc2xpZGUnLFxuICAgICAgICBkdXJhdGlvbjogMjAwMCxcbiAgICAgICAgZWFzZTogJ2xpbmVhcicsXG4gICAgICAgIHByaW9yaXR5OiAwLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgdGhpcy5jb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0Q29uZmlnLCBjb25maWcpO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmNvbmZpZy5jb250YWluZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5jb25maWcuY29udGFpbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb250YWluZXIgPSB0aGlzLmNvbmZpZy5jb250YWluZXI7XG4gICAgfVxuXG4gICAgdGhpcy5fc2xpZGVzID0gdGhpcy5jb25maWcuc2xpZGVzO1xuICAgIHRoaXMuX2N1cnJlbnRTbGlkZUluZGV4ID0gdGhpcy5fdHJhbnNpdGlvblRvSW5kZXggPSAwO1xuICAgIHRoaXMuX3RyYW5zaXRpb25Qcm9ncmVzcyA9IDA7XG4gICAgdGhpcy5faW1hZ2VNYXAgPSB7fTtcbiAgICB0aGlzLl92aWRlb01hcCA9IHt9O1xuICAgIHRoaXMuX3NsaWRlQ29udGVudE1hcCA9IHt9O1xuXG4gICAgdGhpcy5fY3JlYXRlQ2FudmFzZXMoKTtcblxuICAgIHRoaXMudHJhbnNpdGlvbiA9IHRoaXMuX2dldFRyYW5zaXRpb24oKTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLnJlc2l6ZS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuX2xhc3RGcmFtZVRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fYW5pbWF0ZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIG5leHRTbGlkZSgpIHtcbiAgICB0aGlzLl90cmFuc2l0aW9uRGlyZWN0aW9uID0gVFJBTlNJVElPTl9GT1JXQVJEUztcblxuICAgIGlmICh0aGlzLl90cmFuc2l0aW9uVG9JbmRleCA9PT0gdGhpcy5fY3VycmVudFNsaWRlSW5kZXggLSAxIHx8ICh0aGlzLl90cmFuc2l0aW9uVG9JbmRleCA9PT0gdGhpcy5fc2xpZGVzLmxlbmd0aCAtIDEgJiYgdGhpcy5fY3VycmVudFNsaWRlSW5kZXggPT09IDApKSB7XG4gICAgICAvLyBDYW5jZWwgYW5kIHJldmVyc2UgdGhlIHRyYW5zaXRpb25cbiAgICAgIHRoaXMuX3RyYW5zaXRpb25Ub0luZGV4ID0gdGhpcy5fY3VycmVudFNsaWRlSW5kZXg7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdHJhbnNpdGlvblRvSW5kZXggPSB0aGlzLl9jdXJyZW50U2xpZGVJbmRleCA9PT0gdGhpcy5fc2xpZGVzLmxlbmd0aCAtIDEgPyAwIDogdGhpcy5fY3VycmVudFNsaWRlSW5kZXggKyAxO1xuICAgIH1cbiAgfVxuXG4gIHByZXZTbGlkZSgpIHtcbiAgICB0aGlzLl90cmFuc2l0aW9uRGlyZWN0aW9uID0gVFJBTlNJVElPTl9CQUNLV0FSRFM7XG5cbiAgICBpZiAodGhpcy5fdHJhbnNpdGlvblRvSW5kZXggPT09IHRoaXMuX2N1cnJlbnRTbGlkZUluZGV4ICsgMSB8fCAodGhpcy5fdHJhbnNpdGlvblRvSW5kZXggPT09IDAgJiYgdGhpcy5fY3VycmVudFNsaWRlSW5kZXggPT09IHRoaXMuX3NsaWRlcy5sZW5ndGggLSAxKSkge1xuICAgICAgLy8gQ2FuY2VsIGFuZCByZXZlcnNlIHRoZSB0cmFuc2l0aW9uXG4gICAgICB0aGlzLl90cmFuc2l0aW9uVG9JbmRleCA9IHRoaXMuX2N1cnJlbnRTbGlkZUluZGV4O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3RyYW5zaXRpb25Ub0luZGV4ID0gdGhpcy5fY3VycmVudFNsaWRlSW5kZXggPT09IDAgPyB0aGlzLl9zbGlkZXMubGVuZ3RoIC0gMSA6IHRoaXMuX2N1cnJlbnRTbGlkZUluZGV4IC0gMTtcbiAgICB9XG4gIH1cblxuICBfYW5pbWF0ZShmcmFtZVRpbWUpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX2FuaW1hdGUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLl9mcHMgPSAxMDAwIC8gKGZyYW1lVGltZSAtIHRoaXMuX2xhc3RGcmFtZVRpbWUpO1xuXG4gICAgdGhpcy5fZHJhd1NsaWRlcygpO1xuXG4gICAgdGhpcy5fbGFzdEZyYW1lVGltZSA9IGZyYW1lVGltZTtcbiAgfVxuXG4gIF9jcmVhdGVDYW52YXMoKSB7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY2FudmFzLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBjYW52YXMuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgICB0aGlzLl9yZXNpemVDYW52YXMoY2FudmFzKTtcbiAgICByZXR1cm4gY2FudmFzO1xuICB9XG5cbiAgX2NyZWF0ZUNhbnZhc2VzKCkge1xuICAgIHRoaXMuX2N1cnJlbnRDYW52YXMgPSB0aGlzLl9jcmVhdGVDYW52YXMoKTtcbiAgICB0aGlzLl9jdXJyZW50Q29udGV4dCA9IHRoaXMuX2N1cnJlbnRDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHRoaXMuX25leHRDYW52YXMgPSB0aGlzLl9jcmVhdGVDYW52YXMoKTtcbiAgICB0aGlzLl9uZXh0Q29udGV4dCA9IHRoaXMuX25leHRDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHRoaXMuX3ByZXZDYW52YXMgPSB0aGlzLl9jcmVhdGVDYW52YXMoKTtcbiAgICB0aGlzLl9wcmV2Q29udGV4dCA9IHRoaXMuX3ByZXZDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHRoaXMuX3JlbmRlckNhbnZhcyA9IHRoaXMuX2NyZWF0ZUNhbnZhcygpO1xuICAgIHRoaXMuX3JlbmRlckNvbnRleHQgPSB0aGlzLl9yZW5kZXJDYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fCB0aGlzLl9yZW5kZXJDYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XG4gICAgdGhpcy5fcmVuZGVyQ29udGV4dC5waXhlbFN0b3JlaSh0aGlzLl9yZW5kZXJDb250ZXh0LlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuXG4gICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fcmVuZGVyQ2FudmFzKTtcbiAgfVxuXG4gIF9yZXNpemVDYW52YXMoY2FudmFzKSB7XG4gICAgdGhpcy5fc2NhbGUgPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbiAgICBjYW52YXMud2lkdGggPSB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCAqIHRoaXMuX3NjYWxlO1xuICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHQgKiB0aGlzLl9zY2FsZTtcbiAgfVxuXG4gIHJlc2l6ZSgpIHtcbiAgICAvLyBSZW1vdmUgYWxsIGNhY2hlZCBpbWFnZURhdGEgYXMgdGhpcyB3aWxsIGJlIHJlZHVuZGFudCBub3dcbiAgICB0aGlzLl9zbGlkZUNvbnRlbnRNYXAgPSB7fTtcblxuICAgIHRoaXMuX3Jlc2l6ZUNhbnZhcyh0aGlzLl9jdXJyZW50Q2FudmFzKTtcbiAgICB0aGlzLl9yZXNpemVDYW52YXModGhpcy5fbmV4dENhbnZhcyk7XG4gICAgdGhpcy5fcmVzaXplQ2FudmFzKHRoaXMuX3ByZXZDYW52YXMpO1xuICAgIHRoaXMuX3Jlc2l6ZUNhbnZhcyh0aGlzLl9yZW5kZXJDYW52YXMpO1xuXG4gICAgdGhpcy5fZHJhd1NsaWRlcyh0cnVlKTtcbiAgfVxuXG4gIF9jbGVhckNvbnRleHQoY29udGV4dCkge1xuICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNvbnRleHQuY2FudmFzLndpZHRoLCBjb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICB9XG5cbiAgX3RyYW5zaXRpb25JblByb2dyZXNzKCkge1xuICAgIHJldHVybiB0aGlzLl90cmFuc2l0aW9uUHJvZ3Jlc3MgPiAwICYmIHRoaXMuX3RyYW5zaXRpb25Qcm9ncmVzcyA8IDE7XG4gIH1cblxuICBfZ2V0VHJhbnNpdGlvbihjdXJyZW50U2xpZGVUcmFuc2l0aW9uID0ge30sIG5leHRQcmV2U2xpZGVUcmFuc2l0aW9uID0ge30pIHtcbiAgICBjb25zdCBfY3VycmVudFNsaWRlVHJhbnNpdGlvbiA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY29uZmlnLnRyYW5zaXRpb24sIGN1cnJlbnRTbGlkZVRyYW5zaXRpb24gfHwge30pO1xuICAgIGNvbnN0IF9uZXh0UHJldlNsaWRlVHJhbnNpdGlvbiA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY29uZmlnLnRyYW5zaXRpb24sIG5leHRQcmV2U2xpZGVUcmFuc2l0aW9uIHx8IHt9KTtcbiAgICBfY3VycmVudFNsaWRlVHJhbnNpdGlvbi5nbHNsID0gZ2xzbFRyYW5zaXRpb25zW19jdXJyZW50U2xpZGVUcmFuc2l0aW9uLm5hbWVdO1xuICAgIF9uZXh0UHJldlNsaWRlVHJhbnNpdGlvbi5nbHNsID0gZ2xzbFRyYW5zaXRpb25zW19uZXh0UHJldlNsaWRlVHJhbnNpdGlvbi5uYW1lXTtcbiAgICByZXR1cm4gX2N1cnJlbnRTbGlkZVRyYW5zaXRpb24ucHJpb3JpdHkgPj0gX25leHRQcmV2U2xpZGVUcmFuc2l0aW9uLnByaW9yaXR5ID8gX2N1cnJlbnRTbGlkZVRyYW5zaXRpb24gOiBfbmV4dFByZXZTbGlkZVRyYW5zaXRpb247XG4gIH1cblxuICBfZHJhd1NsaWRlcyhyZXNldCkge1xuICAgIGNvbnN0IGN1cnJlbnRTbGlkZSA9IHRoaXMuX3NsaWRlc1t0aGlzLl9jdXJyZW50U2xpZGVJbmRleF07XG4gICAgY29uc3QgbmV4dFNsaWRlID0gdGhpcy5fc2xpZGVzW3RoaXMuX2N1cnJlbnRTbGlkZUluZGV4ID09PSB0aGlzLl9zbGlkZXMubGVuZ3RoIC0gMSA/IDAgOiB0aGlzLl9jdXJyZW50U2xpZGVJbmRleCArIDFdO1xuICAgIGNvbnN0IHByZXZTbGlkZSA9IHRoaXMuX3NsaWRlc1t0aGlzLl9jdXJyZW50U2xpZGVJbmRleCA9PT0gMCA/IHRoaXMuX3NsaWRlcy5sZW5ndGggLSAxIDogdGhpcy5fY3VycmVudFNsaWRlSW5kZXggLSAxXTtcblxuICAgIGxldCB0cmFuc2l0aW9uO1xuXG4gICAgLy8gUmVyZW5kZXIgdGhlIGN1cnJlbnQgc2xpZGUgZWcuIGlmIGNhbnZhcyBoYXMgYmVlbiByZXNpemVkXG4gICAgaWYgKHJlc2V0KSB7XG4gICAgICBjdXJyZW50U2xpZGUuX3JlbmRlcmVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gT25seSByZW5kZXIgaWYgd2UgbmVlZCB0byBpZS4gb25seSBkdXJpbmcgdHJhbnNpdGlvbnNcbiAgICAvLyBvciBpZiB0aGUgY3VycmVudCBzbGlkZSBjb250YWlucyB2aWRlbyhzKVxuICAgIGlmICghY3VycmVudFNsaWRlLl9oYXNWaWRlbyAmJlxuICAgICAgY3VycmVudFNsaWRlLl9yZW5kZXJlZCAmJlxuICAgICAgIXRoaXMuX3RyYW5zaXRpb25JblByb2dyZXNzKCkgJiZcbiAgICAgIHRoaXMuX2N1cnJlbnRTbGlkZUluZGV4ID09PSB0aGlzLl90cmFuc2l0aW9uVG9JbmRleCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2RyYXdTbGlkZSh0aGlzLl9jdXJyZW50Q29udGV4dCwgY3VycmVudFNsaWRlKTtcbiAgICB0aGlzLl9kcmF3U2xpZGUodGhpcy5fbmV4dENvbnRleHQsIG5leHRTbGlkZSk7XG4gICAgdGhpcy5fZHJhd1NsaWRlKHRoaXMuX3ByZXZDb250ZXh0LCBwcmV2U2xpZGUpO1xuXG4gICAgaWYgKHRoaXMuX2Zyb21UZXh0dXJlKSB7XG4gICAgICB0aGlzLl9mcm9tVGV4dHVyZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3RvVGV4dHVyZSkge1xuICAgICAgdGhpcy5fdG9UZXh0dXJlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICAvLyBUcmFuc2l0aW9uIGlzIGFscmVhZHkgcnVubmluZyBvciBoYXMgYmVlbiB0cmlnZ2VyZWQgYnkgYSBjaGFuZ2Ugb2YgX3RyYW5zaXRpb25Ub0luZGV4XG4gICAgaWYgKHRoaXMuX3RyYW5zaXRpb25Ub0luZGV4ICE9PSB0aGlzLl9jdXJyZW50U2xpZGVJbmRleCB8fCB0aGlzLl90cmFuc2l0aW9uSW5Qcm9ncmVzcygpKSB7XG4gICAgICAvLyBXZSdyZSBoZWFkaW5nIHRvIHRoZSBuZXh0IHNsaWRlIChvciB0aGUgdHJhbnNpdGlvbiBoYXMgYmVlbiBjYW5jZWxsZWQgaGFsZndheSB0aHJvdWdoKVxuICAgICAgaWYgKCh0aGlzLl90cmFuc2l0aW9uVG9JbmRleCAhPT0gdGhpcy5fY3VycmVudFNsaWRlSW5kZXggJiYgdGhpcy5fdHJhbnNpdGlvbkRpcmVjdGlvbiA9PT0gVFJBTlNJVElPTl9GT1JXQVJEUykgfHxcbiAgICAgICAgKHRoaXMuX3RyYW5zaXRpb25Ub0luZGV4ID09PSB0aGlzLl9jdXJyZW50U2xpZGVJbmRleCAmJiB0aGlzLl90cmFuc2l0aW9uRGlyZWN0aW9uID09PSBUUkFOU0lUSU9OX0JBQ0tXQVJEUykpIHtcbiAgICAgICAgdGhpcy5fZnJvbVRleHR1cmUgPSBjcmVhdGVUZXh0dXJlKHRoaXMuX3JlbmRlckNvbnRleHQsIHRoaXMuX2N1cnJlbnRDYW52YXMpO1xuICAgICAgICB0aGlzLl90b1RleHR1cmUgPSBjcmVhdGVUZXh0dXJlKHRoaXMuX3JlbmRlckNvbnRleHQsIHRoaXMuX25leHRDYW52YXMpO1xuICAgICAgICB0cmFuc2l0aW9uID0gdGhpcy5fZ2V0VHJhbnNpdGlvbihjdXJyZW50U2xpZGUudHJhbnNpdGlvbk5leHQsIG5leHRTbGlkZS50cmFuc2l0aW9uUHJldik7XG4gICAgICB9XG4gICAgICAvLyBXZSdyZSBoZWFkaW5nIHRvIHRoZSBwcmV2aW91cyBzbGlkZSAob3IgdGhlIHRyYW5zaXRpb24gaGFzIGJlZW4gY2FuY2VsbGVkIGhhbGZ3YXkgdGhyb3VnaClcbiAgICAgIGlmICgodGhpcy5fdHJhbnNpdGlvblRvSW5kZXggIT09IHRoaXMuX2N1cnJlbnRTbGlkZUluZGV4ICYmIHRoaXMuX3RyYW5zaXRpb25EaXJlY3Rpb24gPT09IFRSQU5TSVRJT05fQkFDS1dBUkRTKSB8fFxuICAgICAgICAodGhpcy5fdHJhbnNpdGlvblRvSW5kZXggPT09IHRoaXMuX2N1cnJlbnRTbGlkZUluZGV4ICYmIHRoaXMuX3RyYW5zaXRpb25EaXJlY3Rpb24gPT09IFRSQU5TSVRJT05fRk9SV0FSRFMpKSB7XG4gICAgICAgIHRoaXMuX2Zyb21UZXh0dXJlID0gY3JlYXRlVGV4dHVyZSh0aGlzLl9yZW5kZXJDb250ZXh0LCB0aGlzLl9wcmV2Q2FudmFzKTtcbiAgICAgICAgdGhpcy5fdG9UZXh0dXJlID0gY3JlYXRlVGV4dHVyZSh0aGlzLl9yZW5kZXJDb250ZXh0LCB0aGlzLl9jdXJyZW50Q2FudmFzKTtcbiAgICAgICAgdHJhbnNpdGlvbiA9IHRoaXMuX2dldFRyYW5zaXRpb24oY3VycmVudFNsaWRlLnRyYW5zaXRpb25QcmV2LCBwcmV2U2xpZGUudHJhbnNpdGlvbk5leHQpO1xuICAgICAgfVxuXG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLl9mcHMpO1xuICAgICAgY29uc3QgcHJvZ3Jlc3NJbmNyZW1lbnQgPSA2MCAvIHRyYW5zaXRpb24uZHVyYXRpb247XG5cbiAgICAgIC8vIEluY3JlbWVudCB0aGUgdHJhbnNpdGlvbiBwcm9ncmVzcyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGlvblxuICAgICAgaWYgKHRoaXMuX3RyYW5zaXRpb25EaXJlY3Rpb24gPT09IFRSQU5TSVRJT05fRk9SV0FSRFMpIHtcbiAgICAgICAgdGhpcy5fdHJhbnNpdGlvblByb2dyZXNzID0gdGhpcy5fdHJhbnNpdGlvbkluUHJvZ3Jlc3MoKSA/IHRoaXMuX3RyYW5zaXRpb25Qcm9ncmVzcyArIHByb2dyZXNzSW5jcmVtZW50IDogcHJvZ3Jlc3NJbmNyZW1lbnQ7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fdHJhbnNpdGlvbkRpcmVjdGlvbiA9PT0gVFJBTlNJVElPTl9CQUNLV0FSRFMpIHtcbiAgICAgICAgdGhpcy5fdHJhbnNpdGlvblByb2dyZXNzID0gdGhpcy5fdHJhbnNpdGlvbkluUHJvZ3Jlc3MoKSA/IHRoaXMuX3RyYW5zaXRpb25Qcm9ncmVzcyAtIHByb2dyZXNzSW5jcmVtZW50IDogMSAtIHByb2dyZXNzSW5jcmVtZW50O1xuICAgICAgfVxuXG4gICAgICAvLyBXZSd2ZSByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHRyYW5zaXRpb25cbiAgICAgIGlmICh0aGlzLl90cmFuc2l0aW9uUHJvZ3Jlc3MgPiAxKSB7XG4gICAgICAgIHRoaXMuX3RyYW5zaXRpb25Qcm9ncmVzcyA9IDE7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fdHJhbnNpdGlvblByb2dyZXNzIDwgMCkge1xuICAgICAgICB0aGlzLl90cmFuc2l0aW9uUHJvZ3Jlc3MgPSAwO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlJ3JlIG5vdCB0cmFuc2l0aW9uaW5nIHNvIGp1c3QgcmVyZW5kZXIgY3VycmVudCBzbGlkZSAob25seSBpZiBuZWVkZWQpXG4gICAgICB0aGlzLl9mcm9tVGV4dHVyZSA9IGNyZWF0ZVRleHR1cmUodGhpcy5fcmVuZGVyQ29udGV4dCwgdGhpcy5fY3VycmVudENhbnZhcyk7XG4gICAgICB0aGlzLl90b1RleHR1cmUgPSB0aGlzLl9mcm9tVGV4dHVyZTtcbiAgICB9XG5cbiAgICBpZiAodHJhbnNpdGlvbiAmJiB0aGlzLnRyYW5zaXRpb24ubmFtZSAhPT0gdHJhbnNpdGlvbi5uYW1lKSB7XG4gICAgICB0aGlzLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICAgICAgaWYgKHRoaXMuX3RyYW5zaXRpb24pIHtcbiAgICAgICAgdGhpcy5fdHJhbnNpdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuX3RyYW5zaXRpb24gPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5fdHJhbnNpdGlvbikge1xuICAgICAgdGhpcy5fdHJhbnNpdGlvbiA9IGNyZWF0ZVRyYW5zaXRpb24odGhpcy5fcmVuZGVyQ29udGV4dCwgdGhpcy50cmFuc2l0aW9uLmdsc2wuZ2xzbCk7XG4gICAgfVxuXG4gICAgY29uc3QgZWFzZWRUcmFuc2l0aW9uUHJvZ3Jlc3MgPSBlYXNlc1t0aGlzLnRyYW5zaXRpb24uZWFzZV0odGhpcy5fdHJhbnNpdGlvblByb2dyZXNzKTtcblxuICAgIHRoaXMuX3RyYW5zaXRpb24ucmVuZGVyKGVhc2VkVHJhbnNpdGlvblByb2dyZXNzLCB0aGlzLl9mcm9tVGV4dHVyZSwgdGhpcy5fdG9UZXh0dXJlLCB0aGlzLnRyYW5zaXRpb24uZ2xzbC51bmlmb3Jtcyk7XG5cbiAgICAvLyBXZSBoYXZlIHJlbmRlcmVkIHRoZSBjdXJyZW50IHNsaWRlIGZvciB0aGUgZmlyc3QgdGltZVxuICAgIGlmIChjdXJyZW50U2xpZGUuX3JlYWR5KSB7XG4gICAgICBjdXJyZW50U2xpZGUuX3JlbmRlcmVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUcmFuc2l0aW9uIGlzIGZpbmlzaGVkXG4gICAgaWYgKHRoaXMuX3RyYW5zaXRpb25Ub0luZGV4ICE9PSB0aGlzLl9jdXJyZW50U2xpZGVJbmRleCAmJiAhdGhpcy5fdHJhbnNpdGlvbkluUHJvZ3Jlc3MoKSkge1xuICAgICAgdGhpcy5fY3VycmVudFNsaWRlSW5kZXggPSB0aGlzLl90cmFuc2l0aW9uVG9JbmRleDtcblxuICAgICAgdGhpcy5fY2xlYXJDb250ZXh0KHRoaXMuX2N1cnJlbnRDb250ZXh0KTtcbiAgICAgIHRoaXMuX2NsZWFyQ29udGV4dCh0aGlzLl9uZXh0Q29udGV4dCk7XG4gICAgICB0aGlzLl9jbGVhckNvbnRleHQodGhpcy5fcHJldkNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIF9kcmF3U2xpZGUoY29udGV4dCwgc2xpZGUpIHtcbiAgICBzbGlkZS5faGFzVmlkZW8gPSBzbGlkZS5jb250ZW50LmZpbHRlcihvYmplY3QgPT4gb2JqZWN0LnR5cGUgPT09ICd2aWRlbycpLmxlbmd0aCA+IDA7XG4gICAgc2xpZGUuX3JlbmRlcmVkID0gZmFsc2U7XG4gICAgc2xpZGUuX3JlYWR5ID0gZmFsc2U7XG5cbiAgICBpZiAoc2xpZGUuY29udGVudC5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2RyYXdTbGlkZUNvbnRlbnQoY29udGV4dCwgc2xpZGUsIDApO1xuICAgIH1cbiAgfVxuXG4gIF9kcmF3U2xpZGVDb250ZW50KGNvbnRleHQsIHNsaWRlLCBpbmRleCkge1xuICAgIGNvbnN0IG9iamVjdCA9IHNsaWRlLmNvbnRlbnRbaW5kZXhdO1xuXG4gICAgaWYgKCFvYmplY3QpIHtcbiAgICAgIHNsaWRlLl9yZWFkeSA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLl9kcmF3U2xpZGVDb250ZW50LmJpbmQodGhpcywgY29udGV4dCwgc2xpZGUsIGluZGV4ICsgMSk7XG5cbiAgICBzd2l0Y2ggKG9iamVjdC50eXBlKSB7XG4gICAgICBjYXNlICdpbWFnZSc6XG4gICAgICAgIHRoaXMuX2RyYXdJbWFnZShjb250ZXh0LCBvYmplY3QsIGNhbGxiYWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd2aWRlbyc6XG4gICAgICAgIHRoaXMuX2RyYXdWaWRlbyhjb250ZXh0LCBvYmplY3QsIGNhbGxiYWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gY29udGVudCB0eXBlJyk7XG4gICAgfVxuICB9XG5cbiAgX3Bvc2l0aW9uMlBpeGVscyhwb3NpdGlvbiwgc2NhbGUgPSAxKSB7XG4gICAgY29uc3QgcGl4ZWxzID0gW107XG5cbiAgICBwb3NpdGlvbi5mb3JFYWNoKCh2YWwsIGluZGV4KSA9PiB7XG4gICAgICBsZXQgcGl4ZWw7XG5cbiAgICAgIGxldCBsZW5ndGggPSBbdGhpcy5fY3VycmVudENhbnZhcy53aWR0aCwgdGhpcy5fY3VycmVudENhbnZhcy5oZWlnaHQsIHRoaXMuX2N1cnJlbnRDYW52YXMud2lkdGgsIHRoaXMuX2N1cnJlbnRDYW52YXMuaGVpZ2h0XVtpbmRleF07XG5cbiAgICAgIGxlbmd0aCAvPSBzY2FsZTtcblxuICAgICAgaWYgKHZhbCA8PSAxKSB7XG4gICAgICAgIGlmIChpbmRleCA8IDIpIHtcbiAgICAgICAgICBwaXhlbCA9IHZhbCAqIGxlbmd0aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwaXhlbCA9ICh2YWwgKiBsZW5ndGgpIC0gcGl4ZWxzW2luZGV4IC0gMl07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpbmRleCA8IDIpIHtcbiAgICAgICAgICBwaXhlbCA9IHZhbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwaXhlbCA9IGxlbmd0aCAtIHBpeGVsc1tpbmRleCAtIDJdIC0gdmFsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHBpeGVscy5wdXNoKHBpeGVsKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiBwaXhlbHNbMF0gKiBzY2FsZSxcbiAgICAgIHk6IHBpeGVsc1sxXSAqIHNjYWxlLFxuICAgICAgd2lkdGg6IHBpeGVsc1syXSAqIHNjYWxlLFxuICAgICAgaGVpZ2h0OiBwaXhlbHNbM10gKiBzY2FsZSxcbiAgICB9O1xuICB9XG5cbiAgX3VwZGF0ZUNvb3JkcyhzcmMsIGRzdCwgc2NhbGVNb2RlKSB7XG4gICAgY29uc3Qgc3JjUmF0aW8gPSBzcmMud2lkdGggLyBzcmMuaGVpZ2h0O1xuICAgIGNvbnN0IGRzdFJhdGlvID0gZHN0LndpZHRoIC8gZHN0LmhlaWdodDtcblxuICAgIGlmIChzY2FsZU1vZGUgJiYgc2NhbGVNb2RlID09PSAnZmlsbCcpIHtcbiAgICAgIGlmIChzcmNSYXRpbyA8IGRzdFJhdGlvKSB7XG4gICAgICAgIGNvbnN0IG5ld0hlaWdodCA9IGRzdC5oZWlnaHQgKiAoc3JjLndpZHRoIC8gZHN0LndpZHRoKTtcbiAgICAgICAgc3JjLnkgPSBzcmMueSArICgoc3JjLmhlaWdodCAtIG5ld0hlaWdodCkgKiAwLjUpO1xuICAgICAgICBzcmMuaGVpZ2h0ID0gbmV3SGVpZ2h0O1xuICAgICAgfVxuICAgICAgaWYgKHNyY1JhdGlvID4gZHN0UmF0aW8pIHtcbiAgICAgICAgY29uc3QgbmV3V2lkdGggPSBkc3Qud2lkdGggKiAoc3JjLmhlaWdodCAvIGRzdC5oZWlnaHQpO1xuICAgICAgICBzcmMueCA9IHNyYy54ICsgKChzcmMud2lkdGggLSBuZXdXaWR0aCkgKiAwLjUpO1xuICAgICAgICBzcmMud2lkdGggPSBuZXdXaWR0aDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHNyY1JhdGlvID4gZHN0UmF0aW8pIHtcbiAgICAgICAgY29uc3QgbmV3SGVpZ2h0ID0gZHN0LndpZHRoICogKHNyYy5oZWlnaHQgLyBzcmMud2lkdGgpO1xuICAgICAgICBkc3QueSA9IGRzdC55ICsgKChkc3QuaGVpZ2h0IC0gbmV3SGVpZ2h0KSAqIDAuNSk7XG4gICAgICAgIGRzdC5oZWlnaHQgPSBuZXdIZWlnaHQ7XG4gICAgICB9XG4gICAgICBpZiAoc3JjUmF0aW8gPCBkc3RSYXRpbykge1xuICAgICAgICBjb25zdCBuZXdXaWR0aCA9IGRzdC5oZWlnaHQgKiBzcmNSYXRpbztcbiAgICAgICAgZHN0LnggPSBkc3QueCArICgoZHN0LndpZHRoIC0gbmV3V2lkdGgpICogMC41KTtcbiAgICAgICAgZHN0LndpZHRoID0gbmV3V2lkdGg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUm91bmQgcHJvcGVydGllcyBmb3IgcGljYSAoYW5kIGdlbmVyYWwgc3BlZWQgdXApXG4gICAgY29uc3Qgcm91bmRQcm9wcyA9IFsneCcsICd5JywgJ3dpZHRoJywgJ2hlaWdodCddO1xuXG4gICAgcm91bmRQcm9wcy5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgc3JjW3Byb3BdID0gTWF0aC5yb3VuZChzcmNbcHJvcF0pO1xuICAgICAgZHN0W3Byb3BdID0gTWF0aC5yb3VuZChkc3RbcHJvcF0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNyYyxcbiAgICAgIGRzdCxcbiAgICB9O1xuICB9XG5cbiAgX2dldFRpbGUoZHN0LCBzaXplKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGRzdC54LFxuICAgICAgeTogZHN0LnksXG4gICAgICB3aWR0aDogc2l6ZVswXSA8PSAxID8gZHN0LndpZHRoICogc2l6ZVswXSA6IHNpemVbMF0sXG4gICAgICBoZWlnaHQ6IHNpemVbMV0gPD0gMSA/IGRzdC5oZWlnaHQgKiBzaXplWzFdIDogc2l6ZVsxXSxcbiAgICB9O1xuICB9XG5cbiAgX2RyYXdUaWxlcyhkc3QsIHRpbGUsIHNjYWxlTW9kZSwgY2FsbGJhY2spIHtcbiAgICBsZXQgcm93cztcbiAgICBsZXQgY29sdW1ucztcblxuICAgIGxldCBvZmZzZXRXaWR0aCA9IDA7XG4gICAgbGV0IG9mZnNldEhlaWdodCA9IDA7XG5cbiAgICBpZiAoc2NhbGVNb2RlICYmIHNjYWxlTW9kZSA9PT0gJ2ZpbGwnKSB7XG4gICAgICByb3dzID0gTWF0aC5jZWlsKGRzdC5oZWlnaHQgLyB0aWxlLmhlaWdodCk7XG4gICAgICBjb2x1bW5zID0gTWF0aC5jZWlsKGRzdC53aWR0aCAvIHRpbGUud2lkdGgpO1xuXG4gICAgICBvZmZzZXRXaWR0aCA9ICgodGlsZS53aWR0aCAqIGNvbHVtbnMpIC0gZHN0LndpZHRoKSAqIDAuNTtcbiAgICAgIG9mZnNldEhlaWdodCA9ICgodGlsZS5oZWlnaHQgKiByb3dzKSAtIGRzdC5oZWlnaHQpICogMC41O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHJvd3MgPSBNYXRoLmZsb29yKGRzdC5oZWlnaHQgLyB0aWxlLmhlaWdodCk7XG4gICAgICBjb2x1bW5zID0gTWF0aC5mbG9vcihkc3Qud2lkdGggLyB0aWxlLndpZHRoKTtcbiAgICB9XG5cbiAgICBsZXQgcm93ID0gMDtcbiAgICBsZXQgY29sdW1uID0gMDtcblxuICAgIGNvbnN0IHRvdGFsVGlsZXMgPSByb3dzICogY29sdW1ucztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxUaWxlczsgaSsrKSB7XG4gICAgICBjYWxsYmFjayh7XG4gICAgICAgIHg6IHRpbGUueCArIChjb2x1bW4gKiB0aWxlLndpZHRoKSAtIG9mZnNldFdpZHRoLFxuICAgICAgICB5OiB0aWxlLnkgKyAocm93ICogdGlsZS5oZWlnaHQpIC0gb2Zmc2V0SGVpZ2h0LFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChjb2x1bW4gPT09IGNvbHVtbnMgLSAxKSB7XG4gICAgICAgIHJvdysrO1xuICAgICAgfVxuXG4gICAgICBjb2x1bW4gPSBjb2x1bW4gPCBjb2x1bW5zIC0gMSA/IGNvbHVtbiArIDEgOiAwO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRJbWFnZURhdGEoaW1hZ2UsIHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICBjb25zdCB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdGVtcENhbnZhcy53aWR0aCA9IGltYWdlLm5hdHVyYWxXaWR0aDtcbiAgICB0ZW1wQ2FudmFzLmhlaWdodCA9IGltYWdlLm5hdHVyYWxIZWlnaHQ7XG4gICAgY29uc3QgdGVtcENvbnRleHQgPSB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGVtcENvbnRleHQuZHJhd0ltYWdlKGltYWdlLCAwLCAwLCBpbWFnZS5uYXR1cmFsV2lkdGgsIGltYWdlLm5hdHVyYWxIZWlnaHQpO1xuICAgIHJldHVybiB0ZW1wQ29udGV4dC5nZXRJbWFnZURhdGEoeCwgeSwgd2lkdGgsIGhlaWdodCkuZGF0YTtcbiAgfVxuXG4gIF9nZXRJbWFnZShpbWFnZVVybCwgY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5faW1hZ2VNYXBbaW1hZ2VVcmxdKSB7XG4gICAgICBjYWxsYmFjayh0aGlzLl9pbWFnZU1hcFtpbWFnZVVybF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uuc3JjID0gaW1hZ2VVcmw7XG4gICAgaW1hZ2Uub25sb2FkID0gZXZlbnQgPT4ge1xuICAgICAgdGhpcy5faW1hZ2VNYXBbaW1hZ2VVcmxdID0gaW1hZ2U7XG4gICAgICBjYWxsYmFjayhpbWFnZSk7XG4gICAgfTtcbiAgfVxuXG4gIF9yZXNpemVJbWFnZShpbWFnZSwgc3JjLCBkc3QsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgcmVzaXplZEltYWdlS2V5ID0gSlNPTi5zdHJpbmdpZnkoZHN0KTtcblxuICAgIGlmICh0aGlzLl9zbGlkZUNvbnRlbnRNYXBbcmVzaXplZEltYWdlS2V5XSkge1xuICAgICAgY2FsbGJhY2sodGhpcy5fc2xpZGVDb250ZW50TWFwW3Jlc2l6ZWRJbWFnZUtleV0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHBpY2EucmVzaXplQnVmZmVyKHtcbiAgICAgIHNyYzogdGhpcy5fZ2V0SW1hZ2VEYXRhKGltYWdlLCBzcmMueCwgc3JjLnksIHNyYy53aWR0aCwgc3JjLmhlaWdodCksXG4gICAgICB3aWR0aDogc3JjLndpZHRoLFxuICAgICAgaGVpZ2h0OiBzcmMuaGVpZ2h0LFxuICAgICAgdG9XaWR0aDogZHN0LndpZHRoLFxuICAgICAgdG9IZWlnaHQ6IGRzdC5oZWlnaHQsXG4gICAgICBxdWFsaXR5OiAxLFxuICAgICAgYWxwaGE6IGZhbHNlLFxuICAgICAgdW5zaGFycEFtb3VudDogMCxcbiAgICAgIHVuc2hhcnBSYWRpdXM6IDAuNSxcbiAgICAgIHVuc2hhcnBUaHJlc2hvbGQ6IDAsXG4gICAgfSwgKGVycm9yLCBidWZmZXIpID0+IHtcbiAgICAgIGNvbnN0IHJlc2l6ZWRJbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKG5ldyBVaW50OENsYW1wZWRBcnJheShidWZmZXIpLCBkc3Qud2lkdGgsIGRzdC5oZWlnaHQpO1xuXG4gICAgICB0aGlzLl9zbGlkZUNvbnRlbnRNYXBbcmVzaXplZEltYWdlS2V5XSA9IHJlc2l6ZWRJbWFnZURhdGE7XG5cbiAgICAgIGNhbGxiYWNrKHRoaXMuX3NsaWRlQ29udGVudE1hcFtyZXNpemVkSW1hZ2VLZXldKTtcbiAgICB9KTtcbiAgfVxuXG4gIF9kcmF3SW1hZ2UoY29udGV4dCwgb2JqZWN0LCBjYWxsYmFjaykge1xuICAgIHRoaXMuX2dldEltYWdlKG9iamVjdC51cmwsIGltYWdlID0+IHtcbiAgICAgIGxldCBzcmMgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDAsXG4gICAgICAgIHdpZHRoOiBpbWFnZS5uYXR1cmFsV2lkdGgsXG4gICAgICAgIGhlaWdodDogaW1hZ2UubmF0dXJhbEhlaWdodCxcbiAgICAgIH07XG5cbiAgICAgIGxldCBkc3QgPSB0aGlzLl9wb3NpdGlvbjJQaXhlbHMob2JqZWN0LnBvc2l0aW9uLCB0aGlzLl9zY2FsZSk7XG5cbiAgICAgIGlmIChvYmplY3QudGlsZSkge1xuICAgICAgICBsZXQgdGlsZSA9IHRoaXMuX2dldFRpbGUoZHN0LCBvYmplY3QudGlsZS5zaXplKTtcblxuICAgICAgICBjb25zdCB1cGRhdGVkQ29vcmRzID0gdGhpcy5fdXBkYXRlQ29vcmRzKHNyYywgdGlsZSwgb2JqZWN0LnRpbGUuc2NhbGVNb2RlKTtcblxuICAgICAgICB0aGlzLl9yZXNpemVJbWFnZShpbWFnZSwgdXBkYXRlZENvb3Jkcy5zcmMsIHVwZGF0ZWRDb29yZHMuZHN0LCByZXNpemVkSW1hZ2VEYXRhID0+IHtcblxuICAgICAgICAgIHRoaXMuX2RyYXdUaWxlcyhkc3QsIHVwZGF0ZWRDb29yZHMuZHN0LCBvYmplY3Quc2NhbGVNb2RlLCB0aWxlQ29vcmQgPT4ge1xuICAgICAgICAgICAgY29udGV4dC5wdXRJbWFnZURhdGEocmVzaXplZEltYWdlRGF0YSwgdGlsZUNvb3JkLngsIHRpbGVDb29yZC55KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXBkYXRlZENvb3JkcyA9IHRoaXMuX3VwZGF0ZUNvb3JkcyhzcmMsIGRzdCwgb2JqZWN0LnNjYWxlTW9kZSk7XG5cbiAgICAgIHNyYyA9IHVwZGF0ZWRDb29yZHMuc3JjO1xuICAgICAgZHN0ID0gdXBkYXRlZENvb3Jkcy5kc3Q7XG5cbiAgICAgIHRoaXMuX3Jlc2l6ZUltYWdlKGltYWdlLCBzcmMsIGRzdCwgcmVzaXplZEltYWdlRGF0YSA9PiB7XG4gICAgICAgIGNvbnRleHQucHV0SW1hZ2VEYXRhKHJlc2l6ZWRJbWFnZURhdGEsIGRzdC54LCBkc3QueSk7XG5cbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgX2dldFZpZGVvRGF0YSh2aWRlbykge1xuICAgIGNvbnN0IHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB0ZW1wQ2FudmFzLndpZHRoID0gdmlkZW8udmlkZW9XaWR0aDtcbiAgICB0ZW1wQ2FudmFzLmhlaWdodCA9IHZpZGVvLnZpZGVvSGVpZ2h0O1xuICAgIGNvbnN0IHRlbXBDb250ZXh0ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRlbXBDb250ZXh0LmRyYXdJbWFnZSh2aWRlbywgMCwgMCwgdmlkZW8udmlkZW9XaWR0aCwgdmlkZW8udmlkZW9IZWlnaHQpO1xuICAgIHJldHVybiB0ZW1wQ29udGV4dC5fZ2V0SW1hZ2VEYXRhKDAsIDAsIHZpZGVvLnZpZGVvV2lkdGgsIHZpZGVvLnZpZGVvSGVpZ2h0KS5kYXRhO1xuICB9XG5cbiAgX2dldFZpZGVvKHNvdXJjZXMsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgdmlkZW9LZXkgPSBKU09OLnN0cmluZ2lmeShzb3VyY2VzKTtcblxuICAgIGlmICh0aGlzLl92aWRlb01hcFt2aWRlb0tleV0pIHtcbiAgICAgIGNhbGxiYWNrKHRoaXMuX3ZpZGVvTWFwW3ZpZGVvS2V5XSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xuICAgIHZpZGVvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgdmlkZW8uY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcbiAgICB2aWRlby5hdXRvcGxheSA9IHRydWU7XG4gICAgdmlkZW8ubG9vcCA9IHRydWU7XG4gICAgdmlkZW8ubXV0ZWQgPSB0cnVlO1xuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHZpZGVvKTtcblxuICAgIHNvdXJjZXMuZm9yRWFjaChzb3VyY2UgPT4ge1xuICAgICAgY29uc3QgX3NvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICAgICAgX3NvdXJjZS5zcmMgPSBzb3VyY2UudXJsO1xuICAgICAgX3NvdXJjZS50eXBlID0gc291cmNlLnR5cGU7XG4gICAgICB2aWRlby5hcHBlbmRDaGlsZChfc291cmNlKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX3ZpZGVvTWFwW3ZpZGVvS2V5XSA9IHZpZGVvO1xuXG4gICAgdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcigncGxheScsICgpID0+IHtcbiAgICAgIGNhbGxiYWNrKHZpZGVvKTtcbiAgICB9KTtcbiAgfVxuXG4gIF9kcmF3VmlkZW8oY29udGV4dCwgb2JqZWN0LCBjYWxsYmFjaykge1xuICAgIHRoaXMuX2dldFZpZGVvKG9iamVjdC5zb3VyY2VzLCB2aWRlbyA9PiB7XG4gICAgICBpZiAodmlkZW8udmlkZW9XaWR0aCA9PT0gMCB8fCB2aWRlby52aWRlb0hlaWdodCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxldCBzcmMgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDAsXG4gICAgICAgIHdpZHRoOiB2aWRlby52aWRlb1dpZHRoLFxuICAgICAgICBoZWlnaHQ6IHZpZGVvLnZpZGVvSGVpZ2h0LFxuICAgICAgfTtcblxuICAgICAgbGV0IGRzdCA9IHRoaXMuX3Bvc2l0aW9uMlBpeGVscyhvYmplY3QucG9zaXRpb24sIHRoaXMuX3NjYWxlKTtcblxuICAgICAgaWYgKG9iamVjdC50aWxlKSB7XG4gICAgICAgIGxldCB0aWxlID0gdGhpcy5fZ2V0VGlsZShkc3QsIG9iamVjdC50aWxlLnNpemUpO1xuXG4gICAgICAgIGNvbnN0IHVwZGF0ZWRDb29yZHMgPSB0aGlzLl91cGRhdGVDb29yZHMoc3JjLCB0aWxlLCBvYmplY3QudGlsZS5zY2FsZU1vZGUpO1xuXG4gICAgICAgIHRoaXMuX2RyYXdUaWxlcyhkc3QsIHVwZGF0ZWRDb29yZHMuZHN0LCBvYmplY3Quc2NhbGVNb2RlLCB0aWxlQ29vcmQgPT4ge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHZpZGVvLCBzcmMueCwgc3JjLnksIHNyYy53aWR0aCwgc3JjLmhlaWdodCwgdGlsZUNvb3JkLngsIHRpbGVDb29yZC55LCB0aWxlLndpZHRoLCB0aWxlLmhlaWdodCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB1cGRhdGVkQ29vcmRzID0gdGhpcy5fdXBkYXRlQ29vcmRzKHNyYywgZHN0LCBvYmplY3Quc2NhbGVNb2RlKTtcblxuICAgICAgc3JjID0gdXBkYXRlZENvb3Jkcy5zcmM7XG4gICAgICBkc3QgPSB1cGRhdGVkQ29vcmRzLmRzdDtcblxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UodmlkZW8sIHNyYy54LCBzcmMueSwgc3JjLndpZHRoLCBzcmMuaGVpZ2h0LCBkc3QueCwgZHN0LnksIGRzdC53aWR0aCwgZHN0LmhlaWdodCk7XG5cbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2hvd3k7XG4iXX0=
