require('expose?pica!pica/dist/pica');
require('expose?createTexture!gl-texture2d');
require('expose?createTransition!glsl-transition');
require('expose?eases!eases');

var Showy = require('babel?presets[]=es2015!./src/showy');
Showy.DefaultTransitions = require('babel?presets[]=es2015!./src/transitions');

module.exports = Showy;
