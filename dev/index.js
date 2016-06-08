var config = {
  container: document.querySelector('.container'),
  autoplay: true,
  loop: true,
  duration: 2000,
  transition: 'fade',
  slides: [
    {
      duration: 2000, // optional
      transition: 'fade', // optional
      content: [
        {
          type: 'image',
          url: 'dev/assets/carpark.jpg', // string or...
          // url: function() { // ...function returning a string
          //   return 'assets/carpark.jpg',
          // },
          position: [100, 50, 0.5, 0.75], // [x, y, x2, y2] either percentage based or...
          // position: [100, 100, 100, 100], // [x, y, w - x2, h - y2] ...pixels from edges
          scaleMode: 'fit', // fit|fill
          tile: {
            size: [0.2, 0.2], // [w, h] either percentage based or...
            // size: [100, 100], // [w, h] ...in pixels
            scaleMode: 'fill', // fit|fill
          },
        },
        {
          type: 'video',
          sources: [
            {
              url: 'dev/assets/surfer.mp4',
              type: 'video/mp4', // optional - detect from url?
            },
          ],
          position: [0.2, 0.2, 0.5, 0.8], // [x, y, x2, y2] either percentage based or...
          // position: [100, 100, 100, 100], // [x, y, w - x2, h - y2] ...pixels from edges
          scaleMode: 'fit', // fit|fill
          tile: {
            // size: [0.2, 0.2], // [w, h] either percentage based or...
            size: [100, 100], // [w, h] ...in pixels
            scaleMode: 'fill', // fit|fill
          },
        },
        {
          type: 'image',
          url: 'dev/assets/carpark.jpg', // string or...
          // url: function() { // ...function returning a string
          //   return 'assets/carpark.jpg',
          // },
          position: [0.6, 50, 0.95, 0.25], // [x, y, x2, y2] either percentage based or...
          // position: [100, 100, 100, 100], // [x, y, w - x2, h - y2] ...pixels from edges
          scaleMode: 'fill', // fit|fill
          tile: {
            // size: [0.2, 0.2], // [w, h] either percentage based or...
            size: [100, 100], // [w, h] ...in pixels
            scaleMode: 'fill', // fit|fill
          },
        },
        {
          type: 'image',
          url: 'dev/assets/carpark.jpg', // string or...
          // url: function() { // ...function returning a string
          //   return 'assets/carpark.jpg',
          // },
          position: [0.75, 50, 0.95, 50], // [x, y, x2, y2] either percentage based or...
          // position: [100, 100, 100, 100], // [x, y, w - x2, h - y2] ...pixels from edges
          scaleMode: 'fill', // fit|fill
          tile: {
            size: [0.2, 0.2], // [w, h] either percentage based or...
            // size: [100, 100], // [w, h] ...in pixels
            scaleMode: 'fit', // fit|fill
          },
        },
      ],
    },
    {
      duration: 2000, // optional
      transition: 'fade', // optional
      content: [
        {
          type: 'video',
          sources: [
            {
              url: 'dev/assets/surfer.mp4',
              type: 'video/mp4', // optional - detect from url?
            },
          ],
          position: [0, 0, 1, 1], // [x, y, x2, y2] either percentage based or...
          // position: [100, 100, 100, 100], // [x, y, w - x2, h - y2] ...pixels from edges
          // scaleMode: 'fit', // fit|fill
          tile: {
            // size: [0.2, 0.2], // [w, h] either percentage based or...
            size: [200, 200], // [w, h] ...in pixels
            scaleMode: 'fill', // fit|fill
          },
        },
        {
          type: 'image',
          url: 'dev/assets/mud.jpg', // string or...
          // url: function() { // ...function returning a string
          //   return 'assets/carpark.jpg',
          // },
          position: [0.25, 100, 0.75, 100], // [x, y, x2, y2] either percentage based or...
          // position: [100, 100, 100, 100], // [x, y, w - x2, h - y2] ...pixels from edges
          scaleMode: 'fit', // fit|fill
        // tile: {
        //   size: [0.2, 0.2], // [w, h] either percentage based or...
        //   // size: [100, 100], // [w, h] ...in pixels
        //   scaleMode: 'fill', // fit|fill
        // },
        },
      ],
    },
  ],
};

console.log(config);

var showy = new (Showy.default || Showy)(config);

console.log(showy);

document.body.addEventListener('click', function (event) {
  showy.nextSlide();
});
