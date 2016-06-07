class Showy {
  constructor(config) {
    const defaultConfig = {};

    this.config = Object.assign({}, defaultConfig, config);

    if (typeof this.config.container === 'string') {
      this.container = document.querySelector(this.config.container);
    } else {
      this.container = this.config.container;
    }

    this.createCanvas();

    this.slides = this.config.slides;

    this.drawSlide(this.slides[0]);
  }

  createCanvas() {
    if (this.canvas) {
      this.container.removeChild(this.canvas);
    }

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.canvas.style.position = 'absolute';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);

    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = true;

    return this.canvas;
  }

  drawSlide(slide) {
    slide.content.forEach(object => {
      switch (object.type) {
        case 'image':
          this.drawImage(object);
          break;
        case 'video':
          this.drawVideo(object);
          break;
        default:
          throw new Error('Unknown slide type');
      // break;
      }
    });
  }

  position2Pixels(position) {
    const pixels = [];

    position.forEach((val, index) => {
      let pixel;

      const length = [this.canvas.width, this.canvas.height, this.canvas.width, this.canvas.height][index];

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
      x: pixels[0],
      y: pixels[1],
      width: pixels[2],
      height: pixels[3],
      ratio: pixels[2] / pixels[3],
      inverseRatio: pixels[3] / pixels[2],
    };
  }

  getImageData(image) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    return tempContext.getImageData(0, 0, image.naturalWidth, image.naturalHeight).data;
  }

  drawImage(object) {
    const image = new Image();
    image.src = object.url;
    image.onload = event => {
      const src = {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
        ratio: image.naturalWidth / image.naturalHeight,
        inverseRatio: image.naturalHeight / image.naturalWidth,
      };

      const dst = this.position2Pixels(object.position);

      if (object.scaleMode && object.scaleMode === 'fill') {
      } else {
        if (src.ratio > dst.ratio) {
          dst.height = dst.width * src.inverseRatio;
        }
        if (src.ratio < dst.ratio) {
          dst.width = dst.height * src.ratio;
        }
      }

      pica.resizeBuffer({
        src: this.getImageData(image),
        width: image.naturalWidth,
        height: image.naturalHeight,
        toWidth: dst.width,
        toHeight: dst.height,
        quality: 3,
        alpha: false,
        unsharpAmount: 0,
        unsharpRadius: 0.5,
        unsharpThreshold: 0,
      }, (error, buffer) => {
        const resizedImageData = new ImageData(new Uint8ClampedArray(buffer), dst.width, dst.height);

        this.context.putImageData(resizedImageData, dst.x, dst.y);
      });
    };
  }

  drawVideo(object) {}
}

export default Showy;
