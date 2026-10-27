/* Интерактивное ядро сайта серии «Сказки Мудрости Юпитера» (skazki-yupiter.ru)
 * Автор серии: Зинаида Юпитер
 * Стандарты: [[skazki-mudrosti-yupiter]] + [[sozdatel-saytov]] + [[modern-web-guidance]]
 */
(function () {
  'use strict';

  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'];
  var books = window.JUPITER_BOOKS_DATA || [];
  var currentCatalogMode = 'fam'; // 'fam' (6+) or 'mgmt' (12+)
  var currentSearch = '';
  var activeBookNum = 1;
  var activeTab = 'story'; // 'story' | 'kids' | 'matrix'
  var activeSceneIdx = 0;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDropCap(text) {
    var t = String(text || '').trim();
    if (!t) return '';
    return '<span class="drop-cap">' + escapeHtml(t.charAt(0)) + '</span>' + escapeHtml(t.slice(1));
  }

  function getBookByNum(num) {
    for (var i = 0; i < books.length; i++) {
      if (books[i].num === Number(num)) return books[i];
    }
    return books[0] || null;
  }

  /* 1. Рендер каталога всех 16 книг */
  function renderCatalog() {
    var grid = document.getElementById('books-grid');
    if (!grid) return;

    var q = currentSearch.trim().toLowerCase();
    var filtered = books.filter(function (b) {
      if (!q) return true;
      var hay = (b.title_ru + ' ' + b.title_en + ' ' + b.subtitle_ru + ' ' + b.klyuch_malym + ' ' + b.klyuch_bolshim).toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    if (!filtered.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;padding:32px;text-align:center;background:var(--bg-card);border:1.5px solid var(--border-ornate);border-radius:12px;">Книги по вашему запросу не найдены. Попробуйте очистить строку поиска.</div>';
      return;
    }

    grid.innerHTML = filtered.map(function (b) {
      var roman = ROMAN[b.num - 1] || b.num;
      var isMgmt = currentCatalogMode === 'mgmt';
      var coverSrc = isMgmt ? b.cover_mgmt : b.cover_fam;
      var ageTag = isMgmt ? '12+ (Советы)' : '6+ (Семья)';
      var keyLabel = isMgmt ? 'Ключик для взрослых:' : 'Ключик для детей (6+):';
      var keyText = isMgmt ? b.klyuch_bolshim : b.klyuch_malym;

      return [
        '<article class="book-card" data-book-num="' + b.num + '">',
        '  <div class="book-card__cover-wrap" data-open-reader="' + b.num + '" title="Открыть книгу «' + escapeHtml(b.title_ru) + '»">',
        '    <span class="book-card__issue-pill">Книга ' + roman + '</span>',
        '    <span class="book-card__age-pill">' + ageTag + '</span>',
        '    <img src="' + escapeHtml(coverSrc) + '" alt="Обложка книги «' + escapeHtml(b.title_ru) + '», автор: Зинаида Юпитер" width="360" height="540">',
        '  </div>',
        '  <div class="book-card__body">',
        '    <h3 class="book-card__title">' + escapeHtml(b.title_ru) + '</h3>',
        '    <div class="book-card__en">' + escapeHtml(b.title_en) + ' (' + escapeHtml(b.origin_culture) + ')</div>',
        '    <div class="book-card__key"><strong>' + keyLabel + '</strong><br>' + escapeHtml(keyText) + '</div>',
        '    <div class="book-card__actions">',
        '      <button type="button" class="btn btn--primary btn--sm" data-open-reader="' + b.num + '">Открыть книгу в читальном зале</button>',
        '      <div class="book-card__pdf-links">',
        '        <a href="' + escapeHtml(b.pdf_fam) + '" target="_blank" rel="noopener">PDF 6+ (Семья)</a>',
        '        <a href="' + escapeHtml(b.pdf_mgmt) + '" target="_blank" rel="noopener">PDF 12+ (Советы)</a>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</article>'
      ].join('\n');
    }).join('\n');
  }

  /* 2. Построение HTML разбора книги (для тренажёра на странице и модального читального зала) */
  function buildBookExplorerHtml(b, tab, sceneIdx) {
    if (!b) return '';
    var roman = ROMAN[b.num - 1] || b.num;
    var scenes = b.sceny || [];
    var sIdx = Math.max(0, Math.min(sceneIdx || 0, scenes.length - 1));
    var currentScene = scenes[sIdx] || { scena: 1, aforizm_ru: '', tekst_ru: '', img: b.cover_fam };

    var headerHtml = [
      '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid var(--gold-deep);">',
      '  <div>',
      '    <div style="font-size:12px;font-weight:700;color:var(--cinnabar);letter-spacing:1.2px;text-transform:uppercase;">Книга ' + roman + ', серия «Сказки Мудрости Юпитера»</div>',
      '    <h3 style="font-family:var(--font-serif);font-size:26px;margin:4px 0;color:var(--bg-walnut);">«' + escapeHtml(b.title_ru) + '» <span style="font-size:16px;font-weight:400;color:var(--ink-muted);">(' + escapeHtml(b.title_en) + ')</span></h3>',
      '    <div style="font-size:14px;color:var(--ink-secondary);">' + escapeHtml(b.subtitle_ru) + '</div>',
      '  </div>',
      '  <div style="display:flex;flex-wrap:wrap;gap:8px;">',
      '    <a href="' + escapeHtml(b.pdf_fam) + '" target="_blank" rel="noopener" class="btn btn--outline btn--sm">PDF 6+ (Для родителей и детей)</a>',
      '    <a href="' + escapeHtml(b.pdf_mgmt) + '" target="_blank" rel="noopener" class="btn btn--gold btn--sm">PDF 12+ (Советы и разбор)</a>',
      '  </div>',
      '</div>'
    ].join('\n');

    var tabsHtml = [
      '<div class="workbench-tabs" role="tablist">',
      '  <button type="button" class="workbench-tab ' + (tab === 'story' ? 'is-active' : '') + '" data-wb-tab="story">1. Сказка и иллюстрации</button>',
      '  <button type="button" class="workbench-tab ' + (tab === 'kids' ? 'is-active' : '') + '" data-wb-tab="kids">2. Беседа с ребёнком и игра «Три дороги» (6+)</button>',
      '  <button type="button" class="workbench-tab ' + (tab === 'matrix' ? 'is-active' : '') + '" data-wb-tab="matrix">3. Жизненные и управленческие советы (12+)</button>',
      '</div>'
    ].join('\n');

    var bodyHtml = '';

    if (tab === 'story') {
      var navBtns = scenes.map(function (sc, idx) {
        return '<button type="button" class="scene-btn ' + (idx === sIdx ? 'is-active' : '') + '" data-scene-idx="' + idx + '">Сцена ' + (idx + 1) + ' из ' + scenes.length + '</button>';
      }).join('');

      bodyHtml = [
        '<div style="background:var(--gold-soft);border-left:4px solid var(--cinnabar);padding:14px 18px;border-radius:8px;margin-bottom:20px;font-size:14.5px;">',
        '  <strong>Слово автора к читателю:</strong> ' + escapeHtml(b.predislovie_ru),
        '</div>',
        '<div class="story-scene-nav">' + navBtns + '</div>',
        '<div class="story-reader-grid">',
        '  <div class="plate-frame-web">',
        '    <img src="' + escapeHtml(currentScene.img) + '" alt="Иллюстрация к сказке «' + escapeHtml(b.title_ru) + '», сцена ' + (sIdx + 1) + '">',
        '    <div class="plate-caption-web">«' + escapeHtml(currentScene.aforizm_ru) + '»</div>',
        '  </div>',
        '  <div>',
        '    <div class="folio-story-box">',
        '      <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:var(--cinnabar);text-transform:uppercase;margin-bottom:10px;">Сцена ' + (sIdx + 1) + ' народной сказки</div>',
        '      <p style="margin:0 0 18px;">' + formatDropCap(currentScene.tekst_ru) + '</p>',
        '      <div style="clear:both;padding-top:14px;border-top:1px dashed var(--border-ornate);font-size:14px;color:var(--ink-secondary);">',
        '        <strong>Мысль под картиной:</strong> <em>' + escapeHtml(currentScene.aforizm_ru) + '</em>',
        '      </div>',
        '    </div>',
        '    <div style="display:flex;justify-content:space-between;margin-top:14px;">',
        '      <button type="button" class="btn btn--outline btn--sm" data-scene-idx="' + Math.max(0, sIdx - 1) + '" ' + (sIdx === 0 ? 'disabled' : '') + '>← Предыдущая сцена</button>',
        '      <button type="button" class="btn btn--primary btn--sm" data-scene-idx="' + Math.min(scenes.length - 1, sIdx + 1) + '" ' + (sIdx >= scenes.length - 1 ? 'disabled' : '') + '>Следующая сцена →</button>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('\n');
    } else if (tab === 'kids') {
      var questionsList = (b.voprosy_deti || []).map(function (qText) {
        return '<li style="padding:10px 14px;background:var(--bg-parchment);border-left:3.5px solid var(--gold-deep);border-radius:6px;margin-bottom:8px;">' + escapeHtml(qText) + '</li>';
      }).join('');

      var road = b.igra_3_dorogi || {};
      var semMat = b.matrica_semeynaya || {};
      var semKv = semMat.kvadraty || {};

      bodyHtml = [
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:24px;" class="editions-grid">',
        '  <div style="background:var(--bg-parchment);border:1.5px solid var(--gold-deep);border-radius:12px;padding:20px;">',
        '    <div style="font-size:12px;font-weight:700;color:var(--cinnabar);text-transform:uppercase;margin-bottom:6px;">Тайна сказки для ребёнка (6+)</div>',
        '    <p style="font-family:var(--font-serif);font-size:16.5px;margin:0 0 14px;color:var(--bg-walnut);">' + escapeHtml(b.tayna_skazki) + '</p>',
        '    <div style="background:var(--gold-soft);border:1px solid var(--gold-deep);padding:12px 14px;border-radius:8px;font-size:14px;">',
        '      <strong>Волшебные слова дружбы:</strong><br><em>«' + escapeHtml((b.volshebnye_slova || [])[0] || '') + '»</em>',
        '    </div>',
        '  </div>',
        '  <div style="background:var(--bg-parchment);border:1.5px solid var(--border-ornate);border-radius:12px;padding:20px;">',
        '    <div style="font-size:12px;font-weight:700;color:var(--cinnabar);text-transform:uppercase;margin-bottom:8px;">Три вопроса для вечерней беседы с ребёнком</div>',
        '    <ul style="list-style:none;padding:0;margin:0;font-size:14px;">' + questionsList + '</ul>',
        '  </div>',
        '</div>',
        '<div style="background:var(--bg-parchment-alt);border:2px solid var(--gold-deep);border-radius:12px;padding:22px;margin-bottom:22px;">',
        '  <div style="font-size:12px;font-weight:700;color:var(--cinnabar);text-transform:uppercase;margin-bottom:4px;">Игра-выбор «Три дороги» (нажмите на вариант ответа)</div>',
        '  <h4 style="font-family:var(--font-serif);font-size:18px;margin:0 0 12px;color:var(--bg-walnut);">' + escapeHtml(road.situaciya || 'Как поступит мудрый герой?') + '</h4>',
        '  <div class="roads-options">',
        '    <button type="button" class="road-btn" data-road-choice="wrong"><strong>Дорога А:</strong><br>' + escapeHtml(road.variant_a_oshibka || '') + '</button>',
        '    <button type="button" class="road-btn" data-road-choice="wrong"><strong>Дорога Б:</strong><br>' + escapeHtml(road.variant_b_oshibka || '') + '</button>',
        '    <button type="button" class="road-btn" data-road-choice="correct"><strong>★ Дорога В (Мудрый выбор):</strong><br>' + escapeHtml(road.variant_v_vernyy || '') + '</button>',
        '  </div>',
        '  <div class="road-feedback" style="margin-top:12px;font-size:14px;font-weight:600;min-height:22px;"></div>',
        '</div>',
        '<div style="background:var(--bg-parchment);border:2px dashed var(--gold-deep);border-radius:12px;padding:18px 22px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;">',
        '  <div><strong>Творческое задание в книге:</strong> ' + escapeHtml(b.zadanie_risunok) + '</div>',
        '  <div style="font-size:13px;color:var(--cinnabar);font-weight:700;">Вечерняя традиция семьи: ' + escapeHtml((b.eksperty && b.eksperty.privychka_24ch && b.eksperty.privychka_24ch.dlya_semyi_segodnya_vecherom) || '') + '</div>',
        '</div>'
      ].join('\n');
    } else {
      // Вкладка 'matrix' (Разбор для больших 12+ просто по двум осям)
      var mat = b.matrica_2x2 || {};
      var kv = mat.kvadraty || {};
      var q1 = kv.kvadrat_1_levyy_nizhniy || {};
      var q2 = kv.kvadrat_2_levyy_verhniy || {};
      var q3 = kv.kvadrat_3_pravyy_nizhniy || {};
      var q4 = kv.kvadrat_4_pravyy_verhniy_pravilnyy_otvet || {};
      var osY = mat.os_y || {};
      var osX = mat.os_x || {};

      var rulesHtml = (mat.tri_pravila || []).map(function (r) {
        return '<li style="padding:10px 14px;background:var(--bg-parchment);border-left:4px solid var(--cinnabar);border-radius:6px;">' + escapeHtml(r) + '</li>';
      }).join('');

      var rowsHtml = (mat.tablica_situaciy || []).map(function (row) {
        return [
          '<tr>',
          '  <td><strong>' + escapeHtml(row.situaciya) + '</strong></td>',
          '  <td style="color:#991B1B;">' + escapeHtml(row.ubytschnyy_otvet) + '</td>',
          '  <td class="win-col">★ ' + escapeHtml(row.pravilnyy_otvet_kvadrat_4) + '</td>',
          '</tr>'
        ].join('');
      }).join('');

      var vocabHtml = (mat.krylatyy_slovar || []).map(function (v) {
        return '<div style="background:var(--bg-parchment);border:1px solid var(--border-ornate);border-radius:8px;padding:10px 14px;font-size:13.8px;">«' + escapeHtml(v) + '»</div>';
      }).join('');

      bodyHtml = [
        '<div style="background:var(--gold-soft);border:1.5px solid var(--gold-deep);border-radius:10px;padding:16px 20px;margin-bottom:18px;">',
        '  <div style="font-size:12px;font-weight:700;color:var(--cinnabar);text-transform:uppercase;margin-bottom:4px;">Главный жизненный и управленческий урок сказки</div>',
        '  <div style="font-family:var(--font-serif);font-size:17px;color:var(--bg-walnut);font-weight:700;">' + escapeHtml(mat.paradox) + '</div>',
        '</div>',
        '<div style="margin-top:16px;" class="editions-grid">',
        '  <div>',
        '    <h4 style="font-family:var(--font-serif);font-size:18px;margin:0 0 10px;color:var(--bg-walnut);">Три практических совета для дела и семьи:</h4>',
        '    <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;font-size:14px;">' + rulesHtml + '</ul>',
        '  </div>',
        '  <div>',
        '    <h4 style="font-family:var(--font-serif);font-size:18px;margin:0 0 10px;color:var(--bg-walnut);">Крылатые фразы сказки для переговоров и согласия:</h4>',
        '    <div style="display:flex;flex-direction:column;gap:8px;">' + vocabHtml + '</div>',
        '  </div>',
        '</div>',
        '<h4 style="font-family:var(--font-serif);font-size:18px;margin:24px 0 8px;color:var(--bg-walnut);">Как применить этот совет в реальных ситуациях:</h4>',
        '<div style="overflow-x:auto;">',
        '  <table class="situations-table">',
        '    <thead><tr><th>Жизненная или деловая ситуация</th><th>Ошибочная реакция</th><th>★ Мудрый и сильный ход</th></tr></thead>',
        '    <tbody>' + rowsHtml + '</tbody>',
        '  </table>',
        '</div>',
        '<div style="margin-top:18px;padding:14px 18px;background:var(--bg-parchment-alt);border-radius:8px;font-size:13.5px;color:var(--ink-secondary);display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;">',
        '  <span><strong>Культурная параллель:</strong> ' + escapeHtml((b.eksperty && b.eksperty.briks_most) || '') + '</span>',
        '  <span><strong>Культура договора:</strong> ' + escapeHtml((b.eksperty && b.eksperty.pravo_rf) || '') + '</span>',
        '</div>'
      ].join('\n');
    }

    return headerHtml + tabsHtml + bodyHtml;
  }

  /* 3. Рендер интерактивного тренажёра на странице */
  function renderWorkbench() {
    var pillsEl = document.getElementById('workbench-pills');
    var contentEl = document.getElementById('workbench-content');
    if (!pillsEl || !contentEl) return;

    pillsEl.innerHTML = books.map(function (b) {
      var roman = ROMAN[b.num - 1] || b.num;
      var cls = b.num === activeBookNum ? 'workbench-pill is-active' : 'workbench-pill';
      return '<button type="button" class="' + cls + '" data-wb-book="' + b.num + '">' + roman + '. ' + escapeHtml(b.title_ru) + '</button>';
    }).join('');

    var book = getBookByNum(activeBookNum);
    contentEl.innerHTML = buildBookExplorerHtml(book, activeTab, activeSceneIdx);
  }

  /* 4. Открытие нативного модального читального зала <dialog id="book-reader-dialog"> */
  function openBookModal(bookNum, initialTab) {
    activeBookNum = Number(bookNum) || 1;
    if (initialTab) activeTab = initialTab;
    activeSceneIdx = 0;
    renderWorkbench();

    var dlg = document.getElementById('book-reader-dialog');
    var dlgBody = document.getElementById('book-reader-dialog-body');
    var dlgTitle = document.getElementById('book-reader-dialog-title');
    var book = getBookByNum(activeBookNum);
    if (!dlg || !dlgBody || !book) return;

    dlgTitle.textContent = 'Книга ' + (ROMAN[book.num - 1] || book.num) + ', «' + book.title_ru + '» (Интерактивный читальный зал)';
    dlgBody.innerHTML = buildBookExplorerHtml(book, activeTab, activeSceneIdx);
    if (typeof dlg.showModal === 'function' && !dlg.open) {
      dlg.showModal();
    }
  }

  function refreshModalIfOpen() {
    var dlg = document.getElementById('book-reader-dialog');
    var dlgBody = document.getElementById('book-reader-dialog-body');
    if (dlg && dlg.open && dlgBody) {
      var book = getBookByNum(activeBookNum);
      dlgBody.innerHTML = buildBookExplorerHtml(book, activeTab, activeSceneIdx);
    }
  }

  /* 5. Обработка форм заказа (/lead.php -> Битрикс24 C85:NEW) */
  function bindLeadForm(formEl) {
    if (!formEl) return;
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameVal = (formEl.querySelector('[name="name"]') || {}).value || '';
      var phoneVal = (formEl.querySelector('[name="phone"]') || {}).value || '';
      var channelVal = (formEl.querySelector('[name="channel"]') || {}).value || 'max';
      var editionVal = (formEl.querySelector('[name="edition"]') || {}).value || 'Собрание опубликованных книг серии (6+ и 12+)';
      var commentVal = (formEl.querySelector('[name="comment"]') || {}).value || '';
      var pdChecked = !!(formEl.querySelector('[name="pd"]') || {}).checked;
      var ofertaChecked = !!(formEl.querySelector('[name="oferta"]') || {}).checked;
      var statusEl = formEl.querySelector('.form-status');
      var submitBtn = formEl.querySelector('button[type="submit"]');

      if (!pdChecked || !ofertaChecked) {
        if (statusEl) {
          statusEl.style.color = '#DC2626';
          statusEl.textContent = 'Пожалуйста, отметьте согласие на обработку персональных данных и принятие условий оферты.';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем заявку...';
      }

      var payload = {
        name: nameVal.trim(),
        phone: phoneVal.trim(),
        channel: channelVal,
        task: 'Заказ книг «Сказки Мудрости Юпитера»: ' + editionVal,
        company: editionVal,
        comment: commentVal.trim(),
        pd: pdChecked,
        oferta: ofertaChecked,
        page: window.location.href,
        req_id: (window.jgLeadHelper && window.jgLeadHelper.makeReqId) ? window.jgLeadHelper.makeReqId() : ('req_' + Date.now()),
        utm: (window.jgLeadHelper && window.jgLeadHelper.getUtm) ? window.jgLeadHelper.getUtm() : {}
      };

      fetch('/lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) {
            if (statusEl) {
              statusEl.style.color = '#15803D';
              statusEl.innerHTML = '<strong>Заявка принята!</strong> Команда серии «Сказки Мудрости Юпитера» свяжется с вами в течение 1 рабочего часа.';
            }
            formEl.reset();
          } else {
            if (statusEl) {
              statusEl.style.color = '#DC2626';
              statusEl.textContent = 'Проверьте корректность номера телефона (11 цифр) и попробуйте ещё раз.';
            }
          }
        })
        .catch(function () {
          if (statusEl) {
            statusEl.style.color = '#DC2626';
            statusEl.textContent = 'Не удалось отправить форму. Позвоните нам по прямой линии: +7 (499) 938-60-28.';
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Оформить заявку на книги / тираж';
          }
        });
    });
  }

  /* 6. Делегирование событий на странице */
  function initEvents() {
    document.addEventListener('click', function (e) {
      var modeBtn = e.target.closest('[data-catalog-mode]');
      if (modeBtn) {
        currentCatalogMode = modeBtn.getAttribute('data-catalog-mode');
        document.querySelectorAll('[data-catalog-mode]').forEach(function (el) {
          el.classList.toggle('is-active', el.getAttribute('data-catalog-mode') === currentCatalogMode);
        });
        renderCatalog();
        return;
      }

      var openReader = e.target.closest('[data-open-reader]');
      if (openReader) {
        var bNum = openReader.getAttribute('data-open-reader');
        var initTab = openReader.getAttribute('data-initial-tab') || (currentCatalogMode === 'mgmt' ? 'matrix' : 'story');
        openBookModal(bNum, initTab);
        return;
      }

      var wbBook = e.target.closest('[data-wb-book]');
      if (wbBook) {
        activeBookNum = Number(wbBook.getAttribute('data-wb-book')) || 1;
        activeSceneIdx = 0;
        renderWorkbench();
        return;
      }

      var wbTab = e.target.closest('[data-wb-tab]');
      if (wbTab) {
        activeTab = wbTab.getAttribute('data-wb-tab');
        renderWorkbench();
        refreshModalIfOpen();
        return;
      }

      var sceneBtn = e.target.closest('[data-scene-idx]');
      if (sceneBtn && !sceneBtn.disabled) {
        activeSceneIdx = Number(sceneBtn.getAttribute('data-scene-idx')) || 0;
        renderWorkbench();
        refreshModalIfOpen();
        return;
      }

      var roadBtn = e.target.closest('[data-road-choice]');
      if (roadBtn) {
        var parent = roadBtn.closest('.roads-options');
        var fb = parent && parent.parentElement ? parent.parentElement.querySelector('.road-feedback') : null;
        if (parent) {
          parent.querySelectorAll('.road-btn').forEach(function (b) {
            b.classList.remove('is-correct', 'is-wrong');
          });
        }
        var isRight = roadBtn.getAttribute('data-road-choice') === 'correct';
        roadBtn.classList.add(isRight ? 'is-correct' : 'is-wrong');
        if (fb) {
          fb.style.color = isRight ? '#15803D' : '#B91C1C';
          fb.textContent = isRight
            ? '★ Верно! Это путь созидания, доброй смекалки и Правого Верхнего Квадрата.'
            : 'Эта дорога ведёт к обиде и потере времени. Попробуйте найти мудрое решение (Дорога В)!';
        }
        return;
      }

      var openOrder = e.target.closest('[data-open-order]');
      if (openOrder) {
        var leadDlg = document.getElementById('lead-dialog');
        var edSelect = leadDlg ? leadDlg.querySelector('[name="edition"]') : null;
        var preset = openOrder.getAttribute('data-open-order');
        if (edSelect && preset) {
          edSelect.value = preset;
        }
        if (leadDlg && typeof leadDlg.showModal === 'function' && !leadDlg.open) {
          leadDlg.showModal();
        }
        return;
      }

      var closeDlgBtn = e.target.closest('[data-close-dialog]');
      if (closeDlgBtn) {
        var parentDlg = closeDlgBtn.closest('dialog');
        if (parentDlg && parentDlg.open) parentDlg.close();
        return;
      }
    });

    // Закрытие <dialog> по клику на подложку (light dismiss)
    document.querySelectorAll('dialog').forEach(function (dlg) {
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) dlg.close();
      });
    });

    var searchInput = document.getElementById('catalog-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        currentSearch = searchInput.value || '';
        renderCatalog();
      });
    }

    bindLeadForm(document.getElementById('order-form'));
    bindLeadForm(document.getElementById('modal-order-form'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderCatalog();
      renderWorkbench();
      initEvents();
    });
  } else {
    renderCatalog();
    renderWorkbench();
    initEvents();
  }
})();
