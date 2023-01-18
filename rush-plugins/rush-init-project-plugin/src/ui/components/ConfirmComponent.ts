import { BaseFieldComponent, IComponentOptions, IExtendedAnswers } from './BaseFieldComponent';
import blessed, { Widgets } from 'blessed';

import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import { COLORS } from '../COLOR';

export class ConfirmComponent extends BaseFieldComponent {
  public label: Widgets.BoxElement;
  public placeholder: Widgets.BoxElement;
  public confimBtn: Widgets.CheckboxElement;
  public constructor(
    form: Widgets.FormElement<Answers>,
    prompt: PromptQuestion,
    option: IComponentOptions,
    hookForPrompt: SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined> | undefined
  ) {
    super(form, prompt, option, hookForPrompt);
    this.label = blessed.box({
      tags: true,
      parent: this.form,
      height: 1,
      content: this.prompt.name,
      alwaysScroll: true,
      shrink: true
    });
    this.confimBtn = blessed.checkbox({
      parent: this.form,
      height: 1,
      mouse: true,
      name: this.prompt.name,
      text: 'yes',
      alwaysScroll: true,
      shrink: true,
      style: {
        focus: {
          fg: COLORS.green5
        }
      }
    });

    this.confimBtn.on('check', () => {
      this.form.emit('update', { [this.confimBtn.name]: this.confimBtn.checked });
    });
    this.confimBtn.on('uncheck', () => {
      this.form.emit('update', { [this.confimBtn.name]: this.confimBtn.checked });
    });
    this.confimBtn.on('focus', () => {
      this.label.style.fg = COLORS.green5;
      this.form.screen.render();
    });
    this.confimBtn.on('blur', async () => {
      this.label.style.fg = COLORS.black;
      this.form.screen.render();
    });
    this.placeholder = blessed.box({
      parent: this.form,
      height: 1,
      alwaysScroll: true,
      shrink: true,
      width: '100%'
    });
    this.elements.push(this.label, this.confimBtn, this.placeholder);
  }
  public async setMessage(): Promise<void> {
    try {
      const message: string = await this.message();
      this.label.setContent(message);
    } catch (e) {
      this.form.screen.log(e);
    }
  }
  public async setDefaultValue(): Promise<void> {
    try {
      const defualtValue: boolean = Boolean(await this.default());
      if (defualtValue) {
        this.confimBtn.check();
      }
    } catch (e) {
      this.form.screen.log(e);
    }
  }
}
