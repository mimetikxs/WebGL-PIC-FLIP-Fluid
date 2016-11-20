'use strict'

import _ComputeBuffer from './buffer'

export default function(gl, webgl2Enabled) {
  const ComputeBuffer = _ComputeBuffer(gl, webgl2Enabled)

  let fullscreenQuadVBO = (function() {
    let verts = new Float32Array ([
      1.0, 1.0,
      -1.0, 1.0,
      -1.0, -1.0,
      -1.0, -1.0,
      1.0, -1.0,
      1.0, 1.0
    ])

    let buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
    return buffer
  })()

  let fullScreenVertexShader = (function() {
    let source = `
      precision lowp float;
      attribute vec2 vs_pos;
      void main() {
        gl_Position = vec4(vs_pos, 0.0, 0.1);
      }
    `
    let shader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(source);
      console.error('shader compiler error:\n' + gl.getShaderInfoLog(shader));
    }
    return shader
  })()
   

  class Computation {
    constructor(func) {
      [func, ...this.types] = arguments
      this.argc = func.length
      if (!webgl2Enabled) {
        for (let i in this.types) {
          this.types[i] = ComputeBuffer.TEXTURE
        }
      }
      this.prog = gl.createProgram()
      this.glslHeader = []
      this.parse(func.toString())
      console.log(this)
    }

    parse(str) {
      let parseRE = /\(([\s\S]*)\)\s*{([\s\S]*)}/g
      let [_, argNames, body] = parseRE.exec(str)
      argNames = argNames.split(", ")
      this.setupInput(argNames)
      this.setupBody(body, argNames)
    }

    setupInput(argNames) {
      for (let i in argNames) {
        let name = argNames[i]
        let type = this.types[i]
        if (type == ComputeBuffer.TEXTURE) {
          this.glslHeader.push(`uniform sampler2D ${name};`)
        } else if (type == ComputeBuffer.ARRAY) {
          this.glslHeader.push(`attribute float ${name};`)
        }
      }

      console.log(this.glslHeader.join('\n'))
    }

    setupBody(body, argNames) {
      for (let i in argNames) {
        let name = argNames[i]
        let type = this.types[i]
        
        if (type == ComputeBuffer.TEXTURE) {
          body = body.replace(RegExp(`${name}\[.+?\]`), `texture2D(${name})`)
        }
        console.log(body)
      }
    }

    exec() {

    }
  }

  return Computation
}