/* Подключается из js/cookie.js строго после нажатия «Принять» (lf_cookie === 'da') по ст. 9 152-ФЗ.
 * Инициализирует Яндекс.Метрику и предоставляет глобальные хелперы window.jgReachGoal и window.jgGetClientId.
 */
(function () {
    'use strict';

    var COUNTER_ID = window.JG_METRIKA_ID || 0;

    if (COUNTER_ID > 0 && !window.ym) {
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        window.ym(COUNTER_ID, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true
        });
    }

    window.jgReachGoal = function (goal, params) {
        try {
            if (window.ym && COUNTER_ID > 0) {
                window.ym(COUNTER_ID, 'reachGoal', goal, params || { site: 'skazki-yupiter.ru' });
            }
        } catch (e) {}
    };

    window.jgGetClientId = function () {
        try {
            var m = document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]+)/);
            return m ? decodeURIComponent(m[1]) : '';
        } catch (e) {
            return '';
        }
    };
})();
