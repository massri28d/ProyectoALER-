-- ============================================
-- MODELO DE ALERGIAS - COMPATIBLE MYSQL
-- ============================================

DROP DATABASE IF EXISTS alergias_app;
CREATE DATABASE alergias_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alergias_app;

-- 1) usuario
CREATE TABLE usuario (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  correo           VARCHAR(150) NOT NULL UNIQUE,
  nombre           VARCHAR(150) NOT NULL,
  fecha_nacimiento DATE,
  telefono         VARCHAR(30),
  genero           ENUM('Masculino','Femenino','Otro','Prefiero no decir')
);

-- 2) alergia
CREATE TABLE alergia (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL UNIQUE,
  descripcion TEXT
);

-- 3) ingrediente
CREATE TABLE ingrediente (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL UNIQUE,
  alergia_id  INT,
  origen      ENUM('Animal','Vegetal','Otro') NOT NULL,
  descripcion TEXT,
  CONSTRAINT fk_ingrediente_alergia FOREIGN KEY (alergia_id)
    REFERENCES alergia(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- 4) perfil_usuario (usuario ↔ alergia)
CREATE TABLE perfil_usuario (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  alergia_id  INT NOT NULL,
  nota        TEXT,
  UNIQUE (usuario_id, alergia_id),
  CONSTRAINT fk_perfil_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_perfil_alergia FOREIGN KEY (alergia_id)
    REFERENCES alergia(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- 5) sinonimo (variantes OCR → ingrediente)
CREATE TABLE sinonimo (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  texto          VARCHAR(150) NOT NULL UNIQUE,
  texto_limpio   VARCHAR(150) NOT NULL,
  ingrediente_id INT NOT NULL,
  CONSTRAINT fk_sinonimo_ingrediente FOREIGN KEY (ingrediente_id)
    REFERENCES ingrediente(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- ===========================
-- Vista (opcional en MySQL)
-- ===========================
CREATE OR REPLACE VIEW v_perfil_usuario AS
SELECT u.nombre AS nombre, u.correo AS correo, a.nombre AS alergia
FROM perfil_usuario pu
JOIN usuario u ON u.id = pu.usuario_id
JOIN alergia a ON a.id = pu.alergia_id;
