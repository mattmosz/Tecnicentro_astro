// server/routes/reportes.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = Router();

/* ========== Auth (Bearer) ========== */
const verifyToken = (req, res, next) => {
    try {
        const h = req.headers['authorization'] || '';
        const token = h.startsWith('Bearer ') ? h.slice(7) : null;
        if (!token) return res.status(401).json({ success: false, message: 'Token no proporcionado' });
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }
};

/* ========== Helpers ========== */
function getDateRange(q = {}) {
    const today = new Date();
    const dEf = new Date(today); dEf.setDate(dEf.getDate() - 30);
    const desde = q.desde ? new Date(q.desde) : dEf;
    const hasta = q.hasta ? new Date(q.hasta) : today;
    const fmt = (d, end = false) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${end ? '23:59:59' : '00:00:00'}`;
    return {
        desdeStr: fmt(desde, false),
        hastaStr: fmt(hasta, true),
        desdeISO: fmt(desde, false).slice(0, 10),
        hastaISO: fmt(hasta, true).slice(0, 10),
    };
}

// Desactivar caché en /api/reportes
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

/* ========== Health ========== */
router.get('/ping', (_req, res) => res.json({ ok: true, ruta: '/api/reportes/ping' }));

/* ========== GET /api/reportes ========== */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { desdeStr, hastaStr, desdeISO, hastaISO } = getDateRange(req.query);

    // RESUMEN
    const [resumenRows] = await db.execute(
      `SELECT COALESCE(SUM(f.total),0) AS total, COUNT(*) AS ordenes
       FROM facturas f
       WHERE DATE(f.fecha_emision) BETWEEN ? AND ?`,
      [desdeISO, hastaISO]
    );

    // CLIENTES NUEVOS (primera factura por cliente dentro del rango)
    const [cliRows] = await db.execute(
      `SELECT COUNT(*) AS c
         FROM (
           SELECT v.id_cliente AS cliente_id, MIN(f.fecha_emision) AS primera
           FROM facturas f
           JOIN ordenes_servicio o ON o.id = f.id_orden
           JOIN vehiculos v       ON v.id = o.id_vehiculo
           GROUP BY v.id_cliente
         ) t
       WHERE DATE(t.primera) BETWEEN ? AND ?`,
      [desdeISO, hastaISO]
    );

    const resumen = {
      total: Number(resumenRows?.[0]?.total || 0),
      ordenes: Number(resumenRows?.[0]?.ordenes || 0),
      clientes_nuevos: Number(cliRows?.[0]?.c || 0),
    };

    // VENTAS POR DÍA
    const [ventasDia] = await db.execute(
      `SELECT DATE(f.fecha_emision) AS fecha, COALESCE(SUM(f.total),0) AS total
       FROM facturas f
       WHERE DATE(f.fecha_emision) BETWEEN ? AND ?
       GROUP BY DATE(f.fecha_emision)
       ORDER BY fecha ASC`,
      [desdeISO, hastaISO]
    );

    // TOP SERVICIOS
    const [topServicios] = await db.execute(
      `SELECT s.descripcion AS nombre,
              COALESCE(SUM(do.cantidad),0) AS cantidad,
              COALESCE(SUM(do.cantidad * do.precio_unitario),0) AS total
       FROM detalle_ordenes do
       INNER JOIN facturas  f ON f.id_orden = do.id_orden
       INNER JOIN servicios s ON s.id = do.id_servicio
       WHERE DATE(f.fecha_emision) BETWEEN ? AND ?
       GROUP BY s.descripcion
       ORDER BY total DESC
       LIMIT 10`,
      [desdeISO, hastaISO]
    );

    return res.json({
      success: true,
      resumen,
      ventas_dia: ventasDia.map(r => ({ fecha: r.fecha, total: Number(r.total || 0) })),
      top_servicios: topServicios.map(r => ({
        nombre: r.nombre,
        cantidad: Number(r.cantidad || 0),
        total: Number(r.total || 0),
      })),
    });
  } catch (err) {
    console.error('[REPORTES] Error:', err);
    return res.status(500).json({ success: false, message: 'Error generando reporte' });
  }
});

/* ========== GET /api/reportes/export (CSV) ========== */
router.get('/export', verifyToken, async (req, res) => {
  try {
    const { desdeStr, hastaStr, desdeISO, hastaISO } = getDateRange(req.query);

    const [resumenRows] = await db.execute(
      `SELECT COALESCE(SUM(f.total),0) AS total, COUNT(*) AS ordenes
       FROM facturas f
       WHERE DATE(f.fecha_emision) BETWEEN ? AND ?`,
      [desdeISO, hastaISO]
    );

    const [cliRows] = await db.execute(
      `SELECT COUNT(*) AS c
         FROM (
           SELECT v.id_cliente AS cliente_id, MIN(f.fecha_emision) AS primera
           FROM facturas f
           JOIN ordenes_servicio o ON o.id = f.id_orden
           JOIN vehiculos v       ON v.id = o.id_vehiculo
           GROUP BY v.id_cliente
         ) t
       WHERE DATE(t.primera) BETWEEN ? AND ?`,
      [desdeISO, hastaISO]
    );

    const resumen = {
      total: Number(resumenRows?.[0]?.total || 0),
      ordenes: Number(resumenRows?.[0]?.ordenes || 0),
      clientes_nuevos: Number(cliRows?.[0]?.c || 0),
    };

    const [ventasDia] = await db.execute(
      `SELECT DATE(f.fecha_emision) AS fecha, COALESCE(SUM(f.total),0) AS total
       FROM facturas f
       WHERE DATE(f.fecha_emision) BETWEEN ? AND ?
       GROUP BY DATE(f.fecha_emision)
       ORDER BY fecha ASC`,
      [desdeISO, hastaISO]
    );

    const [topServicios] = await db.execute(
      `SELECT s.descripcion AS nombre,
              COALESCE(SUM(do.cantidad),0) AS cantidad,
              COALESCE(SUM(do.cantidad * do.precio_unitario),0) AS total
       FROM detalle_ordenes do
       INNER JOIN facturas  f ON f.id_orden = do.id_orden
       INNER JOIN servicios s ON s.id = do.id_servicio
       WHERE DATE(f.fecha_emision) BETWEEN ? AND ?
       GROUP BY s.descripcion
       ORDER BY total DESC
       LIMIT 50`,
      [desdeISO, hastaISO]
    );

    // CSV
    const esc = (v) => String(v ?? '').replace(/"/g, '""');
    const lines = [];
    lines.push(`Rango,${desdeISO} a ${hastaISO}`);
    lines.push('');
    lines.push('Resumen');
    lines.push('Total,Ordenes,Clientes nuevos');
    lines.push(`${resumen.total},${resumen.ordenes},${resumen.clientes_nuevos}`);
    lines.push('');
    lines.push('Ventas por día');
    lines.push('Fecha,Total');
    ventasDia.forEach(r => lines.push(`${r.fecha},${r.total}`));
    lines.push('');
    lines.push('Top servicios');
    lines.push('Servicio,Cantidad,Total');
    topServicios.forEach(r => lines.push(`"${esc(r.nombre)}",${r.cantidad},${r.total}`));

    const csv = lines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', `attachment; filename="reportes_${desdeISO}_a_${hastaISO}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error('[REPORTES] Export error:', err);
    return res.status(500).json({ success: false, message: 'Error exportando CSV' });
  }
});

export default router;
