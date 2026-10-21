// 2.64–9.32 s · spatial transition: the camera pulls back out of the footage, which becomes a floating
// glass screen in a dark 3D space; frosted glass cards carry the services as they are named, then the
// camera dives back into the screen (seamless return to the real shot).
import { THREE, RoundedBoxGeometry, W, H, makeRenderer, studioEnv, mats, photoBackground, fade,
         prog, outExpo, inoutExpo, inout3, outBack, mix } from '../lib.js';

const T_OUT = 2.67, T_IN = 9.29;
const CARDS = [['Canva Pro', 4.34, [-2.55, 2.75, 1.6]], ['ChatGPT', 5.34, [2.5, 1.55, 1.0]], ['Netflix', 6.20, [-2.75, -0.35, 2.0]],
               ['Spotify', 7.08, [2.6, -1.75, 1.5]], ['un autre service', 7.94, [-0.1, -3.55, 2.4]]];

export async function setup() {
  const renderer = makeRenderer({ alpha: false });
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  photoBackground(scene, 0x0d1340, 0x020309);
  scene.fog = new THREE.Fog(0x05071a, 18, 60);
  const cam = new THREE.PerspectiveCamera(32, W / H, 0.05, 200);
  const PH = 8, PW = PH * W / H;
  const dFill = (PH / 2) / Math.tan(THREE.MathUtils.degToRad(16));

  // footage screen: unlit + not tone-mapped so it matches the real shot exactly at the cut points
  const screenMat = new THREE.ShaderMaterial({
    transparent: true, toneMapped: false,
    uniforms: { map: { value: null }, radius: { value: 0 }, size: { value: new THREE.Vector2(PW, PH) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D map; uniform float radius; uniform vec2 size; varying vec2 vUv;
      void main(){ vec2 p = (vUv - 0.5) * size; vec2 q = abs(p) - size * 0.5 + radius;
        float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - radius;
        float a = 1. - smoothstep(-0.01, 0.01, d);
        gl_FragColor = vec4(texture2D(map, vUv).rgb, a);
        #include <colorspace_fragment>
      }`,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), screenMat);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(PW + 0.22, PH + 0.22, 0.16, 6, 0.32), mats.glassPanel(0xb8c4ff, 0.35));
  frame.position.z = -0.1;
  scene.add(frame, screen);

  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 8, 10); scene.add(key);
  const fill = new THREE.PointLight(0x46e3f5, 30, 30); fill.position.set(-6, -2, 6); scene.add(fill);

  const cards = CARDS.map(([name, t0, pos]) => {
    const g = new THREE.Group();
    const slab = new THREE.Mesh(new RoundedBoxGeometry(3.1, 1.25, 0.16, 6, 0.3), mats.glassPanel(0xc9d2ff, 0.2));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 32), new THREE.MeshBasicMaterial({ color: 0x46e3f5, toneMapped: false }));
    dot.position.set(-1.32, 0.42, 0.1);
    const bars = [0.9, 0.55].map((w, k) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.2, 0.09), new THREE.MeshBasicMaterial({ color: k ? 0x6f7899 : 0xc0c8e6, toneMapped: false }));
      b.position.set(-1.15 + w * 1.1, 0.1 - k * 0.3, 0.1); return b; });
    const edge = new THREE.Mesh(new RoundedBoxGeometry(3.18, 1.33, 0.12, 6, 0.33), new THREE.MeshBasicMaterial({ color: 0x46e3f5, transparent: true, opacity: 0, toneMapped: false }));
    edge.position.z = -0.06; edge.userData.noFade = true;
    g.add(edge, slab, dot, ...bars);
    g.userData = { t0, pos: new THREE.Vector3(...pos), edge };
    scene.add(g); return g;
  });

  const spheres = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.35, 48, 32), i % 3 ? mats.chrome() : mats.glassPanel(0xc8d0ff, 0.12));
    m.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 18, -4 - Math.random() * 14);
    m.userData.ph = Math.random() * 6; spheres.push(m); scene.add(m);
  }

  let tex = null;
  return {
    renderer,
    async update(t, arg) {
      const next = await new THREE.TextureLoader().loadAsync(`/ext/${String(arg.frame).padStart(5, '0')}.jpg`);
      next.colorSpace = THREE.SRGBColorSpace;
      if (tex) tex.dispose();
      tex = next; screenMat.uniforms.map.value = tex;

      const back = inoutExpo(prog(t, T_OUT, 1.3)) * (1 - inoutExpo(prog(t, T_IN - 1.0, 1.0)));
      const orbit = Math.sin(prog(t, T_OUT, T_IN - T_OUT) * Math.PI) * 0.32;
      const dist = mix(dFill, 21, back);
      cam.position.set(Math.sin(orbit) * dist + 1.2 * back, 0.6 * back * Math.sin(t * 0.5), Math.cos(orbit) * dist);
      cam.lookAt(0.35 * back, -0.2 * back, 0);
      cam.updateMatrixWorld();
      screenMat.uniforms.radius.value = 0.32 * back;
      frame.visible = back > 0.02;

      cards.forEach((g, i) => {
        const { t0, pos, edge } = g.userData;
        const p = prog(t, t0 - 0.12, 0.7), e = outExpo(p);
        const leave = inout3(prog(t, T_IN - 0.9, 0.6));
        g.position.copy(pos).add(new THREE.Vector3(0, 0.12 * Math.sin(t * 1.3 + i), mix(-14, 0, e) - 10 * leave));
        g.rotation.set(mix(0.9, 0.06 * Math.sin(t + i), e), mix(i % 2 ? -1.2 : 1.2, (i % 2 ? -0.18 : 0.18), outBack(p, 1.1)), 0);
        fade(g, Math.min(1, p * 3) * (1 - leave));
        edge.material.opacity = 0.7 * Math.max(0, 1 - Math.abs(t - t0 - 0.25) / 0.7) * (1 - leave);
        edge.visible = edge.material.opacity > 0.01;
      });
      spheres.forEach(m => { m.position.y += 0; m.rotation.y = t * 0.3; m.position.x += 0.002 * Math.sin(t + m.userData.ph); });
      renderer.render(scene, cam);
    },
  };
}
