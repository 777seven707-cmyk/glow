import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  /** Доля разрешения, в которой считается кадр. По умолчанию 0.75 (0.5 на телефонах). */
  scale?: number;
  /** Число шагов трассировки. По умолчанию 150 (110 на телефонах). */
  steps?: number;
  /** Скорость вращения диска в покое. */
  spin?: number;
  /** Скорость вращения при наведении курсора. 0 отключает реакцию. */
  spinOnHover?: number;
}

export interface Renderer {
  /** Разрешается после первого отрисованного кадра. Отклоняется, если WebGL недоступен. */
  readonly ready: Promise<void>;
  /** Задать скорость вращения вручную. */
  setSpin(value: number): void;
  /** Остановить цикл, снять слушатели и освободить ресурсы WebGL. */
  dispose(): void;
}

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("Шейдер не собрался:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createRenderer(options: RendererOptions): Renderer {
  const { canvas } = options;

  const small =
    typeof window !== "undefined" &&
    (window.innerWidth < 760 || window.matchMedia("(hover: none)").matches);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let scale = options.scale ?? (small ? 0.38 : 0.5);
  let steps = options.steps ?? (small ? 64 : 72);
  const idleSpin = options.spin ?? 1;
  const hoverSpin = options.spinOnHover ?? 4.5;

  let disposed = false;
  let frameId = 0;
  let resolveReady!: () => void;
  let rejectReady!: (reason: Error) => void;

  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const attrs: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
  };

  const gl = (canvas.getContext("webgl", attrs) ??
    canvas.getContext("experimental-webgl", attrs)) as WebGLRenderingContext | null;

  if (!gl) {
    const error = new Error("WebGL недоступен");
    rejectReady(error);
    return { ready, setSpin() {}, dispose() {} };
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!vs || !fs || !program) {
    const error = new Error("Не удалось собрать шейдерную программу");
    rejectReady(error);
    return { ready, setSpin() {}, dispose() {} };
  }

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    rejectReady(new Error("Программа не слинковалась: " + log));
    return { ready, setSpin() {}, dispose() {} };
  }

  gl.useProgram(program);

  /* Один треугольник, перекрывающий экран, — дешевле полноэкранного квада */
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "uRes");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uSpin = gl.getUniformLocation(program, "uSpin");
  const uGain = gl.getUniformLocation(program, "uGain");
  const uSteps = gl.getUniformLocation(program, "uSteps");

  let width = 0;
  let height = 0;

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(rect.width * scale));
    const h = Math.max(2, Math.round(rect.height * scale));
    if (w === width && h === height) return;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl!.viewport(0, 0, w, h);
    gl!.uniform2f(uRes, w, h);
  }

  let spin = idleSpin;
  let spinTarget = idleSpin;

  function draw(timeSec: number): void {
    resize();
    spin += (spinTarget - spin) * 0.05;
    gl!.uniform1f(uTime, timeSec);
    gl!.uniform1f(uSpin, spin);
    gl!.uniform1f(uGain, 0.55);
    gl!.uniform1i(uSteps, steps);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  const onEnter = () => { spinTarget = hoverSpin; };
  const onLeave = () => { spinTarget = idleSpin; };

  const interactive = hoverSpin > 0 && !reduced && !small;
  if (interactive) {
    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointerleave", onLeave);
  }

  const onResize = () => {
    width = 0;                       // заставит resize() пересчитать размеры
    if (reduced) draw(6);
  };
  window.addEventListener("resize", onResize);

  if (reduced) {
    /* Без движения — один статичный кадр */
    draw(6);
    resolveReady();
  } else {
    const start = performance.now();
    let slow = 0;
    let first = true;
    let prev = 0;
    let avg = 0;
    const MIN_GAP = 42;      // 24 кадра в секунду: диск вращается медленно

    let lastFrame = 0;

    const loop = (now: number) => {
      if (disposed) return;
      frameId = requestAnimationFrame(loop);

      if (now - lastFrame < MIN_GAP) return;
      lastFrame = now;

      const box = canvas.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) { prev = 0; return; }

      draw((now - start) / 1000);

      if (first) {
        first = false;
        resolveReady();
      }

      /* Мерим промежуток между кадрами, а не время вызова отрисовки:
         drawArrays возвращается сразу, работа уходит на видеокарту
         асинхронно, поэтому по нему нагрузку не увидеть. */
      if (prev) {
        const gap = now - prev;
        avg = avg ? avg * 0.9 + gap * 0.1 : gap;
        if (avg > MIN_GAP * 1.7) {
          if (++slow > 20) {
            slow = 0;
            if (steps > 48) steps -= 12;
            else if (scale > 0.3) { scale -= 0.08; width = 0; }
            avg = MIN_GAP;
          }
        } else {
          slow = 0;
        }
      }
      prev = now;
    };

    frameId = requestAnimationFrame(loop);
  }

  return {
    ready,

    setSpin(value: number) {
      spinTarget = value;
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      if (interactive) {
        canvas.removeEventListener("pointerenter", onEnter);
        canvas.removeEventListener("pointerleave", onLeave);
      }
      gl!.deleteBuffer(buffer);
      gl!.deleteProgram(program);
      gl!.deleteShader(vs!);
      gl!.deleteShader(fs!);
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
