-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 31-08-2025 a las 21:41:22
-- Versión del servidor: 10.4.27-MariaDB
-- Versión de PHP: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `taller`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `tipo` enum('particular','institucion') NOT NULL,
  `identificacion` varchar(20) NOT NULL,
  `nombres` varchar(100) DEFAULT NULL,
  `apellidos` varchar(100) DEFAULT NULL,
  `razon_social` varchar(150) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `tipo`, `identificacion`, `nombres`, `apellidos`, `razon_social`, `telefono`, `correo`, `direccion`, `estado`) VALUES
(1, 'particular', '1003540174', 'Matías Marcelo', 'Mosquera Báez', NULL, '0958849189', 'matias.mosquera619@gmail.com', 'Av. Atahualpa 20-41 y Carlos Proano', 'activo'),
(2, 'particular', '1001250446', 'Jorge', 'Yepez', NULL, '2342342', 'hola@gmail.com', 'Sióm Bolivar 123 y Sucre', 'inactivo'),
(3, 'particular', '100', 'hola', 'hola', NULL, '1231231', 'a@gmail.com', 'hola', 'inactivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_facturas`
--

CREATE TABLE `detalle_facturas` (
  `id` int(11) NOT NULL,
  `id_factura` int(11) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS (`cantidad` * `precio_unitario`) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_ordenes`
--

CREATE TABLE `detalle_ordenes` (
  `id` int(11) NOT NULL,
  `id_orden` int(11) NOT NULL,
  `id_servicio` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS (`cantidad` * `precio_unitario`) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id` int(11) NOT NULL,
  `numero_factura` varchar(25) NOT NULL,
  `id_orden` int(11) NOT NULL,
  `tipo_cliente` enum('particular','institucion') NOT NULL,
  `tipo_factura` enum('general','mano_obra','repuestos','lubricantes') DEFAULT 'general',
  `fecha_emision` datetime DEFAULT current_timestamp(),
  `subtotal` decimal(10,2) NOT NULL,
  `iva` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `archivo_xml` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordenes_servicio`
--

CREATE TABLE `ordenes_servicio` (
  `id` int(11) NOT NULL,
  `numero_orden` varchar(20) NOT NULL,
  `id_vehiculo` int(11) NOT NULL,
  `id_tecnico` int(11) DEFAULT NULL,
  `fecha_ingreso` datetime DEFAULT current_timestamp(),
  `observaciones` text DEFAULT NULL,
  `estado` enum('pendiente','facturada') DEFAULT 'pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id` int(11) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `tipo` enum('servicio','repuesto','lubricante') DEFAULT 'servicio'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id`, `codigo`, `descripcion`, `precio_unitario`, `tipo`) VALUES
(6, 'REP0001', 'ABRAZADERA 10X16.5/8', '2.17', 'repuesto'),
(7, 'REP0002', 'ABRAZADERA 12X20.3/4', '2.17', 'repuesto'),
(8, 'REP0003', 'ABRAZADERA 20X32, 1P', '2.17', 'repuesto'),
(9, 'REP0004', 'ABRAZADERA 30X45 1 3./4', '2.79', 'repuesto'),
(10, 'REP0005', 'ABRAZADERA 38X50', '2.79', 'repuesto'),
(11, 'REP0006', 'ABRAZADERA 40X60 ', '2.79', 'repuesto'),
(12, 'REP0007', 'ABRAZADERA 50X70', '2.79', 'repuesto'),
(13, 'REP0008', 'ABRAZADERA 60X80', '3.41', 'repuesto'),
(14, 'REP0009', 'ABRAZADERA DE MANGUERA', '3.41', 'repuesto'),
(15, 'REP0010', 'ABRAZADERA PAQUETE RES/DIM', '3.41', 'repuesto'),
(16, 'REP0011', 'ACOPLE INFERIOR', '83.59', 'repuesto'),
(17, 'REP0012', 'ACUMULADOR', '6.19', 'repuesto'),
(18, 'REP0013', 'ALARMA CHEVROLET', '61.92', 'repuesto'),
(19, 'REP0014', 'ALTERNADOR', '184.52', 'repuesto'),
(20, 'REP0015', 'AMORTIGUADOR DELANTERO', '30.96', 'repuesto'),
(21, 'REP0016', 'AMORTIGUADOR POSTERIOR', '30.96', 'repuesto'),
(22, 'REP0017', 'ANILLO DE COBRE INYECTOR', '1.24', 'repuesto'),
(23, 'REP0018', 'ANILLO INYECTOR DOBLE', '3.10', 'repuesto'),
(24, 'REP0019', 'ANILLO PL 6.4', '3.10', 'repuesto'),
(25, 'REP0020', 'ANILLO TAPON', '3.10', 'repuesto'),
(26, 'REP0021', 'ARANDELA EJE CONO', '3.10', 'repuesto'),
(27, 'REP0022', 'ARAÑA DE EJE DELANTERO', '61.92', 'repuesto'),
(28, 'REP0023', 'ARO DE LEVAS', '182.67', 'repuesto'),
(29, 'REP0024', 'ARTICULACION DE DIRECCION', '15.48', 'repuesto'),
(30, 'REP0025', 'BANDA DE ACCESORIOS (BOMBA HIDARULICA Y A/C)', '11.15', 'repuesto'),
(31, 'REP0026', 'BANDA DE ALTERNADOR ', '13.62', 'repuesto'),
(32, 'REP0027', 'BARRA DE LEVAS', '182.67', 'repuesto'),
(33, 'REP0028', 'BASE C/CARDAN 3.0', '48.30', 'repuesto'),
(34, 'REP0029', 'BASE CARDAN DIM (CORTA)', '46.44', 'repuesto'),
(35, 'REP0030', 'BASE COMPRESOR', '12.38', 'repuesto'),
(36, 'REP0031', 'BASE DE FILTRO COMBUSTIBLE', '12.38', 'repuesto'),
(37, 'REP0032', 'BASE DE CAJA DE CAMBIO', '27.86', 'repuesto'),
(38, 'REP0033', 'BASE DEL MOTOR LH', '21.67', 'repuesto'),
(39, 'REP0034', 'BASE DEL MOTOR RH', '21.67', 'repuesto'),
(40, 'REP0035', 'BASE SOPORTE DE HORQUILLA', '15.48', 'repuesto'),
(41, 'REP0036', 'BATERÍA 12V S4 FULL EQUIPO 80 AMP', '89.79', 'repuesto'),
(42, 'REP0037', 'BOCIN B/ESTABILIZADOR DIM 4X4', '18.58', 'repuesto'),
(43, 'REP0038', 'BOCIN DE MESA INFERIOR ANTERIOR', '18.58', 'repuesto'),
(44, 'REP0039', 'BOCIN DE MESA SUPERIOR ANTERIOR', '18.58', 'repuesto'),
(45, 'REP0040', 'BOCIN DEL PAQUETE POSTERIOR', '18.58', 'repuesto'),
(46, 'REP0041', 'BOCINA O PITO', '18.58', 'repuesto'),
(47, 'REP0042', 'BOCINES DE  BARRA DE LEVAS', '9.29', 'repuesto'),
(48, 'REP0043', 'BOMBA AUXILIAR DE COMBUSTIBLE', '24.77', 'repuesto'),
(49, 'REP0044', 'BOMBA DE ACEITE', '117.65', 'repuesto'),
(50, 'REP0045', 'BOMBA DE AGUA', '49.54', 'repuesto'),
(51, 'REP0046', 'BOMBA DE INYECCION', '681.13', 'repuesto'),
(52, 'REP0047', 'BOMBA HIDRAULICA DEL  DIRECCION', '154.80', 'repuesto'),
(53, 'REP0048', 'BOMBILLO H4/12V/60/55/P', '4.33', 'repuesto'),
(54, 'REP0049', 'BOMBILLO H7/12V/55W/PX2', '4.95', 'repuesto'),
(55, 'REP0050', 'BOTON A/C .ST/ 95-', '3.10', 'repuesto'),
(56, 'REP0051', 'BLOWER', '3.10', 'repuesto'),
(57, 'REP0052', 'BRAZO DE TORSION', '18.58', 'repuesto'),
(58, 'REP0053', 'BUJIA DE PRECALENTAMIENTO', '74.31', 'repuesto'),
(59, 'REP0054', 'CABLE # 10', '6.19', 'repuesto'),
(60, 'REP0055', 'CABLE # 14', '6.81', 'repuesto'),
(61, 'REP0056', 'CABLE # 16', '7.43', 'repuesto'),
(62, 'REP0057', 'CABLE # 18', '8.05', 'repuesto'),
(63, 'REP0058', 'CABLE CAPOT', '6.19', 'repuesto'),
(64, 'REP0059', 'CABLE DE FRENO DE MANO ', '43.34', 'repuesto'),
(65, 'REP0060', 'CADENA DEL  DISTRIBUCION', '49.54', 'repuesto'),
(66, 'REP0061', 'CAJA DE DIRECCION', '61.92', 'repuesto'),
(67, 'REP0062', 'CAMISA DE PISTON', '247.68', 'repuesto'),
(68, 'REP0063', 'CANAL PUERTA DELANTERA LH/DIM', '6.19', 'repuesto'),
(69, 'REP0064', 'CANAL PUERTA DELANTERA RH/DIM', '6.19', 'repuesto'),
(70, 'REP0065', 'CANASTILLA CC', '18.58', 'repuesto'),
(71, 'REP0066', 'CANASTILLA EJE', '24.77', 'repuesto'),
(72, 'REP0067', 'CANASTILLA PALANCA DE CAMBIOS', '12.38', 'repuesto'),
(73, 'REP0068', 'CAPACITADORES DE BALIZAS', '30.96', 'repuesto'),
(74, 'REP0069', 'CARBONES DE ALTERNADOR', '12.38', 'repuesto'),
(75, 'REP0070', 'CARDAN PROPULSOR', '185.76', 'repuesto'),
(76, 'REP0071', 'CARDAN TRANSF.DIM/4X4', '309.61', 'repuesto'),
(77, 'REP0072', 'CATALIZADOR DE ESCAPE', '74.31', 'repuesto'),
(78, 'REP0073', 'CAUCHO DEL  BARRA ESTABILIZADORA', '6.19', 'repuesto'),
(79, 'REP0074', 'CAUCHO DEL PAQUETE POSTERIOR', '6.19', 'repuesto'),
(80, 'REP0075', 'CAUCHO INFERIOR CABINA FRONTAL/DIM', '12.38', 'repuesto'),
(81, 'REP0076', 'CAUCHO SUPERIOR CABINA FRONTAL/DIM', '12.38', 'repuesto'),
(82, 'REP0077', 'CILINDRO AUXILIAR DE EMBRAGUE', '49.54', 'repuesto'),
(83, 'REP0078', 'CILINDRO DE AVANCE', '61.92', 'repuesto'),
(84, 'REP0079', 'CILINDRO DE RUEDA POSTERIOR DE FRENO', '15.48', 'repuesto'),
(85, 'REP0080', 'CILINDRO PRINCIPAL DE EMBRAGUE', '61.92', 'repuesto'),
(86, 'REP0081', 'CILINDRO PRINCIPAL DE FRENO', '74.31', 'repuesto'),
(87, 'REP0082', 'CILINDRO PTA. DEL. RH/DIM', '30.96', 'repuesto'),
(88, 'REP0083', 'CINTA AISLANTE', '1.86', 'repuesto'),
(89, 'REP0084', 'COLECTOR DE ALTERNADOR', '12.38', 'repuesto'),
(90, 'REP0085', 'CONECTOR A/C ', '6.19', 'repuesto'),
(91, 'REP0086', 'CONJUNTO P/FR/MANO/DIM', '49.54', 'repuesto'),
(92, 'REP0087', 'CONO/CORONA D-MAX', '619.21', 'repuesto'),
(93, 'REP0088', 'CONTROL A/C DIM 09', '6.19', 'repuesto'),
(94, 'REP0089', 'CONTROL ALARMA CHEVY', '18.58', 'repuesto'),
(95, 'REP0090', 'CORONILLA DE ALTERNADOR', '18.58', 'repuesto'),
(96, 'REP0091', 'CORREA DE AMARRE', '0.62', 'repuesto'),
(97, 'REP0092', 'CRUCETA DEL CARDAN', '12.38', 'repuesto'),
(98, 'REP0093', 'DEFLECTOR INFERIOR RADIADOR', '12.38', 'repuesto'),
(99, 'REP0094', 'DEFLECTOR SUPERIOR RADIADOR', '12.38', 'repuesto'),
(100, 'REP0095', 'DESLIZADOR TRANSFER D-MAX', '30.96', 'repuesto'),
(101, 'REP0096', 'DIFERENCIAL POSTERIOR', '309.61', 'repuesto'),
(102, 'REP0097', 'DIFRENCIAL ANTERIOR', '309.61', 'repuesto'),
(103, 'REP0098', 'DIODO DE PANEL DE INSTRUMENTO', '3.10', 'repuesto'),
(104, 'REP0099', 'DIRECCIONAL GURADFANGO', '12.38', 'repuesto'),
(105, 'REP0100', 'DISCO CLOSH COMPRESOR', '12.38', 'repuesto'),
(106, 'REP0101', 'DISCO DE FRENO ', '27.86', 'repuesto'),
(107, 'REP0102', 'EJE POSTERIOR DIM 4X4', '136.23', 'repuesto'),
(108, 'REP0103', 'ELECTROVALVULA', '24.77', 'repuesto'),
(109, 'REP0104', 'EMBRAGUE DEL VENTILADOR', '61.92', 'repuesto'),
(110, 'REP0105', 'EMPAQUE BASE FILTR/DIM', '3.10', 'repuesto'),
(111, 'REP0106', 'EMPAQUE DE CABEZOTE', '34.06', 'repuesto'),
(112, 'REP0107', 'EMPAQUE DE CARTER INFERIOR', '12.38', 'repuesto'),
(113, 'REP0108', 'EMPAQUE DE CARTER SUPERIOR', '12.38', 'repuesto'),
(114, 'REP0109', 'EMPAQUE DE TAPA VALVULA', '15.48', 'repuesto'),
(115, 'REP0110', 'EMPAQUE ENFRIADOR DE AC', '6.19', 'repuesto'),
(116, 'REP0111', 'EMPAQUE MULTIPLE DE ADMISION', '11.15', 'repuesto'),
(117, 'REP0112', 'EMPAQUE MULTIPLE DE ESCAPE', '11.15', 'repuesto'),
(118, 'REP0113', 'EMPAQUE TAPA DISTRIBUCION', '6.19', 'repuesto'),
(119, 'REP0114', 'EMPAQUE TERMOSTATO', '6.19', 'repuesto'),
(120, 'REP0115', 'EMPAQUETADURA DEL MOTOR', '92.88', 'repuesto'),
(121, 'REP0116', 'ENFRIADOR DE ACEITE', '12.38', 'repuesto'),
(122, 'REP0117', 'ESPACIADOR DE CONO', '18.58', 'repuesto'),
(123, 'REP0118', 'ESPARRAGO DE RUEDA', '6.19', 'repuesto'),
(124, 'REP0119', 'ESPONJA ASIENTO DEL LH', '37.15', 'repuesto'),
(125, 'REP0120', 'ESPONJA ASIENTO DEL RH', '37.15', 'repuesto'),
(126, 'REP0121', 'EVAPORADOR DIM', '3.10', 'repuesto'),
(127, 'REP0122', 'FARO DELANTERO', '68.11', 'repuesto'),
(128, 'REP0123', 'FARO POSTERIOR', '40.25', 'repuesto'),
(129, 'REP0124', 'FILTRO DE ACEITE DE MOTOR', '5.26', 'repuesto'),
(130, 'REP0125', 'FILTRO DE AIRE', '7.74', 'repuesto'),
(131, 'REP0126', 'FILTRO DE BOMBA DE INYECCION (TABACO)', '4.95', 'repuesto'),
(132, 'REP0127', 'FILTRO DE COMBUSTIBLE PRIMARIO', '7.43', 'repuesto'),
(133, 'REP0128', 'FILTRO TRAMPA DE AGUA ', '7.43', 'repuesto'),
(134, 'REP0129', 'FLOTADOR TANQUE DE COMBUSTIBLE', '30.96', 'repuesto'),
(135, 'REP0130', 'FOCO 9001', '6.19', 'repuesto'),
(136, 'REP0131', 'FOCO 9006', '6.19', 'repuesto'),
(137, 'REP0132', 'FOCO DE DOS PUNTOS', '5.26', 'repuesto'),
(138, 'REP0133', 'FOCO DE UN PUNTO', '4.95', 'repuesto'),
(139, 'REP0134', 'FOCO DE UÑA', '4.95', 'repuesto'),
(140, 'REP0135', 'FORRO PALANCA DE CAMBIO', '9.29', 'repuesto'),
(141, 'REP0136', 'FORROS DE ASIENTO', '278.64', 'repuesto'),
(142, 'REP0137', 'FUSIBLE 100A', '12.38', 'repuesto'),
(143, 'REP0138', 'FUSIBLE 10A/ROJO', '1.55', 'repuesto'),
(144, 'REP0139', 'FUSIBLE 15A/AZUL', '1.55', 'repuesto'),
(145, 'REP0140', 'FUSIBLE 20A/AMAR', '2.79', 'repuesto'),
(146, 'REP0141', 'FUSIBLE 25A/CLAR', '2.79', 'repuesto'),
(147, 'REP0142', 'FUSIBLE 30A/AV3', '2.79', 'repuesto'),
(148, 'REP0143', 'GAS + ACEITE A/C', '30.96', 'repuesto'),
(149, 'REP0144', 'GRASA RODAMIENTOS', '9.29', 'repuesto'),
(150, 'REP0145', 'GUARDAP.HORQ.EMBRAGUE', '9.29', 'repuesto'),
(151, 'REP0146', 'GUARDAPOLVO DE GUARDAFANGO', '173.38', 'repuesto'),
(152, 'REP0147', 'GUARDAPOLVO DEL EJE EXTERIOR DELANTERO', '15.48', 'repuesto'),
(153, 'REP0148', 'GUARDAPOLVO DEL EJE INTERIOR DELANTERO', '15.48', 'repuesto'),
(154, 'REP0149', 'GUIA LATERAL TF/DIM', '15.48', 'repuesto'),
(155, 'REP0150', 'HALOGENO DE BALIZA', '24.77', 'repuesto'),
(156, 'REP0151', 'HOJA RESORTE # 1', '30.96', 'repuesto'),
(157, 'REP0152', 'HOJA RESORTE # 2', '30.96', 'repuesto'),
(158, 'REP0153', 'HOJA RESORTE # 3', '30.96', 'repuesto'),
(159, 'REP0154', 'HOJA RESORTE # 4', '30.96', 'repuesto'),
(160, 'REP0155', 'HOJA RESORTE # 5', '30.96', 'repuesto'),
(161, 'REP0156', 'HORQUILLA CAJA DE TRANSFERENCIA', '24.77', 'repuesto'),
(162, 'REP0157', 'HORQUILLA DE CAJA DE PRIMERA', '24.77', 'repuesto'),
(163, 'REP0158', 'HORQUILLA DE CAJA DE SEGUNDA', '24.77', 'repuesto'),
(164, 'REP0159', 'HORQUILLA DE CAJA DE TERCERA', '24.77', 'repuesto'),
(165, 'REP0160', 'HORQUILLA EMBR.TF/UC', '24.77', 'repuesto'),
(166, 'REP0161', 'INDUCIDO DE BLOWER', '24.77', 'repuesto'),
(167, 'REP0162', 'INTEGRADO DE AUDIO SIRENA', '160.99', 'repuesto'),
(168, 'REP0163', 'INTEGRADO DE BALIZA', '74.31', 'repuesto'),
(169, 'REP0164', 'INTERCOOLER ', '185.76', 'repuesto'),
(170, 'REP0165', 'INTERRUPTOR V/PTA.LH/DIM/08-', '3.10', 'repuesto'),
(171, 'REP0166', 'INTERRUPTOR V/PTA DEL RH/DIM', '3.10', 'repuesto'),
(172, 'REP0167', 'INTERRUPTOR DE PARQUEO', '6.19', 'repuesto'),
(173, 'REP0168', 'INYECTOR DE COMBUSTIBLE', '123.84', 'repuesto'),
(174, 'REP0169', 'JUEGO CARBON DE BLOWER', '18.58', 'repuesto'),
(175, 'REP0170', 'JUEGO DE CARCAZA DE ALTERNADOR', '12.38', 'repuesto'),
(176, 'REP0171', 'JUEGO SEGUROS DE BATERIA', '3.10', 'repuesto'),
(177, 'REP0172', 'JUEGO SELLOS Y ORINES', '9.29', 'repuesto'),
(178, 'REP0173', 'JUEGO COJINETES DE BANCADA', '27.86', 'repuesto'),
(179, 'REP0174', 'JUEGO COJINETES DE BIELA', '29.72', 'repuesto'),
(180, 'REP0175', 'JUEGO DE ELEVADORES HIDRAULICOS', '37.15', 'repuesto'),
(181, 'REP0176', 'JUEGO DE MOQUETAS', '74.31', 'repuesto'),
(182, 'REP0177', 'JUEGO DE VALVULAS DE ADMISION', '55.73', 'repuesto'),
(183, 'REP0178', 'JUEGO DE VALVULAS DE ESCAPE', '55.73', 'repuesto'),
(184, 'REP0179', 'JUEGO PASTILLAS DE FRENO ', '32.20', 'repuesto'),
(185, 'REP0180', 'KIT AIRE ACONDICIONADO DIM /3.0', '433.45', 'repuesto'),
(186, 'REP0181', 'KIT DE EMBRAGUE', '160.99', 'repuesto'),
(187, 'REP0182', 'KIT GRILLETE PAQUETES', '49.54', 'repuesto'),
(188, 'REP0183', 'KIT GUARDAPOLVO EXTERIOR EJE', '49.54', 'repuesto'),
(189, 'REP0184', 'KIT LIMPIEZA INY DIESEL', '27.86', 'repuesto'),
(190, 'REP0185', 'KIT REPAR.MORDAZA CORTA DIM', '24.77', 'repuesto'),
(191, 'REP0186', 'KIT REPARACION MOTOR (CAMISAS, RINES, PISTON\r\nBOMBA DE AGUA, BOMBA DE ACEITE, TERMOSTATO, V. ADMISION VALVULA DE ESCAPE, JUEGO EMPAQUES, CASQUETES BIELA Y BANCADA, GUIAS DE VALVULA, BOCINES ARBOL)', '2167.24', 'repuesto'),
(192, 'REP0187', 'ZAPATAS DE FRENO POST', '29.72', 'repuesto'),
(193, 'REP0188', 'LAINA DE EJE', '0.62', 'repuesto'),
(194, 'REP0189', 'ELEVAVIDRIOS DELANTERO LH ', '92.88', 'repuesto'),
(195, 'REP0190', 'ELEVAVIDRIOS POSTERIOR LH', '92.88', 'repuesto'),
(196, 'REP0191', 'ELEVAVIDRIOS DELANTERO RH', '92.88', 'repuesto'),
(197, 'REP0192', 'ELEVAVIDRIOS POSTEIOR RH ', '92.88', 'repuesto'),
(198, 'REP0193', 'LIMPIADOR EVAPORADOR', '9.29', 'repuesto'),
(199, 'REP0194', 'PLUMA LIMPIAVIDRIO 20/NH/NK/SQ/S', '9.29', 'repuesto'),
(200, 'REP0195', 'PLUMA LIMPIAVIDRIO 18`/UC/SQ/ST', '9.29', 'repuesto'),
(201, 'REP0196', 'LIQUIDO FRENO DOT 4', '6.19', 'repuesto'),
(202, 'REP0197', 'LT ACEITE 80W90 ', '5.88', 'repuesto'),
(203, 'REP0198', 'LT ACEITE C.C 75W90 ', '5.88', 'repuesto'),
(204, 'REP0199', 'LT ACEITE C.C ATF', '5.88', 'repuesto'),
(205, 'REP0200', 'LT. ACEITE 2 TIEMPOS', '2.48', 'repuesto'),
(206, 'REP0201', 'LT. ACEITE MOTOR 15W40', '5.88', 'repuesto'),
(207, 'REP0202', 'MANGUERA DE AGUA TERMOSTATO', '40.25', 'repuesto'),
(208, 'REP0203', 'MANGUERA A/C', '40.25', 'repuesto'),
(209, 'REP0204', 'MANGUERA AGUA', '40.25', 'repuesto'),
(210, 'REP0205', 'MANGUERA AIRE 3/8', '37.15', 'repuesto'),
(211, 'REP0206', 'MANGUERA ANTERIOR DE FRENO', '12.38', 'repuesto'),
(212, 'REP0207', 'MANGUERA COMBUSTIBLE', '30.96', 'repuesto'),
(213, 'REP0208', 'MANGUERA DE ALTERNADOR', '30.96', 'repuesto'),
(214, 'REP0209', 'MANGUERA DE CALEFACCION', '15.48', 'repuesto'),
(215, 'REP0210', 'MANGUERA DE DIRECCION SUPERIOR', '92.88', 'repuesto'),
(216, 'REP0211', 'MANGUERA DE PRESION DEL ACEITE HIDRAULICO', '92.88', 'repuesto'),
(217, 'REP0212', 'MANGUERA DE TAPA VALVULA', '15.48', 'repuesto'),
(218, 'REP0213', 'MANGUERA DEL TURBO', '154.80', 'repuesto'),
(219, 'REP0214', 'MANGUERA DEL CILINDRO AUXILIAR DE EMBRAGUE', '15.48', 'repuesto'),
(220, 'REP0215', 'MANGUERA DE DIRECCION HIDRAULICA', '92.88', 'repuesto'),
(221, 'REP0216', 'MANGUERA INFERIOR DE RADIADOR', '30.96', 'repuesto'),
(222, 'REP0217', 'MANGUERA INTERCOOLER INFERIOR', '30.96', 'repuesto'),
(223, 'REP0218', 'MANGUERA INTERCOOLER SUPERIOR', '30.96', 'repuesto'),
(224, 'REP0219', 'MANGUERA SUPERIOR DE RADIADOR', '30.96', 'repuesto'),
(225, 'REP0220', 'MANIJA ASIENTO LH PEQ DIM', '17.34', 'repuesto'),
(226, 'REP0221', 'MANIJA ASIENTO LH/DMAX', '17.34', 'repuesto'),
(227, 'REP0222', 'MANIJA ASIENTO RH PEQ DIM', '17.34', 'repuesto'),
(228, 'REP0223', 'MANIJA ASIENTO RH/DMAX', '17.34', 'repuesto'),
(229, 'REP0224', 'MANIJA REGULADOR ASIENTO LH', '18.58', 'repuesto'),
(230, 'REP0225', 'MANIJA REGULADOR ASIENTO RH', '18.58', 'repuesto'),
(231, 'REP0226', 'MANZANA RUEDA DELANTERA DIM 4X4', '99.07', 'repuesto'),
(232, 'REP0227', 'MASA DE ARRANQUE', '49.54', 'repuesto'),
(233, 'REP0228', 'MESA INFERIOR DE SUSPENSION ', '89.79', 'repuesto'),
(234, 'REP0229', 'MESA SUPERIOR DE SUSPENSION ', '89.79', 'repuesto'),
(235, 'REP0230', 'MODULO ACTUADOR 4X4', '495.37', 'repuesto'),
(236, 'REP0231', 'MODULO DE BALIZA', '185.76', 'repuesto'),
(237, 'REP0232', 'MODULO MOTOR ECM', '619.21', 'repuesto'),
(238, 'REP0233', 'MOLDURA CROMADA MASCARILLA', '49.54', 'repuesto'),
(239, 'REP0234', 'MORDAZA DE FRENO', '154.80', 'repuesto'),
(240, 'REP0235', 'MOTOR DE ARRANQUE', '154.80', 'repuesto'),
(241, 'REP0236', 'MOTOR ELEVAVIDRIO', '111.46', 'repuesto'),
(242, 'REP0237', 'ORING DE ALTERNADOR', '4.95', 'repuesto'),
(243, 'REP0238', 'ORING DE BOMBA', '4.95', 'repuesto'),
(244, 'REP0239', 'ORING DE ENFRIADOR DE ACEITE', '4.95', 'repuesto'),
(245, 'REP0240', 'PALANCA DIRECCIONALES DIM/09', '37.15', 'repuesto'),
(246, 'REP0241', 'PAQUETE DE RESORTE POSTERIOR', '37.15', 'repuesto'),
(247, 'REP0242', 'PARLANTE DE SIRENA', '37.15', 'repuesto'),
(248, 'REP0243', 'PASADOR 3X25/ROTULA T1', '3.10', 'repuesto'),
(249, 'REP0244', 'PASADOR 4X40/SINFÍN/T2', '3.10', 'repuesto'),
(250, 'REP0245', 'PEGAMENTO PEGA TODO', '3.10', 'repuesto'),
(251, 'REP0246', 'PERNO 10X100', '1.24', 'repuesto'),
(252, 'REP0247', 'PERNO 10X48', '1.24', 'repuesto'),
(253, 'REP0248', 'PERNO 12X30', '1.24', 'repuesto'),
(254, 'REP0249', 'PERNO 16X120', '1.24', 'repuesto'),
(255, 'REP0250', 'PERNO 4X20', '1.24', 'repuesto'),
(256, 'REP0251', 'PERNO 6X10', '1.24', 'repuesto'),
(257, 'REP0252', 'PERNO 6X15', '1.24', 'repuesto'),
(258, 'REP0253', 'PERNO 6X18', '1.24', 'repuesto'),
(259, 'REP0254', 'PERNO 8X75', '1.24', 'repuesto'),
(260, 'REP0255', 'PERNO ALEN', '2.17', 'repuesto'),
(261, 'REP0256', 'PERNO BASE DE ALTERNADOR', '2.17', 'repuesto'),
(262, 'REP0257', 'PERNO CABINA DELANTERO FRONTAL', '2.17', 'repuesto'),
(263, 'REP0258', 'PERNO CABINA FRONTAL/DIM', '1.24', 'repuesto'),
(264, 'REP0259', 'PERNO DE BOMBA AUXILIAR', '1.86', 'repuesto'),
(265, 'REP0260', 'PERNO DEL  MORDAZA DE FRENO INFERIOR', '1.86', 'repuesto'),
(266, 'REP0261', 'PERNO DEL  MORDAZA DE FRENO SUPERIOR', '1.86', 'repuesto'),
(267, 'REP0262', 'PERNO ENTRADA FILTRO', '1.86', 'repuesto'),
(268, 'REP0263', 'PERNO GUIA DE PAQUETE', '1.86', 'repuesto'),
(269, 'REP0264', 'PERNO REG.SUSP. DIM', '1.86', 'repuesto'),
(270, 'REP0265', 'PERNO RUEDA DEL', '1.86', 'repuesto'),
(271, 'REP0266', 'PERNO RUEDAS POS', '1.86', 'repuesto'),
(272, 'REP0267', 'PERNO VALVULA', '1.86', 'repuesto'),
(273, 'REP0268', 'PIÑON CC 1ERA', '154.80', 'repuesto'),
(274, 'REP0269', 'PIÑON CC 2DA', '154.80', 'repuesto'),
(275, 'REP0270', 'PIÑON CC 3ERA', '154.80', 'repuesto'),
(276, 'REP0271', 'PIÑON CC 4TA', '154.80', 'repuesto'),
(277, 'REP0272', 'PIÑON CC 5TA', '154.80', 'repuesto'),
(278, 'REP0273', 'PIÑON CC RETRO', '154.80', 'repuesto'),
(279, 'REP0274', 'PIÑON DEL  BARRA DE LEVAS', '92.88', 'repuesto'),
(280, 'REP0275', 'PIÑON DEL CIGÜEÑAL', '49.54', 'repuesto'),
(281, 'REP0276', 'PIÑON DISTRIBUCION', '92.88', 'repuesto'),
(282, 'REP0277', 'PIÑON EJE DE ENTRADA ', '49.54', 'repuesto'),
(283, 'REP0278', 'PIÑON TRANS/DIM', '18.58', 'repuesto'),
(284, 'REP0279', 'PISTON DE MOTOR STD', '300.32', 'repuesto'),
(285, 'REP0280', 'PISTON MORDAZA DIM 4X4', '74.31', 'repuesto'),
(286, 'REP0281', 'PLACA DE DIODO DE ALTERNADOR', '18.58', 'repuesto'),
(287, 'REP0282', 'PLACA LED PARA BALIZAS', '30.96', 'repuesto'),
(288, 'REP0283', 'PLANETARIO DIFERENCIAL', '92.88', 'repuesto'),
(289, 'REP0284', 'POLEA CIGÜEÑAL', '52.63', 'repuesto'),
(290, 'REP0285', 'POLEA DE ALTERNADOR', '27.86', 'repuesto'),
(291, 'REP0286', 'PORTA CARBON *T*', '27.86', 'repuesto'),
(292, 'REP0287', 'PORTA FUSIBLE ', '52.63', 'repuesto'),
(293, 'REP0288', 'PORTALLANTA EMERG.DIM', '24.77', 'repuesto'),
(294, 'REP0289', 'PRESILLA CABLE', '6.19', 'repuesto'),
(295, 'REP0290', 'RADIADOR CONJUNTO', '77.40', 'repuesto'),
(296, 'REP0291', 'REFRIGERANTE LIQUIDO', '11.15', 'repuesto'),
(297, 'REP0292', 'REGULADOR VOLTAJE', '46.44', 'repuesto'),
(298, 'REP0293', 'REGULADOR PRESION', '18.58', 'repuesto'),
(299, 'REP0294', 'REJILLA CENTRAL DE VENTILACION TABLERO', '15.48', 'repuesto'),
(300, 'REP0295', 'REJILLA DE VENTILACION LH TABLERO ', '15.48', 'repuesto'),
(301, 'REP0296', 'REJILLA DE VENTILACION RH TABLERO', '15.48', 'repuesto'),
(302, 'REP0297', 'RELE CAJA DE FUSIBLES', '9.29', 'repuesto'),
(303, 'REP0298', 'RELE DE LUCES', '9.29', 'repuesto'),
(304, 'REP0299', 'RELE ENCENDIDO', '9.29', 'repuesto'),
(305, 'REP0300', 'RELE PITO 12V/30A/5P', '9.29', 'repuesto'),
(306, 'REP0301', 'RESERVORIO AUX.RAD/TF/DIM', '18.58', 'repuesto'),
(307, 'REP0302', 'RESISTENCIA A/C DIM/09-', '9.29', 'repuesto'),
(308, 'REP0303', 'RESISTENCIA DE BALIZA', '9.29', 'repuesto'),
(309, 'REP0304', 'RESISTENCIA DE CUADRO DE INSTRUMENTO', '9.29', 'repuesto'),
(310, 'REP0305', 'RESISTENCIA DE SIRENA', '9.29', 'repuesto'),
(311, 'REP0306', 'RESORTE ZAPATA', '6.19', 'repuesto'),
(312, 'REP0307', 'RETEN ALTERNADOR ', '3.10', 'repuesto'),
(313, 'REP0308', 'RETEN BOMBA DIRECCION', '6.19', 'repuesto'),
(314, 'REP0309', 'RETEN BOMBA INYECC', '6.19', 'repuesto'),
(315, 'REP0310', 'RETEN CAJA TRANSFER', '6.19', 'repuesto'),
(316, 'REP0311', 'RETEN DE CORNETA', '6.19', 'repuesto'),
(317, 'REP0312', 'RETEN EJE ENTRADA', '9.29', 'repuesto'),
(318, 'REP0313', 'RETEN SUP DIRECCION', '15.48', 'repuesto'),
(319, 'REP0314', 'RETEN TAPA CAJA CAMBIOS', '3.10', 'repuesto'),
(320, 'REP0315', 'RETENEDOR  DELANTERO CIGÜEÑAL', '27.86', 'repuesto'),
(321, 'REP0316', 'RETENEDOR DE ALTERNADOR', '6.19', 'repuesto'),
(322, 'REP0317', 'RETENEDOR DEL CONO', '6.19', 'repuesto'),
(323, 'REP0318', 'RETENEDOR DEL EJE POSTERIOR', '9.29', 'repuesto'),
(324, 'REP0319', 'RETENEDOR INTERIOR DEL  RUEDA DELANTERA', '9.29', 'repuesto'),
(325, 'REP0320', 'RETENEDOR INTERIOR DEL EJE POSTERIOR', '9.29', 'repuesto'),
(326, 'REP0321', 'RETENEDOR POSTERIOR CAJA DE CAMBIOS', '6.19', 'repuesto'),
(327, 'REP0322', 'RETENEDOR POSTERIOR DEL CIGÜEÑAL', '18.58', 'repuesto'),
(328, 'REP0323', 'RODAM POSTERIOR CIGÜEÑAL', '18.58', 'repuesto'),
(329, 'REP0324', 'RODAMIENTO  INTERIOR DE CONO', '9.29', 'repuesto'),
(330, 'REP0325', 'RODAMIENTO CAJA DE CAMBIOS', '37.15', 'repuesto'),
(331, 'REP0326', 'RODAMIENTO DE CONO Y CORONA', '74.31', 'repuesto'),
(332, 'REP0327', 'RODAMIENTO EXTERIOR DE CONO', '37.15', 'repuesto'),
(333, 'REP0328', 'RODAMIENTO POLEA COMPRESOR', '24.77', 'repuesto'),
(334, 'REP0329', 'RODELA DE ARRAQNUE', '15.48', 'repuesto'),
(335, 'REP0330', 'RODELA GUIA', '15.48', 'repuesto'),
(336, 'REP0331', 'RODELAS BOMBA', '15.48', 'repuesto'),
(337, 'REP0332', 'ROTULA MESA INFERIOR ', '29.72', 'repuesto'),
(338, 'REP0333', 'ROTULA MESA SUPERIOR ', '29.72', 'repuesto'),
(339, 'REP0334', 'RULIMAN CENTRAL DEL CARDAN', '55.73', 'repuesto'),
(340, 'REP0335', 'RULIMAN DE ALTERNADOR DELANTERO', '6.19', 'repuesto'),
(341, 'REP0336', 'RULIMAN DE ALTERNADOR POSTERIOR', '6.19', 'repuesto'),
(342, 'REP0337', 'RULIMAN DEL EJE POSTERIOR', '6.19', 'repuesto'),
(343, 'REP0338', 'RULIMAN EXTERIOR DE RUEDA DELANTERA', '17.34', 'repuesto'),
(344, 'REP0339', 'RULIMAN INTERIOR DE RUEDA DELANTERA', '17.34', 'repuesto'),
(345, 'REP0340', 'SATELITE DIFERENCIAL', '55.73', 'repuesto'),
(346, 'REP0341', 'SEGURO DE EJE', '6.19', 'repuesto'),
(347, 'REP0342', 'SELLADOR  SIKAFLEX', '6.19', 'repuesto'),
(348, 'REP0343', 'SELLO PERNO CUB.T/V DIM', '1.86', 'repuesto'),
(349, 'REP0344', 'SENSOR ACUMULADOR DE GASES (EGR)', '114.55', 'repuesto'),
(350, 'REP0345', 'SENSOR TPS ACELERACION', '99.07', 'repuesto'),
(351, 'REP0346', 'SENSOR DE ANGULO', '99.07', 'repuesto'),
(352, 'REP0347', 'SENSOR DE OXIGENO', '114.55', 'repuesto'),
(353, 'REP0348', 'SENSOR FILTRO SED/DIM', '52.63', 'repuesto'),
(354, 'REP0349', 'SENSOR MAF', '148.61', 'repuesto'),
(355, 'REP0350', 'SENSOR POSICION CIGÜEÑAL 3.0', '77.40', 'repuesto'),
(356, 'REP0351', 'SENSOR PRESION DEL TURBO', '173.38', 'repuesto'),
(357, 'REP0352', 'SENSOR TERMICO ', '148.61', 'repuesto'),
(358, 'REP0353', 'SENSOR VELOCIMETRO', '92.88', 'repuesto'),
(359, 'REP0354', 'SEÑALETICA VEHICULO POLICIAL', '43.34', 'repuesto'),
(360, 'REP0355', 'SERVOFRENO ', '154.80', 'repuesto'),
(361, 'REP0356', 'SHELACK', '6.19', 'repuesto'),
(362, 'REP0357', 'SILICON GRIS', '6.19', 'repuesto'),
(363, 'REP0358', 'SINCRONIZADO DE CAJA', '92.88', 'repuesto'),
(364, 'REP0359', 'SINCRONIZADOR DE CAJA DE CAMBIOS', '111.46', 'repuesto'),
(365, 'REP0360', 'SIRENA ALARMA CHEVY', '167.19', 'repuesto'),
(366, 'REP0361', 'SOCKET 2P', '4.95', 'repuesto'),
(367, 'REP0362', 'SOCKET B/HALOG/2P', '4.95', 'repuesto'),
(368, 'REP0363', 'SOCKET B/HALOG/3P/J4', '4.95', 'repuesto'),
(369, 'REP0364', 'SOCKET BOMBILLO H7 JB', '4.95', 'repuesto'),
(370, 'REP0365', 'SOCKET BOMBILLO H7/DIM', '5.57', 'repuesto'),
(371, 'REP0366', 'SOCKET DE FARO ', '5.57', 'repuesto'),
(372, 'REP0367', 'SOPORTE DE AMORTIGUADOR DEL', '27.86', 'repuesto'),
(373, 'REP0368', 'SOPORTE DE VIDRIO', '18.58', 'repuesto'),
(374, 'REP0369', 'SOPORTE ESC/DIM', '18.58', 'repuesto'),
(375, 'REP0370', 'SOPORTE PARA ANULAR 4X4', '18.58', 'repuesto'),
(376, 'REP0371', 'SPRAY  LIMPIACARBURADOR', '6.19', 'repuesto'),
(377, 'REP0372', 'SPRAY LIMPIADOR DE CONTACTOS', '6.19', 'repuesto'),
(378, 'REP0373', 'SPRAY LIMPIADOR DE FRENOS', '6.19', 'repuesto'),
(379, 'REP0374', 'SPRAY PENETRANTE', '6.19', 'repuesto'),
(380, 'REP0375', 'SPRAY SILICON LUBRICANTE', '6.19', 'repuesto'),
(381, 'REP0376', 'SWICHT DE BALIZA', '6.19', 'repuesto'),
(382, 'REP0377', 'SWICHT DE SIRENA', '6.19', 'repuesto'),
(383, 'REP0378', 'SWITCH VARIOS', '9.29', 'repuesto'),
(384, 'REP0379', 'TAMBOR DE FRENO', '43.34', 'repuesto'),
(385, 'REP0380', 'TAPA DE COMBUSTIBLE', '37.15', 'repuesto'),
(386, 'REP0381', 'TAPA PORTACARBONES', '12.38', 'repuesto'),
(387, 'REP0382', 'TAPA RADIADIADOR', '13.62', 'repuesto'),
(388, 'REP0383', 'TAPON DE CARTER', '3.10', 'repuesto'),
(389, 'REP0384', 'TARJETA DE BOMBA DE INYECCION', '173.38', 'repuesto'),
(390, 'REP0385', 'TEFLON', '1.86', 'repuesto'),
(391, 'REP0386', 'TEMPLADOR CADENA DEL  DISTRIBUCION', '43.34', 'repuesto'),
(392, 'REP0387', 'TERMINAL BATERIA GRANDE', '6.19', 'repuesto'),
(393, 'REP0388', 'TERMINAL BATERIA PEQUEÑO', '6.19', 'repuesto'),
(394, 'REP0389', 'TERMINAL DE BARRA ESTABILIZADORA', '15.48', 'repuesto'),
(395, 'REP0390', 'TERMINAL EXTERIOR DE DIRECCIÓN ', '15.48', 'repuesto'),
(396, 'REP0391', 'TERMINAL OJO AMAR/M6', '9.29', 'repuesto'),
(397, 'REP0392', 'TERMINAL OJOAZUL /M6', '9.29', 'repuesto'),
(398, 'REP0393', 'TERMOSTATO', '26.01', 'repuesto'),
(399, 'REP0394', 'TOPE CAPOT DIM', '6.19', 'repuesto'),
(400, 'REP0395', 'TOPE HIDRAULICO DEL PISO', '6.19', 'repuesto'),
(401, 'REP0396', 'TORNILLO COMPUERTA DE BALDE', '1.86', 'repuesto'),
(402, 'REP0397', 'TORNILLO PIN MORDAZA', '1.86', 'repuesto'),
(403, 'REP0398', 'TRANSFORMADOR DE SIRENA', '30.96', 'repuesto'),
(404, 'REP0399', 'TRANSISTOR DE BALIZAS', '30.96', 'repuesto'),
(405, 'REP0400', 'TRANSITOR DE MEGAFONO', '30.96', 'repuesto'),
(406, 'REP0401', 'TRANSITORES DE SIRENA', '30.96', 'repuesto'),
(407, 'REP0402', 'TROMPO A/C D-MAX', '24.77', 'repuesto'),
(408, 'REP0403', 'TROMPO DE LA DOBLE TRANSMISION', '18.58', 'repuesto'),
(409, 'REP0404', 'TROMPO NEUTRO ', '18.58', 'repuesto'),
(410, 'REP0405', 'TROMPO PRESION AC DIM', '18.58', 'repuesto'),
(411, 'REP0406', 'TROMPO REVERSA', '18.58', 'repuesto'),
(412, 'REP0407', 'TUBO RETORNO ACEITE DIM', '6.19', 'repuesto'),
(413, 'REP0408', 'TUERCA DE RUEDA', '0.62', 'repuesto'),
(414, 'REP0409', 'TUERCA EJE CONO', '0.62', 'repuesto'),
(415, 'REP0410', 'TUERCA M12X1.5', '0.62', 'repuesto'),
(416, 'REP0411', 'TUERCA M6', '0.62', 'repuesto'),
(417, 'REP0412', 'TURBO COMPRESOR', '588.25', 'repuesto'),
(418, 'REP0413', 'U DE RADIADOR', '6.19', 'repuesto'),
(419, 'REP0414', 'VALVULA DE AVANCE', '74.31', 'repuesto'),
(420, 'REP0415', 'VALVULA DE RETORNO', '74.31', 'repuesto'),
(421, 'REP0416', 'VALVULA DE VACIO', '74.31', 'repuesto'),
(422, 'REP0417', 'VALVULA EGR', '86.69', 'repuesto'),
(423, 'REP0418', 'VALVULA EVAPORADOR ', '68.11', 'repuesto'),
(424, 'REP0419', 'VALVULA EXPANSION A/C', '61.92', 'repuesto'),
(425, 'REP0420', 'VALVULA REGULADORA', '61.92', 'repuesto'),
(426, 'REP0421', 'VALVULA TRATAMIENTO DE OLORES A/C', '30.96', 'repuesto'),
(427, 'REP0422', 'VALVULA VENT T/V', '30.96', 'repuesto'),
(428, 'REP0423', 'VALVULAS DE ADMISION', '9.29', 'repuesto'),
(429, 'REP0424', 'VALVULAS DE ESCAPE', '9.29', 'repuesto'),
(430, 'REP0425', 'VENTILADOR DE RADIADOR', '30.96', 'repuesto'),
(431, 'REP0426', 'VENTILADOR EVAPORADOR CALEFACCION A/C', '30.96', 'repuesto'),
(432, 'REP0427', 'VINCHA GUARDAPOLVO', '6.19', 'repuesto'),
(433, 'REP0428', 'VINCHA MOLDURA DE ARCO RUEDA', '3.10', 'repuesto'),
(434, 'REP0429', 'VINCHA REGULACION ZAPATA', '6.19', 'repuesto'),
(435, 'REP0430', 'VINCHA TAPIZADO', '6.19', 'repuesto');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `clave` varchar(255) NOT NULL,
  `rol` enum('admin','tecnico') NOT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `usuario`, `clave`, `rol`, `estado`) VALUES
(1, 'Nadmin', 'Aadmin', 'admin', '$2y$10$BClzd9tlAFT0C1UsMon5yuaCfALZHlAdZz8KI3KkMPnlSPjbEkiNK', 'admin', 'activo'),
(2, 'Tecnico', 'Atecnico', 'tec1', '$2y$10$P5ZbiFVzDy.khcWKmh463eaBUoKw74SaGr2KHuZAHi2DeexThspBi', 'tecnico', 'activo'),
(3, 'Tecnico2', 'Atec2', 'tec2', '$2y$10$dlz.4k5mS16JinZZ1tUJeuoLlE4q4CJshgIuLQzGLoC9okojVIJLu', 'tecnico', 'activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculos`
--

CREATE TABLE `vehiculos` (
  `id` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `placa` varchar(20) NOT NULL,
  `kilometraje` varchar(20) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `vehiculos`
--

INSERT INTO `vehiculos` (`id`, `id_cliente`, `marca`, `placa`, `kilometraje`) VALUES
(1, 1, 'Chevrolet', 'PLJ-4444', '10.000'),
(2, 1, 'Nissan', 'IBE-6649', '20000');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identificacion` (`identificacion`);

--
-- Indices de la tabla `detalle_facturas`
--
ALTER TABLE `detalle_facturas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_factura` (`id_factura`);

--
-- Indices de la tabla `detalle_ordenes`
--
ALTER TABLE `detalle_ordenes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_orden` (`id_orden`),
  ADD KEY `id_servicio` (`id_servicio`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_factura` (`numero_factura`),
  ADD KEY `id_orden` (`id_orden`);

--
-- Indices de la tabla `ordenes_servicio`
--
ALTER TABLE `ordenes_servicio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_orden` (`numero_orden`),
  ADD KEY `id_vehiculo` (`id_vehiculo`),
  ADD KEY `id_tecnico` (`id_tecnico`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- Indices de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `placa` (`placa`),
  ADD KEY `id_cliente` (`id_cliente`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `detalle_facturas`
--
ALTER TABLE `detalle_facturas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_ordenes`
--
ALTER TABLE `detalle_ordenes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ordenes_servicio`
--
ALTER TABLE `ordenes_servicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=436;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_facturas`
--
ALTER TABLE `detalle_facturas`
  ADD CONSTRAINT `detalle_facturas_ibfk_1` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `detalle_ordenes`
--
ALTER TABLE `detalle_ordenes`
  ADD CONSTRAINT `detalle_ordenes_ibfk_1` FOREIGN KEY (`id_orden`) REFERENCES `ordenes_servicio` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_ordenes_ibfk_2` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`id_orden`) REFERENCES `ordenes_servicio` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `ordenes_servicio`
--
ALTER TABLE `ordenes_servicio`
  ADD CONSTRAINT `ordenes_servicio_ibfk_1` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ordenes_servicio_ibfk_2` FOREIGN KEY (`id_tecnico`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  ADD CONSTRAINT `vehiculos_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNEC