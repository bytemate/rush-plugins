import { BaseFieldComponent, IComponentOptions, IExtendedAnswers } from './BaseFieldComponent';
import blessed, { Widgets, list } from 'blessed';

import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import { COLORS } from '../COLOR';
import { HiddenInputBlessedComponent } from './HiddenInputBlessedComponent';
import { nextTick } from 'process';

export class ListComponent extends BaseFieldComponent {
  public label: Widgets.BoxElement;
  public placeholder: Widgets.BoxElement;
  public hiddenInput: HiddenInputBlessedComponent;
  public sourceList: Widgets.ListElement;
  private _message: string = '';
  public choices: Array<string> = [];
  private _ListFieldName: string = '';
  public constructor(
    form: Widgets.FormElement<Answers>,
    prompt: PromptQuestion,
    option: IComponentOptions,
    hookForPrompt: SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined> | undefined
  ) {
    super(form, prompt, option, hookForPrompt);
    this._ListFieldName = `_list_field_name`;
    this.label = blessed.box({
      tags: true,
      parent: this.form,
      height: 1,
      content: prompt.name,
      alwaysScroll: true,
      shrink: true
    });
    this.sourceList = this.createList();
    this.placeholder = blessed.box({
      tags: true,
      parent: this.form,
      height: 1,
      alwaysScroll: true,
      shrink: true,
      width: '100%'
    });
    this.hiddenInput = new HiddenInputBlessedComponent({
      name: prompt.name,
      parent: this.form,
      hidden: true,
      value: []
    });
    this.elements.push(this.label, this.sourceList, this.placeholder);
  }
  public createList(): Widgets.ListElement {
    const sourceList: Widgets.ListElement = list({
      parent: this.form,
      name: this._ListFieldName,
      mouse: true,
      keys: true,
      width: '100%',
      height: 5,
      border: 'line',
      scrollbar: {
        ch: ' ',
        track: {
          bg: COLORS.red3
        },
        style: {
          inverse: true
        }
      },
      scrollable: true,
      alwaysScroll: true,
      style: {
        item: {
          hover: {
            bg: COLORS.blue3
          }
        },
        selected: {
          bg: COLORS.blue4,
          bold: true
        },
        focus: {
          border: {
            fg: COLORS.green5
          }
        }
      }
    } as Widgets.ListOptions<Widgets.ListElementStyle>);
    sourceList.on('select', async (el: Widgets.Node, selected: number) => {
      if (sourceList._.rendering) return;
      this.hiddenInput.setValue((el as Widgets.BoxElement).getText());
      this.label.setContent(`${this._message}(${this.hiddenInput.value})`);
      await this.validateResult();
      // go back to form
      this.form.focus();
    });
    // store current select index,
    let currentSelectedItem: number = 0;
    sourceList.on('select item', (el: Widgets.Node, selected: number) => {
      nextTick(() => {
        currentSelectedItem = selected;
      });
    });
    // prevent default form keys, if it's first or last one, run default function
    const removeKeys = (el: ListComponent, ch: string, key: Widgets.Events.IKeyEventArg): boolean => {
      if (key.name === 'up' && currentSelectedItem === 0) {
        return true;
      }
      if (key.name === 'down' && currentSelectedItem === this.choices.length - 1) {
        return true;
      }
      return false;
    };
    sourceList.on('element keypress', removeKeys);
    return sourceList;
  }
  public async validateResult(): Promise<void> {
    this.isValidate = await this.validate(this.hiddenInput.value);
    if (this.isValidate === true) {
      this.label.setContent(`${this._message}(${this.hiddenInput.value})`);
      this.placeholder.setContent('');
    } else {
      const warningStr: string = this.isValidate ? this.isValidate : 'error';
      this.label.setContent(`{${COLORS.red6}-fg}*{/${COLORS.red6}-fg}${this._message}`);
      this.placeholder.setContent(`{${COLORS.red6}-fg}[${warningStr}]{/${COLORS.red6}-fg}`);
    }
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
      if (defualtValue) {
        this.hiddenInput.setValue(defualtValue);
        this.label.setContent(`${this._message}(${this.hiddenInput.value})`);
        await this.validateResult();
      }
      await this.setItems();
      this.sourceList.select(defualtValue ? this.choices.indexOf(defualtValue) : 0);
    } catch (e) {
      this.form.screen.log(e);
    }
  }
  public async setItems(): Promise<void> {
    this.form.submit();
    const choicesRaw: Array<string> | ((answers: Answers) => Array<string>) = (
      this.prompt as Record<string, unknown>
    )?.choices as Array<string> | Array<string> | ((answers: Answers) => Array<string>);
    let items: string[] = [];
    if (typeof choicesRaw === 'function') {
      items = await choicesRaw(this.form.submission);
    } else if (choicesRaw instanceof Array) {
      items = choicesRaw;
    }
    this.choices = items;
    this.choices.forEach((str: string) => {
      this.sourceList.add(str);
    });
    this.form.screen.render();
  }
}
