require('expose?pica!pica/dist/pica');
require('expose?createTexture!gl-texture2d');
require('expose?createTransition!glsl-transition');

var Showy = require('expose?Showy!babel?presets[]=es2015!./src/showy');

module.exports = Showy;
