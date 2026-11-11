import type { Locale } from './types';
import { UK_TEMPLATE_NAME_STYLE } from './uk';

// Hour of AI in Lithuania, "DI valanda" (DI = dirbtinis intelektas), adapted from the Ukrainian page.
// Draft wording: needs a review by a native speaker before this locale becomes `ready`.
// Counts sit after a colon where the noun would need a case for the number ("Mokinių: 5"), as in uk.
export const lt: Locale = {
  code: 'lt',
  dir: 'ltr',
  status: 'draft',
  templateUrl: '/locales/lt/template.pdf',
  // Wix Madefor Display Bold has every Lithuanian letter (ą č ę ė į š ų ū ž) and „“.
  fontUrl: '/fonts/WixMadeforDisplay-Bold.ttf',
  exampleCsvUrl: '/locales/lt/example.csv',
  csv: {
    headerWords: ['vardas', 'vardai', 'pavardė', 'pavardės', 'mokinys', 'mokinė', 'mokiniai', 'klasė', 'name', 'surname', 'student'],
    fallbackEncoding: 'windows-1257',
  },
  // The font draws ' itself (foreign names such as O'Brien); only the modifier letter ʼ is missing from it.
  name: { apostrophes: 'ʼ' },
  fileNameStrategy: 'keep',
  // Same template as uk until the Lithuanian one arrives.
  nameStyle: UK_TEMPLATE_NAME_STYLE,
  messages: {
    title: 'Sertifikatai „DI valanda“',
    heading: 'Sertifikatai „DI valanda“',
    lead: 'Įklijuokite mokinių sąrašą – po vieną vardą eilutėje – ir gaukite vardinius sertifikatus visai klasei.',
    previewLabel: 'Peržiūra',
    prevLabel: 'Ankstesnis',
    nextLabel: 'Kitas',
    namesLabel: 'Mokinių sąrašas',
    namesPlaceholder: 'Jonas Jonaitis\nRūta Petraitytė\nŽygimantas Kazlauskas',
    uploadButton: 'Įkelti CSV / TXT',
    studentCount: 'Mokinių: {count}',
    hintCsv:
      'CSV arba TXT failas: vienas mokinys eilutėje. Jei stulpelių keli (pvz., „Vardas;Pavardė“), jie sujungiami tarpu. Antraštės eilutė praleidžiama.',
    exampleLink: 'Atsisiųsti pavyzdį',
    hintPrivacy: 'Vardai spausdinami tiksliai taip, kaip juos įvedėte. Duomenys nepalieka jūsų kompiuterio.',
    generate: 'Sukurti sertifikatus',
    download: 'Atsisiųsti (.zip)',
    print: 'Spausdinti',

    loadingTemplate: 'Įkeliamas šablonas…',
    templateLoadFailed: 'Nepavyko įkelti šablono. Perkraukite puslapį.',
    addAtLeastOneName: 'Įrašykite bent vieną vardą.',
    tooManyNames: 'Per daug vardų: daugiausia {max}.',
    generating: 'Kuriami sertifikatai…',
    skipTitle: 'Ne visiems vardams galima sukurti sertifikatą',
    skipIntro: {
      one: 'Vardų, kuriems negalima sukurti sertifikato: {count}. Sertifikato šrifte trūksta kai kurių simbolių.',
      few: 'Vardų, kuriems negalima sukurti sertifikato: {count}. Sertifikato šrifte trūksta kai kurių simbolių.',
      many: 'Vardų, kuriems negalima sukurti sertifikato: {count}. Sertifikato šrifte trūksta kai kurių simbolių.',
      other: 'Vardų, kuriems negalima sukurti sertifikato: {count}. Sertifikato šrifte trūksta kai kurių simbolių.',
    },
    skipReason: 'trūksta simbolių: {chars}',
    skipRest: 'Kiti vardai ({count}) patikrinti – jiems sertifikatus sukurti galima.',
    skipNoneValid: 'Nė vieno vardo negalima išspausdinti šiuo šriftu. Grįžkite ir pataisykite sąrašą.',
    skipBack: 'Grįžti į redagavimą',
    skipContinue: 'Sukurti likusiems ({count})',
    // many is for fractions only (never a count of certificates), but Intl.PluralRules lists it.
    generatedSkipped: {
      one: 'Paruošta: {count} sertifikatas. Neįtraukta vardų: {skipped}.',
      few: 'Paruošta: {count} sertifikatai. Neįtraukta vardų: {skipped}.',
      many: 'Paruošta: {count} sertifikato. Neįtraukta vardų: {skipped}.',
      other: 'Paruošta: {count} sertifikatų. Neįtraukta vardų: {skipped}.',
    },
    generated: {
      one: 'Paruošta: {count} sertifikatas.',
      few: 'Paruošta: {count} sertifikatai.',
      many: 'Paruošta: {count} sertifikato.',
      other: 'Paruošta: {count} sertifikatų.',
    },
    generateFailed: 'Nepavyko sukurti sertifikatų. Bandykite dar kartą.',
    listChanged: 'Sąrašas pakeistas – sukurkite sertifikatus dar kartą.',
    noNamesInFile: 'Faile nerasta nė vieno vardo.',
    importedFromFile: {
      one: 'Iš failo „{file}“ įkeltas {count} vardas. Patikrinkite sąrašą.',
      few: 'Iš failo „{file}“ įkelti {count} vardai. Patikrinkite sąrašą.',
      many: 'Iš failo „{file}“ įkelta {count} vardo. Patikrinkite sąrašą.',
      other: 'Iš failo „{file}“ įkelta {count} vardų. Patikrinkite sąrašą.',
    },
    archiveFileName: 'sertifikatai.zip',
    preparingArchive: 'Ruošiamas archyvas… {current} / {total}',
    archiveDownloaded: 'Archyvas atsisiųstas.',
    archiveFailed: 'Nepavyko sukurti archyvo.',
    printOpened: 'Spausdinimo failas atidarytas naujame skirtuke – spauskite „Spausdinti“ (Ctrl/Cmd + P).',
    popupBlocked: 'Naršyklė užblokavo naują skirtuką. Leiskite iššokančiuosius langus šiai svetainei.',
  },
};
