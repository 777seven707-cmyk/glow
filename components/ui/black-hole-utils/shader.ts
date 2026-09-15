/**
 * Фрагментный шейдер чёрной дыры.
 *
 * Лучи трассируются в искривлённом пространстве: на каждом шаге к скорости
 * фотона добавляется ускорение -1.5·h²·pos/r⁵ (приближение Шварцшильда).
 * Луч, пересёкший плоскость диска, набирает свечение; ушедший под горизонт —
 * обрывается. Дуга над горизонтом и фотонное кольцо получаются из геометрии,
 * отдельно они не рисуются.
 */
export const VERTEX_SHADER = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

export const FRAGMENT_SHADER = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uSpin;
uniform float uGain;
uniform int   uSteps;

float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123); }

float noise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float fbm(vec3 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 3; i++){ s += a * noise(p); p *= 2.07; a *= 0.5; }
  return s;
}

/* Свечение диска в точке пересечения луча с плоскостью y = 0 */
vec3 disk(vec3 hit, float rr, float time, float spin){
  float ang = atan(hit.z, hit.x);

  /* Вращение вокруг оси Y. Внутренние слои быстрее внешних — как в реальном диске */
  float w = time * spin * 1.15 / pow(rr, 1.5);
  vec2  s = vec2(cos(ang + w), sin(ang + w));

  /* Угловая координата меняется медленно, радиальная быстро —
     шум вытягивается в волокна вдоль орбиты */
  float n = fbm(vec3(s * 1.45, rr * 1.9));
  float gas = n * n * 1.35;
  gas *= 0.7 + 0.5 * sin(rr * 3.4 + n * 9.0);

  float inner = smoothstep(2.55, 3.5, rr);
  float outer = 1.0 - smoothstep(7.5, 12.0, rr);
  float dens  = inner * outer * gas;

  dens *= 9.0 / (1.0 + 0.09 * rr * rr);

  /* Релятивистское усиление: приближающаяся сторона ярче */
  dens *= 1.0 + 1.05 * sin(ang);

  return vec3(dens);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  vec3 ro = vec3(0.0, 1.55, -15.0);
  vec3 ww = normalize(-ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.15 * ww);

  vec3 pos = ro, vel = rd, col = vec3(0.0);
  vec3 L = cross(pos, vel);
  float h2 = dot(L, L);
  /* Длина пути держится постоянной: меньше шагов — крупнее шаг.
     Иначе при снижении качества луч не доходит до дыры и картинка ломается. */
  float dt = 21.5 / float(uSteps);

  for (int i = 0; i < 220; i++){
    if (i >= uSteps) break;
    float r = length(pos);
    if (r < 1.02) break;
    if (r > 34.0) break;

    float r2 = r * r;
    vec3 acc  = -1.5 * h2 * pos / (r2 * r2 * r);   /* дешевле, чем pow(r,5) */
    vec3 npos = pos + vel * dt + 0.5 * acc * dt * dt;
    vel += acc * dt;

    if (pos.y * npos.y < 0.0){
      float t   = -pos.y / (npos.y - pos.y);
      vec3  hit = mix(pos, npos, t);
      float rr  = length(hit.xz);
      if (rr > 2.5 && rr < 12.0) col += disk(hit, rr, uTime, uSpin) * uGain;
    }
    pos = npos;
  }

  col = max(col, 0.0);
  col += pow(col, vec3(2.2)) * 0.5;
  col = col / (1.0 + col);
  col = pow(col, vec3(0.85));
  gl_FragColor = vec4(col, 1.0);
}
`;
