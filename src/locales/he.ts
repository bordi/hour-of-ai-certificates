import type { Locale } from './types';
import { UK_TEMPLATE_NAME_STYLE } from './uk';

// Draft wording: needs a review by a native speaker before this locale becomes `ready`.
export const he: Locale = {
  code: 'he',
  dir: 'rtl',
  status: 'draft',
  templateUrl: '/locales/he/template.pdf',
  fontUrl: '/fonts/WixMadeforDisplay-Bold.ttf',
  exampleCsvUrl: '/locales/he/example.csv',
  csv: {
    headerWords: ['שם', 'שמות', 'פרטי', 'משפחה', 'תלמיד', 'תלמידים', 'כיתה', 'name', 'surname', 'student'],
    fallbackEncoding: 'windows-1255',
  },
  // ' and the geresh ׳ are ordinary characters in Hebrew names (ג'ורג'); only ʼ is rewritten.
  name: { apostrophes: 'ʼ' },
  fileNameStrategy: 'keep',
  nameStyle: UK_TEMPLATE_NAME_STYLE,
  messages: {
    title: 'תעודות "שעה של בינה מלאכותית"',
    heading: 'תעודות "שעה של בינה מלאכותית"',
    lead: 'הדביקו רשימת תלמידים, שם אחד בכל שורה, וקבלו תעודה אישית לכל תלמיד בכיתה.',
    previewLabel: 'תצוגה מקדימה',
    prevLabel: 'הקודם',
    nextLabel: 'הבא',
    namesLabel: 'רשימת תלמידים',
    namesPlaceholder: 'דני כהן\nשרה לוי\nיוסי מזרחי',
    uploadButton: 'העלאת קובץ CSV / TXT',
    studentCount: 'תלמידים: {count}',
    hintCsv:
      'קובץ CSV או TXT, תלמיד אחד בכל שורה. אם יש כמה עמודות (למשל "שם פרטי;שם משפחה"), הן יחוברו ברווח. שורת כותרת תדולג.',
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
