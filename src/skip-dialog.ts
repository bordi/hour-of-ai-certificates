import type { Unsupported } from './glyphs';
import { isolate, t } from './i18n';

/**
 * Tells the teacher which names cannot be drawn and why, and lets them go back to the list or carry on
 * with the rest. Resolves true to carry on; false on "back" or Escape.
 */
export function askToSkip(dialog: HTMLDialogElement, skipped: Unsupported[], validCount: number): Promise<boolean> {
  const part = <T extends HTMLElement>(id: string) => dialog.querySelector<T>(`#${id}`)!;

  part('skip-intro').textContent = t('skipIntro', { count: skipped.length });
  part('skip-rest').textContent = validCount > 0 ? t('skipRest', { count: validCount }) : t('skipNoneValid');

  const list = part('skip-list');
  list.replaceChildren(
    ...skipped.map(({ name, chars }) => {
      const item = document.createElement('li');
      const who = document.createElement('bdi');
      who.textContent = name;
      item.append(who, ` — ${t('skipReason', { chars: chars.map(isolate).join(' ') })}`);
      return item;
    }),
  );

  const carryOn = part<HTMLButtonElement>('skip-continue');
  carryOn.textContent = t('skipContinue', { count: validCount });
  carryOn.hidden = validCount === 0;

  return new Promise((resolve) => {
    dialog.returnValue = '';
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'continue'), { once: true });
    dialog.showModal();
  });
}
