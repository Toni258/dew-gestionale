// Table used by the mobile app user manager page.
// The page owns data loading and modals, while this component only renders rows.
import Pagination from '../ui/Pagination';
import { formatDateTime } from '../../utils/formatDateTime';
import { MOBILE_ROLE_LABELS } from '../../domain/users';

export default function MobileAppUsersTable({
    rows,
    loading,
    isSuperUser,
    total,
    page,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onEdit,
    onDisable,
    onDelete,
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-brand-divider bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full table-auto text-sm">
                <thead className="bg-brand-primary text-white">
                    <tr>
                        <th className="px-4 py-3 text-left">STATO</th>
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">RUOLO</th>
                        <th className="px-4 py-3 text-left">EMAIL</th>
                        <th className="px-4 py-3 text-left">UTENTE</th>
                        <th className="px-4 py-3 text-left">ACCEPTANCE IP</th>
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
                                colSpan={isSuperUser ? 8 : 7}
                                className="px-4 py-4 text-brand-textSecondary"
                            >
                                Nessun utente trovato.
                            </td>
                        </tr>
                    )}

                    {rows.map((user) => (
                        <tr key={user.id_caregiver} className="border-b">
                            <td className="px-4 py-3">
                                {user.is_disabled ? 'Disabilitato' : 'Abilitato'}
                            </td>
                            <td className="px-4 py-3">{user.id_caregiver}</td>
                            <td className="px-4 py-3">
                                {MOBILE_ROLE_LABELS[user.role] || user.role}
                            </td>
                            <td className="px-4 py-3">{user.email}</td>
                            <td className="px-4 py-3">
                                {user.name} {user.surname}
                            </td>
                            <td className="px-4 py-3">{user.acceptance_ip}</td>
                            <td className="px-4 py-3">
                                {formatDateTime(user.acceptance_time)}
                            </td>
                            {isSuperUser && (
                                <td className="px-4 py-3">
                                    <button
                                        className="text-red-500"
                                        onClick={() => onEdit(user)}
                                    >
                                        ✏
                                    </button>

                                    {!user.is_disabled && (
                                        <button
                                            className="ml-3 text-red-500"
                                            onClick={() => onDisable(user)}
                                        >
                                            🚫
                                        </button>
                                    )}

                                    <button
                                        className="ml-3 text-red-500"
                                        onClick={() => onDelete(user)}
                                    >
                                        🗑
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            <Pagination
                total={total}
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
}
