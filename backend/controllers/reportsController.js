// backend/controllers/reportsController.js
import { pool } from '../db/db.js';

function buildWhere({ start, end, meal, patientId, floor, course }) {
    let where = ` WHERE 1=1 `;
    const params = [];

    // date range (obbligatorio)
    where += ` AND s.date >= ? AND s.date <= ? `;
    params.push(start, end);

    if (meal) {
        where += ` AND m.type = ? `;
        params.push(meal); // 'pranzo' | 'cena'
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
        params.push(course); // enum food.type
    }

    return { where, params };
}

// stessa logica WHERE ma su tabella choice (copertura questionario)
function buildWhereChoice({ start, end, meal, patientId, floor, course }) {
    let where = ` WHERE 1=1 `;
    const params = [];

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

export async function getConsumiReport(req, res) {
    try {
        const {
            start = '',
            end = '',
            meal = '',
            patientId = '',
            floor = '',
            course = '',

            page = '1',
            pageSize = '10',
        } = req.query;

        if (!start || !end) {
            return res.status(400).json({
                error: 'Parametri obbligatori: start, end (YYYY-MM-DD)',
            });
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const sizeNum = Math.min(
            100,
            Math.max(1, parseInt(pageSize, 10) || 10),
        );
        const offset = (pageNum - 1) * sizeNum;

        // paziente: tabella versionata (PK id_patient,last_changed) -> prendiamo riga più recente
        const latestPatientJoin = `
            JOIN (
                SELECT id_patient, MAX(last_changed) AS last_changed
                FROM patient
                GROUP BY id_patient
            ) lp ON lp.id_patient = s.id_patient
            JOIN patient p
                ON p.id_patient = lp.id_patient
               AND p.last_changed = lp.last_changed
        `;

        const baseFrom = `
            FROM survey s
            JOIN dish_pairing dp ON dp.id_dish_pairing = s.id_dish_pairing
            JOIN meal m ON m.id_meal = dp.id_meal
            JOIN food f ON f.id_food = dp.id_food
            ${latestPatientJoin}
            JOIN caregiver cg ON cg.id_caregiver = s.id_caregiver
        `;

        const { where, params } = buildWhere({
            start,
            end,
            meal,
            patientId,
            floor,
            course,
        });

        const wasteFactorExpr = `
            CASE
                WHEN s.portion >= 1 THEN 0
                WHEN s.portion < 0 THEN 1
                ELSE (1 - s.portion)
            END
        `;

        // =========================
        // KPI (in 1 query)
        // =========================
        const kpiSql = `
            SELECT
                COALESCE(SUM((${wasteFactorExpr}) * f.grammage_tot) / 1000, 0) AS waste_kg,
                COALESCE(SUM((${wasteFactorExpr}) * f.kcal_tot), 0) AS kcal_wasted,
                COALESCE(AVG(s.portion), 0) AS avg_consumption,
                COALESCE(
                    (SUM(CASE WHEN s.portion >= 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0)) * 100,
                    0
                ) AS gradimento_pct,
                COUNT(*) AS surveys_count
            ${baseFrom}
            ${where}
        `;

        // =========================
        // Copertura questionario = survey / choice
        // =========================
        const latestPatientJoinChoice = `
            JOIN (
                SELECT id_patient, MAX(last_changed) AS last_changed
                FROM patient
                GROUP BY id_patient
            ) lp ON lp.id_patient = c.id_patient
            JOIN patient p
                ON p.id_patient = lp.id_patient
               AND p.last_changed = lp.last_changed
        `;

        const baseFromChoice = `
            FROM choice c
            JOIN dish_pairing dp ON dp.id_dish_pairing = c.id_dish_pairing
            JOIN meal m ON m.id_meal = dp.id_meal
            JOIN food f ON f.id_food = dp.id_food
            ${latestPatientJoinChoice}
        `;

        const { where: whereChoice, params: paramsChoice } = buildWhereChoice({
            start,
            end,
            meal,
            patientId,
            floor,
            course,
        });

        const coverageSql = `
            SELECT
                COUNT(*) AS choices_count
            ${baseFromChoice}
            ${whereChoice}
        `;

        // =========================
        // Top 5 piatti più graditi
        // =========================
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

        // =========================
        // Top 5 piatti meno graditi
        // =========================
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

        // =========================
        // Dettagli questionari (count + data)
        // =========================
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

        // =========================
        // Opzioni filtri (pazienti + piani)
        // =========================
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
            ) lp ON lp.id_patient = p.id_patient AND lp.last_changed = p.last_changed
            ORDER BY p.surname ASC, p.name ASC
        `;

        const floorsOptionsSql = `
            SELECT DISTINCT p.floor
            FROM patient p
            JOIN (
                SELECT id_patient, MAX(last_changed) AS last_changed
                FROM patient
                GROUP BY id_patient
            ) lp ON lp.id_patient = p.id_patient AND lp.last_changed = p.last_changed
            ORDER BY p.floor ASC
        `;

        const [
            [kpiRows],
            [coverageRows],
            [topLikedRows],
            [topDislikedRows],
            [countRows],
            [detailsRows],
            [patientsRows],
            [floorsRows],
        ] = await Promise.all([
            pool.query(kpiSql, params),
            pool.query(coverageSql, paramsChoice),
            pool.query(topLikedSql, params),
            pool.query(topDislikedSql, params),
            pool.query(countDetailsSql, params),
            pool.query(detailsSql, [...params, sizeNum, offset]),
            pool.query(patientsOptionsSql),
            pool.query(floorsOptionsSql),
        ]);

        const kpi = kpiRows?.[0] ?? {};
        const choicesCount = coverageRows?.[0]?.choices_count ?? 0;
        const surveysCount = kpi?.surveys_count ?? 0;

        const coveragePct =
            choicesCount > 0 ? (surveysCount / choicesCount) * 100 : 0;

        return res.json({
            filters: {
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

            options: {
                patients: (patientsRows ?? []).map((p) => ({
                    value: String(p.id_patient),
                    label: `${p.surname} ${p.name} (Piano ${p.floor}, Stanza ${p.room})`,
                })),
                floors: (floorsRows ?? []).map((r) => ({
                    value: String(r.floor),
                    label: `Piano ${r.floor}`,
                })),
            },
        });
    } catch (err) {
        console.error('Errore getConsumiReport:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}
