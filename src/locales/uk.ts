import { NAME_BOX } from '../layout';
import type { Locale, NameStyle } from './types';

/** The 2025 Ukrainian template: its name line and its blue. */
export const UK_TEMPLATE_NAME_STYLE: NameStyle = {
  box: NAME_BOX,
  color: [0.180392, 0.317647, 0.956863],
  emboldening: 0,
};

export const uk: Locale = {
  code: 'uk',
  dir: 'ltr',
  status: 'ready',
  templateUrl: '/locales/uk/template.pdf',
  fontUrl: '/fonts/WixMadeforDisplay-Bold.ttf',
  exampleCsvUrl: '/locales/uk/example.csv',
  csv: {
    headerWords: ['піб', 'ім’я', 'імя', 'прізвище', 'учень', 'учні', 'клас', 'name', 'surname', 'student'],
    fallbackEncoding: 'windows-1251',
  },
  name: { apostrophes: "'ʼ`" },
  fileNameStrategy: 'kmu-2010',
  nameStyle: UK_TEMPLATE_NAME_STYLE,
  messages: {
    title: 'Сертифікати «Година ШІ»',
    heading: 'Сертифікати «Година ШІ»',
    lead: 'Вставте список учнів — по одному імені в рядку — і отримайте іменні сертифікати для всього класу.',
    previewLabel: 'Попередній перегляд',
    prevLabel: 'Попередній',
    nextLabel: 'Наступний',
    namesLabel: 'Список учнів',
    namesPlaceholder: 'Шевченко Тарас\nУкраїнка Леся\nФранко Іван',
    uploadButton: 'Завантажити CSV / TXT',
    studentCount: 'Учнів: {count}',
    hintCsv:
      'Файл CSV або TXT: один учень у рядку. Якщо колонок кілька (напр. «Прізвище;Ім’я»), їх буде об’єднано через пробіл. Рядок заголовка пропускається.',
    exampleLink: 'Завантажити приклад',
    hintPrivacy: 'Імена друкуються саме так, як ви їх ввели. Дані не залишають ваш комп’ютер.',
    generate: 'Сформувати сертифікати',
    download: 'Завантажити (.zip)',
    print: 'Друкувати',

    loadingTemplate: 'Завантаження шаблону…',
    templateLoadFailed: 'Не вдалося завантажити шаблон. Оновіть сторінку.',
    addAtLeastOneName: 'Додайте хоча б одне ім’я.',
    tooManyNames: 'Забагато імен: максимум {max}.',
    generating: 'Формуємо сертифікати…',
    skipTitle: 'Не для всіх імен можна створити сертифікат',
    skipIntro: {
      one: 'Для {count} імені не можна створити сертифікат: у шрифті сертифіката немає деяких символів.',
      few: 'Для {count} імен не можна створити сертифікат: у шрифті сертифіката немає деяких символів.',
      many: 'Для {count} імен не можна створити сертифікат: у шрифті сертифіката немає деяких символів.',
      other: 'Для {count} імен не можна створити сертифікат: у шрифті сертифіката немає деяких символів.',
    },
    skipReason: 'немає символів: {chars}',
    skipRest: 'Решта імен ({count}) пройшла перевірку, для них сертифікати можна створити.',
    skipNoneValid: 'Жодне з імен не можна надрукувати цим шрифтом. Поверніться до редагування списку.',
    skipBack: 'Повернутися до редагування',
    skipContinue: 'Створити для решти ({count})',
    generatedSkipped: {
      one: 'Готово: {count} сертифікат. Не включено імен: {skipped}.',
      few: 'Готово: {count} сертифікати. Не включено імен: {skipped}.',
      many: 'Готово: {count} сертифікатів. Не включено імен: {skipped}.',
      other: 'Готово: {count} сертифікатів. Не включено імен: {skipped}.',
    },
    generated: {
      one: 'Готово: {count} сертифікат.',
      few: 'Готово: {count} сертифікати.',
      many: 'Готово: {count} сертифікатів.',
      other: 'Готово: {count} сертифікатів.',
    },
    generateFailed: 'Не вдалося сформувати сертифікати. Спробуйте ще раз.',
    listChanged: 'Список змінено — сформуйте сертифікати ще раз.',
    noNamesInFile: 'У файлі не знайдено жодного імені.',
    importedFromFile: {
      one: 'Завантажено {count} ім’я з файлу «{file}». Перевірте список.',
      few: 'Завантажено {count} імені з файлу «{file}». Перевірте список.',
      many: 'Завантажено {count} імен з файлу «{file}». Перевірте список.',
      other: 'Завантажено {count} імен з файлу «{file}». Перевірте список.',
    },
    preparingArchive: 'Готуємо архів… {current} / {total}',
    archiveDownloaded: 'Архів завантажено.',
    archiveFailed: 'Не вдалося створити архів.',
    printOpened: 'Файл для друку відкрито в новій вкладці — натисніть «Друк» (Ctrl/Cmd + P).',
    popupBlocked: 'Браузер заблокував нову вкладку. Дозвольте спливаючі вікна для цього сайту.',
  },
};
