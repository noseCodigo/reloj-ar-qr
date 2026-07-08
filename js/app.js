(function() {
    'use strict';

    const video = document.getElementById('video');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    const btnEstilo = document.getElementById('btn-estilo');
    const nombreEstilo = document.getElementById('nombre-estilo');

    const FRACC_PANTALLA = 0.73;
    let animacionInicio = 0;
    let camaraLista = false;

    function redimensionar() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    async function iniciarCamara() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            video.srcObject = stream;
            await video.play();
            camaraLista = true;
        } catch (err) {
            console.warn('Sin cámara, fondo oscuro');
            camaraLista = false;
        }
    }

    function loop() {
        redimensionar();

        if (!camaraLista) {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const ahora = performance.now();
        const t = Math.min(1, (ahora - animacionInicio) / 600);
        const suavizado = t < 1 ? t * (2 - t) : 1;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
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
        iniciarCamara();
        loop();
    });

})();
