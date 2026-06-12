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
        card.className = "bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md hover:border-yellow-400/30 transition-all duration-300 group cursor-pointer hover:-translate-y-2 shadow-lg";
        card.dataset.slug = project.slug;

        var gradient = project.gradient || "from-purple-900 to-black";
        var icon = project.icon || "fa-star";
        var tag = escapeHtml(project.tag || project.category);
        var title = escapeHtml(project.title);
        var shortDesc = escapeHtml(project.short_description || "");

        var preview = project.image
            ? '<img src="' + escapeHtml(project.image) + '" alt="' + title + '" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">'
            : '<i class="fa-solid ' + escapeHtml(icon) + ' text-5xl text-yellow-400/80 group-hover:scale-110 group-hover:text-yellow-400 transition-all duration-500"></i>';

        card.innerHTML =
            '<div class="h-48 bg-gradient-to-br ' + escapeHtml(gradient) + ' to-black relative overflow-hidden flex items-center justify-center">' +
                preview +
                '<div class="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase">' + tag + '</div>' +
            '</div>' +
            '<div class="p-8">' +
                '<h3 class="text-2xl font-bold mb-2">' + title + '</h3>' +
                '<p class="text-sm text-gray-400 mb-6 line-clamp-2">' + shortDesc + '</p>' +
                '<span class="text-yellow-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-4 transition-all">Analyser le projet <i class="fa-solid fa-arrow-right"></i></span>' +
            '</div>';

        return card;
    }

    function renderDevCard(project) {
        var card = document.createElement("div");
        card.className = "bg-white/5 border border-[#00ffcc]/20 rounded-3xl overflow-hidden backdrop-blur-md hover:border-[#00ffcc]/70 transition-all duration-300 group cursor-pointer hover:-translate-y-2 shadow-lg";
        card.dataset.slug = project.slug;

        var title = escapeHtml(project.title);
        var shortDesc = escapeHtml(project.short_description || "");
        var tag = escapeHtml(project.tag || "Web App");
        var image = project.image || "https://placehold.co/800x400/0a0a1a/00ffcc?text=Projet";

        card.innerHTML =
            '<div class="h-48 relative overflow-hidden bg-black">' +
                '<img src="' + escapeHtml(image) + '" alt="' + title + '" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100">' +
                '<div class="absolute inset-0 bg-[#00ffcc]/20 group-hover:bg-transparent transition-colors duration-500"></div>' +
                '<div class="absolute top-4 right-4 bg-[#00ffcc] text-black text-xs font-bold px-3 py-1 rounded-full uppercase font-code">' + tag + '</div>' +
            '</div>' +
            '<div class="p-8">' +
                '<h3 class="text-2xl font-bold mb-2 font-code">' + title + '</h3>' +
                '<p class="text-sm text-gray-400 mb-6 line-clamp-2">' + shortDesc + '</p>' +
                '<span class="text-[#00ffcc] text-sm font-code flex items-center gap-2 group-hover:gap-4 transition-all">&gt;_ Analyser l\'app <i class="fa-solid fa-arrow-right"></i></span>' +
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
        if (tagEl) tagEl.textContent = project.tag || project.category;

        if (toolsEl) {
            toolsEl.innerHTML = "";
            parseStack(project.stack).forEach(function (tool) {
                var span = document.createElement("span");
                span.className = theme === "dev"
                    ? "px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 font-code"
                    : "px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-gray-300";
                span.textContent = tool;
                toolsEl.appendChild(span);
            });
        }

        if (linkEl) {
            var hasLink = project.link && project.link !== "#";
            linkEl.href = hasLink ? project.link : "#";
            linkEl.style.pointerEvents = hasLink ? "auto" : "none";
            linkEl.style.opacity = hasLink ? "1" : "0.5";
            if (theme === "dev") {
                linkEl.innerHTML = hasLink
                    ? "Lancer l'application <i class=\"fa-solid fa-arrow-up-right-from-square\"></i>"
                    : "Déploiement en cours <i class=\"fa-solid fa-spinner fa-spin\"></i>";
            } else {
                linkEl.innerHTML = hasLink
                    ? "Visiter le site en ligne <i class=\"fa-solid fa-arrow-up-right-from-square\"></i>"
                    : "Projet en cours <i class=\"fa-solid fa-spinner fa-spin\"></i>";
            }
        }

        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function setupModal(theme) {
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

            setupModal(theme);

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
                        container.innerHTML = '<p class="text-gray-500 font-code col-span-full text-center py-8">Aucun projet pour le moment.</p>';
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
                    container.innerHTML = '<p class="text-red-400 font-code col-span-full border border-red-500/30 p-4 rounded bg-red-500/10 text-center">Impossible de charger les projets.</p>';
                });
        }
    };
})();
