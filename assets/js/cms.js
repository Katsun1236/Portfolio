(function () {
    function applyCmsData(data) {
        document.querySelectorAll("[data-cms]").forEach(function (el) {
            var key = el.getAttribute("data-cms");
            if (!data[key]) return;

            if (key === "profil_pic") {
                var img = document.getElementById("profile-image");
                var placeholder = document.getElementById("profile-placeholder");
                if (img && data[key]) {
                    img.src = data[key];
                    img.classList.remove("hidden");
                    if (placeholder) placeholder.classList.add("hidden");
                }
                return;
            }

            el.innerHTML = data[key];
        });
    }

    function loadPageContent() {
        var page = document.body.dataset.page;
        if (!page) return;

        var cmsFile = page === "index" ? "home" : page;

        fetch("/content/" + cmsFile + ".json")
            .then(function (response) {
                if (!response.ok) throw new Error("CMS content not found");
                return response.json();
            })
            .then(applyCmsData)
            .catch(function (err) {
                console.log("CMS default fallback for " + page + ":", err);
            });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadPageContent);
    } else {
        loadPageContent();
    }
})();
