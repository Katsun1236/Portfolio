(function () {
    function escapeHtml(str) {
        if (typeof str !== "string") return "";
        var div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function parseStack(stack) {
        if (!stack) return [];
        return stack.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    }

    function renderCreaCard(project) {
        var card = document.createElement("div");
        card.className = "panel overflow-hidden hover:border-[var(--line-strong)] transition-all duration-300 group cursor-pointer hover:-translate-y-1";
        card.dataset.slug = project.slug;

        var icon = project.icon || "fa-star";
        var tag = escapeHtml(project.tag || project.category);
        var title = escapeHtml(project.title);
        var shortDesc = escapeHtml(project.short_description || "");

        var preview = project.image
            ? '<img src="' + escapeHtml(project.image) + '" alt="' + title + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">'
            : '<i class="fa-solid ' + escapeHtml(icon) + ' text-5xl text-[var(--red-deep)] opacity-70 group-hover:opacity-100 transition-opacity"></i>';

        card.innerHTML =
            '<div class="h-48 bg-[var(--paper-strong)] relative overflow-hidden flex items-center justify-center">' +
                preview +
                '<div class="absolute top-4 right-4 tag-stamp tag-stamp--crea bg-[var(--paper)]">' + tag + '</div>' +
            '</div>' +
            '<div class="p-8">' +
                '<h3 class="text-xl font-title font-extrabold mb-2">' + title + '</h3>' +
                '<p class="text-sm text-[var(--ink-soft)] mb-6 line-clamp-2">' + shortDesc + '</p>' +
                '<span class="text-[var(--red-deep)] text-sm font-mono flex items-center gap-2 group-hover:gap-4 transition-all">Voir le projet <i class="fa-solid fa-arrow-right"></i></span>' +
            '</div>';

        return card;
    }

    function renderDevCard(project) {
        var card = document.createElement("div");
        card.className = "panel overflow-hidden hover:border-[var(--line-strong)] transition-all duration-300 group cursor-pointer hover:-translate-y-1";
        card.dataset.slug = project.slug;

        var title = escapeHtml(project.title);
        var shortDesc = escapeHtml(project.short_description || "");
        var tag = escapeHtml(project.tag || "Web App");
        var image = project.image || "https://placehold.co/800x400/E3DECF/1E33C7?text=Projet";

        card.innerHTML =
            '<div class="h-48 relative overflow-hidden bg-[var(--paper-strong)]">' +
                '<img src="' + escapeHtml(image) + '" alt="' + title + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">' +
                '<div class="absolute top-4 right-4 tag-stamp tag-stamp--dev bg-[var(--paper)]">' + tag + '</div>' +
            '</div>' +
            '<div class="p-8">' +
                '<h3 class="text-xl font-title font-extrabold mb-2 font-mono">' + title + '</h3>' +
                '<p class="text-sm text-[var(--ink-soft)] mb-6 line-clamp-2">' + shortDesc + '</p>' +
                '<span class="text-[var(--blue-deep)] text-sm font-mono flex items-center gap-2 group-hover:gap-4 transition-all">&gt;_ Voir l\'appli <i class="fa-solid fa-arrow-right"></i></span>' +
            '</div>';

        return card;
    }

    function fillModal(project, theme) {
        var modal = document.getElementById("project-modal");
        if (!modal) return;

        var titleEl = document.getElementById("modal-title");
        var descEl = document.getElementById("modal-desc");
        var tagEl = document.getElementById("modal-tag");
        var toolsEl = document.getElementById("modal-tools");
        var linkEl = document.getElementById("modal-link");

        if (titleEl) titleEl.textContent = project.title;
        if (descEl) descEl.textContent = project.description || project.short_description || "";
        if (tagEl) {
            tagEl.textContent = project.tag || project.category;
            tagEl.className = "tag-stamp " + (theme === "dev" ? "tag-stamp--dev" : "tag-stamp--crea");
        }

        if (toolsEl) {
            toolsEl.innerHTML = "";
            parseStack(project.stack).forEach(function (tool) {
                var span = document.createElement("span");
                span.className = "px-3 py-1 bg-[var(--paper-dim)] border border-[var(--line)] rounded-full text-xs font-mono text-[var(--ink-soft)]";
                span.textContent = tool;
                toolsEl.appendChild(span);
            });
        }

        if (linkEl) {
            var hasLink = project.link && project.link !== "#";
            linkEl.href = hasLink ? project.link : "#";
            linkEl.style.pointerEvents = hasLink ? "auto" : "none";
            linkEl.style.opacity = hasLink ? "1" : "0.5";
            linkEl.innerHTML = hasLink
                ? (theme === "dev" ? "Lancer l'application" : "Visiter le site en ligne") + " <i class=\"fa-solid fa-arrow-up-right-from-square\"></i>"
                : "En cours <i class=\"fa-solid fa-spinner fa-spin\"></i>";
        }

        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function setupModal() {
        var modal = document.getElementById("project-modal");
        if (!modal) return;

        var closeBtn = modal.querySelector(".modal-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", function () {
                modal.classList.remove("active");
                document.body.style.overflow = "auto";
            });
        }

        modal.addEventListener("click", function (e) {
            if (e.target === modal) {
                modal.classList.remove("active");
                document.body.style.overflow = "auto";
            }
        });
    }

    window.ProjectsLoader = {
        load: function (options) {
            var container = document.getElementById(options.containerId);
            if (!container) return;

            var category = options.category;
            var theme = options.theme || "crea";
            var renderCard = theme === "dev" ? renderDevCard : renderCreaCard;
            var projects = [];

            setupModal();

            fetch("/content/projects.json")
                .then(function (response) {
                    if (!response.ok) throw new Error("Projets introuvables");
                    return response.json();
                })
                .then(function (data) {
                    container.innerHTML = "";
                    projects = (data.projects || []).filter(function (p) {
                        return p.category === category;
                    });

                    if (projects.length === 0) {
                        container.innerHTML = '<p class="text-[var(--ink-faint)] font-mono col-span-full text-center py-8">Aucun projet pour le moment.</p>';
                        return;
                    }

                    projects.forEach(function (project) {
                        var card = renderCard(project);
                        card.addEventListener("click", function () {
                            fillModal(project, theme);
                        });
                        container.appendChild(card);
                    });
                })
                .catch(function (err) {
                    console.error(err);
                    container.innerHTML = '<p class="text-[var(--red-deep)] font-mono col-span-full border border-[var(--line-strong)] p-4 rounded bg-[var(--paper-dim)] text-center">Impossible de charger les projets.</p>';
                });
        }
    };
})();
