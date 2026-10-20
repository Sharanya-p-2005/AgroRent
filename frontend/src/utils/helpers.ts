export function getRoleBadgeColor(role?: string): { bg: string; text: string; border: string } {
  switch (role) {
    case 'ADMIN':
      return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' };
    case 'OWNER':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    case 'FARMER':
    default:
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' };
  }
}

export function getRoleLabel(role?: string): string {
  switch (role) {
    case 'ADMIN':
      return 'System Admin';
    case 'OWNER':
      return 'Equipment Owner';
    case 'FARMER':
      return 'Farmer';
    default:
      return role || 'User';
  }
}

export function getDashboardPathForRole(role?: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'OWNER':
      return '/owner/dashboard';
    case 'FARMER':
    default:
      return '/farmer/dashboard';
  }
}

export interface LocationParts {
  village?: string | null;
  taluk?: string | null;
  district?: string | null;
  state?: string | null;
  address?: string | null;
}

/**
 * Formats a clean, geographically accurate agricultural location string.
 * Avoids mixing up separate districts (e.g. Ramanagara and Mandya) and prevents
 * redundant repeating of village/district when they share the same name.
 */
export function formatLocation(
  loc?: LocationParts | null,
  fallback = 'Mandya, Karnataka'
): string {
  if (!loc) return fallback;

  // Capitalize words nicely
  const titleCase = (s: string) =>
    s
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  const rawVillage = loc.village ? titleCase(loc.village) : '';
  const rawTaluk = loc.taluk ? titleCase(loc.taluk) : '';
  const rawDistrict = loc.district ? titleCase(loc.district) : '';
  const rawState = loc.state ? titleCase(loc.state) : 'Karnataka';

  if (!rawDistrict && !rawVillage && !rawTaluk) {
    return fallback;
  }

  const parts: string[] = [];

  // Add village if present and distinct from taluk and district
  if (
    rawVillage &&
    (!rawDistrict || rawVillage.toLowerCase() !== rawDistrict.toLowerCase()) &&
    (!rawTaluk || rawVillage.toLowerCase() !== rawTaluk.toLowerCase())
  ) {
    parts.push(rawVillage);
  }

  // Add taluk if present, distinct from district, and not already included
  if (
    rawTaluk &&
    (!rawDistrict || rawTaluk.toLowerCase() !== rawDistrict.toLowerCase()) &&
    !parts.some((p) => p.toLowerCase() === rawTaluk.toLowerCase())
  ) {
    parts.push(rawTaluk);
  }

  // Add district if present
  if (rawDistrict) {
    parts.push(rawDistrict);
  }

  // Add state if present and distinct from district
  if (rawState && (!rawDistrict || rawState.toLowerCase() !== rawDistrict.toLowerCase())) {
    parts.push(rawState);
  }

  return parts.length > 0 ? parts.join(', ') : fallback;
}

/**
 * Formats a booking schedule cleanly from booking_date (YYYY-MM-DD)
 * and start_time / end_time (HH:MM or HH:MM:SS or ISO strings).
 * Guarantees no "Invalid Date" errors.
 */
export function formatBookingSchedule(
  bookingDate?: string,
  startTime?: string,
  endTime?: string
): string {
  if (!bookingDate && !startTime) return 'Schedule not specified';

  // Format date part
  let dateLabel = '';
  if (bookingDate) {
    const rawDate = bookingDate.includes('T') ? bookingDate.split('T')[0] : bookingDate;
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        dateLabel = d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }
    if (!dateLabel) {
      dateLabel = rawDate;
    }
  }

  // Format time part
  const formatTimeSlot = (t?: string) => {
    if (!t) return '';
    if (t.includes('T')) {
      const dt = new Date(t);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
      return t.split('T')[1].slice(0, 5);
    }
    return t.slice(0, 5);
  };

  const startFormatted = formatTimeSlot(startTime);
  const endFormatted = formatTimeSlot(endTime);

  if (dateLabel && startFormatted && endFormatted) {
    return `${dateLabel} • ${startFormatted} – ${endFormatted}`;
  }
  if (dateLabel && startFormatted) {
    return `${dateLabel} • ${startFormatted}`;
  }
  if (startFormatted && endFormatted) {
    return `${startFormatted} – ${endFormatted}`;
  }
  return dateLabel || 'Schedule not specified';
}

