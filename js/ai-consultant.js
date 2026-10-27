/* Виджет подбора издания сайта skazki-yupiter.ru:
 * Скиллы: [[ii-konsultant-sayta]] + [[chaty-i-vidzhety]] + [[bot-zayavok]] + [[prodazhi-b2b]] + [[yurist-pdn-reklama]]
 * Режим 1: B2B-квалификатор и диспетчер 24/7 -> отправка через /lead.php в Битрикс24 (воронка №85, стадия C85:NEW).
 */
(function () {
    'use strict';

    if (document.getElementById('jg-ai-fab')) return;

    var DEFAULT_FACTS = {"site": "skazki-yupiter.ru", "label": "Серия книг «Сказки Мудрости Юпитера»", "mode": "b2b_b2c_books_24_7", "speaker": "Зинаида Юпитер", "speaker_role": "Автор серии «Сказки Мудрости Юпитера», доктор делового администрирования (DBA)", "phone": "+7 (499) 938-60-28", "phone_href": "tel:+74999386028", "email": "info@skazki-yupiter.ru", "disclosure": "ИИ-помощник издательского проекта «Сказки Мудрости Юпитера». Помогает выбрать книги и подарочные комплекты.", "quick_topics": [{"id": "two_editions", "label": "Два издания каждой книги (6+ и 12+)", "answer": "В каталоге уже представлено 16 сказок серии (и коллекция постоянно пополняется новыми выпусками), каждая в двух самостоятельных изданиях: 1) Семейное издание (6+ «Для родителей и детей»): полная певучая сказка с 5 картинами, вопросы для доброй беседы с ребёнком, игра «Три дороги» и тёплые советы родителям. 2) Издание для взрослых (12+): сжатый сюжет сказки со всеми народными поговорками, практические жизненные советы, управленческие инструменты и крылатые фразы для переговоров."}, {"id": "golden_tome", "label": "Коллекционный «Золотой Том»", "answer": "Печатный «Золотой Том» (от 84 до 108 страниц и цветные орнаментальные форзацы) объединяет избранные сказки серии в подарочном переплёте: тканевый корешок, рельефное тиснение золотом (конгрев) на обложке, резных рамках и буквицах, плотная бумага оттенка старинного пергамента (157 г/м²) и шёлковая закладка-ляссе."}, {"id": "strategy_skills", "label": "Стратегия (куда идти) и навыки (как идти)", "answer": "Формирование навыков помогает человеку уверенно идти по пути, а стратегия отвечает на главный вопрос: куда именно идти. Именно этим мы и занимаемся через сказки, опираясь на многовековую мудрость людей, живую эмпатию и красоту родного слова."}, {"id": "quiz_start", "label": "Подобрать издание или подарочный тираж", "answer": "QUIZ_TRIGGER"}], "quiz_steps": {"step1_title": "Шаг 1 из 3. Для какой задачи выбираете книги серии?", "step1_options": ["Для семейного чтения с детьми и внуками (издание 6+)", "Для руководителя, переговоров и команды (издание 12+)", "Коллекционный «Золотой Том» в подарок семье или партнёру", "Именной подарочный тираж с экслибрисом компании"], "step2_title": "Шаг 2 из 3. Какой комплект вас интересует?", "step2_options": ["Избранные выпуски (от 1 до 3 книг)", "Собрание опубликованных книг серии (6+ и 12+, коллекция пополняется)", "Печатный «Золотой Том» (твёрдый переплёт, тиснение золотом)", "Подарочная партия для компании или делегации (от 30 экз.)"]}};

    function createWidget(facts) {
        var fab = document.createElement('button');
        fab.type = 'button';
        fab.id = 'jg-ai-fab';
        fab.className = 'jg-ai-fab';
        fab.setAttribute('aria-label', 'Открыть ИИ-помощника по выбору книги');
        fab.innerHTML = '<span class="jg-ai-fab__dot" aria-hidden="true"></span><span>ИИ-помощник по выбору книги</span>';

        var drawer = document.createElement('section');
        drawer.id = 'jg-ai-drawer';
        drawer.className = 'jg-ai-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-label', 'ИИ-помощник по серии «Сказки Мудрости Юпитера»');
        drawer.hidden = true;

        drawer.innerHTML = [
            '<div class="jg-ai-head">',
            '  <div>',
            '    <p class="jg-ai-head__title">ИИ-помощник по выбору издания</p>',
            '    <p class="jg-ai-head__sub">' + facts.disclosure + '</p>',
            '  </div>',
            '  <button type="button" class="jg-ai-close" aria-label="Закрыть чат">&times;</button>',
            '</div>',
            '<div class="jg-ai-body" id="jg-ai-body">',
            '  <div class="jg-ai-msg">Здравствуйте! Я ИИ-помощник серии <b>«' + facts.label + '»</b>. Помогу выбрать книги для вашей семьи или в подарок, подскажу состав изданий и передам ваш запрос в редакцию.</div>',
            '  <div class="jg-ai-chips" id="jg-ai-chips"></div>',
            '  <div id="jg-ai-quiz-slot"></div>',
            '</div>',
            '<div class="jg-ai-foot">',
            '  <span>Прямая линия редакции: <a href="' + facts.phone_href + '">' + facts.phone + '</a></span>',
            '  <a href="mailto:' + facts.email + '">' + facts.email + '</a>',
            '</div>'
        ].join('\n');

        document.body.appendChild(fab);
        document.body.appendChild(drawer);

        var bodyEl = drawer.querySelector('#jg-ai-body');
        var chipsEl = drawer.querySelector('#jg-ai-chips');
        var quizSlot = drawer.querySelector('#jg-ai-quiz-slot');
        var closeBtn = drawer.querySelector('.jg-ai-close');

        var quizState = { step1: '', step2: '' };

        function appendMessage(text, isUser) {
            var div = document.createElement('div');
            div.className = 'jg-ai-msg' + (isUser ? ' jg-ai-msg--user' : '');
            div.textContent = text;
            bodyEl.insertBefore(div, quizSlot);
            bodyEl.scrollTop = bodyEl.scrollHeight;
        }

        function renderQuizStep1() {
            quizSlot.innerHTML = '';
            var box = document.createElement('div');
            box.className = 'jg-ai-quiz-box';
            var title = document.createElement('strong');
            title.style.fontSize = '13px';
            title.textContent = facts.quiz_steps.step1_title;
            box.appendChild(title);

            facts.quiz_steps.step1_options.forEach(function (opt) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'jg-ai-chip';
                btn.textContent = opt;
                btn.addEventListener('click', function () {
                    quizState.step1 = opt;
                    renderQuizStep2();
                });
                box.appendChild(btn);
            });
            quizSlot.appendChild(box);
            bodyEl.scrollTop = bodyEl.scrollHeight;
        }

        function renderQuizStep2() {
            quizSlot.innerHTML = '';
            var box = document.createElement('div');
            box.className = 'jg-ai-quiz-box';
            var title = document.createElement('strong');
            title.style.fontSize = '13px';
            title.textContent = facts.quiz_steps.step2_title;
            box.appendChild(title);

            facts.quiz_steps.step2_options.forEach(function (opt) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'jg-ai-chip';
                btn.textContent = opt;
                btn.addEventListener('click', function () {
                    quizState.step2 = opt;
                    renderQuizStep3Form();
                });
                box.appendChild(btn);
            });
            quizSlot.appendChild(box);
            bodyEl.scrollTop = bodyEl.scrollHeight;
        }

        function renderQuizStep3Form() {
            quizSlot.innerHTML = '';
            var box = document.createElement('form');
            box.className = 'jg-ai-quiz-box';
            box.innerHTML = [
                '<strong style="font-size:13px;">Шаг 3 из 3. Куда направить каталог, PDF-образцы и условия?</strong>',
                '<input type="text" name="name" class="ym-disable-keys" placeholder="Ваше имя *" required minlength="2">',
                '<input type="tel" name="phone" class="ym-disable-keys" inputmode="tel" placeholder="+7 (___) ___-__-__ *" required>',
                '<select name="channel" aria-label="Удобный канал связи">',
                '  <option value="max">Написать в МАКС (приоритетно)</option>',
                '  <option value="telegram">Написать в Telegram</option>',
                '  <option value="phone">Позвонить по телефону</option>',
                '</select>',
                '<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;" aria-hidden="true">',
                '<label class="jg-ai-consent"><input type="checkbox" name="pd" required><span>Даю <a href="/consent-pd.html" target="_blank" rel="noopener">согласие на обработку персональных данных</a> (Оператор персональных данных: «1С-Битрикс24», ООО «1С-Битрикс», серверы в РФ) и ознакомлен с <a href="/policy.html" target="_blank" rel="noopener">политикой ПДн</a>.</span></label>',
                '<label class="jg-ai-consent"><input type="checkbox" name="oferta" required><span>Принимаю условия <a href="/oferta.html" target="_blank" rel="noopener">публичной оферты</a>.</span></label>',
                '<button type="submit" class="jg-ai-submit">Получить каталог и условия заказа</button>',
                '<div class="jg-ai-status" style="font-size:12px;"></div>'
            ].join('\n');

            box.addEventListener('submit', function (e) {
                e.preventDefault();
                var nameVal = box.querySelector('[name="name"]').value.trim();
                var phoneVal = box.querySelector('[name="phone"]').value.trim();
                var channelVal = box.querySelector('[name="channel"]').value;
                var pdVal = box.querySelector('[name="pd"]').checked;
                var ofertaVal = box.querySelector('[name="oferta"]').checked;
                var statusEl = box.querySelector('.jg-ai-status');
                var submitBtn = box.querySelector('.jg-ai-submit');

                if (!pdVal || !ofertaVal) {
                    statusEl.style.color = '#DC2626';
                    statusEl.textContent = 'Отметьте оба согласия для отправки заявки.';
                    return;
                }
                submitBtn.disabled = true;
                submitBtn.textContent = 'Передаём в Битрикс24...';

                var payload = {
                    name: nameVal,
                    phone: phoneVal,
                    channel: channelVal,
                    task: 'Подбор издания: ' + quizState.step1,
                    company: quizState.step2,
                    comment: 'Подбор издания через помощника на сайте (' + quizState.step1 + ' / ' + quizState.step2 + ')',
                    pd: pdVal,
                    oferta: ofertaVal,
                    page: window.location.href,
                    req_id: (window.jgLeadHelper && window.jgLeadHelper.makeReqId) ? window.jgLeadHelper.makeReqId() : ('ai_' + Date.now()),
                    utm: (window.jgLeadHelper && window.jgLeadHelper.getUtm) ? window.jgLeadHelper.getUtm() : {}
                };

                fetch('/lead.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(function (r) { return r.json(); }).then(function (res) {
                    if (res && res.ok) {
                        quizSlot.innerHTML = '<div class="jg-ai-msg" style="border-color:#22C55E;background:#F0FDF4;color:#14532D;"><b>Заявка принята!</b><br>Мы свяжемся с вами в ближайшее время.</div>';
                        if (window.jgReachGoal) window.jgReachGoal('ai_consultant_lead');
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Получить каталог и условия заказа';
                        statusEl.style.color = '#DC2626';
                        statusEl.textContent = 'Проверьте корректность телефона (11 цифр) и попробуйте снова.';
                    }
                }).catch(function () {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Получить каталог и условия заказа';
                    statusEl.style.color = '#DC2626';
                    statusEl.textContent = 'Ошибка соединения. Позвоните нам: ' + facts.phone;
                });
            });

            quizSlot.appendChild(box);
            bodyEl.scrollTop = bodyEl.scrollHeight;
        }

        facts.quick_topics.forEach(function (topic) {
            var chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'jg-ai-chip';
            chip.textContent = topic.label;
            chip.addEventListener('click', function () {
                appendMessage(topic.label, true);
                if (topic.answer === 'QUIZ_TRIGGER') {
                    renderQuizStep1();
                } else {
                    appendMessage(topic.answer, false);
                    renderQuizStep1();
                }
            });
            chipsEl.appendChild(chip);
        });

        fab.addEventListener('click', function () {
            var willOpen = drawer.hidden;
            drawer.hidden = !willOpen;
            if (willOpen && window.jgReachGoal) {
                window.jgReachGoal('ai_consultant_open');
            }
        });

        closeBtn.addEventListener('click', function () {
            drawer.hidden = true;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            createWidget(DEFAULT_FACTS);
        });
    } else {
        createWidget(DEFAULT_FACTS);
    }
})();
