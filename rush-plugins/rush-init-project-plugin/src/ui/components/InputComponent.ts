import { BaseFieldComponent, IComponentOptions, IExtendedAnswers } from './BaseFieldComponent';
import blessed, { Widgets } from 'blessed';

import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import { COLORS } from '../COLORS';
import { CUSTOM_EMIT_EVENTS } from '../EMIT_EVENTS';

export class InputComponent extends BaseFieldComponent {
  public input: Widgets.TextareaElement;
  public placeholder: Widgets.BoxElement;
  private _message: string = '';
  public constructor(
    form: Widgets.FormElement<Answers>,
    prompt: PromptQuestion,
    option: IComponentOptions,
    hookForPrompt: SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined> | undefined
  ) {
    super(form, prompt, option, hookForPrompt);
    this.input = blessed.textarea({
      name: this.prompt.name,
      parent: this.form,
      inputOnFocus: true,
      width: '100%',
      height: 3,
      border: 'line',
      scrollable: false,
      style: {
        focus: {
          border: {
            fg: COLORS.green5
          }
        }
      },
      alwaysScroll: true,
      shrink: true
    });
    this.input.key(['return'], () => {
      // Workaround, since we can't stop the return from being added.
      this.input.emit('keypress', null, { name: 'backspace' });
      this.input.emit('keypress', '\x1b', { name: 'escape' });
      this.focusNext();
      return;
    });
    this.input.on('focus', () => {
      this.label.style.fg = COLORS.green5;
      this.form.screen.render();
    });
    this.input.on('blur', async () => {
      this.label.style.fg = COLORS.black;
      await this.validateResult();
      this.form.emit(CUSTOM_EMIT_EVENTS.UPDATE_LAYOUT);
    });
    this.placeholder = blessed.box({
      tags: true,
      parent: this.form,
      height: 1,
      alwaysScroll: true,
      shrink: true,
      width: '100%'
    });
    this.elements.push(this.label, this.input, this.placeholder);
  }
  public focus(): void {
    this.input.focus();
  }
  public async validateResult(): Promise<void> {
    this.label.setContent(`${this._message} {${COLORS.blue4}-fg}[validating...]{/${COLORS.blue4}-fg}`);
    try {
      this.isValidate = await this.validate(this.input.getValue());
    } catch (error) {
      this.isValidate = ((error ?? 'error') as string).toString();
    }
    if (this.isValidate === true) {
      this.label.setContent(`${this._message}`);
      this.placeholder.setContent('');
    } else {
      const warningStr: string = this.isValidate ? this.isValidate : 'error';
      this.label.setContent(`{${COLORS.red6}-fg}*{/${COLORS.red6}-fg}${this._message}`);
      this.placeholder.setContent(` {${COLORS.red6}-fg}[${warningStr}]{/${COLORS.red6}-fg}`);
    }
    this.form.screen.render();
  }

  public async setMessage(): Promise<void> {
    try {
      const message: string = await this.message();
      this._message = message;
      this.label.setContent(this._message);
    } catch (e) {
      this.form.screen.log('input set message error', e);
    }
  }
  public async setDefaultValue(): Promise<void> {
    try {
      const defaultValue: string = (await this.default()) as string;
      if (defaultValue) {
        this.input.value = defaultValue;
      }
    } catch (e) {
      this.form.screen.log('input set default error', e);
    }
  }
  public getFieldComponent(): Widgets.Node {
    return this.input;
  }
}
