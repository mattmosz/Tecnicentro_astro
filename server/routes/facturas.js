import express from 'express';
import db from '../config/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// Middleware para verificar que sea admin
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  next();
};

// Generar número de factura único
async function generarNumeroFactura(connection = null) {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const prefijo = `FAC-${año}${mes}-`;
  
  const dbConn = connection || db;
  
  try {
    // Generar un número único basado en timestamp para evitar duplicados
    const timestamp = Date.now();
    const numeroBase = timestamp % 10000; // Últimos 4 dígitos del timestamp
    
    // Verificar números desde este punto hacia arriba
    for (let i = numeroBase; i < numeroBase + 1000; i++) {
      const numeroFactura = `${prefijo}${String(i).padStart(4, '0')}`;
      
      // Verificar que no exista
      const [existe] = await dbConn.execute(
        'SELECT numero_factura FROM facturas WHERE numero_factura = ?',
        [numeroFactura]
      );
      
      if (existe.length === 0) {
        console.log(`Número de factura generado: ${numeroFactura}`);
        return numeroFactura;
      }
    }
    
    // Si no encuentra ninguno disponible, usar un número aleatorio alto
    const numeroAleatorio = Math.floor(Math.random() * 9000) + 1000;
    const numeroFactura = `${prefijo}${String(numeroAleatorio).padStart(4, '0')}`;
    
    console.log(`Número de factura aleatorio generado: ${numeroFactura}`);
    return numeroFactura;
    
  } catch (error) {
    console.error('Error generando número de factura:', error);
    throw error;
  }
}

// Crear factura desde una orden
router.post('/desde-orden/:ordenId', verifyToken, requireAdmin, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { ordenId } = req.params;
    const { tipo_factura } = req.body;

    // Verificar que la orden existe y no esté ya facturada
    const [orden] = await connection.execute(`
      SELECT o.*, v.id_cliente, c.tipo as tipo_cliente
      FROM ordenes_servicio o
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      WHERE o.id = ? AND o.estado = 'pendiente'
    `, [ordenId]);

    if (orden.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Orden no encontrada o ya facturada' 
      });
    }

    // Obtener detalles de la orden
    const [detalles] = await connection.execute(`
      SELECT do.*, s.descripcion
      FROM detalle_ordenes do
      JOIN servicios s ON do.id_servicio = s.id
      WHERE do.id_orden = ?
    `, [ordenId]);

    if (detalles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'La orden no tiene servicios asociados' 
      });
    }

    // Calcular totales
    const subtotal = detalles.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const iva = subtotal * 0.15; // 15% IVA
    const total = subtotal + iva;

    // Generar número de factura con la conexión de transacción
    const numero_factura = await generarNumeroFactura(connection);

    // Crear la factura
    const [facturaResult] = await connection.execute(
      'INSERT INTO facturas (numero_factura, id_orden, tipo_cliente, tipo_factura, subtotal, iva, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [numero_factura, ordenId, orden[0].tipo_cliente, tipo_factura || 'general', subtotal, iva, total]
    );

    const id_factura = facturaResult.insertId;

    // Agregar detalles de la factura
    for (const detalle of detalles) {
      await connection.execute(
        'INSERT INTO detalle_facturas (id_factura, descripcion, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [id_factura, detalle.descripcion, detalle.cantidad, detalle.precio_unitario]
      );
    }

    // Actualizar estado de la orden
    await connection.execute(
      'UPDATE ordenes_servicio SET estado = "facturada" WHERE id = ?',
      [ordenId]
    );

    await connection.commit();

    res.json({ 
      success: true, 
      message: 'Factura creada exitosamente', 
      numero_factura,
      id_factura,
      total
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear factura:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// Obtener todas las facturas
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [facturas] = await db.execute(`
      SELECT f.*, 
             v.marca, v.placa,
             CASE 
               WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
               ELSE c.razon_social
             END as cliente_nombre,
             c.identificacion
      FROM facturas f
      JOIN ordenes_servicio o ON f.id_orden = o.id
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      ORDER BY f.fecha_emision DESC
    `);

    res.json({ success: true, data: facturas });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener detalle de una factura
router.get('/:id/detalle', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [detalle] = await db.execute(`
      SELECT df.*
      FROM detalle_facturas df
      WHERE df.id_factura = ?
      ORDER BY df.descripcion
    `, [id]);

    res.json({ success: true, data: detalle });
  } catch (error) {
    console.error('Error al obtener detalle de factura:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener KPIs de facturación
router.get('/kpis', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Verificar si la tabla facturas existe y crearla si no existe
    await db.execute(`
      CREATE TABLE IF NOT EXISTS facturas (
        id int(11) NOT NULL AUTO_INCREMENT,
        numero_factura varchar(25) NOT NULL,
        id_orden int(11) NOT NULL,
        tipo_cliente enum('particular','institucion') NOT NULL,
        tipo_factura enum('general','mano_obra','repuestos','lubricantes') DEFAULT 'general',
        fecha_emision datetime DEFAULT current_timestamp(),
        subtotal decimal(10,2) NOT NULL,
        iva decimal(10,2) NOT NULL,
        total decimal(10,2) NOT NULL,
        archivo_xml text DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY numero_factura (numero_factura),
        KEY id_orden (id_orden),
        CONSTRAINT facturas_ibfk_1 FOREIGN KEY (id_orden) REFERENCES ordenes_servicio (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Crear tabla detalle_facturas si no existe
    await db.execute(`
      CREATE TABLE IF NOT EXISTS detalle_facturas (
        id int(11) NOT NULL AUTO_INCREMENT,
        id_factura int(11) NOT NULL,
        descripcion varchar(255) NOT NULL,
        cantidad int(11) NOT NULL,
        precio_unitario decimal(10,2) NOT NULL,
        PRIMARY KEY (id),
        KEY id_factura (id_factura),
        CONSTRAINT detalle_facturas_ibfk_1 FOREIGN KEY (id_factura) REFERENCES facturas (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Ventas de hoy
    const [hoy] = await db.execute(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM facturas 
      WHERE DATE(fecha_emision) = CURDATE()
    `);

    // Ventas del mes actual
    const [mes] = await db.execute(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM facturas 
      WHERE YEAR(fecha_emision) = YEAR(CURDATE()) 
      AND MONTH(fecha_emision) = MONTH(CURDATE())
    `);

    // Número total de facturas del mes
    const [num] = await db.execute(`
      SELECT COUNT(*) as count
      FROM facturas 
      WHERE YEAR(fecha_emision) = YEAR(CURDATE()) 
      AND MONTH(fecha_emision) = MONTH(CURDATE())
    `);

    res.json({ 
      success: true, 
      data: {
        hoy: parseFloat(hoy[0].total),
        mes: parseFloat(mes[0].total),
        num: parseInt(num[0].count)
      }
    });
  } catch (error) {
    console.error('Error al obtener KPIs:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener órdenes pendientes de facturación
router.get('/ordenes-pendientes', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [ordenes] = await db.execute(`
      SELECT o.id, o.fecha_ingreso, 
             COALESCE(SUM(do.subtotal), 0) as subtotal,
             COALESCE(SUM(do.subtotal), 0) * 0.15 as iva,
             COALESCE(SUM(do.subtotal), 0) * 1.15 as total,
             v.marca, v.placa,
             CASE 
               WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
               ELSE c.razon_social
             END as cliente_nombre,
             c.identificacion,
             COUNT(do.id) as num_servicios
      FROM ordenes_servicio o
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      LEFT JOIN detalle_ordenes do ON o.id = do.id_orden
      WHERE o.estado = 'pendiente'
      GROUP BY o.id, o.fecha_ingreso, v.marca, v.placa, c.tipo, c.nombres, c.apellidos, c.razon_social, c.identificacion
      ORDER BY o.fecha_ingreso DESC
    `);

    res.json({ success: true, data: ordenes });
  } catch (error) {
    console.error('Error al obtener órdenes pendientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener detalle de una factura específica
router.get('/detalle/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const facturaId = req.params.id;
    
    // Obtener información de la factura
    const [facturaResult] = await db.execute(`
      SELECT f.*, o.fecha_ingreso as fecha_orden,
             CASE 
               WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
               ELSE c.razon_social
             END as cliente_nombre,
             c.identificacion, c.telefono, c.correo as email, c.direccion,
             v.marca, v.placa, v.kilometraje
      FROM facturas f
      JOIN ordenes_servicio o ON f.id_orden = o.id
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      WHERE f.id = ?
    `, [facturaId]);

    if (facturaResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    // Obtener detalles de servicios
    const [detallesResult] = await db.execute(`
      SELECT df.*, df.descripcion as servicio_nombre
      FROM detalle_facturas df
      WHERE df.id_factura = ?
    `, [facturaId]);

    const factura = facturaResult[0];
    factura.detalles = detallesResult;

    res.json({ success: true, data: factura });
  } catch (error) {
    console.error('Error al obtener detalle de factura:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Generar PDF de factura
router.get('/pdf/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const facturaId = req.params.id;
    
    // Obtener información completa de la factura
    const [facturaResult] = await db.execute(`
      SELECT f.*, o.fecha_ingreso as fecha_orden,
             CASE 
               WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
               ELSE c.razon_social
             END as cliente_nombre,
             c.identificacion, c.telefono, c.correo as email, c.direccion,
             v.marca, v.placa, v.kilometraje
      FROM facturas f
      JOIN ordenes_servicio o ON f.id_orden = o.id
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      WHERE f.id = ?
    `, [facturaId]);

    if (facturaResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    // Obtener detalles de servicios
    const [detallesResult] = await db.execute(`
      SELECT df.*, df.descripcion as servicio_nombre
      FROM detalle_facturas df
      WHERE df.id_factura = ?
    `, [facturaId]);

    const factura = facturaResult[0];
    factura.detalles = detallesResult;

    // Generar HTML del PDF con diseño corporativo
    const pdfHtml = generarHtmlFactura(factura);
    
    // Configurar headers para PDF
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="Factura_${factura.numero_factura}.pdf"`);
    
    res.send(pdfHtml);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ success: false, message: 'Error al generar PDF' });
  }
});

// Función para generar HTML del PDF
function generarHtmlFactura(factura) {
  const fechaEmision = new Date(factura.fecha_emision).toLocaleDateString('es-EC');
  const fechaOrden = new Date(factura.fecha_orden).toLocaleDateString('es-EC');
  
  let detallesHtml = '';
  let subtotal = 0;
  
  factura.detalles.forEach(detalle => {
    const cantidad = parseInt(detalle.cantidad) || 0;
    const precioUnitario = parseFloat(detalle.precio_unitario) || 0;
    const total = cantidad * precioUnitario;
    subtotal += total;
    detallesHtml += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${detalle.servicio_nombre}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${precioUnitario.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">$${total.toFixed(2)}</td>
      </tr>
    `;
  });

  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Factura ${factura.numero_factura}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          color: #333;
          line-height: 1.4;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); 
          color: white; 
          padding: 30px; 
          text-align: center;
        }
        .logo { 
          font-size: 2.5em; 
          margin-bottom: 10px; 
        }
        .company-name { 
          font-size: 1.8em; 
          font-weight: bold; 
          margin-bottom: 5px;
        }
        .company-subtitle { 
          font-size: 1.1em; 
          opacity: 0.9;
        }
        .content { 
          padding: 30px; 
        }
        .invoice-info { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .invoice-number { 
          background: #f8fafc; 
          padding: 15px; 
          border-left: 4px solid #3b82f6; 
          border-radius: 4px;
        }
        .invoice-number h2 { 
          margin: 0; 
          color: #1e3a8a; 
          font-size: 1.5em;
        }
        .dates { 
          text-align: right; 
        }
        .dates div { 
          margin-bottom: 8px; 
        }
        .section { 
          margin-bottom: 25px; 
        }
        .section-title { 
          background: #e3f2fd; 
          padding: 10px 15px; 
          margin-bottom: 15px; 
          font-weight: bold; 
          color: #1e3a8a;
          border-radius: 4px;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
          margin-bottom: 20px;
        }
        .info-block p { 
          margin: 5px 0; 
        }
        .info-block strong { 
          color: #1e3a8a; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        th { 
          background: #1e3a8a; 
          color: white; 
          padding: 12px; 
          text-align: left; 
        }
        th:last-child, td:last-child { 
          text-align: right; 
        }
        th:nth-child(2), td:nth-child(2) { 
          text-align: center; 
        }
        .totals { 
          margin-top: 20px; 
          text-align: right; 
        }
        .totals table { 
          margin-left: auto; 
          width: 300px; 
          box-shadow: none;
        }
        .totals th { 
          background: #f8fafc; 
          color: #333; 
          border: 1px solid #e5e7eb;
        }
        .totals td { 
          border: 1px solid #e5e7eb; 
          padding: 8px 12px; 
        }
        .total-final { 
          background: #1e3a8a !important; 
          color: white !important; 
          font-weight: bold;
          font-size: 1.1em;
        }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 2px solid #e5e7eb; 
          text-align: center; 
          color: #666;
        }
        @media print {
          body { padding: 0; }
          .container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔧</div>
          <div class="company-name">TecniCentro Ibarra Express</div>
          <div class="company-subtitle">Servicios Automotrices Especializados</div>
        </div>
        
        <div class="content">
          <div class="invoice-info">
            <div class="invoice-number">
              <h2>FACTURA</h2>
              <p><strong>N° ${factura.numero_factura}</strong></p>
            </div>
            <div class="dates">
              <div><strong>Fecha de Emisión:</strong> ${fechaEmision}</div>
              <div><strong>Fecha de Orden:</strong> ${fechaOrden}</div>
              <div><strong>Tipo:</strong> ${factura.tipo_factura.toUpperCase()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
            <div class="info-grid">
              <div class="info-block">
                <p><strong>Cliente:</strong> ${factura.cliente_nombre}</p>
                <p><strong>Identificación:</strong> ${factura.identificacion}</p>
                <p><strong>Teléfono:</strong> ${factura.telefono || 'N/A'}</p>
              </div>
              <div class="info-block">
                <p><strong>Email:</strong> ${factura.email || 'N/A'}</p>
                <p><strong>Dirección:</strong> ${factura.direccion || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">INFORMACIÓN DEL VEHÍCULO</div>
            <div class="info-grid">
              <div class="info-block">
                <p><strong>Marca:</strong> ${factura.marca}</p>
                <p><strong>Placa:</strong> ${factura.placa}</p>
              </div>
              <div class="info-block">
                <p><strong>Kilometraje:</strong> ${factura.kilometraje || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">DETALLE DE SERVICIOS</div>
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${detallesHtml}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table>
              <tr>
                <th>Subtotal:</th>
                <td>$${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <th>IVA (15%):</th>
                <td>$${iva.toFixed(2)}</td>
              </tr>
              <tr class="total-final">
                <th>TOTAL:</th>
                <td>$${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Gracias por confiar en TecniCentro Ibarra Express</p>
            <p><strong>¡Su satisfacción es nuestro compromiso!</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default router;
