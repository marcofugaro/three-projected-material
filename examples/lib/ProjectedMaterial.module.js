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

var _cover = _classPrivateFieldLooseKey("cover");

var _textureScale = _classPrivateFieldLooseKey("textureScale");

class ProjectedMaterial extends MeshPhysicalMaterial {
  get texture() {
    return this.uniforms.projectedTexture.value;
  }

  set texture(texture) {
    this.uniforms.projectedTexture.value = texture;
  }

  get textureScale() {
    return _classPrivateFieldLooseBase(this, _textureScale)[_textureScale];
  }

  set textureScale(textureScale) {
    _classPrivateFieldLooseBase(this, _textureScale)[_textureScale] = textureScale;
    this.saveDimensions();
  }

  get textureOffset() {
    return this.uniforms.textureOffset.value;
  }

  set textureOffset(textureOffset) {
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
    textureScale = 1,
    textureOffset = new Vector2(),
    cover = false,
    ...options
  } = {}) {
    if (!(texture != null && texture.isTexture)) {
      throw new Error('Invalid texture passed to the ProjectedMaterial');
    }

    if (!camera || !camera.isCamera) {
      throw new Error('Invalid camera passed to the ProjectedMaterial');
    }

    super(options);
    Object.defineProperty(this, _cover, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _textureScale, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, 'isProjectedMaterial', {
      value: true
    }); // save a reference to the camera

    this.camera = camera; // save the private variables

    _classPrivateFieldLooseBase(this, _cover)[_cover] = cover;
    _classPrivateFieldLooseBase(this, _textureScale)[_textureScale] = textureScale; // scale to keep the image proportions and apply textureScale

    const [widthScaled, heightScaled] = computeScaledDimensions(texture, camera, textureScale, cover); // apply encoding based on provided texture

    const projectedTexelToLinear = getTexelDecodingFunction('projectedTexelToLinear', texture.encoding);
    this.uniforms = {
      projectedTexture: {
        value: texture
      },
      // this avoids rendering black if the texture
      // hasn't loaded yet
      isTextureLoaded: {
        value: Boolean(texture.image)
      },
      // don't show the texture if we haven't called project()
      isTextureProjected: {
        value: false
      },
      // if we have multiple materials we want to show the
      // background only of the first material
      backgroundOpacity: {
        value: 1
      },
      // these will be set on project()
      viewMatrixCamera: {
        value: new Matrix4()
      },
      projectionMatrixCamera: {
        value: new Matrix4()
      },
      projPosition: {
        value: new Vector3()
      },
      projDirection: {
        value: new Vector3(0, 0, -1)
      },
      // we will set this later when we will have positioned the object
      savedModelMatrix: {
        value: new Matrix4()
      },
      widthScaled: {
        value: widthScaled
      },
      heightScaled: {
        value: heightScaled
      },
      textureOffset: {
        value: textureOffset
      }
    };

    this.onBeforeCompile = shader => {
      // expose also the material's uniforms
      Object.assign(this.uniforms, shader.uniforms);
      shader.uniforms = this.uniforms;

      if (camera.isOrthographicCamera) {
        shader.defines.ORTHOGRAPHIC = '';
      }

      shader.vertexShader = monkeyPatch(shader.vertexShader, {
        header:
        /* glsl */
        `
          uniform mat4 viewMatrixCamera;
          uniform mat4 projectionMatrixCamera;

          #ifdef USE_INSTANCING
          in vec4 savedModelMatrix0;
          in vec4 savedModelMatrix1;
          in vec4 savedModelMatrix2;
          in vec4 savedModelMatrix3;
          #else
          uniform mat4 savedModelMatrix;
          #endif

          out vec3 vSavedNormal;
          out vec4 vTexCoords;
          #ifndef ORTHOGRAPHIC
          out vec4 vWorldPosition;
          #endif
        `,
        main:
        /* glsl */
        `
          #ifdef USE_INSTANCING
          mat4 savedModelMatrix = mat4(
            savedModelMatrix0,
            savedModelMatrix1,
            savedModelMatrix2,
            savedModelMatrix3
          );
          #endif

          vSavedNormal = mat3(savedModelMatrix) * normal;
          vTexCoords = projectionMatrixCamera * viewMatrixCamera * savedModelMatrix * vec4(position, 1.0);
          #ifndef ORTHOGRAPHIC
          vWorldPosition = savedModelMatrix * vec4(position, 1.0);
          #endif
        `
      });
      shader.fragmentShader = monkeyPatch(shader.fragmentShader, {
        header:
        /* glsl */
        `
          uniform sampler2D projectedTexture;
          uniform bool isTextureLoaded;
          uniform bool isTextureProjected;
          uniform float backgroundOpacity;
          uniform vec3 projPosition;
          uniform vec3 projDirection;
          uniform float widthScaled;
          uniform float heightScaled;
          uniform vec2 textureOffset;

          in vec3 vSavedNormal;
          in vec4 vTexCoords;
          #ifndef ORTHOGRAPHIC
          in vec4 vWorldPosition;
          #endif

          ${projectedTexelToLinear}

          float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
          }
        `,
        'vec4 diffuseColor = vec4( diffuse, opacity );':
        /* glsl */
        `
          vec2 uv = (vTexCoords.xy/ vTexCoords.w) * 0.5 + 0.5;

          uv += textureOffset;

          // apply the corrected width and height
          uv.x = map(uv.x, 0.0, 1.0, 0.5 - widthScaled / 2.0, 0.5 + widthScaled / 2.0);
          uv.y = map(uv.y, 0.0, 1.0, 0.5 - heightScaled / 2.0, 0.5 + heightScaled / 2.0);

          // this makes sure we don't sample out of the texture
          bool isInTexture = (max(uv.x, uv.y) <= 1.0 && min(uv.x, uv.y) >= 0.0);

          // this makes sure we don't render also the back of the object
          #ifdef ORTHOGRAPHIC
          vec3 projectorDirection = projDirection;
          #else
          vec3 projectorDirection = normalize(projPosition - vWorldPosition.xyz);
          #endif
          float dotProduct = dot(vSavedNormal, projectorDirection);
          bool isFacingProjector = dotProduct > 0.0000001;


          vec4 diffuseColor = vec4(diffuse, opacity * backgroundOpacity);

          if (isFacingProjector && isInTexture && isTextureLoaded && isTextureProjected) {
            vec4 textureColor = texture(projectedTexture, uv);

            // apply the enccoding from the texture
            textureColor = projectedTexelToLinear(textureColor);

            // apply the material opacity
            textureColor.a *= opacity;

            // https://learnopengl.com/Advanced-OpenGL/Blending
            diffuseColor = textureColor * textureColor.a + diffuseColor * (1.0 - textureColor.a);
          }
        `
      });
    }; // Listen on resize if the camera used for the projection
    // is the same used to render.
    // We do this on window resize because there is no way to
    // listen for the resize of the renderer


    window.addEventListener('resize', () => {
      this.uniforms.projectionMatrixCamera.value.copy(camera.projectionMatrix);
      this.saveDimensions();
    }); // If the image texture passed hasn't loaded yet,
    // wait for it to load and compute the correct proportions.
    // This avoids rendering black while the texture is loading

    addLoadListener(texture, () => {
      this.uniforms.isTextureLoaded.value = true;
      this.saveDimensions();
    });
  }

  saveDimensions() {
    const [widthScaled, heightScaled] = computeScaledDimensions(this.texture, this.camera, this.textureScale, this.cover);
    this.uniforms.widthScaled.value = widthScaled;
    this.uniforms.heightScaled.value = heightScaled;
  }

  saveCameraMatrices() {
    // make sure the camera matrices are updated
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    this.camera.updateWorldMatrix(); // update the uniforms from the camera so they're
    // fixed in the camera's position at the projection time

    const viewMatrixCamera = this.camera.matrixWorldInverse;
    const projectionMatrixCamera = this.camera.projectionMatrix;
    const modelMatrixCamera = this.camera.matrixWorld;
    this.uniforms.viewMatrixCamera.value.copy(viewMatrixCamera);
    this.uniforms.projectionMatrixCamera.value.copy(projectionMatrixCamera);
    this.uniforms.projPosition.value.copy(this.camera.position);
    this.uniforms.projDirection.value.set(0, 0, 1).applyMatrix4(modelMatrixCamera); // tell the shader we've projected

    this.uniforms.isTextureProjected.value = true;
  }

  project(mesh) {
    if (!(Array.isArray(mesh.material) ? mesh.material.every(m => m.isProjectedMaterial) : mesh.material.isProjectedMaterial)) {
      throw new Error(`The mesh material must be a ProjectedMaterial`);
    }

    if (!(Array.isArray(mesh.material) ? mesh.material.some(m => m === this) : mesh.material === this)) {
      throw new Error(`The provided mesh doesn't have the same material as where project() has been called from`);
    } // make sure the matrix is updated


    mesh.updateMatrixWorld(); // we save the object model matrix so it's projected relative
    // to that position, like a snapshot

    this.uniforms.savedModelMatrix.value.copy(mesh.matrixWorld); // if the material is not the first, output just the texture

    if (Array.isArray(mesh.material)) {
      const materialIndex = mesh.material.indexOf(this);

      if (!mesh.material[materialIndex].transparent) {
        throw new Error(`You have to pass "transparent: true" to the ProjectedMaterial if you're working with multiple materials.`);
      }

      if (materialIndex > 0) {
        this.uniforms.backgroundOpacity.value = 0;
      }
    } // persist also the current camera position and matrices


    this.saveCameraMatrices();
  }

  projectInstanceAt(index, instancedMesh, matrixWorld, {
    forceCameraSave = false
  } = {}) {
    if (!instancedMesh.isInstancedMesh) {
      throw new Error(`The provided mesh is not an InstancedMesh`);
    }

    if (!(Array.isArray(instancedMesh.material) ? instancedMesh.material.every(m => m.isProjectedMaterial) : instancedMesh.material.isProjectedMaterial)) {
      throw new Error(`The InstancedMesh material must be a ProjectedMaterial`);
    }

    if (!(Array.isArray(instancedMesh.material) ? instancedMesh.material.some(m => m === this) : instancedMesh.material === this)) {
      throw new Error(`The provided InstancedMeshhave't i samenclude thas e material where project() has been called from`);
    }

    if (!instancedMesh.geometry.isBufferGeometry) {
      throw new Error(`The InstancedMesh geometry must be a BufferGeometry`);
    }

    if (!instancedMesh.geometry.attributes[`savedModelMatrix0`] || !instancedMesh.geometry.attributes[`savedModelMatrix1`] || !instancedMesh.geometry.attributes[`savedModelMatrix2`] || !instancedMesh.geometry.attributes[`savedModelMatrix3`]) {
      throw new Error(`No allocated data found on the geometry, please call 'allocateProjectionData(geometry, instancesCount)'`);
    }

    instancedMesh.geometry.attributes[`savedModelMatrix0`].setXYZW(index, matrixWorld.elements[0], matrixWorld.elements[1], matrixWorld.elements[2], matrixWorld.elements[3]);
    instancedMesh.geometry.attributes[`savedModelMatrix1`].setXYZW(index, matrixWorld.elements[4], matrixWorld.elements[5], matrixWorld.elements[6], matrixWorld.elements[7]);
    instancedMesh.geometry.attributes[`savedModelMatrix2`].setXYZW(index, matrixWorld.elements[8], matrixWorld.elements[9], matrixWorld.elements[10], matrixWorld.elements[11]);
    instancedMesh.geometry.attributes[`savedModelMatrix3`].setXYZW(index, matrixWorld.elements[12], matrixWorld.elements[13], matrixWorld.elements[14], matrixWorld.elements[15]); // if the material is not the first, output just the texture

    if (Array.isArray(instancedMesh.material)) {
      const materialIndex = instancedMesh.material.indexOf(this);

      if (!instancedMesh.material[materialIndex].transparent) {
        throw new Error(`You have to pass "transparent: true" to the ProjectedMaterial if you're working with multiple materials.`);
      }

      if (materialIndex > 0) {
        this.uniforms.backgroundOpacity.value = 0;
      }
    } // persist the current camera position and matrices
    // only if it's the first instance since most surely
    // in all other instances the camera won't change


    if (index === 0 || forceCameraSave) {
      this.saveCameraMatrices();
    }
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

function allocateProjectionData(geometry, instancesCount) {
  geometry.setAttribute(`savedModelMatrix0`, new InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4));
  geometry.setAttribute(`savedModelMatrix1`, new InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4));
  geometry.setAttribute(`savedModelMatrix2`, new InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4));
  geometry.setAttribute(`savedModelMatrix3`, new InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4));
}

export default ProjectedMaterial;
export { allocateProjectionData };
