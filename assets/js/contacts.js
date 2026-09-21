/* ============================================================
   contacts.js — единая точка правды для контактов студии.
   Проставляет href/текст всем [data-contact], [data-contact-label]
   и [data-contact-mail] элементам на странице.
   ============================================================ */
(function () {
  'use strict';

  var CONTACTS = {
    mail: 'natvoeusmotrenie@gmail.com',
    telegramHandle: 'nikita_na_tvoe_ysmotrenie',
  };

  function apply() {
    document.querySelectorAll('[data-contact="mail"]').forEach(function (el) {
      el.setAttribute('href', 'mailto:' + CONTACTS.mail);
      if (el.hasAttribute('data-contact-label')) el.textContent = CONTACTS.mail;
    });

    document.querySelectorAll('[data-contact="telegram"]').forEach(function (el) {
      el.setAttribute('href', 'https://t.me/' + CONTACTS.telegramHandle);
      if (el.hasAttribute('data-contact-label')) el.textContent = '@' + CONTACTS.telegramHandle;
    });

    document.querySelectorAll('[data-contact-mail]').forEach(function (el) {
      el.textContent = CONTACTS.mail;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  // На случай, если lang.js/i18n.js перерисуют разметку после смены языка.
  window.addEventListener('i18n:applied', apply);
})();
