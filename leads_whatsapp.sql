-- ============================================================
--  MIGRATION COMPLÈTE — Projet Leads WhatsApp IA
--  Ordre : admins → societes → produits + prospects
--          → conversations → messages + interactions
--  Exécution : mysql -u root -p leads_whatsapp < migration.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS leads_whatsapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE leads_whatsapp;

-- ────────────────────────────────────────────────────────────
-- 1. ADMINS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom         VARCHAR(100)    NOT NULL,
  prenom      VARCHAR(100)    NOT NULL,
  numTel      VARCHAR(20)     NOT NULL,
  codePostal  VARCHAR(10)     NOT NULL,
  email       VARCHAR(150)    NOT NULL UNIQUE,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 2. SOCIETES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS societes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom         VARCHAR(150)    NOT NULL,
  adresse     VARCHAR(255)    NOT NULL,
  domaine     VARCHAR(100)    NOT NULL,
  admin_id    BIGINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_societes_admin
    FOREIGN KEY (admin_id) REFERENCES admins (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 3. PRODUITS  (dépend de societes)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produits (
  id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nom         VARCHAR(150)     NOT NULL,
  quantite    INT UNSIGNED     NOT NULL DEFAULT 0,
  prix        DECIMAL(10, 2)   NOT NULL DEFAULT 0.00,
  fichierPDF  VARCHAR(255)         NULL,
  societe_id  BIGINT UNSIGNED  NOT NULL,
  created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_produits_societe
    FOREIGN KEY (societe_id) REFERENCES societes (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 4. PROSPECTS  (dépend de societes)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospects (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nomComplet    VARCHAR(200)    NOT NULL,
  numTelephone  VARCHAR(20)     NOT NULL UNIQUE,
  Email         VARCHAR(150)        NULL,
  statut        TINYINT(1)      NOT NULL DEFAULT 0
                  COMMENT '0 = non qualifié, 1 = qualifié',
  societe_id    BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_prospects_telephone (numTelephone),
  INDEX idx_prospects_statut    (statut),
  CONSTRAINT fk_prospects_societe
    FOREIGN KEY (societe_id) REFERENCES societes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 5. CONVERSATIONS  (dépend de prospects)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dateDebut    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut       VARCHAR(20)     NOT NULL DEFAULT 'EN_COURS'
                 COMMENT 'EN_COURS | FERMEE | CHAUDE',
  prospect_id  BIGINT UNSIGNED NOT NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_conversations_prospect (prospect_id),
  INDEX idx_conversations_statut   (statut),
  CONSTRAINT fk_conversations_prospect
    FOREIGN KEY (prospect_id) REFERENCES prospects (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 6. MESSAGES  (dépend de conversations)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  idMessage        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contenu          TEXT            NOT NULL,
  conversation_id  BIGINT UNSIGNED NOT NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idMessage),
  INDEX idx_messages_conversation (conversation_id),
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 7. INTERACTIONS  (dépend de conversations)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interactions (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  score            DOUBLE          NOT NULL DEFAULT 0,
  conversation_id  BIGINT UNSIGNED NOT NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_interactions_conversation (conversation_id),
  CONSTRAINT fk_interactions_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  DONNÉES DE TEST (optionnel — commenter en production)
-- ============================================================

INSERT INTO admins (nom, prenom, numTel, codePostal, email) VALUES
  ('Martin', 'Sophie', '+33600000001', '75001', 'admin@societe.com');

INSERT INTO societes (nom, adresse, domaine, admin_id) VALUES
  ('Ma Société', '12 rue de la Paix, Paris', 'Marketing Digital', 1);

INSERT INTO produits (nom, quantite, prix, fichierPDF, societe_id) VALUES
  ('Formation WhatsApp Ads',  50, 297.00, 'formation_wa.pdf', 1),
  ('Coaching Lead Generation', 10, 997.00, NULL,               1);

INSERT INTO prospects (nomComplet, numTelephone, Email, statut, societe_id) VALUES
  ('Ahmed Benali',    '+21655000001', 'ahmed@mail.com',   0, 1),
  ('Sara Trabelsi',   '+21655000002', 'sara@mail.com',    1, 1),
  ('Karim Mansour',   '+21655000003', 'karim@mail.com',   0, 1);

INSERT INTO conversations (dateDebut, statut, prospect_id) VALUES
  (NOW(), 'EN_COURS', 1),
  (NOW(), 'FERMEE',   2),
  (NOW(), 'CHAUDE',   3);

INSERT INTO messages (contenu, conversation_id) VALUES
  ('Bonjour, j\'ai vu votre vidéo sur TikTok', 1),
  ('Je suis intéressé par la formation',        1),
  ('Quel est le prix ?',                        1),
  ('Bonjour, je veux en savoir plus',           2),
  ('Pouvez-vous m\'appeler ?',                  3);

INSERT INTO interactions (score, conversation_id) VALUES
  (35.0, 1),
  (82.5, 2),
  (61.0, 3);

-- ============================================================
--  VÉRIFICATION FINALE
-- ============================================================
SELECT 'admins'       AS table_name, COUNT(*) AS lignes FROM admins
UNION ALL
SELECT 'societes',      COUNT(*) FROM societes
UNION ALL
SELECT 'produits',      COUNT(*) FROM produits
UNION ALL
SELECT 'prospects',     COUNT(*) FROM prospects
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages',      COUNT(*) FROM messages
UNION ALL
SELECT 'interactions',  COUNT(*) FROM interactions;
