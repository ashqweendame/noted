import type { Announcement, SampleUploadPreset } from '../types/announcement';

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-exam-schedule',
    title: 'DCISM Final Examination Schedule (CS 3101 & IT 2204)',
    originalText:
      'DCISM FINAL EXAMINATION SCHEDULE\nCourse | Description | Date | Room\nCS 3101 | Algorithms | Dec 14 | LB445\nIT 2204 | Database Systems | Dec 16 | LB448',
    category: 'Examination',
    shortSummary:
      'Final examinations for CS 3101 (Algorithms) and IT 2204 (Database Systems) are scheduled on December 14 in Room LB445 and December 16 in Room LB448.',
    targetAudience: 'DCISM Students enrolled in CS 3101 and IT 2204',
    importantDates: [
      {
        id: 'id-1',
        label: 'CS 3101 Algorithms Final Exam',
        rawText: 'Dec 14 — Room LB445',
        normalizedDate: '2026-12-14',
        time: null,
      },
      {
        id: 'id-2',
        label: 'IT 2204 Database Systems Final Exam',
        rawText: 'Dec 16 — Room LB448',
        normalizedDate: '2026-12-16',
        time: null,
      },
    ],
    deadlines: [
      {
        id: 'dl-exam-1',
        task: 'Confirm CS 3101 exam permit and seat assignment',
        rawText: 'Before Dec 14',
        dueDate: '2026-12-11',
        dueTime: '5:00 PM',
        isCompleted: false,
      },
    ],
    requiredActions: [
      {
        id: 'act-exam-1',
        text: 'Confirm exact start time with course instructor on LMS',
        isCompleted: false,
      },
      {
        id: 'act-exam-2',
        text: 'Prepare validated student ID and exam permit',
        isCompleted: true,
      },
    ],
    requiredDocuments: ['Validated Student ID', 'Examination Permit'],
    priority: 'High',
    uncertainOrMissingInfo: [
      'Exact examination start and end times are not printed on the notice.',
      'Calendar year (2026) is not explicitly printed beside Dec 14 / Dec 16.',
    ],
    imageUrl: '/src/assets/images/sample_exam_notice_1795265396743.jpg',
    imageName: 'dcism-final-exam-schedule.jpg',
    createdAt: '2026-11-20T10:15:00Z',
    updatedAt: '2026-11-20T10:15:00Z',
  },
  {
    id: 'ann-lab-clearance',
    title: 'Laboratory Equipment & Account Clearance Verification',
    originalText:
      'DCISM LABORATORY NOTICE: All BSCS, BSIT, and BSIS students with borrowed hardware kits or active server accounts must settle clearances at LB442 before November 26, 2026 at 4:30 PM.',
    category: 'Academic Requirement',
    shortSummary:
      'Students with borrowed laboratory hardware kits or active departmental server accounts must complete clearance verification at LB442 before November 26.',
    targetAudience: 'BSCS, BSIT, and BSIS Students',
    importantDates: [
      {
        id: 'id-lab-1',
        label: 'Clearance Desk Hours (LB442)',
        rawText: 'Mon–Fri, 9:00 AM - 4:30 PM',
        normalizedDate: null,
        time: '9:00 AM - 4:30 PM',
      },
    ],
    deadlines: [
      {
        id: 'dl-lab-1',
        task: 'Return borrowed lab kits and sign clearance sheet at LB442',
        rawText: 'Before Nov 26, 2026 at 4:30 PM',
        dueDate: '2026-11-26',
        dueTime: '4:30 PM',
        isCompleted: false,
      },
    ],
    requiredActions: [
      {
        id: 'act-lab-1',
        text: 'Check borrowed kit serial numbers against lab slip',
        isCompleted: false,
      },
      {
        id: 'act-lab-2',
        text: 'Back up home directory from departmental Linux server',
        isCompleted: false,
      },
    ],
    requiredDocuments: ['Laboratory Borrower Slip', 'Student ID'],
    priority: 'High',
    uncertainOrMissingInfo: [],
    imageUrl: null,
    imageName: 'lab-clearance-notice.png',
    createdAt: '2026-11-19T14:20:00Z',
    updatedAt: '2026-11-19T14:20:00Z',
  },
  {
    id: 'ann-capstone-defense',
    title: 'CS 4102 Capstone Proposal Manuscript Submission',
    originalText:
      'CAPSTONE PROPOSAL SUBMISSION DEADLINE\n- Submit PDF manuscript of your proposal.\n- Include a scanned copy of the signed Adviser Endorsement Form.\n- All documents must be uploaded to the submission portal by November 28 at 11:59 PM.\n- Late submissions will not be considered.\nDepartment of Computer Science',
    category: 'Submission Deadline',
    shortSummary:
      'Capstone groups must upload their PDF proposal manuscript and signed Adviser Endorsement Form to the submission portal before the strict deadline. Late entries will not be accepted.',
    targetAudience: 'CS 4102 Capstone Students',
    importantDates: [],
    deadlines: [
      {
        id: 'dl-cap-1',
        task: 'Upload proposal PDF and signed Adviser Endorsement Form to portal',
        rawText: 'November 28 at 11:59 PM',
        dueDate: '2026-11-28',
        dueTime: '11:59 PM',
        isCompleted: false,
      },
    ],
    requiredActions: [
      {
        id: 'act-cap-1',
        text: 'Secure adviser signature on endorsement form',
        isCompleted: true,
      },
      {
        id: 'act-cap-2',
        text: 'Export final manuscript as PDF and verify formatting',
        isCompleted: false,
      },
    ],
    requiredDocuments: ['Proposal Manuscript (PDF)', 'Signed Adviser Endorsement Form'],
    priority: 'High',
    uncertainOrMissingInfo: [],
    imageUrl: '/src/assets/images/sample_capstone_deadline_1795265398415.jpg',
    imageName: 'capstone-proposal-deadline.jpg',
    createdAt: '2026-11-18T08:40:00Z',
    updatedAt: '2026-11-18T08:40:00Z',
  },
  {
    id: 'ann-math-colloquium',
    title: 'Applied Mathematics & Data Science Research Colloquium',
    originalText:
      'DCISM Mathematics Division invites undergraduate students to the Applied Mathematics & Data Science Colloquium on November 25, 2026, 2:00 PM at the Bunzel Audio-Visual Room. Attendance gives bonus credit for MATH 2103.',
    category: 'Event / Seminar',
    shortSummary:
      'An undergraduate research colloquium on applied mathematics and data science will take place on November 25 at 2:00 PM in the Bunzel AVR, with optional bonus credit for MATH 2103.',
    targetAudience: 'DCISM Undergraduate Students (especially MATH 2103)',
    importantDates: [
      {
        id: 'id-col-1',
        label: 'Colloquium Session',
        rawText: 'Nov 25, 2026 at 2:00 PM — Bunzel AVR',
        normalizedDate: '2026-11-25',
        time: '2:00 PM',
      },
    ],
    deadlines: [
      {
        id: 'dl-col-1',
        task: 'Register attendance slot via department RSVP link',
        rawText: 'Before Nov 24, 2026',
        dueDate: '2026-11-24',
        dueTime: '5:00 PM',
        isCompleted: true,
      },
    ],
    requiredActions: [
      {
        id: 'act-col-1',
        text: 'Sign attendance sheet at entrance for MATH 2103 credit',
        isCompleted: true,
      },
    ],
    requiredDocuments: [],
    priority: 'Low',
    uncertainOrMissingInfo: [],
    imageUrl: null,
    imageName: 'math-colloquium-poster.png',
    createdAt: '2026-11-15T11:00:00Z',
    updatedAt: '2026-11-17T16:30:00Z',
  },
];

export const SAMPLE_UPLOAD_PRESETS: SampleUploadPreset[] = [
  {
    id: 'preset-enrollment',
    label: 'Second Semester Enrollment Advisory',
    subtitle: 'Advising schedule, clearance steps & portal window',
    imageUrl: '/src/assets/images/sample_enrollment_advisory_1795265398377.jpg',
    imageName: 'second-semester-enrollment-advisory.jpg',
    fileSizeLabel: '412 KB',
    draft: {
      title: 'Second Semester Enrollment Advisory (BSCS & BSIT)',
      originalText:
        'DEPARTMENT OF COMPUTER SCIENCE\nSECOND SEMESTER ENROLLMENT ADVISORY\nADVISING SCHEDULE:\nBSCS (Computer Science): JAN 8 - 12: ALL YEARS\nBSIT (Information Technology): JAN 15 - 19: ALL YEARS\nCLEARANCE VERIFICATION STEPS:\n1. ACADEMIC ADVISING - Meet Advisor, finalize courses (JAN 2 - FEB 9)\n2. CLEARANCE CHECK - Settle dues, obtain clearance (JAN 2 - FEB 9)\n3. CLEARANCE CONFIRMED - Status updated to "Cleared" in Portal\nPORTAL ENROLLMENT WINDOW: JANUARY 22 - FEBRUARY 9',
      category: 'Enrollment',
      shortSummary:
        'Advising for BSCS runs Jan 8–12 and BSIT runs Jan 15–19 across all year levels. Students must complete academic advising and settle clearance dues before enrolling in the portal between January 22 and February 9.',
      targetAudience: 'BSCS and BSIT Students (All Year Levels)',
      importantDates: [
        {
          id: 'p-enr-d1',
          label: 'BSCS Academic Advising',
          rawText: 'JAN 8 - 12 (All Years)',
          normalizedDate: '2027-01-08',
          time: null,
        },
        {
          id: 'p-enr-d2',
          label: 'BSIT Academic Advising',
          rawText: 'JAN 15 - 19 (All Years)',
          normalizedDate: '2027-01-15',
          time: null,
        },
        {
          id: 'p-enr-d3',
          label: 'Portal Enrollment Window',
          rawText: 'JANUARY 22 - FEBRUARY 9',
          normalizedDate: '2027-01-22',
          time: null,
        },
      ],
      deadlines: [
        {
          id: 'p-enr-dl1',
          task: 'Complete Academic Advising & Clearance Verification',
          rawText: 'JAN 2 - FEB 9',
          dueDate: '2027-02-09',
          dueTime: null,
          isCompleted: false,
        },
      ],
      requiredActions: [
        { id: 'p-enr-a1', text: 'Meet academic advisor and finalize course load', isCompleted: false },
        { id: 'p-enr-a2', text: 'Settle outstanding dues and obtain department clearance', isCompleted: false },
        { id: 'p-enr-a3', text: 'Verify status shows "Cleared" in Student Portal before enrolling', isCompleted: false },
      ],
      requiredDocuments: ['Course Advising Form', 'Clearance Record'],
      priority: 'High',
      uncertainOrMissingInfo: [
        'Specific time cutoffs on February 9 are not stated on the advisory graphic.',
      ],
      imageUrl: '/src/assets/images/sample_enrollment_advisory_1795265398377.jpg',
      imageName: 'second-semester-enrollment-advisory.jpg',
    },
  },
  {
    id: 'preset-exam',
    label: 'DCISM Final Examination Schedule',
    subtitle: 'CS 3101 Algorithms & IT 2204 room table',
    imageUrl: '/src/assets/images/sample_exam_notice_1795265396743.jpg',
    imageName: 'dcism-final-exam-schedule.jpg',
    fileSizeLabel: '368 KB',
    draft: {
      title: 'DCISM Final Examination Schedule',
      originalText:
        'DCISM FINAL EXAMINATION SCHEDULE\nCourse | Description | Date | Room\nCS 3101 | Algorithms | Dec 14 | LB445\nIT 2204 | Database Systems | Dec 16 | LB448',
      category: 'Examination',
      shortSummary:
        'Final examinations for CS 3101 (Algorithms) and IT 2204 (Database Systems) are scheduled on December 14 in Room LB445 and December 16 in Room LB448.',
      targetAudience: 'Students enrolled in CS 3101 and IT 2204',
      importantDates: [
        {
          id: 'p-ex-d1',
          label: 'CS 3101 Algorithms Final Exam',
          rawText: 'Dec 14 — Room LB445',
          normalizedDate: null,
          time: null,
        },
        {
          id: 'p-ex-d2',
          label: 'IT 2204 Database Systems Final Exam',
          rawText: 'Dec 16 — Room LB448',
          normalizedDate: null,
          time: null,
        },
      ],
      deadlines: [
        {
          id: 'p-ex-dl1',
          task: 'Prepare for CS 3101 Algorithms Final Exam (LB445)',
          rawText: 'Dec 14',
          dueDate: '2026-12-14',
          dueTime: null,
          isCompleted: false,
        },
      ],
      requiredActions: [
        { id: 'p-ex-a1', text: 'Confirm exam start time with course instructor', isCompleted: false },
      ],
      requiredDocuments: [],
      priority: 'High',
      uncertainOrMissingInfo: [
        'Exact examination start and end times are omitted on the posted sheet.',
        'Year is not explicitly printed next to Dec 14 and Dec 16.',
      ],
      imageUrl: '/src/assets/images/sample_exam_notice_1795265396743.jpg',
      imageName: 'dcism-final-exam-schedule.jpg',
    },
  },
  {
    id: 'preset-capstone',
    label: 'Capstone Proposal Submission Deadline',
    subtitle: 'PDF manuscript & Adviser Endorsement Form',
    imageUrl: '/src/assets/images/sample_capstone_deadline_1795265398415.jpg',
    imageName: 'capstone-proposal-deadline.jpg',
    fileSizeLabel: '394 KB',
    draft: {
      title: 'Capstone Proposal Submission Deadline',
      originalText:
        'CAPSTONE PROPOSAL SUBMISSION DEADLINE\n- Submit PDF manuscript of your proposal.\n- Include a scanned copy of the signed Adviser Endorsement Form.\n- All documents must be uploaded to the submission portal by April 15th at 11:59 PM.\n- Late submissions will not be considered.\nDepartment of Computer Science',
      category: 'Submission Deadline',
      shortSummary:
        'Students must upload their Capstone Proposal PDF manuscript together with a scanned copy of the signed Adviser Endorsement Form to the submission portal by April 15 at 11:59 PM. Late submissions will not be considered.',
      targetAudience: 'Department of Computer Science Capstone Students',
      importantDates: [],
      deadlines: [
        {
          id: 'p-cap-dl1',
          task: 'Upload proposal PDF and signed Adviser Endorsement Form',
          rawText: 'April 15th at 11:59 PM',
          dueDate: null,
          dueTime: '11:59 PM',
          isCompleted: false,
        },
      ],
      requiredActions: [
        { id: 'p-cap-a1', text: 'Obtain adviser signature on the Endorsement Form and scan it', isCompleted: false },
        { id: 'p-cap-a2', text: 'Upload PDF manuscript and endorsement form before 11:59 PM', isCompleted: false },
      ],
      requiredDocuments: ['Proposal Manuscript (PDF)', 'Signed Adviser Endorsement Form (Scanned)'],
      priority: 'High',
      uncertainOrMissingInfo: [
        'Calendar year for April 15th is not printed on the flyer.',
        'Submission portal URL is not shown in the notice.',
      ],
      imageUrl: '/src/assets/images/sample_capstone_deadline_1795265398415.jpg',
      imageName: 'capstone-proposal-deadline.jpg',
    },
  },
];
