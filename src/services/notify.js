// src/services/notify.js
let api = null;

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

export function registerNotify(nextApi) {
    api = nextApi;
}
