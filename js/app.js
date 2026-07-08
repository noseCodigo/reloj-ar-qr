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

    let stream = null;
    let animacionId = null;
    let qrActivo = false;
    let qrSuave = null;
    let ultimoTiempoQR = 0;
    let animacionInicio = 0;
    let framesSaltados = 0;

    const TAMANO_CLOCK = 200;
    const ESCALA_RELOJ = 1.0;
    const SMOOTHING = 0.35;
    const TIMEOUT_QR = 3000;
    const TIMEOUT_FANTASMA = 6000;
    const RES_MAX = 960;

    const ofsCanvas = document.createElement('canvas');
    const ofsCtx = ofsCanvas.getContext('2d', { willReadFrequently: true });

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

            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;

            loading.classList.remove('activo');
            loading.classList.add('oculto');

            qrActivo = false;
            animacionInicio = performance.now();
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

    function distancia(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }

    function procesarQR() {
        if (video.readyState < 2) return null;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w === 0 || h === 0) return null;

        const escala = Math.min(RES_MAX / w, RES_MAX * 0.75 / h);
        const sw = Math.round(w * escala);
        const sh = Math.round(h * escala);

        ofsCanvas.width = sw;
        ofsCanvas.height = sh;
        ofsCtx.drawImage(video, 0, 0, sw, sh);

        const imageData = ofsCtx.getImageData(0, 0, sw, sh);
        const codigo = jsQR(imageData.data, sw, sh, {
            inversionAttempts: 'attemptBoth'
        });

        if (!codigo || !codigo.location) return null;

        const loc = codigo.location;
        const pts = [loc.topLeftCorner, loc.topRightCorner, loc.bottomRightCorner, loc.bottomLeftCorner];
        const fx = 1 / escala;

        const cx = pts.reduce((s, p) => s + p.x, 0) / 4 * fx;
        const cy = pts.reduce((s, p) => s + p.y, 0) / 4 * fx;

        const ancho = (distancia(pts[0], pts[1]) + distancia(pts[2], pts[3])) / 2 * fx;
        const alto = (distancia(pts[1], pts[2]) + distancia(pts[3], pts[0])) / 2 * fx;
        const size = (ancho + alto) / 2;

        const angulo = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);

        return { cx, cy, size, angulo };
    }

    function dibujarReloj(opacidad) {
        if (!qrSuave) return;

        const escala = (qrSuave.size / TAMANO_CLOCK) * ESCALA_RELOJ;

        ctx.save();
        ctx.globalAlpha = opacidad;
        ctx.translate(qrSuave.cx, qrSuave.cy);
        ctx.rotate(qrSuave.angulo);
        ctx.scale(escala, escala);
        RelojCanvas.dibujar(ctx, 0, 0, TAMANO_CLOCK, new Date());
        ctx.restore();
    }

    function loop(timestamp) {
        framesSaltados = (framesSaltados + 1) % 2;
        const info = framesSaltados === 0 ? procesarQR() : null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (info) {
            ultimoTiempoQR = performance.now();

            if (!qrActivo) {
                qrActivo = true;
                animacionInicio = performance.now();
                relojEncontrado.classList.remove('oculto');
                relojEncontrado.classList.add('activo');
                relojPerdido.classList.remove('activo');
                relojPerdido.classList.add('oculto');
            }

            if (!qrSuave) {
                qrSuave = info;
            }

            const t = Math.min(1, (performance.now() - animacionInicio) / 400);
            const suavizado = t < 1 ? t * (2 - t) : 1;

            qrSuave.cx += (info.cx - qrSuave.cx) * SMOOTHING * suavizado;
            qrSuave.cy += (info.cy - qrSuave.cy) * SMOOTHING * suavizado;
            qrSuave.size += (info.size - qrSuave.size) * SMOOTHING * suavizado;

            let diffAng = info.angulo - qrSuave.angulo;
            if (diffAng > Math.PI) diffAng -= Math.PI * 2;
            if (diffAng < -Math.PI) diffAng += Math.PI * 2;
            qrSuave.angulo += diffAng * SMOOTHING * suavizado;

            dibujarReloj(1);

        } else {
            const tiempoSinQR = performance.now() - ultimoTiempoQR;

            if (qrActivo && tiempoSinQR > TIMEOUT_QR) {
                qrActivo = false;
                relojEncontrado.classList.remove('activo');
                relojEncontrado.classList.add('oculto');
            }

            if (qrSuave && tiempoSinQR < TIMEOUT_FANTASMA) {
                if (tiempoSinQR < TIMEOUT_QR) {
                    dibujarReloj(1);
                } else {
                    const opacidad = 1 - (tiempoSinQR - TIMEOUT_QR) / (TIMEOUT_FANTASMA - TIMEOUT_QR);
                    dibujarReloj(Math.max(0, opacidad));
                }
            } else {
                if (qrSuave) {
                    qrSuave = null;
                    relojPerdido.classList.remove('oculto');
                    relojPerdido.classList.add('activo');
                }

                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const r = Math.min(canvas.width, canvas.height) * 0.08;

                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 6]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx - r * 1.2, cy);
                ctx.lineTo(cx + r * 1.2, cy);
                ctx.moveTo(cx, cy - r * 1.2);
                ctx.lineTo(cx, cy + r * 1.2);
                ctx.stroke();
            }
        }

        const hh = new Date().getHours().toString().padStart(2, '0');
        const mm = new Date().getMinutes().toString().padStart(2, '0');
        const ss = new Date().getSeconds().toString().padStart(2, '0');
        estadoTexto.textContent = `${hh}:${mm}:${ss}`;

        animacionId = requestAnimationFrame(loop);
    }

    function cambiarEstilo() {
        const e = RelojCanvas.cambiarEstilo();
        nombreEstilo.textContent = e.nombre;
    }

    document.addEventListener('DOMContentLoaded', () => {
        btnEstilo.addEventListener('click', cambiarEstilo);
        iniciarCamara();
    });

})();
