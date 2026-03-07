// backend/controllers/reportsController.js
import { pool } from '../db/db.js';

function parsePositiveInt(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function latestPatientJoin(alias) {
    return `
        JOIN (
            SELECT id_patient, MAX(last_changed) AS last_changed
            FROM patient
            GROUP BY id_patient
        ) lp ON lp.id_patient = ${alias}.id_patient
        JOIN patient p
            ON p.id_patient = lp.id_patient
           AND p.last_changed = lp.last_changed
    `;
}

function mapPatients(rows) {
    return (rows ?? []).map((p) => ({
        value: String(p.id_patient),
        label: `${p.surname} ${p.name} (Piano ${p.floor}, Stanza ${p.room})`,
    }));
}

function mapFloors(rows) {
    return (rows ?? []).map((r) => ({
        value: String(r.floor),
        label: `Piano ${r.floor}`,
    }));
}

function buildLiveSurveyWhere({
    start,
    end,
    meal,
    patientId,
    floor,
    course,
    seasonType,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND s.date >= ? AND s.date <= ? `;
    params.push(start, end);

    where += ` AND dp.season_type = ? `;
    params.push(seasonType);

    if (meal) {
        where += ` AND m.type = ? `;
        params.push(meal);
    }

    if (patientId) {
        where += ` AND p.id_patient = ? `;
        params.push(Number(patientId));
    }

    if (floor) {
        where += ` AND p.floor = ? `;
        params.push(Number(floor));
    }

    if (course) {
        where += ` AND f.type = ? `;
        params.push(course);
    }

    return { where, params };
}

function buildLiveChoiceWhere({
    start,
    end,
    meal,
    patientId,
    floor,
    course,
    seasonType,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND c.date >= ? AND c.date <= ? `;
    params.push(start, end);

    where += ` AND dp.season_type = ? `;
    params.push(seasonType);

    if (meal) {
        where += ` AND m.type = ? `;
        params.push(meal);
    }

    if (patientId) {
        where += ` AND p.id_patient = ? `;
        params.push(Number(patientId));
    }

    if (floor) {
        where += ` AND p.floor = ? `;
        params.push(Number(floor));
    }

    if (course) {
        where += ` AND f.type = ? `;
        params.push(course);
    }

    return { where, params };
}

function buildArchiveSurveyWhere({
    start,
    end,
    meal,
    patientId,
    floor,
    course,
    idArchMenu,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND s.id_arch_menu = ? `;
    params.push(idArchMenu);

    where += ` AND s.date >= ? AND s.date <= ? `;
    params.push(start, end);

    if (meal) {
        where += ` AND m.type = ? `;
        params.push(meal);
    }

    if (patientId) {
        where += ` AND p.id_patient = ? `;
        params.push(Number(patientId));
    }

    if (floor) {
        where += ` AND p.floor = ? `;
        params.push(Number(floor));
    }

    if (course) {
        where += ` AND f.type = ? `;
        params.push(course);
    }

    return { where, params };
}

function buildArchiveChoiceWhere({
    start,
    end,
    meal,
    patientId,
    floor,
    course,
    idArchMenu,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND c.id_arch_menu = ? `;
    params.push(idArchMenu);

    where += ` AND c.date >= ? AND c.date <= ? `;
    params.push(start, end);

    if (meal) {
        where += ` AND m.type = ? `;
        params.push(meal);
    }

    if (patientId) {
        where += ` AND p.id_patient = ? `;
        params.push(Number(patientId));
    }

    if (floor) {
        where += ` AND p.floor = ? `;
        params.push(Number(floor));
    }

    if (course) {
        where += ` AND f.type = ? `;
        params.push(course);
    }

    return { where, params };
}

function buildLiveCommentsWhere({
    start,
    end,
    meal,
    patientId,
    floor,
    seasonType,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND sx.date >= ? AND sx.date <= ? `;
    params.push(start, end);

    where += ` AND dp.season_type = ? `;
    params.push(seasonType);

    if (meal) {
        where += ` AND m.type = ? `;
        params.push(meal);
    }

    if (patientId) {
        where += ` AND p.id_patient = ? `;
        params.push(Number(patientId));
    }

    if (floor) {
        where += ` AND p.floor = ? `;
        params.push(Number(floor));
    }

    return { where, params };
}

function buildArchiveCommentsWhere({
    start,
    end,
    meal,
    patientId,
    floor,
    idArchMenu,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND sx.id_arch_menu = ? `;
    params.push(idArchMenu);

    where += ` AND sx.date >= ? AND sx.date <= ? `;
    params.push(start, end);

    if (meal) {
        where += ` AND m.type = ? `;
        params.push(meal);
    }

    if (patientId) {
        where += ` AND p.id_patient = ? `;
        params.push(Number(patientId));
    }

    if (floor) {
        where += ` AND p.floor = ? `;
        params.push(Number(floor));
    }

    return { where, params };
}

async function resolveSelectedMenu(menuKind, menuRef) {
    if (menuKind === 'active') {
        const seasonType = String(menuRef || '').trim();
        if (!seasonType) return null;

        const [rows] = await pool.query(
            `
            SELECT
                season_type,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
            FROM season
            WHERE season_type = ?
              AND CURDATE() BETWEEN start_date AND end_date
            LIMIT 1
            `,
            [seasonType],
        );

        if (!rows?.length) return null;

        return {
            kind: 'active',
            ref: rows[0].season_type,
            season_type: rows[0].season_type,
            start_date: rows[0].start_date,
            end_date: rows[0].end_date,
        };
    }

    if (menuKind === 'archive') {
        const idArchMenu = parsePositiveInt(menuRef);
        if (!idArchMenu) return null;

        const [rows] = await pool.query(
            `
            SELECT
                id_arch_menu,
                season_type,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
            FROM arch_menu
            WHERE id_arch_menu = ?
            LIMIT 1
            `,
            [idArchMenu],
        );

        if (!rows?.length) return null;

        return {
            kind: 'archive',
            ref: String(rows[0].id_arch_menu),
            id_arch_menu: Number(rows[0].id_arch_menu),
            season_type: rows[0].season_type,
            start_date: rows[0].start_date,
            end_date: rows[0].end_date,
        };
    }

    return null;
}

export async function getConsumiMenus(req, res) {
    try {
        const [activeRows] = await pool.query(`
            SELECT
                'active' AS kind,
                s.season_type AS ref,
                s.season_type,
                DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
                CONCAT(
                    s.season_type,
                    ' — ',
                    DATE_FORMAT(s.start_date, '%d.%m.%Y'),
                    ' - ',
                    DATE_FORMAT(s.end_date, '%d.%m.%Y'),
                    ' (attivo)'
                ) AS label,
                1 AS is_active
            FROM season s
            WHERE CURDATE() BETWEEN s.start_date AND s.end_date
            ORDER BY s.start_date DESC
            LIMIT 1
        `);

        const [archivedRows] = await pool.query(`
            SELECT
                'archive' AS kind,
                CAST(am.id_arch_menu AS CHAR) AS ref,
                am.season_type,
                DATE_FORMAT(am.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(am.end_date, '%Y-%m-%d') AS end_date,
                CONCAT(
                    am.season_type,
                    ' — ',
                    DATE_FORMAT(am.start_date, '%d.%m.%Y'),
                    ' - ',
                    DATE_FORMAT(am.end_date, '%d.%m.%Y')
                ) AS label,
                0 AS is_active
            FROM arch_menu am
            ORDER BY am.start_date DESC
        `);

        return res.json({
            data: [...(activeRows ?? []), ...(archivedRows ?? [])],
        });
    } catch (err) {
        console.error('Errore getConsumiMenus:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

export async function getConsumiReport(req, res) {
    try {
        const {
            menuKind = '',
            menuRef = '',
            start = '',
            end = '',
            meal = '',
            patientId = '',
            floor = '',
            course = '',
            page = '1',
            pageSize = '10',
        } = req.query;

        if (!menuKind || !menuRef) {
            return res.status(400).json({
                error: 'Parametri obbligatori: menuKind, menuRef',
            });
        }

        if (!start || !end) {
            return res.status(400).json({
                error: 'Parametri obbligatori: start, end (YYYY-MM-DD)',
            });
        }

        if (end < start) {
            return res.status(400).json({
                error: 'La data di fine deve essere >= data inizio',
            });
        }

        const selectedMenu = await resolveSelectedMenu(menuKind, menuRef);
        if (!selectedMenu) {
            return res.status(400).json({
                error: 'Menù selezionato non valido',
            });
        }

        if (start < selectedMenu.start_date || end > selectedMenu.end_date) {
            return res.status(400).json({
                error: 'L’intervallo selezionato deve rientrare nel range del menù scelto',
            });
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const sizeNum = Math.min(
            100,
            Math.max(1, parseInt(pageSize, 10) || 10),
        );
        const offset = (pageNum - 1) * sizeNum;

        const commentsPageNum = Math.max(
            1,
            parseInt(req.query.commentsPage, 10) || 1,
        );
        const commentsSizeNum = Math.min(
            100,
            Math.max(1, parseInt(req.query.commentsPageSize, 10) || 10),
        );
        const commentsOffset = (commentsPageNum - 1) * commentsSizeNum;

        const wasteFactorExpr = `
            CASE
                WHEN s.portion >= 1 THEN 0
                WHEN s.portion < 0 THEN 1
                ELSE (1 - s.portion)
            END
        `;

        let baseFrom = '';
        let baseFromChoice = '';
        let commentsFrom = '';
        let where = '';
        let whereChoice = '';
        let commentsWhere = '';
        let params = [];
        let paramsChoice = [];
        let commentsParams = [];

        if (selectedMenu.kind === 'active') {
            baseFrom = `
                FROM survey s
                JOIN dish_pairing dp ON dp.id_dish_pairing = s.id_dish_pairing
                JOIN meal m ON m.id_meal = dp.id_meal
                JOIN food f ON f.id_food = dp.id_food
                ${latestPatientJoin('s')}
                JOIN caregiver cg ON cg.id_caregiver = s.id_caregiver
            `;

            baseFromChoice = `
                FROM choice c
                JOIN dish_pairing dp ON dp.id_dish_pairing = c.id_dish_pairing
                JOIN meal m ON m.id_meal = dp.id_meal
                JOIN food f ON f.id_food = dp.id_food
                ${latestPatientJoin('c')}
            `;

            commentsFrom = `
                FROM survey_extra sx
                JOIN meal m ON m.id_meal = sx.id_meal
                JOIN dish_pairing dp
                    ON dp.id_meal = sx.id_meal
                   AND dp.season_type = ?
                   AND dp.used = 1
                ${latestPatientJoin('sx')}
                JOIN caregiver cg ON cg.id_caregiver = sx.id_caregiver
            `;

            const surveyWhere = buildLiveSurveyWhere({
                start,
                end,
                meal,
                patientId,
                floor,
                course,
                seasonType: selectedMenu.season_type,
            });

            const choiceWhere = buildLiveChoiceWhere({
                start,
                end,
                meal,
                patientId,
                floor,
                course,
                seasonType: selectedMenu.season_type,
            });

            const extraWhere = buildLiveCommentsWhere({
                start,
                end,
                meal,
                patientId,
                floor,
                seasonType: selectedMenu.season_type,
            });

            where = surveyWhere.where;
            params = surveyWhere.params;
            whereChoice = choiceWhere.where;
            paramsChoice = choiceWhere.params;
            commentsWhere = extraWhere.where;
            commentsParams = [selectedMenu.season_type, ...extraWhere.params];
        } else {
            baseFrom = `
                FROM arch_survey s
                JOIN arch_dish_pairing dp
                    ON dp.id_arch_menu = s.id_arch_menu
                   AND dp.id_dish_pairing = s.id_dish_pairing
                JOIN arch_meal_snapshot m
                    ON m.id_arch_menu = dp.id_arch_menu
                   AND m.id_meal = dp.id_meal
                JOIN arch_food_snapshot f
                    ON f.id_arch_food = dp.id_arch_food
                ${latestPatientJoin('s')}
                JOIN caregiver cg ON cg.id_caregiver = s.id_caregiver
            `;

            baseFromChoice = `
                FROM arch_choice c
                JOIN arch_dish_pairing dp
                    ON dp.id_arch_menu = c.id_arch_menu
                   AND dp.id_dish_pairing = c.id_dish_pairing
                JOIN arch_meal_snapshot m
                    ON m.id_arch_menu = dp.id_arch_menu
                   AND m.id_meal = dp.id_meal
                JOIN arch_food_snapshot f
                    ON f.id_arch_food = dp.id_arch_food
                ${latestPatientJoin('c')}
            `;

            commentsFrom = `
                FROM arch_survey_extra sx
                JOIN arch_meal_snapshot m
                    ON m.id_arch_menu = sx.id_arch_menu
                   AND m.id_meal = sx.id_meal
                ${latestPatientJoin('sx')}
                JOIN caregiver cg ON cg.id_caregiver = sx.id_caregiver
            `;

            const surveyWhere = buildArchiveSurveyWhere({
                start,
                end,
                meal,
                patientId,
                floor,
                course,
                idArchMenu: selectedMenu.id_arch_menu,
            });

            const choiceWhere = buildArchiveChoiceWhere({
                start,
                end,
                meal,
                patientId,
                floor,
                course,
                idArchMenu: selectedMenu.id_arch_menu,
            });

            const extraWhere = buildArchiveCommentsWhere({
                start,
                end,
                meal,
                patientId,
                floor,
                idArchMenu: selectedMenu.id_arch_menu,
            });

            where = surveyWhere.where;
            params = surveyWhere.params;
            whereChoice = choiceWhere.where;
            paramsChoice = choiceWhere.params;
            commentsWhere = extraWhere.where;
            commentsParams = extraWhere.params;
        }

        const kpiSql = `
            SELECT
                COALESCE(SUM((${wasteFactorExpr}) * f.grammage_tot) / 1000, 0) AS waste_kg,
                COALESCE(SUM((${wasteFactorExpr}) * f.kcal_tot), 0) AS kcal_wasted,
                COALESCE(AVG(s.portion), 0) AS avg_consumption,
                COALESCE(
                    (
                        SUM(CASE WHEN s.portion >= 1 THEN 1 ELSE 0 END)
                        / NULLIF(COUNT(*), 0)
                    ) * 100,
                    0
                ) AS gradimento_pct,
                COUNT(*) AS surveys_count
            ${baseFrom}
            ${where}
        `;

        const coverageSql = `
            SELECT COUNT(*) AS choices_count
            ${baseFromChoice}
            ${whereChoice}
        `;

        const topLikedSql = `
            SELECT
                f.id_food,
                f.name,
                f.type,
                AVG(s.portion) AS avg_portion,
                COUNT(*) AS n
            ${baseFrom}
            ${where}
            GROUP BY f.id_food, f.name, f.type
            HAVING COUNT(*) >= 3
            ORDER BY avg_portion DESC, n DESC, f.name ASC
            LIMIT 5
        `;

        const topDislikedSql = `
            SELECT
                f.id_food,
                f.name,
                f.type,
                AVG(s.portion) AS avg_portion,
                COUNT(*) AS n
            ${baseFrom}
            ${where}
            GROUP BY f.id_food, f.name, f.type
            HAVING COUNT(*) >= 3
            ORDER BY avg_portion ASC, n DESC, f.name ASC
            LIMIT 5
        `;

        const countDetailsSql = `
            SELECT COUNT(*) AS total
            ${baseFrom}
            ${where}
        `;

        const detailsSql = `
            SELECT
                s.date,
                p.name AS patient_name,
                p.surname AS patient_surname,
                p.floor,
                p.room,
                m.type AS meal_type,
                f.type AS course_type,
                f.name AS dish_name,
                s.portion,
                ROUND((${wasteFactorExpr}) * f.grammage_tot, 0) AS waste_g,
                cg.name AS caregiver_name,
                cg.surname AS caregiver_surname
            ${baseFrom}
            ${where}
            ORDER BY s.date DESC, p.surname ASC, p.name ASC
            LIMIT ? OFFSET ?
        `;

        const countCommentsSql = `
            SELECT COUNT(*) AS total
            FROM (
                SELECT
                    sx.date,
                    p.id_patient,
                    m.day_index,
                    m.type,
                    sx.comments,
                    sx.id_caregiver
                ${commentsFrom}
                ${commentsWhere}
                GROUP BY
                    sx.date,
                    p.id_patient,
                    m.day_index,
                    m.type,
                    sx.comments,
                    sx.id_caregiver
            ) x
        `;

        const commentsSql = `
            SELECT
                sx.date,
                p.name AS patient_name,
                p.surname AS patient_surname,
                p.floor,
                p.room,
                (m.day_index + 1) AS day_number,
                m.type AS meal_type,
                sx.comments,
                cg.name AS caregiver_name,
                cg.surname AS caregiver_surname
            ${commentsFrom}
            ${commentsWhere}
            GROUP BY
                sx.date,
                p.id_patient,
                p.name,
                p.surname,
                p.floor,
                p.room,
                m.day_index,
                m.type,
                sx.comments,
                sx.id_caregiver,
                cg.name,
                cg.surname
            ORDER BY sx.date DESC, p.surname ASC, p.name ASC, m.type ASC
            LIMIT ? OFFSET ?
        `;

        const patientsOptionsSql = `
            SELECT
                p.id_patient,
                p.name,
                p.surname,
                p.floor,
                p.room
            FROM patient p
            JOIN (
                SELECT id_patient, MAX(last_changed) AS last_changed
                FROM patient
                GROUP BY id_patient
            ) lp
                ON lp.id_patient = p.id_patient
               AND lp.last_changed = p.last_changed
            ORDER BY p.surname ASC, p.name ASC
        `;

        const floorsOptionsSql = `
            SELECT DISTINCT p.floor
            FROM patient p
            JOIN (
                SELECT id_patient, MAX(last_changed) AS last_changed
                FROM patient
                GROUP BY id_patient
            ) lp
                ON lp.id_patient = p.id_patient
               AND lp.last_changed = p.last_changed
            ORDER BY p.floor ASC
        `;

        const [
            [kpiRows],
            [coverageRows],
            [topLikedRows],
            [topDislikedRows],
            [countRows],
            [detailsRows],
            [countCommentsRows],
            [commentsRows],
            [patientsRows],
            [floorsRows],
        ] = await Promise.all([
            pool.query(kpiSql, params),
            pool.query(coverageSql, paramsChoice),
            pool.query(topLikedSql, params),
            pool.query(topDislikedSql, params),
            pool.query(countDetailsSql, params),
            pool.query(detailsSql, [...params, sizeNum, offset]),
            pool.query(countCommentsSql, commentsParams),
            pool.query(commentsSql, [
                ...commentsParams,
                commentsSizeNum,
                commentsOffset,
            ]),
            pool.query(patientsOptionsSql),
            pool.query(floorsOptionsSql),
        ]);

        const kpi = kpiRows?.[0] ?? {};
        const choicesCount = Number(coverageRows?.[0]?.choices_count ?? 0);
        const surveysCount = Number(kpi?.surveys_count ?? 0);
        const coveragePct =
            choicesCount > 0 ? (surveysCount / choicesCount) * 100 : 0;

        return res.json({
            selectedMenu,
            filters: {
                menuKind,
                menuRef,
                start,
                end,
                meal: meal || '',
                patientId: patientId || '',
                floor: floor || '',
                course: course || '',
                page: pageNum,
                pageSize: sizeNum,
            },
            kpi: {
                waste_kg: Number(kpi.waste_kg ?? 0),
                kcal_wasted: Number(kpi.kcal_wasted ?? 0),
                avg_consumption: Number(kpi.avg_consumption ?? 0),
                gradimento_pct: Number(kpi.gradimento_pct ?? 0),
                coverage_pct: Number(coveragePct ?? 0),
            },
            topLiked: topLikedRows ?? [],
            topDisliked: topDislikedRows ?? [],
            details: {
                data: detailsRows ?? [],
                total: Number(countRows?.[0]?.total ?? 0),
                page: pageNum,
                pageSize: sizeNum,
                totalPages: Math.max(
                    1,
                    Math.ceil(
                        (Number(countRows?.[0]?.total ?? 0) || 0) / sizeNum,
                    ),
                ),
            },
            comments: {
                data: commentsRows ?? [],
                total: Number(countCommentsRows?.[0]?.total ?? 0),
                page: commentsPageNum,
                pageSize: commentsSizeNum,
                totalPages: Math.max(
                    1,
                    Math.ceil(
                        (Number(countCommentsRows?.[0]?.total ?? 0) || 0) /
                            commentsSizeNum,
                    ),
                ),
                hasOnlyEmptyComments:
                    Number(countCommentsRows?.[0]?.total ?? 0) > 0 &&
                    (commentsRows ?? []).every(
                        (r) => !String(r.comments ?? '').trim(),
                    ),
            },
            options: {
                patients: mapPatients(patientsRows),
                floors: mapFloors(floorsRows),
            },
        });
    } catch (err) {
        console.error('Errore getConsumiReport:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}
