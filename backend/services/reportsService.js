// backend/services/reportsService.js
import { pool } from '../db/db.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

function parsePositiveInt(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function parseFirstChoiceFilter(value) {
    if (value === '' || value === null || value === undefined) return null;
    if (String(value) === '1') return 1;
    if (String(value) === '0') return 0;
    return null;
}

function applyFirstChoiceFilter(filter, firstChoice, mealAlias = 'm') {
    if (firstChoice === null || firstChoice === undefined) {
        return filter;
    }

    return {
        where: `${filter.where} AND ${mealAlias}.first_choice = ? `,
        params: [...(filter.params || []), Number(firstChoice)],
    };
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
    if (menuKind === 'active' || menuKind === 'ended') {
        const seasonType = String(menuRef || '').trim();
        if (!seasonType) return null;

        const dateCondition =
            menuKind === 'active'
                ? `CURDATE() BETWEEN start_date AND end_date`
                : `end_date < CURDATE()`;

        const [rows] = await pool.query(
            `
            SELECT
                season_type,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
            FROM season
            WHERE season_type = ?
              AND ${dateCondition}
            LIMIT 1
            `,
            [seasonType],
        );

        if (!rows?.length) return null;

        return {
            kind: menuKind,
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

export async function getConsumiMenusData() {
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

        const [endedRows] = await pool.query(`
            SELECT
                'ended' AS kind,
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
                    ' (concluso non archiviato)'
                ) AS label,
                0 AS is_active
            FROM season s
            WHERE s.end_date < CURDATE()
            ORDER BY s.end_date DESC, s.start_date DESC
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

        return {
            data: [
                ...(activeRows ?? []),
                ...(endedRows ?? []),
                ...(archivedRows ?? []),
            ],
        };
    } catch (err) {
        logger.error('Errore getConsumiMenus', err);
        throw new HttpError(500, 'Errore interno al server');
    }
}

export async function getConsumiReportData(query = {}) {
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
            firstChoice = '',
            page = '1',
            pageSize = '10',
        } = query;

        if (!menuKind || !menuRef) {
            throw new HttpError(
                400,
                'Parametri obbligatori: menuKind, menuRef',
            );
        }

        if (!start || !end) {
            throw new HttpError(
                400,
                'Parametri obbligatori: start, end (YYYY-MM-DD)',
            );
        }

        if (end < start) {
            throw new HttpError(
                400,
                'La data di fine deve essere >= data inizio',
            );
        }

        const firstChoiceFilter = parseFirstChoiceFilter(firstChoice);

        const selectedMenu = await resolveSelectedMenu(menuKind, menuRef);
        if (!selectedMenu) {
            throw new HttpError(400, 'Menù selezionato non valido');
        }

        if (start < selectedMenu.start_date || end > selectedMenu.end_date) {
            throw new HttpError(
                400,
                'L’intervallo selezionato deve rientrare nel range del menù scelto',
            );
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const sizeNum = Math.min(
            100,
            Math.max(1, parseInt(pageSize, 10) || 10),
        );
        const offset = (pageNum - 1) * sizeNum;

        const commentsPageNum = Math.max(
            1,
            parseInt(query.commentsPage, 10) || 1,
        );
        const commentsSizeNum = Math.min(
            100,
            Math.max(1, parseInt(query.commentsPageSize, 10) || 10),
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

        if (selectedMenu.kind !== 'archive') {
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

            const surveyWhere = applyFirstChoiceFilter(
                buildLiveSurveyWhere({
                    start,
                    end,
                    meal,
                    patientId,
                    floor,
                    course,
                    seasonType: selectedMenu.season_type,
                }),
                firstChoiceFilter,
            );

            const choiceWhere = applyFirstChoiceFilter(
                buildLiveChoiceWhere({
                    start,
                    end,
                    meal,
                    patientId,
                    floor,
                    course,
                    seasonType: selectedMenu.season_type,
                }),
                firstChoiceFilter,
            );

            const extraWhere = applyFirstChoiceFilter(
                buildLiveCommentsWhere({
                    start,
                    end,
                    meal,
                    patientId,
                    floor,
                    seasonType: selectedMenu.season_type,
                }),
                firstChoiceFilter,
            );

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

            const surveyWhere = applyFirstChoiceFilter(
                buildArchiveSurveyWhere({
                    start,
                    end,
                    meal,
                    patientId,
                    floor,
                    course,
                    idArchMenu: selectedMenu.id_arch_menu,
                }),
                firstChoiceFilter,
            );

            const choiceWhere = applyFirstChoiceFilter(
                buildArchiveChoiceWhere({
                    start,
                    end,
                    meal,
                    patientId,
                    floor,
                    course,
                    idArchMenu: selectedMenu.id_arch_menu,
                }),
                firstChoiceFilter,
            );

            const extraWhere = applyFirstChoiceFilter(
                buildArchiveCommentsWhere({
                    start,
                    end,
                    meal,
                    patientId,
                    floor,
                    idArchMenu: selectedMenu.id_arch_menu,
                }),
                firstChoiceFilter,
            );

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

        return {
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
                firstChoice:
                    firstChoiceFilter === null ||
                    firstChoiceFilter === undefined
                        ? ''
                        : String(firstChoiceFilter),
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
        };
    } catch (err) {
        logger.error('Errore getConsumiReport', err);
        throw new HttpError(500, 'Errore interno al server');
    }
}

const SCELTE_COURSE_ORDER = [
    'primo',
    'secondo',
    'contorno',
    'ultimo',
    'coperto',
    'speciale',
];

const SCELTE_CHOOSER_ORDER = ['guest', 'family', 'caregiver'];

function parseWeekFilter(value) {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= 4 ? n : null;
}

function parseBabyFoodFilter(value) {
    if (value === '' || value === null || value === undefined) return null;
    if (String(value) === '1') return 1;
    if (String(value) === '0') return 0;
    return null;
}

function parseChooserFilter(value) {
    const x = String(value || '').trim();
    return ['guest', 'family', 'caregiver'].includes(x) ? x : '';
}

function buildPatientScopeWhere({ patientId, floor }) {
    let where = ` WHERE 1=1 `;
    const params = [];

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

function buildLiveScelteChoiceWhere({
    start,
    end,
    meal,
    patientId,
    floor,
    course,
    week,
    chooser,
    babyFood,
    seasonType,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND c.date >= ? AND c.date <= ? `;
    params.push(start, end);

    where += ` AND dp.season_type = ? `;
    params.push(seasonType);

    where += ` AND dp.used = 1 `;

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

    if (week) {
        where += ` AND FLOOR(m.day_index / 7) + 1 = ? `;
        params.push(Number(week));
    }

    if (chooser) {
        where += ` AND c.chooser = ? `;
        params.push(chooser);
    }

    if (babyFood !== null && babyFood !== undefined) {
        where += ` AND c.baby_food = ? `;
        params.push(Number(babyFood));
    }

    return { where, params };
}

function buildArchiveScelteChoiceWhere({
    start,
    end,
    meal,
    patientId,
    floor,
    course,
    week,
    chooser,
    babyFood,
    idArchMenu,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND c.id_arch_menu = ? `;
    params.push(idArchMenu);

    where += ` AND c.date >= ? AND c.date <= ? `;
    params.push(start, end);

    where += ` AND dp.used = 1 `;

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

    if (week) {
        where += ` AND FLOOR(m.day_index / 7) + 1 = ? `;
        params.push(Number(week));
    }

    if (chooser) {
        where += ` AND c.chooser = ? `;
        params.push(chooser);
    }

    if (babyFood !== null && babyFood !== undefined) {
        where += ` AND c.baby_food = ? `;
        params.push(Number(babyFood));
    }

    return { where, params };
}

function buildLiveScelteAvailabilityWhere({
    start,
    end,
    meal,
    course,
    week,
    seasonType,
    menuStartDate,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND dp.season_type = ? `;
    params.push(seasonType);

    where += ` AND dp.used = 1 `;

    where += ` AND DATE_ADD(?, INTERVAL m.day_index DAY) BETWEEN ? AND ? `;
    params.push(menuStartDate, start, end);

    if (meal) {
        where += ` AND m.type = ? `;
        params.push(meal);
    }

    if (course) {
        where += ` AND f.type = ? `;
        params.push(course);
    }

    if (week) {
        where += ` AND FLOOR(m.day_index / 7) + 1 = ? `;
        params.push(Number(week));
    }

    return { where, params };
}

function buildArchiveScelteAvailabilityWhere({
    start,
    end,
    meal,
    course,
    week,
    idArchMenu,
    menuStartDate,
}) {
    let where = ` WHERE 1=1 `;
    const params = [];

    where += ` AND dp.id_arch_menu = ? `;
    params.push(idArchMenu);

    where += ` AND dp.used = 1 `;

    where += ` AND DATE_ADD(?, INTERVAL m.day_index DAY) BETWEEN ? AND ? `;
    params.push(menuStartDate, start, end);

    if (meal) {
        where += ` AND m.type = ? `;
        params.push(meal);
    }

    if (course) {
        where += ` AND f.type = ? `;
        params.push(course);
    }

    if (week) {
        where += ` AND FLOOR(m.day_index / 7) + 1 = ? `;
        params.push(Number(week));
    }

    return { where, params };
}

function capitalizeLabel(value) {
    const x = String(value || '').trim();
    if (!x) return '';
    return x.charAt(0).toUpperCase() + x.slice(1);
}

function formatCourseLabel(value) {
    if (value === 'ultimo') return 'Dessert';
    return capitalizeLabel(value);
}

function formatChooserLabel(value) {
    if (value === 'guest') return 'Ospite';
    if (value === 'family') return 'Famiglia';
    if (value === 'caregiver') return 'Caregiver';
    return capitalizeLabel(value);
}

function buildWeeklyTrendRows(
    availabilityRows,
    choiceRows,
    patientScopeCount,
    week,
) {
    const availabilityMap = new Map(
        (availabilityRows ?? []).map((r) => [
            Number(r.week_number),
            Number(r.availability_count ?? 0),
        ]),
    );

    const choiceMap = new Map(
        (choiceRows ?? []).map((r) => [
            Number(r.week_number),
            Number(r.chosen_count ?? 0),
        ]),
    );

    const weeks = week ? [Number(week)] : [1, 2, 3, 4];

    return weeks.map((w) => {
        const availabilityCount = availabilityMap.get(w) ?? 0;
        const chosenCount = choiceMap.get(w) ?? 0;
        const opportunityCount = availabilityCount * patientScopeCount;
        const selectionRatePct =
            opportunityCount > 0 ? (chosenCount / opportunityCount) * 100 : 0;

        return {
            week_number: w,
            label: `Settimana ${w}`,
            availability_count: availabilityCount,
            chosen_count: chosenCount,
            opportunity_count: opportunityCount,
            selection_rate_pct: selectionRatePct,
        };
    });
}

function buildCourseRows(
    availabilityRows,
    choiceRows,
    patientScopeCount,
    course,
) {
    const availabilityMap = new Map(
        (availabilityRows ?? []).map((r) => [
            String(r.course_type),
            Number(r.availability_count ?? 0),
        ]),
    );

    const choiceMap = new Map(
        (choiceRows ?? []).map((r) => [
            String(r.course_type),
            Number(r.chosen_count ?? 0),
        ]),
    );

    const keys = course ? [course] : SCELTE_COURSE_ORDER;

    return keys.map((key) => {
        const availabilityCount = availabilityMap.get(key) ?? 0;
        const chosenCount = choiceMap.get(key) ?? 0;
        const opportunityCount = availabilityCount * patientScopeCount;
        const selectionRatePct =
            opportunityCount > 0 ? (chosenCount / opportunityCount) * 100 : 0;

        return {
            course_type: key,
            label: formatCourseLabel(key),
            availability_count: availabilityCount,
            chosen_count: chosenCount,
            opportunity_count: opportunityCount,
            selection_rate_pct: selectionRatePct,
        };
    });
}

function buildChooserRows(rows, totalChoices, chooser) {
    const counts = new Map(
        (rows ?? []).map((r) => [
            String(r.chooser),
            Number(r.chosen_count ?? 0),
        ]),
    );

    const keys = chooser ? [chooser] : SCELTE_CHOOSER_ORDER;

    return keys.map((key) => {
        const chosenCount = counts.get(key) ?? 0;
        const sharePct =
            totalChoices > 0 ? (chosenCount / totalChoices) * 100 : 0;

        return {
            chooser: key,
            label: formatChooserLabel(key),
            chosen_count: chosenCount,
            share_pct: sharePct,
        };
    });
}

export async function getScelteMenusData() {
    return getConsumiMenusData();
}

export async function getScelteReportData(query = {}) {
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
            firstChoice = '',
            week = '',
            chooser = '',
            babyFood = '',
            page = '1',
            pageSize = '10',
            detailsPage = '1',
            detailsPageSize = '10',
        } = query;

        if (!menuKind || !menuRef) {
            throw new HttpError(
                400,
                'Parametri obbligatori: menuKind, menuRef',
            );
        }

        if (!start || !end) {
            throw new HttpError(
                400,
                'Parametri obbligatori: start, end (YYYY-MM-DD)',
            );
        }

        if (end < start) {
            throw new HttpError(
                400,
                'La data di fine deve essere >= data inizio',
            );
        }

        const selectedMenu = await resolveSelectedMenu(menuKind, menuRef);
        if (!selectedMenu) {
            throw new HttpError(400, 'Menù selezionato non valido');
        }

        if (start < selectedMenu.start_date || end > selectedMenu.end_date) {
            throw new HttpError(
                400,
                'L’intervallo selezionato deve rientrare nel range del menù scelto',
            );
        }

        const weekNum = parseWeekFilter(week);
        const chooserFilter = parseChooserFilter(chooser);
        const babyFoodFilter = parseBabyFoodFilter(babyFood);
        const firstChoiceFilter = parseFirstChoiceFilter(firstChoice);

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const sizeNum = Math.min(
            100,
            Math.max(1, parseInt(pageSize, 10) || 10),
        );
        const offset = (pageNum - 1) * sizeNum;

        const detailsPageNum = Math.max(1, parseInt(detailsPage, 10) || 1);
        const detailsSizeNum = Math.min(
            100,
            Math.max(1, parseInt(detailsPageSize, 10) || 10),
        );
        const detailsOffset = (detailsPageNum - 1) * detailsSizeNum;

        let availabilityFrom = '';
        let choiceFrom = '';
        let detailsFrom = '';
        let availabilityWhere = '';
        let choiceWhere = '';
        let availabilityParams = [];
        let choiceParams = [];

        if (selectedMenu.kind !== 'archive') {
            availabilityFrom = `
                FROM dish_pairing dp
                JOIN meal m ON m.id_meal = dp.id_meal
                JOIN food f ON f.id_food = dp.id_food
            `;

            choiceFrom = `
                FROM choice c
                JOIN dish_pairing dp ON dp.id_dish_pairing = c.id_dish_pairing
                JOIN meal m ON m.id_meal = dp.id_meal
                JOIN food f ON f.id_food = dp.id_food
                ${latestPatientJoin('c')}
            `;

            detailsFrom = `
                ${choiceFrom}
                JOIN caregiver cg ON cg.id_caregiver = c.id_caregiver
            `;

            const availabilityFilter = applyFirstChoiceFilter(
                buildLiveScelteAvailabilityWhere({
                    start,
                    end,
                    meal,
                    course,
                    week: weekNum,
                    seasonType: selectedMenu.season_type,
                    menuStartDate: selectedMenu.start_date,
                }),
                firstChoiceFilter,
            );

            const choiceFilter = applyFirstChoiceFilter(
                buildLiveScelteChoiceWhere({
                    start,
                    end,
                    meal,
                    patientId,
                    floor,
                    course,
                    week: weekNum,
                    chooser: chooserFilter,
                    babyFood: babyFoodFilter,
                    seasonType: selectedMenu.season_type,
                }),
                firstChoiceFilter,
            );

            availabilityWhere = availabilityFilter.where;
            availabilityParams = availabilityFilter.params;
            choiceWhere = choiceFilter.where;
            choiceParams = choiceFilter.params;
        } else {
            availabilityFrom = `
                FROM arch_dish_pairing dp
                JOIN arch_meal_snapshot m
                    ON m.id_arch_menu = dp.id_arch_menu
                   AND m.id_meal = dp.id_meal
                JOIN arch_food_snapshot f
                    ON f.id_arch_food = dp.id_arch_food
            `;

            choiceFrom = `
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

            detailsFrom = `
                ${choiceFrom}
                JOIN caregiver cg ON cg.id_caregiver = c.id_caregiver
            `;

            const availabilityFilter = applyFirstChoiceFilter(
                buildArchiveScelteAvailabilityWhere({
                    start,
                    end,
                    meal,
                    course,
                    week: weekNum,
                    idArchMenu: selectedMenu.id_arch_menu,
                    menuStartDate: selectedMenu.start_date,
                }),
                firstChoiceFilter,
            );

            const choiceFilter = applyFirstChoiceFilter(
                buildArchiveScelteChoiceWhere({
                    start,
                    end,
                    meal,
                    patientId,
                    floor,
                    course,
                    week: weekNum,
                    chooser: chooserFilter,
                    babyFood: babyFoodFilter,
                    idArchMenu: selectedMenu.id_arch_menu,
                }),
                firstChoiceFilter,
            );

            availabilityWhere = availabilityFilter.where;
            availabilityParams = availabilityFilter.params;
            choiceWhere = choiceFilter.where;
            choiceParams = choiceFilter.params;
        }

        const patientScopeFilter = buildPatientScopeWhere({ patientId, floor });

        const patientScopeSql = `
            SELECT COUNT(*) AS patient_count
            FROM patient p
            JOIN (
                SELECT id_patient, MAX(last_changed) AS last_changed
                FROM patient
                GROUP BY id_patient
            ) lp
                ON lp.id_patient = p.id_patient
               AND lp.last_changed = p.last_changed
            ${patientScopeFilter.where}
        `;

        const [patientScopeRows] = await pool.query(
            patientScopeSql,
            patientScopeFilter.params,
        );

        const patientScopeCount = Math.max(
            0,
            Number(patientScopeRows?.[0]?.patient_count ?? 0),
        );

        const availabilityAggSql = `
            SELECT
                f.id_food AS food_id,
                f.name,
                f.type,
                COUNT(*) AS availability_count
            ${availabilityFrom}
            ${availabilityWhere}
            GROUP BY
                f.id_food,
                f.name,
                f.type,
                COALESCE(NULLIF(f.category, ''), f.type)
        `;

        const choiceAggSql = `
            SELECT
                f.id_food AS food_id,
                COUNT(*) AS chosen_count,
                SUM(CASE WHEN c.chooser = 'guest' THEN 1 ELSE 0 END) AS guest_count,
                SUM(CASE WHEN c.chooser = 'family' THEN 1 ELSE 0 END) AS family_count,
                SUM(CASE WHEN c.chooser = 'caregiver' THEN 1 ELSE 0 END) AS caregiver_count,
                SUM(CASE WHEN c.baby_food = 1 THEN 1 ELSE 0 END) AS baby_food_count
            ${choiceFrom}
            ${choiceWhere}
            GROUP BY f.id_food
        `;

        const joinedAggSql = `
            FROM (${availabilityAggSql}) av
            LEFT JOIN (${choiceAggSql}) ch
                ON ch.food_id = av.food_id
        `;

        const choiceKpiSql = `
            SELECT
                COUNT(*) AS total_choices,
                COUNT(DISTINCT f.id_food) AS distinct_dishes_chosen,
                SUM(CASE WHEN c.chooser = 'caregiver' THEN 1 ELSE 0 END) AS caregiver_choices,
                SUM(CASE WHEN c.baby_food = 1 THEN 1 ELSE 0 END) AS baby_food_choices
            ${choiceFrom}
            ${choiceWhere}
        `;

        const availabilityKpiSql = `
            SELECT
                COALESCE(SUM(x.availability_count), 0) AS total_availability_occurrences,
                COUNT(*) AS distinct_available_dishes
            FROM (${availabilityAggSql}) x
        `;

        const neverChosenCountSql = `
            SELECT COUNT(*) AS total
            ${joinedAggSql}
            WHERE COALESCE(ch.chosen_count, 0) = 0
        `;

        const topChosenSql = `
            SELECT
                av.food_id,
                av.name,
                av.type,
                av.availability_count,
                ${patientScopeCount} AS patient_scope_count,
                (${patientScopeCount} * av.availability_count) AS opportunity_count,
                COALESCE(ch.chosen_count, 0) AS chosen_count,
                COALESCE(ch.guest_count, 0) AS guest_count,
                COALESCE(ch.family_count, 0) AS family_count,
                COALESCE(ch.caregiver_count, 0) AS caregiver_count,
                COALESCE(ch.baby_food_count, 0) AS baby_food_count,
                CASE
                    WHEN (${patientScopeCount} * av.availability_count) > 0
                        THEN (COALESCE(ch.chosen_count, 0) / (${patientScopeCount} * av.availability_count)) * 100
                    ELSE 0
                END AS selection_rate_pct
            ${joinedAggSql}
            WHERE av.availability_count >= 3
            ORDER BY
                selection_rate_pct DESC,
                chosen_count DESC,
                av.availability_count DESC,
                av.name ASC
            LIMIT 5
        `;

        const bottomChosenSql = `
            SELECT
                av.food_id,
                av.name,
                av.type,
                av.availability_count,
                ${patientScopeCount} AS patient_scope_count,
                (${patientScopeCount} * av.availability_count) AS opportunity_count,
                COALESCE(ch.chosen_count, 0) AS chosen_count,
                COALESCE(ch.guest_count, 0) AS guest_count,
                COALESCE(ch.family_count, 0) AS family_count,
                COALESCE(ch.caregiver_count, 0) AS caregiver_count,
                COALESCE(ch.baby_food_count, 0) AS baby_food_count,
                CASE
                    WHEN (${patientScopeCount} * av.availability_count) > 0
                        THEN (COALESCE(ch.chosen_count, 0) / (${patientScopeCount} * av.availability_count)) * 100
                    ELSE 0
                END AS selection_rate_pct
            ${joinedAggSql}
            WHERE av.availability_count >= 3
            ORDER BY
                selection_rate_pct ASC,
                chosen_count ASC,
                av.availability_count DESC,
                av.name ASC
            LIMIT 5
        `;

        const neverChosenSql = `
            SELECT
                av.food_id,
                av.name,
                av.type,
                av.availability_count,
                ${patientScopeCount} AS patient_scope_count,
                (${patientScopeCount} * av.availability_count) AS opportunity_count,
                0 AS chosen_count,
                0 AS guest_count,
                0 AS family_count,
                0 AS caregiver_count,
                0 AS baby_food_count,
                0 AS selection_rate_pct
            ${joinedAggSql}
            WHERE COALESCE(ch.chosen_count, 0) = 0
            ORDER BY
                av.availability_count DESC,
                av.name ASC
            LIMIT 5
        `;

        const weeklyAvailabilitySql = `
            SELECT
                FLOOR(m.day_index / 7) + 1 AS week_number,
                COUNT(*) AS availability_count
            ${availabilityFrom}
            ${availabilityWhere}
            GROUP BY FLOOR(m.day_index / 7) + 1
            ORDER BY week_number ASC
        `;

        const weeklyChoiceSql = `
            SELECT
                FLOOR(m.day_index / 7) + 1 AS week_number,
                COUNT(*) AS chosen_count
            ${choiceFrom}
            ${choiceWhere}
            GROUP BY FLOOR(m.day_index / 7) + 1
            ORDER BY week_number ASC
        `;

        const byCourseAvailabilitySql = `
            SELECT
                f.type AS course_type,
                COUNT(*) AS availability_count
            ${availabilityFrom}
            ${availabilityWhere}
            GROUP BY f.type
        `;

        const byCourseChoiceSql = `
            SELECT
                f.type AS course_type,
                COUNT(*) AS chosen_count
            ${choiceFrom}
            ${choiceWhere}
            GROUP BY f.type
        `;

        const byChooserSql = `
            SELECT
                c.chooser,
                COUNT(*) AS chosen_count
            ${choiceFrom}
            ${choiceWhere}
            GROUP BY c.chooser
        `;

        const topCategorySql = `
            SELECT
                COALESCE(NULLIF(f.category, ''), f.type) AS category_label,
                COUNT(*) AS chosen_count
            ${choiceFrom}
            ${choiceWhere}
            GROUP BY COALESCE(NULLIF(f.category, ''), f.type)
            ORDER BY chosen_count DESC, category_label ASC
            LIMIT 1
        `;

        const countDishesSql = `
            SELECT COUNT(*) AS total
            FROM (${availabilityAggSql}) av
        `;

        const dishesSql = `
            SELECT
                av.food_id,
                av.name,
                av.type,
                av.availability_count,
                ${patientScopeCount} AS patient_scope_count,
                (${patientScopeCount} * av.availability_count) AS opportunity_count,
                COALESCE(ch.chosen_count, 0) AS chosen_count,
                COALESCE(ch.guest_count, 0) AS guest_count,
                COALESCE(ch.family_count, 0) AS family_count,
                COALESCE(ch.caregiver_count, 0) AS caregiver_count,
                COALESCE(ch.baby_food_count, 0) AS baby_food_count,
                CASE
                    WHEN (${patientScopeCount} * av.availability_count) > 0
                        THEN (COALESCE(ch.chosen_count, 0) / (${patientScopeCount} * av.availability_count)) * 100
                    ELSE 0
                END AS selection_rate_pct
            ${joinedAggSql}
            ORDER BY
                selection_rate_pct DESC,
                chosen_count DESC,
                av.availability_count DESC,
                av.name ASC
            LIMIT ? OFFSET ?
        `;

        const countDetailsSql = `
            SELECT COUNT(*) AS total
            ${choiceFrom}
            ${choiceWhere}
        `;

        const detailsSql = `
            SELECT
                c.date,
                p.name AS patient_name,
                p.surname AS patient_surname,
                p.floor,
                p.room,
                (m.day_index + 1) AS day_number,
                FLOOR(m.day_index / 7) + 1 AS week_number,
                m.type AS meal_type,
                m.first_choice,
                f.type AS course_type,
                f.name AS dish_name,
                c.chooser,
                c.baby_food,
                cg.name AS caregiver_name,
                cg.surname AS caregiver_surname
            ${detailsFrom}
            ${choiceWhere}
            ORDER BY
                c.date DESC,
                p.surname ASC,
                p.name ASC,
                m.day_index ASC,
                f.type ASC,
                f.name ASC
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
            [choiceKpiRows],
            [availabilityKpiRows],
            [neverChosenCountRows],
            [topChosenRows],
            [bottomChosenRows],
            [neverChosenRows],
            [weeklyAvailabilityRows],
            [weeklyChoiceRows],
            [byCourseAvailabilityRows],
            [byCourseChoiceRows],
            [byChooserRows],
            [topCategoryRows],
            [countDishesRows],
            [dishesRows],
            [countDetailsRows],
            [detailsRows],
            [patientsRows],
            [floorsRows],
        ] = await Promise.all([
            pool.query(choiceKpiSql, choiceParams),
            pool.query(availabilityKpiSql, availabilityParams),
            pool.query(neverChosenCountSql, [
                ...availabilityParams,
                ...choiceParams,
            ]),
            pool.query(topChosenSql, [...availabilityParams, ...choiceParams]),
            pool.query(bottomChosenSql, [
                ...availabilityParams,
                ...choiceParams,
            ]),
            pool.query(neverChosenSql, [
                ...availabilityParams,
                ...choiceParams,
            ]),
            pool.query(weeklyAvailabilitySql, availabilityParams),
            pool.query(weeklyChoiceSql, choiceParams),
            pool.query(byCourseAvailabilitySql, availabilityParams),
            pool.query(byCourseChoiceSql, choiceParams),
            pool.query(byChooserSql, choiceParams),
            pool.query(topCategorySql, choiceParams),
            pool.query(countDishesSql, availabilityParams),
            pool.query(dishesSql, [
                ...availabilityParams,
                ...choiceParams,
                sizeNum,
                offset,
            ]),
            pool.query(countDetailsSql, choiceParams),
            pool.query(detailsSql, [
                ...choiceParams,
                detailsSizeNum,
                detailsOffset,
            ]),
            pool.query(patientsOptionsSql),
            pool.query(floorsOptionsSql),
        ]);

        const totalChoices = Number(choiceKpiRows?.[0]?.total_choices ?? 0);
        const distinctDishesChosen = Number(
            choiceKpiRows?.[0]?.distinct_dishes_chosen ?? 0,
        );
        const caregiverChoices = Number(
            choiceKpiRows?.[0]?.caregiver_choices ?? 0,
        );
        const babyFoodChoices = Number(
            choiceKpiRows?.[0]?.baby_food_choices ?? 0,
        );
        const totalAvailabilityOccurrences = Number(
            availabilityKpiRows?.[0]?.total_availability_occurrences ?? 0,
        );
        const neverChosenCount = Number(neverChosenCountRows?.[0]?.total ?? 0);

        const overallChoiceRatePct =
            patientScopeCount > 0 && totalAvailabilityOccurrences > 0
                ? (totalChoices /
                      (patientScopeCount * totalAvailabilityOccurrences)) *
                  100
                : 0;

        const caregiverSharePct =
            totalChoices > 0 ? (caregiverChoices / totalChoices) * 100 : 0;

        const babyFoodSharePct =
            totalChoices > 0 ? (babyFoodChoices / totalChoices) * 100 : 0;

        const weeklyTrend = buildWeeklyTrendRows(
            weeklyAvailabilityRows,
            weeklyChoiceRows,
            patientScopeCount,
            weekNum,
        );

        const byCourse = buildCourseRows(
            byCourseAvailabilityRows,
            byCourseChoiceRows,
            patientScopeCount,
            course,
        );

        const byChooser = buildChooserRows(
            byChooserRows,
            totalChoices,
            chooserFilter,
        );

        return {
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
                firstChoice:
                    firstChoiceFilter === null ||
                    firstChoiceFilter === undefined
                        ? ''
                        : String(firstChoiceFilter),
                week: weekNum ? String(weekNum) : '',
                chooser: chooserFilter || '',
                babyFood:
                    babyFoodFilter === null || babyFoodFilter === undefined
                        ? ''
                        : String(babyFoodFilter),
                page: pageNum,
                pageSize: sizeNum,
                detailsPage: detailsPageNum,
                detailsPageSize: detailsSizeNum,
            },
            kpi: {
                total_choices: totalChoices,
                distinct_dishes_chosen: distinctDishesChosen,
                overall_choice_rate_pct: overallChoiceRatePct,
                never_chosen_count: neverChosenCount,
                top_category_label: topCategoryRows?.[0]?.category_label ?? '—',
                caregiver_share_pct: caregiverSharePct,
                baby_food_share_pct: babyFoodSharePct,
                patient_scope_count: patientScopeCount,
                total_availability_occurrences: totalAvailabilityOccurrences,
            },
            rankings: {
                topChosen: topChosenRows ?? [],
                bottomChosen: bottomChosenRows ?? [],
                neverChosen: neverChosenRows ?? [],
            },
            charts: {
                weeklyTrend,
                byCourse,
                byChooser,
            },
            dishes: {
                data: dishesRows ?? [],
                total: Number(countDishesRows?.[0]?.total ?? 0),
                page: pageNum,
                pageSize: sizeNum,
                totalPages: Math.max(
                    1,
                    Math.ceil(
                        (Number(countDishesRows?.[0]?.total ?? 0) || 0) /
                            sizeNum,
                    ),
                ),
            },
            details: {
                data: detailsRows ?? [],
                total: Number(countDetailsRows?.[0]?.total ?? 0),
                page: detailsPageNum,
                pageSize: detailsSizeNum,
                totalPages: Math.max(
                    1,
                    Math.ceil(
                        (Number(countDetailsRows?.[0]?.total ?? 0) || 0) /
                            detailsSizeNum,
                    ),
                ),
            },
            options: {
                patients: mapPatients(patientsRows),
                floors: mapFloors(floorsRows),
            },
        };
    } catch (err) {
        logger.error('Errore getScelteReport', err);
        throw new HttpError(500, 'Errore interno al server');
    }
}
