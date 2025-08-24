// resources/js/Utils/formatDate.js

import dayjs from "dayjs";

/**
 * Format tanggal menggunakan settings aplikasi.
 * @param {string|Date|null} date - Tanggal yang akan diformat.
 * @param {Object} settings - Settings aplikasi, minimal memiliki properti date_format.
 * @param {string} [fallback="-"] - Nilai fallback jika date kosong.
 * @returns {string}
 */
export default function formatDate(date, settings, fallback = "-") {
    if (!date || !settings?.date_format) {
        return fallback;
    }

    return dayjs(date).format(settings.date_format);
}
