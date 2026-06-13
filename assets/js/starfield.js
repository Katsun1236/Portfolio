(function () {
    var canvas = document.getElementById("starfield");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    var rgb = canvas.getAttribute("data-star-color") || "255, 255, 255";
    var width, height;
    var stars = [];

    function initCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        stars = [];
        for (var i = 0; i < 250; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.5,
                vx: Math.floor(Math.random() * 50) - 25,
                vy: Math.floor(Math.random() * 50) - 25,
                alpha: Math.random()
            });
        }
    }

    function drawStars() {
        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            s.alpha += (Math.random() - 0.5) * 0.1;
            if (s.alpha < 0.1) s.alpha = 0.1;
            if (s.alpha > 1) s.alpha = 1;

            ctx.fillStyle = "rgba(" + rgb + ", " + s.alpha + ")";
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2, true);
            ctx.fill();

            s.x += s.vx / 150;
            s.y += s.vy / 150;

            if (s.x < 0) s.x = width;
            if (s.x > width) s.x = 0;
            if (s.y < 0) s.y = height;
            if (s.y > height) s.y = 0;
        }
        requestAnimationFrame(drawStars);
    }

    window.addEventListener("resize", initCanvas);
    initCanvas();
    drawStars();
})();
