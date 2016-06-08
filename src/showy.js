class Showy {
  constructor(config) {
    const defaultConfig = {};

    this.config = Object.assign({}, defaultConfig, config);

    if (typeof this.config.container === 'string') {
      this.container = document.querySelector(this.config.container);
    } else {
      this.container = this.config.container;
    }

    this.imageMap = {};
    this.videoMap = {};
    this.slideContentMap = {};

    this.createCanvas();

    this.slides = this.config.slides;

    window.addEventListener('resize', event => {
      this.resize();

      this.drawSlide(this.slides[this.index]);
    });

    this.index = 0;

    this.animate();
  }

  animate(skip) {
    window.requestAnimationFrame(() => {
      this.animate(!skip);
    });

    if (!skip) {
      this.drawSlide(this.slides[this.index]);
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
    this.scale = window.devicePixelRatio;
    this.canvas.width = this.container.clientWidth * this.scale;
    this.canvas.height = this.container.clientHeight * this.scale;
  }

  drawSlide(slide) {
    if (slide.content.length) {
      this.drawSlideContent(0, slide);
    }
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
      ratio: pixels[2] / pixels[3],
      inverseRatio: pixels[3] / pixels[2],
    };
  }

  updateCoords(src, dst, scaleMode) {
    if (scaleMode && scaleMode === 'fill') {
      if (src.ratio < dst.ratio) {
        const newHeight = dst.height * (src.width / dst.width);
        src.y = src.y + ((src.height - newHeight) * 0.5);
        src.height = newHeight;
      }
      if (src.ratio > dst.ratio) {
        const newWidth = dst.width * (src.height / dst.height);
        src.x = src.x + ((src.width - newWidth) * 0.5);
        src.width = newWidth;
      }
    } else {
      if (src.ratio > dst.ratio) {
        const newHeight = dst.width * src.inverseRatio;
        dst.y = dst.y + ((dst.height - newHeight) * 0.5);
        dst.height = newHeight;
      }
      if (src.ratio < dst.ratio) {
        const newWidth = dst.height * src.ratio;
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

  getImageData(image, x, y, width, height) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    return tempContext.getImageData(x, y, width, height).data;
  }

  getImage(imageUrl, callback) {
    if (this.imageMap[imageUrl]) {
      callback(this.imageMap[imageUrl]);
      return;
    }

    const image = new Image();
    image.src = imageUrl;
    image.onload = event => {
      this.imageMap[imageUrl] = image;
      callback(image);
    };
  }

  _drawImage(image, src, dst, callback) {
    const resizedImageKey = JSON.stringify(dst);

    if (this.slideContentMap[resizedImageKey]) {
      callback(this.slideContentMap[resizedImageKey]);
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

      this.slideContentMap[resizedImageKey] = resizedImageData;

      callback(this.slideContentMap[resizedImageKey]);
    });
  }

  drawImage(object, callback) {
    this.getImage(object.url, image => {
      let src = {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
        ratio: image.naturalWidth / image.naturalHeight,
        inverseRatio: image.naturalHeight / image.naturalWidth,
      };

      let dst = this.position2Pixels(object.position, this.scale);

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

    if (this.videoMap[videoKey]) {
      callback(this.videoMap[videoKey]);
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

    this.videoMap[videoKey] = video;

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
        ratio: video.videoWidth / video.videoHeight,
        inverseRatio: video.videoHeight / video.videoWidth,
      };

      let dst = this.position2Pixels(object.position, this.scale);

      const updatedCoords = this.updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      this.context.drawImage(video, src.x, src.y, src.width, src.height, dst.x, dst.y, dst.width, dst.height);

      callback();
    });
  }
}

export default Showy;
