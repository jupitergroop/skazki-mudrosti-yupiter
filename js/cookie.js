/* Плашка о cookie (skazki-yupiter.ru).
 *
 * Главное правило: до выбора посетителя счётчик Яндекс.Метрики не подключается
 * вовсе. Файл js/metrika.js подгружается отсюда и только после «Принять».
 * Отказ тоже уважается: при «Только обязательные» счётчик не появится и в следующие заходы.
 *
 * Выбор хранится в браузере самого посетителя. Факт выбора уходит в журнал
 * на сервере (cookie.php): дата, адрес, страница. Ни имени, ни телефона там нет.
 */
(function () {
    'use strict';

    var KEY = 'lf_cookie';        /* 'da': согласие, 'net': только обязательные */
    var KEY_STARYY = 'lf_cookie_ok';

    var svoy = document.currentScript;
    var versiya = (svoy && svoy.src.match(/\?v=\d+/) || [''])[0];

    function vybor() {
        try {
            var v = localStorage.getItem(KEY);
            if (v === 'da' || v === 'net') { return v; }
            if (localStorage.getItem(KEY_STARYY) === '1') { return 'da'; }
        } catch (e) {}
        return null;
    }

    function zapomnit(v) {
        try { localStorage.setItem(KEY, v); } catch (e) {}
    }

    function zapustit() {
        if (window.ym || document.getElementById('metrika-tag')) { return; }
        var s = document.createElement('script');
        s.id = 'metrika-tag';
        s.src = '/js/metrika.js' + versiya;
        s.defer = true;
        document.head.appendChild(s);
    }

    function zapisat(chto) {
        try {
            var body = JSON.stringify({ page: window.location.href, vybor: chto });
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/cookie.php', new Blob([body], { type: 'application/json' }));
            } else {
                fetch('/cookie.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: body,
                    keepalive: true
                });
            }
        } catch (e) {}
    }

    var reshenie = vybor();
    if (reshenie === 'da') { zapustit(); return; }
    if (reshenie === 'net') { return; }

    var bar = document.getElementById('cookie-bar');
    if (!bar) { return; }

    var ubrat = function () {
        bar.classList.remove('is-shown');
        window.setTimeout(function () { bar.hidden = true; }, 400);
    };

    var da = bar.querySelector('[data-cookie-accept]');
    var net = bar.querySelector('[data-cookie-reject], [data-cookie-decline]');

    if (da) {
        da.addEventListener('click', function () {
            zapomnit('da');
            zapustit();
            ubrat();
            zapisat('da');
        });
    }

    if (net) {
        net.addEventListener('click', function () {
            zapomnit('net');
            ubrat();
            zapisat('net');
        });
    }

    window.setTimeout(function () {
        bar.hidden = false;
        void bar.offsetHeight;
        bar.classList.add('is-shown');
        zapisat('pokaz');
    }, 1800);
})();
