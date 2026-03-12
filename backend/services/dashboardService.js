import { pool } from '../db/db.js';
import * as repo from '../repositories/dashboardRepo.js';

const REACTIVATION_ALERT_WINDOW_DAYS = 7;

function toInt(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function pluralize(count, singular, plural = `${singular}i`) {
    return count === 1 ? singular : plural;
}

function capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDaysFromNow(days) {
    if (days === 0) return 'oggi';
    if (days === 1) return 'domani';
    if (days > 1) return `tra ${days} giorni`;
    if (days === -1) return 'ieri';
    return `${Math.abs(days)} giorni fa`;
}

function mealSlotLabel(dayIndex, mealType) {
    const week = Math.floor(toInt(dayIndex) / 7) + 1;
    const day = (toInt(dayIndex) % 7) + 1;
    return `Settimana ${week}, Giorno ${day}, ${mealType}`;
}

function buildMenuRoutes(seasonType) {
    const encoded = encodeURIComponent(seasonType);
    return {
        menu: `/menu/edit/${encoded}`,
        fixed_dishes: `/menu/edit/${encoded}/piatti_fissi`,
        menus_list: '/menu',
        create_menu: '/menu/create',
    };
}

function deriveMenuState(row) {
    if (!row) return 'Non disponibile';
    if (row.is_current) return 'In corso';
    if (row.is_ended) return 'Concluso';
    if (row.needs_completion) return 'Da completare';
    return 'Pronto';
}

function deriveMenuTone(row) {
    if (!row) return 'info';
    if (row.is_ended) return 'info';
    if (row.needs_completion) {
        return row.days_until_start <= 7 ? 'error' : 'warning';
    }
    if (row.is_current) return 'info';
    return 'success';
}

function enrichMenu(row) {
    if (!row) return null;

    const mealsTotal = toInt(row.meals_total);
    const mealsCompiled = toInt(row.meals_compiled);
    const fixedSlotsTotal = toInt(row.fixed_slots_total);
    const fixedSlotsFilled = toInt(row.fixed_slots_filled);

    const incompleteMealsCount = Math.max(mealsTotal - mealsCompiled, 0);
    const fixedMissingSlots = Math.max(fixedSlotsTotal - fixedSlotsFilled, 0);

    const completionPct =
        mealsTotal > 0 ? Math.round((mealsCompiled / mealsTotal) * 100) : 0;

    const fixedCompletionPct =
        fixedSlotsTotal > 0
            ? Math.round((fixedSlotsFilled / fixedSlotsTotal) * 100)
            : 0;

    const base = {
        ...row,
        days_until_start: toInt(row.days_until_start),
        days_until_end: toInt(row.days_until_end),
        is_current: toInt(row.is_current) === 1,
        is_future: toInt(row.is_future) === 1,
        is_ended: toInt(row.is_ended) === 1,
        meals_total: mealsTotal,
        meals_compiled: mealsCompiled,
        incomplete_meals_count: incompleteMealsCount,
        fixed_slots_total: fixedSlotsTotal,
        fixed_slots_filled: fixedSlotsFilled,
        fixed_missing_slots: fixedMissingSlots,
        completion_pct: completionPct,
        fixed_completion_pct: fixedCompletionPct,
        needs_completion: incompleteMealsCount > 0 || fixedMissingSlots > 0,
        routes: buildMenuRoutes(row.season_type),
    };

    return {
        ...base,
        state_label: deriveMenuState(base),
        state_tone: deriveMenuTone(base),
    };
}

function severityWeight(severity) {
    if (severity === 'error') return 3;
    if (severity === 'warning') return 2;
    return 1;
}

function sortBySeverity(items) {
    return [...items].sort((a, b) => {
        const severityDiff =
            severityWeight(b.severity) - severityWeight(a.severity);
        if (severityDiff !== 0) return severityDiff;

        const aOrder = toInt(a.priority_order);
        const bOrder = toInt(b.priority_order);
        return aOrder - bOrder;
    });
}

function buildAlerts({
    currentMenu,
    nextMenu,
    lastEndedMenu,
    nextIncompleteMeals,
    suspensions,
}) {
    const alerts = [];

    if (currentMenu && currentMenu.days_until_end <= 14) {
        alerts.push({
            id: 'current-menu-expiring',
            severity: currentMenu.days_until_end <= 7 ? 'error' : 'warning',
            priority_order: currentMenu.days_until_end,
            title: `Il menù corrente "${currentMenu.season_type}" scade ${formatDaysFromNow(
                currentMenu.days_until_end,
            )}`,
            message: `Periodo ${currentMenu.period_label}. Restano ${currentMenu.days_until_end} ${pluralize(
                currentMenu.days_until_end,
                'giorno',
                'giorni',
            )} prima della chiusura.`,
            action: {
                type: 'navigate',
                label: 'Apri menù',
                target: currentMenu.routes.menu,
            },
        });
    }

    if (nextMenu && nextMenu.needs_completion) {
        const missingPieces = [];

        if (nextMenu.incomplete_meals_count > 0) {
            missingPieces.push(
                `${nextMenu.incomplete_meals_count} ${pluralize(
                    nextMenu.incomplete_meals_count,
                    'pasto incompleto',
                    'pasti incompleti',
                )}`,
            );
        }

        if (nextMenu.fixed_missing_slots > 0) {
            missingPieces.push(
                `${nextMenu.fixed_missing_slots} ${pluralize(
                    nextMenu.fixed_missing_slots,
                    'assegnazione fissa mancante',
                    'assegnazioni fisse mancanti',
                )}`,
            );
        }

        alerts.push({
            id: 'next-menu-starting-incomplete',
            severity: nextMenu.days_until_start <= 7 ? 'error' : 'warning',
            priority_order: nextMenu.days_until_start,
            title: `Il prossimo menù "${nextMenu.season_type}" inizia ${formatDaysFromNow(
                nextMenu.days_until_start,
            )} ma non è ancora completo`,
            message: missingPieces.join(' · '),
            action: {
                type: 'navigate',
                label: 'Completa ora',
                target: nextMenu.routes.menu,
            },
        });
    }

    if (lastEndedMenu) {
        alerts.push({
            id: 'last-ended-not-archived',
            severity: 'info',
            priority_order: -100,
            title: `Il menù concluso "${lastEndedMenu.season_type}" non è ancora stato archiviato`,
            message: `È terminato ${formatDaysFromNow(
                -Math.abs(lastEndedMenu.days_until_end),
            )}. Finché resta in season continua a risultare non archiviato.`,
            action: {
                type: 'archive-menu',
                label: 'Archivia',
                season_type: lastEndedMenu.season_type,
            },
        });
    }

    if (currentMenu && !nextMenu) {
        alerts.push({
            id: 'no-future-menu',
            severity: currentMenu.days_until_end <= 14 ? 'error' : 'warning',
            priority_order: currentMenu.days_until_end,
            title: 'Non esiste ancora un menù futuro dopo quello attuale',
            message: `Il menù corrente termina il ${currentMenu.end_date}. Conviene creare il prossimo menù prima della scadenza.`,
            action: {
                type: 'navigate',
                label: 'Crea menù',
                target: '/menu/create',
            },
        });
    }

    if (nextMenu && nextMenu.incomplete_meals_count > 0) {
        const preview = nextIncompleteMeals
            .slice(0, 3)
            .map((meal) => mealSlotLabel(meal.day_index, meal.type))
            .join(' · ');

        alerts.push({
            id: 'next-menu-incomplete-meals',
            severity: nextMenu.days_until_start <= 7 ? 'error' : 'warning',
            priority_order: nextMenu.days_until_start,
            title: `Ci sono ${nextMenu.incomplete_meals_count} ${pluralize(
                nextMenu.incomplete_meals_count,
                'pasto incompleto',
                'pasti incompleti',
            )} nel prossimo menù`,
            message: preview
                ? `Prime verifiche da fare: ${preview}.`
                : 'Apri il menù e completa i pasti ancora vuoti.',
            action: {
                type: 'navigate',
                label: 'Controlla pasti',
                target: nextMenu.routes.menu,
            },
        });
    }

    if (nextMenu && nextMenu.fixed_missing_slots > 0) {
        alerts.push({
            id: 'next-menu-fixed-dishes-missing',
            severity: nextMenu.days_until_start <= 7 ? 'error' : 'warning',
            priority_order: nextMenu.days_until_start,
            title: `Non sono stati inseriti tutti i piatti fissi nel prossimo menù`,
            message: `Mancano ancora ${nextMenu.fixed_missing_slots} ${pluralize(
                nextMenu.fixed_missing_slots,
                'assegnazione fissa',
                'assegnazioni fisse',
            )} per completare la griglia dei piatti fissi.`,
            action: {
                type: 'navigate',
                label: 'Controlla piatti',
                target: nextMenu.routes.fixed_dishes,
            },
        });
    }

    for (const suspension of suspensions) {
        if (
            suspension.days_until_reactivation > REACTIVATION_ALERT_WINDOW_DAYS
        ) {
            continue;
        }

        const uniqueReplacement = suspension.replacement_name;

        const message = uniqueReplacement
            ? `Il piatto ${suspension.name} sta per finire il suo periodo di sospensione e verrà riattivato al posto del piatto ${uniqueReplacement} che ha fatto da sostituto.`
            : `Il piatto ${suspension.name} sta per finire il suo periodo di sospensione. Prima della riattivazione conviene verificare i sostituti attivi nei menù coinvolti.`;

        alerts.push({
            id: `reactivation-${suspension.id_food}`,
            severity:
                suspension.days_until_reactivation <= 3 ? 'warning' : 'info',
            priority_order: suspension.days_until_reactivation,
            title: `Riattivazione vicina per "${suspension.name}"`,
            message,
            action: {
                type: 'navigate',
                label: 'Apri piatto',
                target: `/dishes/edit/${suspension.id_food}`,
            },
        });
    }

    return sortBySeverity(alerts);
}

function buildChecklist({
    currentMenu,
    nextMenu,
    lastEndedMenu,
    nextIncompleteMeals,
}) {
    const items = [];

    if (lastEndedMenu) {
        items.push({
            id: 'todo-archive-menu',
            severity: 'info',
            priority_order: 1,
            title: `Archiviare il menù ${lastEndedMenu.season_type}`,
            message: `Il menù si è concluso il ${lastEndedMenu.end_date} ma risulta ancora presente in season.`,
            action: {
                type: 'archive-menu',
                label: 'Archivia',
                season_type: lastEndedMenu.season_type,
            },
        });
    }

    if (nextMenu && nextMenu.needs_completion) {
        items.push({
            id: 'todo-complete-next-menu',
            severity: nextMenu.days_until_start <= 7 ? 'error' : 'warning',
            priority_order: 2,
            title: `Completare il menù che inizia il ${nextMenu.start_date}`,
            message: `Il menù ${nextMenu.season_type} è compilato al ${nextMenu.completion_pct}% e ha ancora elementi mancanti.`,
            action: {
                type: 'navigate',
                label: 'Apri menù',
                target: nextMenu.routes.menu,
            },
        });
    }

    if (nextMenu && nextMenu.incomplete_meals_count > 0) {
        const preview = nextIncompleteMeals
            .slice(0, 4)
            .map((meal) => mealSlotLabel(meal.day_index, meal.type))
            .join(' · ');

        items.push({
            id: 'todo-check-missing-meals',
            severity: 'warning',
            priority_order: 3,
            title: 'Controllare i pasti mancanti',
            message: preview
                ? `Pasti ancora senza portate reali: ${preview}.`
                : 'Apri il prossimo menù e verifica i pasti ancora privi di portate reali.',
            action: {
                type: 'navigate',
                label: 'Controlla pasti',
                target: nextMenu.routes.menu,
            },
        });
    }

    if (nextMenu && nextMenu.fixed_missing_slots > 0) {
        items.push({
            id: 'todo-check-fixed-dishes',
            severity: 'warning',
            priority_order: 4,
            title: 'Verificare i piatti fissi mancanti',
            message: `Restano ${nextMenu.fixed_missing_slots} assegnazioni da completare nella sezione piatti fissi del menù ${nextMenu.season_type}.`,
            action: {
                type: 'navigate',
                label: 'Controlla piatti',
                target: nextMenu.routes.fixed_dishes,
            },
        });
    }

    if (currentMenu && !nextMenu) {
        items.push({
            id: 'todo-create-future-menu',
            severity: currentMenu.days_until_end <= 7 ? 'error' : 'warning',
            priority_order: 5,
            title: 'Creare il prossimo menù',
            message: `Dopo ${currentMenu.season_type} non risulta ancora programmato nessun menù futuro.`,
            action: {
                type: 'navigate',
                label: 'Crea menù',
                target: '/menu/create',
            },
        });
    }

    return sortBySeverity(items);
}

export async function getDashboard() {
    const menuRows = await repo.listMenuSummaries(pool);
    const menus = menuRows.map(enrichMenu);

    const currentMenu = menus.find((menu) => menu.is_current) ?? null;
    const nextMenu = menus.find((menu) => menu.days_until_start > 0) ?? null;

    const lastEndedMenu =
        [...menus]
            .filter((menu) => menu.is_ended)
            .sort((a, b) => b.end_date.localeCompare(a.end_date))[0] ?? null;

    const nextIncompleteMeals = nextMenu
        ? await repo.listIncompleteMeals(pool, nextMenu.season_type)
        : [];

    const activeSuspensionsRaw = await repo.listActiveSuspensions(pool);

    const activeSuspensions = await Promise.all(
        activeSuspensionsRaw.map(async (row) => {
            const replacementCandidates =
                await repo.listReplacementCandidatesForSuspension(pool, {
                    idFood: row.id_food,
                    validFrom: row.valid_from,
                    validTo: row.valid_to,
                });

            const uniqueReplacementNames = [
                ...new Set(
                    replacementCandidates
                        .map((candidate) => candidate.name?.trim())
                        .filter(Boolean),
                ),
            ];

            return {
                ...row,
                days_until_reactivation: toInt(row.days_until_reactivation),
                type_label: capitalize(row.type),
                replacement_name:
                    uniqueReplacementNames.length > 0
                        ? uniqueReplacementNames.join(', ')
                        : null,
                replacement_candidates_count: uniqueReplacementNames.length,
                action: {
                    type: 'navigate',
                    label: 'Apri piatto',
                    target: `/dishes/edit/${row.id_food}`,
                },
            };
        }),
    );

    const alerts = buildAlerts({
        currentMenu,
        nextMenu,
        lastEndedMenu,
        nextIncompleteMeals,
        suspensions: activeSuspensions,
    });

    const checklist = buildChecklist({
        currentMenu,
        nextMenu,
        lastEndedMenu,
        nextIncompleteMeals,
    });

    return {
        generated_at: new Date().toISOString(),
        menus: {
            current: currentMenu,
            next: nextMenu,
            last_ended_unarchived: lastEndedMenu,
        },
        alerts,
        checklist,
        suspended_dishes: activeSuspensions,
    };
}
