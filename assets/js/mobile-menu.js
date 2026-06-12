(function () {
    var btn = document.getElementById("mobile-menu-btn");
    var menu = document.getElementById("mobile-menu");
    if (!btn || !menu) return;

    var isOpen = false;

    btn.addEventListener("click", function () {
        isOpen = !isOpen;
        if (isOpen) {
            menu.classList.remove("translate-x-full");
            btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        } else {
            menu.classList.add("translate-x-full");
            btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }
    });

    menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            isOpen = false;
            menu.classList.add("translate-x-full");
            btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });
})();
