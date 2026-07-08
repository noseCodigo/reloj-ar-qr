function horaBolivia() {
    const ahora = new Date();
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    return new Date(utc + (-4 * 3600000));
}

const RelojCanvas = {
    estilos: [
        {
            id: 'clasico',
            nombre: 'Clásico Premium',
            bezelInicio: '#C9A84C',
            bezelFin: '#8B7335',
            dialInicio: '#F5F0E8',
            dialFin: '#E8E0D0',
            marcaColor: '#8B7335',
            numeroColor: '#2C1810',
            manecillaHora: '#1A1A2E',
            manecillaMinuto: '#1A1A2E',
            manecillaSegundo: '#C0392B',
            biselBorde: '#A08840',
            fondoBisel: '#2C1810',
            usarRomanos: true,
            segunderoSuave: true
        },
        {
            id: 'moderno',
            nombre: 'Moderno Oscuro',
            bezelInicio: '#4A5568',
            bezelFin: '#1A202C',
            dialInicio: '#1A202C',
            dialFin: '#0D1117',
            marcaColor: '#63B3ED',
            numeroColor: '#E2E8F0',
            manecillaHora: '#63B3ED',
            manecillaMinuto: '#90CDF4',
            manecillaSegundo: '#F6AD55',
            biselBorde: '#2D3748',
            fondoBisel: '#0D1117',
            usarRomanos: false,
            segunderoSuave: true
        },
        {
            id: 'deportivo',
            nombre: 'Deportivo',
            bezelInicio: '#2D3748',
            bezelFin: '#1A202C',
            dialInicio: '#111827',
            dialFin: '#0D1117',
            marcaColor: '#EF4444',
            numeroColor: '#F1F5F9',
            manecillaHora: '#F1F5F9',
            manecillaMinuto: '#CBD5E1',
            manecillaSegundo: '#EF4444',
            biselBorde: '#374151',
            fondoBisel: '#000000',
            usarRomanos: false,
            segunderoSuave: true
        }
    ],

    estiloActual: 0,

    get estilo() {
        return this.estilos[this.estiloActual];
    },

    cambiarEstilo() {
        this.estiloActual = (this.estiloActual + 1) % this.estilos.length;
        return this.estilo;
    },

    dibujar(ctx, cx, cy, size, fecha) {
        if (!fecha) fecha = horaBolivia();
        const e = this.estilo;
        const r = size / 2;
        const horas = fecha.getHours();
        const minutos = fecha.getMinutes();
        const segundos = fecha.getSeconds();
        const ms = fecha.getMilliseconds();

        const angHora = ((horas % 12) * 30 + minutos * 0.5) * Math.PI / 180;
        const angMinuto = (minutos * 6 + segundos * 0.1) * Math.PI / 180;
        let angSegundo;
        if (e.segunderoSuave) {
            angSegundo = ((segundos * 1000 + ms) / 1000 * 6) * Math.PI / 180;
        } else {
            angSegundo = (segundos * 6) * Math.PI / 180;
        }

        this._dibujarBisel(ctx, cx, cy, r, e);
        this._dibujarDial(ctx, cx, cy, r * 0.85, e);
        this._dibujarMarcas(ctx, cx, cy, r * 0.85, e);
        this._dibujarTextoMarca(ctx, cx, cy, r * 0.85, e);
        this._dibujarManecilla(ctx, cx, cy, r * 0.50, 8, angHora, e.manecillaHora, 0.15);
        this._dibujarManecilla(ctx, cx, cy, r * 0.72, 5, angMinuto, e.manecillaMinuto, 0.10);
        this._dibujarSegundero(ctx, cx, cy, r * 0.78, angSegundo, e.manecillaSegundo);
        this._dibujarCentro(ctx, cx, cy, r * 0.06, e);
        this._dibujarReflejo(ctx, cx, cy, r);
        this._dibujarInfoDigital(ctx, cx, cy, r, horas, minutos, segundos, e);
    },

    _dibujarBisel(ctx, cx, cy, r, e) {
        const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
        g.addColorStop(0, e.bezelInicio);
        g.addColorStop(0.7, e.bezelFin);
        g.addColorStop(1, e.fondoBisel);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.96, 0, Math.PI * 2);
        ctx.strokeStyle = e.biselBorde;
        ctx.lineWidth = r * 0.02;
        ctx.stroke();

        for (let i = 0; i < 60; i++) {
            const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
            const largo = i % 5 === 0 ? r * 0.06 : r * 0.03;
            const inner = r * 0.88;
            const outer = inner + largo;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
            ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
            ctx.strokeStyle = i % 5 === 0 ? e.marcaColor : 'rgba(255,255,255,0.3)';
            ctx.lineWidth = i % 5 === 0 ? 2 : 1;
            ctx.stroke();
        }
    },

    _dibujarDial(ctx, cx, cy, r, e) {
        const g = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, r * 0.05, cx, cy, r);
        g.addColorStop(0, e.dialInicio);
        g.addColorStop(1, e.dialFin);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = e.biselBorde;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    },

    _dibujarMarcas(ctx, cx, cy, r, e) {
        const romanos = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            if (e.usarRomanos) {
                const tr = r * 0.70;
                ctx.save();
                ctx.translate(cx + Math.cos(a) * tr, cy + Math.sin(a) * tr);
                ctx.rotate(i * 30 * Math.PI / 180 + Math.PI / 2);
                ctx.fillStyle = e.numeroColor;
                ctx.font = `bold ${r * 0.16}px 'Times New Roman', serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(romanos[i], 0, 0);
                ctx.restore();
            } else {
                const inner = r * 0.78;
                const outer = r * 0.92;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
                ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
                ctx.strokeStyle = e.marcaColor;
                ctx.lineWidth = r * 0.045;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.lineCap = 'butt';
            }
        }

        for (let i = 0; i < 60; i++) {
            if (i % 5 === 0) continue;
            const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * (r * 0.86), cy + Math.sin(a) * (r * 0.86));
            ctx.lineTo(cx + Math.cos(a) * (r * 0.92), cy + Math.sin(a) * (r * 0.92));
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },

    _dibujarTextoMarca(ctx, cx, cy, r, e) {
        ctx.fillStyle = e.marcaColor;
        ctx.font = `${r * 0.11}px 'Times New Roman', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AUTOMATIC', cx, cy - r * 0.18);

        ctx.fillStyle = e.marcaColor;
        ctx.font = `${r * 0.08}px 'Times New Roman', serif`;
        ctx.fillText('CHRONOGRAPH', cx, cy - r * 0.08);
    },

    _dibujarManecilla(ctx, cx, cy, largo, ancho, angulo, color, sombra) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angulo);

        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4 + sombra * 10;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.beginPath();
        ctx.moveTo(-largo * 0.08, -ancho / 2);
        ctx.lineTo(largo, 0);
        ctx.lineTo(-largo * 0.08, ancho / 2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.restore();
    },

    _dibujarSegundero(ctx, cx, cy, largo, angulo, color) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angulo);

        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 3;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(largo, 0);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = color;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(largo * 0.85, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-largo * 0.15, 0);
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.restore();
    },

    _dibujarCentro(ctx, cx, cy, r, e) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(0.4, '#E2E8F0');
        g.addColorStop(1, e.biselBorde);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = e.manecillaHora;
        ctx.lineWidth = 1;
        ctx.stroke();
    },

    _dibujarReflejo(ctx, cx, cy, r) {
        const g = ctx.createRadialGradient(
            cx - r * 0.35, cy - r * 0.35, r * 0.05,
            cx - r * 0.35, cy - r * 0.35, r * 0.8
        );
        g.addColorStop(0, 'rgba(255,255,255,0.12)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.03)');
        g.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
    },

    _dibujarInfoDigital(ctx, cx, cy, r, horas, minutos, segundos, e) {
        const hh = horas.toString().padStart(2, '0');
        const mm = minutos.toString().padStart(2, '0');
        const ss = segundos.toString().padStart(2, '0');
        const texto = `${hh}:${mm}:${ss}`;

        const gr = r * 0.55;
        const yPos = cy + gr;

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        const ancho = r * 0.55;
        const alto = r * 0.15;
        const rx = cx - ancho / 2;
        const ry = yPos - alto / 2;
        ctx.beginPath();
        ctx.roundRect(rx, ry, ancho, alto, 3);
        ctx.fill();

        ctx.fillStyle = e.manecillaSegundo;
        ctx.font = `bold ${r * 0.10}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(texto, cx, yPos);
    }
};

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}
