import { BaseFieldComponent, IComponentOptions, IExtendedAnswers } from './BaseFieldComponent';
import blessed, { Widgets, list } from 'blessed';

import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import { COLORS } from '../COLORS';
import { BlessedHiddenInputComponent } from './BlessedHiddenInputComponent';
import { nextTick } from 'process';

export class ListComponent extends BaseFieldComponent {
  public placeholder: Widgets.BoxElement;
  public hiddenInput: BlessedHiddenInputComponent;
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
    this.sourceList = this.createList();
    this.placeholder = blessed.box({
      tags: true,
      parent: this.form,
      height: 1,
      alwaysScroll: true,
      shrink: true,
      width: '100%'
    });
    this.hiddenInput = new BlessedHiddenInputComponent({
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
      keys: true,
      width: '100%',
      height: 5,
      border: 'line',
      scrollable: true,
      parseTags: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' ',
        track: {
          bg: COLORS.grey0
        },
        style: {
          inverse: true
        }
      },
      style: {
        selected: {
          bg: COLORS.grey0
        },
        focus: {
          border: {
            fg: COLORS.green5
          }
        }
      }
    } as Widgets.ListOptions<Widgets.ListElementStyle>);

    let currentSelectedItem: Widgets.BoxElement;
    let currentSelectedItemStyle: Record<string, any>;
    let isSelecting: boolean = false;
    sourceList.on('select', async (el: Widgets.BoxElement, selected: number) => {
      if (isSelecting) {
        return;
      }
      isSelecting = !isSelecting;
      if (sourceList._.rendering) return;
      const text: string = this.choices[selected];
      this.hiddenInput.setValue(text);

      // set selected item different color
      // @ts-ignore
      currentSelectedItem?.style = currentSelectedItemStyle;
      currentSelectedItem = el;
      currentSelectedItemStyle = el?.style;
      // @ts-ignore
      currentSelectedItem?.style = {
        bg: COLORS.red4
      };

      this.label.setContent(`${this._message}(${this.hiddenInput.getValue()})`);
      this.form.screen.render();
      await this.validateResult();
      // go back to form
      isSelecting = !isSelecting;
    });
    // store current select index,
    let currentMoveItemIndex: number = 0;
    sourceList.on('select item', (el: Widgets.BoxElement, selected: number) => {
      nextTick(() => {
        currentMoveItemIndex = selected;
      });
    });
    // prevent default form keys, if it's first or last one, run default function
    const removeKeys = (el: ListComponent, ch: string, key: Widgets.Events.IKeyEventArg): boolean => {
      if (key.name === 'up' && currentMoveItemIndex === 0) {
        return true;
      }
      if (key.name === 'down' && currentMoveItemIndex === this.choices.length - 1) {
        return true;
      }
      if (key.name === 'up' || key.name === 'down') {
        return false;
      }
      return true;
    };
    sourceList.on('element keypress', removeKeys);
    sourceList.key(['space'], () => {
      sourceList.emit('keypress', '\r', { name: 'enter' });
    });
    return sourceList;
  }
  public async validateResult(): Promise<void> {
    this.isValidate = await this.validate(this.hiddenInput.getValue());
    if (this.isValidate === true) {
      this.label.setContent(`${this._message}(${this.hiddenInput.getValue()})`);
      this.placeholder.setContent('');
    } else {
      const warningStr: string = this.isValidate ? this.isValidate : 'error';
      this.label.setContent(
        `{${COLORS.red6}-fg}*{/${COLORS.red6}-fg}${this._message}(${this.hiddenInput.getValue()})`
      );
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
      await this.setItems();
      const defaultValue: string = (await this.default()) as string;
      const tempIndex: number = this.choices.indexOf(defaultValue);
      const selectedIndex: number = tempIndex >= 0 ? tempIndex : 0;
      this.sourceList.emit('select', this.sourceList.getItem(selectedIndex), selectedIndex);
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
