// Shared top bar for user management pages.
// It keeps the same search + filter layout across different user lists.
import SearchInput from '../ui/SearchInput';
import Form from '../ui/Form';
import Button from '../ui/Button';

export default function UsersFiltersBar({
    searchPlaceholder,
    onSearch,
    formKey,
    initialValues,
    onSubmit,
    children,
}) {
    return (
        <div className="mt-1 mb-3 flex h-[60px] items-center justify-between">
            <SearchInput
                placeholder={searchPlaceholder}
                onSearch={onSearch}
                className="w-[400px] [&>input]:rounded-full"
            />

            <Form key={formKey} initialValues={initialValues} onSubmit={onSubmit}>
                <div className="flex items-center gap-5">
                    {children}

                    <Button
                        type="submit"
                        size="md"
                        variant="primary"
                        className="rounded-full px-4 py-2"
                    >
                        Applica filtri
                    </Button>
                </div>
            </Form>
        </div>
    );
}