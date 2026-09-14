export const formatDate = (dateValue) => {
  if (!dateValue) return '-';

  // Handles stored dates like 2026-09-14 safely
  if (typeof dateValue === 'string') {
    const dateOnly = dateValue.split('T')[0];
    const parts = dateOnly.split('-');

    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString('en-GB');
};