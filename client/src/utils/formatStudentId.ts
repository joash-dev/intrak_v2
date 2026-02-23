/**
 * Shared utility to format student IDs into a consistent display format.
 * Converts various formats to "XX-UR-XXXX" pattern.
 */
export const formatStudentId = (studentNumber: string): string => {
  // If already in correct format, return as is
  if (/^\d{2}-[A-Z]{2}-\d{4}$/.test(studentNumber)) {
    return studentNumber;
  }

  // If it's in format like "2021-12345", convert to "21-UR-1234"
  if (/^\d{4}-\d{5}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4);
    const number = studentNumber.substring(5, 9);
    return `${year}-UR-${number}`;
  }

  // If it's in format like "2021-1234", convert to "21-UR-1234"
  if (/^\d{4}-\d{4}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4);
    const number = studentNumber.substring(5);
    return `${year}-UR-${number}`;
  }

  // Default fallback - return as is
  return studentNumber || "22-UR-0592";
};
