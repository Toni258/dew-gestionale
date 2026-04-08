// Modal shown before dish deletion when the dish still appears in one or more menus.
import { Fragment } from 'react';

import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AlertBox from '../ui/AlertBox';
import { dayIndexToWeekDay } from '../../utils/dayIndex';

function formatMenuDay(dayIndex) {
    const { settimana, giorno } = dayIndexToWeekDay(dayIndex);
    return `Settimana ${settimana} · Giorno ${giorno}`;
}

export default function DishDeleteConflictsModal({
    preview,
    groupedConflicts,
    expandedMenus,
    onToggleMenu,
    onClose,
    onContinue,
}) {
    if (!preview) return null;

    const summary = preview.summary ?? {};

    return (
        <Modal onClose={onClose} contentClassName="w-[960px] max-w-[95vw]">
            <div className="max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6">
                <h2 className="mb-2 text-2xl font-semibold text-brand-text">
                    Eliminazione piatto – conflitti rilevati
                </h2>

                <p className="mb-4 text-sm text-brand-textSecondary">
                    Il piatto <strong>{preview.dish?.name}</strong> è ancora
                    presente in uno o più menù. Se si continua con
                    l’eliminazione, verranno rimossi anche i relativi dish
                    pairing ancora attivi.
                </p>

                <AlertBox variant="warning" title="Verifica prima di eliminare" className="mb-4">
                    {summary.occurrences_count ?? 0} occorrenze attive in{' '}
                    {summary.menus_count ?? 0} menù
                    {summary.future_menus_count
                        ? ` · ${summary.future_menus_count} menù futuri`
                        : ''}
                    {summary.fixed_occurrences
                        ? ` · ${summary.fixed_occurrences} piatti fissi`
                        : ''}
                </AlertBox>

                <table className="mb-6 w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b text-left">
                            <th className="p-2">Menù</th>
                            <th className="p-2">Periodo</th>
                            <th className="p-2">Occorrenze</th>
                            <th className="p-2">Dettaglio</th>
                        </tr>
                    </thead>

                    <tbody>
                        {groupedConflicts.map((menu) => (
                            <Fragment key={menu.season_type}>
                                <tr className="border-b align-top">
                                    <td className="p-2 font-semibold capitalize">
                                        {menu.season_type}
                                        {Number(menu.is_active_menu) === 1 && (
                                            <span className="ml-2 inline-flex rounded-full bg-brand-warning/20 px-2 py-0.5 text-xs font-medium text-brand-warning">
                                                Attivo oggi
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-2 text-brand-textSecondary">
                                        {menu.items[0]?.season_start} →{' '}
                                        {menu.items[0]?.season_end}
                                    </td>
                                    <td className="p-2">
                                        {menu.total_occurrences}
                                    </td>
                                    <td className="p-2">
                                        <button
                                            type="button"
                                            className="font-medium text-brand-primary underline"
                                            onClick={() =>
                                                onToggleMenu(menu.season_type)
                                            }
                                        >
                                            {expandedMenus[menu.season_type]
                                                ? 'Nascondi'
                                                : 'Mostra'}
                                        </button>
                                    </td>
                                </tr>

                                {expandedMenus[menu.season_type] && (
                                    <tr className="border-b">
                                        <td colSpan={4} className="bg-black/[0.02] p-0">
                                            <table className="w-full border-collapse text-sm">
                                                <thead>
                                                    <tr className="border-b text-left">
                                                        <th className="p-2">Giorno</th>
                                                        <th className="p-2">Pasto</th>
                                                        <th className="p-2">Occorrenza</th>
                                                        <th className="p-2">Portata</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {menu.items.map((conflict) => (
                                                        <tr
                                                            key={conflict.id_dish_pairing}
                                                            className="border-b last:border-b-0"
                                                        >
                                                            <td className="p-2">
                                                                {formatMenuDay(
                                                                    conflict.day_index,
                                                                )}
                                                            </td>
                                                            <td className="p-2 capitalize">
                                                                {conflict.meal_type}
                                                            </td>
                                                            <td className="p-2">
                                                                {Number(
                                                                    conflict.first_choice,
                                                                ) === 1
                                                                    ? 'Piatto fisso'
                                                                    : 'Piatto del giorno'}
                                                            </td>
                                                            <td className="p-2 capitalize">
                                                                {conflict.course_type}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end gap-4">
                    <Button variant="underline" onClick={onClose}>
                        Annulla
                    </Button>

                    <Button variant="danger" onClick={onContinue}>
                        Continua con eliminazione
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
