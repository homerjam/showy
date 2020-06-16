var glslTransitions = require('glsl-transitions/build/glsl-transitions');

// http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
function camelize(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '');
}

window.glslTransitions = {};

glslTransitions.forEach(function (transition) {
  window.glslTransitions[camelize(transition.name)] = {
    shader: transition.glsl,
    uniforms: transition.uniforms,
  };
});
