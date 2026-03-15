USE `intesa_rsa_new`;

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
