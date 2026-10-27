/* Единый клиентский контур сквозной аналитики и отправки заявок (skazki-yupiter.ru -> lead.php -> Битрикс24 C85:NEW).
 * 1. Сохраняет first_touch и last_touch UTM-метки, yclid и gclid в localStorage (90 дней) и sessionStorage.
 * 2. Защищает все поля ввода классом ym-disable-keys (чтобы Вебвизор не записывал ПДн до отправки формы).
 * 3. Обогащает все запросы к /lead.php метками UTM, yclid, _ym_uid и идемпотентным req_id.
 * 4. Отправляет цели Яндекс.Метрики (lead_sent, phone_click, messenger_click) строго после ответа CRM.
 */
(function () {
    'use strict';

    var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid'];
    var STORAGE_FIRST = 'jg_utm_first_v1';
    var STORAGE_LAST = 'jg_utm_last_v1';
    var TTL_MS = 90 * 24 * 60 * 60 * 1000;

    function parseQueryUtm() {
        var params = new URLSearchParams(window.location.search);
        var found = {};
        var hasAny = false;
        UTM_KEYS.forEach(function (k) {
            var v = params.get(k);
            if (v) {
                found[k] = v.slice(0, 120);
                hasAny = true;
            }
        });
        return hasAny ? found : null;
    }

    function saveUtm() {
        try {
            var now = Date.now();
            var current = parseQueryUtm();
            if (current) {
                current._ts = now;
                current._landing = window.location.pathname;
                localStorage.setItem(STORAGE_LAST, JSON.stringify(current));
                sessionStorage.setItem('jg_utm_session', JSON.stringify(current));

                var firstRaw = localStorage.getItem(STORAGE_FIRST);
                var firstObj = firstRaw ? JSON.parse(firstRaw) : null;
                if (!firstObj || (now - (firstObj._ts || 0) > TTL_MS)) {
                    localStorage.setItem(STORAGE_FIRST, JSON.stringify(current));
                }
            }
        } catch (e) {}
    }

    function getCollectedUtm() {
        var res = {};
        try {
            var first = JSON.parse(localStorage.getItem(STORAGE_FIRST) || '{}');
            var last = JSON.parse(localStorage.getItem(STORAGE_LAST) || '{}');
            var sess = JSON.parse(sessionStorage.getItem('jg_utm_session') || '{}');
            UTM_KEYS.forEach(function (k) {
                if (sess[k]) res[k] = sess[k];
                else if (last[k]) res[k] = last[k];
                else if (first[k]) res[k] = first[k];
            });
            if (first.utm_source && !res.first_utm_source) {
                res.first_utm_source = first.utm_source;
            }
        } catch (e) {}
        try {
            var ymMatch = document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]+)/);
            if (ymMatch) res._ym_uid = decodeURIComponent(ymMatch[1]);
        } catch (e) {}
        return res;
    }

    function makeReqId() {
        if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
        return 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    }

    function protectInputsForWebvisor() {
        document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea').forEach(function (el) {
            el.classList.add('ym-disable-keys');
        });
    }

    function bindContactGoals() {
        document.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a[href]');
            if (!a) return;
            var href = a.getAttribute('href') || '';
            if (href.indexOf('tel:') === 0 && window.jgReachGoal) {
                window.jgReachGoal('phone_click', { href: href });
            } else if ((href.indexOf('max.ru') !== -1 || href.indexOf('t.me') !== -1 || href.indexOf('wa.me') !== -1) && window.jgReachGoal) {
                window.jgReachGoal('messenger_click', { href: href });
            }
        });
    }

    // Перехват fetch('/lead.php') для гарантированного обогащения UTM, _ym_uid, yclid и вызова целей Метрики
    var origFetch = window.fetch;
    if (origFetch) {
        window.fetch = function (input, init) {
            try {
                var url = typeof input === 'string' ? input : (input && input.url) || '';
                if (url.indexOf('lead.php') !== -1 && init && init.method && init.method.toUpperCase() === 'POST' && typeof init.body === 'string') {
                    var bodyObj = JSON.parse(init.body);
                    var utmMerged = Object.assign({}, getCollectedUtm(), bodyObj.utm || {});
                    bodyObj.utm = utmMerged;
                    if (!bodyObj.req_id) bodyObj.req_id = makeReqId();
                    if (!bodyObj.page) bodyObj.page = window.location.href;
                    init.body = JSON.stringify(bodyObj);
                    return origFetch.call(this, input, init).then(function (resp) {
                        try {
                            resp.clone().json().then(function (data) {
                                if (data && data.ok && window.jgReachGoal) {
                                    window.jgReachGoal('lead_sent', { task: bodyObj.task || 'form' });
                                } else if (window.jgReachGoal) {
                                    window.jgReachGoal('lead_error');
                                }
                            }).catch(function () {});
                        } catch (e) {}
                        return resp;
                    });
                }
            } catch (e) {}
            return origFetch.apply(this, arguments);
        };
    }

    saveUtm();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            protectInputsForWebvisor();
            bindContactGoals();
        });
    } else {
        protectInputsForWebvisor();
        bindContactGoals();
    }

    window.jgLeadHelper = {
        getUtm: getCollectedUtm,
        makeReqId: makeReqId
    };
})();
