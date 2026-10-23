// A cheap world-distance haze on the workshop's merged distant ring only.
// The playable floor, ink pass, tap geometry and camera bounds remain independent of the surroundings.
import * as THREE from 'three';

export function gptSurroundHaze(object, color = '#e9e8dc') {
  const material = object.material.clone();
  material.onBeforeCompile = shader => {
    shader.uniforms.gptHazeColor = { value: new THREE.Color(color) };
    shader.vertexShader = 'varying vec2 vGptGround;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvGptGround = (modelMatrix * vec4(transformed, 1.0)).xz;');
    shader.fragmentShader = 'uniform vec3 gptHazeColor;\nvarying vec2 vGptGround;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec2 beyond = max(abs(vGptGround) - vec2(4.0, 3.5), vec2(0.0));
      float haze = smoothstep(1.5, 8.0, length(beyond));
      outgoingLight = mix(outgoingLight, gptHazeColor, haze);
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey = () => 'gpt-surround-haze-v1';
  object.material = material;
  object.layers.set(2);
  object.castShadow = object.receiveShadow = false;
  object.userData.noMerge = object.userData.noOcclude = true;
  return object;
}
