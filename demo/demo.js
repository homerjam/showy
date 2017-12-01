/* eslint-env browser */

localStorage.debug = 'showy:*';

// http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
function camelize (str) {
  return str.replace(/_/g, ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => (index === 0 ? letter.toLowerCase() : letter.toUpperCase())).replace(/\s+/g, '');
}

var glslTransitions = {};

GlslTransitions.forEach((transition) => {
  glslTransitions[camelize(transition.name)] = {
    shader: transition.glsl,
    uniforms: transition.uniforms,
  };
});

console.log('glslTransitions', glslTransitions);

var config = {
  container: document.querySelector('.container'),
  autoplay: true,
  slideDuration: 2000,
  transitions: glslTransitions,
  // transition: {
  //   // name: 'circle',
  //   name: 'dreamy',
  //   duration: 2000,
  //   ease: 'linear',
  // },
  transition: {
    name: 'none',
    duration: 0,
  },
  slides: [
    {
      // duration: 2000, // optional
      duration() {
        return this.content[0];
      },
      transitionNext: {
        name: 'warpfade', // name/id/key/slug
        duration: 2000,
        priority: 1,
      },
      // transitionPrev: {
      //   name: 'cube', // name/id/key/slug
      //   ease: 'bounceOut',
      //   duration: 2000,
      //   priority: 1,
      // },
      background: '#00FF00',
      content: [
        {
          url: 'demo/assets/wowcat.mp4',
          position: [0.1, 0.1, 0.9, 0.9], // [x, y, x2, y2] either percentage based or...
          // position: [100, 100, 100, 100], // [x, y, w - x2, h - y2] ...pixels from edges
          scaleMode: 'fit', // fit|fill
          tile: {
            // size: [0.2, 0.2], // [w, h] either percentage based or...
            size: [200, 200], // [w, h] ...in pixels
            scaleMode: 'fill', // fit|fill
          },
        },
        {
          text: 'Showy',
          font: '300px sans-serif',
          align: 'center',
          color: 'rgb(255, 255, 255)',
          position: [0.5, 0.55],
          maxWidth: 0.5,
        },
        {
          text: 'Ostentatious, canvas-based presentations',
          font: '80px sans-serif',
          align: 'center',
          color: 'rgb(255, 255, 255)',
          position: [0.5, 0.65],
          maxWidth: 0.5,
        },
      ],
    },
    {
      duration() {
        return this.content[0];
      },
      transitionNext: {
        name: 'none',
        duration: 0,
      },
      background: '#FFFFFF',
      content: [
        {
          url: 'demo/assets/wowowl.mp4',
          position: [0.4, 0.4, 0.6, 0.6],
          scaleMode: 'fill',
        },
      ],
    },
    {
      duration() {
        return this.content[0];
      },
      transitionNext: {
        name: 'none',
        duration: 0,
      },
      background: '#FFFFFF',
      content: [
        {
          url: 'demo/assets/wowowl.mp4',
          position: [0.2, 0.2, 0.8, 0.8],
          scaleMode: 'fill',
        },
      ],
    },
    {
      duration() {
        return this.content[0];
      },
      transitionNext: {
        name: 'none',
        duration: 0,
      },
      background: '#FFFFFF',
      content: [
        {
          url: 'demo/assets/wowowl.mp4',
          position: [0, 0, 1, 1],
          scaleMode: 'fill',
        },
      ],
    },
    {
      duration() {
        return this.content[0];
      },
      transitionPrev: {
        name: 'cube',
        ease: 'bounceOut',
        duration: 2000,
        priority: 1,
      },
      content: [
        {
          url: 'demo/assets/coolkid.mp4',
          position: [0, 0, 1, 1],
          scaleMode: 'fill',
        },
      ],
    },
    {
      duration: 500,
      transitionNext: {
        name: 'none',
        duration: 0,
      },
      background: '#DD0000',
      content: [
        {
          text: 'SUCH',
          position: [0.333, 0.333],
          color: '#FFFFFF',
          font: '300px serif',
          align: 'left',
        },
      ],
    },
    {
      duration: 1000,
      transitionNext: {
        name: 'none',
        duration: 0,
      },
      background: '#DD0000',
      content: [
        {
          text: 'SUCH',
          position: [0.333, 0.333],
          color: '#FFFFFF',
          font: '300px serif',
          align: 'left',
        },
        {
          text: 'WOW',
          position: [0.666, 0.666],
          color: '#FFFFFF',
          font: '300px serif',
          align: 'right',
        },
      ],
    },
    {
      duration() {
        return this.content[0];
      },
      transitionPrev: {
        name: 'kaleidoscope',
        duration: 6000,
        priority: 1,
      },
      transitionNext: {
        name: 'doorway',
        duration: 2000,
        priority: 1,
      },
      content: [
        {
          url: 'demo/assets/coolsunglasses.mp4',
          position: [0, 0, 1, 1],
          scaleMode: 'fill',
        },
      ],
    },
  ],
};

console.log('config', config);

// console.log(Showy);

var showy = new Showy(config);

console.log(showy);

document.body.addEventListener('click', (event) => {
  showy.nextSlide();
});

document.body.addEventListener('keydown', (event) => {
  if (event.keyCode === 39) {
    showy.nextSlide();
  }
  if (event.keyCode === 37) {
    showy.prevSlide();
  }
});
