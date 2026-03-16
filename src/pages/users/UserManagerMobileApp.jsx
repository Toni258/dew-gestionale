// Mobile app user manager page.
// Shared table and filter helpers keep the page focused on actions and modals.
import { useState } from 'react';

import AppLayout from '../../components/layout/AppLayout';
import FormGroup from '../../components/ui/FormGroup';
import CustomSelect from '../../components/ui/CustomSelect';
import UsersFiltersBar from '../../components/users/UsersFiltersBar';
import MobileAppUsersTable from '../../components/users/MobileAppUsersTable';
import ModifyUserInfoModal from '../../components/modals/ModifyUserInfoModal';
import DisableAppUserPassword from '../../components/modals/DisableAppUserPassword';
import DeleteUserModal from '../../components/modals/DeleteUserModal';

import { useAuth } from '../../context/AuthContext';
import { withLoaderNotify } from '../../services/withLoaderNotify';
import { useUsersTable } from '../../hooks/users/useUsersTable';
import {
    deleteMobileAppUser,
    disableMobileAppUser,
    getMobileAppUsers,
    updateMobileAppUserInfo,
} from '../../services/usersApi';
import {
    MOBILE_MODAL_ROLE_OPTIONS,
    MOBILE_ROLE_OPTIONS,
} from '../../domain/users';

export default function UserManagerMobileApp() {
    const { isSuperUser } = useAuth();

    const [showModifyUserInfoModal, setShowModifyUserInfoModal] =
        useState(false);
    const [showDisableAppUserModal, setShowDisableAppUserModal] =
        useState(false);
    // Main state used by the page
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [userSelected, setUserSelected] = useState(null);

    const {
        appliedFilters,
        page,
        pageSize,
        rows,
        total,
        totalPages,
        loading,
        handleSearch,
        applyFilters,
        handlePageSizeChange,
        setPage,
        fetchRows,
    } = useUsersTable({
        initialFilters: {
            ruolo: '',
        },
        fetcher: getMobileAppUsers,
    });

    // Clears the value used by selection.
    function clearSelection() {
        setUserSelected(null);
        setShowModifyUserInfoModal(false);
        setShowDisableAppUserModal(false);
        setShowDeleteUserModal(false);
    }

    return (
        <AppLayout title="GESTIONE UTENTI">
            <h1 className="text-3xl font-semibold">
                Elenco utenti dell'app mobile
            </h1>

            <UsersFiltersBar
                searchPlaceholder="Cerca un utente per nome..."
                onSearch={handleSearch}
                formKey={appliedFilters.ruolo}
                initialValues={{
                    ruolo: appliedFilters.ruolo,
                }}
                onSubmit={(values) =>
                    applyFilters({
                        ruolo: values.ruolo || '',
                    })
                }
            >
                <FormGroup name="ruolo" className="w-[145px]">
                    <CustomSelect
                        name="ruolo"
                        placeholder="Ruolo utente"
                        options={MOBILE_ROLE_OPTIONS}
                        height="h-[45px]"
                        className="w-full [&>div>button]:rounded-full"
                    />
                </FormGroup>
            </UsersFiltersBar>

            <MobileAppUsersTable
                rows={rows}
                loading={loading}
                isSuperUser={isSuperUser}
                total={total}
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                onEdit={(selectedUser) => {
                    setUserSelected(selectedUser);
                    setShowModifyUserInfoModal(true);
                }}
                onDisable={(selectedUser) => {
                    setUserSelected(selectedUser);
                    setShowDisableAppUserModal(true);
                }}
                onDelete={(selectedUser) => {
                    setUserSelected(selectedUser);
                    setShowDeleteUserModal(true);
                }}
            />

            <ModifyUserInfoModal
                show={showModifyUserInfoModal}
                user={userSelected}
                ruoli={MOBILE_MODAL_ROLE_OPTIONS}
                onClose={clearSelection}
                onConfirm={async (payload) => {
                    const result = await withLoaderNotify({
                        message: 'Salvataggio modifiche…',
                        mode: 'blocking',
                        success: 'Informazioni utente aggiornate correttamente',
                        errorTitle: 'Errore aggiornamento utente',
                        errorMessage:
                            'Impossibile aggiornare le informazioni utente.',
                        fn: async () => {
                            await updateMobileAppUserInfo(
                                userSelected.id_caregiver,
                                {
                                    name: payload.name,
                                    surname: payload.surname,
                                    email: payload.email,
                                    role: payload.role,
                                },
                            );

                            clearSelection();
                            await fetchRows();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />

            <DisableAppUserPassword
                show={showDisableAppUserModal}
                user={userSelected}
                onClose={clearSelection}
                onConfirm={async () => {
                    const result = await withLoaderNotify({
                        message: 'Disabilitazione utente…',
                        mode: 'blocking',
                        success: 'Utente disabilitato correttamente',
                        errorTitle: 'Errore disabilitazione utente',
                        errorMessage: 'Impossibile disabilitare l’utente.',
                        fn: async () => {
                            await disableMobileAppUser(
                                userSelected.id_caregiver,
                            );

                            clearSelection();
                            await fetchRows();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />

            <DeleteUserModal
                show={showDeleteUserModal}
                user={userSelected}
                onClose={clearSelection}
                onConfirm={async () => {
                    const result = await withLoaderNotify({
                        message: 'Eliminazione utente…',
                        mode: 'blocking',
                        success: 'Utente eliminato correttamente',
                        errorTitle: 'Errore eliminazione utente',
                        errorMessage: 'Impossibile eliminare l’utente.',
                        fn: async () => {
                            await deleteMobileAppUser(
                                userSelected.id_caregiver,
                            );

                            clearSelection();
                            await fetchRows();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />
        </AppLayout>
    );
}