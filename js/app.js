(function() {
    'use strict';

    const get = sel => document.getElementById(sel);
    const video = get('video');
    const canvas = get('overlay');
    const ctx = canvas.getContext('2d');
    const loading = get('loading');
    const relojEncontrado = get('reloj-encontrado');
    const estadoTexto = get('estado-texto');
    const btnEstilo = get('btn-estilo');
    const nombreEstilo = get('nombre-estilo');
    const relojPerdido = get('reloj-perdido');
    const installBanner = get('install-banner');
    const btnInstall = get('btn-install');
    const btnDismissInstall = get('btn-dismiss-install');

    let stream = null;
    let animacionId = null;
    let relojVisible = false;
    let ultimoTiempoQR = 0;
    let animacionInicio = 0;
    let deferredPrompt = null;

    const TIMEOUT_QR = 3000;
    const TIMEOUT_FANTASMA = 6000;
    const FRACC_PANTALLA = 0.73;

    const ofsCanvas = document.createElement('canvas');
    const ofsCtx = ofsCanvas.getContext('2d', { willReadFrequently: true });

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBanner.classList.remove('oculto');
        installBanner.classList.add('activo');
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        installBanner.classList.remove('activo');
        installBanner.classList.add('oculto');
    });

    btnInstall.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            console.log('App instalada');
        }
        deferredPrompt = null;
        installBanner.classList.remove('activo');
        installBanner.classList.add('oculto');
    });

    btnDismissInstall.addEventListener('click', () => {
        deferredPrompt = null;
        installBanner.classList.remove('activo');
        installBanner.classList.add('oculto');
    });

    async function iniciarCamara() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
            video.srcObject = stream;
            await video.play();

            loading.classList.remove('activo');
            loading.classList.add('oculto');

            ultimoTiempoQR = performance.now();
            animacionInicio = performance.now();
            redimensionar();
            loop();
        } catch (err) {
            console.error('Error camara:', err);
            loading.innerHTML = `
                <div class="error-msg">
                    <h2>Error de cámara</h2>
                    <p>${err.message}</p>
                    <p>Asegúrate de permitir el acceso a la cámara</p>
                    <button onclick="location.reload()">Reintentar</button>
                </div>`;
        }
    }

    function redimensionar() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function procesarQR() {
        if (video.readyState < 2) return null;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w === 0 || h === 0) return null;

        const escala = Math.min(960 / w, 720 / h);
        const sw = Math.round(w * escala);
        const sh = Math.round(h * escala);

        ofsCanvas.width = sw;
        ofsCanvas.height = sh;
        ofsCtx.drawImage(video, 0, 0, sw, sh);

        const imageData = ofsCtx.getImageData(0, 0, sw, sh);
        return jsQR(imageData.data, sw, sh, {
            inversionAttempts: 'attemptBoth'
        });
    }

    function loop() {
        const codigo = procesarQR();
        const ahora = performance.now();

        redimensionar();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (codigo) {
            ultimoTiempoQR = ahora;

            if (!relojVisible) {
                relojVisible = true;
                animacionInicio = ahora;
                relojEncontrado.classList.remove('oculto');
                relojEncontrado.classList.add('activo');
                relojPerdido.classList.remove('activo');
                relojPerdido.classList.add('oculto');
            }

            const t = Math.min(1, (ahora - animacionInicio) / 400);
            const suavizado = t < 1 ? t * (2 - t) : 1;

            const size = Math.min(canvas.width, canvas.height) * FRACC_PANTALLA * suavizado;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx.save();
            ctx.globalAlpha = suavizado;
            RelojCanvas.dibujar(ctx, cx, cy, size, horaBolivia());
            ctx.restore();

        } else {
            const tiempoSinQR = ahora - ultimoTiempoQR;

            if (relojVisible && tiempoSinQR > TIMEOUT_QR) {
                relojVisible = false;
                relojEncontrado.classList.remove('activo');
                relojEncontrado.classList.add('oculto');
            }

            if (relojVisible || tiempoSinQR < TIMEOUT_FANTASMA) {
                let opacidad = 1;
                if (tiempoSinQR > TIMEOUT_QR) {
                    opacidad = 1 - (tiempoSinQR - TIMEOUT_QR) / (TIMEOUT_FANTASMA - TIMEOUT_QR);
                }

                const size = Math.min(canvas.width, canvas.height) * FRACC_PANTALLA;
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;

                ctx.save();
                ctx.globalAlpha = Math.max(0, opacidad);
                RelojCanvas.dibujar(ctx, cx, cy, size, horaBolivia());
                ctx.restore();
            } else if (codigo === null) {
                relojPerdido.classList.remove('oculto');
                relojPerdido.classList.add('activo');
            }
        }

        const b = horaBolivia();
        estadoTexto.textContent = `${b.getHours().toString().padStart(2, '0')}:${b.getMinutes().toString().padStart(2, '0')}:${b.getSeconds().toString().padStart(2, '0')}`;

        animacionId = requestAnimationFrame(loop);
    }

    function cambiarEstilo() {
        const e = RelojCanvas.cambiarEstilo();
        nombreEstilo.textContent = e.nombre;
    }

    window.addEventListener('resize', redimensionar);
    document.addEventListener('DOMContentLoaded', () => {
        btnEstilo.addEventListener('click', cambiarEstilo);
        iniciarCamara();
    });

})();
