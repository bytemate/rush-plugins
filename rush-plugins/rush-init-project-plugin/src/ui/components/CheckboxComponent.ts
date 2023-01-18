import { BaseFieldComponent, IComponentOptions, IExtendedAnswers, BaseValueType } from './BaseFieldComponent';
import blessed, { Widgets } from 'blessed';

import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import { COLORS } from '../COLOR';
import { HiddenInputBlessedComponent } from './HiddenInputBlessedComponent';

export class CheckboxComponent extends BaseFieldComponent {
  public label: Widgets.BoxElement;
  public placeholder: Widgets.BoxElement;
  public checkboxes: Array<Widgets.CheckboxElement> = [];
  private _checkboxesFieldName: string;
  public hiddenInput: HiddenInputBlessedComponent;
  private _message: string = '';
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
        mouse: true,
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
        this.form.screen.render();
      });
      this.checkboxes.push(CheckBox);
    });
    this.hiddenInput = new HiddenInputBlessedComponent({
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
      this.isValidate = await this.validate(this.hiddenInput.value);
      if (this.isValidate === true) {
        this.label.setContent(`${this._message}`);
        this.placeholder.setContent('');
      } else {
        const warningStr: string = this.isValidate ? this.isValidate : 'error';
        this.label.setContent(`{${COLORS.red6}-fg}*{/${COLORS.red6}-fg}${this._message}`);
        this.placeholder.setContent(`{${COLORS.red6}-fg}[${warningStr}]{/${COLORS.red6}-fg}`);
      }
    }
  }
  public setValue(): void {
    const res: BaseValueType =
      this.checkboxes.filter((checkbox) => checkbox.checked)?.map((checkbox) => checkbox.text) ?? [];
    this.hiddenInput.setValue(res);
    this.form.emit('update');
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
      const defualtValue: string = await this.default();
      const values: Array<string> = (defualtValue as unknown as Array<string>) ?? [];
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
