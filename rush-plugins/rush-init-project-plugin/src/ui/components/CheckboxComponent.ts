import { BaseFieldComponent, IComponentOptions, IExtendedAnswers, BaseValueType } from './BaseFieldComponent';
import blessed, { Widgets } from 'blessed';

import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import { COLORS } from '../COLORS';
import { BlessedHiddenInputComponent } from './BlessedHiddenInputComponent';
import { CUSTOM_EMIT_EVENTS } from '../EMIT_EVENTS';

export class CheckboxComponent extends BaseFieldComponent {
  public placeholder: Widgets.BoxElement;
  public checkboxes: Array<Widgets.CheckboxElement> = [];
  private _checkboxesFieldName: string;
  public hiddenInput: BlessedHiddenInputComponent;
  private _message: string = '';
  public constructor(
    form: Widgets.FormElement<Answers>,
    prompt: PromptQuestion,
    option: IComponentOptions,
    hookForPrompt: SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined> | undefined
  ) {
    super(form, prompt, option, hookForPrompt);
    let left: number = 0;
    this._checkboxesFieldName = `_${this.prompt.name}_checkbox`;
    const choices: Array<string> = (this.prompt as Record<string, unknown>)?.choices as Array<string>;
    const isHorizontal: boolean = choices.length <= 3;
    choices?.forEach((element: string, index: number) => {
      const CheckBox: Widgets.CheckboxElement = blessed.checkbox({
        parent: this.form,
        text: element,
        name: this._checkboxesFieldName,
        checked: false,
        width: element.length + 4,
        left,
        height: 1,
        shrink: true,
        alwaysScroll: true,
        style: {
          focus: {
            fg: COLORS.green5
          }
        }
      });
      if (isHorizontal) {
        left += element.length + 5;
      }
      CheckBox.on('check', () => {
        this.setValue();
      });
      CheckBox.on('uncheck', () => {
        this.setValue();
      });
      CheckBox.on('focus', () => {
        this.label.style.fg = COLORS.green5;
        this.form.screen.render();
      });
      CheckBox.on('blur', async () => {
        this.label.style.fg = COLORS.black;
        await this.validateResult();
      });
      this.checkboxes.push(CheckBox);
    });
    this.hiddenInput = new BlessedHiddenInputComponent({
      hidden: true,
      parent: this.form,
      name: this.prompt.name
    });
    this.placeholder = blessed.box({
      tags: true,
      parent: this.form,
      height: 1,
      alwaysScroll: true,
      shrink: true,
      width: '100%'
    });
    if (isHorizontal) {
      this.elements.push(this.label, this.checkboxes, this.placeholder);
    } else {
      this.elements.push(this.label, ...this.checkboxes, this.placeholder);
    }
  }
  public async validateResult(): Promise<void> {
    if (this.prompt.name) {
      this.isValidate = await this.validate(this.hiddenInput.getValue());
      if (this.isValidate === true) {
        this.label.setContent(`${this._message}`);
        this.placeholder.setContent('');
      } else {
        const warningStr: string = this.isValidate ? this.isValidate : 'error';
        this.label.setContent(`{${COLORS.red6}-fg}*{/${COLORS.red6}-fg}${this._message}`);
        this.placeholder.setContent(`{${COLORS.red6}-fg}[${warningStr}]{/${COLORS.red6}-fg}`);
      }
    }
    this.form.screen.render();
  }
  public setValue(): void {
    const res: BaseValueType =
      this.checkboxes.filter((checkbox) => checkbox.checked)?.map((checkbox) => checkbox.text) ?? [];
    this.hiddenInput.setValue(res);
    this.form.emit(CUSTOM_EMIT_EVENTS.UPDATE_LAYOUT);
  }
  public async setMessage(): Promise<void> {
    try {
      const message: string = await this.message();
      this._message = message;
      this.label.setContent(message);
    } catch (e) {
      this.form.screen.log(e);
    }
  }
  public async setDefaultValue(): Promise<void> {
    try {
      const defaultValue: string = (await this.default()) as string;
      const values: Array<string> = (defaultValue as unknown as Array<string>) ?? [];
      this.checkboxes.forEach((checkbox) => {
        if (values?.indexOf(checkbox.text) >= 0) {
          checkbox.check();
        }
      });
      this.setValue();
    } catch (e) {
      this.form.screen.log(e);
    }
  }
}
