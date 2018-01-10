(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('util')) :
	typeof define === 'function' && define.amd ? define(['util'], factory) :
	(global.Showy = factory(global.util));
}(this, (function (util) { 'use strict';

util = util && util.hasOwnProperty('default') ? util['default'] : util;

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

var webworkify = function (fn, options) {
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp && exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            'function(require,module,exports){' + fn + '(self); }',
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        'function(require,module,exports){' +
            // try to call default if defined to also support babel esmodule exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);' +
        '}',
        scache
    ];

    var workerSources = {};
    resolveSources(skey);

    function resolveSources(key) {
        workerSources[key] = true;

        for (var depPath in sources[key][1]) {
            var depKey = sources[key][1][depPath];
            if (!workerSources[depKey]) {
                resolveSources(depKey);
            }
        }
    }

    var src = '(' + bundleFn + ')({'
        + Object.keys(workerSources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])';

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    var blob = new Blob([src], { type: 'text/javascript' });
    if (options && options.bare) { return blob; }
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
};

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var inherits_browser = createCommonjsModule(function (module) {
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  };
}
});

var inherits = createCommonjsModule(function (module) {
try {
  var util$$1 = util;
  if (typeof util$$1.inherits !== 'function') throw '';
  module.exports = util$$1.inherits;
} catch (e) {
  module.exports = inherits_browser;
}
});

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

/* eslint-disable no-unused-vars */
var getOwnPropertySymbols$1 = Object.getOwnPropertySymbols;
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var propIsEnumerable$1 = Object.prototype.propertyIsEnumerable;

function toObject$1(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative$1() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var objectAssign$2 = shouldUseNative$1() ? Object.assign : function (target, source) {
	var from;
	var to = toObject$1(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty$1.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols$1) {
			symbols = getOwnPropertySymbols$1(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable$1.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

// base64 decode str -> Uint8Array, to load WA modules
//
var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';


var base64decode = function base64decode(str) {
  var input = str.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
      max   = input.length;

  var out = new Uint8Array((max * 3) >> 2);

  // Collect by 6*4 bits (3 bytes)

  var bits = 0;
  var ptr  = 0;

  for (var idx = 0; idx < max; idx++) {
    if ((idx % 4 === 0) && idx) {
      out[ptr++] = (bits >> 16) & 0xFF;
      out[ptr++] = (bits >> 8) & 0xFF;
      out[ptr++] = bits & 0xFF;
    }

    bits = (bits << 6) | BASE64_MAP.indexOf(input.charAt(idx));
  }

  // Dump tail

  var tailbits = (max % 4) * 6;

  if (tailbits === 0) {
    out[ptr++] = (bits >> 16) & 0xFF;
    out[ptr++] = (bits >> 8) & 0xFF;
    out[ptr++] = bits & 0xFF;
  } else if (tailbits === 18) {
    out[ptr++] = (bits >> 10) & 0xFF;
    out[ptr++] = (bits >> 2) & 0xFF;
  } else if (tailbits === 12) {
    out[ptr++] = (bits >> 4) & 0xFF;
  }

  return out;
};

// See support/wa_detect/detect.c
// Dummy module with `function detect() { return 1; }`
var detector_src = 'AGFzbQEAAAABBQFgAAF/Ag8BA2VudgZtZW1vcnkCAAEDAgEABAQBcAAABwoBBmRldGVjdAAACQEACgYBBABBAQs=';


var wa;


var wa_detect = function hasWebAssembly() {
  // use cache if called before;
  if (typeof wa !== 'undefined') return wa;

  wa = false;

  if (typeof WebAssembly === 'undefined') return wa;

  // If WebAssenbly is disabled, code can throw on compile
  try {
    var module = new WebAssembly.Module(base64decode(detector_src));

    var env = {
      memoryBase: 0,
      memory:     new WebAssembly.Memory({ initial: 1 }),
      tableBase:  0,
      table:      new WebAssembly.Table({ initial: 0, element: 'anyfunc' })
    };

    var instance = new WebAssembly.Instance(module, { env: env });
    var detect = instance.exports.detect;

    if (detect() === 1) wa = true;

    return wa;
  } catch (__) {}

  return wa;
};

var DEFAULT_OPTIONS = {
  js: true,
  wasm: true
};


function MultiMath(options) {
  if (!(this instanceof MultiMath)) return new MultiMath(options);

  var opts = objectAssign$2({}, DEFAULT_OPTIONS, options || {});

  this.options         = opts;

  this.__cache         = {};
  this.has_wasm        = wa_detect();

  this.__init_promise  = null;
  this.__modules       = opts.modules || {};
  this.__memory        = null;
  this.__wasm          = {};

  this.__isLE = ((new Uint32Array((new Uint8Array([ 1, 0, 0, 0 ])).buffer))[0] === 1);

  if (!this.options.js && !this.options.wasm) {
    throw new Error('mathlib: at least "js" or "wasm" should be enabled');
  }
}


MultiMath.prototype.use = function (module) {
  this.__modules[module.name] = module;

  // Pin the best possible implementation
  if (!this.has_wasm || !this.options.wasm || !module.wasm_fn) {
    this[module.name] = module.fn;
  } else {
    this[module.name] = module.wasm_fn;
  }

  return this;
};


MultiMath.prototype.init = function () {
  if (this.__init_promise) return this.__init_promise;

  if (!this.options.js && this.options.wasm && !this.has_wasm) {
    return Promise.reject(new Error('mathlib: only "wasm" was enabled, but it\'s not supported'));
  }

  var self = this;

  this.__init_promise = Promise.all(Object.keys(self.__modules).map(function (name) {
    var module = self.__modules[name];

    if (!self.has_wasm || !self.options.wasm || !module.wasm_fn) return null;

    // If already compiled - exit
    if (self.__wasm[name]) return null;

    // Compile wasm source
    return WebAssembly.compile(self.__base64decode(module.wasm_src))
      .then(function (m) { self.__wasm[name] = m; });
  }))
    .then(function () { return self; });

  return this.__init_promise;
};


////////////////////////////////////////////////////////////////////////////////
// Methods below are for internal use from plugins


// Simple decode base64 to typed array. Useful to load embedded webassembly
// code. You probably don't need to call this method directly.
//
MultiMath.prototype.__base64decode = base64decode;


// Increase current memory to include specified number of bytes. Do nothing if
// size is already ok. You probably don't need to call this method directly,
// because it will be invoked from `.__instance()`.
//
MultiMath.prototype.__reallocate = function mem_grow_to(bytes) {
  if (!this.__memory) {
    this.__memory = new WebAssembly.Memory({
      initial: Math.ceil(bytes / (64 * 1024))
    });
    return this.__memory;
  }

  var mem_size = this.__memory.buffer.byteLength;

  if (mem_size < bytes) {
    this.__memory.grow(Math.ceil((bytes - mem_size) / (64 * 1024)));
  }

  return this.__memory;
};


// Returns instantinated webassembly item by name, with specified memory size
// and environment.
// - use cache if available
// - do sync module init, if async init was not called earlier
// - allocate memory if not enougth
// - can export functions to webassembly via "env_extra",
//   for example, { exp: Math.exp }
//
MultiMath.prototype.__instance = function instance(name, memsize, env_extra) {
  if (memsize) this.__reallocate(memsize);

  // If .init() was not called, do sync compile
  if (!this.__wasm[name]) {
    var module = this.__modules[name];
    this.__wasm[name] = new WebAssembly.Module(this.__base64decode(module.wasm_src));
  }

  if (!this.__cache[name]) {
    var env_base = {
      memoryBase: 0,
      memory: this.__memory,
      tableBase: 0,
      table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' })
    };

    this.__cache[name] = new WebAssembly.Instance(this.__wasm[name], {
      env: objectAssign$2(env_base, env_extra || {})
    });
  }

  return this.__cache[name];
};


// Helper to calculate memory aligh for pointers. Webassembly does not require
// this, but you may wish to experiment. Default base = 8;
//
MultiMath.prototype.__align = function align(number, base) {
  base = base || 8;
  var reminder = number % base;
  return number + (reminder ? base - reminder : 0);
};


var multimath = MultiMath;

// Calculate Gaussian blur of an image using IIR filter
// The method is taken from Intel's white paper and code example attached to it:
// https://software.intel.com/en-us/articles/iir-gaussian-blur-filter
// -implementation-using-intel-advanced-vector-extensions

var a0;
var a1;
var a2;
var a3;
var b1;
var b2;
var left_corner;
var right_corner;

function gaussCoef(sigma) {
  if (sigma < 0.5) {
    sigma = 0.5;
  }

  var a = Math.exp(0.726 * 0.726) / sigma,
      g1 = Math.exp(-a),
      g2 = Math.exp(-2 * a),
      k = (1 - g1) * (1 - g1) / (1 + 2 * a * g1 - g2);

  a0 = k;
  a1 = k * (a - 1) * g1;
  a2 = k * (a + 1) * g1;
  a3 = -k * g2;
  b1 = 2 * g1;
  b2 = -g2;
  left_corner = (a0 + a1) / (1 - b1 - b2);
  right_corner = (a2 + a3) / (1 - b1 - b2);

  // Attempt to force type to FP32.
  return new Float32Array([ a0, a1, a2, a3, b1, b2, left_corner, right_corner ]);
}

function convolveMono16(src, out, line, coeff, width, height) {
  // takes src image and writes the blurred and transposed result into out

  var prev_src, curr_src, curr_out, prev_out, prev_prev_out;
  var src_index, out_index, line_index;
  var i, j;
  var coeff_a0, coeff_a1, coeff_b1, coeff_b2;

  for (i = 0; i < height; i++) {
    src_index = i * width;
    out_index = i;
    line_index = 0;

    // left to right
    prev_src = src[src_index];
    prev_prev_out = prev_src * coeff[6];
    prev_out = prev_prev_out;

    coeff_a0 = coeff[0];
    coeff_a1 = coeff[1];
    coeff_b1 = coeff[4];
    coeff_b2 = coeff[5];

    for (j = 0; j < width; j++) {
      curr_src = src[src_index];

      curr_out = curr_src * coeff_a0 +
                 prev_src * coeff_a1 +
                 prev_out * coeff_b1 +
                 prev_prev_out * coeff_b2;

      prev_prev_out = prev_out;
      prev_out = curr_out;
      prev_src = curr_src;

      line[line_index] = prev_out;
      line_index++;
      src_index++;
    }

    src_index--;
    line_index--;
    out_index += height * (width - 1);

    // right to left
    prev_src = src[src_index];
    prev_prev_out = prev_src * coeff[7];
    prev_out = prev_prev_out;
    curr_src = prev_src;

    coeff_a0 = coeff[2];
    coeff_a1 = coeff[3];

    for (j = width - 1; j >= 0; j--) {
      curr_out = curr_src * coeff_a0 +
                 prev_src * coeff_a1 +
                 prev_out * coeff_b1 +
                 prev_prev_out * coeff_b2;

      prev_prev_out = prev_out;
      prev_out = curr_out;

      prev_src = curr_src;
      curr_src = src[src_index];

      out[out_index] = line[line_index] + prev_out;

      src_index--;
      line_index--;
      out_index -= height;
    }
  }
}


function blurMono16(src, width, height, radius) {
  // Quick exit on zero radius
  if (!radius) { return; }

  var out      = new Uint16Array(src.length),
      tmp_line = new Float32Array(Math.max(width, height));

  var coeff = gaussCoef(radius);

  convolveMono16(src, out, tmp_line, coeff, width, height, radius);
  convolveMono16(out, src, tmp_line, coeff, height, width, radius);
}

var mono16 = blurMono16;

// Calculates 16-bit precision HSL lightness from 8-bit rgba buffer
//
var hsl_l16 = function hsl_l16_js(img, width, height) {
  var size = width * height;
  var out = new Uint16Array(size);
  var r, g, b, min, max;
  for (var i = 0; i < size; i++) {
    r = img[4 * i];
    g = img[4 * i + 1];
    b = img[4 * i + 2];
    max = (r >= g && r >= b) ? r : (g >= b && g >= r) ? g : b;
    min = (r <= g && r <= b) ? r : (g <= b && g <= r) ? g : b;
    out[i] = (max + min) * 257 >> 1;
  }
  return out;
};

var unsharp_mask$2 = function unsharp(img, width, height, amount, radius, threshold) {
  var r, g, b;
  var h, s, l;
  var min, max;
  var m1, m2, hShifted;
  var diff, iTimes4;

  if (amount === 0 || radius < 0.5) {
    return;
  }
  if (radius > 2.0) {
    radius = 2.0;
  }

  var lightness = hsl_l16(img, width, height);

  var blured = new Uint16Array(lightness); // copy, because blur modify src

  mono16(blured, width, height, radius);

  var amountFp = (amount / 100 * 0x1000 + 0.5)|0;
  var thresholdFp = (threshold * 257)|0;

  var size = width * height;

  /* eslint-disable indent */
  for (var i = 0; i < size; i++) {
    diff = 2 * (lightness[i] - blured[i]);

    if (Math.abs(diff) >= thresholdFp) {
      iTimes4 = i * 4;
      r = img[iTimes4];
      g = img[iTimes4 + 1];
      b = img[iTimes4 + 2];

      // convert RGB to HSL
      // take RGB, 8-bit unsigned integer per each channel
      // save HSL, H and L are 16-bit unsigned integers, S is 12-bit unsigned integer
      // math is taken from here: http://www.easyrgb.com/index.php?X=MATH&H=18
      // and adopted to be integer (fixed point in fact) for sake of performance
      max = (r >= g && r >= b) ? r : (g >= r && g >= b) ? g : b; // min and max are in [0..0xff]
      min = (r <= g && r <= b) ? r : (g <= r && g <= b) ? g : b;
      l = (max + min) * 257 >> 1; // l is in [0..0xffff] that is caused by multiplication by 257

      if (min === max) {
        h = s = 0;
      } else {
        s = (l <= 0x7fff) ?
          (((max - min) * 0xfff) / (max + min))|0 :
          (((max - min) * 0xfff) / (2 * 0xff - max - min))|0; // s is in [0..0xfff]
        // h could be less 0, it will be fixed in backward conversion to RGB, |h| <= 0xffff / 6
        h = (r === max) ? (((g - b) * 0xffff) / (6 * (max - min)))|0
          : (g === max) ? 0x5555 + ((((b - r) * 0xffff) / (6 * (max - min)))|0) // 0x5555 == 0xffff / 3
          : 0xaaaa + ((((r - g) * 0xffff) / (6 * (max - min)))|0); // 0xaaaa == 0xffff * 2 / 3
      }

      // add unsharp mask mask to the lightness channel
      l += (amountFp * diff + 0x800) >> 12;
      if (l > 0xffff) {
        l = 0xffff;
      } else if (l < 0) {
        l = 0;
      }

      // convert HSL back to RGB
      // for information about math look above
      if (s === 0) {
        r = g = b = l >> 8;
      } else {
        m2 = (l <= 0x7fff) ? (l * (0x1000 + s) + 0x800) >> 12 :
          l  + (((0xffff - l) * s + 0x800) >>  12);
        m1 = 2 * l - m2 >> 8;
        m2 >>= 8;
        // save result to RGB channels
        // R channel
        hShifted = (h + 0x5555) & 0xffff; // 0x5555 == 0xffff / 3
        r = (hShifted >= 0xaaaa) ? m1 // 0xaaaa == 0xffff * 2 / 3
          : (hShifted >= 0x7fff) ?  m1 + ((m2 - m1) * 6 * (0xaaaa - hShifted) + 0x8000 >> 16)
          : (hShifted >= 0x2aaa) ? m2 // 0x2aaa == 0xffff / 6
          : m1 + ((m2 - m1) * 6 * hShifted + 0x8000 >> 16);
        // G channel
        hShifted = h & 0xffff;
        g = (hShifted >= 0xaaaa) ? m1 // 0xaaaa == 0xffff * 2 / 3
          : (hShifted >= 0x7fff) ?  m1 + ((m2 - m1) * 6 * (0xaaaa - hShifted) + 0x8000 >> 16)
          : (hShifted >= 0x2aaa) ? m2 // 0x2aaa == 0xffff / 6
          : m1 + ((m2 - m1) * 6 * hShifted + 0x8000 >> 16);
        // B channel
        hShifted = (h - 0x5555) & 0xffff;
        b = (hShifted >= 0xaaaa) ? m1 // 0xaaaa == 0xffff * 2 / 3
          : (hShifted >= 0x7fff) ?  m1 + ((m2 - m1) * 6 * (0xaaaa - hShifted) + 0x8000 >> 16)
          : (hShifted >= 0x2aaa) ? m2 // 0x2aaa == 0xffff / 6
          : m1 + ((m2 - m1) * 6 * hShifted + 0x8000 >> 16);
      }

      img[iTimes4] = r;
      img[iTimes4 + 1] = g;
      img[iTimes4 + 2] = b;
    }
  }
};

var unsharp_mask_wasm = function unsharp(img, width, height, amount, radius, threshold) {
  if (amount === 0 || radius < 0.5) {
    return;
  }

  if (radius > 2.0) {
    radius = 2.0;
  }

  var pixels = width * height;

  var img_bytes_cnt        = pixels * 4;
  var hsl_bytes_cnt        = pixels * 2;
  var blur_bytes_cnt       = pixels * 2;
  var blur_line_byte_cnt   = Math.max(width, height) * 4; // float32 array
  var blur_coeffs_byte_cnt = 8 * 4; // float32 array

  var img_offset         = 0;
  var hsl_offset         = img_bytes_cnt;
  var blur_offset        = hsl_offset + hsl_bytes_cnt;
  var blur_tmp_offset    = blur_offset + blur_bytes_cnt;
  var blur_line_offset   = blur_tmp_offset + blur_bytes_cnt;
  var blur_coeffs_offset = blur_line_offset + blur_line_byte_cnt;

  var instance = this.__instance(
    'unsharp_mask',
    img_bytes_cnt + hsl_bytes_cnt + blur_bytes_cnt * 2 + blur_line_byte_cnt + blur_coeffs_byte_cnt,
    { exp: Math.exp }
  );

  // 32-bit copy is much faster in chrome
  var img32 = new Uint32Array(img.buffer);
  var mem32 = new Uint32Array(this.__memory.buffer);
  mem32.set(img32);

  // HSL
  var fn = instance.exports.hsl_l16 || instance.exports._hsl_l16;
  fn(img_offset, hsl_offset, width, height);

  // BLUR
  fn = instance.exports.blurMono16 || instance.exports._blurMono16;
  fn(hsl_offset, blur_offset, blur_tmp_offset,
    blur_line_offset, blur_coeffs_offset, width, height, radius);

  // UNSHARP
  fn = instance.exports.unsharp || instance.exports._unsharp;
  fn(img_offset, img_offset, hsl_offset,
    blur_offset, width, height, amount, threshold);

  // 32-bit copy is much faster in chrome
  img32.set(new Uint32Array(this.__memory.buffer, 0, pixels));
};

// This is autogenerated file from math.wasm, don't edit.
//
/* eslint-disable max-len */
var unsharp_mask_wasm_base64 = 'AGFzbQEAAAABMQZgAXwBfGACfX8AYAZ/f39/f38AYAh/f39/f39/fQBgBH9/f38AYAh/f39/f39/fwACGQIDZW52A2V4cAAAA2VudgZtZW1vcnkCAAEDBgUBAgMEBQQEAXAAAAdMBRZfX2J1aWxkX2dhdXNzaWFuX2NvZWZzAAEOX19nYXVzczE2X2xpbmUAAgpibHVyTW9ubzE2AAMHaHNsX2wxNgAEB3Vuc2hhcnAABQkBAAqJEAXZAQEGfAJAIAFE24a6Q4Ia+z8gALujIgOaEAAiBCAEoCIGtjgCECABIANEAAAAAAAAAMCiEAAiBbaMOAIUIAFEAAAAAAAA8D8gBKEiAiACoiAEIAMgA6CiRAAAAAAAAPA/oCAFoaMiArY4AgAgASAEIANEAAAAAAAA8L+gIAKioiIHtjgCBCABIAQgA0QAAAAAAADwP6AgAqKiIgO2OAIIIAEgBSACoiIEtow4AgwgASACIAegIAVEAAAAAAAA8D8gBqGgIgKjtjgCGCABIAMgBKEgAqO2OAIcCwu3AwMDfwR9CHwCQCADKgIUIQkgAyoCECEKIAMqAgwhCyADKgIIIQwCQCAEQX9qIgdBAEgiCA0AIAIgAC8BALgiDSADKgIYu6IiDiAJuyIQoiAOIAq7IhGiIA0gAyoCBLsiEqIgAyoCALsiEyANoqCgoCIPtjgCACACQQRqIQIgAEECaiEAIAdFDQAgBCEGA0AgAiAOIBCiIA8iDiARoiANIBKiIBMgAC8BALgiDaKgoKAiD7Y4AgAgAkEEaiECIABBAmohACAGQX9qIgZBAUoNAAsLAkAgCA0AIAEgByAFbEEBdGogAEF+ai8BACIIuCINIAu7IhGiIA0gDLsiEqKgIA0gAyoCHLuiIg4gCrsiE6KgIA4gCbsiFKKgIg8gAkF8aioCALugqzsBACAHRQ0AIAJBeGohAiAAQXxqIQBBACAFQQF0ayEHIAEgBSAEQQF0QXxqbGohBgNAIAghAyAALwEAIQggBiANIBGiIAO4Ig0gEqKgIA8iECAToqAgDiAUoqAiDyACKgIAu6CrOwEAIAYgB2ohBiAAQX5qIQAgAkF8aiECIBAhDiAEQX9qIgRBAUoNAAsLCwvfAgIDfwZ8AkAgB0MAAAAAWw0AIARE24a6Q4Ia+z8gB0MAAAA/l7ujIgyaEAAiDSANoCIPtjgCECAEIAxEAAAAAAAAAMCiEAAiDraMOAIUIAREAAAAAAAA8D8gDaEiCyALoiANIAwgDKCiRAAAAAAAAPA/oCAOoaMiC7Y4AgAgBCANIAxEAAAAAAAA8L+gIAuioiIQtjgCBCAEIA0gDEQAAAAAAADwP6AgC6KiIgy2OAIIIAQgDiALoiINtow4AgwgBCALIBCgIA5EAAAAAAAA8D8gD6GgIgujtjgCGCAEIAwgDaEgC6O2OAIcIAYEQCAFQQF0IQogBiEJIAIhCANAIAAgCCADIAQgBSAGEAIgACAKaiEAIAhBAmohCCAJQX9qIgkNAAsLIAVFDQAgBkEBdCEIIAUhAANAIAIgASADIAQgBiAFEAIgAiAIaiECIAFBAmohASAAQX9qIgANAAsLC7wBAQV/IAMgAmwiAwRAQQAgA2shBgNAIAAoAgAiBEEIdiIHQf8BcSECAn8gBEH/AXEiAyAEQRB2IgRB/wFxIgVPBEAgAyIIIAMgAk8NARoLIAQgBCAHIAIgA0kbIAIgBUkbQf8BcQshCAJAIAMgAk0EQCADIAVNDQELIAQgByAEIAMgAk8bIAIgBUsbQf8BcSEDCyAAQQRqIQAgASADIAhqQYECbEEBdjsBACABQQJqIQEgBkEBaiIGDQALCwvTBgEKfwJAIAazQwAAgEWUQwAAyEKVu0QAAAAAAADgP6CqIQ0gBSAEbCILBEAgB0GBAmwhDgNAQQAgAi8BACADLwEAayIGQQF0IgdrIAcgBkEASBsgDk8EQCAAQQJqLQAAIQUCfyAALQAAIgYgAEEBai0AACIESSIJRQRAIAYiCCAGIAVPDQEaCyAFIAUgBCAEIAVJGyAGIARLGwshCAJ/IAYgBE0EQCAGIgogBiAFTQ0BGgsgBSAFIAQgBCAFSxsgCRsLIgogCGoiD0GBAmwiEEEBdiERQQAhDAJ/QQAiCSAIIApGDQAaIAggCmsiCUH/H2wgD0H+AyAIayAKayAQQYCABEkbbSEMIAYgCEYEQCAEIAVrQf//A2wgCUEGbG0MAQsgBSAGayAGIARrIAQgCEYiBhtB//8DbCAJQQZsbUHVqgFBqtUCIAYbagshCSARIAcgDWxBgBBqQQx1aiIGQQAgBkEAShsiBkH//wMgBkH//wNIGyEGAkACfwJAIAxB//8DcSIFBEAgBkH//wFKDQEgBUGAIGogBmxBgBBqQQx2DAILIAZBCHYiBiEFIAYhBAwCCyAFIAZB//8Dc2xBgBBqQQx2IAZqCyIFQQh2IQcgBkEBdCAFa0EIdiIGIQQCQCAJQdWqAWpB//8DcSIFQanVAksNACAFQf//AU8EQEGq1QIgBWsgByAGa2xBBmxBgIACakEQdiAGaiEEDAELIAchBCAFQanVAEsNACAFIAcgBmtsQQZsQYCAAmpBEHYgBmohBAsCfyAGIgUgCUH//wNxIghBqdUCSw0AGkGq1QIgCGsgByAGa2xBBmxBgIACakEQdiAGaiAIQf//AU8NABogByIFIAhBqdUASw0AGiAIIAcgBmtsQQZsQYCAAmpBEHYgBmoLIQUgCUGr1QJqQf//A3EiCEGp1QJLDQAgCEH//wFPBEBBqtUCIAhrIAcgBmtsQQZsQYCAAmpBEHYgBmohBgwBCyAIQanVAEsEQCAHIQYMAQsgCCAHIAZrbEEGbEGAgAJqQRB2IAZqIQYLIAEgBDoAACABQQFqIAU6AAAgAUECaiAGOgAACyADQQJqIQMgAkECaiECIABBBGohACABQQRqIQEgC0F/aiILDQALCwsL';

var unsharp_mask = {
  name:     'unsharp_mask',
  fn:       unsharp_mask$2,
  wasm_fn:  unsharp_mask_wasm,
  wasm_src: unsharp_mask_wasm_base64
};

// Filter definitions to build tables for
// resizing convolvers.
//
// Presets for quality 0..3. Filter functions + window size
//
var resize_filter_info = [
  { // Nearest neibor (Box)
    win: 0.5,
    filter: function (x) {
      return (x >= -0.5 && x < 0.5) ? 1.0 : 0.0;
    }
  },
  { // Hamming
    win: 1.0,
    filter: function (x) {
      if (x <= -1.0 || x >= 1.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return ((Math.sin(xpi) / xpi) *  (0.54 + 0.46 * Math.cos(xpi / 1.0)));
    }
  },
  { // Lanczos, win = 2
    win: 2.0,
    filter: function (x) {
      if (x <= -2.0 || x >= 2.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return (Math.sin(xpi) / xpi) * Math.sin(xpi / 2.0) / (xpi / 2.0);
    }
  },
  { // Lanczos, win = 3
    win: 3.0,
    filter: function (x) {
      if (x <= -3.0 || x >= 3.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return (Math.sin(xpi) / xpi) * Math.sin(xpi / 3.0) / (xpi / 3.0);
    }
  }
];

// Precision of fixed FP values
var FIXED_FRAC_BITS = 14;


function toFixedPoint(num) {
  return Math.round(num * ((1 << FIXED_FRAC_BITS) - 1));
}


var resize_filter_gen = function resizeFilterGen(quality, srcSize, destSize, scale, offset) {

  var filterFunction = resize_filter_info[quality].filter;

  var scaleInverted = 1.0 / scale;
  var scaleClamped  = Math.min(1.0, scale); // For upscale

  // Filter window (averaging interval), scaled to src image
  var srcWindow = resize_filter_info[quality].win / scaleClamped;

  var destPixel, srcPixel, srcFirst, srcLast, filterElementSize,
      floatFilter, fxpFilter, total, pxl, idx, floatVal, filterTotal, filterVal;
  var leftNotEmpty, rightNotEmpty, filterShift, filterSize;

  var maxFilterElementSize = Math.floor((srcWindow + 1) * 2);
  var packedFilter    = new Int16Array((maxFilterElementSize + 2) * destSize);
  var packedFilterPtr = 0;

  var slowCopy = !packedFilter.subarray || !packedFilter.set;

  // For each destination pixel calculate source range and built filter values
  for (destPixel = 0; destPixel < destSize; destPixel++) {

    // Scaling should be done relative to central pixel point
    srcPixel = (destPixel + 0.5) * scaleInverted + offset;

    srcFirst = Math.max(0, Math.floor(srcPixel - srcWindow));
    srcLast  = Math.min(srcSize - 1, Math.ceil(srcPixel + srcWindow));

    filterElementSize = srcLast - srcFirst + 1;
    floatFilter = new Float32Array(filterElementSize);
    fxpFilter = new Int16Array(filterElementSize);

    total = 0.0;

    // Fill filter values for calculated range
    for (pxl = srcFirst, idx = 0; pxl <= srcLast; pxl++, idx++) {
      floatVal = filterFunction(((pxl + 0.5) - srcPixel) * scaleClamped);
      total += floatVal;
      floatFilter[idx] = floatVal;
    }

    // Normalize filter, convert to fixed point and accumulate conversion error
    filterTotal = 0;

    for (idx = 0; idx < floatFilter.length; idx++) {
      filterVal = floatFilter[idx] / total;
      filterTotal += filterVal;
      fxpFilter[idx] = toFixedPoint(filterVal);
    }

    // Compensate normalization error, to minimize brightness drift
    fxpFilter[destSize >> 1] += toFixedPoint(1.0 - filterTotal);

    //
    // Now pack filter to useable form
    //
    // 1. Trim heading and tailing zero values, and compensate shitf/length
    // 2. Put all to single array in this format:
    //
    //    [ pos shift, data length, value1, value2, value3, ... ]
    //

    leftNotEmpty = 0;
    while (leftNotEmpty < fxpFilter.length && fxpFilter[leftNotEmpty] === 0) {
      leftNotEmpty++;
    }

    if (leftNotEmpty < fxpFilter.length) {
      rightNotEmpty = fxpFilter.length - 1;
      while (rightNotEmpty > 0 && fxpFilter[rightNotEmpty] === 0) {
        rightNotEmpty--;
      }

      filterShift = srcFirst + leftNotEmpty;
      filterSize = rightNotEmpty - leftNotEmpty + 1;

      packedFilter[packedFilterPtr++] = filterShift; // shift
      packedFilter[packedFilterPtr++] = filterSize; // size

      if (!slowCopy) {
        packedFilter.set(fxpFilter.subarray(leftNotEmpty, rightNotEmpty + 1), packedFilterPtr);
        packedFilterPtr += filterSize;
      } else {
        // fallback for old IE < 11, without subarray/set methods
        for (idx = leftNotEmpty; idx <= rightNotEmpty; idx++) {
          packedFilter[packedFilterPtr++] = fxpFilter[idx];
        }
      }
    } else {
      // zero data, write header only
      packedFilter[packedFilterPtr++] = 0; // shift
      packedFilter[packedFilterPtr++] = 0; // size
    }
  }
  return packedFilter;
};

// Resize convolvers, pure JS implementation
//
// Precision of fixed FP values
//var FIXED_FRAC_BITS = 14;


function clampTo8(i) { return i < 0 ? 0 : (i > 255 ? 255 : i); }


// Convolve image in horizontal directions and transpose output. In theory,
// transpose allow:
//
// - use the same convolver for both passes (this fails due different
//   types of input array and temporary buffer)
// - making vertical pass by horisonltal lines inprove CPU cache use.
//
// But in real life this doesn't work :)
//
function convolveHorizontally$1(src, dest, srcW, srcH, destW, filters) {

  var r, g, b, a;
  var filterPtr, filterShift, filterSize;
  var srcPtr, srcY, destX, filterVal;
  var srcOffset = 0, destOffset = 0;

  // For each row
  for (srcY = 0; srcY < srcH; srcY++) {
    filterPtr  = 0;

    // Apply precomputed filters to each destination row point
    for (destX = 0; destX < destW; destX++) {
      // Get the filter that determines the current output pixel.
      filterShift = filters[filterPtr++];
      filterSize  = filters[filterPtr++];

      srcPtr = (srcOffset + (filterShift * 4))|0;

      r = g = b = a = 0;

      // Apply the filter to the row to get the destination pixel r, g, b, a
      for (; filterSize > 0; filterSize--) {
        filterVal = filters[filterPtr++];

        // Use reverse order to workaround deopts in old v8 (node v.10)
        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
        a = (a + filterVal * src[srcPtr + 3])|0;
        b = (b + filterVal * src[srcPtr + 2])|0;
        g = (g + filterVal * src[srcPtr + 1])|0;
        r = (r + filterVal * src[srcPtr])|0;
        srcPtr = (srcPtr + 4)|0;
      }

      // Bring this value back in range. All of the filter scaling factors
      // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
      //
      // (!) Add 1/2 of value before clamping to get proper rounding. In other
      // case brightness loss will be noticeable if you resize image with white
      // border and place it on white background.
      //
      dest[destOffset + 3] = clampTo8((a + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 2] = clampTo8((b + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 1] = clampTo8((g + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset]     = clampTo8((r + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      destOffset = (destOffset + srcH * 4)|0;
    }

    destOffset = ((srcY + 1) * 4)|0;
    srcOffset  = ((srcY + 1) * srcW * 4)|0;
  }
}

// Technically, convolvers are the same. But input array and temporary
// buffer can be of different type (especially, in old browsers). So,
// keep code in separate functions to avoid deoptimizations & speed loss.

function convolveVertically$1(src, dest, srcW, srcH, destW, filters) {

  var r, g, b, a;
  var filterPtr, filterShift, filterSize;
  var srcPtr, srcY, destX, filterVal;
  var srcOffset = 0, destOffset = 0;

  // For each row
  for (srcY = 0; srcY < srcH; srcY++) {
    filterPtr  = 0;

    // Apply precomputed filters to each destination row point
    for (destX = 0; destX < destW; destX++) {
      // Get the filter that determines the current output pixel.
      filterShift = filters[filterPtr++];
      filterSize  = filters[filterPtr++];

      srcPtr = (srcOffset + (filterShift * 4))|0;

      r = g = b = a = 0;

      // Apply the filter to the row to get the destination pixel r, g, b, a
      for (; filterSize > 0; filterSize--) {
        filterVal = filters[filterPtr++];

        // Use reverse order to workaround deopts in old v8 (node v.10)
        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
        a = (a + filterVal * src[srcPtr + 3])|0;
        b = (b + filterVal * src[srcPtr + 2])|0;
        g = (g + filterVal * src[srcPtr + 1])|0;
        r = (r + filterVal * src[srcPtr])|0;
        srcPtr = (srcPtr + 4)|0;
      }

      // Bring this value back in range. All of the filter scaling factors
      // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
      //
      // (!) Add 1/2 of value before clamping to get proper rounding. In other
      // case brightness loss will be noticeable if you resize image with white
      // border and place it on white background.
      //
      dest[destOffset + 3] = clampTo8((a + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 2] = clampTo8((b + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 1] = clampTo8((g + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset]     = clampTo8((r + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      destOffset = (destOffset + srcH * 4)|0;
    }

    destOffset = ((srcY + 1) * 4)|0;
    srcOffset  = ((srcY + 1) * srcW * 4)|0;
  }
}


var convolve = {
  convolveHorizontally: convolveHorizontally$1,
  convolveVertically: convolveVertically$1
};

const convolveHorizontally = convolve.convolveHorizontally;
const convolveVertically   = convolve.convolveVertically;


function resetAlpha(dst, width, height) {
  let ptr = 3, len = (width * height * 4)|0;
  while (ptr < len) { dst[ptr] = 0xFF; ptr = (ptr + 4)|0; }
}


var resize = function resize(options) {
  const src   = options.src;
  const srcW  = options.width;
  const srcH  = options.height;
  const destW = options.toWidth;
  const destH = options.toHeight;
  const scaleX = options.scaleX || options.toWidth / options.width;
  const scaleY = options.scaleY || options.toHeight / options.height;
  const offsetX = options.offsetX || 0;
  const offsetY = options.offsetY || 0;
  const dest  = options.dest || new Uint8Array(destW * destH * 4);
  const quality = typeof options.quality === 'undefined' ? 3 : options.quality;
  const alpha = options.alpha || false;

  const filtersX = resize_filter_gen(quality, srcW, destW, scaleX, offsetX),
        filtersY = resize_filter_gen(quality, srcH, destH, scaleY, offsetY);

  const tmp  = new Uint8Array(destW * srcH * 4);

  // To use single function we need src & tmp of the same type.
  // But src can be CanvasPixelArray, and tmp - Uint8Array. So, keep
  // vertical and horizontal passes separately to avoid deoptimization.

  convolveHorizontally(src, tmp, srcW, srcH, destW, filtersX);
  convolveVertically(tmp, dest, srcH, destW, destH, filtersY);

  // That's faster than doing checks in convolver.
  // !!! Note, canvas data is not premultipled. We don't need other
  // alpha corrections.

  if (!alpha) resetAlpha(dest, destW, destH);

  return dest;
};

function resetAlpha$1(dst, width, height) {
  let ptr = 3, len = (width * height * 4)|0;
  while (ptr < len) { dst[ptr] = 0xFF; ptr = (ptr + 4)|0; }
}


function asUint8Array(src) {
  return new Uint8Array(src.buffer, 0, src.byteLength);
}


let IS_LE = true;
// should not crash everything on module load in old browsers
try {
  IS_LE = ((new Uint32Array((new Uint8Array([ 1, 0, 0, 0 ])).buffer))[0] === 1);
} catch (__) {}


function copyInt16asLE(src, target, target_offset) {
  if (IS_LE) {
    target.set(asUint8Array(src), target_offset);
    return;
  }

  for (let ptr = target_offset, i = 0; i < src.length; i++) {
    let data = src[i];
    target[ptr++] = data & 0xFF;
    target[ptr++] = (data >> 8) & 0xFF;
  }
}

var resize_wasm = function resize_wasm(options) {
  const src     = options.src;
  const srcW    = options.width;
  const srcH    = options.height;
  const destW   = options.toWidth;
  const destH   = options.toHeight;
  const scaleX  = options.scaleX || options.toWidth / options.width;
  const scaleY  = options.scaleY || options.toHeight / options.height;
  const offsetX = options.offsetX || 0.0;
  const offsetY = options.offsetY || 0.0;
  const dest    = options.dest || new Uint8Array(destW * destH * 4);
  const quality = typeof options.quality === 'undefined' ? 3 : options.quality;
  const alpha   = options.alpha || false;

  const filtersX = resize_filter_gen(quality, srcW, destW, scaleX, offsetX),
        filtersY = resize_filter_gen(quality, srcH, destH, scaleY, offsetY);

  // destination is 0 too.
  const src_offset      = 0;
  // buffer between convolve passes
  const tmp_offset      = this.__align(src_offset + Math.max(src.byteLength, dest.byteLength), 8);
  const filtersX_offset = this.__align(tmp_offset + srcH * destW * 4, 8);
  const filtersY_offset = this.__align(filtersX_offset + filtersX.byteLength, 8);
  const alloc_bytes     = filtersY_offset + filtersY.byteLength;

  const instance = this.__instance('resize', alloc_bytes);

  //
  // Fill memory block with data to process
  //

  const mem   = new Uint8Array(this.__memory.buffer);
  const mem32 = new Uint32Array(this.__memory.buffer);

  // 32-bit copy is much faster in chrome
  const src32 = new Uint32Array(src.buffer);
  mem32.set(src32);

  // We should guarantee LE bytes order. Filters are not big, so
  // speed difference is not significant vs direct .set()
  copyInt16asLE(filtersX, mem, filtersX_offset);
  copyInt16asLE(filtersY, mem, filtersY_offset);

  //
  // Now call webassembly method
  // emsdk does method names with '_'
  const fn = instance.exports.convolveHV || instance.exports._convolveHV;

  fn(filtersX_offset, filtersY_offset, tmp_offset, srcW, srcH, destW, destH);

  //
  // Copy data back to typed array
  //

  // 32-bit copy is much faster in chrome
  const dest32 = new Uint32Array(dest.buffer);
  dest32.set(new Uint32Array(this.__memory.buffer, 0, destH * destW));

  // That's faster than doing checks in convolver.
  // !!! Note, canvas data is not premultipled. We don't need other
  // alpha corrections.

  if (!alpha) resetAlpha$1(dest, destW, destH);

  return dest;
};

// This is autogenerated file from math.wasm, don't edit.
//
/* eslint-disable max-len */
var convolve_wasm_base64 = 'AGFzbQEAAAABFAJgBn9/f39/fwBgB39/f39/f38AAg8BA2VudgZtZW1vcnkCAAEDAwIAAQQEAXAAAAcZAghjb252b2x2ZQAACmNvbnZvbHZlSFYAAQkBAArmAwLBAwEQfwJAIANFDQAgBEUNACAFQQRqIRVBACEMQQAhDQNAIA0hDkEAIRFBACEHA0AgB0ECaiESAn8gBSAHQQF0IgdqIgZBAmouAQAiEwRAQQAhCEEAIBNrIRQgFSAHaiEPIAAgDCAGLgEAakECdGohEEEAIQlBACEKQQAhCwNAIBAoAgAiB0EYdiAPLgEAIgZsIAtqIQsgB0H/AXEgBmwgCGohCCAHQRB2Qf8BcSAGbCAKaiEKIAdBCHZB/wFxIAZsIAlqIQkgD0ECaiEPIBBBBGohECAUQQFqIhQNAAsgEiATagwBC0EAIQtBACEKQQAhCUEAIQggEgshByABIA5BAnRqIApBgMAAakEOdSIGQf8BIAZB/wFIG0EQdEGAgPwHcUEAIAZBAEobIAtBgMAAakEOdSIGQf8BIAZB/wFIG0EYdEEAIAZBAEobciAJQYDAAGpBDnUiBkH/ASAGQf8BSBtBCHRBgP4DcUEAIAZBAEobciAIQYDAAGpBDnUiBkH/ASAGQf8BSBtB/wFxQQAgBkEAShtyNgIAIA4gA2ohDiARQQFqIhEgBEcNAAsgDCACaiEMIA1BAWoiDSADRw0ACwsLIQACQEEAIAIgAyAEIAUgABAAIAJBACAEIAUgBiABEAALCw==';

var mm_resize = {
  name:     'resize',
  fn:       resize,
  wasm_fn:  resize_wasm,
  wasm_src: convolve_wasm_base64
};

function MathLib(requested_features) {
  const __requested_features = requested_features || [];

  let features = {
    js:   __requested_features.indexOf('js') >= 0,
    wasm: __requested_features.indexOf('wasm') >= 0
  };

  multimath.call(this, features);

  this.features = {
    js:   features.js,
    wasm: features.wasm && this.has_wasm
  };

  this.use(unsharp_mask);
  this.use(mm_resize);
}


inherits(MathLib, multimath);


MathLib.prototype.resizeAndUnsharp = function resizeAndUnsharp(options, cache) {
  let result = this.resize(options, cache);

  if (options.unsharpAmount) {
    this.unsharp_mask(
      result,
      options.toWidth,
      options.toHeight,
      options.unsharpAmount,
      options.unsharpRadius,
      options.unsharpThreshold
    );
  }

  return result;
};


var mathlib = MathLib;

const GC_INTERVAL = 100;


function Pool(create, idle) {
  this.create = create;

  this.available = [];
  this.acquired = {};
  this.lastId = 1;

  this.timeoutId = 0;
  this.idle = idle || 2000;
}


Pool.prototype.acquire = function () {
  let resource;

  if (this.available.length !== 0) {
    resource = this.available.pop();
  } else {
    resource = this.create();
    resource.id = this.lastId++;
    resource.release = () => this.release(resource);
  }
  this.acquired[resource.id] = resource;
  return resource;
};


Pool.prototype.release = function (resource) {
  delete this.acquired[resource.id];

  resource.lastUsed = Date.now();
  this.available.push(resource);

  if (this.timeoutId === 0) {
    this.timeoutId = setTimeout(() => this.gc(), GC_INTERVAL);
  }
};


Pool.prototype.gc = function () {
  const now = Date.now();

  this.available = this.available.filter(resource => {
    if (now - resource.lastUsed > this.idle) {
      resource.destroy();
      return false;
    }
    return true;
  });

  if (this.available.length !== 0) {
    this.timeoutId = setTimeout(() => this.gc(), GC_INTERVAL);
  } else {
    this.timeoutId = 0;
  }
};


var pool = Pool;

function objClass(obj) { return Object.prototype.toString.call(obj); }


var isCanvas = function isCanvas(element) {
  //return (element.nodeName && element.nodeName.toLowerCase() === 'canvas') ||
  let cname = objClass(element);

  return cname === '[object HTMLCanvasElement]'/* browser */ ||
         cname === '[object Canvas]'/* node-canvas */;
};


var isImage = function isImage(element) {
  //return element.nodeName && element.nodeName.toLowerCase() === 'img';
  return objClass(element) === '[object HTMLImageElement]';
};


var limiter = function limiter(concurrency) {
  let active = 0,
      queue  = [];

  function roll() {
    if (active < concurrency && queue.length) {
      active++;
      queue.shift()();
    }
  }

  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push(() => {
        fn().then(
          result => {
            resolve(result);
            active--;
            roll();
          },
          err => {
            reject(err);
            active--;
            roll();
          }
        );
      });

      roll();
    });
  };
};


var cib_quality_name = function cib_quality_name(num) {
  switch (num) {
    case 0: return 'pixelated';
    case 1: return 'low';
    case 2: return 'medium';
  }
  return 'high';
};


var cib_support = function cib_support() {
  return Promise.resolve().then(() => {
    if (typeof createImageBitmap === 'undefined' ||
        typeof document === 'undefined') {
      return false;
    }

    let c = document.createElement('canvas');
    c.width = 100;
    c.height = 100;

    return createImageBitmap(c, 0, 0, 100, 100, {
      resizeWidth: 10,
      resizeHeight: 10,
      resizeQuality: 'high'
    })
    .then(bitmap => {
      let status = (bitmap.width === 10);

      // Branch below is filtered on upper level. We do not call resize
      // detection for basic ImageBitmap.
      //
      // https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap
      // old Crome 51 has ImageBitmap without .close(). Then this code
      // will throw and return 'false' as expected.
      //
      bitmap.close();
      c = null;
      return status;
    });
  })
  .catch(() => false);
};

var utils = {
	isCanvas: isCanvas,
	isImage: isImage,
	limiter: limiter,
	cib_quality_name: cib_quality_name,
	cib_support: cib_support
};

var worker = function () {
  const MathLib = mathlib;

  let mathLib;

  /* eslint-disable no-undef */
  onmessage = function (ev) {
    let opts = ev.data.opts;

    if (!mathLib) mathLib = new MathLib(ev.data.features);

    // Use multimath's sync auto-init. Avoid Promise use in old browsers,
    // because polyfills are not propagated to webworker.
    let result = mathLib.resizeAndUnsharp(opts);

    postMessage({ result }, [ result.buffer ]);
  };
};

/*
 * pixelFloor and pixelCeil are modified versions of Math.floor and Math.ceil
 * functions which take into account floating point arithmetic errors.
 * Those errors can cause undesired increments/decrements of sizes and offsets:
 * Math.ceil(36 / (36 / 500)) = 501
 * pixelCeil(36 / (36 / 500)) = 500
 */

var PIXEL_EPSILON = 1e-5;

function pixelFloor(x) {
  var nearest = Math.round(x);

  if (Math.abs(x - nearest) < PIXEL_EPSILON) { return nearest; }
  return Math.floor(x);
}

function pixelCeil(x) {
  var nearest = Math.round(x);

  if (Math.abs(x - nearest) < PIXEL_EPSILON) { return nearest; }
  return Math.ceil(x);
}


var tiler = function createRegions(options) {
  var scaleX = options.toWidth / options.width;
  var scaleY = options.toHeight / options.height;

  var innerTileWidth = pixelFloor(options.srcTileSize * scaleX) - 2 * options.destTileBorder;
  var innerTileHeight = pixelFloor(options.srcTileSize * scaleY) - 2 * options.destTileBorder;

  var x, y;
  var innerX, innerY, toTileWidth, toTileHeight;
  var tiles = [];
  var tile;

  // we go top-to-down instead of left-to-right to make image displayed from top to
  // doesn in the browser
  for (innerY = 0; innerY < options.toHeight; innerY += innerTileHeight) {
    for (innerX = 0; innerX < options.toWidth; innerX += innerTileWidth) {
      x = innerX - options.destTileBorder;
      if (x < 0) { x = 0; }
      toTileWidth = innerX + innerTileWidth + options.destTileBorder - x;
      if (x + toTileWidth >= options.toWidth) {
        toTileWidth = options.toWidth - x;
      }

      y = innerY - options.destTileBorder;
      if (y < 0) { y = 0; }
      toTileHeight = innerY + innerTileHeight + options.destTileBorder - y;
      if (y + toTileHeight >= options.toHeight) {
        toTileHeight = options.toHeight - y;
      }

      tile = {
        toX: x,
        toY: y,
        toWidth: toTileWidth,
        toHeight: toTileHeight,

        toInnerX: innerX,
        toInnerY: innerY,
        toInnerWidth: innerTileWidth,
        toInnerHeight: innerTileHeight,

        offsetX: x / scaleX - pixelFloor(x / scaleX),
        offsetY: y / scaleY - pixelFloor(y / scaleY),
        scaleX: scaleX,
        scaleY: scaleY,

        x: pixelFloor(x / scaleX),
        y: pixelFloor(y / scaleY),
        width: pixelCeil(toTileWidth / scaleX),
        height: pixelCeil(toTileHeight / scaleY)
      };

      tiles.push(tile);
    }
  }

  return tiles;
};

// Deduplicate pools & limiters with the same configs
// when user creates multiple pica instances.
const singletones = {};


let NEED_SAFARI_FIX = false;
try {
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    NEED_SAFARI_FIX = navigator.userAgent.indexOf('Safari') >= 0;
  }
} catch (e) {}


let concurrency = 1;
if (typeof navigator !== 'undefined') {
  concurrency = Math.min(navigator.hardwareConcurrency || 1, 4);
}


const DEFAULT_PICA_OPTS = {
  tile: 1024,
  concurrency,
  features: [ 'js', 'wasm', 'ww' ],
  idle: 2000
};


const DEFAULT_RESIZE_OPTS = {
  quality:          3,
  alpha:            false,
  unsharpAmount:    0,
  unsharpRadius:    0.0,
  unsharpThreshold: 0
};

let CAN_NEW_IMAGE_DATA;
let CAN_CREATE_IMAGE_BITMAP;


function workerFabric() {
  return {
    value: webworkify(worker),
    destroy: function () {
      this.value.terminate();

      if (typeof window !== 'undefined') {
        let url = window.URL || window.webkitURL || window.mozURL || window.msURL;
        if (url && url.revokeObjectURL && this.value.objectURL) {
          url.revokeObjectURL(this.value.objectURL);
        }
      }
    }
  };
}


////////////////////////////////////////////////////////////////////////////////
// API methods

function Pica(options) {
  if (!(this instanceof Pica)) return new Pica(options);

  this.options = objectAssign(DEFAULT_PICA_OPTS, options || {});

  let limiter_key = `lk_${this.options.concurrency}`;

  // Share limiters to avoid multiple parallel workers when user creates
  // multiple pica instances.
  this.__limit = singletones[limiter_key] || utils.limiter(this.options.concurrency);

  if (!singletones[limiter_key]) singletones[limiter_key] = this.__limit;

  // List of supported features, according to options & browser/node.js
  this.features = {
    js:   false, // pure JS implementation, can be disabled for testing
    wasm: false, // webassembly implementation for heavy functions
    cib:  false, // resize via createImageBitmap (only FF at this moment)
    ww:   false  // webworkers
  };

  this.__workersPool = null;

  // Store requested features for webworkers
  this.__requested_features = [];

  this.__mathlib = null;
}


Pica.prototype.init = function () {
  if (this.__initPromise) return this.__initPromise;

  // Test if we can create ImageData without canvas and memory copy
  if (CAN_NEW_IMAGE_DATA !== false && CAN_NEW_IMAGE_DATA !== true) {
    CAN_NEW_IMAGE_DATA = false;
    if (typeof ImageData !== 'undefined' && typeof Uint8ClampedArray !== 'undefined') {
      try {
        /* eslint-disable no-new */
        new ImageData(new Uint8ClampedArray(400), 10, 10);
        CAN_NEW_IMAGE_DATA = true;
      } catch (__) {}
    }
  }

  // ImageBitmap can be effective in 2 places:
  //
  // 1. Threaded jpeg unpack (basic)
  // 2. Built-in resize (blocked due problem in chrome, see issue #89)
  //
  // For basic use we also need ImageBitmap wo support .close() method,
  // see https://developer.mozilla.org/ru/docs/Web/API/ImageBitmap

  if (CAN_CREATE_IMAGE_BITMAP !== false && CAN_CREATE_IMAGE_BITMAP !== true) {
    CAN_CREATE_IMAGE_BITMAP = false;
    if (typeof ImageBitmap !== 'undefined') {
      if (ImageBitmap.prototype && ImageBitmap.prototype.close) {
        CAN_CREATE_IMAGE_BITMAP = true;
      } else {
        this.debug('ImageBitmap does not support .close(), disabled');
      }
    }
  }


  let features = this.options.features.slice();

  if (features.indexOf('all') >= 0) {
    features = [ 'cib', 'wasm', 'js', 'ww' ];
  }

  this.__requested_features = features;

  this.__mathlib = new mathlib(features);

  // Check WebWorker support if requested
  if (features.indexOf('ww') >= 0) {
    if ((typeof window !== 'undefined') && ('Worker' in window)) {
      // IE <= 11 don't allow to create webworkers from string. We should check it.
      // https://connect.microsoft.com/IE/feedback/details/801810/web-workers-from-blob-urls-in-ie-10-and-11
      try {
        let wkr = webworkify(function () {});
        wkr.terminate();
        this.features.ww   = true;

        // pool uniqueness depends on pool config + webworker config
        let wpool_key = `wp_${JSON.stringify(this.options)}`;

        if (singletones[wpool_key]) {
          this.__workersPool = singletones[wpool_key];
        } else {
          this.__workersPool = new pool(workerFabric, this.options.idle);
          singletones[wpool_key] = this.__workersPool;
        }
      } catch (__) {}
    }
  }

  let initMath = this.__mathlib.init().then(mathlib$$1 => {
    // Copy detected features
    objectAssign(this.features, mathlib$$1.features);
  });

  let checkCibResize;

  if (!CAN_CREATE_IMAGE_BITMAP) {
    checkCibResize = Promise.resolve(false);
  } else {
    checkCibResize = utils.cib_support().then(status => {
      if (this.features.cib && features.indexOf('cib') < 0) {
        this.debug('createImageBitmap() resize supported, but disabled by config');
        return;
      }

      if (features.indexOf('cib') >= 0) this.features.cib = status;
    });
  }

  // Init math lib. That's async because can load some
  this.__initPromise = Promise.all([ initMath, checkCibResize ]).then(() => this);

  return this.__initPromise;
};


Pica.prototype.resize = function (from, to, options) {
  this.debug('Start resize...');


  let opts = DEFAULT_RESIZE_OPTS;

  if (!isNaN(options)) {
    opts = objectAssign(opts, { quality: options });
  } else if (options) {
    opts = objectAssign(opts, options);
  }

  opts.toWidth  = to.width;
  opts.toHeigth = to.height;
  opts.width    = from.naturalWidth || from.width;
  opts.height   = from.naturalHeight || from.height;

  let canceled    = false;
  let cancelToken = null;

  if (opts.cancelToken) {
    // Wrap cancelToken to avoid successive resolve & set flag
    cancelToken = opts.cancelToken.then(
      data => { canceled = true; throw data; },
      err  => { canceled = true; throw err; }
    );
  }

  let toCtx = to.getContext('2d', { alpha: Boolean(opts.alpha) });

  return this.init().then(() => {
    if (canceled) return cancelToken;

    // if createImageBitmap supports resize, just do it and return
    if (this.features.cib) {
      this.debug('Resize via createImageBitmap()');

      return createImageBitmap(from, {
        resizeWidth:   opts.toWidth,
        resizeHeight:  opts.toHeigth,
        resizeQuality: utils.cib_quality_name(opts.quality)
      })
      .then(imageBitmap => {
        if (canceled) return cancelToken;

        // if no unsharp - draw directly to output canvas
        if (!opts.unsharpAmount) {
          toCtx.drawImage(imageBitmap, 0, 0);
          imageBitmap.close();
          toCtx = null;

          this.debug('Finished!');

          return to;
        }

        this.debug('Unsharp result');

        let tmpCanvas = document.createElement('canvas');

        tmpCanvas.width  = opts.toWidth;
        tmpCanvas.height = opts.toHeigth;

        let tmpCtx = tmpCanvas.getContext('2d', { alpha: Boolean(opts.alpha) });

        tmpCtx.drawImage(imageBitmap, 0, 0);
        imageBitmap.close();

        let iData = tmpCtx.getImageData(0, 0, opts.toWidth, opts.toHeigth);

        this.__mathlib.unsharp(
          iData.data,
          opts.toWidth,
          opts.toHeigth,
          opts.unsharpAmount,
          opts.unsharpRadius,
          opts.unsharpThreshold
        );

        toCtx.putImageData(iData, 0, 0);
        iData = tmpCtx = tmpCanvas = toCtx = null;

        this.debug('Finished!');

        return to;
      });
    }

    //
    // No easy way, let's resize manually via arrays
    //

    let srcCtx;
    let srcImageBitmap;

    // Share cache between calls:
    //
    // - wasm instance
    // - wasm memory object
    //
    let cache = {};

    // Call resizer in webworker or locally, depending on config
    const invokeResize = opts => {
      return Promise.resolve().then(() => {
        if (!this.features.ww) return this.__mathlib.resizeAndUnsharp(opts, cache);

        return new Promise((resolve, reject) => {
          let w = this.__workersPool.acquire();

          if (cancelToken) cancelToken.catch(err => reject(err));

          w.value.onmessage = ev => {
            w.release();

            if (ev.data.err) reject(ev.data.err);
            else resolve(ev.data.result);
          };

          w.value.postMessage({
            opts,
            features: this.__requested_features,
            preload: {
              wasm_nodule: this.__mathlib.__
            }
          }, [ opts.src.buffer ]);
        });
      });
    };


    const processTile = (tile => this.__limit(() => {
      if (canceled) return cancelToken;

      let srcImageData;

      // Extract tile RGBA buffer, depending on input type
      if (utils.isCanvas(from)) {
        this.debug('Get tile pixel data');

        // If input is Canvas - extract region data directly
        srcImageData = srcCtx.getImageData(tile.x, tile.y, tile.width, tile.height);
      } else {
        // If input is Image or decoded to ImageBitmap,
        // draw region to temporary canvas and extract data from it
        //
        // Note! Attempt to reuse this canvas causes significant slowdown in chrome
        //
        this.debug('Draw tile imageBitmap/image to temporary canvas');

        let tmpCanvas = document.createElement('canvas');
        tmpCanvas.width  = tile.width;
        tmpCanvas.height = tile.height;

        let tmpCtx = tmpCanvas.getContext('2d', { alpha: Boolean(opts.alpha) });
        tmpCtx.globalCompositeOperation = 'copy';
        tmpCtx.drawImage(srcImageBitmap || from,
          tile.x, tile.y, tile.width, tile.height,
          0, 0, tile.width, tile.height);

        this.debug('Get tile pixel data');

        srcImageData = tmpCtx.getImageData(0, 0, tile.width, tile.height);
        tmpCtx = tmpCanvas = null;
      }

      let o = {
        src:              srcImageData.data,
        width:            tile.width,
        height:           tile.height,
        toWidth:          tile.toWidth,
        toHeight:         tile.toHeight,
        scaleX:           tile.scaleX,
        scaleY:           tile.scaleY,
        offsetX:          tile.offsetX,
        offsetY:          tile.offsetY,
        quality:          opts.quality,
        alpha:            opts.alpha,
        unsharpAmount:    opts.unsharpAmount,
        unsharpRadius:    opts.unsharpRadius,
        unsharpThreshold: opts.unsharpThreshold
      };

      this.debug('Invoke resize math');

      return Promise.resolve()
        .then(() => invokeResize(o))
        .then(result => {
          if (canceled) return cancelToken;

          srcImageData = null;

          let toImageData;

          this.debug('Convert raw rgba tile result to ImageData');

          if (CAN_NEW_IMAGE_DATA) {
            // this branch is for modern browsers
            // If `new ImageData()` & Uint8ClampedArray suported
            toImageData = new ImageData(new Uint8ClampedArray(result), tile.toWidth, tile.toHeight);
          } else {
            // fallback for `node-canvas` and old browsers
            // (IE11 has ImageData but does not support `new ImageData()`)
            toImageData = toCtx.createImageData(tile.toWidth, tile.toHeight);

            if (toImageData.data.set) {
              toImageData.data.set(result);
            } else {
              // IE9 don't have `.set()`
              for (let i = toImageData.data.length - 1; i >= 0; i--) {
                toImageData.data[i] = result[i];
              }
            }
          }

          this.debug('Draw tile');

          if (NEED_SAFARI_FIX) {
            // Safari draws thin white stripes between tiles without this fix
            toCtx.putImageData(toImageData, tile.toX, tile.toY,
              tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
              tile.toInnerWidth + 1e-5, tile.toInnerHeight + 1e-5);
          } else {
            toCtx.putImageData(toImageData, tile.toX, tile.toY,
              tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
              tile.toInnerWidth, tile.toInnerHeight);
          }

          return null;
        });
    }));


    // Need normalize data source first. It can be canvas or image.
    // If image - try to decode in background if possible
    return Promise.resolve().then(() => {
      if (utils.isCanvas(from)) {
        srcCtx = from.getContext('2d', { alpha: Boolean(opts.alpha) });
        return null;
      }

      if (utils.isImage(from)) {
        // try do decode image in background for faster next operations
        if (!CAN_CREATE_IMAGE_BITMAP) return null;

        this.debug('Decode image via createImageBitmap');

        return createImageBitmap(from)
          .then(imageBitmap => {
            srcImageBitmap = imageBitmap;
          });
      }

      throw new Error('".from" should be image or canvas');
    })
    .then(() => {
      if (canceled) return cancelToken;

      this.debug('Calculate tiles');

      //
      // Here we are with "normalized" source,
      // follow to tiling
      //

      let DEST_TILE_BORDER = 3; // Max possible filter window size

      let regions = tiler({
        width:        opts.width,
        height:       opts.height,
        srcTileSize:  this.options.tile,
        toWidth:      opts.toWidth,
        toHeight:     opts.toHeigth,
        destTileBorder: Math.ceil(Math.max(DEST_TILE_BORDER, 2.5 * opts.unsharpRadius|0))
      });

      let jobs = regions.map(tile => processTile(tile));

      function cleanup() {
        if (srcImageBitmap) {
          srcImageBitmap.close();
          srcImageBitmap = null;
        }
      }

      this.debug('Process tiles');

      return Promise.all(jobs).then(
        () =>  {
          this.debug('Finished!');
          cleanup(); return to;
        },
        err => { cleanup(); throw err; }
      );
    });
  });
};

// RGBA buffer resize
//
Pica.prototype.resizeBuffer = function (options) {
  const opts = objectAssign(DEFAULT_RESIZE_OPTS, options);

  return this.init()
    .then(() => this.__mathlib.resizeAndUnsharp(opts));
};


Pica.prototype.toBlob = function (canvas, mimeType, quality) {
  mimeType = mimeType || 'image/png';

  return new Promise(resolve => {
    if (canvas.toBlob) {
      canvas.toBlob(blob => resolve(blob), mimeType, quality);
      return;
    }

    // Fallback for old browsers
    const asString = atob(canvas.toDataURL(mimeType, quality).split(',')[1]);
    const len      = asString.length;
    const asBuffer = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      asBuffer[i] = asString.charCodeAt(i);
    }

    resolve(new Blob([ asBuffer ], { type: mimeType }));
  });
};


Pica.prototype.debug = function () {};


var pica$1 = Pica;

function iota(n) {
  var result = new Array(n);
  for(var i=0; i<n; ++i) {
    result[i] = i;
  }
  return result
}

var iota_1 = iota;

/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

var isBuffer = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
};

var hasTypedArrays  = ((typeof Float64Array) !== "undefined");

function compare1st(a, b) {
  return a[0] - b[0]
}

function order() {
  var stride = this.stride;
  var terms = new Array(stride.length);
  var i;
  for(i=0; i<terms.length; ++i) {
    terms[i] = [Math.abs(stride[i]), i];
  }
  terms.sort(compare1st);
  var result = new Array(terms.length);
  for(i=0; i<result.length; ++i) {
    result[i] = terms[i][1];
  }
  return result
}

function compileConstructor(dtype, dimension) {
  var className = ["View", dimension, "d", dtype].join("");
  if(dimension < 0) {
    className = "View_Nil" + dtype;
  }
  var useGetters = (dtype === "generic");

  if(dimension === -1) {
    //Special case for trivial arrays
    var code =
      "function "+className+"(a){this.data=a;};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return -1};\
proto.size=0;\
proto.dimension=-1;\
proto.shape=proto.stride=proto.order=[];\
proto.lo=proto.hi=proto.transpose=proto.step=\
function(){return new "+className+"(this.data);};\
proto.get=proto.set=function(){};\
proto.pick=function(){return null};\
return function construct_"+className+"(a){return new "+className+"(a);}";
    var procedure = new Function(code);
    return procedure()
  } else if(dimension === 0) {
    //Special case for 0d arrays
    var code =
      "function "+className+"(a,d) {\
this.data = a;\
this.offset = d\
};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return this.offset};\
proto.dimension=0;\
proto.size=1;\
proto.shape=\
proto.stride=\
proto.order=[];\
proto.lo=\
proto.hi=\
proto.transpose=\
proto.step=function "+className+"_copy() {\
return new "+className+"(this.data,this.offset)\
};\
proto.pick=function "+className+"_pick(){\
return TrivialArray(this.data);\
};\
proto.valueOf=proto.get=function "+className+"_get(){\
return "+(useGetters ? "this.data.get(this.offset)" : "this.data[this.offset]")+
"};\
proto.set=function "+className+"_set(v){\
return "+(useGetters ? "this.data.set(this.offset,v)" : "this.data[this.offset]=v")+"\
};\
return function construct_"+className+"(a,b,c,d){return new "+className+"(a,d)}";
    var procedure = new Function("TrivialArray", code);
    return procedure(CACHED_CONSTRUCTORS[dtype][0])
  }

  var code = ["'use strict'"];

  //Create constructor for view
  var indices = iota_1(dimension);
  var args = indices.map(function(i) { return "i"+i });
  var index_str = "this.offset+" + indices.map(function(i) {
        return "this.stride[" + i + "]*i" + i
      }).join("+");
  var shapeArg = indices.map(function(i) {
      return "b"+i
    }).join(",");
  var strideArg = indices.map(function(i) {
      return "c"+i
    }).join(",");
  code.push(
    "function "+className+"(a," + shapeArg + "," + strideArg + ",d){this.data=a",
      "this.shape=[" + shapeArg + "]",
      "this.stride=[" + strideArg + "]",
      "this.offset=d|0}",
    "var proto="+className+".prototype",
    "proto.dtype='"+dtype+"'",
    "proto.dimension="+dimension);

  //view.size:
  code.push("Object.defineProperty(proto,'size',{get:function "+className+"_size(){\
return "+indices.map(function(i) { return "this.shape["+i+"]" }).join("*"),
"}})");

  //view.order:
  if(dimension === 1) {
    code.push("proto.order=[0]");
  } else {
    code.push("Object.defineProperty(proto,'order',{get:");
    if(dimension < 4) {
      code.push("function "+className+"_order(){");
      if(dimension === 2) {
        code.push("return (Math.abs(this.stride[0])>Math.abs(this.stride[1]))?[1,0]:[0,1]}})");
      } else if(dimension === 3) {
        code.push(
"var s0=Math.abs(this.stride[0]),s1=Math.abs(this.stride[1]),s2=Math.abs(this.stride[2]);\
if(s0>s1){\
if(s1>s2){\
return [2,1,0];\
}else if(s0>s2){\
return [1,2,0];\
}else{\
return [1,0,2];\
}\
}else if(s0>s2){\
return [2,0,1];\
}else if(s2>s1){\
return [0,1,2];\
}else{\
return [0,2,1];\
}}})");
      }
    } else {
      code.push("ORDER})");
    }
  }

  //view.set(i0, ..., v):
  code.push(
"proto.set=function "+className+"_set("+args.join(",")+",v){");
  if(useGetters) {
    code.push("return this.data.set("+index_str+",v)}");
  } else {
    code.push("return this.data["+index_str+"]=v}");
  }

  //view.get(i0, ...):
  code.push("proto.get=function "+className+"_get("+args.join(",")+"){");
  if(useGetters) {
    code.push("return this.data.get("+index_str+")}");
  } else {
    code.push("return this.data["+index_str+"]}");
  }

  //view.index:
  code.push(
    "proto.index=function "+className+"_index(", args.join(), "){return "+index_str+"}");

  //view.hi():
  code.push("proto.hi=function "+className+"_hi("+args.join(",")+"){return new "+className+"(this.data,"+
    indices.map(function(i) {
      return ["(typeof i",i,"!=='number'||i",i,"<0)?this.shape[", i, "]:i", i,"|0"].join("")
    }).join(",")+","+
    indices.map(function(i) {
      return "this.stride["+i + "]"
    }).join(",")+",this.offset)}");

  //view.lo():
  var a_vars = indices.map(function(i) { return "a"+i+"=this.shape["+i+"]" });
  var c_vars = indices.map(function(i) { return "c"+i+"=this.stride["+i+"]" });
  code.push("proto.lo=function "+className+"_lo("+args.join(",")+"){var b=this.offset,d=0,"+a_vars.join(",")+","+c_vars.join(","));
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'&&i"+i+">=0){\
d=i"+i+"|0;\
b+=c"+i+"*d;\
a"+i+"-=d}");
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a"+i
    }).join(",")+","+
    indices.map(function(i) {
      return "c"+i
    }).join(",")+",b)}");

  //view.step():
  code.push("proto.step=function "+className+"_step("+args.join(",")+"){var "+
    indices.map(function(i) {
      return "a"+i+"=this.shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "b"+i+"=this.stride["+i+"]"
    }).join(",")+",c=this.offset,d=0,ceil=Math.ceil");
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'){\
d=i"+i+"|0;\
if(d<0){\
c+=b"+i+"*(a"+i+"-1);\
a"+i+"=ceil(-a"+i+"/d)\
}else{\
a"+i+"=ceil(a"+i+"/d)\
}\
b"+i+"*=d\
}");
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a" + i
    }).join(",")+","+
    indices.map(function(i) {
      return "b" + i
    }).join(",")+",c)}");

  //view.transpose():
  var tShape = new Array(dimension);
  var tStride = new Array(dimension);
  for(var i=0; i<dimension; ++i) {
    tShape[i] = "a[i"+i+"]";
    tStride[i] = "b[i"+i+"]";
  }
  code.push("proto.transpose=function "+className+"_transpose("+args+"){"+
    args.map(function(n,idx) { return n + "=(" + n + "===undefined?" + idx + ":" + n + "|0)"}).join(";"),
    "var a=this.shape,b=this.stride;return new "+className+"(this.data,"+tShape.join(",")+","+tStride.join(",")+",this.offset)}");

  //view.pick():
  code.push("proto.pick=function "+className+"_pick("+args+"){var a=[],b=[],c=this.offset");
  for(var i=0; i<dimension; ++i) {
    code.push("if(typeof i"+i+"==='number'&&i"+i+">=0){c=(c+this.stride["+i+"]*i"+i+")|0}else{a.push(this.shape["+i+"]);b.push(this.stride["+i+"])}");
  }
  code.push("var ctor=CTOR_LIST[a.length+1];return ctor(this.data,a,b,c)}");

  //Add return statement
  code.push("return function construct_"+className+"(data,shape,stride,offset){return new "+className+"(data,"+
    indices.map(function(i) {
      return "shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "stride["+i+"]"
    }).join(",")+",offset)}");

  //Compile procedure
  var procedure = new Function("CTOR_LIST", "ORDER", code.join("\n"));
  return procedure(CACHED_CONSTRUCTORS[dtype], order)
}

function arrayDType(data) {
  if(isBuffer(data)) {
    return "buffer"
  }
  if(hasTypedArrays) {
    switch(Object.prototype.toString.call(data)) {
      case "[object Float64Array]":
        return "float64"
      case "[object Float32Array]":
        return "float32"
      case "[object Int8Array]":
        return "int8"
      case "[object Int16Array]":
        return "int16"
      case "[object Int32Array]":
        return "int32"
      case "[object Uint8Array]":
        return "uint8"
      case "[object Uint16Array]":
        return "uint16"
      case "[object Uint32Array]":
        return "uint32"
      case "[object Uint8ClampedArray]":
        return "uint8_clamped"
    }
  }
  if(Array.isArray(data)) {
    return "array"
  }
  return "generic"
}

var CACHED_CONSTRUCTORS = {
  "float32":[],
  "float64":[],
  "int8":[],
  "int16":[],
  "int32":[],
  "uint8":[],
  "uint16":[],
  "uint32":[],
  "array":[],
  "uint8_clamped":[],
  "buffer":[],
  "generic":[]
};function wrappedNDArrayCtor(data, shape, stride, offset) {
  if(data === undefined) {
    var ctor = CACHED_CONSTRUCTORS.array[0];
    return ctor([])
  } else if(typeof data === "number") {
    data = [data];
  }
  if(shape === undefined) {
    shape = [ data.length ];
  }
  var d = shape.length;
  if(stride === undefined) {
    stride = new Array(d);
    for(var i=d-1, sz=1; i>=0; --i) {
      stride[i] = sz;
      sz *= shape[i];
    }
  }
  if(offset === undefined) {
    offset = 0;
    for(var i=0; i<d; ++i) {
      if(stride[i] < 0) {
        offset -= (shape[i]-1)*stride[i];
      }
    }
  }
  var dtype = arrayDType(data);
  var ctor_list = CACHED_CONSTRUCTORS[dtype];
  while(ctor_list.length <= d+1) {
    ctor_list.push(compileConstructor(dtype, ctor_list.length-1));
  }
  var ctor = ctor_list[d+1];
  return ctor(data, shape, stride, offset)
}

var ndarray = wrappedNDArrayCtor;

function unique_pred(list, compare) {
  var ptr = 1
    , len = list.length
    , a=list[0], b=list[0];
  for(var i=1; i<len; ++i) {
    b = a;
    a = list[i];
    if(compare(a, b)) {
      if(i === ptr) {
        ptr++;
        continue
      }
      list[ptr++] = a;
    }
  }
  list.length = ptr;
  return list
}

function unique_eq(list) {
  var ptr = 1
    , len = list.length
    , a=list[0], b = list[0];
  for(var i=1; i<len; ++i, b=a) {
    b = a;
    a = list[i];
    if(a !== b) {
      if(i === ptr) {
        ptr++;
        continue
      }
      list[ptr++] = a;
    }
  }
  list.length = ptr;
  return list
}

function unique(list, compare, sorted) {
  if(list.length === 0) {
    return list
  }
  if(compare) {
    if(!sorted) {
      list.sort(compare);
    }
    return unique_pred(list, compare)
  }
  if(!sorted) {
    list.sort();
  }
  return unique_eq(list)
}

var uniq = unique;

// This function generates very simple loops analogous to how you typically traverse arrays (the outermost loop corresponds to the slowest changing index, the innermost loop to the fastest changing index)
// TODO: If two arrays have the same strides (and offsets) there is potential for decreasing the number of "pointers" and related variables. The drawback is that the type signature would become more specific and that there would thus be less potential for caching, but it might still be worth it, especially when dealing with large numbers of arguments.
function innerFill(order, proc, body) {
  var dimension = order.length
    , nargs = proc.arrayArgs.length
    , has_index = proc.indexArgs.length>0
    , code = []
    , vars = []
    , idx=0, pidx=0, i, j;
  for(i=0; i<dimension; ++i) { // Iteration variables
    vars.push(["i",i,"=0"].join(""));
  }
  //Compute scan deltas
  for(j=0; j<nargs; ++j) {
    for(i=0; i<dimension; ++i) {
      pidx = idx;
      idx = order[i];
      if(i === 0) { // The innermost/fastest dimension's delta is simply its stride
        vars.push(["d",j,"s",i,"=t",j,"p",idx].join(""));
      } else { // For other dimensions the delta is basically the stride minus something which essentially "rewinds" the previous (more inner) dimension
        vars.push(["d",j,"s",i,"=(t",j,"p",idx,"-s",pidx,"*t",j,"p",pidx,")"].join(""));
      }
    }
  }
  if (vars.length > 0) {
    code.push("var " + vars.join(","));
  }  
  //Scan loop
  for(i=dimension-1; i>=0; --i) { // Start at largest stride and work your way inwards
    idx = order[i];
    code.push(["for(i",i,"=0;i",i,"<s",idx,";++i",i,"){"].join(""));
  }
  //Push body of inner loop
  code.push(body);
  //Advance scan pointers
  for(i=0; i<dimension; ++i) {
    pidx = idx;
    idx = order[i];
    for(j=0; j<nargs; ++j) {
      code.push(["p",j,"+=d",j,"s",i].join(""));
    }
    if(has_index) {
      if(i > 0) {
        code.push(["index[",pidx,"]-=s",pidx].join(""));
      }
      code.push(["++index[",idx,"]"].join(""));
    }
    code.push("}");
  }
  return code.join("\n")
}

// Generate "outer" loops that loop over blocks of data, applying "inner" loops to the blocks by manipulating the local variables in such a way that the inner loop only "sees" the current block.
// TODO: If this is used, then the previous declaration (done by generateCwiseOp) of s* is essentially unnecessary.
//       I believe the s* are not used elsewhere (in particular, I don't think they're used in the pre/post parts and "shape" is defined independently), so it would be possible to make defining the s* dependent on what loop method is being used.
function outerFill(matched, order, proc, body) {
  var dimension = order.length
    , nargs = proc.arrayArgs.length
    , blockSize = proc.blockSize
    , has_index = proc.indexArgs.length > 0
    , code = [];
  for(var i=0; i<nargs; ++i) {
    code.push(["var offset",i,"=p",i].join(""));
  }
  //Generate loops for unmatched dimensions
  // The order in which these dimensions are traversed is fairly arbitrary (from small stride to large stride, for the first argument)
  // TODO: It would be nice if the order in which these loops are placed would also be somehow "optimal" (at the very least we should check that it really doesn't hurt us if they're not).
  for(var i=matched; i<dimension; ++i) {
    code.push(["for(var j"+i+"=SS[", order[i], "]|0;j", i, ">0;){"].join("")); // Iterate back to front
    code.push(["if(j",i,"<",blockSize,"){"].join("")); // Either decrease j by blockSize (s = blockSize), or set it to zero (after setting s = j).
    code.push(["s",order[i],"=j",i].join(""));
    code.push(["j",i,"=0"].join(""));
    code.push(["}else{s",order[i],"=",blockSize].join(""));
    code.push(["j",i,"-=",blockSize,"}"].join(""));
    if(has_index) {
      code.push(["index[",order[i],"]=j",i].join(""));
    }
  }
  for(var i=0; i<nargs; ++i) {
    var indexStr = ["offset"+i];
    for(var j=matched; j<dimension; ++j) {
      indexStr.push(["j",j,"*t",i,"p",order[j]].join(""));
    }
    code.push(["p",i,"=(",indexStr.join("+"),")"].join(""));
  }
  code.push(innerFill(order, proc, body));
  for(var i=matched; i<dimension; ++i) {
    code.push("}");
  }
  return code.join("\n")
}

//Count the number of compatible inner orders
// This is the length of the longest common prefix of the arrays in orders.
// Each array in orders lists the dimensions of the correspond ndarray in order of increasing stride.
// This is thus the maximum number of dimensions that can be efficiently traversed by simple nested loops for all arrays.
function countMatches(orders) {
  var matched = 0, dimension = orders[0].length;
  while(matched < dimension) {
    for(var j=1; j<orders.length; ++j) {
      if(orders[j][matched] !== orders[0][matched]) {
        return matched
      }
    }
    ++matched;
  }
  return matched
}

//Processes a block according to the given data types
// Replaces variable names by different ones, either "local" ones (that are then ferried in and out of the given array) or ones matching the arguments that the function performing the ultimate loop will accept.
function processBlock(block, proc, dtypes) {
  var code = block.body;
  var pre = [];
  var post = [];
  for(var i=0; i<block.args.length; ++i) {
    var carg = block.args[i];
    if(carg.count <= 0) {
      continue
    }
    var re = new RegExp(carg.name, "g");
    var ptrStr = "";
    var arrNum = proc.arrayArgs.indexOf(i);
    switch(proc.argTypes[i]) {
      case "offset":
        var offArgIndex = proc.offsetArgIndex.indexOf(i);
        var offArg = proc.offsetArgs[offArgIndex];
        arrNum = offArg.array;
        ptrStr = "+q" + offArgIndex; // Adds offset to the "pointer" in the array
      case "array":
        ptrStr = "p" + arrNum + ptrStr;
        var localStr = "l" + i;
        var arrStr = "a" + arrNum;
        if (proc.arrayBlockIndices[arrNum] === 0) { // Argument to body is just a single value from this array
          if(carg.count === 1) { // Argument/array used only once(?)
            if(dtypes[arrNum] === "generic") {
              if(carg.lvalue) {
                pre.push(["var ", localStr, "=", arrStr, ".get(", ptrStr, ")"].join("")); // Is this necessary if the argument is ONLY used as an lvalue? (keep in mind that we can have a += something, so we would actually need to check carg.rvalue)
                code = code.replace(re, localStr);
                post.push([arrStr, ".set(", ptrStr, ",", localStr,")"].join(""));
              } else {
                code = code.replace(re, [arrStr, ".get(", ptrStr, ")"].join(""));
              }
            } else {
              code = code.replace(re, [arrStr, "[", ptrStr, "]"].join(""));
            }
          } else if(dtypes[arrNum] === "generic") {
            pre.push(["var ", localStr, "=", arrStr, ".get(", ptrStr, ")"].join("")); // TODO: Could we optimize by checking for carg.rvalue?
            code = code.replace(re, localStr);
            if(carg.lvalue) {
              post.push([arrStr, ".set(", ptrStr, ",", localStr,")"].join(""));
            }
          } else {
            pre.push(["var ", localStr, "=", arrStr, "[", ptrStr, "]"].join("")); // TODO: Could we optimize by checking for carg.rvalue?
            code = code.replace(re, localStr);
            if(carg.lvalue) {
              post.push([arrStr, "[", ptrStr, "]=", localStr].join(""));
            }
          }
        } else { // Argument to body is a "block"
          var reStrArr = [carg.name], ptrStrArr = [ptrStr];
          for(var j=0; j<Math.abs(proc.arrayBlockIndices[arrNum]); j++) {
            reStrArr.push("\\s*\\[([^\\]]+)\\]");
            ptrStrArr.push("$" + (j+1) + "*t" + arrNum + "b" + j); // Matched index times stride
          }
          re = new RegExp(reStrArr.join(""), "g");
          ptrStr = ptrStrArr.join("+");
          if(dtypes[arrNum] === "generic") {
            /*if(carg.lvalue) {
              pre.push(["var ", localStr, "=", arrStr, ".get(", ptrStr, ")"].join("")) // Is this necessary if the argument is ONLY used as an lvalue? (keep in mind that we can have a += something, so we would actually need to check carg.rvalue)
              code = code.replace(re, localStr)
              post.push([arrStr, ".set(", ptrStr, ",", localStr,")"].join(""))
            } else {
              code = code.replace(re, [arrStr, ".get(", ptrStr, ")"].join(""))
            }*/
            throw new Error("cwise: Generic arrays not supported in combination with blocks!")
          } else {
            // This does not produce any local variables, even if variables are used multiple times. It would be possible to do so, but it would complicate things quite a bit.
            code = code.replace(re, [arrStr, "[", ptrStr, "]"].join(""));
          }
        }
      break
      case "scalar":
        code = code.replace(re, "Y" + proc.scalarArgs.indexOf(i));
      break
      case "index":
        code = code.replace(re, "index");
      break
      case "shape":
        code = code.replace(re, "shape");
      break
    }
  }
  return [pre.join("\n"), code, post.join("\n")].join("\n").trim()
}

function typeSummary(dtypes) {
  var summary = new Array(dtypes.length);
  var allEqual = true;
  for(var i=0; i<dtypes.length; ++i) {
    var t = dtypes[i];
    var digits = t.match(/\d+/);
    if(!digits) {
      digits = "";
    } else {
      digits = digits[0];
    }
    if(t.charAt(0) === 0) {
      summary[i] = "u" + t.charAt(1) + digits;
    } else {
      summary[i] = t.charAt(0) + digits;
    }
    if(i > 0) {
      allEqual = allEqual && summary[i] === summary[i-1];
    }
  }
  if(allEqual) {
    return summary[0]
  }
  return summary.join("")
}

//Generates a cwise operator
function generateCWiseOp(proc, typesig) {

  //Compute dimension
  // Arrays get put first in typesig, and there are two entries per array (dtype and order), so this gets the number of dimensions in the first array arg.
  var dimension = (typesig[1].length - Math.abs(proc.arrayBlockIndices[0]))|0;
  var orders = new Array(proc.arrayArgs.length);
  var dtypes = new Array(proc.arrayArgs.length);
  for(var i=0; i<proc.arrayArgs.length; ++i) {
    dtypes[i] = typesig[2*i];
    orders[i] = typesig[2*i+1];
  }
  
  //Determine where block and loop indices start and end
  var blockBegin = [], blockEnd = []; // These indices are exposed as blocks
  var loopBegin = [], loopEnd = []; // These indices are iterated over
  var loopOrders = []; // orders restricted to the loop indices
  for(var i=0; i<proc.arrayArgs.length; ++i) {
    if (proc.arrayBlockIndices[i]<0) {
      loopBegin.push(0);
      loopEnd.push(dimension);
      blockBegin.push(dimension);
      blockEnd.push(dimension+proc.arrayBlockIndices[i]);
    } else {
      loopBegin.push(proc.arrayBlockIndices[i]); // Non-negative
      loopEnd.push(proc.arrayBlockIndices[i]+dimension);
      blockBegin.push(0);
      blockEnd.push(proc.arrayBlockIndices[i]);
    }
    var newOrder = [];
    for(var j=0; j<orders[i].length; j++) {
      if (loopBegin[i]<=orders[i][j] && orders[i][j]<loopEnd[i]) {
        newOrder.push(orders[i][j]-loopBegin[i]); // If this is a loop index, put it in newOrder, subtracting loopBegin, to make sure that all loopOrders are using a common set of indices.
      }
    }
    loopOrders.push(newOrder);
  }

  //First create arguments for procedure
  var arglist = ["SS"]; // SS is the overall shape over which we iterate
  var code = ["'use strict'"];
  var vars = [];
  
  for(var j=0; j<dimension; ++j) {
    vars.push(["s", j, "=SS[", j, "]"].join("")); // The limits for each dimension.
  }
  for(var i=0; i<proc.arrayArgs.length; ++i) {
    arglist.push("a"+i); // Actual data array
    arglist.push("t"+i); // Strides
    arglist.push("p"+i); // Offset in the array at which the data starts (also used for iterating over the data)
    
    for(var j=0; j<dimension; ++j) { // Unpack the strides into vars for looping
      vars.push(["t",i,"p",j,"=t",i,"[",loopBegin[i]+j,"]"].join(""));
    }
    
    for(var j=0; j<Math.abs(proc.arrayBlockIndices[i]); ++j) { // Unpack the strides into vars for block iteration
      vars.push(["t",i,"b",j,"=t",i,"[",blockBegin[i]+j,"]"].join(""));
    }
  }
  for(var i=0; i<proc.scalarArgs.length; ++i) {
    arglist.push("Y" + i);
  }
  if(proc.shapeArgs.length > 0) {
    vars.push("shape=SS.slice(0)"); // Makes the shape over which we iterate available to the user defined functions (so you can use width/height for example)
  }
  if(proc.indexArgs.length > 0) {
    // Prepare an array to keep track of the (logical) indices, initialized to dimension zeroes.
    var zeros = new Array(dimension);
    for(var i=0; i<dimension; ++i) {
      zeros[i] = "0";
    }
    vars.push(["index=[", zeros.join(","), "]"].join(""));
  }
  for(var i=0; i<proc.offsetArgs.length; ++i) { // Offset arguments used for stencil operations
    var off_arg = proc.offsetArgs[i];
    var init_string = [];
    for(var j=0; j<off_arg.offset.length; ++j) {
      if(off_arg.offset[j] === 0) {
        continue
      } else if(off_arg.offset[j] === 1) {
        init_string.push(["t", off_arg.array, "p", j].join(""));      
      } else {
        init_string.push([off_arg.offset[j], "*t", off_arg.array, "p", j].join(""));
      }
    }
    if(init_string.length === 0) {
      vars.push("q" + i + "=0");
    } else {
      vars.push(["q", i, "=", init_string.join("+")].join(""));
    }
  }

  //Prepare this variables
  var thisVars = uniq([].concat(proc.pre.thisVars)
                      .concat(proc.body.thisVars)
                      .concat(proc.post.thisVars));
  vars = vars.concat(thisVars);
  if (vars.length > 0) {
    code.push("var " + vars.join(","));
  }
  for(var i=0; i<proc.arrayArgs.length; ++i) {
    code.push("p"+i+"|=0");
  }
  
  //Inline prelude
  if(proc.pre.body.length > 3) {
    code.push(processBlock(proc.pre, proc, dtypes));
  }

  //Process body
  var body = processBlock(proc.body, proc, dtypes);
  var matched = countMatches(loopOrders);
  if(matched < dimension) {
    code.push(outerFill(matched, loopOrders[0], proc, body)); // TODO: Rather than passing loopOrders[0], it might be interesting to look at passing an order that represents the majority of the arguments for example.
  } else {
    code.push(innerFill(loopOrders[0], proc, body));
  }

  //Inline epilog
  if(proc.post.body.length > 3) {
    code.push(processBlock(proc.post, proc, dtypes));
  }
  
  if(proc.debug) {
    console.log("-----Generated cwise routine for ", typesig, ":\n" + code.join("\n") + "\n----------");
  }
  
  var loopName = [(proc.funcName||"unnamed"), "_cwise_loop_", orders[0].join("s"),"m",matched,typeSummary(dtypes)].join("");
  var f = new Function(["function ",loopName,"(", arglist.join(","),"){", code.join("\n"),"} return ", loopName].join(""));
  return f()
}
var compile = generateCWiseOp;

// The function below is called when constructing a cwise function object, and does the following:
// A function object is constructed which accepts as argument a compilation function and returns another function.
// It is this other function that is eventually returned by createThunk, and this function is the one that actually
// checks whether a certain pattern of arguments has already been used before and compiles new loops as needed.
// The compilation passed to the first function object is used for compiling new functions.
// Once this function object is created, it is called with compile as argument, where the first argument of compile
// is bound to "proc" (essentially containing a preprocessed version of the user arguments to cwise).
// So createThunk roughly works like this:
// function createThunk(proc) {
//   var thunk = function(compileBound) {
//     var CACHED = {}
//     return function(arrays and scalars) {
//       if (dtype and order of arrays in CACHED) {
//         var func = CACHED[dtype and order of arrays]
//       } else {
//         var func = CACHED[dtype and order of arrays] = compileBound(dtype and order of arrays)
//       }
//       return func(arrays and scalars)
//     }
//   }
//   return thunk(compile.bind1(proc))
// }



function createThunk(proc) {
  var code = ["'use strict'", "var CACHED={}"];
  var vars = [];
  var thunkName = proc.funcName + "_cwise_thunk";
  
  //Build thunk
  code.push(["return function ", thunkName, "(", proc.shimArgs.join(","), "){"].join(""));
  var typesig = [];
  var string_typesig = [];
  var proc_args = [["array",proc.arrayArgs[0],".shape.slice(", // Slice shape so that we only retain the shape over which we iterate (which gets passed to the cwise operator as SS).
                    Math.max(0,proc.arrayBlockIndices[0]),proc.arrayBlockIndices[0]<0?(","+proc.arrayBlockIndices[0]+")"):")"].join("")];
  var shapeLengthConditions = [], shapeConditions = [];
  // Process array arguments
  for(var i=0; i<proc.arrayArgs.length; ++i) {
    var j = proc.arrayArgs[i];
    vars.push(["t", j, "=array", j, ".dtype,",
               "r", j, "=array", j, ".order"].join(""));
    typesig.push("t" + j);
    typesig.push("r" + j);
    string_typesig.push("t"+j);
    string_typesig.push("r"+j+".join()");
    proc_args.push("array" + j + ".data");
    proc_args.push("array" + j + ".stride");
    proc_args.push("array" + j + ".offset|0");
    if (i>0) { // Gather conditions to check for shape equality (ignoring block indices)
      shapeLengthConditions.push("array" + proc.arrayArgs[0] + ".shape.length===array" + j + ".shape.length+" + (Math.abs(proc.arrayBlockIndices[0])-Math.abs(proc.arrayBlockIndices[i])));
      shapeConditions.push("array" + proc.arrayArgs[0] + ".shape[shapeIndex+" + Math.max(0,proc.arrayBlockIndices[0]) + "]===array" + j + ".shape[shapeIndex+" + Math.max(0,proc.arrayBlockIndices[i]) + "]");
    }
  }
  // Check for shape equality
  if (proc.arrayArgs.length > 1) {
    code.push("if (!(" + shapeLengthConditions.join(" && ") + ")) throw new Error('cwise: Arrays do not all have the same dimensionality!')");
    code.push("for(var shapeIndex=array" + proc.arrayArgs[0] + ".shape.length-" + Math.abs(proc.arrayBlockIndices[0]) + "; shapeIndex-->0;) {");
    code.push("if (!(" + shapeConditions.join(" && ") + ")) throw new Error('cwise: Arrays do not all have the same shape!')");
    code.push("}");
  }
  // Process scalar arguments
  for(var i=0; i<proc.scalarArgs.length; ++i) {
    proc_args.push("scalar" + proc.scalarArgs[i]);
  }
  // Check for cached function (and if not present, generate it)
  vars.push(["type=[", string_typesig.join(","), "].join()"].join(""));
  vars.push("proc=CACHED[type]");
  code.push("var " + vars.join(","));
  
  code.push(["if(!proc){",
             "CACHED[type]=proc=compile([", typesig.join(","), "])}",
             "return proc(", proc_args.join(","), ")}"].join(""));

  if(proc.debug) {
    console.log("-----Generated thunk:\n" + code.join("\n") + "\n----------");
  }
  
  //Compile thunk
  var thunk = new Function("compile", code.join("\n"));
  return thunk(compile.bind(undefined, proc))
}

var thunk = createThunk;

function Procedure() {
  this.argTypes = [];
  this.shimArgs = [];
  this.arrayArgs = [];
  this.arrayBlockIndices = [];
  this.scalarArgs = [];
  this.offsetArgs = [];
  this.offsetArgIndex = [];
  this.indexArgs = [];
  this.shapeArgs = [];
  this.funcName = "";
  this.pre = null;
  this.body = null;
  this.post = null;
  this.debug = false;
}

function compileCwise(user_args) {
  //Create procedure
  var proc = new Procedure();
  
  //Parse blocks
  proc.pre    = user_args.pre;
  proc.body   = user_args.body;
  proc.post   = user_args.post;

  //Parse arguments
  var proc_args = user_args.args.slice(0);
  proc.argTypes = proc_args;
  for(var i=0; i<proc_args.length; ++i) {
    var arg_type = proc_args[i];
    if(arg_type === "array" || (typeof arg_type === "object" && arg_type.blockIndices)) {
      proc.argTypes[i] = "array";
      proc.arrayArgs.push(i);
      proc.arrayBlockIndices.push(arg_type.blockIndices ? arg_type.blockIndices : 0);
      proc.shimArgs.push("array" + i);
      if(i < proc.pre.args.length && proc.pre.args[i].count>0) {
        throw new Error("cwise: pre() block may not reference array args")
      }
      if(i < proc.post.args.length && proc.post.args[i].count>0) {
        throw new Error("cwise: post() block may not reference array args")
      }
    } else if(arg_type === "scalar") {
      proc.scalarArgs.push(i);
      proc.shimArgs.push("scalar" + i);
    } else if(arg_type === "index") {
      proc.indexArgs.push(i);
      if(i < proc.pre.args.length && proc.pre.args[i].count > 0) {
        throw new Error("cwise: pre() block may not reference array index")
      }
      if(i < proc.body.args.length && proc.body.args[i].lvalue) {
        throw new Error("cwise: body() block may not write to array index")
      }
      if(i < proc.post.args.length && proc.post.args[i].count > 0) {
        throw new Error("cwise: post() block may not reference array index")
      }
    } else if(arg_type === "shape") {
      proc.shapeArgs.push(i);
      if(i < proc.pre.args.length && proc.pre.args[i].lvalue) {
        throw new Error("cwise: pre() block may not write to array shape")
      }
      if(i < proc.body.args.length && proc.body.args[i].lvalue) {
        throw new Error("cwise: body() block may not write to array shape")
      }
      if(i < proc.post.args.length && proc.post.args[i].lvalue) {
        throw new Error("cwise: post() block may not write to array shape")
      }
    } else if(typeof arg_type === "object" && arg_type.offset) {
      proc.argTypes[i] = "offset";
      proc.offsetArgs.push({ array: arg_type.array, offset:arg_type.offset });
      proc.offsetArgIndex.push(i);
    } else {
      throw new Error("cwise: Unknown argument type " + proc_args[i])
    }
  }
  
  //Make sure at least one array argument was specified
  if(proc.arrayArgs.length <= 0) {
    throw new Error("cwise: No array arguments specified")
  }
  
  //Make sure arguments are correct
  if(proc.pre.args.length > proc_args.length) {
    throw new Error("cwise: Too many arguments in pre() block")
  }
  if(proc.body.args.length > proc_args.length) {
    throw new Error("cwise: Too many arguments in body() block")
  }
  if(proc.post.args.length > proc_args.length) {
    throw new Error("cwise: Too many arguments in post() block")
  }

  //Check debug flag
  proc.debug = !!user_args.printCode || !!user_args.debug;
  
  //Retrieve name
  proc.funcName = user_args.funcName || "cwise";
  
  //Read in block size
  proc.blockSize = user_args.blockSize || 64;

  return thunk(proc)
}

var compiler = compileCwise;

var ndarrayOps = createCommonjsModule(function (module, exports) {
var EmptyProc = {
  body: "",
  args: [],
  thisVars: [],
  localVars: []
};

function fixup(x) {
  if(!x) {
    return EmptyProc
  }
  for(var i=0; i<x.args.length; ++i) {
    var a = x.args[i];
    if(i === 0) {
      x.args[i] = {name: a, lvalue:true, rvalue: !!x.rvalue, count:x.count||1 };
    } else {
      x.args[i] = {name: a, lvalue:false, rvalue:true, count: 1};
    }
  }
  if(!x.thisVars) {
    x.thisVars = [];
  }
  if(!x.localVars) {
    x.localVars = [];
  }
  return x
}

function pcompile(user_args) {
  return compiler({
    args:     user_args.args,
    pre:      fixup(user_args.pre),
    body:     fixup(user_args.body),
    post:     fixup(user_args.proc),
    funcName: user_args.funcName
  })
}

function makeOp(user_args) {
  var args = [];
  for(var i=0; i<user_args.args.length; ++i) {
    args.push("a"+i);
  }
  var wrapper = new Function("P", [
    "return function ", user_args.funcName, "_ndarrayops(", args.join(","), ") {P(", args.join(","), ");return a0}"
  ].join(""));
  return wrapper(pcompile(user_args))
}

var assign_ops = {
  add:  "+",
  sub:  "-",
  mul:  "*",
  div:  "/",
  mod:  "%",
  band: "&",
  bor:  "|",
  bxor: "^",
  lshift: "<<",
  rshift: ">>",
  rrshift: ">>>"
};(function(){
  for(var id in assign_ops) {
    var op = assign_ops[id];
    exports[id] = makeOp({
      args: ["array","array","array"],
      body: {args:["a","b","c"],
             body: "a=b"+op+"c"},
      funcName: id
    });
    exports[id+"eq"] = makeOp({
      args: ["array","array"],
      body: {args:["a","b"],
             body:"a"+op+"=b"},
      rvalue: true,
      funcName: id+"eq"
    });
    exports[id+"s"] = makeOp({
      args: ["array", "array", "scalar"],
      body: {args:["a","b","s"],
             body:"a=b"+op+"s"},
      funcName: id+"s"
    });
    exports[id+"seq"] = makeOp({
      args: ["array","scalar"],
      body: {args:["a","s"],
             body:"a"+op+"=s"},
      rvalue: true,
      funcName: id+"seq"
    });
  }
})();

var unary_ops = {
  not: "!",
  bnot: "~",
  neg: "-",
  recip: "1.0/"
};(function(){
  for(var id in unary_ops) {
    var op = unary_ops[id];
    exports[id] = makeOp({
      args: ["array", "array"],
      body: {args:["a","b"],
             body:"a="+op+"b"},
      funcName: id
    });
    exports[id+"eq"] = makeOp({
      args: ["array"],
      body: {args:["a"],
             body:"a="+op+"a"},
      rvalue: true,
      count: 2,
      funcName: id+"eq"
    });
  }
})();

var binary_ops = {
  and: "&&",
  or: "||",
  eq: "===",
  neq: "!==",
  lt: "<",
  gt: ">",
  leq: "<=",
  geq: ">="
};(function() {
  for(var id in binary_ops) {
    var op = binary_ops[id];
    exports[id] = makeOp({
      args: ["array","array","array"],
      body: {args:["a", "b", "c"],
             body:"a=b"+op+"c"},
      funcName: id
    });
    exports[id+"s"] = makeOp({
      args: ["array","array","scalar"],
      body: {args:["a", "b", "s"],
             body:"a=b"+op+"s"},
      funcName: id+"s"
    });
    exports[id+"eq"] = makeOp({
      args: ["array", "array"],
      body: {args:["a", "b"],
             body:"a=a"+op+"b"},
      rvalue:true,
      count:2,
      funcName: id+"eq"
    });
    exports[id+"seq"] = makeOp({
      args: ["array", "scalar"],
      body: {args:["a","s"],
             body:"a=a"+op+"s"},
      rvalue:true,
      count:2,
      funcName: id+"seq"
    });
  }
})();

var math_unary = [
  "abs",
  "acos",
  "asin",
  "atan",
  "ceil",
  "cos",
  "exp",
  "floor",
  "log",
  "round",
  "sin",
  "sqrt",
  "tan"
];(function() {
  for(var i=0; i<math_unary.length; ++i) {
    var f = math_unary[i];
    exports[f] = makeOp({
                    args: ["array", "array"],
                    pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                    body: {args:["a","b"], body:"a=this_f(b)", thisVars:["this_f"]},
                    funcName: f
                  });
    exports[f+"eq"] = makeOp({
                      args: ["array"],
                      pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                      body: {args: ["a"], body:"a=this_f(a)", thisVars:["this_f"]},
                      rvalue: true,
                      count: 2,
                      funcName: f+"eq"
                    });
  }
})();

var math_comm = [
  "max",
  "min",
  "atan2",
  "pow"
];(function(){
  for(var i=0; i<math_comm.length; ++i) {
    var f= math_comm[i];
    exports[f] = makeOp({
                  args:["array", "array", "array"],
                  pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                  body: {args:["a","b","c"], body:"a=this_f(b,c)", thisVars:["this_f"]},
                  funcName: f
                });
    exports[f+"s"] = makeOp({
                  args:["array", "array", "scalar"],
                  pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                  body: {args:["a","b","c"], body:"a=this_f(b,c)", thisVars:["this_f"]},
                  funcName: f+"s"
                  });
    exports[f+"eq"] = makeOp({ args:["array", "array"],
                  pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                  body: {args:["a","b"], body:"a=this_f(a,b)", thisVars:["this_f"]},
                  rvalue: true,
                  count: 2,
                  funcName: f+"eq"
                  });
    exports[f+"seq"] = makeOp({ args:["array", "scalar"],
                  pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                  body: {args:["a","b"], body:"a=this_f(a,b)", thisVars:["this_f"]},
                  rvalue:true,
                  count:2,
                  funcName: f+"seq"
                  });
  }
})();

var math_noncomm = [
  "atan2",
  "pow"
];(function(){
  for(var i=0; i<math_noncomm.length; ++i) {
    var f= math_noncomm[i];
    exports[f+"op"] = makeOp({
                  args:["array", "array", "array"],
                  pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                  body: {args:["a","b","c"], body:"a=this_f(c,b)", thisVars:["this_f"]},
                  funcName: f+"op"
                });
    exports[f+"ops"] = makeOp({
                  args:["array", "array", "scalar"],
                  pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                  body: {args:["a","b","c"], body:"a=this_f(c,b)", thisVars:["this_f"]},
                  funcName: f+"ops"
                  });
    exports[f+"opeq"] = makeOp({ args:["array", "array"],
                  pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                  body: {args:["a","b"], body:"a=this_f(b,a)", thisVars:["this_f"]},
                  rvalue: true,
                  count: 2,
                  funcName: f+"opeq"
                  });
    exports[f+"opseq"] = makeOp({ args:["array", "scalar"],
                  pre: {args:[], body:"this_f=Math."+f, thisVars:["this_f"]},
                  body: {args:["a","b"], body:"a=this_f(b,a)", thisVars:["this_f"]},
                  rvalue:true,
                  count:2,
                  funcName: f+"opseq"
                  });
  }
})();

exports.any = compiler({
  args:["array"],
  pre: EmptyProc,
  body: {args:[{name:"a", lvalue:false, rvalue:true, count:1}], body: "if(a){return true}", localVars: [], thisVars: []},
  post: {args:[], localVars:[], thisVars:[], body:"return false"},
  funcName: "any"
});

exports.all = compiler({
  args:["array"],
  pre: EmptyProc,
  body: {args:[{name:"x", lvalue:false, rvalue:true, count:1}], body: "if(!x){return false}", localVars: [], thisVars: []},
  post: {args:[], localVars:[], thisVars:[], body:"return true"},
  funcName: "all"
});

exports.sum = compiler({
  args:["array"],
  pre: {args:[], localVars:[], thisVars:["this_s"], body:"this_s=0"},
  body: {args:[{name:"a", lvalue:false, rvalue:true, count:1}], body: "this_s+=a", localVars: [], thisVars: ["this_s"]},
  post: {args:[], localVars:[], thisVars:["this_s"], body:"return this_s"},
  funcName: "sum"
});

exports.prod = compiler({
  args:["array"],
  pre: {args:[], localVars:[], thisVars:["this_s"], body:"this_s=1"},
  body: {args:[{name:"a", lvalue:false, rvalue:true, count:1}], body: "this_s*=a", localVars: [], thisVars: ["this_s"]},
  post: {args:[], localVars:[], thisVars:["this_s"], body:"return this_s"},
  funcName: "prod"
});

exports.norm2squared = compiler({
  args:["array"],
  pre: {args:[], localVars:[], thisVars:["this_s"], body:"this_s=0"},
  body: {args:[{name:"a", lvalue:false, rvalue:true, count:2}], body: "this_s+=a*a", localVars: [], thisVars: ["this_s"]},
  post: {args:[], localVars:[], thisVars:["this_s"], body:"return this_s"},
  funcName: "norm2squared"
});
  
exports.norm2 = compiler({
  args:["array"],
  pre: {args:[], localVars:[], thisVars:["this_s"], body:"this_s=0"},
  body: {args:[{name:"a", lvalue:false, rvalue:true, count:2}], body: "this_s+=a*a", localVars: [], thisVars: ["this_s"]},
  post: {args:[], localVars:[], thisVars:["this_s"], body:"return Math.sqrt(this_s)"},
  funcName: "norm2"
});
  

exports.norminf = compiler({
  args:["array"],
  pre: {args:[], localVars:[], thisVars:["this_s"], body:"this_s=0"},
  body: {args:[{name:"a", lvalue:false, rvalue:true, count:4}], body:"if(-a>this_s){this_s=-a}else if(a>this_s){this_s=a}", localVars: [], thisVars: ["this_s"]},
  post: {args:[], localVars:[], thisVars:["this_s"], body:"return this_s"},
  funcName: "norminf"
});

exports.norm1 = compiler({
  args:["array"],
  pre: {args:[], localVars:[], thisVars:["this_s"], body:"this_s=0"},
  body: {args:[{name:"a", lvalue:false, rvalue:true, count:3}], body: "this_s+=a<0?-a:a", localVars: [], thisVars: ["this_s"]},
  post: {args:[], localVars:[], thisVars:["this_s"], body:"return this_s"},
  funcName: "norm1"
});

exports.sup = compiler({
  args: [ "array" ],
  pre:
   { body: "this_h=-Infinity",
     args: [],
     thisVars: [ "this_h" ],
     localVars: [] },
  body:
   { body: "if(_inline_1_arg0_>this_h)this_h=_inline_1_arg0_",
     args: [{"name":"_inline_1_arg0_","lvalue":false,"rvalue":true,"count":2} ],
     thisVars: [ "this_h" ],
     localVars: [] },
  post:
   { body: "return this_h",
     args: [],
     thisVars: [ "this_h" ],
     localVars: [] }
 });

exports.inf = compiler({
  args: [ "array" ],
  pre:
   { body: "this_h=Infinity",
     args: [],
     thisVars: [ "this_h" ],
     localVars: [] },
  body:
   { body: "if(_inline_1_arg0_<this_h)this_h=_inline_1_arg0_",
     args: [{"name":"_inline_1_arg0_","lvalue":false,"rvalue":true,"count":2} ],
     thisVars: [ "this_h" ],
     localVars: [] },
  post:
   { body: "return this_h",
     args: [],
     thisVars: [ "this_h" ],
     localVars: [] }
 });

exports.argmin = compiler({
  args:["index","array","shape"],
  pre:{
    body:"{this_v=Infinity;this_i=_inline_0_arg2_.slice(0)}",
    args:[
      {name:"_inline_0_arg0_",lvalue:false,rvalue:false,count:0},
      {name:"_inline_0_arg1_",lvalue:false,rvalue:false,count:0},
      {name:"_inline_0_arg2_",lvalue:false,rvalue:true,count:1}
      ],
    thisVars:["this_i","this_v"],
    localVars:[]},
  body:{
    body:"{if(_inline_1_arg1_<this_v){this_v=_inline_1_arg1_;for(var _inline_1_k=0;_inline_1_k<_inline_1_arg0_.length;++_inline_1_k){this_i[_inline_1_k]=_inline_1_arg0_[_inline_1_k]}}}",
    args:[
      {name:"_inline_1_arg0_",lvalue:false,rvalue:true,count:2},
      {name:"_inline_1_arg1_",lvalue:false,rvalue:true,count:2}],
    thisVars:["this_i","this_v"],
    localVars:["_inline_1_k"]},
  post:{
    body:"{return this_i}",
    args:[],
    thisVars:["this_i"],
    localVars:[]}
});

exports.argmax = compiler({
  args:["index","array","shape"],
  pre:{
    body:"{this_v=-Infinity;this_i=_inline_0_arg2_.slice(0)}",
    args:[
      {name:"_inline_0_arg0_",lvalue:false,rvalue:false,count:0},
      {name:"_inline_0_arg1_",lvalue:false,rvalue:false,count:0},
      {name:"_inline_0_arg2_",lvalue:false,rvalue:true,count:1}
      ],
    thisVars:["this_i","this_v"],
    localVars:[]},
  body:{
    body:"{if(_inline_1_arg1_>this_v){this_v=_inline_1_arg1_;for(var _inline_1_k=0;_inline_1_k<_inline_1_arg0_.length;++_inline_1_k){this_i[_inline_1_k]=_inline_1_arg0_[_inline_1_k]}}}",
    args:[
      {name:"_inline_1_arg0_",lvalue:false,rvalue:true,count:2},
      {name:"_inline_1_arg1_",lvalue:false,rvalue:true,count:2}],
    thisVars:["this_i","this_v"],
    localVars:["_inline_1_k"]},
  post:{
    body:"{return this_i}",
    args:[],
    thisVars:["this_i"],
    localVars:[]}
});  

exports.random = makeOp({
  args: ["array"],
  pre: {args:[], body:"this_f=Math.random", thisVars:["this_f"]},
  body: {args: ["a"], body:"a=this_f()", thisVars:["this_f"]},
  funcName: "random"
});

exports.assign = makeOp({
  args:["array", "array"],
  body: {args:["a", "b"], body:"a=b"},
  funcName: "assign" });

exports.assigns = makeOp({
  args:["array", "scalar"],
  body: {args:["a", "b"], body:"a=b"},
  funcName: "assigns" });


exports.equals = compiler({
  args:["array", "array"],
  pre: EmptyProc,
  body: {args:[{name:"x", lvalue:false, rvalue:true, count:1},
               {name:"y", lvalue:false, rvalue:true, count:1}], 
        body: "if(x!==y){return false}", 
        localVars: [], 
        thisVars: []},
  post: {args:[], localVars:[], thisVars:[], body:"return true"},
  funcName: "equals"
});
});

var ndarrayOps_1 = ndarrayOps.any;
var ndarrayOps_2 = ndarrayOps.all;
var ndarrayOps_3 = ndarrayOps.sum;
var ndarrayOps_4 = ndarrayOps.prod;
var ndarrayOps_5 = ndarrayOps.norm2squared;
var ndarrayOps_6 = ndarrayOps.norm2;
var ndarrayOps_7 = ndarrayOps.norminf;
var ndarrayOps_8 = ndarrayOps.norm1;
var ndarrayOps_9 = ndarrayOps.sup;
var ndarrayOps_10 = ndarrayOps.inf;
var ndarrayOps_11 = ndarrayOps.argmin;
var ndarrayOps_12 = ndarrayOps.argmax;
var ndarrayOps_13 = ndarrayOps.random;
var ndarrayOps_14 = ndarrayOps.assign;
var ndarrayOps_15 = ndarrayOps.assigns;
var ndarrayOps_16 = ndarrayOps.equals;

/**
 * Bit twiddling hacks for JavaScript.
 *
 * Author: Mikola Lysenko
 *
 * Ported from Stanford bit twiddling hack library:
 *    http://graphics.stanford.edu/~seander/bithacks.html
 */

//Number of bits in an integer
var INT_BITS = 32;

//Constants
var INT_BITS_1  = INT_BITS;
var INT_MAX   =  0x7fffffff;
var INT_MIN   = -1<<(INT_BITS-1);

//Returns -1, 0, +1 depending on sign of x
var sign = function(v) {
  return (v > 0) - (v < 0);
};

//Computes absolute value of integer
var abs = function(v) {
  var mask = v >> (INT_BITS-1);
  return (v ^ mask) - mask;
};

//Computes minimum of integers x and y
var min = function(x, y) {
  return y ^ ((x ^ y) & -(x < y));
};

//Computes maximum of integers x and y
var max = function(x, y) {
  return x ^ ((x ^ y) & -(x < y));
};

//Checks if a number is a power of two
var isPow2 = function(v) {
  return !(v & (v-1)) && (!!v);
};

//Computes log base 2 of v
var log2 = function(v) {
  var r, shift;
  r =     (v > 0xFFFF) << 4; v >>>= r;
  shift = (v > 0xFF  ) << 3; v >>>= shift; r |= shift;
  shift = (v > 0xF   ) << 2; v >>>= shift; r |= shift;
  shift = (v > 0x3   ) << 1; v >>>= shift; r |= shift;
  return r | (v >> 1);
};

//Computes log base 10 of v
var log10 = function(v) {
  return  (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
          (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
          (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
};

//Counts number of bits
var popCount = function(v) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
};

//Counts number of trailing zeros
function countTrailingZeros(v) {
  var c = 32;
  v &= -v;
  if (v) c--;
  if (v & 0x0000FFFF) c -= 16;
  if (v & 0x00FF00FF) c -= 8;
  if (v & 0x0F0F0F0F) c -= 4;
  if (v & 0x33333333) c -= 2;
  if (v & 0x55555555) c -= 1;
  return c;
}
var countTrailingZeros_1 = countTrailingZeros;

//Rounds to next power of 2
var nextPow2 = function(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
};

//Rounds down to previous power of 2
var prevPow2 = function(v) {
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v - (v>>>1);
};

//Computes parity of word
var parity = function(v) {
  v ^= v >>> 16;
  v ^= v >>> 8;
  v ^= v >>> 4;
  v &= 0xf;
  return (0x6996 >>> v) & 1;
};

var REVERSE_TABLE = new Array(256);

(function(tab) {
  for(var i=0; i<256; ++i) {
    var v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
      r <<= 1;
      r |= v & 1;
      --s;
    }
    tab[i] = (r << s) & 0xff;
  }
})(REVERSE_TABLE);

//Reverse bits in a 32 bit word
var reverse = function(v) {
  return  (REVERSE_TABLE[ v         & 0xff] << 24) |
          (REVERSE_TABLE[(v >>> 8)  & 0xff] << 16) |
          (REVERSE_TABLE[(v >>> 16) & 0xff] << 8)  |
           REVERSE_TABLE[(v >>> 24) & 0xff];
};

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
var interleave2 = function(x, y) {
  x &= 0xFFFF;
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y &= 0xFFFF;
  y = (y | (y << 8)) & 0x00FF00FF;
  y = (y | (y << 4)) & 0x0F0F0F0F;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
};

//Extracts the nth interleaved component
var deinterleave2 = function(v, n) {
  v = (v >>> n) & 0x55555555;
  v = (v | (v >>> 1))  & 0x33333333;
  v = (v | (v >>> 2))  & 0x0F0F0F0F;
  v = (v | (v >>> 4))  & 0x00FF00FF;
  v = (v | (v >>> 16)) & 0x000FFFF;
  return (v << 16) >> 16;
};


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
var interleave3 = function(x, y, z) {
  x &= 0x3FF;
  x  = (x | (x<<16)) & 4278190335;
  x  = (x | (x<<8))  & 251719695;
  x  = (x | (x<<4))  & 3272356035;
  x  = (x | (x<<2))  & 1227133513;

  y &= 0x3FF;
  y  = (y | (y<<16)) & 4278190335;
  y  = (y | (y<<8))  & 251719695;
  y  = (y | (y<<4))  & 3272356035;
  y  = (y | (y<<2))  & 1227133513;
  x |= (y << 1);
  
  z &= 0x3FF;
  z  = (z | (z<<16)) & 4278190335;
  z  = (z | (z<<8))  & 251719695;
  z  = (z | (z<<4))  & 3272356035;
  z  = (z | (z<<2))  & 1227133513;
  
  return x | (z << 2);
};

//Extracts nth interleaved component of a 3-tuple
var deinterleave3 = function(v, n) {
  v = (v >>> n)       & 1227133513;
  v = (v | (v>>>2))   & 3272356035;
  v = (v | (v>>>4))   & 251719695;
  v = (v | (v>>>8))   & 4278190335;
  v = (v | (v>>>16))  & 0x3FF;
  return (v<<22)>>22;
};

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
var nextCombination = function(v) {
  var t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
};

var twiddle = {
	INT_BITS: INT_BITS_1,
	INT_MAX: INT_MAX,
	INT_MIN: INT_MIN,
	sign: sign,
	abs: abs,
	min: min,
	max: max,
	isPow2: isPow2,
	log2: log2,
	log10: log10,
	popCount: popCount,
	countTrailingZeros: countTrailingZeros_1,
	nextPow2: nextPow2,
	prevPow2: prevPow2,
	parity: parity,
	reverse: reverse,
	interleave2: interleave2,
	deinterleave2: deinterleave2,
	interleave3: interleave3,
	deinterleave3: deinterleave3,
	nextCombination: nextCombination
};

function dupe_array(count, value, i) {
  var c = count[i]|0;
  if(c <= 0) {
    return []
  }
  var result = new Array(c), j;
  if(i === count.length-1) {
    for(j=0; j<c; ++j) {
      result[j] = value;
    }
  } else {
    for(j=0; j<c; ++j) {
      result[j] = dupe_array(count, value, i+1);
    }
  }
  return result
}

function dupe_number(count, value) {
  var result, i;
  result = new Array(count);
  for(i=0; i<count; ++i) {
    result[i] = value;
  }
  return result
}

function dupe(count, value) {
  if(typeof value === "undefined") {
    value = 0;
  }
  switch(typeof count) {
    case "number":
      if(count > 0) {
        return dupe_number(count|0, value)
      }
    break
    case "object":
      if(typeof (count.length) === "number") {
        return dupe_array(count, value, 0)
      }
    break
  }
  return []
}

var dup = dupe;

var pool$2 = createCommonjsModule(function (module, exports) {
if(!commonjsGlobal.__TYPEDARRAY_POOL) {
  commonjsGlobal.__TYPEDARRAY_POOL = {
      UINT8   : dup([32, 0])
    , UINT16  : dup([32, 0])
    , UINT32  : dup([32, 0])
    , INT8    : dup([32, 0])
    , INT16   : dup([32, 0])
    , INT32   : dup([32, 0])
    , FLOAT   : dup([32, 0])
    , DOUBLE  : dup([32, 0])
    , DATA    : dup([32, 0])
    , UINT8C  : dup([32, 0])
    , BUFFER  : dup([32, 0])
  };
}

var hasUint8C = (typeof Uint8ClampedArray) !== 'undefined';
var POOL = commonjsGlobal.__TYPEDARRAY_POOL;

//Upgrade pool
if(!POOL.UINT8C) {
  POOL.UINT8C = dup([32, 0]);
}
if(!POOL.BUFFER) {
  POOL.BUFFER = dup([32, 0]);
}

//New technique: Only allocate from ArrayBufferView and Buffer
var DATA    = POOL.DATA
  , BUFFER  = POOL.BUFFER;

exports.free = function free(array) {
  if(Buffer.isBuffer(array)) {
    BUFFER[twiddle.log2(array.length)].push(array);
  } else {
    if(Object.prototype.toString.call(array) !== '[object ArrayBuffer]') {
      array = array.buffer;
    }
    if(!array) {
      return
    }
    var n = array.length || array.byteLength;
    var log_n = twiddle.log2(n)|0;
    DATA[log_n].push(array);
  }
};

function freeArrayBuffer(buffer) {
  if(!buffer) {
    return
  }
  var n = buffer.length || buffer.byteLength;
  var log_n = twiddle.log2(n);
  DATA[log_n].push(buffer);
}

function freeTypedArray(array) {
  freeArrayBuffer(array.buffer);
}

exports.freeUint8 =
exports.freeUint16 =
exports.freeUint32 =
exports.freeInt8 =
exports.freeInt16 =
exports.freeInt32 =
exports.freeFloat32 = 
exports.freeFloat =
exports.freeFloat64 = 
exports.freeDouble = 
exports.freeUint8Clamped = 
exports.freeDataView = freeTypedArray;

exports.freeArrayBuffer = freeArrayBuffer;

exports.freeBuffer = function freeBuffer(array) {
  BUFFER[twiddle.log2(array.length)].push(array);
};

exports.malloc = function malloc(n, dtype) {
  if(dtype === undefined || dtype === 'arraybuffer') {
    return mallocArrayBuffer(n)
  } else {
    switch(dtype) {
      case 'uint8':
        return mallocUint8(n)
      case 'uint16':
        return mallocUint16(n)
      case 'uint32':
        return mallocUint32(n)
      case 'int8':
        return mallocInt8(n)
      case 'int16':
        return mallocInt16(n)
      case 'int32':
        return mallocInt32(n)
      case 'float':
      case 'float32':
        return mallocFloat(n)
      case 'double':
      case 'float64':
        return mallocDouble(n)
      case 'uint8_clamped':
        return mallocUint8Clamped(n)
      case 'buffer':
        return mallocBuffer(n)
      case 'data':
      case 'dataview':
        return mallocDataView(n)

      default:
        return null
    }
  }
  return null
};

function mallocArrayBuffer(n) {
  var n = twiddle.nextPow2(n);
  var log_n = twiddle.log2(n);
  var d = DATA[log_n];
  if(d.length > 0) {
    return d.pop()
  }
  return new ArrayBuffer(n)
}
exports.mallocArrayBuffer = mallocArrayBuffer;

function mallocUint8(n) {
  return new Uint8Array(mallocArrayBuffer(n), 0, n)
}
exports.mallocUint8 = mallocUint8;

function mallocUint16(n) {
  return new Uint16Array(mallocArrayBuffer(2*n), 0, n)
}
exports.mallocUint16 = mallocUint16;

function mallocUint32(n) {
  return new Uint32Array(mallocArrayBuffer(4*n), 0, n)
}
exports.mallocUint32 = mallocUint32;

function mallocInt8(n) {
  return new Int8Array(mallocArrayBuffer(n), 0, n)
}
exports.mallocInt8 = mallocInt8;

function mallocInt16(n) {
  return new Int16Array(mallocArrayBuffer(2*n), 0, n)
}
exports.mallocInt16 = mallocInt16;

function mallocInt32(n) {
  return new Int32Array(mallocArrayBuffer(4*n), 0, n)
}
exports.mallocInt32 = mallocInt32;

function mallocFloat(n) {
  return new Float32Array(mallocArrayBuffer(4*n), 0, n)
}
exports.mallocFloat32 = exports.mallocFloat = mallocFloat;

function mallocDouble(n) {
  return new Float64Array(mallocArrayBuffer(8*n), 0, n)
}
exports.mallocFloat64 = exports.mallocDouble = mallocDouble;

function mallocUint8Clamped(n) {
  if(hasUint8C) {
    return new Uint8ClampedArray(mallocArrayBuffer(n), 0, n)
  } else {
    return mallocUint8(n)
  }
}
exports.mallocUint8Clamped = mallocUint8Clamped;

function mallocDataView(n) {
  return new DataView(mallocArrayBuffer(n), 0, n)
}
exports.mallocDataView = mallocDataView;

function mallocBuffer(n) {
  n = twiddle.nextPow2(n);
  var log_n = twiddle.log2(n);
  var cache = BUFFER[log_n];
  if(cache.length > 0) {
    return cache.pop()
  }
  return new Buffer(n)
}
exports.mallocBuffer = mallocBuffer;

exports.clearCache = function clearCache() {
  for(var i=0; i<32; ++i) {
    POOL.UINT8[i].length = 0;
    POOL.UINT16[i].length = 0;
    POOL.UINT32[i].length = 0;
    POOL.INT8[i].length = 0;
    POOL.INT16[i].length = 0;
    POOL.INT32[i].length = 0;
    POOL.FLOAT[i].length = 0;
    POOL.DOUBLE[i].length = 0;
    POOL.UINT8C[i].length = 0;
    DATA[i].length = 0;
    BUFFER[i].length = 0;
  }
};
});

var pool_1 = pool$2.free;
var pool_2 = pool$2.freeUint8;
var pool_3 = pool$2.freeUint16;
var pool_4 = pool$2.freeUint32;
var pool_5 = pool$2.freeInt8;
var pool_6 = pool$2.freeInt16;
var pool_7 = pool$2.freeInt32;
var pool_8 = pool$2.freeFloat32;
var pool_9 = pool$2.freeFloat;
var pool_10 = pool$2.freeFloat64;
var pool_11 = pool$2.freeDouble;
var pool_12 = pool$2.freeUint8Clamped;
var pool_13 = pool$2.freeDataView;
var pool_14 = pool$2.freeArrayBuffer;
var pool_15 = pool$2.freeBuffer;
var pool_16 = pool$2.malloc;
var pool_17 = pool$2.mallocArrayBuffer;
var pool_18 = pool$2.mallocUint8;
var pool_19 = pool$2.mallocUint16;
var pool_20 = pool$2.mallocUint32;
var pool_21 = pool$2.mallocInt8;
var pool_22 = pool$2.mallocInt16;
var pool_23 = pool$2.mallocInt32;
var pool_24 = pool$2.mallocFloat32;
var pool_25 = pool$2.mallocFloat;
var pool_26 = pool$2.mallocFloat64;
var pool_27 = pool$2.mallocDouble;
var pool_28 = pool$2.mallocUint8Clamped;
var pool_29 = pool$2.mallocDataView;
var pool_30 = pool$2.mallocBuffer;
var pool_31 = pool$2.clearCache;

var texture = createTexture2D;

var linearTypes = null;
var filterTypes = null;
var wrapTypes   = null;

function lazyInitLinearTypes(gl) {
  linearTypes = [
    gl.LINEAR,
    gl.NEAREST_MIPMAP_LINEAR,
    gl.LINEAR_MIPMAP_NEAREST,
    gl.LINEAR_MIPMAP_NEAREST
  ];
  filterTypes = [
    gl.NEAREST,
    gl.LINEAR,
    gl.NEAREST_MIPMAP_NEAREST,
    gl.NEAREST_MIPMAP_LINEAR,
    gl.LINEAR_MIPMAP_NEAREST,
    gl.LINEAR_MIPMAP_LINEAR
  ];
  wrapTypes = [
    gl.REPEAT,
    gl.CLAMP_TO_EDGE,
    gl.MIRRORED_REPEAT
  ];
}

function acceptTextureDOM (obj) {
  return (
    ('undefined' != typeof HTMLCanvasElement && obj instanceof HTMLCanvasElement) ||
    ('undefined' != typeof HTMLImageElement && obj instanceof HTMLImageElement) ||
    ('undefined' != typeof HTMLVideoElement && obj instanceof HTMLVideoElement) ||
    ('undefined' != typeof ImageData && obj instanceof ImageData))
}

var convertFloatToUint8 = function(out, inp) {
  ndarrayOps.muls(out, inp, 255.0);
};

function reshapeTexture(tex, w, h) {
  var gl = tex.gl;
  var maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if(w < 0 || w > maxSize || h < 0 || h > maxSize) {
    throw new Error('gl-texture2d: Invalid texture size')
  }
  tex._shape = [w, h];
  tex.bind();
  gl.texImage2D(gl.TEXTURE_2D, 0, tex.format, w, h, 0, tex.format, tex.type, null);
  tex._mipLevels = [0];
  return tex
}

function Texture2D(gl, handle, width, height, format, type) {
  this.gl = gl;
  this.handle = handle;
  this.format = format;
  this.type = type;
  this._shape = [width, height];
  this._mipLevels = [0];
  this._magFilter = gl.NEAREST;
  this._minFilter = gl.NEAREST;
  this._wrapS = gl.CLAMP_TO_EDGE;
  this._wrapT = gl.CLAMP_TO_EDGE;
  this._anisoSamples = 1;

  var parent = this;
  var wrapVector = [this._wrapS, this._wrapT];
  Object.defineProperties(wrapVector, [
    {
      get: function() {
        return parent._wrapS
      },
      set: function(v) {
        return parent.wrapS = v
      }
    },
    {
      get: function() {
        return parent._wrapT
      },
      set: function(v) {
        return parent.wrapT = v
      }
    }
  ]);
  this._wrapVector = wrapVector;

  var shapeVector = [this._shape[0], this._shape[1]];
  Object.defineProperties(shapeVector, [
    {
      get: function() {
        return parent._shape[0]
      },
      set: function(v) {
        return parent.width = v
      }
    },
    {
      get: function() {
        return parent._shape[1]
      },
      set: function(v) {
        return parent.height = v
      }
    }
  ]);
  this._shapeVector = shapeVector;
}

var proto = Texture2D.prototype;

Object.defineProperties(proto, {
  minFilter: {
    get: function() {
      return this._minFilter
    },
    set: function(v) {
      this.bind();
      var gl = this.gl;
      if(this.type === gl.FLOAT && linearTypes.indexOf(v) >= 0) {
        if(!gl.getExtension('OES_texture_float_linear')) {
          v = gl.NEAREST;
        }
      }
      if(filterTypes.indexOf(v) < 0) {
        throw new Error('gl-texture2d: Unknown filter mode ' + v)
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, v);
      return this._minFilter = v
    }
  },
  magFilter: {
    get: function() {
      return this._magFilter
    },
    set: function(v) {
      this.bind();
      var gl = this.gl;
      if(this.type === gl.FLOAT && linearTypes.indexOf(v) >= 0) {
        if(!gl.getExtension('OES_texture_float_linear')) {
          v = gl.NEAREST;
        }
      }
      if(filterTypes.indexOf(v) < 0) {
        throw new Error('gl-texture2d: Unknown filter mode ' + v)
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, v);
      return this._magFilter = v
    }
  },
  mipSamples: {
    get: function() {
      return this._anisoSamples
    },
    set: function(i) {
      var psamples = this._anisoSamples;
      this._anisoSamples = Math.max(i, 1)|0;
      if(psamples !== this._anisoSamples) {
        var ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
        if(ext) {
          this.gl.texParameterf(this.gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, this._anisoSamples);
        }
      }
      return this._anisoSamples
    }
  },
  wrapS: {
    get: function() {
      return this._wrapS
    },
    set: function(v) {
      this.bind();
      if(wrapTypes.indexOf(v) < 0) {
        throw new Error('gl-texture2d: Unknown wrap mode ' + v)
      }
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, v);
      return this._wrapS = v
    }
  },
  wrapT: {
    get: function() {
      return this._wrapT
    },
    set: function(v) {
      this.bind();
      if(wrapTypes.indexOf(v) < 0) {
        throw new Error('gl-texture2d: Unknown wrap mode ' + v)
      }
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, v);
      return this._wrapT = v
    }
  },
  wrap: {
    get: function() {
      return this._wrapVector
    },
    set: function(v) {
      if(!Array.isArray(v)) {
        v = [v,v];
      }
      if(v.length !== 2) {
        throw new Error('gl-texture2d: Must specify wrap mode for rows and columns')
      }
      for(var i=0; i<2; ++i) {
        if(wrapTypes.indexOf(v[i]) < 0) {
          throw new Error('gl-texture2d: Unknown wrap mode ' + v)
        }
      }
      this._wrapS = v[0];
      this._wrapT = v[1];

      var gl = this.gl;
      this.bind();
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this._wrapS);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this._wrapT);

      return v
    }
  },
  shape: {
    get: function() {
      return this._shapeVector
    },
    set: function(x) {
      if(!Array.isArray(x)) {
        x = [x|0,x|0];
      } else {
        if(x.length !== 2) {
          throw new Error('gl-texture2d: Invalid texture shape')
        }
      }
      reshapeTexture(this, x[0]|0, x[1]|0);
      return [x[0]|0, x[1]|0]
    }
  },
  width: {
    get: function() {
      return this._shape[0]
    },
    set: function(w) {
      w = w|0;
      reshapeTexture(this, w, this._shape[1]);
      return w
    }
  },
  height: {
    get: function() {
      return this._shape[1]
    },
    set: function(h) {
      h = h|0;
      reshapeTexture(this, this._shape[0], h);
      return h
    }
  }
});

proto.bind = function(unit) {
  var gl = this.gl;
  if(unit !== undefined) {
    gl.activeTexture(gl.TEXTURE0 + (unit|0));
  }
  gl.bindTexture(gl.TEXTURE_2D, this.handle);
  if(unit !== undefined) {
    return (unit|0)
  }
  return gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0
};

proto.dispose = function() {
  this.gl.deleteTexture(this.handle);
};

proto.generateMipmap = function() {
  this.bind();
  this.gl.generateMipmap(this.gl.TEXTURE_2D);

  //Update mip levels
  var l = Math.min(this._shape[0], this._shape[1]);
  for(var i=0; l>0; ++i, l>>>=1) {
    if(this._mipLevels.indexOf(i) < 0) {
      this._mipLevels.push(i);
    }
  }
};

proto.setPixels = function(data, x_off, y_off, mip_level) {
  var gl = this.gl;
  this.bind();
  if(Array.isArray(x_off)) {
    mip_level = y_off;
    y_off = x_off[1]|0;
    x_off = x_off[0]|0;
  } else {
    x_off = x_off || 0;
    y_off = y_off || 0;
  }
  mip_level = mip_level || 0;
  var directData = acceptTextureDOM(data) ? data : data.raw;
  if(directData) {
    var needsMip = this._mipLevels.indexOf(mip_level) < 0;
    if(needsMip) {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, directData);
      this._mipLevels.push(mip_level);
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, mip_level, x_off, y_off, this.format, this.type, directData);
    }
  } else if(data.shape && data.stride && data.data) {
    if(data.shape.length < 2 ||
       x_off + data.shape[1] > this._shape[1]>>>mip_level ||
       y_off + data.shape[0] > this._shape[0]>>>mip_level ||
       x_off < 0 ||
       y_off < 0) {
      throw new Error('gl-texture2d: Texture dimensions are out of bounds')
    }
    texSubImageArray(gl, x_off, y_off, mip_level, this.format, this.type, this._mipLevels, data);
  } else {
    throw new Error('gl-texture2d: Unsupported data type')
  }
};


function isPacked(shape, stride) {
  if(shape.length === 3) {
    return  (stride[2] === 1) &&
            (stride[1] === shape[0]*shape[2]) &&
            (stride[0] === shape[2])
  }
  return  (stride[0] === 1) &&
          (stride[1] === shape[0])
}

function texSubImageArray(gl, x_off, y_off, mip_level, cformat, ctype, mipLevels, array) {
  var dtype = array.dtype;
  var shape = array.shape.slice();
  if(shape.length < 2 || shape.length > 3) {
    throw new Error('gl-texture2d: Invalid ndarray, must be 2d or 3d')
  }
  var type = 0, format = 0;
  var packed = isPacked(shape, array.stride.slice());
  if(dtype === 'float32') {
    type = gl.FLOAT;
  } else if(dtype === 'float64') {
    type = gl.FLOAT;
    packed = false;
    dtype = 'float32';
  } else if(dtype === 'uint8') {
    type = gl.UNSIGNED_BYTE;
  } else {
    type = gl.UNSIGNED_BYTE;
    packed = false;
    dtype = 'uint8';
  }
  var channels = 1;
  if(shape.length === 2) {
    format = gl.LUMINANCE;
    shape = [shape[0], shape[1], 1];
    array = ndarray(array.data, shape, [array.stride[0], array.stride[1], 1], array.offset);
  } else if(shape.length === 3) {
    if(shape[2] === 1) {
      format = gl.ALPHA;
    } else if(shape[2] === 2) {
      format = gl.LUMINANCE_ALPHA;
    } else if(shape[2] === 3) {
      format = gl.RGB;
    } else if(shape[2] === 4) {
      format = gl.RGBA;
    } else {
      throw new Error('gl-texture2d: Invalid shape for pixel coords')
    }
    channels = shape[2];
  } else {
    throw new Error('gl-texture2d: Invalid shape for texture')
  }
  //For 1-channel textures allow conversion between formats
  if((format  === gl.LUMINANCE || format  === gl.ALPHA) &&
     (cformat === gl.LUMINANCE || cformat === gl.ALPHA)) {
    format = cformat;
  }
  if(format !== cformat) {
    throw new Error('gl-texture2d: Incompatible texture format for setPixels')
  }
  var size = array.size;
  var needsMip = mipLevels.indexOf(mip_level) < 0;
  if(needsMip) {
    mipLevels.push(mip_level);
  }
  if(type === ctype && packed) {
    //Array data types are compatible, can directly copy into texture
    if(array.offset === 0 && array.data.length === size) {
      if(needsMip) {
        gl.texImage2D(gl.TEXTURE_2D, mip_level, cformat, shape[0], shape[1], 0, cformat, ctype, array.data);
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, mip_level, x_off, y_off, shape[0], shape[1], cformat, ctype, array.data);
      }
    } else {
      if(needsMip) {
        gl.texImage2D(gl.TEXTURE_2D, mip_level, cformat, shape[0], shape[1], 0, cformat, ctype, array.data.subarray(array.offset, array.offset+size));
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, mip_level, x_off, y_off, shape[0], shape[1], cformat, ctype, array.data.subarray(array.offset, array.offset+size));
      }
    }
  } else {
    //Need to do type conversion to pack data into buffer
    var pack_buffer;
    if(ctype === gl.FLOAT) {
      pack_buffer = pool$2.mallocFloat32(size);
    } else {
      pack_buffer = pool$2.mallocUint8(size);
    }
    var pack_view = ndarray(pack_buffer, shape, [shape[2], shape[2]*shape[0], 1]);
    if(type === gl.FLOAT && ctype === gl.UNSIGNED_BYTE) {
      convertFloatToUint8(pack_view, array);
    } else {
      ndarrayOps.assign(pack_view, array);
    }
    if(needsMip) {
      gl.texImage2D(gl.TEXTURE_2D, mip_level, cformat, shape[0], shape[1], 0, cformat, ctype, pack_buffer.subarray(0, size));
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, mip_level, x_off, y_off, shape[0], shape[1], cformat, ctype, pack_buffer.subarray(0, size));
    }
    if(ctype === gl.FLOAT) {
      pool$2.freeFloat32(pack_buffer);
    } else {
      pool$2.freeUint8(pack_buffer);
    }
  }
}

function initTexture(gl) {
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex
}

function createTextureShape(gl, width, height, format, type) {
  var maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if(width < 0 || width > maxTextureSize || height < 0 || height  > maxTextureSize) {
    throw new Error('gl-texture2d: Invalid texture shape')
  }
  if(type === gl.FLOAT && !gl.getExtension('OES_texture_float')) {
    throw new Error('gl-texture2d: Floating point textures not supported on this platform')
  }
  var tex = initTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, null);
  return new Texture2D(gl, tex, width, height, format, type)
}

function createTextureDOM(gl, directData, width, height, format, type) {
  var tex = initTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, directData);
  return new Texture2D(gl, tex, width, height, format, type)
}

//Creates a texture from an ndarray
function createTextureArray(gl, array) {
  var dtype = array.dtype;
  var shape = array.shape.slice();
  var maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if(shape[0] < 0 || shape[0] > maxSize || shape[1] < 0 || shape[1] > maxSize) {
    throw new Error('gl-texture2d: Invalid texture size')
  }
  var packed = isPacked(shape, array.stride.slice());
  var type = 0;
  if(dtype === 'float32') {
    type = gl.FLOAT;
  } else if(dtype === 'float64') {
    type = gl.FLOAT;
    packed = false;
    dtype = 'float32';
  } else if(dtype === 'uint8') {
    type = gl.UNSIGNED_BYTE;
  } else {
    type = gl.UNSIGNED_BYTE;
    packed = false;
    dtype = 'uint8';
  }
  var format = 0;
  if(shape.length === 2) {
    format = gl.LUMINANCE;
    shape = [shape[0], shape[1], 1];
    array = ndarray(array.data, shape, [array.stride[0], array.stride[1], 1], array.offset);
  } else if(shape.length === 3) {
    if(shape[2] === 1) {
      format = gl.ALPHA;
    } else if(shape[2] === 2) {
      format = gl.LUMINANCE_ALPHA;
    } else if(shape[2] === 3) {
      format = gl.RGB;
    } else if(shape[2] === 4) {
      format = gl.RGBA;
    } else {
      throw new Error('gl-texture2d: Invalid shape for pixel coords')
    }
  } else {
    throw new Error('gl-texture2d: Invalid shape for texture')
  }
  if(type === gl.FLOAT && !gl.getExtension('OES_texture_float')) {
    type = gl.UNSIGNED_BYTE;
    packed = false;
  }
  var buffer, buf_store;
  var size = array.size;
  if(!packed) {
    var stride = [shape[2], shape[2]*shape[0], 1];
    buf_store = pool$2.malloc(size, dtype);
    var buf_array = ndarray(buf_store, shape, stride, 0);
    if((dtype === 'float32' || dtype === 'float64') && type === gl.UNSIGNED_BYTE) {
      convertFloatToUint8(buf_array, array);
    } else {
      ndarrayOps.assign(buf_array, array);
    }
    buffer = buf_store.subarray(0, size);
  } else if (array.offset === 0 && array.data.length === size) {
    buffer = array.data;
  } else {
    buffer = array.data.subarray(array.offset, array.offset + size);
  }
  var tex = initTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, shape[0], shape[1], 0, format, type, buffer);
  if(!packed) {
    pool$2.free(buf_store);
  }
  return new Texture2D(gl, tex, shape[0], shape[1], format, type)
}

function createTexture2D(gl) {
  if(arguments.length <= 1) {
    throw new Error('gl-texture2d: Missing arguments for texture2d constructor')
  }
  if(!linearTypes) {
    lazyInitLinearTypes(gl);
  }
  if(typeof arguments[1] === 'number') {
    return createTextureShape(gl, arguments[1], arguments[2], arguments[3]||gl.RGBA, arguments[4]||gl.UNSIGNED_BYTE)
  }
  if(Array.isArray(arguments[1])) {
    return createTextureShape(gl, arguments[1][0]|0, arguments[1][1]|0, arguments[2]||gl.RGBA, arguments[3]||gl.UNSIGNED_BYTE)
  }
  if(typeof arguments[1] === 'object') {
    var obj = arguments[1];
    var directData = acceptTextureDOM(obj) ? obj : obj.raw;
    if (directData) {
      return createTextureDOM(gl, directData, obj.width|0, obj.height|0, arguments[2]||gl.RGBA, arguments[3]||gl.UNSIGNED_BYTE)
    } else if(obj.shape && obj.data && obj.stride) {
      return createTextureArray(gl, obj)
    }
  }
  throw new Error('gl-texture2d: Invalid arguments for texture2d constructor')
}

var reflect = makeReflectTypes;

//Construct type info for reflection.
//
// This iterates over the flattened list of uniform type values and smashes them into a JSON object.
//
// The leaves of the resulting object are either indices or type strings representing primitive glslify types
function makeReflectTypes(uniforms, useIndex) {
  var obj = {};
  for(var i=0; i<uniforms.length; ++i) {
    var n = uniforms[i].name;
    var parts = n.split(".");
    var o = obj;
    for(var j=0; j<parts.length; ++j) {
      var x = parts[j].split("[");
      if(x.length > 1) {
        if(!(x[0] in o)) {
          o[x[0]] = [];
        }
        o = o[x[0]];
        for(var k=1; k<x.length; ++k) {
          var y = parseInt(x[k]);
          if(k<x.length-1 || j<parts.length-1) {
            if(!(y in o)) {
              if(k < x.length-1) {
                o[y] = [];
              } else {
                o[y] = {};
              }
            }
            o = o[y];
          } else {
            if(useIndex) {
              o[y] = i;
            } else {
              o[y] = uniforms[i].type;
            }
          }
        }
      } else if(j < parts.length-1) {
        if(!(x[0] in o)) {
          o[x[0]] = {};
        }
        o = o[x[0]];
      } else {
        if(useIndex) {
          o[x[0]] = i;
        } else {
          o[x[0]] = uniforms[i].type;
        }
      }
    }
  }
  return obj
}

function GLError (rawError, shortMessage, longMessage) {
    this.shortMessage = shortMessage || '';
    this.longMessage = longMessage || '';
    this.rawError = rawError || '';
    this.message =
      'gl-shader: ' + (shortMessage || rawError || '') +
      (longMessage ? '\n'+longMessage : '');
    this.stack = (new Error()).stack;
}
GLError.prototype = new Error;
GLError.prototype.name = 'GLError';
GLError.prototype.constructor = GLError;
var GLError_1 = GLError;

var createUniforms = createUniformWrapper;

//Binds a function and returns a value
function identity(x) {
  var c = new Function('y', 'return function(){return y}');
  return c(x)
}

function makeVector(length, fill) {
  var result = new Array(length);
  for(var i=0; i<length; ++i) {
    result[i] = fill;
  }
  return result
}

//Create shims for uniforms
function createUniformWrapper(gl, wrapper, uniforms, locations) {

  function makeGetter(index) {
    var proc = new Function(
        'gl'
      , 'wrapper'
      , 'locations'
      , 'return function(){return gl.getUniform(wrapper.program,locations[' + index + '])}');
    return proc(gl, wrapper, locations)
  }

  function makePropSetter(path, index, type) {
    switch(type) {
      case 'bool':
      case 'int':
      case 'sampler2D':
      case 'samplerCube':
        return 'gl.uniform1i(locations[' + index + '],obj' + path + ')'
      case 'float':
        return 'gl.uniform1f(locations[' + index + '],obj' + path + ')'
      default:
        var vidx = type.indexOf('vec');
        if(0 <= vidx && vidx <= 1 && type.length === 4 + vidx) {
          var d = type.charCodeAt(type.length-1) - 48;
          if(d < 2 || d > 4) {
            throw new GLError_1('', 'Invalid data type')
          }
          switch(type.charAt(0)) {
            case 'b':
            case 'i':
              return 'gl.uniform' + d + 'iv(locations[' + index + '],obj' + path + ')'
            case 'v':
              return 'gl.uniform' + d + 'fv(locations[' + index + '],obj' + path + ')'
            default:
              throw new GLError_1('', 'Unrecognized data type for vector ' + name + ': ' + type)
          }
        } else if(type.indexOf('mat') === 0 && type.length === 4) {
          var d = type.charCodeAt(type.length-1) - 48;
          if(d < 2 || d > 4) {
            throw new GLError_1('', 'Invalid uniform dimension type for matrix ' + name + ': ' + type)
          }
          return 'gl.uniformMatrix' + d + 'fv(locations[' + index + '],false,obj' + path + ')'
        } else {
          throw new GLError_1('', 'Unknown uniform data type for ' + name + ': ' + type)
        }
      break
    }
  }

  function enumerateIndices(prefix, type) {
    if(typeof type !== 'object') {
      return [ [prefix, type] ]
    }
    var indices = [];
    for(var id in type) {
      var prop = type[id];
      var tprefix = prefix;
      if(parseInt(id) + '' === id) {
        tprefix += '[' + id + ']';
      } else {
        tprefix += '.' + id;
      }
      if(typeof prop === 'object') {
        indices.push.apply(indices, enumerateIndices(tprefix, prop));
      } else {
        indices.push([tprefix, prop]);
      }
    }
    return indices
  }

  function makeSetter(type) {
    var code = [ 'return function updateProperty(obj){' ];
    var indices = enumerateIndices('', type);
    for(var i=0; i<indices.length; ++i) {
      var item = indices[i];
      var path = item[0];
      var idx  = item[1];
      if(locations[idx]) {
        code.push(makePropSetter(path, idx, uniforms[idx].type));
      }
    }
    code.push('return obj}');
    var proc = new Function('gl', 'locations', code.join('\n'));
    return proc(gl, locations)
  }

  function defaultValue(type) {
    switch(type) {
      case 'bool':
        return false
      case 'int':
      case 'sampler2D':
      case 'samplerCube':
        return 0
      case 'float':
        return 0.0
      default:
        var vidx = type.indexOf('vec');
        if(0 <= vidx && vidx <= 1 && type.length === 4 + vidx) {
          var d = type.charCodeAt(type.length-1) - 48;
          if(d < 2 || d > 4) {
            throw new GLError_1('', 'Invalid data type')
          }
          if(type.charAt(0) === 'b') {
            return makeVector(d, false)
          }
          return makeVector(d, 0)
        } else if(type.indexOf('mat') === 0 && type.length === 4) {
          var d = type.charCodeAt(type.length-1) - 48;
          if(d < 2 || d > 4) {
            throw new GLError_1('', 'Invalid uniform dimension type for matrix ' + name + ': ' + type)
          }
          return makeVector(d*d, 0)
        } else {
          throw new GLError_1('', 'Unknown uniform data type for ' + name + ': ' + type)
        }
      break
    }
  }

  function storeProperty(obj, prop, type) {
    if(typeof type === 'object') {
      var child = processObject(type);
      Object.defineProperty(obj, prop, {
        get: identity(child),
        set: makeSetter(type),
        enumerable: true,
        configurable: false
      });
    } else {
      if(locations[type]) {
        Object.defineProperty(obj, prop, {
          get: makeGetter(type),
          set: makeSetter(type),
          enumerable: true,
          configurable: false
        });
      } else {
        obj[prop] = defaultValue(uniforms[type].type);
      }
    }
  }

  function processObject(obj) {
    var result;
    if(Array.isArray(obj)) {
      result = new Array(obj.length);
      for(var i=0; i<obj.length; ++i) {
        storeProperty(result, i, obj[i]);
      }
    } else {
      result = {};
      for(var id in obj) {
        storeProperty(result, id, obj[id]);
      }
    }
    return result
  }

  //Return data
  var coallesced = reflect(uniforms, true);
  return {
    get: identity(processObject(coallesced)),
    set: makeSetter(coallesced),
    enumerable: true,
    configurable: true
  }
}

var createAttributes = createAttributeWrapper;



function ShaderAttribute(
    gl
  , wrapper
  , index
  , locations
  , dimension
  , constFunc) {
  this._gl        = gl;
  this._wrapper   = wrapper;
  this._index     = index;
  this._locations = locations;
  this._dimension = dimension;
  this._constFunc = constFunc;
}

var proto$2 = ShaderAttribute.prototype;

proto$2.pointer = function setAttribPointer(
    type
  , normalized
  , stride
  , offset) {

  var self      = this;
  var gl        = self._gl;
  var location  = self._locations[self._index];

  gl.vertexAttribPointer(
      location
    , self._dimension
    , type || gl.FLOAT
    , !!normalized
    , stride || 0
    , offset || 0);
  gl.enableVertexAttribArray(location);
};

proto$2.set = function(x0, x1, x2, x3) {
  return this._constFunc(this._locations[this._index], x0, x1, x2, x3)
};

Object.defineProperty(proto$2, 'location', {
  get: function() {
    return this._locations[this._index]
  }
  , set: function(v) {
    if(v !== this._locations[this._index]) {
      this._locations[this._index] = v|0;
      this._wrapper.program = null;
    }
    return v|0
  }
});

//Adds a vector attribute to obj
function addVectorAttribute(
    gl
  , wrapper
  , index
  , locations
  , dimension
  , obj
  , name) {

  //Construct constant function
  var constFuncArgs = [ 'gl', 'v' ];
  var varNames = [];
  for(var i=0; i<dimension; ++i) {
    constFuncArgs.push('x'+i);
    varNames.push('x'+i);
  }
  constFuncArgs.push(
    'if(x0.length===void 0){return gl.vertexAttrib' +
    dimension + 'f(v,' +
    varNames.join() +
    ')}else{return gl.vertexAttrib' +
    dimension +
    'fv(v,x0)}');
  var constFunc = Function.apply(null, constFuncArgs);

  //Create attribute wrapper
  var attr = new ShaderAttribute(
      gl
    , wrapper
    , index
    , locations
    , dimension
    , constFunc);

  //Create accessor
  Object.defineProperty(obj, name, {
    set: function(x) {
      gl.disableVertexAttribArray(locations[index]);
      constFunc(gl, locations[index], x);
      return x
    }
    , get: function() {
      return attr
    }
    , enumerable: true
  });
}

function addMatrixAttribute(
    gl
  , wrapper
  , index
  , locations
  , dimension
  , obj
  , name) {

  var parts = new Array(dimension);
  var attrs = new Array(dimension);
  for(var i=0; i<dimension; ++i) {
    addVectorAttribute(
        gl
      , wrapper
      , index[i]
      , locations
      , dimension
      , parts
      , i);
    attrs[i] = parts[i];
  }

  Object.defineProperty(parts, 'location', {
    set: function(v) {
      if(Array.isArray(v)) {
        for(var i=0; i<dimension; ++i) {
          attrs[i].location = v[i];
        }
      } else {
        for(var i=0; i<dimension; ++i) {
          attrs[i].location = v + i;
        }
      }
      return v
    }
    , get: function() {
      var result = new Array(dimension);
      for(var i=0; i<dimension; ++i) {
        result[i] = locations[index[i]];
      }
      return result
    }
    , enumerable: true
  });

  parts.pointer = function(type, normalized, stride, offset) {
    type       = type || gl.FLOAT;
    normalized = !!normalized;
    stride     = stride || (dimension * dimension);
    offset     = offset || 0;
    for(var i=0; i<dimension; ++i) {
      var location = locations[index[i]];
      gl.vertexAttribPointer(
            location
          , dimension
          , type
          , normalized
          , stride
          , offset + i * dimension);
      gl.enableVertexAttribArray(location);
    }
  };

  var scratch = new Array(dimension);
  var vertexAttrib = gl['vertexAttrib' + dimension + 'fv'];

  Object.defineProperty(obj, name, {
    set: function(x) {
      for(var i=0; i<dimension; ++i) {
        var loc = locations[index[i]];
        gl.disableVertexAttribArray(loc);
        if(Array.isArray(x[0])) {
          vertexAttrib.call(gl, loc, x[i]);
        } else {
          for(var j=0; j<dimension; ++j) {
            scratch[j] = x[dimension*i + j];
          }
          vertexAttrib.call(gl, loc, scratch);
        }
      }
      return x
    }
    , get: function() {
      return parts
    }
    , enumerable: true
  });
}

//Create shims for attributes
function createAttributeWrapper(
    gl
  , wrapper
  , attributes
  , locations) {

  var obj = {};
  for(var i=0, n=attributes.length; i<n; ++i) {

    var a = attributes[i];
    var name = a.name;
    var type = a.type;
    var locs = a.locations;

    switch(type) {
      case 'bool':
      case 'int':
      case 'float':
        addVectorAttribute(
            gl
          , wrapper
          , locs[0]
          , locations
          , 1
          , obj
          , name);
      break

      default:
        if(type.indexOf('vec') >= 0) {
          var d = type.charCodeAt(type.length-1) - 48;
          if(d < 2 || d > 4) {
            throw new GLError_1('', 'Invalid data type for attribute ' + name + ': ' + type)
          }
          addVectorAttribute(
              gl
            , wrapper
            , locs[0]
            , locations
            , d
            , obj
            , name);
        } else if(type.indexOf('mat') >= 0) {
          var d = type.charCodeAt(type.length-1) - 48;
          if(d < 2 || d > 4) {
            throw new GLError_1('', 'Invalid data type for attribute ' + name + ': ' + type)
          }
          addMatrixAttribute(
              gl
            , wrapper
            , locs
            , locations
            , d
            , obj
            , name);
        } else {
          throw new GLError_1('', 'Unknown data type for attribute ' + name + ': ' + type)
        }
      break
    }
  }
  return obj
}

var sprintf$1 = createCommonjsModule(function (module, exports) {
(function(window) {
    var re = {
        not_string: /[^s]/,
        number: /[diefg]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    };

    function sprintf() {
        var key = arguments[0], cache = sprintf.cache;
        if (!(cache[key] && cache.hasOwnProperty(key))) {
            cache[key] = sprintf.parse(key);
        }
        return sprintf.format.call(null, cache[key], arguments)
    }

    sprintf.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = "";
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i]);
            if (node_type === "string") {
                output[output.length] = parse_tree[i];
            }
            else if (node_type === "array") {
                match = parse_tree[i]; // convenience purposes only
                if (match[2]) { // keyword argument
                    arg = argv[cursor];
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
                        }
                        arg = arg[match[2][k]];
                    }
                }
                else if (match[1]) { // positional argument (explicit)
                    arg = argv[match[1]];
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++];
                }

                if (get_type(arg) == "function") {
                    arg = arg();
                }

                if (re.not_string.test(match[8]) && re.not_json.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
                    throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
                }

                if (re.number.test(match[8])) {
                    is_positive = arg >= 0;
                }

                switch (match[8]) {
                    case "b":
                        arg = arg.toString(2);
                    break
                    case "c":
                        arg = String.fromCharCode(arg);
                    break
                    case "d":
                    case "i":
                        arg = parseInt(arg, 10);
                    break
                    case "j":
                        arg = JSON.stringify(arg, null, match[6] ? parseInt(match[6]) : 0);
                    break
                    case "e":
                        arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential();
                    break
                    case "f":
                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg);
                    break
                    case "g":
                        arg = match[7] ? parseFloat(arg).toPrecision(match[7]) : parseFloat(arg);
                    break
                    case "o":
                        arg = arg.toString(8);
                    break
                    case "s":
                        arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg);
                    break
                    case "u":
                        arg = arg >>> 0;
                    break
                    case "x":
                        arg = arg.toString(16);
                    break
                    case "X":
                        arg = arg.toString(16).toUpperCase();
                    break
                }
                if (re.json.test(match[8])) {
                    output[output.length] = arg;
                }
                else {
                    if (re.number.test(match[8]) && (!is_positive || match[3])) {
                        sign = is_positive ? "+" : "-";
                        arg = arg.toString().replace(re.sign, "");
                    }
                    else {
                        sign = "";
                    }
                    pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " ";
                    pad_length = match[6] - (sign + arg).length;
                    pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : "";
                    output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg);
                }
            }
        }
        return output.join("")
    };

    sprintf.cache = {};

    sprintf.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = match[0];
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = "%";
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1;
                    var field_list = [], replacement_field = match[2], field_match = [];
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list[field_list.length] = field_match[1];
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1];
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1];
                            }
                            else {
                                throw new SyntaxError("[sprintf] failed to parse named argument key")
                            }
                        }
                    }
                    else {
                        throw new SyntaxError("[sprintf] failed to parse named argument key")
                    }
                    match[2] = field_list;
                }
                else {
                    arg_names |= 2;
                }
                if (arg_names === 3) {
                    throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
                }
                parse_tree[parse_tree.length] = match;
            }
            else {
                throw new SyntaxError("[sprintf] unexpected placeholder")
            }
            _fmt = _fmt.substring(match[0].length);
        }
        return parse_tree
    };

    var vsprintf = function(fmt, argv, _argv) {
        _argv = (argv || []).slice(0);
        _argv.splice(0, 0, fmt);
        return sprintf.apply(null, _argv)
    };

    /**
     * helpers
     */
    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
    }

    function str_repeat(input, multiplier) {
        return Array(multiplier + 1).join(input)
    }

    /**
     * export to either browser or node.js
     */
    {
        exports.sprintf = sprintf;
        exports.vsprintf = vsprintf;
    }
})(typeof window === "undefined" ? commonjsGlobal : window);
});

var sprintf_1 = sprintf$1.sprintf;
var sprintf_2 = sprintf$1.vsprintf;

var numbers = {
  0: 'NONE',
  1: 'ONE',
  2: 'LINE_LOOP',
  3: 'LINE_STRIP',
  4: 'TRIANGLES',
  5: 'TRIANGLE_STRIP',
  6: 'TRIANGLE_FAN',
  256: 'DEPTH_BUFFER_BIT',
  512: 'NEVER',
  513: 'LESS',
  514: 'EQUAL',
  515: 'LEQUAL',
  516: 'GREATER',
  517: 'NOTEQUAL',
  518: 'GEQUAL',
  519: 'ALWAYS',
  768: 'SRC_COLOR',
  769: 'ONE_MINUS_SRC_COLOR',
  770: 'SRC_ALPHA',
  771: 'ONE_MINUS_SRC_ALPHA',
  772: 'DST_ALPHA',
  773: 'ONE_MINUS_DST_ALPHA',
  774: 'DST_COLOR',
  775: 'ONE_MINUS_DST_COLOR',
  776: 'SRC_ALPHA_SATURATE',
  1024: 'STENCIL_BUFFER_BIT',
  1028: 'FRONT',
  1029: 'BACK',
  1032: 'FRONT_AND_BACK',
  1280: 'INVALID_ENUM',
  1281: 'INVALID_VALUE',
  1282: 'INVALID_OPERATION',
  1285: 'OUT_OF_MEMORY',
  1286: 'INVALID_FRAMEBUFFER_OPERATION',
  2304: 'CW',
  2305: 'CCW',
  2849: 'LINE_WIDTH',
  2884: 'CULL_FACE',
  2885: 'CULL_FACE_MODE',
  2886: 'FRONT_FACE',
  2928: 'DEPTH_RANGE',
  2929: 'DEPTH_TEST',
  2930: 'DEPTH_WRITEMASK',
  2931: 'DEPTH_CLEAR_VALUE',
  2932: 'DEPTH_FUNC',
  2960: 'STENCIL_TEST',
  2961: 'STENCIL_CLEAR_VALUE',
  2962: 'STENCIL_FUNC',
  2963: 'STENCIL_VALUE_MASK',
  2964: 'STENCIL_FAIL',
  2965: 'STENCIL_PASS_DEPTH_FAIL',
  2966: 'STENCIL_PASS_DEPTH_PASS',
  2967: 'STENCIL_REF',
  2968: 'STENCIL_WRITEMASK',
  2978: 'VIEWPORT',
  3024: 'DITHER',
  3042: 'BLEND',
  3088: 'SCISSOR_BOX',
  3089: 'SCISSOR_TEST',
  3106: 'COLOR_CLEAR_VALUE',
  3107: 'COLOR_WRITEMASK',
  3317: 'UNPACK_ALIGNMENT',
  3333: 'PACK_ALIGNMENT',
  3379: 'MAX_TEXTURE_SIZE',
  3386: 'MAX_VIEWPORT_DIMS',
  3408: 'SUBPIXEL_BITS',
  3410: 'RED_BITS',
  3411: 'GREEN_BITS',
  3412: 'BLUE_BITS',
  3413: 'ALPHA_BITS',
  3414: 'DEPTH_BITS',
  3415: 'STENCIL_BITS',
  3553: 'TEXTURE_2D',
  4352: 'DONT_CARE',
  4353: 'FASTEST',
  4354: 'NICEST',
  5120: 'BYTE',
  5121: 'UNSIGNED_BYTE',
  5122: 'SHORT',
  5123: 'UNSIGNED_SHORT',
  5124: 'INT',
  5125: 'UNSIGNED_INT',
  5126: 'FLOAT',
  5386: 'INVERT',
  5890: 'TEXTURE',
  6401: 'STENCIL_INDEX',
  6402: 'DEPTH_COMPONENT',
  6406: 'ALPHA',
  6407: 'RGB',
  6408: 'RGBA',
  6409: 'LUMINANCE',
  6410: 'LUMINANCE_ALPHA',
  7680: 'KEEP',
  7681: 'REPLACE',
  7682: 'INCR',
  7683: 'DECR',
  7936: 'VENDOR',
  7937: 'RENDERER',
  7938: 'VERSION',
  9728: 'NEAREST',
  9729: 'LINEAR',
  9984: 'NEAREST_MIPMAP_NEAREST',
  9985: 'LINEAR_MIPMAP_NEAREST',
  9986: 'NEAREST_MIPMAP_LINEAR',
  9987: 'LINEAR_MIPMAP_LINEAR',
  10240: 'TEXTURE_MAG_FILTER',
  10241: 'TEXTURE_MIN_FILTER',
  10242: 'TEXTURE_WRAP_S',
  10243: 'TEXTURE_WRAP_T',
  10497: 'REPEAT',
  10752: 'POLYGON_OFFSET_UNITS',
  16384: 'COLOR_BUFFER_BIT',
  32769: 'CONSTANT_COLOR',
  32770: 'ONE_MINUS_CONSTANT_COLOR',
  32771: 'CONSTANT_ALPHA',
  32772: 'ONE_MINUS_CONSTANT_ALPHA',
  32773: 'BLEND_COLOR',
  32774: 'FUNC_ADD',
  32777: 'BLEND_EQUATION_RGB',
  32778: 'FUNC_SUBTRACT',
  32779: 'FUNC_REVERSE_SUBTRACT',
  32819: 'UNSIGNED_SHORT_4_4_4_4',
  32820: 'UNSIGNED_SHORT_5_5_5_1',
  32823: 'POLYGON_OFFSET_FILL',
  32824: 'POLYGON_OFFSET_FACTOR',
  32854: 'RGBA4',
  32855: 'RGB5_A1',
  32873: 'TEXTURE_BINDING_2D',
  32926: 'SAMPLE_ALPHA_TO_COVERAGE',
  32928: 'SAMPLE_COVERAGE',
  32936: 'SAMPLE_BUFFERS',
  32937: 'SAMPLES',
  32938: 'SAMPLE_COVERAGE_VALUE',
  32939: 'SAMPLE_COVERAGE_INVERT',
  32968: 'BLEND_DST_RGB',
  32969: 'BLEND_SRC_RGB',
  32970: 'BLEND_DST_ALPHA',
  32971: 'BLEND_SRC_ALPHA',
  33071: 'CLAMP_TO_EDGE',
  33170: 'GENERATE_MIPMAP_HINT',
  33189: 'DEPTH_COMPONENT16',
  33306: 'DEPTH_STENCIL_ATTACHMENT',
  33635: 'UNSIGNED_SHORT_5_6_5',
  33648: 'MIRRORED_REPEAT',
  33901: 'ALIASED_POINT_SIZE_RANGE',
  33902: 'ALIASED_LINE_WIDTH_RANGE',
  33984: 'TEXTURE0',
  33985: 'TEXTURE1',
  33986: 'TEXTURE2',
  33987: 'TEXTURE3',
  33988: 'TEXTURE4',
  33989: 'TEXTURE5',
  33990: 'TEXTURE6',
  33991: 'TEXTURE7',
  33992: 'TEXTURE8',
  33993: 'TEXTURE9',
  33994: 'TEXTURE10',
  33995: 'TEXTURE11',
  33996: 'TEXTURE12',
  33997: 'TEXTURE13',
  33998: 'TEXTURE14',
  33999: 'TEXTURE15',
  34000: 'TEXTURE16',
  34001: 'TEXTURE17',
  34002: 'TEXTURE18',
  34003: 'TEXTURE19',
  34004: 'TEXTURE20',
  34005: 'TEXTURE21',
  34006: 'TEXTURE22',
  34007: 'TEXTURE23',
  34008: 'TEXTURE24',
  34009: 'TEXTURE25',
  34010: 'TEXTURE26',
  34011: 'TEXTURE27',
  34012: 'TEXTURE28',
  34013: 'TEXTURE29',
  34014: 'TEXTURE30',
  34015: 'TEXTURE31',
  34016: 'ACTIVE_TEXTURE',
  34024: 'MAX_RENDERBUFFER_SIZE',
  34041: 'DEPTH_STENCIL',
  34055: 'INCR_WRAP',
  34056: 'DECR_WRAP',
  34067: 'TEXTURE_CUBE_MAP',
  34068: 'TEXTURE_BINDING_CUBE_MAP',
  34069: 'TEXTURE_CUBE_MAP_POSITIVE_X',
  34070: 'TEXTURE_CUBE_MAP_NEGATIVE_X',
  34071: 'TEXTURE_CUBE_MAP_POSITIVE_Y',
  34072: 'TEXTURE_CUBE_MAP_NEGATIVE_Y',
  34073: 'TEXTURE_CUBE_MAP_POSITIVE_Z',
  34074: 'TEXTURE_CUBE_MAP_NEGATIVE_Z',
  34076: 'MAX_CUBE_MAP_TEXTURE_SIZE',
  34338: 'VERTEX_ATTRIB_ARRAY_ENABLED',
  34339: 'VERTEX_ATTRIB_ARRAY_SIZE',
  34340: 'VERTEX_ATTRIB_ARRAY_STRIDE',
  34341: 'VERTEX_ATTRIB_ARRAY_TYPE',
  34342: 'CURRENT_VERTEX_ATTRIB',
  34373: 'VERTEX_ATTRIB_ARRAY_POINTER',
  34466: 'NUM_COMPRESSED_TEXTURE_FORMATS',
  34467: 'COMPRESSED_TEXTURE_FORMATS',
  34660: 'BUFFER_SIZE',
  34661: 'BUFFER_USAGE',
  34816: 'STENCIL_BACK_FUNC',
  34817: 'STENCIL_BACK_FAIL',
  34818: 'STENCIL_BACK_PASS_DEPTH_FAIL',
  34819: 'STENCIL_BACK_PASS_DEPTH_PASS',
  34877: 'BLEND_EQUATION_ALPHA',
  34921: 'MAX_VERTEX_ATTRIBS',
  34922: 'VERTEX_ATTRIB_ARRAY_NORMALIZED',
  34930: 'MAX_TEXTURE_IMAGE_UNITS',
  34962: 'ARRAY_BUFFER',
  34963: 'ELEMENT_ARRAY_BUFFER',
  34964: 'ARRAY_BUFFER_BINDING',
  34965: 'ELEMENT_ARRAY_BUFFER_BINDING',
  34975: 'VERTEX_ATTRIB_ARRAY_BUFFER_BINDING',
  35040: 'STREAM_DRAW',
  35044: 'STATIC_DRAW',
  35048: 'DYNAMIC_DRAW',
  35632: 'FRAGMENT_SHADER',
  35633: 'VERTEX_SHADER',
  35660: 'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
  35661: 'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
  35663: 'SHADER_TYPE',
  35664: 'FLOAT_VEC2',
  35665: 'FLOAT_VEC3',
  35666: 'FLOAT_VEC4',
  35667: 'INT_VEC2',
  35668: 'INT_VEC3',
  35669: 'INT_VEC4',
  35670: 'BOOL',
  35671: 'BOOL_VEC2',
  35672: 'BOOL_VEC3',
  35673: 'BOOL_VEC4',
  35674: 'FLOAT_MAT2',
  35675: 'FLOAT_MAT3',
  35676: 'FLOAT_MAT4',
  35678: 'SAMPLER_2D',
  35680: 'SAMPLER_CUBE',
  35712: 'DELETE_STATUS',
  35713: 'COMPILE_STATUS',
  35714: 'LINK_STATUS',
  35715: 'VALIDATE_STATUS',
  35716: 'INFO_LOG_LENGTH',
  35717: 'ATTACHED_SHADERS',
  35718: 'ACTIVE_UNIFORMS',
  35719: 'ACTIVE_UNIFORM_MAX_LENGTH',
  35720: 'SHADER_SOURCE_LENGTH',
  35721: 'ACTIVE_ATTRIBUTES',
  35722: 'ACTIVE_ATTRIBUTE_MAX_LENGTH',
  35724: 'SHADING_LANGUAGE_VERSION',
  35725: 'CURRENT_PROGRAM',
  36003: 'STENCIL_BACK_REF',
  36004: 'STENCIL_BACK_VALUE_MASK',
  36005: 'STENCIL_BACK_WRITEMASK',
  36006: 'FRAMEBUFFER_BINDING',
  36007: 'RENDERBUFFER_BINDING',
  36048: 'FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE',
  36049: 'FRAMEBUFFER_ATTACHMENT_OBJECT_NAME',
  36050: 'FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL',
  36051: 'FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE',
  36053: 'FRAMEBUFFER_COMPLETE',
  36054: 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT',
  36055: 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT',
  36057: 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS',
  36061: 'FRAMEBUFFER_UNSUPPORTED',
  36064: 'COLOR_ATTACHMENT0',
  36096: 'DEPTH_ATTACHMENT',
  36128: 'STENCIL_ATTACHMENT',
  36160: 'FRAMEBUFFER',
  36161: 'RENDERBUFFER',
  36162: 'RENDERBUFFER_WIDTH',
  36163: 'RENDERBUFFER_HEIGHT',
  36164: 'RENDERBUFFER_INTERNAL_FORMAT',
  36168: 'STENCIL_INDEX8',
  36176: 'RENDERBUFFER_RED_SIZE',
  36177: 'RENDERBUFFER_GREEN_SIZE',
  36178: 'RENDERBUFFER_BLUE_SIZE',
  36179: 'RENDERBUFFER_ALPHA_SIZE',
  36180: 'RENDERBUFFER_DEPTH_SIZE',
  36181: 'RENDERBUFFER_STENCIL_SIZE',
  36194: 'RGB565',
  36336: 'LOW_FLOAT',
  36337: 'MEDIUM_FLOAT',
  36338: 'HIGH_FLOAT',
  36339: 'LOW_INT',
  36340: 'MEDIUM_INT',
  36341: 'HIGH_INT',
  36346: 'SHADER_COMPILER',
  36347: 'MAX_VERTEX_UNIFORM_VECTORS',
  36348: 'MAX_VARYING_VECTORS',
  36349: 'MAX_FRAGMENT_UNIFORM_VECTORS',
  37440: 'UNPACK_FLIP_Y_WEBGL',
  37441: 'UNPACK_PREMULTIPLY_ALPHA_WEBGL',
  37442: 'CONTEXT_LOST_WEBGL',
  37443: 'UNPACK_COLORSPACE_CONVERSION_WEBGL',
  37444: 'BROWSER_DEFAULT_WEBGL'
};

var lookup = function lookupConstant (number) {
  return numbers[number]
};

var literals = [
  // current
    'precision'
  , 'highp'
  , 'mediump'
  , 'lowp'
  , 'attribute'
  , 'const'
  , 'uniform'
  , 'varying'
  , 'break'
  , 'continue'
  , 'do'
  , 'for'
  , 'while'
  , 'if'
  , 'else'
  , 'in'
  , 'out'
  , 'inout'
  , 'float'
  , 'int'
  , 'void'
  , 'bool'
  , 'true'
  , 'false'
  , 'discard'
  , 'return'
  , 'mat2'
  , 'mat3'
  , 'mat4'
  , 'vec2'
  , 'vec3'
  , 'vec4'
  , 'ivec2'
  , 'ivec3'
  , 'ivec4'
  , 'bvec2'
  , 'bvec3'
  , 'bvec4'
  , 'sampler1D'
  , 'sampler2D'
  , 'sampler3D'
  , 'samplerCube'
  , 'sampler1DShadow'
  , 'sampler2DShadow'
  , 'struct'

  // future
  , 'asm'
  , 'class'
  , 'union'
  , 'enum'
  , 'typedef'
  , 'template'
  , 'this'
  , 'packed'
  , 'goto'
  , 'switch'
  , 'default'
  , 'inline'
  , 'noinline'
  , 'volatile'
  , 'public'
  , 'static'
  , 'extern'
  , 'external'
  , 'interface'
  , 'long'
  , 'short'
  , 'double'
  , 'half'
  , 'fixed'
  , 'unsigned'
  , 'input'
  , 'output'
  , 'hvec2'
  , 'hvec3'
  , 'hvec4'
  , 'dvec2'
  , 'dvec3'
  , 'dvec4'
  , 'fvec2'
  , 'fvec3'
  , 'fvec4'
  , 'sampler2DRect'
  , 'sampler3DRect'
  , 'sampler2DRectShadow'
  , 'sizeof'
  , 'cast'
  , 'namespace'
  , 'using'
];

var operators = [
    '<<='
  , '>>='
  , '++'
  , '--'
  , '<<'
  , '>>'
  , '<='
  , '>='
  , '=='
  , '!='
  , '&&'
  , '||'
  , '+='
  , '-='
  , '*='
  , '/='
  , '%='
  , '&='
  , '^^'
  , '^='
  , '|='
  , '('
  , ')'
  , '['
  , ']'
  , '.'
  , '!'
  , '~'
  , '*'
  , '/'
  , '%'
  , '+'
  , '-'
  , '<'
  , '>'
  , '&'
  , '^'
  , '|'
  , '?'
  , ':'
  , '='
  , ','
  , ';'
  , '{'
  , '}'
];

var builtins = [
  // Keep this list sorted
  'abs'
  , 'acos'
  , 'all'
  , 'any'
  , 'asin'
  , 'atan'
  , 'ceil'
  , 'clamp'
  , 'cos'
  , 'cross'
  , 'dFdx'
  , 'dFdy'
  , 'degrees'
  , 'distance'
  , 'dot'
  , 'equal'
  , 'exp'
  , 'exp2'
  , 'faceforward'
  , 'floor'
  , 'fract'
  , 'gl_BackColor'
  , 'gl_BackLightModelProduct'
  , 'gl_BackLightProduct'
  , 'gl_BackMaterial'
  , 'gl_BackSecondaryColor'
  , 'gl_ClipPlane'
  , 'gl_ClipVertex'
  , 'gl_Color'
  , 'gl_DepthRange'
  , 'gl_DepthRangeParameters'
  , 'gl_EyePlaneQ'
  , 'gl_EyePlaneR'
  , 'gl_EyePlaneS'
  , 'gl_EyePlaneT'
  , 'gl_Fog'
  , 'gl_FogCoord'
  , 'gl_FogFragCoord'
  , 'gl_FogParameters'
  , 'gl_FragColor'
  , 'gl_FragCoord'
  , 'gl_FragData'
  , 'gl_FragDepth'
  , 'gl_FragDepthEXT'
  , 'gl_FrontColor'
  , 'gl_FrontFacing'
  , 'gl_FrontLightModelProduct'
  , 'gl_FrontLightProduct'
  , 'gl_FrontMaterial'
  , 'gl_FrontSecondaryColor'
  , 'gl_LightModel'
  , 'gl_LightModelParameters'
  , 'gl_LightModelProducts'
  , 'gl_LightProducts'
  , 'gl_LightSource'
  , 'gl_LightSourceParameters'
  , 'gl_MaterialParameters'
  , 'gl_MaxClipPlanes'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxDrawBuffers'
  , 'gl_MaxFragmentUniformComponents'
  , 'gl_MaxLights'
  , 'gl_MaxTextureCoords'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxTextureUnits'
  , 'gl_MaxVaryingFloats'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxVertexUniformComponents'
  , 'gl_ModelViewMatrix'
  , 'gl_ModelViewMatrixInverse'
  , 'gl_ModelViewMatrixInverseTranspose'
  , 'gl_ModelViewMatrixTranspose'
  , 'gl_ModelViewProjectionMatrix'
  , 'gl_ModelViewProjectionMatrixInverse'
  , 'gl_ModelViewProjectionMatrixInverseTranspose'
  , 'gl_ModelViewProjectionMatrixTranspose'
  , 'gl_MultiTexCoord0'
  , 'gl_MultiTexCoord1'
  , 'gl_MultiTexCoord2'
  , 'gl_MultiTexCoord3'
  , 'gl_MultiTexCoord4'
  , 'gl_MultiTexCoord5'
  , 'gl_MultiTexCoord6'
  , 'gl_MultiTexCoord7'
  , 'gl_Normal'
  , 'gl_NormalMatrix'
  , 'gl_NormalScale'
  , 'gl_ObjectPlaneQ'
  , 'gl_ObjectPlaneR'
  , 'gl_ObjectPlaneS'
  , 'gl_ObjectPlaneT'
  , 'gl_Point'
  , 'gl_PointCoord'
  , 'gl_PointParameters'
  , 'gl_PointSize'
  , 'gl_Position'
  , 'gl_ProjectionMatrix'
  , 'gl_ProjectionMatrixInverse'
  , 'gl_ProjectionMatrixInverseTranspose'
  , 'gl_ProjectionMatrixTranspose'
  , 'gl_SecondaryColor'
  , 'gl_TexCoord'
  , 'gl_TextureEnvColor'
  , 'gl_TextureMatrix'
  , 'gl_TextureMatrixInverse'
  , 'gl_TextureMatrixInverseTranspose'
  , 'gl_TextureMatrixTranspose'
  , 'gl_Vertex'
  , 'greaterThan'
  , 'greaterThanEqual'
  , 'inversesqrt'
  , 'length'
  , 'lessThan'
  , 'lessThanEqual'
  , 'log'
  , 'log2'
  , 'matrixCompMult'
  , 'max'
  , 'min'
  , 'mix'
  , 'mod'
  , 'normalize'
  , 'not'
  , 'notEqual'
  , 'pow'
  , 'radians'
  , 'reflect'
  , 'refract'
  , 'sign'
  , 'sin'
  , 'smoothstep'
  , 'sqrt'
  , 'step'
  , 'tan'
  , 'texture2D'
  , 'texture2DLod'
  , 'texture2DProj'
  , 'texture2DProjLod'
  , 'textureCube'
  , 'textureCubeLod'
  , 'texture2DLodEXT'
  , 'texture2DProjLodEXT'
  , 'textureCubeLodEXT'
  , 'texture2DGradEXT'
  , 'texture2DProjGradEXT'
  , 'textureCubeGradEXT'
];

var literals300es = literals.slice().concat([
   'layout'
  , 'centroid'
  , 'smooth'
  , 'case'
  , 'mat2x2'
  , 'mat2x3'
  , 'mat2x4'
  , 'mat3x2'
  , 'mat3x3'
  , 'mat3x4'
  , 'mat4x2'
  , 'mat4x3'
  , 'mat4x4'
  , 'uint'
  , 'uvec2'
  , 'uvec3'
  , 'uvec4'
  , 'samplerCubeShadow'
  , 'sampler2DArray'
  , 'sampler2DArrayShadow'
  , 'isampler2D'
  , 'isampler3D'
  , 'isamplerCube'
  , 'isampler2DArray'
  , 'usampler2D'
  , 'usampler3D'
  , 'usamplerCube'
  , 'usampler2DArray'
  , 'coherent'
  , 'restrict'
  , 'readonly'
  , 'writeonly'
  , 'resource'
  , 'atomic_uint'
  , 'noperspective'
  , 'patch'
  , 'sample'
  , 'subroutine'
  , 'common'
  , 'partition'
  , 'active'
  , 'filter'
  , 'image1D'
  , 'image2D'
  , 'image3D'
  , 'imageCube'
  , 'iimage1D'
  , 'iimage2D'
  , 'iimage3D'
  , 'iimageCube'
  , 'uimage1D'
  , 'uimage2D'
  , 'uimage3D'
  , 'uimageCube'
  , 'image1DArray'
  , 'image2DArray'
  , 'iimage1DArray'
  , 'iimage2DArray'
  , 'uimage1DArray'
  , 'uimage2DArray'
  , 'image1DShadow'
  , 'image2DShadow'
  , 'image1DArrayShadow'
  , 'image2DArrayShadow'
  , 'imageBuffer'
  , 'iimageBuffer'
  , 'uimageBuffer'
  , 'sampler1DArray'
  , 'sampler1DArrayShadow'
  , 'isampler1D'
  , 'isampler1DArray'
  , 'usampler1D'
  , 'usampler1DArray'
  , 'isampler2DRect'
  , 'usampler2DRect'
  , 'samplerBuffer'
  , 'isamplerBuffer'
  , 'usamplerBuffer'
  , 'sampler2DMS'
  , 'isampler2DMS'
  , 'usampler2DMS'
  , 'sampler2DMSArray'
  , 'isampler2DMSArray'
  , 'usampler2DMSArray'
]);

// 300es builtins/reserved words that were previously valid in v100
var v100$1 = builtins;

// The texture2D|Cube functions have been removed
// And the gl_ features are updated
v100$1 = v100$1.slice().filter(function (b) {
  return !/^(gl\_|texture)/.test(b)
});

var builtins300es = v100$1.concat([
  // the updated gl_ constants
    'gl_VertexID'
  , 'gl_InstanceID'
  , 'gl_Position'
  , 'gl_PointSize'
  , 'gl_FragCoord'
  , 'gl_FrontFacing'
  , 'gl_FragDepth'
  , 'gl_PointCoord'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexUniformVectors'
  , 'gl_MaxVertexOutputVectors'
  , 'gl_MaxFragmentInputVectors'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxFragmentUniformVectors'
  , 'gl_MaxDrawBuffers'
  , 'gl_MinProgramTexelOffset'
  , 'gl_MaxProgramTexelOffset'
  , 'gl_DepthRangeParameters'
  , 'gl_DepthRange'

  // other builtins
  , 'trunc'
  , 'round'
  , 'roundEven'
  , 'isnan'
  , 'isinf'
  , 'floatBitsToInt'
  , 'floatBitsToUint'
  , 'intBitsToFloat'
  , 'uintBitsToFloat'
  , 'packSnorm2x16'
  , 'unpackSnorm2x16'
  , 'packUnorm2x16'
  , 'unpackUnorm2x16'
  , 'packHalf2x16'
  , 'unpackHalf2x16'
  , 'outerProduct'
  , 'transpose'
  , 'determinant'
  , 'inverse'
  , 'texture'
  , 'textureSize'
  , 'textureProj'
  , 'textureLod'
  , 'textureOffset'
  , 'texelFetch'
  , 'texelFetchOffset'
  , 'textureProjOffset'
  , 'textureLodOffset'
  , 'textureProjLod'
  , 'textureProjLodOffset'
  , 'textureGrad'
  , 'textureGradOffset'
  , 'textureProjGrad'
  , 'textureProjGradOffset'
]);

var glslTokenizer = tokenize;



var NORMAL = 999;
var TOKEN = 9999;
var BLOCK_COMMENT = 0;
var LINE_COMMENT = 1;
var PREPROCESSOR = 2;
var OPERATOR = 3;
var INTEGER = 4;
var FLOAT = 5;
var IDENT = 6;
var BUILTIN = 7;
var KEYWORD = 8;
var WHITESPACE = 9;
var EOF = 10;
var HEX = 11;

var map = [
    'block-comment'
  , 'line-comment'
  , 'preprocessor'
  , 'operator'
  , 'integer'
  , 'float'
  , 'ident'
  , 'builtin'
  , 'keyword'
  , 'whitespace'
  , 'eof'
  , 'integer'
];

function tokenize(opt) {
  var i = 0
    , total = 0
    , mode = NORMAL
    , c
    , last
    , content = []
    , tokens = []
    , token_idx = 0
    , token_offs = 0
    , line = 1
    , col = 0
    , start = 0
    , isnum = false
    , isoperator = false
    , input = ''
    , len;

  opt = opt || {};
  var allBuiltins = builtins;
  var allLiterals = literals;
  if (opt.version === '300 es') {
    allBuiltins = builtins300es;
    allLiterals = literals300es;
  }

  return function(data) {
    tokens = [];
    if (data !== null) return write(data.replace ? data.replace(/\r\n/g, '\n') : data)
    return end()
  }

  function token(data) {
    if (data.length) {
      tokens.push({
        type: map[mode]
      , data: data
      , position: start
      , line: line
      , column: col
      });
    }
  }

  function write(chunk) {
    i = 0;
    input += chunk;
    len = input.length;

    var last;

    while(c = input[i], i < len) {
      last = i;

      switch(mode) {
        case BLOCK_COMMENT: i = block_comment(); break
        case LINE_COMMENT: i = line_comment(); break
        case PREPROCESSOR: i = preprocessor(); break
        case OPERATOR: i = operator(); break
        case INTEGER: i = integer(); break
        case HEX: i = hex(); break
        case FLOAT: i = decimal(); break
        case TOKEN: i = readtoken(); break
        case WHITESPACE: i = whitespace(); break
        case NORMAL: i = normal(); break
      }

      if(last !== i) {
        switch(input[last]) {
          case '\n': col = 0; ++line; break
          default: ++col; break
        }
      }
    }

    total += i;
    input = input.slice(i);
    return tokens
  }

  function end(chunk) {
    if(content.length) {
      token(content.join(''));
    }

    mode = EOF;
    token('(eof)');
    return tokens
  }

  function normal() {
    content = content.length ? [] : content;

    if(last === '/' && c === '*') {
      start = total + i - 1;
      mode = BLOCK_COMMENT;
      last = c;
      return i + 1
    }

    if(last === '/' && c === '/') {
      start = total + i - 1;
      mode = LINE_COMMENT;
      last = c;
      return i + 1
    }

    if(c === '#') {
      mode = PREPROCESSOR;
      start = total + i;
      return i
    }

    if(/\s/.test(c)) {
      mode = WHITESPACE;
      start = total + i;
      return i
    }

    isnum = /\d/.test(c);
    isoperator = /[^\w_]/.test(c);

    start = total + i;
    mode = isnum ? INTEGER : isoperator ? OPERATOR : TOKEN;
    return i
  }

  function whitespace() {
    if(/[^\s]/g.test(c)) {
      token(content.join(''));
      mode = NORMAL;
      return i
    }
    content.push(c);
    last = c;
    return i + 1
  }

  function preprocessor() {
    if((c === '\r' || c === '\n') && last !== '\\') {
      token(content.join(''));
      mode = NORMAL;
      return i
    }
    content.push(c);
    last = c;
    return i + 1
  }

  function line_comment() {
    return preprocessor()
  }

  function block_comment() {
    if(c === '/' && last === '*') {
      content.push(c);
      token(content.join(''));
      mode = NORMAL;
      return i + 1
    }

    content.push(c);
    last = c;
    return i + 1
  }

  function operator() {
    if(last === '.' && /\d/.test(c)) {
      mode = FLOAT;
      return i
    }

    if(last === '/' && c === '*') {
      mode = BLOCK_COMMENT;
      return i
    }

    if(last === '/' && c === '/') {
      mode = LINE_COMMENT;
      return i
    }

    if(c === '.' && content.length) {
      while(determine_operator(content));

      mode = FLOAT;
      return i
    }

    if(c === ';' || c === ')' || c === '(') {
      if(content.length) while(determine_operator(content));
      token(c);
      mode = NORMAL;
      return i + 1
    }

    var is_composite_operator = content.length === 2 && c !== '=';
    if(/[\w_\d\s]/.test(c) || is_composite_operator) {
      while(determine_operator(content));
      mode = NORMAL;
      return i
    }

    content.push(c);
    last = c;
    return i + 1
  }

  function determine_operator(buf) {
    var j = 0
      , idx
      , res;

    do {
      idx = operators.indexOf(buf.slice(0, buf.length + j).join(''));
      res = operators[idx];

      if(idx === -1) {
        if(j-- + buf.length > 0) continue
        res = buf.slice(0, 1).join('');
      }

      token(res);

      start += res.length;
      content = content.slice(res.length);
      return content.length
    } while(1)
  }

  function hex() {
    if(/[^a-fA-F0-9]/.test(c)) {
      token(content.join(''));
      mode = NORMAL;
      return i
    }

    content.push(c);
    last = c;
    return i + 1
  }

  function integer() {
    if(c === '.') {
      content.push(c);
      mode = FLOAT;
      last = c;
      return i + 1
    }

    if(/[eE]/.test(c)) {
      content.push(c);
      mode = FLOAT;
      last = c;
      return i + 1
    }

    if(c === 'x' && content.length === 1 && content[0] === '0') {
      mode = HEX;
      content.push(c);
      last = c;
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''));
      mode = NORMAL;
      return i
    }

    content.push(c);
    last = c;
    return i + 1
  }

  function decimal() {
    if(c === 'f') {
      content.push(c);
      last = c;
      i += 1;
    }

    if(/[eE]/.test(c)) {
      content.push(c);
      last = c;
      return i + 1
    }

    if (c === '-' && /[eE]/.test(last)) {
      content.push(c);
      last = c;
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''));
      mode = NORMAL;
      return i
    }

    content.push(c);
    last = c;
    return i + 1
  }

  function readtoken() {
    if(/[^\d\w_]/.test(c)) {
      var contentstr = content.join('');
      if(allLiterals.indexOf(contentstr) > -1) {
        mode = KEYWORD;
      } else if(allBuiltins.indexOf(contentstr) > -1) {
        mode = BUILTIN;
      } else {
        mode = IDENT;
      }
      token(content.join(''));
      mode = NORMAL;
      return i
    }
    content.push(c);
    last = c;
    return i + 1
  }
}

var string = tokenizeString;

function tokenizeString(str, opt) {
  var generator = glslTokenizer(opt);
  var tokens = [];

  tokens = tokens.concat(generator(str));
  tokens = tokens.concat(generator(null));

  return tokens
}

var atobNode = function atob(str) {
  return new Buffer(str, 'base64').toString('utf8')
};

var glslShaderName = getName;

function getName(src) {
  var tokens = Array.isArray(src)
    ? src
    : string(src);

  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (token.type !== 'preprocessor') continue
    var match = token.data.match(/\#define\s+SHADER_NAME(_B64)?\s+(.+)$/);
    if (!match) continue
    if (!match[2]) continue

    var b64  = match[1];
    var name = match[2];

    return (b64 ? atobNode(name) : name).trim()
  }
}

/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

/**
 * Results cache
 */

var res = '';
var cache$1;

/**
 * Expose `repeat`
 */

var repeatString = repeat;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('repeat-string expects a string.');
  }

  // cover common, quick use cases
  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache$1 !== str || typeof cache$1 === 'undefined') {
    cache$1 = str;
    res = '';
  }

  while (max > res.length && num > 0) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    if (!num) break;
    str += str;
  }

  return res.substr(0, max);
}

var padLeft = function padLeft(str, num, ch) {
  ch = typeof ch !== 'undefined' ? (ch + '') : ' ';
  return repeatString(ch, num) + str;
};

var addLineNumbers_1 = addLineNumbers;
function addLineNumbers (string, start, delim) {
  start = typeof start === 'number' ? start : 1;
  delim = delim || ': ';

  var lines = string.split(/\r?\n/);
  var totalDigits = String(lines.length + start - 1).length;
  return lines.map(function (line, i) {
    var c = i + start;
    var digits = String(c).length;
    var prefix = padLeft(c, totalDigits - digits);
    return prefix + delim + line
  }).join('\n')
}

var sprintf = sprintf$1.sprintf;




var glFormatCompilerError = formatCompilerError;

function formatCompilerError(errLog, src, type) {
    var name = glslShaderName(src) || 'of unknown name (see npm glsl-shader-name)';

    var typeName = 'unknown type';
    if (type !== undefined) {
        typeName = type === lookup.FRAGMENT_SHADER ? 'fragment' : 'vertex';
    }

    var longForm = sprintf('Error compiling %s shader %s:\n', typeName, name);
    var shortForm = sprintf("%s%s", longForm, errLog);

    var errorStrings = errLog.split('\n');
    var errors = {};

    for (var i = 0; i < errorStrings.length; i++) {
        var errorString = errorStrings[i];
        if (errorString === '') continue;
        var lineNo = parseInt(errorString.split(':')[2]);
        if (isNaN(lineNo)) {
            throw new Error(sprintf('Could not parse error: %s', errorString));
        }
        errors[lineNo] = errorString;
    }

    var lines = addLineNumbers_1(src).split('\n');

    for (var i = 0; i < lines.length; i++) {
        if (!errors[i+3] && !errors[i+2] && !errors[i+1]) continue;
        var line = lines[i];
        longForm += line + '\n';
        if (errors[i+1]) {
            var e = errors[i+1];
            e = e.substr(e.split(':', 3).join(':').length + 1).trim();
            longForm += sprintf('^^^ %s\n\n', e);
        }
    }

    return {
        long: longForm.trim(),
        short: shortForm.trim()
    };
}

var hiddenStore_1 = hiddenStore;

function hiddenStore(obj, key) {
    var store = { identity: key };
    var valueOf = obj.valueOf;

    Object.defineProperty(obj, "valueOf", {
        value: function (value) {
            return value !== key ?
                valueOf.apply(this, arguments) : store;
        },
        writable: true
    });

    return store;
}

var createStore_1 = createStore;

function createStore() {
    var key = {};

    return function (obj) {
        if ((typeof obj !== 'object' || obj === null) &&
            typeof obj !== 'function'
        ) {
            throw new Error('Weakmap-shim: Key must be object')
        }

        var store = obj.valueOf(key);
        return store && store.identity === key ?
            store : hiddenStore_1(obj, key);
    };
}

// Original - @Gozola. 
// https://gist.github.com/Gozala/1269991
// This is a reimplemented version (with a few bug fixes).



var weakmapShim = weakMap$1;

function weakMap$1() {
    var privates = createStore_1();

    return {
        'get': function (key, fallback) {
            var store = privates(key);
            return store.hasOwnProperty('value') ?
                store.value : fallback
        },
        'set': function (key, value) {
            privates(key).value = value;
        },
        'has': function(key) {
            return 'value' in privates(key);
        },
        'delete': function (key) {
            return delete privates(key).value;
        }
    }
}

var shader   = getShaderReference;
var program  = createProgram;




var weakMap = typeof WeakMap === 'undefined' ? weakmapShim : WeakMap;
var CACHE = new weakMap();

var SHADER_COUNTER = 0;

function ShaderReference(id, src, type, shader, programs, count, cache) {
  this.id       = id;
  this.src      = src;
  this.type     = type;
  this.shader   = shader;
  this.count    = count;
  this.programs = [];
  this.cache    = cache;
}

ShaderReference.prototype.dispose = function() {
  if(--this.count === 0) {
    var cache    = this.cache;
    var gl       = cache.gl;

    //Remove program references
    var programs = this.programs;
    for(var i=0, n=programs.length; i<n; ++i) {
      var p = cache.programs[programs[i]];
      if(p) {
        delete cache.programs[i];
        gl.deleteProgram(p);
      }
    }

    //Remove shader reference
    gl.deleteShader(this.shader);
    delete cache.shaders[(this.type === gl.FRAGMENT_SHADER)|0][this.src];
  }
};

function ContextCache(gl) {
  this.gl       = gl;
  this.shaders  = [{}, {}];
  this.programs = {};
}

var proto$3 = ContextCache.prototype;

function compileShader(gl, type, src) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    var errLog = gl.getShaderInfoLog(shader);
    try {
        var fmt = glFormatCompilerError(errLog, src, type);
    } catch (e){
        console.warn('Failed to format compiler error: ' + e);
        throw new GLError_1(errLog, 'Error compiling shader:\n' + errLog)
    }
    throw new GLError_1(errLog, fmt.short, fmt.long)
  }
  return shader
}

proto$3.getShaderReference = function(type, src) {
  var gl      = this.gl;
  var shaders = this.shaders[(type === gl.FRAGMENT_SHADER)|0];
  var shader  = shaders[src];
  if(!shader || !gl.isShader(shader.shader)) {
    var shaderObj = compileShader(gl, type, src);
    shader = shaders[src] = new ShaderReference(
      SHADER_COUNTER++,
      src,
      type,
      shaderObj,
      [],
      1,
      this);
  } else {
    shader.count += 1;
  }
  return shader
};

function linkProgram(gl, vshader, fshader, attribs, locations) {
  var program = gl.createProgram();
  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  for(var i=0; i<attribs.length; ++i) {
    gl.bindAttribLocation(program, locations[i], attribs[i]);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var errLog = gl.getProgramInfoLog(program);
    throw new GLError_1(errLog, 'Error linking program: ' + errLog)
  }
  return program
}

proto$3.getProgram = function(vref, fref, attribs, locations) {
  var token = [vref.id, fref.id, attribs.join(':'), locations.join(':')].join('@');
  var prog  = this.programs[token];
  if(!prog || !this.gl.isProgram(prog)) {
    this.programs[token] = prog = linkProgram(
      this.gl,
      vref.shader,
      fref.shader,
      attribs,
      locations);
    vref.programs.push(token);
    fref.programs.push(token);
  }
  return prog
};

function getCache(gl) {
  var ctxCache = CACHE.get(gl);
  if(!ctxCache) {
    ctxCache = new ContextCache(gl);
    CACHE.set(gl, ctxCache);
  }
  return ctxCache
}

function getShaderReference(gl, type, src) {
  return getCache(gl).getShaderReference(type, src)
}

function createProgram(gl, vref, fref, attribs, locations) {
  return getCache(gl).getProgram(vref, fref, attribs, locations)
}

var shaderCache = {
	shader: shader,
	program: program
};

var uniforms    = runtimeUniforms;
var attributes  = runtimeAttributes;

var GL_TO_GLSL_TYPES = {
  'FLOAT':       'float',
  'FLOAT_VEC2':  'vec2',
  'FLOAT_VEC3':  'vec3',
  'FLOAT_VEC4':  'vec4',
  'INT':         'int',
  'INT_VEC2':    'ivec2',
  'INT_VEC3':    'ivec3',
  'INT_VEC4':    'ivec4',
  'BOOL':        'bool',
  'BOOL_VEC2':   'bvec2',
  'BOOL_VEC3':   'bvec3',
  'BOOL_VEC4':   'bvec4',
  'FLOAT_MAT2':  'mat2',
  'FLOAT_MAT3':  'mat3',
  'FLOAT_MAT4':  'mat4',
  'SAMPLER_2D':  'sampler2D',
  'SAMPLER_CUBE':'samplerCube'
};

var GL_TABLE = null;

function getType(gl, type) {
  if(!GL_TABLE) {
    var typeNames = Object.keys(GL_TO_GLSL_TYPES);
    GL_TABLE = {};
    for(var i=0; i<typeNames.length; ++i) {
      var tn = typeNames[i];
      GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
    }
  }
  return GL_TABLE[type]
}

function runtimeUniforms(gl, program) {
  var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  var result = [];
  for(var i=0; i<numUniforms; ++i) {
    var info = gl.getActiveUniform(program, i);
    if(info) {
      var type = getType(gl, info.type);
      if(info.size > 1) {
        for(var j=0; j<info.size; ++j) {
          result.push({
            name: info.name.replace('[0]', '[' + j + ']'),
            type: type
          });
        }
      } else {
        result.push({
          name: info.name,
          type: type
        });
      }
    }
  }
  return result
}

function runtimeAttributes(gl, program) {
  var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  var result = [];
  for(var i=0; i<numAttributes; ++i) {
    var info = gl.getActiveAttrib(program, i);
    if(info) {
      result.push({
        name: info.name,
        type: getType(gl, info.type)
      });
    }
  }
  return result
}

var runtimeReflect = {
	uniforms: uniforms,
	attributes: attributes
};

//Shader object
function Shader(gl) {
  this.gl         = gl;

  //Default initialize these to null
  this._vref      =
  this._fref      =
  this._relink    =
  this.vertShader =
  this.fragShader =
  this.program    =
  this.attributes =
  this.uniforms   =
  this.types      = null;
}

var proto$1 = Shader.prototype;

proto$1.bind = function() {
  if(!this.program) {
    this._relink();
  }
  this.gl.useProgram(this.program);
};

proto$1.dispose = function() {
  if(this._fref) {
    this._fref.dispose();
  }
  if(this._vref) {
    this._vref.dispose();
  }
  this.attributes =
  this.types      =
  this.vertShader =
  this.fragShader =
  this.program    =
  this._relink    =
  this._fref      =
  this._vref      = null;
};

function compareAttributes(a, b) {
  if(a.name < b.name) {
    return -1
  }
  return 1
}

//Update export hook for glslify-live
proto$1.update = function(
    vertSource
  , fragSource
  , uniforms
  , attributes) {

  //If only one object passed, assume glslify style output
  if(!fragSource || arguments.length === 1) {
    var obj = vertSource;
    vertSource = obj.vertex;
    fragSource = obj.fragment;
    uniforms   = obj.uniforms;
    attributes = obj.attributes;
  }

  var wrapper = this;
  var gl      = wrapper.gl;

  //Compile vertex and fragment shaders
  var pvref = wrapper._vref;
  wrapper._vref = shaderCache.shader(gl, gl.VERTEX_SHADER, vertSource);
  if(pvref) {
    pvref.dispose();
  }
  wrapper.vertShader = wrapper._vref.shader;
  var pfref = this._fref;
  wrapper._fref = shaderCache.shader(gl, gl.FRAGMENT_SHADER, fragSource);
  if(pfref) {
    pfref.dispose();
  }
  wrapper.fragShader = wrapper._fref.shader;

  //If uniforms/attributes is not specified, use RT reflection
  if(!uniforms || !attributes) {

    //Create initial test program
    var testProgram = gl.createProgram();
    gl.attachShader(testProgram, wrapper.fragShader);
    gl.attachShader(testProgram, wrapper.vertShader);
    gl.linkProgram(testProgram);
    if(!gl.getProgramParameter(testProgram, gl.LINK_STATUS)) {
      var errLog = gl.getProgramInfoLog(testProgram);
      throw new GLError_1(errLog, 'Error linking program:' + errLog)
    }

    //Load data from runtime
    uniforms   = uniforms   || runtimeReflect.uniforms(gl, testProgram);
    attributes = attributes || runtimeReflect.attributes(gl, testProgram);

    //Release test program
    gl.deleteProgram(testProgram);
  }

  //Sort attributes lexicographically
  // overrides undefined WebGL behavior for attribute locations
  attributes = attributes.slice();
  attributes.sort(compareAttributes);

  //Convert attribute types, read out locations
  var attributeUnpacked  = [];
  var attributeNames     = [];
  var attributeLocations = [];
  for(var i=0; i<attributes.length; ++i) {
    var attr = attributes[i];
    if(attr.type.indexOf('mat') >= 0) {
      var size = attr.type.charAt(attr.type.length-1)|0;
      var locVector = new Array(size);
      for(var j=0; j<size; ++j) {
        locVector[j] = attributeLocations.length;
        attributeNames.push(attr.name + '[' + j + ']');
        if(typeof attr.location === 'number') {
          attributeLocations.push(attr.location + j);
        } else if(Array.isArray(attr.location) &&
                  attr.location.length === size &&
                  typeof attr.location[j] === 'number') {
          attributeLocations.push(attr.location[j]|0);
        } else {
          attributeLocations.push(-1);
        }
      }
      attributeUnpacked.push({
        name: attr.name,
        type: attr.type,
        locations: locVector
      });
    } else {
      attributeUnpacked.push({
        name: attr.name,
        type: attr.type,
        locations: [ attributeLocations.length ]
      });
      attributeNames.push(attr.name);
      if(typeof attr.location === 'number') {
        attributeLocations.push(attr.location|0);
      } else {
        attributeLocations.push(-1);
      }
    }
  }

  //For all unspecified attributes, assign them lexicographically min attribute
  var curLocation = 0;
  for(var i=0; i<attributeLocations.length; ++i) {
    if(attributeLocations[i] < 0) {
      while(attributeLocations.indexOf(curLocation) >= 0) {
        curLocation += 1;
      }
      attributeLocations[i] = curLocation;
    }
  }

  //Rebuild program and recompute all uniform locations
  var uniformLocations = new Array(uniforms.length);
  function relink() {
    wrapper.program = shaderCache.program(
        gl
      , wrapper._vref
      , wrapper._fref
      , attributeNames
      , attributeLocations);

    for(var i=0; i<uniforms.length; ++i) {
      uniformLocations[i] = gl.getUniformLocation(
          wrapper.program
        , uniforms[i].name);
    }
  }

  //Perform initial linking, reuse program used for reflection
  relink();

  //Save relinking procedure, defer until runtime
  wrapper._relink = relink;

  //Generate type info
  wrapper.types = {
    uniforms:   reflect(uniforms),
    attributes: reflect(attributes)
  };

  //Generate attribute wrappers
  wrapper.attributes = createAttributes(
      gl
    , wrapper
    , attributeUnpacked
    , attributeLocations);

  //Generate uniform wrappers
  Object.defineProperty(wrapper, 'uniforms', createUniforms(
      gl
    , wrapper
    , uniforms
    , uniformLocations));
};

//Compiles and links a shader program with the given attribute and vertex list
function createShader(
    gl
  , vertSource
  , fragSource
  , uniforms
  , attributes) {

  var shader = new Shader(gl);

  shader.update(
      vertSource
    , fragSource
    , uniforms
    , attributes);

  return shader
}

var glShader = createShader;

var vertexShader = 'attribute vec2 position; void main() { gl_Position = vec4(2.0*position-1.0, 0.0, 1.0);}';

function GlslTransition (gl, fragmentShader) {
  if (!(this instanceof GlslTransition))  return new GlslTransition(gl, fragmentShader);
  this.gl = gl;
  this.shader = glShader(gl, vertexShader, fragmentShader);
  this.buffer = gl.createBuffer();
}

var glslTransition = GlslTransition;

GlslTransition.prototype = {
  dispose: function () {
    this.shader.dispose();
    this.gl.deleteBuffer(this.buffer);
    this.shader = null;
    this.buffer = null;
  },

  render: function (progress, from, to, extraUniforms) {
    var gl = this.gl;
    var shader = this.shader;
    var unit = 0;
    shader.bind();
    this._checkViewport();
    shader.uniforms.progress = progress;
    shader.uniforms.from = from.bind(unit++);
    shader.uniforms.to = to.bind(unit++);
    for (var key in extraUniforms) {
      var value = extraUniforms[key];
      if (value && value.bind) {
        shader.uniforms[key] = value.bind(unit++);
      }
      else if (shader.uniforms[key] !== value) {
        shader.uniforms[key] = value;
      }
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },

  _checkViewport: function () {
    var gl = this.gl;
    var canvas = gl.canvas;
    var w = canvas.width, h = canvas.height;
    if (this._w!==w || this._h!==h) {
      this._syncViewport(w, h);
      this._w = w;
      this._h = h;
    }
  },

  _syncViewport: function (w, h) {
    var gl = this.gl;
    var shader = this.shader;
    var buffer = this.buffer;
    var x1 = 0, x2 = w, y1 = 0, y2 = h;
    shader.uniforms.resolution = new Float32Array([ w, h ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    shader.attributes.position.pointer();
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2
    ]), gl.STATIC_DRAW);
    gl.viewport(x1, y1, x2, y2);
  }
};

function backInOut(t) {
  var s = 1.70158 * 1.525;
  if ((t *= 2) < 1)
    return 0.5 * (t * t * ((s + 1) * t - s))
  return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2)
}

var backInOut_1 = backInOut;

function backIn(t) {
  var s = 1.70158;
  return t * t * ((s + 1) * t - s)
}

var backIn_1 = backIn;

function backOut(t) {
  var s = 1.70158;
  return --t * t * ((s + 1) * t + s) + 1
}

var backOut_1 = backOut;

function bounceOut(t) {
  var a = 4.0 / 11.0;
  var b = 8.0 / 11.0;
  var c = 9.0 / 10.0;

  var ca = 4356.0 / 361.0;
  var cb = 35442.0 / 1805.0;
  var cc = 16061.0 / 1805.0;

  var t2 = t * t;

  return t < a
    ? 7.5625 * t2
    : t < b
      ? 9.075 * t2 - 9.9 * t + 3.4
      : t < c
        ? ca * t2 - cb * t + cc
        : 10.8 * t * t - 20.52 * t + 10.72
}

var bounceOut_1 = bounceOut;

function bounceInOut(t) {
  return t < 0.5
    ? 0.5 * (1.0 - bounceOut_1(1.0 - t * 2.0))
    : 0.5 * bounceOut_1(t * 2.0 - 1.0) + 0.5
}

var bounceInOut_1 = bounceInOut;

function bounceIn(t) {
  return 1.0 - bounceOut_1(1.0 - t)
}

var bounceIn_1 = bounceIn;

function circInOut(t) {
  if ((t *= 2) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1)
  return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1)
}

var circInOut_1 = circInOut;

function circIn(t) {
  return 1.0 - Math.sqrt(1.0 - t * t)
}

var circIn_1 = circIn;

function circOut(t) {
  return Math.sqrt(1 - ( --t * t ))
}

var circOut_1 = circOut;

function cubicInOut(t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0
}

var cubicInOut_1 = cubicInOut;

function cubicIn(t) {
  return t * t * t
}

var cubicIn_1 = cubicIn;

function cubicOut(t) {
  var f = t - 1.0;
  return f * f * f + 1.0
}

var cubicOut_1 = cubicOut;

function elasticInOut(t) {
  return t < 0.5
    ? 0.5 * Math.sin(+13.0 * Math.PI/2 * 2.0 * t) * Math.pow(2.0, 10.0 * (2.0 * t - 1.0))
    : 0.5 * Math.sin(-13.0 * Math.PI/2 * ((2.0 * t - 1.0) + 1.0)) * Math.pow(2.0, -10.0 * (2.0 * t - 1.0)) + 1.0
}

var elasticInOut_1 = elasticInOut;

function elasticIn(t) {
  return Math.sin(13.0 * t * Math.PI/2) * Math.pow(2.0, 10.0 * (t - 1.0))
}

var elasticIn_1 = elasticIn;

function elasticOut(t) {
  return Math.sin(-13.0 * (t + 1.0) * Math.PI/2) * Math.pow(2.0, -10.0 * t) + 1.0
}

var elasticOut_1 = elasticOut;

function expoInOut(t) {
  return (t === 0.0 || t === 1.0)
    ? t
    : t < 0.5
      ? +0.5 * Math.pow(2.0, (20.0 * t) - 10.0)
      : -0.5 * Math.pow(2.0, 10.0 - (t * 20.0)) + 1.0
}

var expoInOut_1 = expoInOut;

function expoIn(t) {
  return t === 0.0 ? t : Math.pow(2.0, 10.0 * (t - 1.0))
}

var expoIn_1 = expoIn;

function expoOut(t) {
  return t === 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t)
}

var expoOut_1 = expoOut;

function linear(t) {
  return t
}

var linear_1 = linear;

function quadInOut(t) {
    t /= 0.5;
    if (t < 1) return 0.5*t*t
    t--;
    return -0.5 * (t*(t-2) - 1)
}

var quadInOut_1 = quadInOut;

function quadIn(t) {
  return t * t
}

var quadIn_1 = quadIn;

function quadOut(t) {
  return -t * (t - 2.0)
}

var quadOut_1 = quadOut;

function quarticInOut(t) {
  return t < 0.5
    ? +8.0 * Math.pow(t, 4.0)
    : -8.0 * Math.pow(t - 1.0, 4.0) + 1.0
}

var quartInOut = quarticInOut;

function quarticIn(t) {
  return Math.pow(t, 4.0)
}

var quartIn = quarticIn;

function quarticOut(t) {
  return Math.pow(t - 1.0, 3.0) * (1.0 - t) + 1.0
}

var quartOut = quarticOut;

function qinticInOut(t) {
    if ( ( t *= 2 ) < 1 ) return 0.5 * t * t * t * t * t
    return 0.5 * ( ( t -= 2 ) * t * t * t * t + 2 )
}

var quintInOut = qinticInOut;

function qinticIn(t) {
  return t * t * t * t * t
}

var quintIn = qinticIn;

function qinticOut(t) {
  return --t * t * t * t * t + 1
}

var quintOut = qinticOut;

function sineInOut(t) {
  return -0.5 * (Math.cos(Math.PI*t) - 1)
}

var sineInOut_1 = sineInOut;

function sineIn (t) {
  var v = Math.cos(t * Math.PI * 0.5);
  if (Math.abs(v) < 1e-14) return 1
  else return 1 - v
}

var sineIn_1 = sineIn;

function sineOut(t) {
  return Math.sin(t * Math.PI/2)
}

var sineOut_1 = sineOut;

var eases = {
	'backInOut': backInOut_1,
	'backIn': backIn_1,
	'backOut': backOut_1,
	'bounceInOut': bounceInOut_1,
	'bounceIn': bounceIn_1,
	'bounceOut': bounceOut_1,
	'circInOut': circInOut_1,
	'circIn': circIn_1,
	'circOut': circOut_1,
	'cubicInOut': cubicInOut_1,
	'cubicIn': cubicIn_1,
	'cubicOut': cubicOut_1,
	'elasticInOut': elasticInOut_1,
	'elasticIn': elasticIn_1,
	'elasticOut': elasticOut_1,
	'expoInOut': expoInOut_1,
	'expoIn': expoIn_1,
	'expoOut': expoOut_1,
	'linear': linear_1,
	'quadInOut': quadInOut_1,
	'quadIn': quadIn_1,
	'quadOut': quadOut_1,
	'quartInOut': quartInOut,
	'quartIn': quartIn,
	'quartOut': quartOut,
	'quintInOut': quintInOut,
	'quintIn': quintIn,
	'quintOut': quintOut,
	'sineInOut': sineInOut_1,
	'sineIn': sineIn_1,
	'sineOut': sineOut_1
};

const transitions = {
  none: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        gl_FragColor = texture2D(to, p);
      }
    `,
    uniforms: {}
  },
  crossfade: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        gl_FragColor = mix(texture2D(from, p), texture2D(to, p), progress);
      }
    `,
    uniforms: {}
  },
  wipeUp: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        vec4 a = texture2D(from, p);
        vec4 b = texture2D(to, p);
        gl_FragColor = mix(a, b, step(0.0 + p.y, progress));
      }
    `,
    uniforms: {}
  },
  wipeDown: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        vec4 a = texture2D(from, p);
        vec4 b = texture2D(to, p);
        gl_FragColor = mix(a, b, step(1.0 - p.y, progress));
      }
    `,
    uniforms: {}
  },
  wipeRight: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        vec4 a = texture2D(from, p);
        vec4 b = texture2D(to, p);
        gl_FragColor = mix(a, b, step(0.0 + p.x, progress));
      }
    `,
    uniforms: {}
  },
  wipeLeft: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        vec4 a = texture2D(from, p);
        vec4 b = texture2D(to, p);
        gl_FragColor = mix(a, b, step(1.0 - p.x, progress));
      }
    `,
    uniforms: {}
  },
  circle: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif

      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float centerX;
      uniform float centerY;
      uniform float smoothness;
      uniform bool grow;

      vec2 center = vec2(centerX, 1.0 - centerY);
      float scale = sqrt(min(resolution[0] / resolution[1], resolution[1] / resolution[0]) / max(centerX, 1.0 - centerY));

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        float size = grow ? progress : 1.0 - progress;
        float dist = distance(center, p);
        float circle = smoothstep(-smoothness, 0.0, scale * dist - size * (1.0 + smoothness));
        gl_FragColor = mix(texture2D(from, p), texture2D(to, p), grow ? 1.0 - circle : circle);
      }
    `,
    uniforms: {
      centerX: 0.5,
      centerY: 0.5,
      smoothness: 0,
      grow: true
    }
  },
  circleInOut: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      float maxRadius = resolution.x + resolution.y;

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;

        float distX = gl_FragCoord.x - resolution.x / 2.0;
        float distY = gl_FragCoord.y - resolution.y / 2.0;
        float dist = sqrt(distX * distX + distY * distY);

        float step = 2.0 * abs(progress - 0.5);
        step = step * step * step;

        if (dist < step * maxRadius)
        {
          if (progress < 0.5)
            gl_FragColor = texture2D(from, p);
          else
            gl_FragColor = texture2D(to, p);
        }
        else
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    `,
    uniforms: {}
  },
  splitVertical: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif

      // General parameters
      uniform sampler2D from;
      uniform sampler2D to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float reflection;
      uniform float perspective;
      uniform float depth;

      const vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
      const vec2 boundMin = vec2(0.0, 0.0);
      const vec2 boundMax = vec2(1.0, 1.0);

      bool inBounds (vec2 p) {
        return all(lessThan(boundMin, p)) && all(lessThan(p, boundMax));
      }

      vec2 project (vec2 p) {
        return p * vec2(1.0, -1.2) + vec2(0.0, -0.02);
      }

      vec4 bgColor (vec2 p, vec2 pto) {
        vec4 c = black;
        pto = project(pto);
        if (inBounds(pto)) {
          c += mix(black, texture2D(to, pto), reflection * mix(1.0, 0.0, pto.y));
        }
        return c;
      }

      void main() {
        vec2 p = gl_FragCoord.xy / resolution.xy;

        vec2 pfr = vec2(-1.), pto = vec2(-1.);

        float middleSlit = 2.0 * abs(p.x-0.5) - progress;
        if (middleSlit > 0.0) {
          pfr = p + (p.x > 0.5 ? -1.0 : 1.0) * vec2(0.5*progress, 0.0);
          float d = 1.0/(1.0+perspective*progress*(1.0-middleSlit));
          pfr.y -= d/2.;
          pfr.y *= d;
          pfr.y += d/2.;
        }

        float size = mix(1.0, depth, 1.-progress);
        pto = (p + vec2(-0.5, -0.5)) * vec2(size, size) + vec2(0.5, 0.5);

        if (inBounds(pfr)) {
          gl_FragColor = texture2D(from, pfr);
        }
        else if (inBounds(pto)) {
          gl_FragColor = texture2D(to, pto);
        }
        else {
          gl_FragColor = bgColor(p, pto);
        }
      }
    `,
    uniforms: {
      reflection: 0,
      perspective: 0,
      depth: 1
    }
  },
  slideUp: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float translateX;
      uniform float translateY;

      void main() {
          vec2 texCoord = gl_FragCoord.xy / resolution.xy;
          float x = progress * translateX;
          float y = progress * translateY;

          if (x >= 0.0 && y >= 0.0) {
              if (texCoord.x >= x && texCoord.y >= y) {
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              }
              else {
                  vec2 uv;
                  if (x > 0.0)
                      uv = vec2(x - 1.0, y);
                  else if (y > 0.0)
                      uv = vec2(x, y - 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else if (x <= 0.0 && y <= 0.0) {
              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              else {
                  vec2 uv;
                  if (x < 0.0)
                      uv = vec2(x + 1.0, y);
                  else if (y < 0.0)
                      uv = vec2(x, y + 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else
              gl_FragColor = vec4(0.0);
      }
    `,
    uniforms: {
      translateX: 0,
      translateY: 1
    }
  },
  slideDown: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float translateX;
      uniform float translateY;

      void main() {
          vec2 texCoord = gl_FragCoord.xy / resolution.xy;
          float x = progress * translateX;
          float y = progress * translateY;

          if (x >= 0.0 && y >= 0.0) {
              if (texCoord.x >= x && texCoord.y >= y) {
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              }
              else {
                  vec2 uv;
                  if (x > 0.0)
                      uv = vec2(x - 1.0, y);
                  else if (y > 0.0)
                      uv = vec2(x, y - 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else if (x <= 0.0 && y <= 0.0) {
              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              else {
                  vec2 uv;
                  if (x < 0.0)
                      uv = vec2(x + 1.0, y);
                  else if (y < 0.0)
                      uv = vec2(x, y + 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else
              gl_FragColor = vec4(0.0);
      }
    `,
    uniforms: {
      translateX: 0,
      translateY: -1
    }
  },
  slideLeft: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float translateX;
      uniform float translateY;

      void main() {
          vec2 texCoord = gl_FragCoord.xy / resolution.xy;
          float x = progress * translateX;
          float y = progress * translateY;

          if (x >= 0.0 && y >= 0.0) {
              if (texCoord.x >= x && texCoord.y >= y) {
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              }
              else {
                  vec2 uv;
                  if (x > 0.0)
                      uv = vec2(x - 1.0, y);
                  else if (y > 0.0)
                      uv = vec2(x, y - 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else if (x <= 0.0 && y <= 0.0) {
              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              else {
                  vec2 uv;
                  if (x < 0.0)
                      uv = vec2(x + 1.0, y);
                  else if (y < 0.0)
                      uv = vec2(x, y + 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else
              gl_FragColor = vec4(0.0);
      }
    `,
    uniforms: {
      translateX: 1,
      translateY: 0
    }
  },
  slideRight: {
    shader: `
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      uniform float translateX;
      uniform float translateY;

      void main() {
          vec2 texCoord = gl_FragCoord.xy / resolution.xy;
          float x = progress * translateX;
          float y = progress * translateY;

          if (x >= 0.0 && y >= 0.0) {
              if (texCoord.x >= x && texCoord.y >= y) {
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              }
              else {
                  vec2 uv;
                  if (x > 0.0)
                      uv = vec2(x - 1.0, y);
                  else if (y > 0.0)
                      uv = vec2(x, y - 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else if (x <= 0.0 && y <= 0.0) {
              if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))
                  gl_FragColor = texture2D(from, texCoord - vec2(x, y));
              else {
                  vec2 uv;
                  if (x < 0.0)
                      uv = vec2(x + 1.0, y);
                  else if (y < 0.0)
                      uv = vec2(x, y + 1.0);
                  gl_FragColor = texture2D(to, texCoord - uv);
              }
          }
          else
              gl_FragColor = vec4(0.0);
      }
    `,
    uniforms: {
      translateX: -1,
      translateY: 0
    }
  }
};

/* eslint-env browser  */

/**
 * TODO
 * - autoplay: wait for slide._loaded
 * - optionally reset video on change
 * - fade objects on load
 * - events (ready, progress etc)
 * - cache video frames (assume frame rate and round currentTime to get frame)
 * - video options (loop?, sound?)
 * - fallback for no-video / autoplay on mobile
 * - effects/filters (sepia / grayscale etc)
 * - fallback for no-webgl (use gsap?)
 */

const pica = pica$1();

const TRANSITION_FORWARDS = 'forwards';
const TRANSITION_BACKWARDS = 'backwards';
const TRANSITION_RANDOM = 'random';

const TRANSITION_NONE_SHADER = `
  #ifdef GL_ES
  precision highp float;
  #endif
  uniform sampler2D from, to;
  uniform float progress;
  uniform vec2 resolution;

  void main() {
    vec2 p = gl_FragCoord.xy / resolution.xy;
    gl_FragColor = texture2D(to, p);
  }
`;

// Polyfill playing status
if (window.HTMLMediaElement) {
  Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get() {
      return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
  });
}

class Showy {
  constructor(config) {
    const defaultConfig = {
      container: 'body',
      slides: [],
      autoplay: false,
      slideDuration: 3000,
      transitions,
      transition: {
        name: 'random',
        duration: 2000,
        ease: 'linear',
        priority: 0
      }
    };

    this.config = _.merge({}, defaultConfig, config);

    if (typeof this.config.container === 'string') {
      this.container = document.querySelector(this.config.container);
    } else {
      this.container = this.config.container;
    }

    this.container.style.display = 'block';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';

    this._slides = this.config.slides;
    this._currentSlideIndex = 0;
    this._transitionToIndex = 0;
    this._currentSlideRendered = false;
    this._transitionProgress = 0;
    this._imageMap = {};
    this._videoMap = {};
    this._slideContentMap = {};
    this._ready = false;
    this._destroyed = false;
    this._playing = this.config.autoplay;
    this._width = 0;
    this._height = 0;
    this._regExp = {
      image: /\.(jpe?g|webp|png)$/i,
      video: /\.(mp4|webm|ogg)$/i
    };

    this._createCanvases();

    this._resizeHandler = this.resize.bind(this);
    window.addEventListener('resize', this._resizeHandler);

    this._lastFrameTime = 0;
    window.requestAnimationFrame(this._animate.bind(this));
  }

  goToSlide(index, direction) {
    this._transitionToIndex = index;
    this._transitionDirection = direction;

    this._currentSlideRendered = false;

    if (this._autoPlayTimeout) {
      clearTimeout(this._autoPlayTimeout);
    }
  }

  nextSlide() {
    let index;

    if (this._transitionToIndex === this._currentSlideIndex - 1 || this._transitionToIndex === this._slides.length - 1 && this._currentSlideIndex === 0) {
      // Cancel and reverse the transition
      index = this._currentSlideIndex;
    } else {
      index = this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1;
    }

    this.goToSlide(index, TRANSITION_FORWARDS);
  }

  prevSlide() {
    let index;

    if (this._transitionToIndex === this._currentSlideIndex + 1 || this._transitionToIndex === 0 && this._currentSlideIndex === this._slides.length - 1) {
      // Cancel and reverse the transition
      index = this._currentSlideIndex;
    } else {
      index = this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1;
    }

    this.goToSlide(index, TRANSITION_BACKWARDS);
  }

  play() {
    this._playing = true;

    this.nextSlide();
  }

  pause() {
    this._playing = false;

    if (this._autoPlayTimeout) {
      clearTimeout(this._autoPlayTimeout);
    }
  }

  destroy() {
    this._playing = false;

    this._destroyed = true;

    window.removeEventListener('resize', this._resizeHandler);

    _.forEach(this._videoMap, video => {
      this.container.removeChild(video);
      video = null;
    });
    this._videoMap = null;
  }

  static _updateCoords(src, dst, scaleMode) {
    const srcRatio = src.width / src.height;
    const dstRatio = dst.width / dst.height;

    if (scaleMode && scaleMode === 'fill') {
      if (srcRatio < dstRatio) {
        const newHeight = dst.height * (src.width / dst.width);
        src.y = src.y + (src.height - newHeight) * 0.5;
        src.height = newHeight;
      }
      if (srcRatio > dstRatio) {
        const newWidth = dst.width * (src.height / dst.height);
        src.x = src.x + (src.width - newWidth) * 0.5;
        src.width = newWidth;
      }
    } else {
      if (srcRatio > dstRatio) {
        const newHeight = dst.width * (src.height / src.width);
        dst.y = dst.y + (dst.height - newHeight) * 0.5;
        dst.height = newHeight;
      }
      if (srcRatio < dstRatio) {
        const newWidth = dst.height * srcRatio;
        dst.x = dst.x + (dst.width - newWidth) * 0.5;
        dst.width = newWidth;
      }
    }

    // Round properties for pica (and general speed up)
    const roundProps = ['x', 'y', 'width', 'height'];

    roundProps.forEach(prop => {
      src[prop] = Math.round(src[prop]);
      dst[prop] = Math.round(dst[prop]);
    });

    return {
      src,
      dst
    };
  }

  static _getTile(dst, size) {
    return {
      x: dst.x,
      y: dst.y,
      width: size[0] <= 1 ? dst.width * size[0] : size[0],
      height: size[1] <= 1 ? dst.height * size[1] : size[1]
    };
  }

  static _drawTiles(dst, tile, scaleMode, callback) {
    let rows;
    let columns;

    let offsetWidth = 0;
    let offsetHeight = 0;

    if (scaleMode && scaleMode === 'fill') {
      rows = Math.ceil(dst.height / tile.height);
      columns = Math.ceil(dst.width / tile.width);

      offsetWidth = (tile.width * columns - dst.width) * 0.5;
      offsetHeight = (tile.height * rows - dst.height) * 0.5;
    } else {
      rows = Math.floor(dst.height / tile.height);
      columns = Math.floor(dst.width / tile.width);
    }

    let row = 0;
    let column = 0;

    const totalTiles = rows * columns;

    for (let i = 0; i < totalTiles; i++) {
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

  static _getImageData(image, x, y, width, height) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    return tempContext.getImageData(x, y, width, height).data;
  }

  static _getVideoData(video) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    return tempContext._getImageData(0, 0, video.videoWidth, video.videoHeight).data;
  }

  _transitionEnded() {
    // console.log('Transition Ended');
  }

  _videoEnded(video, videoObject) {
    // console.log('Video Ended');

    const slide = this._slides[this._transitionToIndex];

    if (this._playing) {
      if (slide.duration && _.isFunction(slide.duration)) {
        let object = slide.duration();

        if (this._isType(object, 'video')) {
          this.nextSlide();
        }
      }
    }
  }

  _slideLoaded(slide, slideIndex) {
    // console.log('Slide Loaded');
  }

  _slideRendered() {
    // console.log('Slide Rendered');

    if (!this._ready) {
      // Showy is ready for the first time
      this._ready = true;
      this.container.classList.add('showy--ready');
    }

    const slide = this._slides[this._transitionToIndex];

    if (this._playing) {
      let slideDuration = this.config.slideDuration;

      if (slide.duration) {
        if (_.isFunction(slide.duration)) {
          let object = slide.duration();

          if (this._isType(object, 'video')) {
            return;
          }
        }

        if (_.isNumber(slide.duration)) {
          slideDuration = slide.duration;
        }
      }

      this._autoPlayTimeout = setTimeout(() => {
        this.nextSlide();
      }, slideDuration);
    }
  }

  _animate(frameTime) {
    if (this._destroyed) {
      return;
    }

    this._fps = 1000 / (frameTime - this._lastFrameTime);

    try {
      this._drawSlides();

      window.requestAnimationFrame(this._animate.bind(this));
    } catch (error) {
      console.error(error);
    }

    this._lastFrameTime = frameTime;
  }

  _createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    this._resizeCanvas(canvas);
    return canvas;
  }

  _createCanvases() {
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

  _resizeCanvas(canvas) {
    this._scale = window.devicePixelRatio;
    this._width = this.container.clientWidth * this._scale;
    this._height = this.container.clientHeight * this._scale;
    canvas.width = this._width;
    canvas.height = this._height;
  }

  resize() {
    // Remove all cached imageData as this will be redundant now
    this._slideContentMap = {};

    this._resizeCanvas(this._currentCanvas);
    this._resizeCanvas(this._nextCanvas);
    this._resizeCanvas(this._prevCanvas);
    this._resizeCanvas(this._renderCanvas);

    this._drawSlides(true);
  }

  _clearContext(context) {
    context.clearRect(0, 0, this._width, this._height);
  }

  _transitionInProgress() {
    return this._transitionProgress > 0 && this._transitionProgress < 1;
  }

  _getTransition(currentSlideTransition = {}, nextPrevSlideTransition = {}) {
    const _currentSlideTransition = _.merge({}, this.config.transition, currentSlideTransition || {});
    const _nextPrevSlideTransition = _.merge({}, this.config.transition, nextPrevSlideTransition || {});
    if (_currentSlideTransition.name === TRANSITION_RANDOM) {
      _currentSlideTransition.glsl = _.sample(this.config.transitions);
    } else {
      _currentSlideTransition.glsl = this.config.transitions[_currentSlideTransition.name];
    }
    if (_nextPrevSlideTransition.name === TRANSITION_RANDOM) {
      _nextPrevSlideTransition.glsl = _.sample(this.config.transitions);
    } else {
      _nextPrevSlideTransition.glsl = this.config.transitions[_nextPrevSlideTransition.name];
    }
    const transition = _currentSlideTransition.priority >= _nextPrevSlideTransition.priority ? _currentSlideTransition : _nextPrevSlideTransition;
    return transition;
  }

  _drawSlides(reset) {
    const currentSlide = this._slides[this._currentSlideIndex];
    const nextSlide = this._slides[this._currentSlideIndex === this._slides.length - 1 ? 0 : this._currentSlideIndex + 1];
    const prevSlide = this._slides[this._currentSlideIndex === 0 ? this._slides.length - 1 : this._currentSlideIndex - 1];

    let transitionOptions;

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

    // Dispose of textures used in previous frame
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
        this._fromTexture = texture(this._renderContext, this._currentCanvas);
        this._toTexture = texture(this._renderContext, this._nextCanvas);
        transitionOptions = this._getTransition(currentSlide.transitionNext, nextSlide.transitionPrev);
      }
      // We're heading to the previous slide (or the transition has been cancelled halfway through)
      if (this._transitionToIndex !== this._currentSlideIndex && this._transitionDirection === TRANSITION_BACKWARDS || this._transitionToIndex === this._currentSlideIndex && this._transitionDirection === TRANSITION_FORWARDS) {
        this._fromTexture = texture(this._renderContext, this._prevCanvas);
        this._toTexture = texture(this._renderContext, this._currentCanvas);
        transitionOptions = this._getTransition(currentSlide.transitionPrev, prevSlide.transitionNext);
      }
    } else {
      // We're not transitioning so just rerender current slide (only if needed)
      this._fromTexture = texture(this._renderContext, this._currentCanvas);
      this._toTexture = this._fromTexture;
    }

    if (transitionOptions && !this._transitionInProgress() && (!this._transitionOptions || this._transitionOptions.name !== transitionOptions.name || this._transitionOptions.name === TRANSITION_RANDOM)) {
      // Update transition options if required
      this._transitionOptions = transitionOptions;

      if (this._transition) {
        // Destroy current transition in preparation to create a new one
        this._transition.dispose();
        this._transition = null;
      }
    }

    if (this._transitionOptions) {
      if (!this._transition) {
        this._transition = glslTransition(this._renderContext, this._transitionOptions.glsl.shader);
      }

      if (this._transitionToIndex !== this._currentSlideIndex || this._transitionInProgress()) {
        // Increment the transition progress depending on the direction
        const progressIncrement = 60 / this._transitionOptions.duration;

        if (this._transitionDirection === TRANSITION_FORWARDS) {
          this._transitionProgress = this._transitionInProgress() ? this._transitionProgress + progressIncrement : progressIncrement;
        }
        if (this._transitionDirection === TRANSITION_BACKWARDS) {
          this._transitionProgress = this._transitionInProgress() ? this._transitionProgress - progressIncrement : 1 - progressIncrement;
        }
      }

      // We've reached the end of the transition
      if (this._transitionProgress > 1) {
        this._transitionProgress = 1;
      }
      if (this._transitionProgress < 0) {
        this._transitionProgress = 0;
      }

      const easedTransitionProgress = eases[this._transitionOptions.ease](this._transitionProgress);

      this._transition.render(easedTransitionProgress, this._fromTexture, this._toTexture, this._transitionOptions.glsl.uniforms);
    } else {
      // No transition specified, just render
      if (!this._transition) {
        this._transition = glslTransition(this._renderContext, TRANSITION_NONE_SHADER);
      }

      this._transition.render(1, this._fromTexture, this._toTexture);
    }

    // We have rendered the current slide for the first time
    if (currentSlide._ready) {
      currentSlide._rendered = true;

      if (!this._currentSlideRendered) {
        this._currentSlideRendered = true;

        this._playSlideContent(this._transitionToIndex);

        this._slideRendered();
      }
    }

    // Transition is finished
    if (this._transitionToIndex !== this._currentSlideIndex && !this._transitionInProgress()) {
      this._currentSlideIndex = this._transitionToIndex;

      this._clearContext(this._currentContext);
      this._clearContext(this._nextContext);
      this._clearContext(this._prevContext);

      this._pauseSlideContent();

      this._transitionEnded();
    }
  }

  _isType(object, type) {
    return object.type === type || object[type] || this._regExp[type] && object.url && this._regExp[type].test(object.url) || this._regExp[type] && object.sources && this._regExp[type].test(object.sources[0].url);
  }

  _drawSlide(context, slide) {
    slide._hasVideo = slide.content.filter(object => this._isType(object, 'video')).length > 0;
    slide._rendered = false;
    slide._ready = false;
    if (!slide._loaded) {
      slide._loaded = false;
    }

    if (slide.background) {
      context.fillStyle = slide.background;
      context.fillRect(0, 0, this._width, this._height);
    }

    if (slide.content.length) {
      this._drawSlideContent(context, slide, 0);
    }
  }

  _drawSlideContent(context, slide, index) {
    const object = slide.content[index];

    if (!object) {
      slide._ready = true;

      if (!slide._loaded) {
        slide._loaded = true;
        this._slideLoaded(slide, this._slides.indexOf(slide));
      }
      return;
    }

    const callback = this._drawSlideContent.bind(this, context, slide, index + 1);

    if (this._isType(object, 'image')) {
      this._drawImage(context, object, callback);
      return;
    }

    if (this._isType(object, 'video')) {
      this._drawVideo(context, object, callback);
      return;
    }

    if (this._isType(object, 'text')) {
      this._drawText(context, object, callback);
      return;
    }

    throw new Error('Unknown content type');
  }

  _position2Pixels(position, scale = 1) {
    const _pixels = [];

    position.forEach((val, index) => {
      let pixel;

      let length = [this._width, this._height, this._width, this._height][index];

      length /= scale;

      if (val >= 0 && val <= 1) {
        if (index < 2) {
          pixel = val * length;
        } else {
          pixel = val * length - _pixels[index - 2];
        }
      } else if (index < 2) {
        pixel = val;
      } else {
        pixel = length - _pixels[index - 2] - Math.abs(val);
      }

      _pixels.push(pixel);
    });

    const pixels = {
      x: _pixels[0] * scale,
      y: _pixels[1] * scale,
      width: _pixels[2] * scale,
      height: _pixels[3] * scale
    };

    return pixels;
  }

  _getImage(object, callback) {
    const url = typeof object.url === 'function' ? object.url() : object.url;

    if (this._imageMap[url]) {
      callback(this._imageMap[url]);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.src = url;
    image.onerror = event => {
      this.destroy();

      throw new Error('Image failed to load', url);
    };
    image.onload = event => {
      this._imageMap[url] = image;
      callback(image);
    };
  }

  _resizeImage(image, src, dst, callback) {
    const resizedImageKey = JSON.stringify({
      src: image.src,
      dst
    });

    if (this._slideContentMap[resizedImageKey]) {
      callback(this._slideContentMap[resizedImageKey]);
      return;
    }

    pica.resizeBuffer({
      src: Showy._getImageData(image, src.x, src.y, src.width, src.height),
      width: src.width,
      height: src.height,
      toWidth: dst.width,
      toHeight: dst.height,
      quality: 1,
      alpha: false,
      unsharpAmount: 0,
      unsharpRadius: 0.5,
      unsharpThreshold: 0
    }).then(buffer => {
      if (buffer.length) {
        this._resizedImageData = new ImageData(new Uint8ClampedArray(buffer), dst.width, dst.height);

        this._slideContentMap[resizedImageKey] = this._resizedImageData;

        callback(this._slideContentMap[resizedImageKey]);

        return;
      }

      console.error(new Error('Resize failed'), image.src, src, dst);
    }, error => {
      console.error(error);
    });
  }

  _drawText(context, object, callback) {
    let dst = this._position2Pixels(object.position, this._scale);

    context.font = object.font || '72px sans-serif';
    context.textAlign = object.align || 'center';
    context.fillStyle = object.color || 'rgba(0, 0, 0, 1)';

    let maxWidth = object.maxWidth ? object.maxWidth * this._width : undefined;

    context.fillText(object.text, dst.x, dst.y, maxWidth);

    callback();
  }

  _drawImage(context, object, callback) {
    this._getImage(object, image => {
      let src = {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight
      };

      let dst = this._position2Pixels(object.position, this._scale);

      if (object.tile) {
        let tile = Showy._getTile(dst, object.tile.size);

        const updatedCoords = Showy._updateCoords(src, tile, object.tile.scaleMode);

        this._resizeImage(image, updatedCoords.src, updatedCoords.dst, resizedImageData => {

          Showy._drawTiles(dst, updatedCoords.dst, object.scaleMode, tileCoord => {
            context.putImageData(resizedImageData, tileCoord.x, tileCoord.y);
          });

          callback();
        });

        return;
      }

      const updatedCoords = Showy._updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      this._resizeImage(image, src, dst, resizedImageData => {
        context.putImageData(resizedImageData, dst.x, dst.y);

        callback();
      });
    });
  }

  _getVideo(object, callback = () => {}) {
    const url = typeof object.url === 'function' ? object.url() : object.url;
    const sources = typeof object.sources === 'function' ? object.sources() : object.sources;

    const videoKey = JSON.stringify(url || sources);

    if (this._videoMap[videoKey]) {
      callback(this._videoMap[videoKey]);

      return this._videoMap[videoKey];
    }

    const video = document.createElement('video');
    video.style.display = 'none';
    video.crossOrigin = 'anonymous';
    video.muted = true;
    this.container.appendChild(video);

    if (url) {
      video.src = url;
    }

    if (sources) {
      sources.forEach(source => {
        const _source = document.createElement('source');
        _source.src = source.url;
        if (source.type) {
          _source.type = source.type;
        }
        _source.crossOrigin = 'anonymous';
        video.appendChild(_source);
      });
    }

    this._videoMap[videoKey] = video;

    video.addEventListener('loadedmetadata', () => {
      callback(video);
    });

    video._playCount = 0;

    video.addEventListener('ended', () => {
      video.play();

      video._playCount += 1;

      this._videoEnded(video, object);
    });

    return video;
  }

  _drawVideo(context, object, callback) {
    this._getVideo(object, video => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      let src = {
        x: 0,
        y: 0,
        width: video.videoWidth,
        height: video.videoHeight
      };

      let dst = this._position2Pixels(object.position, this._scale);

      if (object.tile) {
        let tile = Showy._getTile(dst, object.tile.size);

        const updatedCoords = Showy._updateCoords(src, tile, object.tile.scaleMode);

        Showy._drawTiles(dst, updatedCoords.dst, object.scaleMode, tileCoord => {
          context.drawImage(video, src.x, src.y, src.width, src.height, tileCoord.x, tileCoord.y, tile.width, tile.height);
        });

        callback();

        return;
      }

      const updatedCoords = Showy._updateCoords(src, dst, object.scaleMode);

      src = updatedCoords.src;
      dst = updatedCoords.dst;

      context.drawImage(video, src.x, src.y, src.width, src.height, dst.x, dst.y, dst.width, dst.height);

      callback();
    });
  }

  _playSlideContent(index) {
    this._slides[index].content.forEach(object => {
      if (this._isType(object, 'video')) {
        this._getVideo(object, video => {
          video._playCount = 0;
          video.currentTime = 0;
          video.play();
        });
      }
    });
  }

  _pauseSlideContent() {
    const currentSlideVideos = [];

    this._slides[this._currentSlideIndex].content.forEach(object => {
      if (this._isType(object, 'video')) {
        currentSlideVideos.push(this._getVideo(object));
      }
    });

    this._slides.forEach((slide, index) => {
      if (index === this._currentSlideIndex) {
        return;
      }

      slide.content.forEach(object => {
        if (this._isType(object, 'video')) {
          this._getVideo(object, video => {
            if (currentSlideVideos.indexOf(video) === -1) {
              video._playCount = 0;
              video.currentTime = 0;
              video.pause();
            }
          });
        }
      });
    });
  }
}

return Showy;

})));
//# sourceMappingURL=showy.js.map
