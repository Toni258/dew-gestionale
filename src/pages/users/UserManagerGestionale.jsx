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
import ModifyUserPasswordModal from '../../components/modals/ModifyUserPasswordModal';
import DeleteUserModal from '../../components/modals/DeleteUserModal';
import SuspendUserModal from '../../components/modals/SuspendUserModal';
import EnableUserModal from '../../components/modals/EnableUserModal';

export default function UserManagerGestionale() {
    const { user, isSuperUser, refreshMe } = useAuth();
    const myId = user?.id;

    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        ruolo: '',
        status: '',
    });

    const [showModifyUserInfoModal, setShowModifyUserInfoModal] =
        useState(false);
    const [showPasswordChangeModal, setShowPasswordChangeModal] =
        useState(false);
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [showDisableUserModal, setShowDisableUserModal] = useState(false);
    const [showEnableUserModal, setShowEnableUserModal] = useState(false);
    const [userSelected, setUserSelected] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const STATUS_LABELS = {
        active: 'Attivo',
        suspended: 'Sospeso',
        must_change_password: 'Password da cambiare',
    };

    // Applica filtri: li “blocchi” e resetti pagina a 1
    const handleFilters = (values) => {
        setAppliedFilters({
            ruolo: values.ruolo || '',
            status: values.status || '',
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
            status: appliedFilters.status || '',
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
            if (requestParams.status) qs.set('status', requestParams.status);
            qs.set('page', String(requestParams.page));
            qs.set('pageSize', String(requestParams.pageSize));

            const res = await fetch(`/api/users/gestionale?${qs.toString()}`, {
                method: 'GET',
                credentials: 'include',
            });
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
        <AppLayout title="GESTIONE UTENTI" username="Antonio">
            <h1 className="text-3xl font-semibold">
                Elenco utenti del gestionale
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
                        ruolo: appliedFilters.ruolo,
                        status: appliedFilters.status,
                    }}
                    onSubmit={handleFilters}
                >
                    <div className="flex items-center gap-5">
                        <FormGroup name="ruolo" className="w-[145px]">
                            <CustomSelect
                                name="ruolo"
                                placeholder="Ruolo utente"
                                options={[
                                    { value: '', label: '— Tutti —' },
                                    {
                                        value: 'super_user',
                                        label: 'Super User',
                                    },
                                    { value: 'operator', label: 'Operatore' },
                                ]}
                                height="h-[45px]"
                                className="w-full [&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup name="status" className="w-[210px]">
                            <CustomSelect
                                name="status"
                                placeholder="Stato utente"
                                options={[
                                    { value: '', label: '— Tutti —' },
                                    {
                                        value: 'active',
                                        label: 'Attivo',
                                    },
                                    {
                                        value: 'must_change_password',
                                        label: 'Password da cambiare',
                                    },
                                    { value: 'suspended', label: 'Sospeso' },
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
                            <th className="px-4 py-3 text-left">RUOLO</th>
                            <th className="px-4 py-3 text-left">EMAIL</th>
                            <th className="px-4 py-3 text-left">UTENTE</th>
                            <th className="px-4 py-3 text-left">STATO</th>
                            <th className="px-4 py-3 text-left">
                                ULTIMO ACCESSO
                            </th>
                            <th className="px-4 py-3 text-left">CREATO IL</th>
                            <th className="px-4 py-3 text-left">
                                ULTIMA MODIFICA
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
                                    colSpan={isSuperUser ? 8 : 7}
                                    className="px-4 py-4 text-brand-textSecondary"
                                >
                                    Nessun utente trovato.
                                </td>
                            </tr>
                        )}

                        {rows.map((user) => {
                            const isDisabled = user.status === 'suspended';
                            const isMe = myId === user.id;

                            return (
                                <tr key={user.id} className="border-b">
                                    <td className="px-4 py-3">
                                        <span>
                                            {user.role == 'super_user'
                                                ? 'Super user'
                                                : 'Operatore'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>{user.email}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>
                                            {user.name} {user.surname}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>
                                            {STATUS_LABELS[user.status] ||
                                                user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>
                                            {formatDateTime(user.last_login_at)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>
                                            {formatDateTime(user.created_at)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>
                                            {formatDateTime(user.updated_at)}
                                        </span>
                                    </td>

                                    {isSuperUser && (
                                        <td className="px-4 py-3">
                                            <button
                                                className="text-red-500"
                                                onClick={() => {
                                                    setUserSelected(user);
                                                    setShowModifyUserInfoModal(
                                                        true,
                                                    );
                                                }}
                                            >
                                                ✏
                                            </button>
                                            <button
                                                className="ml-3 text-red-500"
                                                onClick={() => {
                                                    setUserSelected(user);
                                                    setShowPasswordChangeModal(
                                                        true,
                                                    );
                                                }}
                                            >
                                                🔑
                                            </button>
                                            {isDisabled && !isMe && (
                                                <button
                                                    className="ml-3 text-red-500"
                                                    onClick={() => {
                                                        setUserSelected(user);
                                                        setShowEnableUserModal(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    🔓
                                                </button>
                                            )}

                                            {!isDisabled && !isMe && (
                                                <button
                                                    className="ml-3 text-red-500"
                                                    onClick={() => {
                                                        setUserSelected(user);
                                                        setShowDisableUserModal(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    🚫
                                                </button>
                                            )}

                                            {/* delete: non puoi eliminare te stesso */}
                                            {!isMe && (
                                                <button
                                                    className="ml-3 text-red-500"
                                                    onClick={() => {
                                                        setUserSelected(user);
                                                        setShowDeleteUserModal(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    🗑
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
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
                onClose={() => {
                    setUserSelected(null);
                    setShowModifyUserInfoModal(false);
                }}
                onConfirm={async (payload) => {
                    try {
                        const res = await fetch(
                            `/api/users/${userSelected.id}/update-info`,
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

                        // se ho modificato me stesso, riallineo subito i dati in AuthContext
                        if (userSelected?.id === user?.id) {
                            await refreshMe();
                        }

                        setUserSelected(null);
                        setShowModifyUserInfoModal(false);
                        await fetchUsers();
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            {/* MODALE REIMPOSTA PASSWORD UTENTE */}
            <ModifyUserPasswordModal
                show={showPasswordChangeModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowPasswordChangeModal(false);
                }}
                onConfirm={async (values) => {
                    try {
                        console.log('Cambio password', {
                            id: userSelected?.id,
                            email: userSelected?.email,
                            new_password: values.new_password,
                        });

                        const res = await fetch(
                            `/api/users/${userSelected.id}/reset-password`,
                            {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    newPassword: values.new_password,
                                }),
                            },
                        );

                        setUserSelected(null);
                        setShowPasswordChangeModal(false);
                        await fetchUsers();
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            {/* MODALE DISABILITA UTENTE */}
            <SuspendUserModal
                show={showDisableUserModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowDisableUserModal(false);
                }}
                onConfirm={async () => {
                    try {
                        const res = await fetch(
                            `/api/users/${userSelected.id}/suspend`,
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

                        setUserSelected(null);
                        setShowDisableUserModal(false);
                        await fetchUsers();
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            {/* MODALE DISABILITA UTENTE */}
            <EnableUserModal
                show={showEnableUserModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowEnableUserModal(false);
                }}
                onConfirm={async () => {
                    try {
                        const res = await fetch(
                            `/api/users/${userSelected.id}/unsuspend`,
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

                        setUserSelected(null);
                        setShowEnableUserModal(false);
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
                        const res = await fetch(
                            `/api/users/${userSelected.id}/delete`,
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
