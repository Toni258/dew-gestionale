import AppLayout from '../../components/layout/AppLayout';
import { NavLink } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import MultiSelectCheckbox from '../../components/ui/MultiSelectCheckbox';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import PageButton from '../../components/ui/PageButton';

import { formatNumber } from '../../utils/format';

function StatusDot({ status }) {
    const color =
        status === 'attivo'
            ? 'bg-green-500'
            : status === 'sospeso'
            ? 'bg-yellow-400'
            : 'bg-red-500';

    return <span className={`w-3 h-3 rounded-full inline-block ${color}`} />;
}

const ALLERGENS = [
    { key: 'glutine', label: 'Glutine', emoji: '🌾', patterns: ['glutine'] },
    {
        key: 'latte',
        label: 'Latte / Lattosio',
        emoji: '🥛',
        patterns: ['latte', 'lattosio'],
    },
    { key: 'uova', label: 'Uova', emoji: '🥚', patterns: ['uova'] },
    { key: 'arachidi', label: 'Arachidi', emoji: '🥜', patterns: ['arachidi'] },
    {
        key: 'frutta_guscio',
        label: 'Frutta a guscio',
        emoji: '🌰',
        patterns: ['frutta a guscio', 'frutta secca'],
    },
    { key: 'pesce', label: 'Pesce', emoji: '🐟', patterns: ['pesce'] },
    {
        key: 'crostacei',
        label: 'Crostacei',
        emoji: '🦐',
        patterns: ['crostacei'],
    },
    {
        key: 'molluschi',
        label: 'Molluschi',
        emoji: '🦑',
        patterns: ['molluschi'],
    },
    { key: 'soia', label: 'Soia', emoji: '🌱', patterns: ['soia'] },
    { key: 'sedano', label: 'Sedano', emoji: '🥬', patterns: ['sedano'] },
    { key: 'senape', label: 'Senape', emoji: '🌿', patterns: ['senape'] },
    {
        key: 'sesamo',
        label: 'Semi di sesamo',
        emoji: '⚫',
        patterns: ['sesamo'],
    },
    {
        key: 'solfiti',
        label: 'Anidride solforosa e solfiti',
        emoji: '🍷',
        patterns: ['solfiti', 'anidride solforosa'],
    },
    { key: 'lupini', label: 'Lupini', emoji: '🌻', patterns: ['lupini'] },
];

function extractAllergenEmojis(allergyNotes) {
    if (!allergyNotes) return [];

    const text = String(allergyNotes).toLowerCase();

    return ALLERGENS.filter((a) =>
        a.patterns.some((p) => text.includes(p))
    ).map((a) => ({ emoji: a.emoji, label: a.label, key: a.key }));
}

export default function DishesList() {
    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        stato: '',
        tipologia: '',
        allergeni: [],
    });

    const [showAllergensInfo, setShowAllergensInfo] = useState(false);

    const [page, setPage] = useState(1);
    const pageSize = 12;

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Payload “finale” usato per chiamare API
    const requestParams = useMemo(() => {
        return {
            search: query,
            stato: appliedFilters.stato || '',
            tipologia: appliedFilters.tipologia || '',
            allergeni: appliedFilters.allergeni || [],
            page,
            pageSize,
        };
    }, [query, appliedFilters, page]);

    const fetchDishes = async () => {
        setLoading(true);
        setError('');

        try {
            const qs = new URLSearchParams();
            if (requestParams.search) qs.set('search', requestParams.search);
            if (requestParams.stato) qs.set('stato', requestParams.stato);
            if (requestParams.tipologia)
                qs.set('tipologia', requestParams.tipologia);
            qs.set('page', String(requestParams.page));
            qs.set('pageSize', String(requestParams.pageSize));
            (requestParams.allergeni || []).forEach((a) =>
                qs.append('allergeni', a)
            );

            const res = await fetch(`/api/dishes?${qs.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            setRows(json.data || []);
            setTotal(json.total || 0);
        } catch (e) {
            setError('Errore nel caricamento piatti.');
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    // Caricamento iniziale + quando cambiano filtri applicati/pagina/query
    useEffect(() => {
        fetchDishes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestParams]);

    // Applica filtri: li “blocchi” e resetti pagina a 1
    const handleFilters = (values) => {
        setAppliedFilters({
            stato: values.stato || '',
            tipologia: values.tipologia || '',
            allergeni: values.allergeni || [],
        });
        setPage(1);
    };

    return (
        <AppLayout title="GESTIONE PIATTI" username="Antonio">
            <h1 className="text-3xl font-semibold">Elenco piatti</h1>

            {/* BARRA FILTRI */}
            <div className="mt-1 mb-3 h-[60px] flex justify-between items-center">
                {/* SEARCH INPUT */}
                <SearchInput
                    placeholder="Cerca un piatto per nome..."
                    onSearch={(q) => {
                        setQuery(q);
                        setPage(1);
                    }}
                    className="w-[400px] [&>input]:rounded-full"
                />

                {/* FILTRI */}
                <Form
                    initialValues={{
                        stato: appliedFilters.stato,
                        allergeni: appliedFilters.allergeni,
                        tipologia: appliedFilters.tipologia,
                    }}
                    onSubmit={handleFilters}
                >
                    <div className="flex items-center gap-5">
                        <FormGroup name="stato" className="w-[145px]">
                            <CustomSelect
                                name="stato"
                                placeholder="Stato piatto"
                                options={[
                                    { value: '', label: '— Stato —' },
                                    { value: 'attivo', label: 'Attivo' },
                                    { value: 'sospeso', label: 'Sospeso' },
                                    { value: 'inattivo', label: 'Inattivo' },
                                ]}
                                height="h-[45px]"
                                className="w-full [&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup name="allergeni" className="w-[180px]">
                            <MultiSelectCheckbox
                                name="allergeni"
                                placeholder="Allergeni esclusi"
                                options={[
                                    { value: 'glutine', label: 'Glutine' },
                                    {
                                        value: 'latte',
                                        label: 'Latte / Lattosio',
                                    },
                                    { value: 'uova', label: 'Uova' },
                                    { value: 'arachidi', label: 'Arachidi' },
                                    {
                                        value: 'frutta a guscio',
                                        label: 'Frutta a guscio',
                                    },
                                    { value: 'pesce', label: 'Pesce' },
                                    { value: 'crostacei', label: 'Crostacei' },
                                    { value: 'molluschi', label: 'Molluschi' },
                                    { value: 'soia', label: 'Soia' },
                                    { value: 'sedano', label: 'Sedano' },
                                    {
                                        value: 'sesamo',
                                        label: 'Semi di sesamo',
                                    },
                                    {
                                        value: 'anidride solforosa e solfiti',
                                        label: 'Anidride solforosa e solfiti',
                                    },
                                    { value: 'lupini', label: 'Lupini' },
                                ]}
                                height="h-[45px]"
                                className="[&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup name="tipologia" className="w-[145px]">
                            <CustomSelect
                                name="tipologia"
                                placeholder="Tutti i tipi"
                                options={[
                                    { value: '', label: '— Tipologia —' },
                                    { value: 'primo', label: 'Primo' },
                                    { value: 'secondo', label: 'Secondo' },
                                    { value: 'contorno', label: 'Contorno' },
                                    { value: 'ultimo', label: 'Ultimo' },
                                    { value: 'speciale', label: 'Speciale' },
                                    { value: 'coperto', label: 'Coperto' },
                                ]}
                                height="h-[45px]"
                                className="w-full [&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <Button
                            type="submit"
                            size="md"
                            variant="primary"
                            className="px-4 py-2 rounded-full"
                        >
                            Applica filtri
                        </Button>
                    </div>
                </Form>
            </div>

            {/* TABELLA */}
            <div className="bg-white border border-brand-divider rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm table-auto">
                        <thead className="bg-brand-primary text-white">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap text-center">
                                    STATO
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap text-left">
                                    NOME
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap text-left">
                                    TIPO
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap text-left">
                                    PESO (G)
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap text-left">
                                    KCAL
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap text-left">
                                    MACRO (G)
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap text-left">
                                    <div className="flex items-center gap-2">
                                        <span>ALLERGENI</span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowAllergensInfo(true)
                                            }
                                            className="hover:opacity-80"
                                        >
                                            <img
                                                src="/information bianco.png"
                                                alt="Legenda allergeni"
                                                className="w-4 h-4"
                                            />
                                        </button>
                                    </div>
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap text-left">
                                    AZIONI
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td
                                        className="px-4 py-4 text-brand-textSecondary"
                                        colSpan={8}
                                    >
                                        Nessun piatto trovato.
                                    </td>
                                </tr>
                            )}

                            {rows.map((r) => (
                                <tr
                                    key={`${r.id_food}`}
                                    className="border-t border-brand-divider"
                                >
                                    <td className="px-4 py-3 text-center">
                                        <StatusDot status={r.status} />
                                    </td>
                                    <td className="px-4 py-3">{r.name}</td>
                                    <td className="px-4 py-3">
                                        <span className="bg-brand-primary/50 px-3 py-1 rounded-full ">
                                            {r.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatNumber(r.grammage_tot)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatNumber(r.kcal_tot)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span title="Proteine | Carboidrati | Grassi">
                                            🥩 {formatNumber(r.proteins)}
                                            <span className="mx-1 text-brand-textSecondary">
                                                |
                                            </span>
                                            🍞 {formatNumber(r.carbs)}
                                            <span className="mx-1 text-brand-textSecondary">
                                                |
                                            </span>
                                            🧈 {formatNumber(r.fats)}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        {(() => {
                                            const found = extractAllergenEmojis(
                                                r.allergy_notes
                                            );

                                            if (found.length === 0)
                                                return (
                                                    <span className="text-brand-textSecondary select-none">
                                                        —
                                                    </span>
                                                );

                                            return (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {found.map((a) => (
                                                        <span
                                                            key={a.key}
                                                            title={a.label}
                                                            className="text-base cursor-help select-none"
                                                        >
                                                            {a.emoji}
                                                        </span>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 ">
                                        <NavLink
                                            to={`/dishes/edit/${r.id_food}`}
                                            className="text-brand-primary text-base font-semibold hover:underline select-none"
                                        >
                                            ✏
                                        </NavLink>

                                        {/* Cestino SOLO se piatto non attivo */}
                                        {r.status === 'non_attivo' && (
                                            <button
                                                type="button"
                                                title="Piatto non attivo"
                                                className="text-red-500 hover:scale-110 transition ml-3 select-none text-base"
                                                onClick={() => {
                                                    // per ora solo placeholder
                                                    console.log(
                                                        'Cestino per piatto',
                                                        r.id_food
                                                    );
                                                }}
                                            >
                                                🗑
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* MODALE LEGENDA ALLERGENI */}
                    {showAllergensInfo && (
                        <Modal onClose={() => setShowAllergensInfo(false)}>
                            <div className="bg-white rounded-xl p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-brand-text text-xl font-bold">
                                        Legenda allergeni
                                    </h2>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowAllergensInfo(false)
                                        }
                                        className="p-1 hover:opacity-70 transition"
                                        aria-label="Chiudi"
                                    >
                                        <img
                                            src="/cancel.png"
                                            alt="Chiudi"
                                            className="w-5 h-5"
                                        />
                                    </button>
                                </div>

                                {/* WRAPPER */}
                                <div className="mb-4 rounded-lg border border-brand-divider overflow-hidden">
                                    <table className="w-full text-sm border-collapse">
                                        <thead className="bg-brand-text text-white">
                                            <tr>
                                                <th className="pl-6 pr-28 py-2 text-left">
                                                    Allergene
                                                </th>
                                                <th className="pl-4 pr-6 py-2 text-left">
                                                    Emoji
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Glutine
                                                </td>
                                                <td className="px-4 py-2">
                                                    🌾
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Latte / Lattosio
                                                </td>
                                                <td className="px-4 py-2">
                                                    🥛
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Uova
                                                </td>
                                                <td className="px-4 py-2">
                                                    🥚
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Arachidi
                                                </td>
                                                <td className="px-4 py-2">
                                                    🥜
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Frutta a guscio
                                                </td>
                                                <td className="px-4 py-2">
                                                    🌰
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Pesce
                                                </td>
                                                <td className="px-4 py-2">
                                                    🐟
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Crostacei
                                                </td>
                                                <td className="px-4 py-2">
                                                    🦐
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Molluschi
                                                </td>
                                                <td className="px-4 py-2">
                                                    🦑
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Soia
                                                </td>
                                                <td className="px-4 py-2">
                                                    🌱
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Sedano
                                                </td>
                                                <td className="px-4 py-2">
                                                    🥬
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Senape
                                                </td>
                                                <td className="px-4 py-2">
                                                    🌿
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Semi di sesamo
                                                </td>
                                                <td className="px-4 py-2">
                                                    ⚫
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Anidride solforosa e solfiti
                                                </td>
                                                <td className="px-4 py-2">
                                                    🍷
                                                </td>
                                            </tr>
                                            <tr className="border-t border-brand-divider">
                                                <td className="px-6 py-2">
                                                    Lupini
                                                </td>
                                                <td className="px-4 py-2">
                                                    🌻
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Modal>
                    )}
                </div>

                {/* PAGINAZIONE */}
                <div className="px-4 py-3 border-t border-brand-divider flex justify-center items-center gap-2">
                    {/* PREV */}
                    <button
                        type="button"
                        disabled={page === 1 || loading}
                        onClick={() => setPage(page - 1)}
                        className="
            p-2 rounded-full border border-brand-divider
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-black/5 transition
        "
                        aria-label="Pagina precedente"
                    >
                        <img
                            src="/Chevron sinistra nero.png"
                            draggable="false"
                            alt="Precedente"
                            className="w-5 h-5 select-none"
                        />
                    </button>

                    {/* PAGINA 1 */}
                    <PageButton pageNum={1} current={page} onClick={setPage} />

                    {/* ... prima */}
                    {page > 3 && (
                        <span className="px-2 text-brand-textSecondary select-none">
                            …
                        </span>
                    )}

                    {/* PAGINE CENTRALI */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                            (p) =>
                                p !== 1 &&
                                p !== totalPages &&
                                Math.abs(p - page) <= 1
                        )
                        .map((p) => (
                            <PageButton
                                key={p}
                                pageNum={p}
                                current={page}
                                onClick={setPage}
                            />
                        ))}

                    {/* ... dopo */}
                    {page < totalPages - 2 && (
                        <span className="px-2 text-brand-textSecondary select-none">
                            …
                        </span>
                    )}

                    {/* ULTIMA PAGINA */}
                    {totalPages > 1 && (
                        <PageButton
                            pageNum={totalPages}
                            current={page}
                            onClick={setPage}
                        />
                    )}

                    {/* NEXT */}
                    <button
                        type="button"
                        disabled={page === totalPages || loading}
                        onClick={() => setPage(page + 1)}
                        className="
            p-2 rounded-full border border-brand-divider
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-black/5 transition
        "
                        aria-label="Pagina successiva"
                    >
                        <img
                            src="/Chevron destra nero.png"
                            draggable="false"
                            alt="Successiva"
                            className="w-5 h-5 select-none"
                        />
                    </button>
                </div>
            </div>

            {/* STATO */}
            {error && <div className="text-brand-error mb-2">{error}</div>}
            {loading && <div className="mb-2">Caricamento…</div>}
        </AppLayout>
    );
}
