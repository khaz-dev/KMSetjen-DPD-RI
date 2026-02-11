import { formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';

/**
 * Safe date format helper - handles null/invalid dates gracefully
 * Returns formatted date string or 'N/A' if date is invalid
 */
export const formatSafeDate = (dateValue, isIndonesian = false) => {
  try {
    // Handle null/undefined
    if (!dateValue) {
      return 'N/A';
    }
    
    const dateObj = new Date(dateValue);
    
    // Check if date is valid (not Invalid Date)
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: isIndonesian ? idLocale : enUS
    });
  } catch (error) {
    // Return fallback if any error occurs
    return 'N/A';
  }
};
