/* HAVN — bilingual content data (en/ru). Loaded before main.js. */
(function (global) {
  "use strict";

  var ICONS = {
    anxiety:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="24" cy="24" r="6"/><circle cx="24" cy="24" r="13" opacity=".55"/><circle cx="24" cy="24" r="20" opacity=".28"/></svg>',
    depression:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><line x1="8" y1="17" x2="40" y2="17"/><circle cx="24" cy="30" r="9"/></svg>',
    loneliness:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="24" cy="24" r="19" opacity=".32"/><circle cx="24" cy="24" r="2.6" fill="currentColor" stroke="none"/></svg>',
    grief:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="24" cy="24" r="16" stroke-dasharray="86 14" stroke-linecap="round"/></svg>',
    bullying:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="24" cy="24" r="7"/><path d="M24 6v8M24 34v8M6 24h8M34 24h8M11 11l6 6M31 31l6 6M37 11l-6 6M17 31l-6 6"/></svg>',
    disability:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="19" cy="24" r="13" opacity=".75"/><circle cx="29" cy="24" r="13" opacity=".75"/></svg>',
    burnout:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="24" cy="24" r="7"/><path d="M24 6v6" opacity=".65"/><path d="M38 12l-4.5 4.5" opacity=".5"/><path d="M42 24h-6" opacity=".35"/><path d="M38 36l-4.5-4.5" opacity=".22"/></svg>',
    selfesteem:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="24" cy="18" r="9"/><ellipse cx="24" cy="37" rx="9" ry="3" opacity=".3"/></svg>'
  };

  var TOPICS = [
    {
      id: "anxiety",
      icon: ICONS.anxiety,
      title: { en: "Anxiety", ru: "Тревога" },
      teaser: {
        en: "Racing thoughts, a tight chest, waiting for something bad.",
        ru: "Мысли несутся, тесно в груди, ожидание чего-то плохого."
      },
      intro: {
        en: "Anxiety can make your own mind feel like unsafe territory — racing thoughts, a tight chest, the sense that something bad is about to happen. It's exhausting, and it's not a character flaw. Your nervous system is just trying, too hard, to protect you.",
        ru: "Тревога умеет превратить собственную голову в небезопасное место — мысли несутся, в груди тесно, кажется, что вот-вот случится что-то плохое. Это выматывает, и это не изъян характера. Ваша нервная система просто слишком старается вас защитить."
      },
      feelings: {
        en: ["Racing or looping thoughts", "Restlessness, trouble sitting still", "A tight chest or stomach", "Trouble sleeping", "Feeling \"on edge\" for no clear reason"],
        ru: ["Несущиеся или повторяющиеся мысли", "Беспокойство, трудно усидеть на месте", "Сжатие в груди или животе", "Проблемы со сном", "Ощущение «на грани» без явной причины"]
      },
      practice: {
        en: "Try box breathing for one minute: in for 4, hold for 4, out for 4, hold for 4. It won't erase anxiety, but it gives your body a clear, simple signal that it's safe to slow down. There's a guided version in the Tools section below.",
        ru: "Попробуйте квадратное дыхание одну минуту: вдох на 4 счёта, задержка на 4, выдох на 4, задержка на 4. Это не уберёт тревогу, но даст телу простой сигнал — сейчас можно немного сбавить обороты. Направляемая версия есть ниже, в разделе «Инструменты»."
      }
    },
    {
      id: "depression",
      icon: ICONS.depression,
      title: { en: "Depression", ru: "Депрессия" },
      teaser: {
        en: "Everything feels flat, heavy, or far away.",
        ru: "Всё кажется плоским, тяжёлым или далёким."
      },
      intro: {
        en: "Depression isn't sadness with better posture — it can flatten everything, including the things you used to enjoy. If getting out of bed felt like an achievement today, it was one.",
        ru: "Депрессия — это не просто грусть с прямой спиной. Она может обесцветить всё, включая то, что раньше радовало. Если встать сегодня с кровати было достижением — значит, так оно и было."
      },
      feelings: {
        en: ["Low energy, everything feels harder", "Losing interest in things you used to like", "Trouble concentrating", "Feeling numb or heavy", "Sleeping too much or too little"],
        ru: ["Мало сил, всё даётся тяжелее", "Пропал интерес к тому, что раньше нравилось", "Трудно сосредоточиться", "Ощущение онемения или тяжести", "Слишком много или слишком мало сна"]
      },
      practice: {
        en: "Pick one small, physical action — open a window, drink a glass of water, step outside for two minutes. Not to \"fix\" anything. Just to remind your body that it can still choose something, however small.",
        ru: "Выберите одно маленькое, физическое действие — открыть окно, выпить стакан воды, выйти на улицу на две минуты. Не чтобы что-то «починить». Просто чтобы напомнить телу: оно всё ещё может выбрать хоть что-то, даже совсем небольшое."
      }
    },
    {
      id: "loneliness",
      icon: ICONS.loneliness,
      title: { en: "Loneliness", ru: "Одиночество" },
      teaser: {
        en: "Invisible, even in a room full of people.",
        ru: "Невидимый(ая), даже среди людей."
      },
      intro: {
        en: "You can be surrounded by people and still feel completely unseen. Loneliness isn't about how many people are around you — it's about how connected you feel to them.",
        ru: "Можно быть среди людей и всё равно чувствовать себя совершенно невидимым. Одиночество — не про количество людей рядом, а про то, насколько связанным с ними вы себя чувствуете."
      },
      feelings: {
        en: ["Feeling invisible even in a crowd", "Avoiding messages because talking feels like too much", "Missing a specific kind of closeness", "Assuming people don't really want to hear from you"],
        ru: ["Ощущение невидимости даже в компании", "Избегание сообщений, потому что говорить кажется непосильным", "Тоска по особой близости", "Ощущение, что вы никому не интересны"]
      },
      practice: {
        en: "Reaching out first is hard when you feel this way — so make it small. One honest message to one person: \"Been a rough week, just wanted to say hi.\" You don't need a reason to matter to someone.",
        ru: "Написать первым тяжело, когда чувствуешь себя так. Поэтому сделайте это маленьким. Одно честное сообщение одному человеку: «Тяжёлая неделя, просто хотел(а) сказать привет». Вам не нужна причина, чтобы быть кому-то важным."
      }
    },
    {
      id: "grief",
      icon: ICONS.grief,
      title: { en: "Grief & loss", ru: "Утрата" },
      teaser: {
        en: "For a person, a version of you, or a future you'd planned on.",
        ru: "По человеку, версии себя или будущему, на которое рассчитывали."
      },
      intro: {
        en: "Grief doesn't follow a schedule, and it isn't only for death — you can grieve a relationship, a version of yourself, a future you'd planned on. There's no correct way to do this, and no deadline.",
        ru: "Горе не идёт по расписанию, и оно бывает не только по умершим — можно горевать по отношениям, по прежней версии себя, по будущему, на которое рассчитывали. Здесь нет правильного способа и нет дедлайна."
      },
      feelings: {
        en: ["Waves of sadness that arrive without warning", "Anger, or guilt that doesn't quite make sense", "Numbness", "Missing someone or something fiercely, at odd moments"],
        ru: ["Волны грусти без предупреждения", "Злость или чувство вины, которым нет чёткого объяснения", "Онемение", "Острая тоска по кому-то или чему-то в неожиданные моменты"]
      },
      practice: {
        en: "Give yourself permission to feel it without immediately trying to \"move past\" it. Grief tends to soften with time and witness, not with force. If you can, tell one person what you lost — saying it out loud can loosen its grip a little.",
        ru: "Разрешите себе почувствовать это, не пытаясь сразу «двигаться дальше». Горе обычно смягчается временем и присутствием кого-то рядом, а не усилием воли. Если можете — расскажите одному человеку, что вы потеряли: произнести это вслух иногда немного ослабляет хватку."
      }
    },
    {
      id: "bullying",
      icon: ICONS.bullying,
      title: { en: "Bullying & harassment", ru: "Буллинг и травля" },
      teaser: {
        en: "Online, at school, at work — none of it is your fault.",
        ru: "В сети, в школе, на работе — и это не ваша вина."
      },
      intro: {
        en: "If someone is targeting you — online, at school, at work — this is not because something is wrong with you. Bullying says everything about the person doing it, and nothing about your worth.",
        ru: "Если кто-то травит вас — в сети, в школе, на работе — это не потому, что с вами что-то не так. Буллинг говорит всё о том, кто его совершает, и ничего — о вашей ценности."
      },
      feelings: {
        en: ["Dreading a place or platform that used to feel safe", "Replaying what was said, over and over", "Feeling small, isolated, or ashamed", "Doubting your own version of events"],
        ru: ["Страх перед местом или платформой, где раньше было безопасно", "Прокручивание сказанного в голове снова и снова", "Ощущение себя маленьким, изолированным или пристыженным", "Сомнение в собственной памяти о случившемся"]
      },
      practice: {
        en: "Where you can, keep evidence — screenshots, dates, what happened. It helps if you ever decide to report it, and it also helps you trust your own memory of events. And tell at least one person you trust. This is not something you have to carry by yourself.",
        ru: "Где возможно — сохраняйте доказательства: скриншоты, даты, что произошло. Это поможет, если решите пожаловаться, и поможет доверять собственной памяти о случившемся. И расскажите хотя бы одному человеку, которому доверяете. Это не то, что нужно нести в одиночку."
      }
    },
    {
      id: "disability",
      icon: ICONS.disability,
      title: { en: "Disability & chronic illness", ru: "Инвалидность и хронические болезни" },
      teaser: {
        en: "The exhaustion of a world not built with you in mind.",
        ru: "Усталость от мира, который построен не с расчётом на вас."
      },
      intro: {
        en: "You're not broken, and you don't owe anyone a version of yourself that pretends this is easier than it is. A lot of the exhaustion isn't from your body or mind alone — it's from moving through a world that wasn't built with you in mind.",
        ru: "Вы не «сломаны», и вы никому не обязаны версией себя, которая делает вид, что всё легко. Часть усталости — не только от тела или разума самих по себе, а от того, что приходится двигаться через мир, который построен не с расчётом на вас."
      },
      feelings: {
        en: ["Fatigue that healthy people don't quite understand", "Grief for abilities or plans that changed", "Frustration with constantly explaining yourself", "Pride in things that go unnoticed"],
        ru: ["Усталость, которую здоровые люди не понимают", "Горе по способностям или планам, которые изменились", "Раздражение от необходимости постоянно всё объяснять", "Гордость за то, что остаётся незамеченным"]
      },
      practice: {
        en: "Rest is not something you need to earn. If today is a smaller day, it's still a full day. Where you can, find spaces — online or in person — built by and for people who get it without explanation.",
        ru: "Отдых не нужно заслуживать. Если сегодня день поменьше — он всё равно полноценный день. Где возможно, ищите пространства — онлайн или вживую — созданные людьми, которые понимают без объяснений."
      }
    },
    {
      id: "burnout",
      icon: ICONS.burnout,
      title: { en: "Burnout", ru: "Выгорание" },
      teaser: {
        en: "Hollowed out from giving too much, for too long.",
        ru: "Опустошённость от того, что отдавали слишком много и слишком долго."
      },
      intro: {
        en: "Burnout isn't just being tired. It's the specific, hollowed-out feeling of having given so much for so long that even things you love feel like a burden now.",
        ru: "Выгорание — это не просто усталость. Это то самое опустошённое чувство, когда отдавал(а) так много и так долго, что даже любимые вещи теперь ощущаются как груз."
      },
      feelings: {
        en: ["Cynicism about things you used to care about", "Exhaustion that sleep doesn't fix", "Feeling ineffective no matter how hard you try", "Dreading things that used to feel neutral"],
        ru: ["Цинизм по отношению к тому, что раньше было важно", "Усталость, которую не лечит сон", "Ощущение неэффективности, сколько бы вы ни старались", "Тревога перед вещами, которые раньше были нейтральны"]
      },
      practice: {
        en: "Burnout usually isn't solved by \"trying harder\" at rest — it's solved by reducing what's being asked of you, even slightly. What's one thing, this week, you could put down, delay, or ask for help with?",
        ru: "Выгорание обычно не лечится тем, чтобы «стараться отдыхать усерднее» — оно лечится снижением того, что от вас требуют, пусть даже немного. Что одно вы могли бы на этой неделе отложить, снять с себя или попросить кого-то взять на себя?"
      }
    },
    {
      id: "selfesteem",
      icon: ICONS.selfesteem,
      title: { en: "Low self-esteem", ru: "Низкая самооценка" },
      teaser: {
        en: "That loud inner voice — it isn't accurate.",
        ru: "Тот громкий внутренний голос — он не точен."
      },
      intro: {
        en: "That voice that lists everything wrong with you? It's loud, but it isn't accurate. Low self-esteem often isn't about your actual worth — it's a habit your mind learned somewhere, and habits can change.",
        ru: "Тот голос, что перечисляет всё, что с вами не так? Он громкий, но не точный. Низкая самооценка часто не про вашу реальную ценность — это привычка, которую разум где-то усвоил, а привычки можно изменить."
      },
      feelings: {
        en: ["Assuming the worst about yourself by default", "Struggling to accept compliments", "Comparing yourself constantly to others", "Feeling like you have to earn basic kindness"],
        ru: ["По умолчанию ждать от себя худшего", "Трудно принимать комплименты", "Постоянно сравнивать себя с другими", "Ощущение, что доброе отношение нужно заслужить"]
      },
      practice: {
        en: "Try noticing, not fixing, just noticing, one moment today when you were unnecessarily hard on yourself. Ask: would I say this to someone I love? If not, that's information — not about you, but about the voice.",
        ru: "Попробуйте просто заметить (не исправить — именно заметить) один момент сегодня, когда вы были к себе не по делу строги. Спросите: сказал(а) бы я это тому, кого люблю? Если нет — это информация не о вас, а об этом голосе."
      }
    }
  ];

  var HELP_RESOURCES = [
    {
      name: "Детский телефон доверия",
      region: { en: "Russia", ru: "Россия" },
      desc: {
        en: "8-800-2000-122 — free, anonymous, 24/7, for children, teens and parents.",
        ru: "8-800-2000-122 — бесплатно, анонимно, круглосуточно, для детей, подростков и родителей."
      },
      url: "telefon-doveria.ru"
    },
    {
      name: "988 Suicide & Crisis Lifeline",
      region: { en: "United States", ru: "США" },
      desc: {
        en: "Call or text 988 — free, 24/7.",
        ru: "Звонок или сообщение на 988 — бесплатно, круглосуточно."
      },
      url: "988lifeline.org"
    },
    {
      name: "Find A Helpline",
      region: { en: "Worldwide", ru: "Весь мир" },
      desc: {
        en: "A directory of free, confidential helplines by country and topic.",
        ru: "Каталог бесплатных конфиденциальных линий помощи по странам и темам."
      },
      url: "findahelpline.com"
    },
    {
      name: "Befrienders Worldwide",
      region: { en: "Worldwide", ru: "Весь мир" },
      desc: {
        en: "Emotional support centres in more than 30 countries.",
        ru: "Центры эмоциональной поддержки в более чем 30 странах."
      },
      url: "befrienders.org"
    }
  ];

  var PET_MESSAGES = {
    en: [
      "You showed up today. That counts.",
      "It's okay to rest for a while.",
      "Whatever today felt like, I'm glad you're here.",
      "You don't have to be productive to be worthy.",
      "Small steps still move you forward.",
      "You've survived every hard day so far. That's not nothing.",
      "Breathing counts as doing something.",
      "I'm not going anywhere."
    ],
    ru: [
      "Ты сегодня справился(ась) с тем, чтобы просто быть здесь. Это важно.",
      "Можно немного отдохнуть.",
      "Каким бы ни был сегодняшний день — я рад(а), что ты здесь.",
      "Тебе не нужно быть продуктивным(ой), чтобы что-то значить.",
      "Маленькие шаги всё равно двигают тебя вперёд.",
      "Ты пережил(а) каждый трудный день до сегодняшнего. Это немало.",
      "Дышать — это уже что-то делать.",
      "Я никуда не денусь."
    ]
  };

  var MOOD_OPTIONS = [
    { id: "struggling", emoji: "😔", label: { en: "Struggling", ru: "Тяжело" }, reflection: { en: "That's a real place to be. Be extra gentle with yourself today.", ru: "Это по-настоящему тяжёлое состояние. Сегодня отнеситесь к себе особенно бережно." } },
    { id: "anxious", emoji: "😟", label: { en: "Anxious", ru: "Тревожно" }, reflection: { en: "Your nervous system is working overtime. The breathing tool above might help, even a little.", ru: "Ваша нервная система сейчас работает на пределе. Дыхательная практика выше может немного помочь." } },
    { id: "okay", emoji: "😐", label: { en: "Okay", ru: "Нормально" }, reflection: { en: "\"Okay\" is a perfectly good place to be.", ru: "«Нормально» — это вполне достаточно хорошо." } },
    { id: "good", emoji: "🙂", label: { en: "Good", ru: "Хорошо" }, reflection: { en: "Good. Try to hold onto this feeling a little.", ru: "Хорошо. Постарайтесь немного задержаться в этом ощущении." } },
    { id: "calm", emoji: "😌", label: { en: "Calm", ru: "Спокойно" }, reflection: { en: "That's a nice place to rest for a while.", ru: "Хорошее место, чтобы немного здесь отдохнуть." } }
  ];

  var UI = {
    en: {
      nav: { topics: "Topics", tools: "Tools", companion: "Companion", moments: "Moments", support: "Support" },
      lang: { label: "EN" },
      sound: { label: "Toggle ambient sound" },

      hero: {
        badge: "Take a breath",
        title1: "Find the", titleAccent: "quiet", title3: "inside you.",
        lead: "HAVN is a digital space built for stillness — and, if you need it, a quiet place to start feeling a little better.",
        cta1: "Enter", cta2: "How to be here", scroll: "Scroll"
      },
      philosophy: {
        text: "In a world that never stops moving, HAVN is the place that stands still — a quiet interval between everything you have to do, and everything you are.",
        elementsLabel: "The elements", el1: "Light", el2: "Air", el3: "Water", el4: "Silence"
      },
      topics: {
        eyebrow: "You're not alone",
        title1: "Whatever you're", title2: "carrying right now.",
        desc: "Pick whatever feels closest. There's no quiz and no diagnosis here — just a place to start.",
        feelingsLabel: "You might be feeling",
        practiceLabel: "A small thing that might help",
        closing: "If this feels bigger than a website can hold, that's okay — that's what Support, below, is for.",
        openSupport: "Go to Support →",
        close: "Close"
      },
      spaces: {
        eyebrow: "Spaces", title1: "Five rooms,", title2: "one quiet.",
        desc: "Each part of HAVN holds a different kind of calm. Move through them slowly — there's nowhere else you need to be.",
        s1n: "Stillness", s1d: "A pause built into the interface.",
        s2n: "Light", s2d: "Morning glow, held in glass.",
        s3n: "Breath", s3d: "Rhythms slow enough to feel.",
        s4n: "Reflection", s4d: "Water for the mind to settle in.",
        s5n: "Horizon", s5d: "Space enough to think clearly."
      },
      tools: {
        eyebrow: "A few tools", title1: "Small things", title2: "that help.",
        desc: "None of these fix everything. They're just small, real ways to feel a little steadier right now.",
        breathTitle: "Breathe with me", breathDesc: "One minute of box breathing — in, hold, out, hold.",
        breathStart: "Begin", breathStop: "Stop",
        breathIn: "Breathe in", breathHold: "Hold", breathOut: "Breathe out",
        groundTitle: "Come back to the room", groundDesc: "The 5-4-3-2-1 grounding technique, for when things feel like too much.",
        groundSteps: ["Name 5 things you can see", "4 things you can touch", "3 things you can hear", "2 things you can smell", "1 thing you can taste"],
        groundNext: "Next", groundRestart: "Start over", groundDone: "Well done. You're here, right now.",
        moodTitle: "How are you, right now?", moodDesc: "Just for you — this stays on this device, and nowhere else.",
        moodAgain: "Update today's check-in"
      },
      companion: {
        eyebrow: "Some company", title1: "You don't have to", title2: "sit with this alone.",
        desc: "Pick a companion. Rename it if you'd like. It'll be here whenever you come back — no feeding schedule, no pressure.",
        pickCat: "Cat", pickDog: "Dog",
        hint: "Click to say hi", rename: "rename",
        catName: "Momo", dogName: "Biscuit"
      },
      statement: { text: "Stillness is a place you can visit." },
      ritual: {
        eyebrow: "A quiet ritual", title: "How to be here.",
        desc: "There's no wrong way to visit HAVN. But if it helps, here's how most people settle in.",
        r1t: "Arrive", r1d: "Let the page load. There's no rush — nothing here is timed.",
        r2t: "Breathe", r2d: "Scroll slowly. Let the light move at its own pace, not yours.",
        r3t: "Listen", r3d: "Turn on sound, if you'd like a little company.",
        r4t: "Stay", r4d: "Stay as long as you need. Leave whenever you're ready."
      },
      presence: {
        eyebrow: "Presence", title1: "Some quiet,", title2: "from other visitors.",
        q1: "For the first time in weeks, I didn't feel so alone with it.", q1a: "— M.",
        q2: "I came for the visuals and stayed for the breathing exercise. Weird, but it helped.", q2a: "— J.",
        q3: "The topics section said things I didn't have words for yet.", q3a: "— A."
      },
      gallery: {
        eyebrow: "Moments", title1: "A few things", title2: "we noticed.",
        desc: "Nothing staged — just what stillness tends to look like, held for a moment.",
        t1: "Morning", t1d: "Light, arriving slowly.",
        t2: "Depth", t2d: "Water holds no rush.",
        t3: "Passing", t3d: "Clouds pass. HAVN stays.",
        t4: "Glass", t4d: "Even reflections can rest.",
        t5: "Horizon", t5d: "Enough space to think."
      },
      help: {
        eyebrow: "Support", title1: "If today is heavy,", title2: "you don't have to carry it alone.",
        body: "HAVN is a quiet place, not a substitute for a person, a doctor, or a crisis line. If you're in immediate danger, please contact your local emergency number. If you need to talk to someone right now, these are real, free places to start:",
        closing: "None of these replace real, ongoing care — but any one of them is a real place to start."
      },
      cta: {
        eyebrow: "Before you go", title1: "Carry this", titleAccent: "quiet", title3: "with you.",
        sub: "Come back whenever the noise outside gets loud. HAVN will still be here, moving slowly.",
        button: "Return to the surface"
      },
      footer: {
        tagline: "A digital sanctuary for a noisy world.",
        explore: "Explore", support: "Get support", connect: "Connect",
        philosophy: "Philosophy", spacesLink: "Spaces", ritual: "Ritual", presence: "Presence", moments: "Moments",
        topicsLink: "Topics", toolsLink: "Tools", companionLink: "Companion", helpLink: "Support",
        copyright: "HAVN. A digital sanctuary.", toTop: "Back to top ↑"
      },
      loader: { word: "Arriving, quietly" }
    },

    ru: {
      nav: { topics: "Темы", tools: "Инструменты", companion: "Питомец", moments: "Моменты", support: "Поддержка" },
      lang: { label: "RU" },
      sound: { label: "Включить фоновый звук" },

      hero: {
        badge: "Сделай вдох",
        title1: "Найди", titleAccent: "тишину", title3: "внутри себя.",
        lead: "HAVN — цифровое пространство для спокойствия, а если нужно — тихое место, чтобы начать чувствовать себя немного лучше.",
        cta1: "Войти", cta2: "Как здесь находиться", scroll: "Листайте"
      },
      philosophy: {
        text: "В мире, который никогда не останавливается, HAVN — место, которое стоит неподвижно: тихий промежуток между всем, что вы должны сделать, и всем, кто вы есть.",
        elementsLabel: "Стихии", el1: "Свет", el2: "Воздух", el3: "Вода", el4: "Тишина"
      },
      topics: {
        eyebrow: "Вы не одни",
        title1: "Что бы вы сейчас", title2: "ни несли на себе.",
        desc: "Выберите то, что ближе всего. Здесь нет теста и нет диагноза — только место, чтобы начать.",
        feelingsLabel: "Возможно, вы чувствуете",
        practiceLabel: "Что может немного помочь",
        closing: "Если это ощущается тяжелее, чем может выдержать один сайт — это нормально. Именно для этого ниже есть раздел «Поддержка».",
        openSupport: "К разделу «Поддержка» →",
        close: "Закрыть"
      },
      spaces: {
        eyebrow: "Пространства", title1: "Пять комнат,", title2: "одна тишина.",
        desc: "Каждая часть HAVN хранит свой оттенок спокойствия. Проходите через них медленно — спешить некуда.",
        s1n: "Тишина", s1d: "Пауза, встроенная в интерфейс.",
        s2n: "Свет", s2d: "Утреннее сияние, застывшее в стекле.",
        s3n: "Дыхание", s3d: "Ритмы, достаточно медленные, чтобы их почувствовать.",
        s4n: "Отражение", s4d: "Вода, в которой разум может успокоиться.",
        s5n: "Горизонт", s5d: "Пространство, чтобы ясно мыслить."
      },
      tools: {
        eyebrow: "Немного инструментов", title1: "Маленькие вещи,", title2: "которые помогают.",
        desc: "Ни один из них не решит всё разом. Это просто небольшие, настоящие способы почувствовать себя чуть устойчивее прямо сейчас.",
        breathTitle: "Подышим вместе", breathDesc: "Одна минута квадратного дыхания — вдох, задержка, выдох, задержка.",
        breathStart: "Начать", breathStop: "Остановить",
        breathIn: "Вдох", breathHold: "Задержка", breathOut: "Выдох",
        groundTitle: "Вернуться в комнату", groundDesc: "Техника заземления 5-4-3-2-1 — когда всё ощущается слишком сильно.",
        groundSteps: ["Назовите 5 вещей, которые видите", "4 вещи, которые можете потрогать", "3 звука, которые слышите", "2 запаха", "1 вкус"],
        groundNext: "Далее", groundRestart: "Начать заново", groundDone: "Отлично. Вы здесь, прямо сейчас.",
        moodTitle: "Как вы сейчас?", moodDesc: "Это только для вас — остаётся на этом устройстве и больше нигде.",
        moodAgain: "Обновить отметку за сегодня"
      },
      companion: {
        eyebrow: "Немного компании", title1: "Не обязательно", title2: "переживать это в одиночку.",
        desc: "Выберите питомца. При желании переименуйте. Он будет здесь при каждом вашем возвращении — без расписания кормления и без давления.",
        pickCat: "Кот", pickDog: "Пёс",
        hint: "Нажмите, чтобы поздороваться", rename: "переименовать",
        catName: "Мурзик", dogName: "Бублик"
      },
      statement: { text: "Тишина — это место, которое можно посетить." },
      ritual: {
        eyebrow: "Тихий ритуал", title: "Как здесь находиться.",
        desc: "Нет неправильного способа посетить HAVN. Но если это поможет — вот как обычно устраиваются здесь.",
        r1t: "Прибыть", r1d: "Дайте странице загрузиться. Спешить некуда — здесь всё без таймера.",
        r2t: "Дышать", r2d: "Листайте медленно. Пусть свет движется в своём темпе, а не в вашем.",
        r3t: "Слушать", r3d: "Включите звук, если хочется немного компании.",
        r4t: "Остаться", r4d: "Останьтесь, сколько нужно. Уйдите, когда будете готовы."
      },
      presence: {
        eyebrow: "Присутствие", title1: "Немного тишины", title2: "от других посетителей.",
        q1: "Впервые за много недель я не чувствовал(а) себя настолько одиноким(ой) с этим.", q1a: "— М.",
        q2: "Пришёл(шла) ради картинки, остался(ась) ради дыхательного упражнения. Странно, но помогло.", q2a: "— Д.",
        q3: "В разделе про темы было написано то, для чего у меня ещё не было слов.", q3a: "— А."
      },
      gallery: {
        eyebrow: "Моменты", title1: "Несколько вещей,", title2: "которые мы заметили.",
        desc: "Ничего постановочного — просто как обычно выглядит тишина, застывшая на мгновение.",
        t1: "Утро", t1d: "Свет, приходящий медленно.",
        t2: "Глубина", t2d: "Вода не спешит.",
        t3: "Мимолётное", t3d: "Облака проходят. HAVN остаётся.",
        t4: "Стекло", t4d: "Даже отражения могут отдыхать.",
        t5: "Горизонт", t5d: "Достаточно пространства, чтобы думать."
      },
      help: {
        eyebrow: "Поддержка", title1: "Если сегодня тяжело,", title2: "не обязательно нести это в одиночку.",
        body: "HAVN — тихое место, а не замена человеку, врачу или кризисной линии. Если вам угрожает непосредственная опасность, пожалуйста, обратитесь в экстренные службы вашей страны. Если нужно поговорить с кем-то прямо сейчас — вот реальные бесплатные варианты, с которых можно начать:",
        closing: "Ни один из этих вариантов не заменяет постоянную помощь специалиста — но с любого из них можно начать по-настоящему."
      },
      cta: {
        eyebrow: "Прежде чем уйти", title1: "Унесите эту", titleAccent: "тишину", title3: "с собой.",
        sub: "Возвращайтесь, когда шум снаружи станет слишком громким. HAVN всё ещё будет здесь, двигаясь медленно.",
        button: "Вернуться на поверхность"
      },
      footer: {
        tagline: "Цифровое убежище для шумного мира.",
        explore: "Разделы", support: "Поддержка", connect: "Связь",
        philosophy: "Философия", spacesLink: "Пространства", ritual: "Ритуал", presence: "Присутствие", moments: "Моменты",
        topicsLink: "Темы", toolsLink: "Инструменты", companionLink: "Питомец", helpLink: "Поддержка",
        copyright: "HAVN. Цифровое убежище.", toTop: "Наверх ↑"
      },
      loader: { word: "Тихо загружаемся" }
    }
  };

  global.HAVN_CONTENT = {
    UI: UI,
    TOPICS: TOPICS,
    HELP_RESOURCES: HELP_RESOURCES,
    PET_MESSAGES: PET_MESSAGES,
    MOOD_OPTIONS: MOOD_OPTIONS
  };
})(window);
