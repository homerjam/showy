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
    this._currentSlideIndex = 0;
    this._imageMap = {};
    this._videoMap = {};
    this._slideContentMap = {};

    this.createCanvas();

    window.addEventListener('resize', event => {
      this.resize();

      this.drawSlide(this._slides[this._currentSlideIndex]);
    });

    this.animate();
  }

  nextSlide() {
    this._currentSlideIndex = this._currentSlideIndex < this._slides.length - 1 ? this._currentSlideIndex + 1 : 0;
  }

  animate(skip) {
    window.requestAnimationFrame(() => {
      this.animate(!skip);
    });

    if (!skip) {
      this.drawSlide(this._slides[this._currentSlideIndex]);
    }
  }

  createCanvas() {
    if (this.canvas) {
      this.container.removeChild(this.canvas);
    }

    this.canvas = document.createElement('canvas');

    this.canvas.style.position = 'absolute';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);

    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = true;

    this.resize();

    return this.canvas;
  }

  resize() {
    this._scale = window.devicePixelRatio;
    this.canvas.width = this.container.clientWidth * this._scale;
    this.canvas.height = this.container.clientHeight * this._scale;
  }

  drawSlide(slide) {
    if (this._oldCurrentSlideIndex !== this._currentSlideIndex) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (slide.content.length) {
      this.drawSlideContent(0, slide);
    }

    this._oldCurrentSlideIndex = this._currentSlideIndex;
  }

  drawSlideContent(index, slide) {
    const object = slide.content[index];

    if (!object) {
      return;
    }

    const callback = this.drawSlideContent.bind(this, index + 1, slide);

    switch (object.type) {
      case 'image':
        this.drawImage(object, callback);
        break;
      case 'video':
        this.drawVideo(object, callback);
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

  drawTiles(dst, tile, callback) {
    const rows = Math.ceil(dst.height / tile.height);
    const columns = Math.ceil(dst.width / tile.width);
    let row = 0;
    let column = 0;
    const totalTiles = rows * columns;

    for (let i = 0; i < totalTiles; i++) {
      callback({
        x: tile.x + (column * tile.width),
        y: tile.y + (row * tile.height),
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

  drawImage(object, callback) {
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

          this.drawTiles(dst, updatedCoords.dst, tileCoord => {
            this.context.putImageData(resizedImageData, tileCoord.x, tileCoord.y);
          });

          callback();
        });

        return;
      }

      const updatedCoords = this.updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      this._drawImage(image, src, dst, resizedImageData => {
        this.context.putImageData(resizedImageData, dst.x, dst.y);

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

  drawVideo(object, callback) {
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

        this.drawTiles(dst, updatedCoords.dst, tileCoord => {
          this.context.drawImage(video, src.x, src.y, src.width, src.height, tileCoord.x, tileCoord.y, tile.width, tile.height);
        });

        callback();

        return;
      }

      const updatedCoords = this.updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      this.context.drawImage(video, src.x, src.y, src.width, src.height, dst.x, dst.y, dst.width, dst.height);

      callback();
    });
  }
}

export default Showy;
