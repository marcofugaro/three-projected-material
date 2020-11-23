import * as THREE from 'three'
import { monkeyPatch } from './three-utils'

export default class ProjectedMaterial extends THREE.ShaderMaterial {
  constructor({
    camera,
    texture,
    color = 0xffffff,
    textureScale = 1,
    instanced = false,
    cover = false,
    opacity = 1,
    ...options
  } = {}) {
    if (!texture || !texture.isTexture) {
      throw new Error('Invalid texture passed to the ProjectedMaterial')
    }

    if (!camera || !camera.isCamera) {
      throw new Error('Invalid camera passed to the ProjectedMaterial')
    }

    // make sure the camera matrices are updated
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    camera.updateWorldMatrix()

    // get the matrices from the camera so they're fixed in camera's original position
    const viewMatrixCamera = camera.matrixWorldInverse.clone()
    const projectionMatrixCamera = camera.projectionMatrix.clone()
    const modelMatrixCamera = camera.matrixWorld.clone()

    const projPosition = camera.position.clone()

    // scale to keep the image proportions and apply textureScale
    const [widthScaled, heightScaled] = computeScaledDimensions(
      texture,
      camera,
      textureScale,
      cover
    )

    super({
      ...options,
      lights: true,
      uniforms: {
        ...THREE.ShaderLib['lambert'].uniforms,
        baseColor: { value: new THREE.Color(color) },
        projectedTexture: { value: texture },
        viewMatrixCamera: { type: 'm4', value: viewMatrixCamera },
        projectionMatrixCamera: { type: 'm4', value: projectionMatrixCamera },
        modelMatrixCamera: { type: 'mat4', value: modelMatrixCamera },
        // we will set this later when we will have positioned the object
        savedModelMatrix: { type: 'mat4', value: new THREE.Matrix4() },
        projPosition: { type: 'v3', value: projPosition },
        widthScaled: { value: widthScaled },
        heightScaled: { value: heightScaled },
        opacity: { value: opacity },
      },

      vertexShader: monkeyPatch(THREE.ShaderChunk['meshlambert_vert'], {
        header: [
          instanced
            ? `
            in vec4 savedModelMatrix0;
            in vec4 savedModelMatrix1;
            in vec4 savedModelMatrix2;
            in vec4 savedModelMatrix3;
            `
            : `
            uniform mat4 savedModelMatrix;
          `,
          `
          uniform mat4 viewMatrixCamera;
          uniform mat4 projectionMatrixCamera;
          uniform mat4 modelMatrixCamera;

          out vec4 vWorldPosition;
          out vec3 vNormal;
          out vec4 vTexCoords;
          `,
        ].join(''),
        main: [
          instanced
            ? `
            mat4 savedModelMatrix = mat4(
              savedModelMatrix0,
              savedModelMatrix1,
              savedModelMatrix2,
              savedModelMatrix3
            );
            `
            : '',
          /* glsl */ `
          vNormal = mat3(savedModelMatrix) * normal;
          vWorldPosition = savedModelMatrix * vec4(position, 1.0);
          vTexCoords = projectionMatrixCamera * viewMatrixCamera * vWorldPosition;
          `,
        ].join(''),
      }),

      fragmentShader: monkeyPatch(THREE.ShaderChunk['meshlambert_frag'], {
        header: /* glsl */ `
          uniform vec3 baseColor;
          uniform sampler2D projectedTexture;
          uniform vec3 projPosition;
          uniform float widthScaled;
          uniform float heightScaled;

          in vec3 vNormal;
          in vec4 vWorldPosition;
          in vec4 vTexCoords;

          float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
          }
        `,
        'vec4 diffuseColor = vec4( diffuse, opacity );': /* glsl */ `
          vec2 uv = (vTexCoords.xy / vTexCoords.w) * 0.5 + 0.5;

          // apply the corrected width and height
          uv.x = map(uv.x, 0.0, 1.0, 0.5 - widthScaled / 2.0, 0.5 + widthScaled / 2.0);
          uv.y = map(uv.y, 0.0, 1.0, 0.5 - heightScaled / 2.0, 0.5 + heightScaled / 2.0);

          vec4 color = texture(projectedTexture, uv);

          // this makes sure we don't sample out of the texture
          // TODO handle alpha
          bool inTexture = (max(uv.x, uv.y) <= 1.0 && min(uv.x, uv.y) >= 0.0);
          if (!inTexture) {
            color = vec4(baseColor, 1.0);
          }

          // this makes sure we don't render also the back of the object
          vec3 projectorDirection = normalize(projPosition - vWorldPosition.xyz);
          float dotProduct = dot(vNormal, projectorDirection);
          if (dotProduct < 0.0) {
            color = vec4(baseColor, 1.0);
          }

          // opacity from three.js
          color.a *= opacity;

          vec4 diffuseColor = color;
        `,
      }),
    })

    // listen on resize if the camera used for the projection
    // is the same used to render.
    // do this on window resize because there is no way to
    // listen for the resize of the renderer
    // (or maybe do a requestanimationframe if the camera.aspect changes)
    window.addEventListener('resize', () => {
      this.uniforms.projectionMatrixCamera.value.copy(camera.projectionMatrix)

      const [widthScaledNew, heightScaledNew] = computeScaledDimensions(
        texture,
        camera,
        textureScale,
        cover
      )
      this.uniforms.widthScaled.value = widthScaledNew
      this.uniforms.heightScaled.value = heightScaledNew
    })

    this.isProjectedMaterial = true
    this.instanced = instanced
  }
}

// scale to keep the image proportions and apply textureScale
function computeScaledDimensions(texture, camera, textureScale, cover) {
  const ratio = texture.image.naturalWidth / texture.image.naturalHeight
  const ratioCamera = camera.aspect
  const widthCamera = 1
  const heightCamera = widthCamera * (1 / ratioCamera)
  let widthScaled
  let heightScaled
  if (cover ? ratio > ratioCamera : ratio < ratioCamera) {
    const width = heightCamera * ratio
    widthScaled = 1 / ((width / widthCamera) * textureScale)
    heightScaled = 1 / textureScale
  } else {
    const height = widthCamera * (1 / ratio)
    heightScaled = 1 / ((height / heightCamera) * textureScale)
    widthScaled = 1 / textureScale
  }

  return [widthScaled, heightScaled]
}

export function project(mesh) {
  if (!mesh.material.isProjectedMaterial) {
    throw new Error(`The mesh material must be a ProjectedMaterial`)
  }

  // make sure the matrix is updated
  mesh.updateMatrixWorld()

  // we save the object model matrix so it's projected relative
  // to that position, like a snapshot
  mesh.material.uniforms.savedModelMatrix.value.copy(mesh.matrixWorld)
}

export function projectInstanceAt(index, instancedMesh, matrixWorld) {
  if (!instancedMesh.isInstancedMesh) {
    throw new Error(`The provided mesh is not an InstancedMesh`)
  }

  if (!instancedMesh.material.isProjectedMaterial) {
    throw new Error(`The InstancedMesh material must be a ProjectedMaterial`)
  }

  if (
    !instancedMesh.geometry.attributes.savedModelMatrix0 ||
    !instancedMesh.geometry.attributes.savedModelMatrix1 ||
    !instancedMesh.geometry.attributes.savedModelMatrix2 ||
    !instancedMesh.geometry.attributes.savedModelMatrix3
  ) {
    throw new Error(
      `No allocated data found on the geometry, please call 'allocateProjectionData(geometry)'`
    )
  }

  if (!instancedMesh.material.instanced) {
    throw new Error(`Please pass 'instanced: true' to the ProjectedMaterial`)
  }

  instancedMesh.geometry.attributes.savedModelMatrix0.setXYZW(
    index,
    matrixWorld.elements[0],
    matrixWorld.elements[1],
    matrixWorld.elements[2],
    matrixWorld.elements[3]
  )
  instancedMesh.geometry.attributes.savedModelMatrix1.setXYZW(
    index,
    matrixWorld.elements[4],
    matrixWorld.elements[5],
    matrixWorld.elements[6],
    matrixWorld.elements[7]
  )
  instancedMesh.geometry.attributes.savedModelMatrix2.setXYZW(
    index,
    matrixWorld.elements[8],
    matrixWorld.elements[9],
    matrixWorld.elements[10],
    matrixWorld.elements[11]
  )
  instancedMesh.geometry.attributes.savedModelMatrix3.setXYZW(
    index,
    matrixWorld.elements[12],
    matrixWorld.elements[13],
    matrixWorld.elements[14],
    matrixWorld.elements[15]
  )
}

export function allocateProjectionData(geometry, instancesCount) {
  geometry.setAttribute(
    'savedModelMatrix0',
    new THREE.InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4)
  )
  geometry.setAttribute(
    'savedModelMatrix1',
    new THREE.InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4)
  )
  geometry.setAttribute(
    'savedModelMatrix2',
    new THREE.InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4)
  )
  geometry.setAttribute(
    'savedModelMatrix3',
    new THREE.InstancedBufferAttribute(new Float32Array(instancesCount * 4), 4)
  )
}
