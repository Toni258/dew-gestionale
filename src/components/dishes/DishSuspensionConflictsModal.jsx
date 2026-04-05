// Modal shown when a dish suspension touches one or more menus.
// It keeps the conflict table out of the page component and makes
// the suspension workflow easier to read.
import { Fragment } from 'react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import SearchableSelect from '../ui/SearchableSelect';
import { buildDishSuspensionMenuKey } from '../../utils/dishes/dishSuspension';

export default function DishSuspensionConflictsModal({
    preview,
    groupedConflicts,
    expandedMenus,
    replacementByPairing,
    optionsByType,
    optionsLoading,
    optionsError,
    allSelected,
    onToggleMenu,
    onSelectReplacement,
    onClose,
    onSaveWithoutReplacement,
    onSaveAndReplace,
}) {
    if (!preview) return null;

    return (
        <Modal onClose={onClose}>
            <Card className="w-[900px] max-h-[80vh] overflow-y-auto p-6">
                <h2 className="text-2xl font-semibold mb-2">
                    Sospensione piatto – conflitti rilevati
                </h2>

                <p className="text-brand-textSecondary mb-4">
                    Il piatto <strong>{preview.dish.name}</strong> è presente
                    nei seguenti menù nel periodo selezionato. Procedendo verrà{' '}
                    <strong>rimosso automaticamente</strong>.
                </p>

                {preview.summary?.conflicts_in_active_menu > 0 && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-700">
                        <img
                            src="/icons/warning giallo.png"
                            alt="Avviso inattività"
                            className="h-5 w-5"
                            draggable={false}
                        />
                        <span>
                            Attenzione:{' '}
                            {preview.summary.conflicts_in_active_menu} conflitti
                            riguardano un <strong>menù attivo</strong>.
                        </span>
                    </div>
                )}

                <p className="mb-2 text-sm text-brand-textSecondary">
                    Menù coinvolti: <strong>{groupedConflicts.length}</strong> —
                    Occorrenze totali:{' '}
                    <strong>{preview.summary.conflicts_total}</strong>
                </p>

                {optionsError && (
                    <div className="mb-4 rounded-lg border border-brand-error/20 bg-brand-error/5 p-3 text-sm text-brand-error">
                        {optionsError}
                    </div>
                )}

                <table className="mb-6 w-full border border-brand-divider text-sm">
                    <thead className="bg-white/80">
                        <tr>
                            <th className="p-2 text-left">Menù</th>
                            <th className="p-2 text-left">Stato</th>
                            <th className="p-2 text-left">Occorrenze</th>
                            <th className="p-2 text-left">Tipo</th>
                            <th className="p-2 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedConflicts.map((menu) => {
                            const isExpanded =
                                !!expandedMenus[menu.season_type];
                            const isFixedOnly =
                                menu.fixed_occurrences ===
                                menu.total_occurrences;

                            return (
                                <Fragment key={menu.season_type}>
                                    <tr className="border-t border-brand-divider">
                                        <td className="p-2 font-medium">
                                            {menu.season_type}
                                        </td>
                                        <td className="p-2">
                                            {menu.is_active_menu ? (
                                                <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">
                                                    Attivo
                                                </span>
                                            ) : (
                                                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                                    Futuro
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            {menu.total_occurrences}
                                        </td>
                                        <td className="p-2">
                                            {isFixedOnly ? (
                                                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                                    Piatto fisso
                                                </span>
                                            ) : (
                                                <span className="rounded bg-green-100 px-2 py-1 text-xs text-gray-600">
                                                    Piatto del giorno
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onToggleMenu(
                                                        menu.season_type,
                                                    )
                                                }
                                                className="text-sm text-brand-primary hover:underline"
                                            >
                                                {isExpanded
                                                    ? 'Nascondi dettagli'
                                                    : 'Mostra dettagli'}
                                            </button>
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="bg-gray-50 p-3"
                                            >
                                                <table className="w-full border text-xs">
                                                    <thead>
                                                        <tr className="bg-gray-100">
                                                            <th className="p-1 text-left">
                                                                Giorno
                                                            </th>
                                                            <th className="p-1 text-left">
                                                                Pasto
                                                            </th>
                                                            <th className="p-1 text-left">
                                                                Tipo
                                                            </th>
                                                            <th className="p-1 text-left">
                                                                Portata
                                                            </th>
                                                            <th className="p-1 text-left">
                                                                Sostituzione
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {menu.items.map(
                                                            (
                                                                conflict,
                                                                index,
                                                            ) => {
                                                                const key =
                                                                    buildDishSuspensionMenuKey(
                                                                        conflict,
                                                                    );

                                                                return (
                                                                    <tr
                                                                        key={`${conflict.id_dish_pairing}-${index}`}
                                                                        className="border-t"
                                                                    >
                                                                        <td className="p-1">
                                                                            {conflict.meal_date ??
                                                                                `Giorno ${conflict.day_index + 1}`}
                                                                        </td>
                                                                        <td className="p-1 capitalize">
                                                                            {
                                                                                conflict.meal_type
                                                                            }
                                                                        </td>
                                                                        <td className="p-1">
                                                                            {conflict.first_choice ===
                                                                            1
                                                                                ? 'Piatto fisso'
                                                                                : 'Piatto del giorno'}
                                                                        </td>
                                                                        <td className="p-1 capitalize">
                                                                            {
                                                                                conflict.course_type
                                                                            }
                                                                        </td>
                                                                        <td className="w-[380px] p-1 ">
                                                                            <SearchableSelect
                                                                                value={
                                                                                    replacementByPairing[
                                                                                        conflict
                                                                                            .id_dish_pairing
                                                                                    ] ??
                                                                                    ''
                                                                                }
                                                                                className="text-sm"
                                                                                onChange={(
                                                                                    newValue,
                                                                                ) =>
                                                                                    onSelectReplacement(
                                                                                        conflict.id_dish_pairing,
                                                                                        newValue,
                                                                                    )
                                                                                }
                                                                                options={
                                                                                    optionsByType[
                                                                                        key
                                                                                    ] ??
                                                                                    []
                                                                                }
                                                                                placeholder={
                                                                                    optionsLoading
                                                                                        ? 'Caricamento sostituti…'
                                                                                        : 'Seleziona sostituto…'
                                                                                }
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            },
                                                        )}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>

                <div className="flex justify-end gap-4">
                    <Button variant="underline" onClick={onClose}>
                        Annulla
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={onSaveWithoutReplacement}
                    >
                        Salva sospensione (non sostituire)
                    </Button>

                    <Button
                        variant="primary"
                        disabled={optionsLoading || !allSelected}
                        onClick={onSaveAndReplace}
                    >
                        Salva e sostituisci
                    </Button>
                </div>
            </Card>
        </Modal>
    );
}
