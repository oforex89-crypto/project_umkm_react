/**
 * Format currency to Indonesian Rupiah format
 * Uses dots as thousand separators (e.g., Rp 30.000, Rp 1.500.000)
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format price without currency symbol
 * Returns just the number with dots as thousand separators (e.g., 30.000, 1.500.000)
 */
export const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Parse price string to number
 * Removes dots from string and converts to number
 */
export const parsePrice = (priceString: string): number => {
    const cleaned = priceString.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned) || 0;
};
