/** Supported subjects and examinations are centralized to keep API validation consistent. */
export const SUBJECTS = [
  'Maths Aptitude',
  'Reasoning',
  'English',
  'General Awareness',
];

export const EXAM_TYPES = [
  'SSC CGL',
  'SBI PO',
  'SBI SO',
  'IBPS RRB PO',
  'Railway',
];

export const QUESTION_COUNT = 30;
export const TEST_DURATION_SECONDS = 25 * 60;
export const MARKS_PER_CORRECT_ANSWER = 3;
export const MARKS_PER_WRONG_ANSWER = -1;
