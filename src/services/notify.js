// Frontend service helpers for notify.
let api = null;

// Helper function used by notify.
export const notify = {
    success(message, title) {
        api?.success?.({ message, title });
    },
    info(message, title) {
        api?.info?.({ message, title });
    },
    warning(message, title) {
        api?.warning?.({ message, title });
    },
    error(message, title) {
        api?.error?.({ message, title });
    },
};

// Helper function used by register notify.
export function registerNotify(nextApi) {
    api = nextApi;
}