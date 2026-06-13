(function () {
    var btn = document.getElementById("mobile-menu-btn");
    var menu = document.getElementById("mobile-menu");
    if (!btn || !menu) return;

    var isOpen = false;

    function setOpen(open) {
        isOpen = open;
        menu.classList.toggle("translate-x-full", !open);
        btn.innerHTML = open
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';
        btn.setAttribute("aria-expanded", String(open));
        btn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    }

    btn.addEventListener("click", function () {
        setOpen(!isOpen);
    });

    menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            setOpen(false);
        });
    });
})();
