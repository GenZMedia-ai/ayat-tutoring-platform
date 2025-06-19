
export const TEACHER_TYPES = [
  { value: 'kids', label: 'Kids Teacher' },
  { value: 'adult', label: 'Adult Teacher' },
  { value: 'mixed', label: 'Mixed (Kids & Adults)' },
  { value: 'expert', label: 'Expert Teacher' }
] as const;

export type TeacherType = typeof TEACHER_TYPES[number]['value'];

export const getTeacherTypeLabel = (value: string): string => {
  const teacherType = TEACHER_TYPES.find(type => type.value === value);
  return teacherType ? teacherType.label : value;
};
