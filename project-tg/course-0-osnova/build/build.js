// Сборка презентации курса 0: node build.js  →  ../Osnova-vaybkoding-i-neyroseti.pptx
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const RDS = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { weeks, glossary } = require("./content");

const OUT = path.join(__dirname, "..", "Osnova-vaybkoding-i-neyroseti.pptx");

// Палитра: тёмный индиго (доминанта) + лаймовый акцент + цвет недели
const INK = "15122E";
const INK2 = "26214D";
const LIME = "B8F14A";
const LIGHT = "F6F5FF";
const WHITE = "FFFFFF";
const TEXT = "1F1B3A";
const MUTED = "5B5878";
const LINE = "E4E1F5";
const HEAD = "Cambria";
const BODY = "Calibri";
const MONO = "Courier New";

const W = 13.33;
const sh = () => ({ type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.12 });

async function icon(name, color) {
  const Comp = fa[name];
  if (!Comp) throw new Error("no icon " + name);
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: "256" }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Основа: вайбкодинг и нейросети с нуля";
  pres.author = "project tg";

  const I = {
    check: await icon("FaCheckCircle", "0B8A8A"),
    warn: await icon("FaExclamationTriangle", "D9730D"),
    brain: await icon("FaBrain", WHITE),
    pen: await icon("FaPenNib", WHITE),
    code: await icon("FaCode", WHITE),
    git: await icon("FaCodeBranch", WHITE),
    shield: await icon("FaShieldAlt", WHITE),
    rocket: await icon("FaRocket", WHITE),
    laptop: await icon("FaLaptop", WHITE),
    wifi: await icon("FaWifi", WHITE),
    folder: await icon("FaFolderOpen", WHITE),
    clock: await icon("FaClock", WHITE),
    user: await icon("FaUserCircle", WHITE),
    book: await icon("FaBookOpen", WHITE),
    star: await icon("FaStar", WHITE),
    play: await icon("FaPlayCircle", WHITE),
    comments: await icon("FaComments", WHITE),
    upload: await icon("FaCloudUploadAlt", WHITE),
    flag: await icon("FaFlagCheckered", WHITE),
  };

  let totalWeekLabel = "";
  const footer = (s, label, dark) => {
    s.addText(label, { x: 0.6, y: 7.0, w: 8, h: 0.3, fontFace: BODY, fontSize: 10, color: dark ? "A9A5D6" : MUTED, margin: 0, isTextBox: true });
    s.slideNumber = { x: 12.0, y: 7.0, w: 0.73, h: 0.3, fontFace: BODY, fontSize: 10, color: dark ? "A9A5D6" : MUTED, align: "right" };
  };

  const circleText = (s, txt, x, y, d, color, fs) =>
    s.addText(txt, {
      shape: pres.ShapeType.ellipse, x, y, w: d, h: d, fill: { color }, color: WHITE, bold: true,
      fontFace: BODY, fontSize: fs, align: "center", valign: "middle", margin: 0, isTextBox: true,
    });

  const card = (s, x, y, w, h, fill = WHITE, line = LINE) =>
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: line, width: 0.75 }, rectRadius: 0.14, shadow: sh() });

  const title = (s, txt, x = 1.75, y = 0.42, w = 10.95, fs = 32) =>
    s.addText(txt, { x, y, w, h: 0.75, fontFace: HEAD, fontSize: fs, bold: true, color: INK, margin: 0, valign: "middle", isTextBox: true });

  // ---------- 1. Титул ----------
  {
    const s = pres.addSlide();
    s.background = { color: INK };
    s.addShape(pres.ShapeType.ellipse, { x: 8.6, y: -1.6, w: 6.4, h: 6.4, fill: { color: "6D5DF6", transparency: 55 }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: 10.3, y: 3.4, w: 4.6, h: 4.6, fill: { color: LIME, transparency: 82 }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: 7.6, y: 4.9, w: 2.2, h: 2.2, fill: { color: "D6336C", transparency: 60 }, line: { type: "none" } });
    s.addText("КУРС 0 · ОБЯЗАТЕЛЬНАЯ БАЗА", { x: 0.8, y: 1.0, w: 8, h: 0.4, fontFace: BODY, fontSize: 14, bold: true, color: LIME, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText("Основа: вайбкодинг и нейросети с нуля", { x: 0.8, y: 1.6, w: 8.4, h: 2.6, fontFace: HEAD, fontSize: 54, bold: true, color: WHITE, margin: 0, valign: "top", isTextBox: true });
    s.addText("Пошаговый курс на 4 недели: от первого промпта до опубликованного проекта — без ручного программирования.", {
      x: 0.8, y: 4.4, w: 7.4, h: 1.0, fontFace: BODY, fontSize: 20, color: "D7D4F5", margin: 0, valign: "top", isTextBox: true,
    });
    const tags = ["4 недели", "23 урока", "4 проекта"];
    tags.forEach((t, i) =>
      s.addText(t, {
        shape: pres.ShapeType.roundRect, rectRadius: 0.2, x: 0.8 + i * 1.95, y: 5.85, w: 1.75, h: 0.5,
        fill: { color: INK2 }, line: { color: "4A438C", width: 1 }, color: WHITE, bold: true, fontFace: BODY, fontSize: 15,
        align: "center", valign: "middle", margin: 0, isTextBox: true,
      })
    );
    s.addNotes("Открывающий слайд. Скажи: курс идёт четыре недели, в каждой — практика и проект. К концу у каждого ученика будет опубликованное приложение.");
  }

  // ---------- 2. О курсе ----------
  {
    const s = pres.addSlide();
    s.background = { color: LIGHT };
    title(s, "О курсе", 0.6, 0.45, 12, 38);
    s.addText("Для новичков без опыта. Ты учишься управлять нейросетями и собираешь свои проекты вместе с ИИ-агентом — код вручную писать не нужно.", {
      x: 0.6, y: 1.35, w: 11.4, h: 0.9, fontFace: BODY, fontSize: 20, color: MUTED, margin: 0, valign: "top", isTextBox: true,
    });
    const stats = [["4", "недели"], ["23", "урока"], ["4–6 ч", "в неделю"]];
    stats.forEach(([n, l], i) => {
      const x = 0.6 + i * 4.1;
      card(s, x, 2.55, 3.8, 2.2);
      s.addText(n, { x: x + 0.3, y: 2.7, w: 3.2, h: 1.3, fontFace: HEAD, fontSize: 66, bold: true, color: ["6D5DF6", "0B8A8A", "D9730D"][i], margin: 0, valign: "middle", isTextBox: true });
      s.addText(l, { x: x + 0.3, y: 4.0, w: 3.2, h: 0.5, fontFace: BODY, fontSize: 20, color: MUTED, margin: 0, isTextBox: true });
    });
    card(s, 0.6, 5.05, 12.13, 1.6, INK, INK);
    s.addText([
      { text: "Результат курса: ", options: { bold: true, color: LIME } },
      { text: "ты уверенно пишешь промпты, понимаешь, как работают нейросети, собираешь и публикуешь свой первый проект с помощью ИИ-агента.", options: { color: WHITE } },
    ], { x: 0.95, y: 5.2, w: 11.4, h: 1.3, fontFace: BODY, fontSize: 22, margin: 0, valign: "middle", isTextBox: true });
    footer(s, "Курс 0 · Основа");
    s.addNotes("Расскажи, для кого курс и что получится в конце: промпты, понимание, опубликованный проект.");
  }

  // ---------- 3. Что умеет выпускник ----------
  {
    const s = pres.addSlide();
    s.background = { color: LIGHT };
    title(s, "Что ты сможешь после курса", 0.6, 0.45, 12, 38);
    const items = [
      [I.brain, "Понимать ИИ", "объяснить простыми словами: LLM, токены, контекст, галлюцинации", "6D5DF6"],
      [I.pen, "Писать промпты", "структурно и итеративно улучшать результат", "6D5DF6"],
      [I.laptop, "Выбирать нейросеть", "подбирать инструмент под текст, картинку, видео, звук, код", "0B8A8A"],
      [I.code, "Вайбкодить", "собрать и запустить простой проект с ИИ-агентом", "0B8A8A"],
      [I.git, "Работать с Git", "сохранять версии, откатываться, публиковать на GitHub", "D9730D"],
      [I.shield, "Работать безопасно", "данные, ключи, лицензии и авторские права", "D6336C"],
    ];
    items.forEach(([ic, h, t, c], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 0.6 + col * 4.1, y = 1.7 + row * 2.6;
      card(s, x, y, 3.85, 2.35);
      s.addShape(pres.ShapeType.ellipse, { x: x + 0.3, y: y + 0.3, w: 0.75, h: 0.75, fill: { color: c }, line: { type: "none" } });
      s.addImage({ data: ic, x: x + 0.5, y: y + 0.5, w: 0.35, h: 0.35 });
      s.addText(h, { x: x + 0.3, y: y + 1.12, w: 3.3, h: 0.4, fontFace: BODY, fontSize: 21, bold: true, color: INK, margin: 0, isTextBox: true });
      s.addText(t, { x: x + 0.3, y: y + 1.5, w: 3.3, h: 0.8, fontFace: BODY, fontSize: 15, color: MUTED, margin: 0, valign: "top", isTextBox: true });
    });
    footer(s, "Курс 0 · Основа");
  }

  // ---------- 4. Ритм недели ----------
  {
    const s = pres.addSlide();
    s.background = { color: LIGHT };
    title(s, "Как проходить курс: ритм недели", 0.6, 0.45, 12, 38);
    const days = [
      [I.play, "Понедельник", "Открываются новые уроки: смотри видео, читай конспект", "6D5DF6"],
      [I.laptop, "Вторник — четверг", "Практика: делай шаги руками, задавай вопросы куратору", "0B8A8A"],
      [I.upload, "Пятница", "Сдача домашнего задания и самопроверка по чек-листу", "D9730D"],
      [I.comments, "Воскресенье", "Эфир: разбор типичных ошибок и лучших работ", "D6336C"],
    ];
    days.forEach(([ic, h, t, c], i) => {
      const x = 0.6 + i * 3.08;
      card(s, x, 1.7, 2.85, 3.5);
      s.addShape(pres.ShapeType.ellipse, { x: x + 0.3, y: 2.0, w: 0.8, h: 0.8, fill: { color: c }, line: { type: "none" } });
      s.addImage({ data: ic, x: x + 0.52, y: 2.22, w: 0.36, h: 0.36 });
      s.addText(h, { x: x + 0.3, y: 3.0, w: 2.35, h: 0.5, fontFace: BODY, fontSize: 20, bold: true, color: INK, margin: 0, isTextBox: true });
      s.addText(t, { x: x + 0.3, y: 3.5, w: 2.35, h: 1.6, fontFace: BODY, fontSize: 17, color: MUTED, margin: 0, valign: "top", isTextBox: true });
    });
    card(s, 0.6, 5.5, 12.13, 1.2, INK, INK);
    s.addText([
      { text: "Золотое правило: ", options: { bold: true, color: LIME } },
      { text: "делай руками. Смотреть уроки без практики почти бесполезно — каждый урок заканчивается заданием.", options: { color: WHITE } },
    ], { x: 0.95, y: 5.55, w: 11.4, h: 1.1, fontFace: BODY, fontSize: 21, margin: 0, valign: "middle", isTextBox: true });
    footer(s, "Курс 0 · Основа");
  }

  // ---------- 5. Что подготовить ----------
  {
    const s = pres.addSlide();
    s.background = { color: LIGHT };
    title(s, "Что подготовить до старта", 0.6, 0.45, 12, 38);
    const rows = [
      [I.laptop, "Компьютер или ноутбук", "Подойдёт любой современный; телефон нужен для проверки результата"],
      [I.wifi, "Стабильный интернет", "Все инструменты курса работают в браузере или онлайн"],
      [I.user, "Аккаунт в текстовом ИИ-чате", "Бесплатного тарифа достаточно для начала; включи двухфакторную защиту"],
      [I.folder, "Папка для работ", "Один документ «Мои промпты» и одна папка «Проекты»"],
      [I.clock, "4–6 часов в неделю", "Лучше по часу в день, чем всё в воскресенье"],
    ];
    rows.forEach(([ic, h, t], i) => {
      const y = 1.6 + i * 1.0;
      card(s, 0.6, y, 12.13, 0.88);
      s.addShape(pres.ShapeType.ellipse, { x: 0.85, y: y + 0.16, w: 0.56, h: 0.56, fill: { color: "6D5DF6" }, line: { type: "none" } });
      s.addImage({ data: ic, x: 1.02, y: y + 0.33, w: 0.22, h: 0.22 });
      s.addText(h, { x: 1.7, y, w: 4.2, h: 0.88, fontFace: BODY, fontSize: 20, bold: true, color: INK, margin: 0, valign: "middle", isTextBox: true });
      s.addText(t, { x: 5.9, y, w: 6.6, h: 0.88, fontFace: BODY, fontSize: 16, color: MUTED, margin: 0, valign: "middle", isTextBox: true });
    });
    footer(s, "Курс 0 · Основа");
  }

  // ---------- 6. Дорожная карта ----------
  {
    const s = pres.addSlide();
    s.background = { color: INK };
    s.addText("Карта курса: 4 недели", { x: 0.6, y: 0.45, w: 12, h: 0.8, fontFace: HEAD, fontSize: 38, bold: true, color: WHITE, margin: 0, isTextBox: true });
    weeks.forEach((wk, i) => {
      const x = 0.6 + i * 3.08;
      s.addShape(pres.ShapeType.roundRect, { x, y: 1.6, w: 2.85, h: 4.9, fill: { color: INK2 }, line: { color: "3C3675", width: 1 }, rectRadius: 0.14 });
      circleText(s, String(wk.n), x + 0.3, 1.9, 0.8, wk.color, 26);
      s.addText("НЕДЕЛЯ " + wk.n, { x: x + 0.3, y: 2.85, w: 2.3, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: LIME, charSpacing: 2, margin: 0, isTextBox: true });
      s.addText(wk.title, { x: x + 0.3, y: 3.2, w: 2.3, h: 1.3, fontFace: HEAD, fontSize: 21, bold: true, color: WHITE, margin: 0, valign: "top", isTextBox: true });
      s.addText(wk.lessons.length + " уроков" + (wk.hw ? " + ДЗ" : " + защита"), { x: x + 0.3, y: 4.6, w: 2.3, h: 0.3, fontFace: BODY, fontSize: 14, color: "C9C5F0", margin: 0, isTextBox: true });
      s.addText(wk.goal, { x: x + 0.3, y: 5.0, w: 2.3, h: 1.35, fontFace: BODY, fontSize: 13, color: "B9B5E4", margin: 0, valign: "top", isTextBox: true });
    });
    footer(s, "Курс 0 · Основа", true);
  }

  // ---------- Недели ----------
  const pill = (s, txt, x, y, w, color) =>
    s.addText(txt, {
      shape: pres.ShapeType.roundRect, rectRadius: 0.18, x, y, w, h: 0.4, fill: { color }, color: WHITE, bold: true,
      fontFace: BODY, fontSize: 12, align: "center", valign: "middle", margin: 0, isTextBox: true,
    });

  for (const wk of weeks) {
    const label = `Курс 0 · Неделя ${wk.n}`;

    // Разделитель недели
    {
      const s = pres.addSlide();
      s.background = { color: INK };
      s.addShape(pres.ShapeType.ellipse, { x: -1.5, y: 0.6, w: 7.2, h: 7.2, fill: { color: wk.color, transparency: 35 }, line: { type: "none" } });
      s.addShape(pres.ShapeType.ellipse, { x: 4.0, y: -1.4, w: 2.4, h: 2.4, fill: { color: LIME, transparency: 80 }, line: { type: "none" } });
      s.addText(String(wk.n), { x: 0.6, y: 1.3, w: 4.5, h: 4.6, fontFace: HEAD, fontSize: 260, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
      s.addText("НЕДЕЛЯ " + wk.n, { x: 6.6, y: 1.6, w: 6, h: 0.4, fontFace: BODY, fontSize: 16, bold: true, color: LIME, charSpacing: 3, margin: 0, isTextBox: true });
      s.addText(wk.title, { x: 6.6, y: 2.1, w: 6.1, h: 2.2, fontFace: HEAD, fontSize: 42, bold: true, color: WHITE, margin: 0, valign: "top", isTextBox: true });
      s.addText(wk.goal, { x: 6.6, y: 4.4, w: 6.0, h: 1.2, fontFace: BODY, fontSize: 20, color: "D7D4F5", margin: 0, valign: "top", isTextBox: true });
      s.addText(`${wk.lessons.length} уроков · практика · ${wk.hw ? "домашнее задание" : "финальный проект"}`, { x: 6.6, y: 5.9, w: 6, h: 0.4, fontFace: BODY, fontSize: 15, color: "A9A5D6", margin: 0, isTextBox: true });
      s.addNotes(`Открой неделю ${wk.n}. Цель недели: ${wk.goal}`);
    }

    // Обзор недели
    {
      const s = pres.addSlide();
      s.background = { color: LIGHT };
      circleText(s, String(wk.n), 0.6, 0.5, 0.95, wk.color, 30);
      title(s, `Неделя ${wk.n}: программа`, 1.75, 0.42, 10.95, 32);
      s.addText("Цель недели: " + wk.goal, { x: 1.75, y: 1.15, w: 10.95, h: 0.5, fontFace: BODY, fontSize: 16, italic: true, color: MUTED, margin: 0, valign: "top", isTextBox: true });
      const cards = wk.lessons.map((l) => ({ id: l.id, t: l.title, o: l.out }));
      cards.push(wk.hw ? { id: "ДЗ", t: "Домашнее задание", o: "Сдача в конце недели" } : { id: "★", t: "Финальный проект", o: "Опубликованное приложение" });
      cards.forEach((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const last = i === cards.length - 1 && cards.length % 2 === 1;
        const x = 0.6 + col * 6.13, y = 1.85 + row * 1.22, cw = last ? 12.13 : 5.9;
        card(s, x, y, cw, 1.1);
        circleText(s, c.id, x + 0.25, y + 0.22, 0.66, wk.color, c.id.length > 2 ? 14 : 18);
        s.addText(c.t, { x: x + 1.15, y: y + 0.1, w: cw - 1.4, h: 0.45, fontFace: BODY, fontSize: 19, bold: true, color: INK, margin: 0, valign: "middle", isTextBox: true });
        s.addText(c.o, { x: x + 1.15, y: y + 0.55, w: cw - 1.4, h: 0.45, fontFace: BODY, fontSize: 15, color: MUTED, margin: 0, valign: "top", isTextBox: true });
      });
      footer(s, label);
    }

    // Уроки
    wk.lessons.forEach((L, li) => {
      const flip = li % 2 === 1;

      // Слайд 1: разбор темы
      {
        const s = pres.addSlide();
        s.background = { color: LIGHT };
        circleText(s, L.id, 0.6, 0.5, 0.95, wk.color, 22);
        title(s, L.title);
        s.addText([{ text: "Цель урока: ", options: { bold: true, color: INK } }, { text: L.goal, options: { color: MUTED } }], {
          x: 1.75, y: 1.15, w: 10.95, h: 0.5, fontFace: BODY, fontSize: 16, margin: 0, valign: "top", isTextBox: true,
        });
        const pw = 6.4, px = flip ? 6.3 : 0.6;
        const cx = flip ? 0.6 : 7.6, cw = 5.1;
        L.p.forEach(([h, t], i) => {
          const y = 2.0 + i * 1.12;
          circleText(s, String(i + 1), px, y + 0.04, 0.44, wk.color, 15);
          s.addText(
            [
              { text: h, options: { bold: true, fontSize: 20, color: INK, breakLine: true } },
              { text: t, options: { fontSize: 16, color: MUTED } },
            ],
            { x: px + 0.62, y, w: pw - 0.62, h: 1.02, fontFace: BODY, margin: 0, valign: "top", isTextBox: true }
          );
        });
        s.addShape(pres.ShapeType.roundRect, { x: cx, y: 2.0, w: cw, h: 4.55, fill: { color: INK }, line: { color: INK, width: 0.5 }, rectRadius: 0.16, shadow: sh() });
        s.addText(L.ex.label.toUpperCase(), { x: cx + 0.35, y: 2.25, w: cw - 0.7, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: LIME, charSpacing: 2, margin: 0, isTextBox: true });
        const isCode = L.ex.type === "code";
        s.addText(L.ex.text, {
          x: cx + 0.35, y: 2.75, w: cw - 0.7, h: 3.6, fontFace: isCode ? MONO : BODY, fontSize: isCode ? 15 : 18,
          color: isCode ? "E8E6FF" : WHITE, margin: 0, valign: "top", paraSpaceAfter: 2, isTextBox: true,
        });
        footer(s, label);
        s.addNotes(L.say);
      }

      // Слайд 2: практика
      {
        const s = pres.addSlide();
        s.background = { color: LIGHT };
        circleText(s, L.id, 0.6, 0.5, 0.95, wk.color, 22);
        title(s, "Практика: " + L.title);
        s.addText([{ text: "Результат: ", options: { bold: true, color: INK } }, { text: L.out, options: { color: MUTED } }], {
          x: 1.75, y: 1.15, w: 10.95, h: 0.5, fontFace: BODY, fontSize: 16, margin: 0, valign: "top", isTextBox: true,
        });
        L.steps.forEach((t, i) => {
          const y = 2.0 + i * 1.12;
          circleText(s, String(i + 1), 0.6, y, 0.6, wk.color, 20);
          s.addText(t, { x: 1.45, y: y - 0.1, w: 6.5, h: 0.85, fontFace: BODY, fontSize: 19, color: TEXT, margin: 0, valign: "middle", isTextBox: true });
        });
        // проверь себя
        card(s, 8.3, 2.0, 4.43, 2.75);
        s.addImage({ data: I.check, x: 8.6, y: 2.25, w: 0.34, h: 0.34 });
        s.addText("Проверь себя", { x: 9.1, y: 2.2, w: 3.4, h: 0.44, fontFace: BODY, fontSize: 19, bold: true, color: INK, margin: 0, valign: "middle", isTextBox: true });
        s.addText(
          L.check.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < L.check.length - 1, paraSpaceAfter: 5 } })),
          { x: 8.6, y: 2.8, w: 3.9, h: 1.85, fontFace: BODY, fontSize: 15, color: TEXT, margin: 0, valign: "top", isTextBox: true }
        );
        // частая ошибка
        card(s, 8.3, 4.95, 4.43, 1.7, "FFF3E3", "F4D9B0");
        s.addImage({ data: I.warn, x: 8.6, y: 5.15, w: 0.34, h: 0.34 });
        s.addText("Частая ошибка", { x: 9.1, y: 5.1, w: 3.4, h: 0.44, fontFace: BODY, fontSize: 19, bold: true, color: INK, margin: 0, valign: "middle", isTextBox: true });
        s.addText(L.mistake, { x: 8.6, y: 5.6, w: 3.9, h: 1.0, fontFace: BODY, fontSize: 14, color: TEXT, margin: 0, valign: "top", isTextBox: true });
        footer(s, label);
        s.addNotes("Покажи выполнение шагов на экране, не торопясь. Дай зрителю поставить видео на паузу и повторить каждый шаг.");
      }
    });

    // Домашнее задание (недели 1–3) / финальный проект (неделя 4)
    if (wk.hw) {
      const s = pres.addSlide();
      s.background = { color: LIGHT };
      circleText(s, "ДЗ", 0.6, 0.5, 0.95, wk.color, 20);
      title(s, `Домашнее задание · Неделя ${wk.n}`);
      card(s, 0.6, 1.6, 6.5, 5.0);
      s.addText("Задание", { x: 0.95, y: 1.85, w: 5.8, h: 0.45, fontFace: BODY, fontSize: 22, bold: true, color: INK, margin: 0, isTextBox: true });
      s.addText(
        wk.hw.tasks.map((t, i) => ({ text: t, options: { bullet: { type: "number" }, breakLine: i < wk.hw.tasks.length - 1, paraSpaceAfter: 12 } })),
        { x: 0.95, y: 2.45, w: 5.85, h: 3.9, fontFace: BODY, fontSize: 20, color: TEXT, margin: 0, valign: "top", isTextBox: true }
      );
      card(s, 7.4, 1.6, 5.33, 2.3);
      s.addText("Что сдать", { x: 7.75, y: 1.8, w: 4.6, h: 0.45, fontFace: BODY, fontSize: 18, bold: true, color: INK, margin: 0, isTextBox: true });
      s.addText(
        wk.hw.deliver.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < wk.hw.deliver.length - 1, paraSpaceAfter: 5 } })),
        { x: 7.75, y: 2.35, w: 4.7, h: 1.45, fontFace: BODY, fontSize: 16, color: TEXT, margin: 0, valign: "top", isTextBox: true }
      );
      card(s, 7.4, 4.1, 5.33, 2.5, INK, INK);
      s.addText("Критерии зачёта", { x: 7.75, y: 4.3, w: 4.6, h: 0.45, fontFace: BODY, fontSize: 18, bold: true, color: LIME, margin: 0, isTextBox: true });
      s.addText(
        wk.hw.criteria.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < wk.hw.criteria.length - 1, paraSpaceAfter: 5 } })),
        { x: 7.75, y: 4.85, w: 4.7, h: 1.6, fontFace: BODY, fontSize: 15, color: WHITE, margin: 0, valign: "top", isTextBox: true }
      );
      footer(s, label);
      s.addNotes("Объясни задание и критерии. Напомни срок сдачи: пятница.");
    }
  }

  // ---------- Финальный проект ----------
  {
    const s = pres.addSlide();
    s.background = { color: LIGHT };
    circleText(s, "★", 0.6, 0.5, 0.95, "D6336C", 30);
    title(s, "Финальный проект курса");
    s.addText("Опубликованное приложение или страница с описанием: проблема → решение → промпты → ссылка.", {
      x: 1.75, y: 1.15, w: 10.95, h: 0.5, fontFace: BODY, fontSize: 16, color: MUTED, margin: 0, valign: "top", isTextBox: true,
    });
    card(s, 0.6, 1.95, 6.0, 4.65);
    s.addText("Что должно быть в проекте", { x: 0.95, y: 2.15, w: 5.3, h: 0.45, fontFace: BODY, fontSize: 19, bold: true, color: INK, margin: 0, isTextBox: true });
    s.addText(
      ["Идея решает понятную задачу", "ТЗ с критериями готовности", "3 и более рабочие функции", "Данные сохраняются", "Аккуратный вид на телефоне", "README, скриншот и история коммитов", "Публичная ссылка с HTTPS"].map((t, i, a) => ({
        text: t, options: { bullet: true, breakLine: i < a.length - 1, paraSpaceAfter: 6 },
      })),
      { x: 0.95, y: 2.75, w: 5.3, h: 3.7, fontFace: BODY, fontSize: 18, color: TEXT, margin: 0, valign: "top", isTextBox: true }
    );
    card(s, 6.9, 1.95, 5.83, 4.65, INK, INK);
    s.addText("Критерии зачёта", { x: 7.25, y: 2.15, w: 5.1, h: 0.45, fontFace: BODY, fontSize: 19, bold: true, color: LIME, margin: 0, isTextBox: true });
    s.addText(
      ["Проект открывается по ссылке и работает", "Есть README и история коммитов", "Ты можешь объяснить, что делает каждая часть на верхнем уровне", "Нет утёкших ключей и личных данных"].map((t, i, a) => ({
        text: t, options: { bullet: true, breakLine: i < a.length - 1, paraSpaceAfter: 10 },
      })),
      { x: 7.25, y: 2.75, w: 5.1, h: 3.7, fontFace: BODY, fontSize: 19, color: WHITE, margin: 0, valign: "top", isTextBox: true }
    );
    footer(s, "Курс 0 · Неделя 4");
    s.addNotes("Покажи критерии зачёта и примеры удачных проектов прошлых потоков, если они есть.");
  }

  // ---------- Чек-лист выпускника ----------
  {
    const s = pres.addSlide();
    s.background = { color: LIGHT };
    title(s, "Чек-лист выпускника", 0.6, 0.45, 12, 38);
    const cols = [
      ["Знания", "6D5DF6", ["Объясняю, что такое LLM, токен, контекст", "Знаю, как работают галлюцинации", "Понимаю HTML, CSS и JS на уровне ролей", "Знаю, что такое Git и API"]],
      ["Навыки", "0B8A8A", ["Пишу структурные промпты и делаю итерации", "Ставлю задачу агенту через ТЗ", "Читаю ошибки и описываю их для ИИ", "Публикую проект и обновляю его"]],
      ["Привычки", "D9730D", ["Проверяю факты и ссылки", "Коммичу после рабочего шага", "Не публикую ключи и личные данные", "Веду библиотеку промптов"]],
    ];
    cols.forEach(([h, c, items], i) => {
      const x = 0.6 + i * 4.1;
      card(s, x, 1.6, 3.85, 5.0);
      circleText(s, String(i + 1), x + 0.3, 1.85, 0.6, c, 20);
      s.addText(h, { x: x + 1.05, y: 1.85, w: 2.6, h: 0.6, fontFace: HEAD, fontSize: 24, bold: true, color: INK, margin: 0, valign: "middle", isTextBox: true });
      s.addText(items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1, paraSpaceAfter: 9 } })), {
        x: x + 0.3, y: 2.7, w: 3.3, h: 3.7, fontFace: BODY, fontSize: 17, color: TEXT, margin: 0, valign: "top", isTextBox: true,
      });
    });
    footer(s, "Курс 0 · Основа");
  }

  // ---------- Глоссарий (2 слайда) ----------
  [0, 1].forEach((part) => {
    const s = pres.addSlide();
    s.background = { color: LIGHT };
    title(s, `Глоссарий · часть ${part + 1}`, 0.6, 0.45, 12, 38);
    const list = glossary.slice(part * 8, part * 8 + 8);
    list.forEach(([term, def], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.6 + col * 6.13, y = 1.6 + row * 1.3;
      card(s, x, y, 5.9, 1.15);
      s.addText(term, { x: x + 0.3, y: y + 0.1, w: 5.3, h: 0.42, fontFace: BODY, fontSize: 20, bold: true, color: "5A4BE0", margin: 0, valign: "middle", isTextBox: true });
      s.addText(def, { x: x + 0.3, y: y + 0.52, w: 5.3, h: 0.55, fontFace: BODY, fontSize: 15, color: MUTED, margin: 0, valign: "top", isTextBox: true });
    });
    footer(s, "Курс 0 · Основа");
  });

  // ---------- Что дальше ----------
  {
    const s = pres.addSlide();
    s.background = { color: LIGHT };
    title(s, "Что дальше: следующие курсы", 0.6, 0.45, 12, 38);
    const next = [
      [I.code, "Сайты с ИИ", "6 недель", "Дизайн, сборка, формы, домен, SEO", "6D5DF6"],
      [I.play, "Монтаж с ИИ", "5 недель", "Субтитры, звук, цвет, форматы", "0B8A8A"],
      [I.rocket, "Видео с нуля", "5 недель", "Сценарий, кадры, клипы, озвучка", "D9730D"],
      [I.star, "Фото с ИИ", "4 недели", "Ретушь, предметка, единый стиль", "D6336C"],
      [I.user, "Аватары", "4 недели", "Личный образ, голос, персонажи", "6D5DF6"],
    ];
    next.forEach(([ic, h, d, t, c], i) => {
      const x = 0.6 + i * 2.46;
      card(s, x, 1.7, 2.3, 4.2);
      s.addShape(pres.ShapeType.ellipse, { x: x + 0.3, y: 2.0, w: 0.75, h: 0.75, fill: { color: c }, line: { type: "none" } });
      s.addImage({ data: ic, x: x + 0.5, y: 2.2, w: 0.35, h: 0.35 });
      s.addText(h, { x: x + 0.3, y: 3.0, w: 1.85, h: 0.75, fontFace: BODY, fontSize: 20, bold: true, color: INK, margin: 0, valign: "top", isTextBox: true });
      s.addText(d, { x: x + 0.3, y: 3.8, w: 1.85, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: c, margin: 0, isTextBox: true });
      s.addText(t, { x: x + 0.3, y: 4.2, w: 1.85, h: 1.5, fontFace: BODY, fontSize: 15, color: MUTED, margin: 0, valign: "top", isTextBox: true });
    });
    s.addText("Курсы можно проходить в любом порядке. Скидка выпускника курса 0 — на следующий курс.", {
      x: 0.6, y: 6.2, w: 12.1, h: 0.5, fontFace: BODY, fontSize: 16, italic: true, color: MUTED, margin: 0, isTextBox: true,
    });
    footer(s, "Курс 0 · Основа");
  }

  // ---------- Финал ----------
  {
    const s = pres.addSlide();
    s.background = { color: INK };
    s.addShape(pres.ShapeType.ellipse, { x: 8.4, y: -1.2, w: 6.2, h: 6.2, fill: { color: "6D5DF6", transparency: 55 }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: 9.8, y: 4.2, w: 4.2, h: 4.2, fill: { color: LIME, transparency: 82 }, line: { type: "none" } });
    s.addImage({ data: I.flag, x: 0.8, y: 1.4, w: 0.7, h: 0.7 });
    s.addText("Ты готов собрать свой проект", { x: 0.8, y: 2.4, w: 8, h: 2.2, fontFace: HEAD, fontSize: 50, bold: true, color: WHITE, margin: 0, valign: "top", isTextBox: true });
    s.addText("Начни с одного шага: открой чат, опиши идею и сделай первую итерацию. Остальное — практика.", {
      x: 0.8, y: 4.8, w: 7.4, h: 1.1, fontFace: BODY, fontSize: 20, color: "D7D4F5", margin: 0, valign: "top", isTextBox: true,
    });
    s.addNotes("Заверши курс мотивацией: главное — начать и делать по шагу каждый день.");
  }

  await pres.writeFile({ fileName: OUT });
  console.log("saved", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
