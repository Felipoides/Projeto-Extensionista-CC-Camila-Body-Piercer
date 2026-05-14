(function () {
    const storageKey = "camila-a11y-preferences";
    const root = document.documentElement;
    const readableSelector = "main, header, footer, nav, section, article, h1, h2, h3, p, li, a, button";

    const state = loadPreferences();

    function loadPreferences() {
        const defaults = {
            contrast: false,
            dyslexia: false,
            underline: false,
            voice: false,
            theme: "dark",
            fontScale: 100,
        };

        try {
            return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey)) };
        } catch (error) {
            return defaults;
        }
    }

    function savePreferences() {
        localStorage.setItem(storageKey, JSON.stringify(state));
    }

    function getSpeechSynth() {
        return window.speechSynthesis || null;
    }

    function getPreferredVoice() {
        const synth = getSpeechSynth();
        const voices = synth ? synth.getVoices() : [];

        return (
            voices.find((voice) => voice.lang === "pt-BR") ||
            voices.find((voice) => voice.lang.toLowerCase().startsWith("pt")) ||
            voices.find((voice) => voice.default) ||
            voices[0] ||
            null
        );
    }

    function updateVoiceStatus(message, isError = false) {
        const status = document.querySelector("[data-a11y-voice-status]");
        if (!status) return;

        status.textContent = message;
        status.classList.toggle("is-error", isError);
    }

    function speak(message, options = {}) {
        const { force = false, interrupt = true } = options;
        const synth = getSpeechSynth();

        if (!state.voice && !force) return false;

        if (!synth || !window.SpeechSynthesisUtterance) {
            updateVoiceStatus("Seu navegador nao oferece suporte a leitura por voz.", true);
            return false;
        }

        if (!message) {
            updateVoiceStatus("Nao encontrei texto para ler.", true);
            return false;
        }

        if (interrupt) synth.cancel();
        if (synth.paused) synth.resume();

        const text = message.replace(/\s+/g, " ").trim();
        const voice = getPreferredVoice();
        const chunks = text.match(/.{1,180}(\s|$)/g) || [text];

        updateVoiceStatus(voice ? `Usando voz: ${voice.name}` : "Tentando usar a voz padrao do navegador.");

        chunks.forEach((chunk) => {
            const utterance = new window.SpeechSynthesisUtterance(chunk.trim());

            if (voice) utterance.voice = voice;

            utterance.lang = "pt-BR";
            utterance.rate = 0.85;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.onerror = () => {
                updateVoiceStatus("Nao consegui tocar a voz. Verifique o volume ou as vozes instaladas no sistema.", true);
            };
            utterance.onend = () => {
                updateVoiceStatus("Leitura por voz pronta.");
            };

            synth.speak(utterance);
        });

        window.setTimeout(() => {
            if (synth.paused) synth.resume();
        }, 120);

        return true;
    }

    function getReadableText(element) {
        return (
            element.getAttribute("aria-label") ||
            element.getAttribute("alt") ||
            element.innerText ||
            element.textContent ||
            ""
        ).replace(/\s+/g, " ").trim();
    }

    function setPressed(button, active) {
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("is-active", active);
    }

    function applyPreferences() {
        root.classList.toggle("a11y-high-contrast", state.contrast);
        root.classList.toggle("a11y-dyslexia-font", state.dyslexia);
        root.classList.toggle("a11y-underlined-links", state.underline);
        root.classList.toggle("a11y-light-mode", state.theme === "light");
        root.style.setProperty("--a11y-font-scale", `${state.fontScale}%`);

        document.querySelectorAll("[data-a11y-toggle]").forEach((button) => {
            const key = button.dataset.a11yToggle;
            setPressed(button, Boolean(state[key]));
        });

        const fontValue = document.querySelector("[data-a11y-font-value]");
        if (fontValue) fontValue.textContent = `${state.fontScale}%`;

        document.querySelectorAll("[data-a11y-theme]").forEach((button) => {
            setPressed(button, button.dataset.a11yTheme === state.theme);
        });
    }

    function changeFontScale(direction) {
        const nextScale = state.fontScale + direction * 10;
        state.fontScale = Math.min(150, Math.max(80, nextScale));
        savePreferences();
        applyPreferences();
        speak(`Tamanho da fonte em ${state.fontScale} por cento`);
    }

    function toggleOption(key, messageOn, messageOff) {
        state[key] = !state[key];
        savePreferences();
        applyPreferences();

        if (key === "voice") {
            speak(state[key] ? `${messageOn}. Use o botão Ler página ou clique em textos, links e botões para ouvir.` : messageOff, {
                force: true,
            });
            return;
        }

        speak(state[key] ? messageOn : messageOff);
    }

    function setTheme(theme) {
        state.theme = theme;
        savePreferences();
        applyPreferences();
        speak(theme === "light" ? "Modo claro ativado" : "Modo escuro ativado");
    }

    function readPage() {
        const main = document.querySelector("main");
        const text = getReadableText(main || document.body);

        if (!text) return;

        state.voice = true;
        savePreferences();
        applyPreferences();
        speak(text.slice(0, 3800), { force: true });
    }

    function testVoice() {
        state.voice = true;
        savePreferences();
        applyPreferences();
        speak("Teste de voz funcionando. Agora sim.", { force: true });
    }

    function resetPreferences() {
        state.contrast = false;
        state.dyslexia = false;
        state.underline = false;
        state.voice = false;
        state.theme = "dark";
        state.fontScale = 100;

        const synth = getSpeechSynth();
        if (synth) synth.cancel();
        savePreferences();
        applyPreferences();
    }

    function createButton(text, className, attributes = {}) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = text;

        Object.entries(attributes).forEach(([name, value]) => {
            button.setAttribute(name, value);
        });

        return button;
    }

    function createPanel() {
        const widget = document.createElement("aside");
        widget.className = "a11y-widget";
        widget.setAttribute("aria-label", "Ferramentas de acessibilidade");

        const openButton = createButton("", "a11y-open-button", {
            "aria-expanded": "false",
            "aria-controls": "a11y-panel",
            "aria-label": "Abrir painel de acessibilidade",
            title: "Abrir painel de acessibilidade",
        });

        openButton.innerHTML = `
            <img src="../img/acessibilidade.png" alt="" aria-hidden="true">
            <span class="sr-only">Abrir painel de acessibilidade</span>
        `;

        const panel = document.createElement("div");
        panel.id = "a11y-panel";
        panel.className = "a11y-panel";
        panel.hidden = true;

        panel.innerHTML = `
            <div class="a11y-panel-header">
                <strong>Acessibilidade</strong>
                <button type="button" class="a11y-close-button" aria-label="Fechar painel de acessibilidade">&times;</button>
            </div>
            <div class="a11y-font-controls" aria-label="Controle de tamanho da fonte">
                <button type="button" data-a11y-font="decrease" aria-label="Diminuir fonte">A-</button>
                <span data-a11y-font-value aria-live="polite">100%</span>
                <button type="button" data-a11y-font="increase" aria-label="Aumentar fonte">A+</button>
            </div>
            <div class="a11y-theme-controls" aria-label="Escolha de tema">
                <button type="button" data-a11y-theme="light">Modo claro</button>
                <button type="button" data-a11y-theme="dark">Modo escuro</button>
            </div>
            <button type="button" data-a11y-toggle="contrast">Alto contraste</button>
            <button type="button" data-a11y-toggle="dyslexia">Fonte legível</button>
            <button type="button" data-a11y-toggle="underline">Sublinhar links</button>
            <button type="button" data-a11y-toggle="voice">Leitura por voz</button>
            <button type="button" class="a11y-test-voice-button">Testar voz</button>
            <button type="button" class="a11y-read-page-button">Ler página</button>
            <p class="a11y-voice-status" data-a11y-voice-status aria-live="polite">Clique em Testar voz.</p>
            <button type="button" class="a11y-reset-button">Restaurar</button>
        `;

        widget.append(openButton, panel);
        document.body.appendChild(widget);

        const closeButton = panel.querySelector(".a11y-close-button");
        const readPageButton = panel.querySelector(".a11y-read-page-button");
        const testVoiceButton = panel.querySelector(".a11y-test-voice-button");
        const resetButton = panel.querySelector(".a11y-reset-button");

        function setPanel(open) {
            panel.hidden = !open;
            openButton.setAttribute("aria-expanded", String(open));

            if (open) {
                speak("Painel de acessibilidade aberto");
                panel.querySelector("button")?.focus();
            }
        }

        openButton.addEventListener("click", () => setPanel(panel.hidden));
        closeButton.addEventListener("click", () => setPanel(false));
        readPageButton.addEventListener("click", readPage);
        testVoiceButton.addEventListener("click", testVoice);
        resetButton.addEventListener("click", resetPreferences);

        panel.querySelector('[data-a11y-font="decrease"]').addEventListener("click", () => changeFontScale(-1));
        panel.querySelector('[data-a11y-font="increase"]').addEventListener("click", () => changeFontScale(1));

        panel.querySelectorAll("[data-a11y-theme]").forEach((button) => {
            button.addEventListener("click", () => setTheme(button.dataset.a11yTheme));
        });

        panel.querySelectorAll("[data-a11y-toggle]").forEach((button) => {
            const key = button.dataset.a11yToggle;
            const label = button.textContent.trim();
            button.addEventListener("click", () => toggleOption(key, `${label} ativado`, `${label} desativado`));
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") setPanel(false);

            if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

            if (event.key.toLowerCase() === "a") {
                event.preventDefault();
                setPanel(panel.hidden);
            }
        });

        const synth = getSpeechSynth();
        if (synth) {
            const updateLoadedVoice = () => {
                const voice = getPreferredVoice();
                updateVoiceStatus(voice ? `Voz carregada: ${voice.name}` : "Nenhuma voz encontrada no navegador.", !voice);
            };

            if (typeof synth.addEventListener === "function") {
                synth.addEventListener("voiceschanged", updateLoadedVoice);
            } else {
                synth.onvoiceschanged = updateLoadedVoice;
            }
        }
    }

    function createSkipLink() {
        if (document.querySelector(".skip-link")) return;

        const main = document.querySelector("main");
        if (!main) return;

        if (!main.id) main.id = "conteudo-principal";

        const skipLink = document.createElement("a");
        skipLink.className = "skip-link";
        skipLink.href = `#${main.id}`;
        skipLink.textContent = "Pular para o conteúdo";
        document.body.prepend(skipLink);
    }

    function bindVoiceReading() {
        document.addEventListener("focusin", (event) => {
            const target = event.target.closest(readableSelector);
            if (!target) return;
            speak(getReadableText(target));
        });

        document.addEventListener("click", (event) => {
            if (event.target.closest(".a11y-widget")) return;

            const target = event.target.closest("a, button, [role='button'], h1, h2, h3, p, li");
            if (!target) return;
            speak(getReadableText(target));
        });
    }

    function improveCurrentMarkup() {
        document.querySelectorAll("a, button").forEach((element) => {
            if (element.getAttribute("aria-label")) return;

            const text = getReadableText(element);
            if (text) element.setAttribute("aria-label", text);
        });

        document.querySelectorAll(".nav-links a.active").forEach((link) => {
            link.setAttribute("aria-current", "page");
        });
    }

    function initAccessibility() {
        createSkipLink();
        createPanel();
        improveCurrentMarkup();
        bindVoiceReading();
        applyPreferences();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAccessibility);
    } else {
        initAccessibility();
    }

    window.Acessibilidade = {
        falar: speak,
        aumentarTexto: () => changeFontScale(1),
        diminuirTexto: () => changeFontScale(-1),
        testarVoz: testVoice,
        modoClaro: () => setTheme("light"),
        modoEscuro: () => setTheme("dark"),
        resetar: resetPreferences,
    };
})();
