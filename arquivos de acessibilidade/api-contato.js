(function () {
    const whatsappPhone = "5535988234408";

    function getFormData(form) {
        const data = new FormData(form);

        return {
            nome: String(data.get("nome") || "").trim(),
            servico: String(data.get("servico") || "").trim(),
            horario: String(data.get("horario") || "").trim(),
            mensagem: String(data.get("mensagem") || "").trim(),
        };
    }

    function buildMessage(data) {
        const linhas = [
            "Olá, Camila! Vim pelo site e gostaria de falar sobre um atendimento.",
            "",
            `Nome: ${data.nome}`,
            `Serviço: ${data.servico}`,
        ];

        if (data.horario) linhas.push(`Melhor horário: ${data.horario}`);
        if (data.mensagem) linhas.push("", `Mensagem: ${data.mensagem}`);

        return linhas.join("\n");
    }

    function buildWhatsAppUrl(data) {
        const message = encodeURIComponent(buildMessage(data));
        return `https://api.whatsapp.com/send/?phone=${whatsappPhone}&text=${message}&type=phone_number&app_absent=0`;
    }

    function setStatus(form, message, isError = false) {
        const status = form.querySelector("[data-contact-status]");
        if (!status) return;

        status.textContent = message;
        status.classList.toggle("is-error", isError);
    }

    function setSelectedService(form, service) {
        const serviceInput = form.querySelector("[data-service-value]");
        const buttons = form.querySelectorAll("[data-service-option]");

        if (serviceInput) serviceInput.value = service;

        buttons.forEach((button) => {
            const active = button.dataset.serviceOption === service;
            button.classList.toggle("is-selected", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    function fillServiceFromUrl(form) {
        const params = new URLSearchParams(window.location.search);
        const service = params.get("servico");
        const hasOption = Array.from(form.querySelectorAll("[data-service-option]")).some((button) => {
            return button.dataset.serviceOption === service;
        });

        if (!service) return;

        setSelectedService(form, service);
        if (!hasOption) setStatus(form, `Serviço selecionado pelo catálogo: ${service}`);
    }

    function bindServicePicker(form) {
        form.querySelectorAll("[data-service-option]").forEach((button) => {
            button.setAttribute("aria-pressed", "false");
            button.addEventListener("click", () => {
                setSelectedService(form, button.dataset.serviceOption);
                setStatus(form, "");
            });
        });
    }

    function handleSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = getFormData(form);

        if (!data.nome || !data.servico) {
            setStatus(form, "Preencha seu nome e escolha um serviço antes de enviar.", true);
            return;
        }

        setStatus(form, "Abrindo WhatsApp com sua mensagem pronta...");
        window.open(buildWhatsAppUrl(data), "_blank", "noopener,noreferrer");
    }

    function initContactApi() {
        const form = document.querySelector("[data-contact-form]");
        if (!form) return;

        bindServicePicker(form);
        fillServiceFromUrl(form);
        form.addEventListener("submit", handleSubmit);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initContactApi);
    } else {
        initContactApi();
    }

    window.ContatoWhatsAppAPI = {
        criarMensagem: buildMessage,
        criarLink: buildWhatsAppUrl,
    };
})();
