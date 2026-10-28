import type { Locale } from './types';

// The Israeli initiative is Hour of Vibe Code, "שעת הוויב קוד" (hourofvibecode.co.il, Code.org and Wix); its site
// speaks in the plural and pairs gender forms, so these texts do too or stay neutral.
// Draft wording: needs a review by a native speaker before this locale becomes `ready`.
export const he: Locale = {
  code: 'he',
  dir: 'rtl',
  status: 'draft',
  templateUrl: '/locales/he/template.pdf',
  // Wix Madefor Hebrew SemiBold (TrueType): Hebrew, Latin, Cyrillic.
  fontUrl: '/fonts/WMHTV8-SemiBold.ttf',
  exampleCsvUrl: '/locales/he/example.csv',
  csv: {
    headerWords: ['שם', 'שמות', 'פרטי', 'משפחה', 'תלמיד', 'תלמידים', 'כיתה', 'name', 'surname', 'student'],
    fallbackEncoding: 'windows-1255',
  },
  // ' and the geresh ׳ are ordinary characters in Hebrew names (ג'ורג'); only ʼ is rewritten.
  name: { apostrophes: 'ʼ' },
  fileNameStrategy: 'keep',
  // Template 2026 (1212.48 × 856.8 pt). The name line runs at y ≈ 437 from x 394.5 to 818; the label above it starts at
  // y ≈ 495. Baselines keep descenders (ק ן, g y) about 4 pt above the line and the tallest marks below the label.
  nameStyle: {
    box: {
      centerX: 606.25,
      maxWidth: 408,
      baselineY: 450,
      maxSize: 36,
      minSize: 20,
      twoLineMaxSize: 22,
      twoLineBottomY: 447,
      lineHeight: 1.15,
    },
    color: [17 / 255, 109 / 255, 1], // #116DFF, the template's blue
    emboldening: 0,
  },
  messages: {
    title: 'תעודות שעת הוויב קוד',
    heading: 'תעודות שעת הוויב קוד',
    lead: 'הדביקו את רשימת התלמידים והתלמידות, שם אחד בכל שורה, וקבלו תעודה אישית לכל אחד ואחת.',
    previewLabel: 'תצוגה מקדימה',
    prevLabel: 'הקודם',
    nextLabel: 'הבא',
    namesLabel: 'רשימת התלמידים והתלמידות',
    namesPlaceholder: 'דני כהן\nשרה לוי\nיוסי מזרחי',
    uploadButton: 'העלאת קובץ CSV / TXT',
    studentCount: 'שמות ברשימה: {count}',
    hintCsv:
      'קובץ CSV או TXT, שם אחד בכל שורה. אם יש כמה עמודות (למשל "שם פרטי;שם משפחה"), הן יחוברו ברווח. שורת כותרת תדולג.',
    exampleLink: 'הורדת קובץ לדוגמה',
    hintPrivacy: 'השמות מודפסים בדיוק כפי שהוקלדו. הנתונים אינם יוצאים מהמחשב שלכם.',
    generate: 'יצירת תעודות',
    download: 'הורדה (.zip)',
    print: 'הדפסה',

    loadingTemplate: 'טוען את התבנית…',
    templateLoadFailed: 'לא ניתן היה לטעון את התבנית. רעננו את הדף.',
    addAtLeastOneName: 'הוסיפו לפחות שם אחד.',
    tooManyNames: 'יותר מדי שמות: המקסימום הוא {max}.',
    generating: 'יוצר תעודות…',
    skipTitle: 'לא ניתן ליצור תעודה לכל השמות',
    skipIntro: {
      one: 'לא ניתן ליצור תעודה עבור {count} שם: בגופן של התעודה חסרים תווים מסוימים.',
      two: 'לא ניתן ליצור תעודות עבור {count} שמות: בגופן של התעודה חסרים תווים מסוימים.',
      other: 'לא ניתן ליצור תעודות עבור {count} שמות: בגופן של התעודה חסרים תווים מסוימים.',
    },
    skipReason: 'חסרים תווים: {chars}',
    skipRest: 'שאר השמות ({count}) עברו את הבדיקה, ואפשר ליצור עבורם תעודות.',
    skipNoneValid: 'לא ניתן להדפיס אף אחד מהשמות בגופן הזה. חזרו לעריכת הרשימה.',
    skipBack: 'חזרה לעריכה',
    skipContinue: 'יצירה עבור השאר ({count})',
    generated: {
      one: 'הושלם: {count} תעודה.',
      two: 'הושלם: {count} תעודות.',
      other: 'הושלם: {count} תעודות.',
    },
    generatedSkipped: {
      one: 'הושלם: {count} תעודה. שמות שלא נכללו: {skipped}.',
      two: 'הושלם: {count} תעודות. שמות שלא נכללו: {skipped}.',
      other: 'הושלם: {count} תעודות. שמות שלא נכללו: {skipped}.',
    },
    generateFailed: 'לא ניתן היה ליצור את התעודות. נסו שוב.',
    listChanged: 'הרשימה השתנתה — צרו את התעודות שוב.',
    noNamesInFile: 'לא נמצאו שמות בקובץ.',
    importedFromFile: {
      one: 'נטען {count} שם מהקובץ "{file}". בדקו את הרשימה.',
      two: 'נטענו {count} שמות מהקובץ "{file}". בדקו את הרשימה.',
      other: 'נטענו {count} שמות מהקובץ "{file}". בדקו את הרשימה.',
    },
    preparingArchive: 'מכין את הארכיון… {current} / {total}',
    archiveDownloaded: 'הארכיון הורד.',
    archiveFailed: 'לא ניתן היה ליצור את הארכיון.',
    printOpened: 'קובץ ההדפסה נפתח בלשונית חדשה — לחצו על הדפסה (Ctrl/Cmd + P).',
    popupBlocked: 'הדפדפן חסם את הלשונית החדשה. אפשרו חלונות קופצים לאתר זה.',
  },
};
