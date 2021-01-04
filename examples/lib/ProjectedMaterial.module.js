import { LogLuvEncoding, GammaEncoding, RGBDEncoding, RGBM16Encoding, RGBM7Encoding, RGBEEncoding, sRGBEncoding, LinearEncoding, MeshPhysicalMaterial, Vector2, Matrix4, Vector3, InstancedBufferAttribute } from 'https://unpkg.com/three@0.122.0/build/three.module.js';

var id = 0;

function _classPrivateFieldLooseKey(name) {
  return "__private_" + id++ + "_" + name;
}

function _classPrivateFieldLooseBase(receiver, privateKey) {
  if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
    throw new TypeError("attempted to use private field on non-instance");
  }

  return receiver;
}

function monkeyPatch(shader, {
  defines = '',
  header = '',
  main = '',
  ...replaces
}) {
  let patchedShader = shader;

  const replaceAll = (str, find, rep) => str.split(find).join(rep);

  Object.keys(replaces).forEach(key => {
    patchedShader = replaceAll(patchedShader, key, replaces[key]);
  });
  patchedShader = patchedShader.replace('void main() {', `
    ${header}
    void main() {
      ${main}
    `);
  const stringDefines = Object.keys(defines).map(d => `#define ${d} ${defines[d]}`).join('\n');
  return `
    ${stringDefines}
    ${patchedShader}
  `;
} // run the callback when the image will be loaded

function addLoadListener(texture, callback) {
  // return if it's already loaded
  if (texture.image) {
    return;
  }

  const interval = setInterval(() => {
    if (texture.image) {
      clearInterval(interval);
      return callback(texture);
    }
  }, 16);
} // https://github.com/mrdoob/https://unpkg.com/three@0.122.0/build/three.module.js.js/blob/3c60484ce033e0dc2d434ce0eb89fc1f59d57d65/src/renderers/webgl/WebGLProgram.js#L22-L48s

function getEncodingComponents(encoding) {
  switch (encoding) {
    case LinearEncoding:
      return ['Linear', '( value )'];

    case sRGBEncoding:
      return ['sRGB', '( value )'];

    case RGBEEncoding:
      return ['RGBE', '( value )'];

    case RGBM7Encoding:
      return ['RGBM', '( value, 7.0 )'];

    case RGBM16Encoding:
      return ['RGBM', '( value, 16.0 )'];

    case RGBDEncoding:
      return ['RGBD', '( value, 256.0 )'];

    case GammaEncoding:
      return ['Gamma', '( value, float( GAMMA_FACTOR ) )'];

    case LogLuvEncoding:
      return ['LogLuv', '( value )'];

    default:
      console.warn('THREE.WebGLProgram: Unsupported encoding:', encoding);
      return ['Linear', '( value )'];
  }
} // https://github.com/mrdoob/https://unpkg.com/three@0.122.0/build/three.module.js.js/blob/3c60484ce033e0dc2d434ce0eb89fc1f59d57d65/src/renderers/webgl/WebGLProgram.js#L66-L71

function getTexelDecodingFunction(functionName, encoding) {
  const components = getEncodingComponents(encoding);
  return `
    vec4 ${functionName}(vec4 value) {
      return ${components[0]}ToLinear${components[1]};
    }
  `;
}

// returns an array of numbers that go from 0 to n - 1
// a simpler version of https://lodash.com/docs/4.17.15#range
function range(n) {
  return [...Array(n).keys()];
}

var _cover = _classPrivateFieldLooseKey("cover");

var _textureScales = _classPrivateFieldLooseKey("textureScales");

class ProjectedMaterial extends MeshPhysicalMaterial {
  get texture() {
    return this.uniforms.projectedTextures.value[0];
  }

  set texture(texture) {
    this.uniforms.projectedTextures.value[0] = texture;
  }

  get textures() {
    return this.uniforms.projectedTextures.value;
  }

  set textures(textues) {
    this.uniforms.projectedTextures.value = textues;
  }

  get textureScale() {
    return _classPrivateFieldLooseBase(this, _textureScales)[_textureScales][0];
  }

  set textureScale(textureScale) {
    _classPrivateFieldLooseBase(this, _textureScales)[_textureScales][0] = textureScale;
    this.saveDimensions();
  }

  get textureScales() {
    return _classPrivateFieldLooseBase(this, _textureScales)[_textureScales];
  }

  set textureScales(textureScales) {
    _classPrivateFieldLooseBase(this, _textureScales)[_textureScales] = textureScales;
    this.saveDimensions();
  }

  get textureOffset() {
    return this.uniforms.textureOffsets.value[0];
  }

  set textureOffset(textureOffset) {
    this.uniforms.textureOffsets.value[0] = textureOffset;
  }

  get textureOffsets() {
    return this.uniforms.textureOffset.value;
  }

  set textureOffsets(textureOffset) {
    this.uniforms.textureOffset.value = textureOffset;
  }

  get cover() {
    return _classPrivateFieldLooseBase(this, _cover)[_cover];
  }

  set cover(cover) {
    _classPrivateFieldLooseBase(this, _cover)[_cover] = cover;
    this.saveDimensions();
  }

  constructor({
    camera,
    texture,
    textures,
    textureScale = 1,
    textureScales,
    textureOffset = new Vector2(),
    textureOffsets,
    cover = false,
    ...options
  } = {}) {
    if (texture) {
      textures = [texture];
      textureScales = [textureScale];
      textureOffsets = [textureOffset];
    }

    if (textures.length === 0 || textures.some(tex => !tex || !tex.isTexture)) {
      throw new Error('Invalid texture passed to the ProjectedMaterial');
    }

    if (textureScales === undefined) {
      textureScales = textures.map(() => textureScale);
    }

    if (textureOffsets === undefined) {
      textureOffsets = textures.map(() => textureOffset.clone());
    }

    if (!camera || !camera.isCamera) {
      throw new Error('Invalid camera passed to the ProjectedMaterial');
    }

    super(options);
    Object.defineProperty(this, _cover, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _textureScales, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, 'isProjectedMaterial', {
      value: true
    }); // save a reference to the camera

    this.camera = camera; // save the private variables

    _classPrivateFieldLooseBase(this, _cover)[_cover] = cover;
    _classPrivateFieldLooseBase(this, _textureScales)[_textureScales] = textureScales; // scale to keep the image proportions and apply textureScale

    const scaledDimensions = textures.map((tex, i) => computeScaledDimensions(tex, camera, textureScales[i], cover));
    const widthsScaled = scaledDimensions.map(dimensions => dimensions[0]);
    const heightsScaled = scaledDimensions.map(dimensions => dimensions[1]); // apply encoding based on provided texture

    const projectedTexelToLinear = getTexelDecodingFunction('projectedTexelToLinear', textures[0].encoding);
    this.uniforms = {
      projectedTextures: {
        value: textures
      },
      // this avoids rendering black if the texture
      // hasn't loaded yet
      isTextureLoaded: {
        value: textures.map(tex => Boolean(tex.image))
      },
      // don't show the texture if we haven't called project()
      isTextureProjected: {
        value: textures.map(() => false)
      },
      // keep in mind the order in which we called project()
      projectedTexturesIndices: {
        value: textures.map(() => -1)
      },
      // these will be set on project()
      viewMatricesCamera: {
        value: textures.map(() => new Matrix4())
      },
      projectionMatrixCamera: {
        value: new Matrix4()
      },
      projPositions: {
        value: textures.map(() => new Vector3())
      },
      projDirections: {
        value: textures.map(() => new Vector3(0, 0, -1))
      },
      // we will set this later when we will have positioned the object
      savedModelMatrices: {
        value: textures.map(() => new Matrix4())
      },
      widthsScaled: {
        value: widthsScaled
      },
      heightsScaled: {
        value: heightsScaled
      },
      textureOffsets: {
        value: textureOffsets
      }
    }; // code-generation loop of textures

    function loopTextures(fn) {
      return range(textures.length).map(fn).join('');
    }

    this.onBeforeCompile = shader => {
      // expose also the material's uniforms
      Object.assign(this.uniforms, shader.uniforms);
      shader.uniforms = this.uniforms;
      shader.defines.N_TEXTURES = textures.length;

      if (camera.isOrthographicCamera) {
        shader.defines.ORTHOGRAPHIC = '';
      }

      shader.vertexShader = monkeyPatch(shader.vertexShader, {
        header:
        /* glsl */
        `
          uniform mat4 viewMatricesCamera[N_TEXTURES];
          uniform mat4 projectionMatrixCamera;

          #ifdef USE_INSTANCING
          ${loopTextures(i =>
        /* glsl */
        `
              in vec4 savedModelMatrix0_${i};
              in vec4 savedModelMatrix1_${i};
              in vec4 savedModelMatrix2_${i};
              in vec4 savedModelMatrix3_${i};
            `)}
          #else
          uniform mat4 savedModelMatrices[N_TEXTURES];
          #endif

          ${loopTextures(i =>
        /* glsl */
        `
              out vec3 vSavedNormal${i};
              out vec4 vTexCoords${i};
              #ifndef ORTHOGRAPHIC
              out vec4 vWorldPosition${i};
              #endif
            `)}
        `,
        main: loopTextures(i =>
        /* glsl */
        `
            #ifdef USE_INSTANCING
            mat4 savedModelMatrix${i} = mat4(
              savedModelMatrix0_${i},
              savedModelMatrix1_${i},
              savedModelMatrix2_${i},
              savedModelMatrix3_${i}
            );
            #else
            mat4 savedModelMatrix${i} = savedModelMatrices[${i}];
            #endif

            mat4 viewMatrixCamera${i} = viewMatricesCamera[${i}];

            vSavedNormal${i} = mat3(savedModelMatrix${i}) * normal;
            vTexCoords${i} = projectionMatrixCamera * viewMatrixCamera${i} * savedModelMatrix${i} * vec4(position, 1.0);
            #ifndef ORTHOGRAPHIC
            vWorldPosition${i} = savedModelMatrix${i} * vec4(position, 1.0);
            #endif
          `)
      });
      shader.fragmentShader = monkeyPatch(shader.fragmentShader, {
        header:
        /* glsl */
        `
          uniform sampler2D projectedTextures[N_TEXTURES];
          uniform bool isTextureLoaded[N_TEXTURES];
          uniform bool isTextureProjected[N_TEXTURES];
          uniform int projectedTexturesIndices[N_TEXTURES];
          uniform vec3 projPositions[N_TEXTURES];
          uniform vec3 projDirections[N_TEXTURES];
          uniform float widthsScaled[N_TEXTURES];
          uniform float heightsScaled[N_TEXTURES];
          uniform vec2 textureOffsets[N_TEXTURES];

          ${loopTextures( // TODO optimize varyings
        i =>
        /* glsl */
        `
              in vec3 vSavedNormal${i};
              in vec4 vTexCoords${i};
              #ifndef ORTHOGRAPHIC
              in vec4 vWorldPosition${i};
              #endif
            `)}


          ${projectedTexelToLinear}

          float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
          }
        `,
        'vec4 diffuseColor = vec4( diffuse, opacity );':
        /* glsl */
        `
          // these need to be defined only once, not in the loop
          vec2 uv;
          float widthScaled;
          float heightScaled;
          bool isInTexture;
          vec3 projectorDirection;
          float dotProduct;
          bool isFacingProjector;
          ${loopTextures(i =>
        /* glsl */
        `
              uv = (vTexCoords${i}.xy/ vTexCoords${i}.w) * 0.5 + 0.5;

              uv += textureOffsets[${i}];

              // apply the corrected width and height
              widthScaled = widthsScaled[${i}];
              heightScaled = heightsScaled[${i}];
              uv.x = map(uv.x, 0.0, 1.0, 0.5 - widthScaled / 2.0, 0.5 + widthScaled / 2.0);
              uv.y = map(uv.y, 0.0, 1.0, 0.5 - heightScaled / 2.0, 0.5 + heightScaled / 2.0);


              // this makes sure we don't sample out of the texture
              isInTexture = (max(uv.x, uv.y) <= 1.0 && min(uv.x, uv.y) >= 0.0);


              // this makes sure we don't render also the back of the object
              #ifdef ORTHOGRAPHIC
              projectorDirection = projDirections[${i}];
              #else
              projectorDirection = normalize(projPositions[${i}] - vWorldPosition${i}.xyz);
              #endif
              dotProduct = dot(vSavedNormal${i}, projectorDirection);
              isFacingProjector = dotProduct > 0.0000001;


              vec4 color${i};
              if (isFacingProjector && isInTexture && isTextureLoaded[${i}] && isTextureProjected[${i}]) {
                vec4 textureColor = texture(projectedTextures[${i}], uv);

                // apply the enccoding from the texture
                textureColor = projectedTexelToLinear(textureColor);

                // apply the material opacity
                textureColor.a *= opacity;

                color${i} = textureColor;
              }

            `)}

          vec4 colors[N_TEXTURES] = vec4[N_TEXTURES](
            ${loopTextures(i =>
        /* glsl */
        `
                color${i}${i < textures.length - 1 ? ',' : ''}
              `)}
          );

          // blend the textures in order
          vec4 color = vec4(0.0);

          for (int i = 0; i < N_TEXTURES; i++) {
            int textureIndex = projectedTexturesIndices[i];

            if (textureIndex == -1) {
              continue;
            }

            vec4 currentColor = colors[textureIndex];

            // https://learnopengl.com/Advanced-OpenGL/Blending
            color = currentColor * currentColor.a + color * (1.0 - currentColor.a);
          }

          vec4 diffuseColor = vec4(diffuse, opacity);

          // https://learnopengl.com/Advanced-OpenGL/Blending
          diffuseColor = color * color.a + diffuseColor * (1.0 - color.a);
          `
      });
    }; // listen on resize if the camera used for the projection
    // is the same used to render.
    // do this on window resize because there is no way to
    // listen for the resize of the renderer
    // (or maybe do a requestanimationframe if the camera.aspect changes)


    window.addEventListener('resize', () => {
      this.uniforms.projectionMatrixCamera.value.copy(camera.projectionMatrix);
      this.saveDimensions();
    }); // if the image texture passed hasn't loaded yet,
    // wait for it to load and compute the correct proportions.
    // this avoids rendering black while the texture is loading

    textures.forEach((tex, i) => {
      addLoadListener(tex, () => {
        this.uniforms.isTextureLoaded.value[i] = true;
        const [widthScaledNew, heightScaledNew] = computeScaledDimensions(tex, camera, textureScales[i], cover);
        this.uniforms.widthsScaled.value[i] = widthScaledNew;
        this.uniforms.heightsScaled.value[i] = heightScaledNew;
      });
    });
  }

  saveDimensions() {
    const scaledDimensions = this.textures.map((tex, i) => computeScaledDimensions(tex, this.camera, this.textureScales[i], this.cover));
    const widthsScaled = scaledDimensions.map(dimensions => dimensions[0]);
    const heightsScaled = scaledDimensions.map(dimensions => dimensions[1]);
    this.uniforms.widthsScaled.value = widthsScaled;
    this.uniforms.heightsScaled.value = heightsScaled;
  }

} // get camera ratio from different types of cameras

function getCameraRatio(camera) {
  switch (camera.type) {
    case 'PerspectiveCamera':
      {
        return camera.aspect;
      }

    case 'OrthographicCamera':
      {
        const width = Math.abs(camera.right - camera.left);
        const height = Math.abs(camera.top - camera.bottom);
        return width / height;
      }

    default:
      {
        throw new Error(`${camera.type} is currently not supported in ProjectedMaterial`);
      }
  }
} // scale to keep the image proportions and apply textureScale


function computeScaledDimensions(texture, camera, textureScale, cover) {
  // return some default values if the image hasn't loaded yet
  if (!texture.image) {
    return [1, 1];
  }

  const ratio = texture.image.naturalWidth / texture.image.naturalHeight;
  const ratioCamera = getCameraRatio(camera);
  const widthCamera = 1;
  const heightCamera = widthCamera * (1 / ratioCamera);
  let widthScaled;
  let heightScaled;

  if (cover ? ratio > ratioCamera : ratio < ratioCamera) {
    const width = heightCamera * ratio;
    widthScaled = 1 / (width / widthCamera * textureScale);
    heightScaled = 1 / textureScale;
  } else {
    const height = widthCamera * (1 / ratio);
    heightScaled = 1 / (height / heightCamera * textureScale);
    widthScaled = 1 / textureScale;
  }

  return [widthScaled, heightScaled];
}

function saveCameraMatrices(mesh, {
  textureIndex: i
}) {
  const {
    material
  } = mesh;
  const {
    camera
  } = material; // make sure the camera matrices are updated

  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  camera.updateWorldMatrix(); // update the uniforms from the camera so they're
  // fixed in the camera's position at the projection time

  const viewMatrixCamera = camera.matrixWorldInverse;
  const projectionMatrixCamera = camera.projectionMatrix;
  const modelMatrixCamera = camera.matrixWorld;
  material.uniforms.viewMatricesCamera.value[i].copy(viewMatrixCamera);
  material.uniforms.projectionMatrixCamera.value.copy(projectionMatrixCamera);
  material.uniforms.projPositions.value[i].copy(camera.position);
  material.uniforms.projDirections.value[i].set(0, 0, 1).applyMatrix4(modelMatrixCamera); // tell the material we've projected

  material.uniforms.isTextureProjected.value[i] = true; // add the i at the end of the array to make it sit on top

  const projectedTexturesIndices = material.uniforms.projectedTexturesIndices.value;

  if (projectedTexturesIndices.includes(i)) {
    projectedTexturesIndices.splice(projectedTexturesIndices.indexOf(i), 1);
  } else {
    projectedTexturesIndices.shift();
  }

  projectedTexturesIndices.push(i);
}

function project(mesh, {
  textureIndex: i = 0
} = {}) {
  if (!mesh.material.isProjectedMaterial) {
    throw new Error(`The mesh material must be a ProjectedMaterial`);
  }

  if (i >= mesh.material.uniforms.projectedTextures.value.length) {
    throw new Error(`The textureIndex is greater than the provided textures`);
  } // make sure the matrix is updated


  mesh.updateMatrixWorld(); // we save the object model matrix so it's projected relative
  // to that position, like a snapshot

  mesh.material.uniforms.savedModelMatrices.value[i].copy(mesh.matrixWorld); // persist also the current camera position and matrices

  saveCameraMatrices(mesh, {
    textureIndex: i
  });
}
function projectInstanceAt(index, instancedMesh, matrixWorld, {
  textureIndex: i = 0,
  forceCameraSave = false
} = {}) {
  if (!instancedMesh.isInstancedMesh) {
    throw new Error(`The provided mesh is not an InstancedMesh`);
  }

  if (!instancedMesh.material.isProjectedMaterial) {
    throw new Error(`The InstancedMesh material must be a ProjectedMaterial`);
  }

  if (i >= instancedMesh.material.uniforms.projectedTextures.value.length) {
    throw new Error(`The textureIndex is greater than the provided textures`);
  }

  if (!instancedMesh.geometry.isBufferGeometry) {
    throw new Error(`The InstancedMesh geometry must be a BufferGeometry`);
  }

  if (!instancedMesh.geometry.attributes[`savedModelMatrix0_${i}`] || !instancedMesh.geometry.attributes[`savedModelMatrix1_${i}`] || !instancedMesh.geometry.attributes[`savedModelMatrix2_${i}`] || !instancedMesh.geometry.attributes[`savedModelMatrix3_${i}`]) {
    throw new Error(`No allocated data found on the geometry, please call 'allocateProjectionData(geometry, instancesCount)'`);
  }

  instancedMesh.geometry.attributes[`savedModelMatrix0_${i}`].setXYZW(index, matrixWorld.elements[0], matrixWorld.elements[1], matrixWorld.elements[2], matrixWorld.elements[3]);
  instancedMesh.geometry.attributes[`savedModelMatrix1_${i}`].setXYZW(index, matrixWorld.elements[4], matrixWorld.elements[5], matrixWorld.elements[6], matrixWorld.elements[7]);
  instancedMesh.geometry.attributes[`savedModelMatrix2_${i}`].setXYZW(index, matrixWorld.elements[8], matrixWorld.elements[9], matrixWorld.elements[10], matrixWorld.elements[11]);
  instancedMesh.geometry.attributes[`savedModelMatrix3_${i}`].setXYZW(index, matrixWorld.elements[12], matrixWorld.elements[13], matrixWorld.elements[14], matrixWorld.elements[15]); // persist the current camera position and matrices
  // only if it's the first instance since most surely
  // in all other instances the camera won't change

  if (index === 0 || forceCameraSave) {
    saveCameraMatrices(instancedMesh, {
      textureIndex: i
    });
  }
}
function allocateProjectionData(geometry, instancesCount, texturesCount = 1) {
  range(texturesCount).forEach(i => {
    geometry.setAttribute(`savedModelMatrix0_${i}`, new InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4));
    geometry.setAttribute(`savedModelMatrix1_${i}`, new InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4));
    geometry.setAttribute(`savedModelMatrix2_${i}`, new InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4));
    geometry.setAttribute(`savedModelMatrix3_${i}`, new InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4));
  });
}

export default ProjectedMaterial;
export { allocateProjectionData, project, projectInstanceAt };
