/* =========================================================
   КОНТАКТЫ — единственное место, где они прописаны.
   Поменяли здесь — поменялось везде: в шапке, подвале, кнопке
   поддержки и в письме из формы заявки.

   Пустое значение = канал просто не показывается.
   ========================================================= */
window.CONTACTS = {
  /* Telegram: только имя пользователя, без @ и без ссылки */
  telegram: 'nikita_na_tvoe_ysmotrenie',

  /* WhatsApp: номер в международном формате, только цифры.
     Например '77001234567'. Пусто — кнопки WhatsApp не будет. */
  whatsapp: '',

  /* Почта для заявок — на неё уходит письмо из формы */
  mail: 'natvoeusmotrenie@gmail.com',

  /* Вторая почта, например для вопросов по текущим проектам.
     Пусто — показывается только основная. */
  mailSupport: '',

  /* ---------- ОТПРАВКА ЗАЯВОК ЧЕРЕЗ FORMSPREE ----------
     Пока здесь пусто, форма работает по-старому: открывает почтовую
     программу у посетителя. Впишите сюда код своей формы — и заявки
     начнут приходить на почту сами, без участия посетителя.

     Где взять: formspree.io → регистрация → New form → в поле
     «Send to» ваша почта → Create. Formspree покажет адрес вида
     https://formspree.io/f/xayzqwer — нужен только хвост: xayzqwer

     Первая заявка придёт с письмом-подтверждением: нажмите в нём
     ссылку, иначе остальные не дойдут. */
  formspree: 'mzezbpey'
};

/* ---------- Расстановка по странице ----------
   Любая ссылка с атрибутом data-contact получает нужный адрес:
   data-contact="telegram" | "whatsapp" | "mail" | "mailSupport"
   Если значение пустое — ссылка убирается со страницы. */
(function () {
  'use strict';

  var C = window.CONTACTS;

  function href(kind) {
    if (kind === 'telegram') return C.telegram ? 'https://t.me/' + C.telegram : '';
    if (kind === 'whatsapp') return C.whatsapp ? 'https://wa.me/' + C.whatsapp : '';
    if (kind === 'mail') return C.mail ? 'mailto:' + C.mail : '';
    if (kind === 'mailSupport') return C.mailSupport ? 'mailto:' + C.mailSupport : '';
    return '';
  }

  function label(kind) {
    if (kind === 'telegram') return '@' + C.telegram;
    if (kind === 'whatsapp') return '+' + C.whatsapp;
    if (kind === 'mail') return C.mail;
    if (kind === 'mailSupport') return C.mailSupport;
    return '';
  }

  function apply() {
    var links = document.querySelectorAll('[data-contact]');
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      var kind = el.getAttribute('data-contact');
      var url = href(kind);

      if (!url) {                       // канала нет — прячем вместе с обёрткой
        var box = el.closest('.contact__block') || el.closest('li') || el;
        box.hidden = true;
        continue;
      }
      el.hidden = false;
      el.setAttribute('href', url);
      if (el.hasAttribute('data-contact-label')) el.textContent = label(kind);
      if (kind === 'telegram' || kind === 'whatsapp') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
    }

    /* Адрес почты внутри сообщения об отправке формы */
    var slots = document.querySelectorAll('[data-contact-mail]');
    for (var j = 0; j < slots.length; j++) slots[j].textContent = C.mail;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
  document.addEventListener('i18n:applied', apply);   // перевод переписал ссылки — ставим заново
})();
