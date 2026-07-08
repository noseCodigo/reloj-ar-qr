(function() {
    'use strict';

    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    const btnEstilo = document.getElementById('btn-estilo');
    const nombreEstilo = document.getElementById('nombre-estilo');

    const FRACC_PANTALLA = 0.73;
    let animacionInicio = 0;

    function redimensionar() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function dibujarFondo(cx, cy, radio) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radio);
        g.addColorStop(0, '#1a1a2e');
        g.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function loop() {
        const ahora = performance.now();

        redimensionar();

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radio = Math.max(canvas.width, canvas.height) * 0.8;

        dibujarFondo(cx, cy, radio);

        const t = Math.min(1, (ahora - animacionInicio) / 600);
        const suavizado = t < 1 ? t * (2 - t) : 1;

        const tamFinal = Math.min(canvas.width, canvas.height) * FRACC_PANTALLA;
        const tam = tamFinal * (0.85 + 0.15 * suavizado);

        ctx.save();
        ctx.globalAlpha = suavizado;
        RelojCanvas.dibujar(ctx, cx, cy, tam, horaBolivia());
        ctx.restore();

        requestAnimationFrame(loop);
    }

    function cambiarEstilo() {
        const e = RelojCanvas.cambiarEstilo();
        nombreEstilo.textContent = e.nombre;
    }
    window.addEventListener('resize', redimensionar);
    document.addEventListener('DOMContentLoaded', () => {
        btnEstilo.addEventListener('click', cambiarEstilo);
        animacionInicio = performance.now();
        redimensionar();
        loop();
    });

})();
