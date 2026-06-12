(function () {
    var COOLDOWN_MS = 60000;
    var STORAGE_KEY = "contact_last_submit";

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showFieldError(id, message) {
        var field = document.getElementById(id);
        var existing = document.getElementById(id + "-error");
        if (existing) existing.remove();
        if (!field) return;

        field.classList.add("border-red-400");
        var err = document.createElement("p");
        err.id = id + "-error";
        err.className = "text-red-400 text-xs mt-1 font-code";
        err.textContent = message;
        field.parentElement.appendChild(err);
    }

    function clearFieldErrors(form) {
        form.querySelectorAll(".border-red-400").forEach(function (el) {
            el.classList.remove("border-red-400");
        });
        form.querySelectorAll("[id$='-error']").forEach(function (el) {
            el.remove();
        });
    }

    function validateForm(form) {
        clearFieldErrors(form);
        var valid = true;
        var name = form.name.value.trim();
        var email = form.email.value.trim();
        var message = form.message.value.trim();

        if (name.length < 2) {
            showFieldError("name", "Indiquez votre nom (2 caractères minimum).");
            valid = false;
        }
        if (!isValidEmail(email)) {
            showFieldError("email", "Adresse e-mail invalide.");
            valid = false;
        }
        if (message.length < 10) {
            showFieldError("message", "Message trop court (10 caractères minimum).");
            valid = false;
        }
        return valid;
    }

    function isRateLimited() {
        var last = sessionStorage.getItem(STORAGE_KEY);
        if (!last) return false;
        return Date.now() - parseInt(last, 10) < COOLDOWN_MS;
    }

    var form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!validateForm(form)) return;

        if (form.website && form.website.value) return;

        if (isRateLimited()) {
            var status = document.getElementById("form-status");
            if (status) {
                status.textContent = "Veuillez patienter une minute avant de renvoyer un message.";
                status.className = "text-yellow-400 text-sm text-center mt-4 font-code";
            }
            return;
        }

        var btn = form.querySelector(".submit-btn");
        var statusEl = document.getElementById("form-status");
        var originalText = btn.innerHTML;

        if (statusEl) {
            statusEl.textContent = "";
            statusEl.className = "text-xs text-gray-500 text-center mt-4";
        }

        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Envoi en cours...';
        btn.style.opacity = "0.8";
        btn.style.pointerEvents = "none";

        var formData = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            subject: form.subject.value,
            message: form.message.value.trim(),
            website: form.website ? form.website.value : ""
        };

        try {
            var response = await fetch("/.netlify/functions/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            var result = {};
            try {
                result = await response.json();
            } catch (_) {}

            if (response.ok) {
                sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Message envoyé !';
                btn.style.background = "#00ffcc";
                btn.style.color = "#000";
                form.reset();
            } else {
                var msg = result.error || "Erreur lors de l'envoi. Réessayez plus tard.";
                throw new Error(msg);
            }
        } catch (error) {
            console.error("Erreur:", error);
            btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Échec de l\'envoi';
            btn.style.background = "#ef4444";
            btn.style.color = "#fff";
            if (statusEl) {
                statusEl.textContent = error.message || "Une erreur est survenue.";
                statusEl.className = "text-red-400 text-sm text-center mt-4 font-code";
            }
        } finally {
            setTimeout(function () {
                btn.innerHTML = originalText;
                btn.style.background = "";
                btn.style.color = "";
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
            }, 4000);
        }
    });
})();
