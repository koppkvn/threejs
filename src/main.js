import './styles/style.scss';
import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
    let scene, camera, renderer, uniforms, quad;
    let renderTarget;

    init();
    animate();

    function init() {
        // Basic setup
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.querySelector('.shader-canvas').appendChild(renderer.domElement);

        renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

        uniforms = {
            time: { value: 0.0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            distortion: { value: 0.5 },
            distortionScale: { value: 1.5 },
            temporalDistortion: { value: 0.2 },
            buffer: { value: renderTarget.texture }
        };

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        precision highp float;

        uniform float time;
        uniform float distortion;
        uniform float distortionScale;
        uniform float temporalDistortion;
        uniform sampler2D buffer;
        uniform vec2 resolution;

        varying vec2 vUv;

        float rand(vec2 co) {
          return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        // Simplex-style noise
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = rand(i);
          float b = rand(i + vec2(1.0, 0.0));
          float c = rand(i + vec2(0.0, 1.0));
          float d = rand(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          vec2 uv = vUv;

          // temporal + spatial distortion
          vec2 offset = vec2(
            noise(uv * distortionScale + vec2(time * 0.2)) - 0.5,
            noise(uv.yx * distortionScale - vec2(time * 0.2)) - 0.5
          );

          offset *= distortion;
          uv += offset;

          // slight temporal distortion
          uv += temporalDistortion * 0.01 * sin(time + uv * 10.0);

          vec4 color = texture2D(buffer, uv);
          gl_FragColor = color;
        }
      `
        });

        quad = new THREE.Mesh(geometry, material);
        scene.add(quad);

        window.addEventListener('resize', onWindowResize);
    }

    function animate(time) {
        requestAnimationFrame(animate);
        uniforms.time.value = time * 0.001;

        // Update resolution uniform if needed
        uniforms.resolution.value.set(window.innerWidth, window.innerHeight);

        // Render the scene to the render target
        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);

        // Render the final output to screen
        renderer.render(scene, camera);
    }

    function onWindowResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderTarget.setSize(window.innerWidth, window.innerHeight);
    }
});
