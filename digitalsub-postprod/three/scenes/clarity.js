// 30.60–34.45 s · « moins de complications » — a chaotic chrome knot; on « plus de clarté » it collapses into a
// clear refracting glass sphere; the camera then dives into the sphere (transition back to the speaker).
import { THREE, W, H, makeRenderer, studioEnv, mats, photoBackground, prog, outExpo, outBack, inout3, inoutExpo, mix } from '../lib.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

export async function setup() {
  const renderer = makeRenderer({ alpha: false });
  const scene = new THREE.Scene();
  const envTex = studioEnv(renderer);
  scene.environment = envTex;
  photoBackground(scene, 0x0a0e30, 0x010208);
  const cam = new THREE.PerspectiveCamera(34, W / H, 0.05, 200);

  const mirror = new Reflector(new THREE.PlaneGeometry(60, 60), { textureWidth: 1082, textureHeight: 1920, color: 0x2e3656 });
  mirror.rotation.x = -Math.PI / 2; mirror.position.y = -2.4; scene.add(mirror);
  const dim = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x03040f, transparent: true, opacity: 0.6 }));
  dim.rotation.x = -Math.PI / 2; dim.position.y = -2.39; scene.add(dim);

  const knots = [[1.25, 0.09, 3, 7, 0], [0.95, 0.07, 2, 5, 1.3], [1.5, 0.05, 4, 9, 2.1]].map(([r, tube, p, q, ph]) => {
    const m = new THREE.Mesh(new THREE.TorusKnotGeometry(r, tube, 600, 32, p, q), mats.chrome());
    m.userData.ph = ph; scene.add(m); return m;
  });

  // Clear glass sphere with screen-space refraction of the scene behind it.
  const rt = new THREE.WebGLRenderTarget(W, H, { colorSpace: THREE.SRGBColorSpace });
  const sphereMat = new THREE.ShaderMaterial({
    uniforms: { bg: { value: rt.texture }, env: { value: envTex }, res: { value: new THREE.Vector2(W, H) }, strength: { value: 0.22 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vWN; varying vec3 vWP;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = -mv.xyz;
        vWN = normalize(mat3(modelMatrix)*normal); vWP = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D bg; uniform sampler2D env; uniform vec2 res; uniform float strength;
      varying vec3 vN; varying vec3 vV; varying vec3 vWN; varying vec3 vWP;
      #include <common>
      #include <cube_uv_reflection_fragment>
      void main(){
        vec3 n = normalize(vN), v = normalize(vV);
        float fres = pow(1. - max(dot(n, v), 0.), 3.);
        vec2 uv = gl_FragCoord.xy / res;
        vec2 off = n.xy * strength * (1. - 0.5 * fres);
        vec3 refr = vec3(texture2D(bg, uv - off * 1.02).r, texture2D(bg, uv - off).g, texture2D(bg, uv - off * 0.98).b);
        vec3 r = reflect(normalize(vWP - cameraPosition), normalize(vWN));
        vec3 refl = textureCubeUV(env, r, 0.02).rgb;
        vec3 c = refr * 0.92 + refl * (0.12 + 0.9 * fres);
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  sphereMat.defines = { ENVMAP_TYPE_CUBE_UV: '', CUBEUV_TEXEL_WIDTH: 1 / (3 * 256), CUBEUV_TEXEL_HEIGHT: 1 / (4 * 256), CUBEUV_MAX_MIP: '8.0' };
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.7, 128, 96), sphereMat);
  scene.add(sphere);
  const key = new THREE.SpotLight(0xffffff, 400, 40, 0.5, 0.5); key.position.set(4, 10, 8); scene.add(key);
  // luminous backdrop: soft vertical light bars for the glass to refract
  const bars = new THREE.Group();
  [[-3.2, 0x46e3f5, 0.5], [-1.1, 0xffffff, 0.25], [1.4, 0x8b5cf6, 0.7], [3.4, 0x46e3f5, 0.35]].forEach(([x, c, w]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 9), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.4), toneMapped: false, transparent: true, opacity: 0.85 }));
    m.position.set(x, 1.5, 0); bars.add(m); });
  scene.add(bars);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ color: 0x46e3f5, transparent: true, opacity: 0, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -2.37; scene.add(pool);

  return {
    renderer,
    update(t) {
      const collapse = inout3(prog(t, 32.10, 0.4));
      const grow = outBack(prog(t, 32.42, 0.6), 1.3);
      const dive = inoutExpo(prog(t, 33.35, 1.0));
      const orbit = 0.5 + t * 0.22;
      const dist = mix(mix(15.5, 12.5, outExpo(prog(t, 30.6, 1.2))), 1.85, dive);
      cam.position.set(Math.sin(orbit) * dist * (1 - dive) , mix(1.2, 0.1, dive), Math.cos(orbit) * dist * (1 - dive) + dist * dive);
      cam.lookAt(0, 1.5 * (1 - dive), 0);  // objects sit low in frame: the top band carries the type
      knots.forEach((m, i) => {
        const s = (1 - collapse) * (1 + 0.04 * Math.sin(t * 3 + i));
        m.scale.setScalar(Math.max(0.001, s));
        m.visible = s > 0.01;
        m.rotation.set(t * (0.8 + i * 0.3) + m.userData.ph + collapse * 6, t * (1.1 - i * 0.2) + collapse * 4, t * 0.5 * i);
      });
      sphere.scale.setScalar(Math.max(0.001, grow));
      sphere.visible = grow > 0.005;
      pool.material.opacity = 0.18 * Math.min(1, grow);
      // keep the light bars behind the sphere, facing the camera, wherever the orbit goes
      const dir = new THREE.Vector3().copy(cam.position).setY(0).normalize();
      bars.position.copy(dir.multiplyScalar(-7)); bars.lookAt(cam.position.x, 1.5, cam.position.z);
      bars.children.forEach(m => { m.material.opacity = 0.35 + 0.6 * Math.min(1, grow); });
      // refraction source: the scene without the sphere
      sphere.visible = false; renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
      sphere.visible = grow > 0.005;
      renderer.render(scene, cam);
    },
  };
}
