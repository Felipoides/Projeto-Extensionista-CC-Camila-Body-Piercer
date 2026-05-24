(function () {
    const storageKey = "camila-a11y-preferences";
    const root = document.documentElement;
    const synth = window.speechSynthesis;
    const readableSelector = "main, header, footer, nav, section, article, h1, h2, h3, p, li, a, button";

    const state = loadPreferences();

    function loadPreferences() {
        const defaults = {
            contrast: false,
            dyslexia: false,
            underline: false,
            voice: false,
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

    function speak(message) {
        if (!state.voice || !synth || !message) return;

        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(message.trim());
        utterance.lang = "pt-BR";
        utterance.rate = 0.95;
        utterance.pitch = 1;
        synth.speak(utterance);
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
        root.style.setProperty("--a11y-font-scale", `${state.fontScale}%`);

        document.querySelectorAll("[data-a11y-toggle]").forEach((button) => {
            const key = button.dataset.a11yToggle;
            setPressed(button, Boolean(state[key]));
        });

        const fontValue = document.querySelector("[data-a11y-font-value]");
        if (fontValue) fontValue.textContent = `${state.fontScale}%`;
    }

    function changeFontScale(direction) {
        const nextScale = state.fontScale + direction * 10;
        state.fontScale = Math.min(130, Math.max(90, nextScale));
        savePreferences();
        applyPreferences();
        speak(`Tamanho da fonte em ${state.fontScale} por cento`);
    }

    function toggleOption(key, messageOn, messageOff) {
        state[key] = !state[key];
        savePreferences();
        applyPreferences();
        speak(state[key] ? messageOn : messageOff);
    }

    function resetPreferences() {
        state.contrast = false;
        state.dyslexia = false;
        state.underline = false;
        state.voice = false;
        state.fontScale = 100;

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
});

const icon = document.createElement("img");

icon.src = "../img/acessibilidade.png";

icon.alt = "Acessibilidade";

openButton.appendChild(icon);

        const panel = document.createElement("div");
        panel.id = "a11y-panel";
        panel.className = "a11y-panel";
        panel.hidden = true;
        panel.innerHTML = `
            <div class="a11y-panel-header">
                <strong>Acessibilidade</strong>
                <button type="button" class="a11y-close-button" aria-label="Fechar painel de acessibilidade">x</button>
            </div>
            <div class="a11y-font-controls" aria-label="Controle de tamanho da fonte">
                <button type="button" data-a11y-font="decrease" aria-label="Diminuir fonte">A-</button>
                <span data-a11y-font-value aria-live="polite">100%</span>
                <button type="button" data-a11y-font="increase" aria-label="Aumentar fonte">A+</button>
            </div>
            <button type="button" data-a11y-toggle="contrast">Alto contraste</button>
            <button type="button" data-a11y-toggle="dyslexia">Fonte legível</button>
            <button type="button" data-a11y-toggle="underline">Sublinhar links</button>
            <button type="button" data-a11y-toggle="voice">Leitura por voz</button>
            <button type="button" class="a11y-reset-button">Restaurar</button>
        `;

        widget.append(openButton, panel);
        document.body.appendChild(widget);

        const closeButton = panel.querySelector(".a11y-close-button");
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
        resetButton.addEventListener("click", resetPreferences);

        panel.querySelector('[data-a11y-font="decrease"]').addEventListener("click", () => changeFontScale(-1));
        panel.querySelector('[data-a11y-font="increase"]').addEventListener("click", () => changeFontScale(1));

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

    document.addEventListener("mouseover", (event) => {

        const target = event.target.closest(readableSelector);

        if (!target) return;

        const text = getReadableText(target);

        if (text.length < 2) return;

        speak(text);

    });

    document.addEventListener("focusin", (event) => {

        const target = event.target.closest(readableSelector);

        if (!target) return;

        const text = getReadableText(target);

        if (text.length < 2) return;

        speak(text);

    });

}

    function improveCurrentMarkup() {
        document.querySelectorAll("a, button").forEach((element) => {
            if (element.getAttribute("aria-label")) return;

            const text = getReadableText(element);
            if (text) element.setAttribute("aria-label", text);
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
        resetar: resetPreferences,
    };
})();

