USE `intesa_rsa_new`;

-- =========================================================
-- PATCH ORDINATA DA ESEGUIRE DOPO IL DUMP Dump20251105.sql
-- =========================================================
-- Questo script porta il database del dump alla struttura finale.
-- È pensato per essere eseguito UNA SOLA VOLTA subito dopo il dump.

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- 1) RIMOZIONE FK CHE BLOCCANO LE MODIFICHE STRUTTURALI
-- ---------------------------------------------------------
ALTER TABLE `choice`
  DROP FOREIGN KEY `fk_choice_dish`;

ALTER TABLE `survey`
  DROP FOREIGN KEY `fk_survey_dish`;

ALTER TABLE `dish_pairing`
  DROP FOREIGN KEY `fk_dishpairing_food`,
  DROP FOREIGN KEY `fk_dishpairing_season`;

-- ---------------------------------------------------------
-- 2) MODIFICHE ALLE TABELLE ESISTENTI DEL DUMP
-- ---------------------------------------------------------
ALTER TABLE `food`
  MODIFY `id_food` INT UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `season`
  MODIFY `season_type` VARCHAR(100) NOT NULL;

ALTER TABLE `dish_pairing`
  MODIFY `id_dish_pairing` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  MODIFY `season_type` VARCHAR(100) NOT NULL;

-- ---------------------------------------------------------
-- 3) RIPRISTINO / AGGIORNAMENTO DELLE FK SULLE TABELLE LIVE
-- ---------------------------------------------------------
ALTER TABLE `dish_pairing`
  ADD CONSTRAINT `fk_dishpairing_food`
    FOREIGN KEY (`id_food`)
    REFERENCES `food`(`id_food`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dishpairing_season`
    FOREIGN KEY (`season_type`)
    REFERENCES `season`(`season_type`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT;

ALTER TABLE `choice`
  ADD CONSTRAINT `fk_choice_dish`
    FOREIGN KEY (`id_dish_pairing`)
    REFERENCES `dish_pairing`(`id_dish_pairing`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE `survey`
  ADD CONSTRAINT `fk_survey_dish`
    FOREIGN KEY (`id_dish_pairing`)
    REFERENCES `dish_pairing`(`id_dish_pairing`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ---------------------------------------------------------
-- 4) NUOVE TABELLE AGGIUNTE AL PROGETTO
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_availability` (
  `id_avail` INT NOT NULL AUTO_INCREMENT,
  `id_food` INT UNSIGNED NOT NULL,
  `valid_from` DATETIME NOT NULL,
  `valid_to` DATETIME NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `restored_at` DATETIME NULL,
  PRIMARY KEY (`id_avail`),
  KEY `fk_food_availability_food` (`id_food`),
  CONSTRAINT `fk_food_availability_food`
    FOREIGN KEY (`id_food`) REFERENCES `food` (`id_food`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `food_availability_pairing_replacements` (
  `id_food_avail_pairing_replacement` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_avail` INT NOT NULL,
  `original_id_dish_pairing` INT UNSIGNED NOT NULL,
  `replacement_id_dish_pairing` INT UNSIGNED NOT NULL,
  `original_id_food` INT UNSIGNED NOT NULL,
  `replacement_id_food` INT UNSIGNED NOT NULL,
  `season_type` VARCHAR(100) NOT NULL,
  `id_meal` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disabled_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id_food_avail_pairing_replacement`),
  UNIQUE KEY `uq_food_avail_pair_replacement_pairing` (`replacement_id_dish_pairing`),
  UNIQUE KEY `uq_food_avail_pair_original_scope` (`id_avail`,`original_id_dish_pairing`),
  KEY `idx_food_avail_pair_id_avail` (`id_avail`),
  KEY `idx_food_avail_pair_original_pairing` (`original_id_dish_pairing`),
  KEY `idx_food_avail_pair_replacement_food` (`replacement_id_food`),
  KEY `idx_food_avail_pair_scope` (`season_type`,`id_meal`),
  CONSTRAINT `fk_food_avail_pair_id_avail`
    FOREIGN KEY (`id_avail`) REFERENCES `food_availability` (`id_avail`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `backoffice_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `role` ENUM('super_user','operator') NOT NULL DEFAULT 'operator',
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `surname` VARCHAR(100) NOT NULL,
  `status` ENUM('active','must_change_password','suspended') NOT NULL DEFAULT 'must_change_password',
  `password_hash` VARCHAR(255) NOT NULL,
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE backoffice_users
MODIFY COLUMN status ENUM(
    'active',
    'must_change_password',
    'suspended',
    'password_reset_requested'
) NOT NULL DEFAULT 'must_change_password';

LOCK TABLES `backoffice_users` WRITE;
/*!40000 ALTER TABLE `backoffice_users` DISABLE KEYS */;
INSERT INTO `backoffice_users` VALUES (1,"super_user", "admin@gmail.com", "Signor", "Admin", "must_change_password", "$2b$10$pehJpjtdkryJpT.DejQKm.bbSKKd/UJMbnJpZ.PmyTLRFFZgpcOMa", NULL, NOW(), NULL);
/*!40000 ALTER TABLE `backoffice_users` ENABLE KEYS */;
UNLOCK TABLES;

CREATE TABLE IF NOT EXISTS `arch_menu` (
  `id_arch_menu` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_type` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `day_index` INT NOT NULL,
  `archived_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_arch_menu`),
  UNIQUE KEY `uq_arch_menu_once` (`season_type`,`start_date`,`end_date`),
  KEY `idx_arch_menu_name` (`season_type`),
  KEY `idx_arch_menu_dates` (`start_date`,`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `arch_food_snapshot` (
  `id_arch_food` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_food` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `type` ENUM('primo','secondo','contorno','ultimo','coperto','speciale') NOT NULL,
  `grammage_tot` FLOAT NOT NULL,
  `kcal_tot` FLOAT NOT NULL,
  `proteins` FLOAT NOT NULL,
  `carbs` FLOAT NOT NULL,
  `fats` FLOAT NOT NULL,
  `allergy_notes` VARCHAR(255) DEFAULT NULL,
  `category` ENUM(
    'pasta','riso','polenta','semolino','pesce','tonno','carne','latticini',
    'formaggi','insaccati','uova','pizza','pane','patate','ortaggi','verdure',
    'legumi','frutta','composta','altro'
  ) DEFAULT NULL,
  `snapshot_hash` BINARY(16) NOT NULL,
  PRIMARY KEY (`id_arch_food`),
  UNIQUE KEY `uq_arch_food_hash` (`snapshot_hash`),
  KEY `idx_arch_food_idfood` (`id_food`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `arch_meal_snapshot` (
  `id_arch_menu` BIGINT UNSIGNED NOT NULL,
  `id_meal` INT UNSIGNED NOT NULL,
  `day_index` INT UNSIGNED NOT NULL,
  `type` ENUM('pranzo','cena') NOT NULL,
  `first_choice` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_arch_menu`,`id_meal`),
  KEY `idx_arch_meal_id` (`id_meal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `arch_dish_pairing` (
  `id_arch_menu` BIGINT UNSIGNED NOT NULL,
  `id_dish_pairing` INT UNSIGNED NOT NULL,
  `id_meal` INT UNSIGNED NOT NULL,
  `id_food` INT UNSIGNED NOT NULL,
  `id_arch_food` BIGINT UNSIGNED DEFAULT NULL,
  `season_type` VARCHAR(100) NOT NULL,
  `used` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_arch_menu`,`id_dish_pairing`),
  KEY `idx_arch_dp_meal` (`id_meal`),
  KEY `idx_arch_dp_food` (`id_food`),
  KEY `idx_arch_dp_season` (`season_type`),
  KEY `idx_arch_dp_arch_food` (`id_arch_food`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `arch_survey` (
  `id_arch_menu` BIGINT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `id_patient` INT UNSIGNED NOT NULL,
  `id_dish_pairing` INT UNSIGNED NOT NULL,
  `portion` FLOAT NOT NULL,
  `id_caregiver` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_arch_menu`,`date`,`id_patient`,`id_dish_pairing`),
  KEY `idx_arch_survey_date` (`date`),
  KEY `idx_arch_survey_patient` (`id_patient`),
  KEY `idx_arch_survey_dish` (`id_dish_pairing`),
  KEY `idx_arch_survey_caregiver` (`id_caregiver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `arch_choice` (
  `id_arch_menu` BIGINT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `id_patient` INT UNSIGNED NOT NULL,
  `id_dish_pairing` INT UNSIGNED NOT NULL,
  `id_caregiver` INT UNSIGNED NOT NULL,
  `chooser` ENUM('guest','family','caregiver') NOT NULL,
  `baby_food` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_arch_menu`,`date`,`id_patient`,`id_dish_pairing`),
  KEY `idx_arch_choice_date` (`date`),
  KEY `idx_arch_choice_patient` (`id_patient`),
  KEY `idx_arch_choice_dish` (`id_dish_pairing`),
  KEY `idx_arch_choice_caregiver` (`id_caregiver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `arch_survey_extra` (
  `id_arch_menu` BIGINT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `id_patient` INT UNSIGNED NOT NULL,
  `id_meal` INT UNSIGNED NOT NULL,
  `comments` VARCHAR(500) NOT NULL,
  `id_caregiver` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_arch_menu`,`date`,`id_patient`,`id_meal`),
  KEY `idx_arch_extra_date` (`date`),
  KEY `idx_arch_extra_patient` (`id_patient`),
  KEY `idx_arch_extra_meal` (`id_meal`),
  KEY `idx_arch_extra_caregiver` (`id_caregiver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------
-- 5) PROCEDURA DI ARCHIVIAZIONE MENU
-- ---------------------------------------------------------
DELIMITER $$
DROP PROCEDURE IF EXISTS `archive_season_dedup` $$

CREATE PROCEDURE `archive_season_dedup`(IN p_season_type VARCHAR(100))
BEGIN
  DECLARE v_prev_safe INT DEFAULT 0;
  DECLARE v_start DATE;
  DECLARE v_end DATE;
  DECLARE v_day_index INT;
  DECLARE v_arch_menu BIGINT UNSIGNED;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    DROP TEMPORARY TABLE IF EXISTS tmp_food_map;
    SET SQL_SAFE_UPDATES = v_prev_safe;
    RESIGNAL;
  END;

  SET v_prev_safe = @@SQL_SAFE_UPDATES;
  SET SQL_SAFE_UPDATES = 0;

  SELECT start_date, end_date, day_index
    INTO v_start, v_end, v_day_index
  FROM season
  WHERE season_type = p_season_type
  LIMIT 1;

  IF v_start IS NULL OR v_end IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'season_type non trovato in season';
  END IF;

  IF NOT (v_start < CURDATE() AND v_end < CURDATE()) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Puoi archiviare solo menu già conclusi';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM arch_menu
    WHERE season_type = p_season_type
      AND start_date = v_start
      AND end_date = v_end
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Menu già presente in arch_menu';
  END IF;

  START TRANSACTION;

    INSERT INTO arch_menu (season_type, start_date, end_date, day_index)
    VALUES (p_season_type, v_start, v_end, v_day_index);

    SET v_arch_menu = LAST_INSERT_ID();

    CREATE TEMPORARY TABLE tmp_food_map (
      id_food INT UNSIGNED NOT NULL,
      snapshot_hash BINARY(16) NOT NULL,
      id_arch_food BIGINT UNSIGNED NULL,
      PRIMARY KEY (id_food),
      KEY idx_tmp_hash (snapshot_hash)
    ) ENGINE=Memory;

    INSERT INTO tmp_food_map (id_food, snapshot_hash)
    SELECT DISTINCT
      f.id_food,
      UNHEX(MD5(CONCAT_WS('|',
        COALESCE(f.name, ''),
        COALESCE(f.image_url, ''),
        COALESCE(f.type, ''),
        CAST(ROUND(f.grammage_tot, 6) AS CHAR),
        CAST(ROUND(f.kcal_tot, 6) AS CHAR),
        CAST(ROUND(f.proteins, 6) AS CHAR),
        CAST(ROUND(f.carbs, 6) AS CHAR),
        CAST(ROUND(f.fats, 6) AS CHAR),
        COALESCE(f.allergy_notes, ''),
        COALESCE(f.category, '')
      )))
    FROM dish_pairing dp
    JOIN food f ON f.id_food = dp.id_food
    WHERE dp.season_type = p_season_type;

    INSERT IGNORE INTO arch_food_snapshot (
      id_food, name, image_url, type,
      grammage_tot, kcal_tot, proteins, carbs, fats,
      allergy_notes, category, snapshot_hash
    )
    SELECT
      f.id_food, f.name, f.image_url, f.type,
      f.grammage_tot, f.kcal_tot, f.proteins, f.carbs, f.fats,
      f.allergy_notes, f.category, t.snapshot_hash
    FROM tmp_food_map t
    JOIN food f ON f.id_food = t.id_food;

    UPDATE tmp_food_map t
    JOIN arch_food_snapshot afs
      ON afs.snapshot_hash = t.snapshot_hash
    SET t.id_arch_food = afs.id_arch_food;

    INSERT INTO arch_meal_snapshot (id_arch_menu, id_meal, day_index, type, first_choice)
    SELECT DISTINCT
      v_arch_menu, m.id_meal, m.day_index, m.type, m.first_choice
    FROM dish_pairing dp
    JOIN meal m ON m.id_meal = dp.id_meal
    WHERE dp.season_type = p_season_type;

    INSERT INTO arch_dish_pairing (
      id_arch_menu, id_dish_pairing, id_meal, id_food, id_arch_food, season_type, used
    )
    SELECT
      v_arch_menu,
      dp.id_dish_pairing,
      dp.id_meal,
      dp.id_food,
      t.id_arch_food,
      dp.season_type,
      dp.used
    FROM dish_pairing dp
    JOIN tmp_food_map t ON t.id_food = dp.id_food
    WHERE dp.season_type = p_season_type;

    INSERT INTO arch_survey (
      id_arch_menu, date, id_patient, id_dish_pairing, portion, id_caregiver
    )
    SELECT
      v_arch_menu, s.date, s.id_patient, s.id_dish_pairing, s.portion, s.id_caregiver
    FROM survey s
    JOIN dish_pairing dp ON dp.id_dish_pairing = s.id_dish_pairing
    WHERE dp.season_type = p_season_type;

    INSERT INTO arch_choice (
      id_arch_menu, date, id_patient, id_dish_pairing, id_caregiver, chooser, baby_food
    )
    SELECT
      v_arch_menu, c.date, c.id_patient, c.id_dish_pairing, c.id_caregiver, c.chooser, c.baby_food
    FROM choice c
    JOIN dish_pairing dp ON dp.id_dish_pairing = c.id_dish_pairing
    WHERE dp.season_type = p_season_type;

    INSERT INTO arch_survey_extra (
      id_arch_menu, date, id_patient, id_meal, comments, id_caregiver
    )
    SELECT
      v_arch_menu, se.date, se.id_patient, se.id_meal, se.comments, se.id_caregiver
    FROM survey_extra se
    WHERE se.date >= v_start
      AND se.date <= v_end;

    DELETE FROM survey_extra
    WHERE date >= v_start
      AND date <= v_end;

    DELETE FROM dish_pairing
    WHERE season_type = p_season_type;

    DELETE FROM season
    WHERE season_type = p_season_type;

    DROP TEMPORARY TABLE IF EXISTS tmp_food_map;

  COMMIT;

  SET SQL_SAFE_UPDATES = v_prev_safe;
END $$
DELIMITER ;


-- ---------------------------------------------------------
-- 6) PROCEDURA DI SOSPENSIONE DI UN PIATTO
-- ---------------------------------------------------------
DELIMITER $$
DROP PROCEDURE IF EXISTS process_expired_dish_suspensions $$

CREATE PROCEDURE process_expired_dish_suspensions()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_id_avail INT;
    DECLARE v_id_food INT;
    DECLARE v_valid_from DATETIME;
    DECLARE v_valid_to DATETIME;

    DECLARE cur CURSOR FOR
        SELECT
            fa.id_avail,
            fa.id_food,
            fa.valid_from,
            fa.valid_to
        FROM food_availability fa
        WHERE fa.valid_to < NOW()
          AND fa.restored_at IS NULL
        ORDER BY fa.valid_to ASC, fa.id_avail ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    START TRANSACTION;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_id_avail, v_id_food, v_valid_from, v_valid_to;

        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        UPDATE dish_pairing dp
        JOIN season s
            ON s.season_type = dp.season_type
        SET dp.used = 1
        WHERE dp.id_food = v_id_food
          AND dp.used = 0
          AND s.start_date <= v_valid_to
          AND s.end_date >= v_valid_from;

        UPDATE dish_pairing repl
        JOIN food_availability_pairing_replacements trap
            ON trap.replacement_id_dish_pairing = repl.id_dish_pairing
           AND trap.id_avail = v_id_avail
        SET
            repl.used = 0,
            trap.disabled_at = COALESCE(trap.disabled_at, NOW())
        WHERE repl.used = 1;

        UPDATE food_availability_pairing_replacements
        SET disabled_at = COALESCE(disabled_at, NOW())
        WHERE id_avail = v_id_avail;

        UPDATE food_availability
        SET restored_at = NOW()
        WHERE id_avail = v_id_avail;
    END LOOP;

    CLOSE cur;
    COMMIT;
END$$
DELIMITER ;
