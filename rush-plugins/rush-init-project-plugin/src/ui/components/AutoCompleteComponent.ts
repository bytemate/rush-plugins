import { BaseFieldComponent, IComponentOptions, IExtendedAnswers } from './BaseFieldComponent';
import blessed, { Widgets, list } from 'blessed';

import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';
import { nextTick } from 'process';
import { COLORS } from '../COLORS';
import { BlessedHiddenInputComponent } from './BlessedHiddenInputComponent';
import { ListComponent } from './ListComponent';

const SELECT_TEXT_LABEL: string = `{${COLORS.grey0}}search in the list, select by space/enter{/${COLORS.grey0}}`;

export class AutoCompleteComponent extends BaseFieldComponent {
  public placeholder: Widgets.BoxElement;
  public input: Widgets.TextareaElement;
  public hiddenInput: BlessedHiddenInputComponent;
  public sourceList: Widgets.ListElement;
  private _message: string = '';
  private _inputCache: string;
  private _choices: Array<string> = [];
  public constructor(
    form: Widgets.FormElement<Answers>,
    prompt: PromptQuestion,
    option: IComponentOptions,
    hookForPrompt: SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined> | undefined
  ) {
    super(form, prompt, option, hookForPrompt);
    this.input = blessed.textarea({
      name: `_autocomplete_${prompt.name}`,
      parent: this.form,
      inputOnFocus: true,
      border: 'line',
      width: '100%',
      height: 3,
      style: {
        focus: {
          border: {
            fg: COLORS.green5
          }
        }
      },
      alwaysScroll: true,
      scrollable: false,
      shrink: true
    });
    this._inputCache = this.input.getValue();
    this.hiddenInput = new BlessedHiddenInputComponent({
      name: prompt.name,
      parent: this.form,
      hidden: true
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
    this.input.on('focus', () => {
      this.label.style.fg = COLORS.green5;
      const scrollTop: number = Number(this.label.top) ?? 0;
      if (scrollTop) {
        form.scrollTo(scrollTop);
      }
      this.form.screen.render();
    });
    this.input.on('blur', async () => {
      this.label.style.fg = COLORS.black;
      this._inputCache = this.input.getValue();
      this.form.screen.render();
    });
    this.sourceList.on('focus', () => {
      this.label.style.fg = COLORS.green5;
      this.form.screen.render();
    });
    this.sourceList.on('blur', async () => {
      this.label.style.fg = COLORS.black;
      await this.validateResult();
      this.form.screen.render();
    });
    this.input.key(['return'], () => {
      // Workaround, since we can't stop the return from being added.
      this.input.emit('keypress', null, { name: 'backspace' });
      this.input.emit('keypress', '\x1b', { name: 'escape' });
      this.form.focusNext();
      return;
    });
    this.input.on('keypress', () => {
      // to get on time input
      nextTick(async () => {
        if (this._inputCache !== this.input.value) {
          await this.setItems(this.input.value);
          this.sourceList.emit('select', this.sourceList.getItem(0), 0);
        }
      });
    });
    this.elements.push(this.label, this.input, this.sourceList, this.placeholder);
  }
  public createList(): Widgets.ListElement {
    const sourceList: Widgets.ListElement = list({
      name: `_list_${this.prompt.name}`,
      parent: this.form,
      keys: true,
      width: '100%',
      height: 5,
      border: 'line',
      content: 'empty',
      scrollable: true,
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
    let currentSelectedItemStyle: Record<string, any> = {};
    let isSelecting: boolean = false;
    sourceList.on('select', async (el: Widgets.BoxElement, selected: number) => {
      if (isSelecting) {
        return;
      }
      if (sourceList._.rendering) return;
      isSelecting = !isSelecting;
      this.hiddenInput.setValue(this._choices[selected]);
      // set selected item different color
      // @ts-ignore
      currentSelectedItem?.style = currentSelectedItemStyle;
      currentSelectedItem = el;
      currentSelectedItemStyle = el?.style;
      // @ts-ignore
      currentSelectedItem?.style = {
        bg: COLORS.red4
      };
      this.label.setContent(this._message);
      this.form.screen.render();
      isSelecting = !isSelecting;
    });
    // store current select index,
    let currentSelectedItemIndex: number = 0;
    sourceList.on('select item', (el: Widgets.BoxElement, selected: number) => {
      nextTick(() => {
        currentSelectedItemIndex = selected;
      });
    });
    // sourceList.key(['enter'], () => {
    //   this.form.focusNext();
    // })
    sourceList.key(['space'], () => {
      sourceList.emit('keypress', '\r', { name: 'enter' });
    });
    const removeKeys = (el: ListComponent, ch: string, key: Widgets.Events.IKeyEventArg): boolean => {
      if (key.name === 'up' && currentSelectedItemIndex === 0) {
        return true;
      }
      if (key.name === 'down' && currentSelectedItemIndex === this._choices.length - 1) {
        return true;
      }
      if (key.name === 'up' || key.name === 'down') {
        return false;
      }
      return true;
    };
    sourceList.on('element keypress', removeKeys);
    return sourceList;
  }
  public async validateResult(): Promise<void> {
    this.isValidate = await this.validate({ value: this.hiddenInput.getValue() });
    if (this.isValidate === true) {
      this.label.setContent(this._message);
      this.placeholder.setContent('');
    } else {
      const warningStr: string = this.isValidate ? this.isValidate : 'error';
      this.label.setContent(`{${COLORS.red6}-fg}*{/${COLORS.red6}-fg}${this._message}`);
      this.placeholder.setContent(`{${COLORS.red6}-fg}[${warningStr}]{/${COLORS.red6}-fg}`);
    }
    this.form.screen.render();
  }
  public async setMessage(): Promise<void> {
    try {
      const message: string = await this.message();
      this._message = `${message}${SELECT_TEXT_LABEL}`;
      this.label.setContent(`${this._message}`);
    } catch (e) {
      this.form.screen.log(e);
    }
  }
  public async setDefaultValue(): Promise<void> {
    try {
      await this.setItems();
      const defaultValue: string = (await this.default()) as string;
      const selectedIndex: number = this._choices.indexOf(defaultValue);
      if (selectedIndex >= 0) {
        this.sourceList.emit('select', this.sourceList.getItem(selectedIndex), selectedIndex);
      }
    } catch (e) {
      this.form.screen.log(e);
    }
  }
  public async setItems(value?: string): Promise<void> {
    this.form.submit();
    const prompt: AutocompletePrompt.AutocompleteQuestionOptions = this
      .prompt as AutocompletePrompt.AutocompleteQuestionOptions;
    const items: string[] = await prompt.source(this.form.submission, value);
    this.sourceList.clearItems();
    this._choices = items;
    items.forEach((str: string) => {
      this.sourceList.add(str);
    });
    this.form.screen.render();
  }
}
