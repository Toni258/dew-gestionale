import AppLayout from '../../components/layout/AppLayout';
import { useCallback, useEffect, useMemo, useState } from 'react';

import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';

import { formatDateTime } from '../../utils/formatDateTime';
import { useAuth } from '../../context/AuthContext';

import ModifyUserInfoModal from '../../components/modals/ModifyUserInfoModal';
import DisableAppUserPassword from '../../components/modals/DisableAppUserPassword';
import DeleteUserModal from '../../components/modals/DeleteUserModal';

export default function UserManagerMobileApp() {
    const { isSuperUser } = useAuth();

    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        ruolo: '',
    });

    const [showModifyUserInfoModal, setShowModifyUserInfoModal] =
        useState(false);
    const [showDisableAppUserModal, setShowDisableAppUserModal] =
        useState(false);
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [userSelected, setUserSelected] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const STATUS_LABELS = {
        Altro: 'Altro',
        caregiver: 'Caregiver',
        super_user: 'Super User',
    };

    // Applica filtri: li “blocchi” e resetti pagina a 1
    const handleFilters = (values) => {
        setAppliedFilters({
            ruolo: values.ruolo || '',
        });
        setPage(1);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

    // Payload “finale” usato per chiamare API
    const requestParams = useMemo(() => {
        return {
            search: query,
            ruolo: appliedFilters.ruolo || '',
            page,
            pageSize,
        };
    }, [query, appliedFilters, page, pageSize]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const qs = new URLSearchParams();
            if (requestParams.search) qs.set('search', requestParams.search);
            if (requestParams.ruolo) qs.set('ruolo', requestParams.ruolo);
            qs.set('page', String(requestParams.page));
            qs.set('pageSize', String(requestParams.pageSize));

            const res = await fetch(`/api/users/mobile?${qs.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            setRows(json.data || []);
            setTotal(json.total || 0);
        } catch {
            setError('Errore nel caricamento degli utenti.');
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    // Caricamento iniziale + quando cambiano filtri applicati/pagina/query
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return (
        <AppLayout title="GESTIONE UTENTI">
            <h1 className="text-3xl font-semibold">
                Elenco utenti dell'app mobile
            </h1>

            {/* BARRA FILTRI */}
            <div className="mt-1 mb-3 h-[60px] flex justify-between items-center">
                {/* SEARCH INPUT */}
                <SearchInput
                    placeholder="Cerca un utente per nome..."
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
                        <FormGroup name="ruolo" className="w-[145px]">
                            <CustomSelect
                                name="ruolo"
                                placeholder="Ruolo utente"
                                options={[
                                    { value: '', label: '— Ruolo —' },
                                    {
                                        value: 'super_user',
                                        label: 'Super User',
                                    },
                                    { value: 'caregiver', label: 'Caregiver' },
                                    { value: 'altro', label: 'Altro' },
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

            <div className="bg-white border border-brand-divider rounded-xl overflow-hidden">
                <table className="w-full text-sm table-auto">
                    <thead className="bg-brand-primary text-white">
                        <tr>
                            <th className="px-4 py-3 text-left">ID</th>
                            <th className="px-4 py-3 text-left">RUOLO</th>
                            <th className="px-4 py-3 text-left">EMAIL</th>
                            <th className="px-4 py-3 text-left">UTENTE</th>
                            <th className="px-4 py-3 text-left">
                                ACCEPTANCE IP
                            </th>
                            <th className="px-4 py-3 text-left">
                                ACCEPTANCE TIME
                            </th>
                            {isSuperUser && (
                                <th className="px-4 py-3 text-left">AZIONI</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={isSuperUser ? 7 : 6}
                                    className="px-4 py-4 text-brand-textSecondary"
                                >
                                    Nessun utente trovato.
                                </td>
                            </tr>
                        )}

                        {rows.map((r) => (
                            <tr key={r.id_caregiver} className="border-b">
                                <td className="px-4 py-3">{r.id_caregiver}</td>
                                <td className="px-4 py-3">
                                    {STATUS_LABELS[r.role] || r.role}
                                </td>
                                <td className="px-4 py-3">{r.email}</td>
                                <td className="px-4 py-3">
                                    {r.name} {r.surname}
                                </td>
                                <td className="px-4 py-3">{r.acceptance_ip}</td>
                                <td className="px-4 py-3">
                                    {formatDateTime(r.acceptance_time)}
                                </td>
                                {isSuperUser && (
                                    <td className="px-4 py-3">
                                        <button
                                            className="text-red-500"
                                            onClick={() => {
                                                setUserSelected(r);
                                                setShowModifyUserInfoModal(
                                                    true,
                                                );
                                            }}
                                        >
                                            ✏
                                        </button>
                                        {!r.is_disabled && (
                                            <button
                                                className="ml-3 text-red-500"
                                                onClick={() => {
                                                    setUserSelected(r);
                                                    setShowDisableAppUserModal(
                                                        true,
                                                    );
                                                }}
                                            >
                                                🚫
                                            </button>
                                        )}

                                        <button
                                            className="ml-3 text-red-500"
                                            onClick={() => {
                                                setUserSelected(r);
                                                setShowDeleteUserModal(true);
                                            }}
                                        >
                                            🗑
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <Pagination
                    total={total}
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    loading={loading}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                />
            </div>

            {/* MODALE MODIFICA INFO UTENTE */}
            <ModifyUserInfoModal
                show={showModifyUserInfoModal}
                user={userSelected}
                ruoli={[
                    {
                        value: 'super_user',
                        label: 'Super User',
                    },
                    { value: 'caregiver', label: 'Caregiver' },
                    { value: 'Altro', label: 'Altro' },
                ]}
                onClose={() => {
                    setUserSelected(null);
                    setShowModifyUserInfoModal(false);
                }}
                onConfirm={async (payload) => {
                    try {
                        console.log('Cambio info utente', payload);

                        const res = await fetch(
                            `/api/users/${userSelected.id_caregiver}/update-info/app`,
                            {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: payload.name,
                                    surname: payload.surname,
                                    email: payload.email,
                                    role: payload.role,
                                }),
                            },
                        );

                        const json = await res.json().catch(() => null);
                        if (!res.ok)
                            throw new Error(
                                json?.message || `HTTP ${res.status}`,
                            );

                        alert('Informazioni utente aggiornate correttamente');

                        setUserSelected(null);
                        setShowModifyUserInfoModal(false);
                        await fetchUsers();
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            {/* MODALE REIMPOSTA PASSWORD UTENTE */}
            <DisableAppUserPassword
                show={showDisableAppUserModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowDisableAppUserModal(false);
                }}
                onConfirm={async (values) => {
                    try {
                        console.log('Disabilita utente', {
                            id_caregiver: userSelected?.id_caregiver,
                            email: userSelected?.email,
                        });

                        const res = await fetch(
                            `/api/users/${userSelected.id_caregiver}/disable/app`,
                            {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                            },
                        );

                        alert('Utente disabilitato correttamente');

                        const json = await res.json().catch(() => null);
                        if (!res.ok)
                            throw new Error(
                                json?.message || `HTTP ${res.status}`,
                            );

                        setUserSelected(null);
                        setShowDisableAppUserModal(false);
                        await fetchUsers();
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            {/* MODALE ELIMINA UTENTE */}
            <DeleteUserModal
                show={showDeleteUserModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowDeleteUserModal(false);
                }}
                onConfirm={async () => {
                    try {
                        console.log(
                            'Elimina user',
                            userSelected.id_caregiver,
                            userSelected.name,
                            userSelected.surname,
                        );

                        const res = await fetch(
                            `/api/users/${userSelected.id_caregiver}/delete/app`,
                            {
                                method: 'POST',
                                credentials: 'include',
                            },
                        );

                        const json = await res.json().catch(() => null);
                        if (!res.ok)
                            throw new Error(
                                json?.message || `HTTP ${res.status}`,
                            );

                        alert('Utente eliminato correttamente');
                        setUserSelected(null);
                        setShowDeleteUserModal(false);
                        await fetchUsers();
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />
        </AppLayout>
    );
}
