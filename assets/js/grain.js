(function () {
    var canvas = document.getElementById("grain-field");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var width, height, dots;

    function buildDots() {
        dots = [];
        var gap = 26;
        for (var y = gap / 2; y < height; y += gap) {
            for (var x = gap / 2; x < width; x += gap) {
                dots.push({
                    x: x + (Math.random() - 0.5) * 6,
                    y: y + (Math.random() - 0.5) * 6,
                    r: Math.random() * 0.9 + 0.3,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        buildDots();
    }

    function drawStatic() {
        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < dots.length; i++) {
            var d = dots[i];
            ctx.fillStyle = "rgba(23, 19, 15, 0.09)";
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawAnimated(t) {
        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < dots.length; i++) {
            var d = dots[i];
            var alpha = 0.05 + Math.abs(Math.sin(t / 4000 + d.phase)) * 0.07;
            ctx.fillStyle = "rgba(23, 19, 15, " + alpha.toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
        }
        requestAnimationFrame(drawAnimated);
    }

    window.addEventListener("resize", function () {
        resize();
        if (reduceMotion) drawStatic();
    });

    resize();
    if (reduceMotion) {
        drawStatic();
    } else {
        requestAnimationFrame(drawAnimated);
    }
})();
