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
import { CUSTOM_EMIT_EVENTS } from '../EMIT_EVENTS';

const SELECT_TEXT_LABEL: string = `{${COLORS.grey0}}search in the list, select by space/enter{/${COLORS.grey0}}`;

interface IPromiseState {
  state: boolean;
  value: string;
}

export class AutoCompleteComponent extends BaseFieldComponent {
  public placeholder: Widgets.BoxElement;
  public input: Widgets.TextareaElement;
  public hiddenInput: BlessedHiddenInputComponent;
  public sourceList: Widgets.ListElement;
  private _messageState: IPromiseState = {
    state: false,
    value: ''
  };
  private _defaultState: IPromiseState = {
    state: false,
    value: ''
  };
  private _inputCache: string;
  private _choices: Array<string> = [];
  public constructor(
    form: Widgets.FormElement<Answers>,
    prompt: PromptQuestion,
    option: IComponentOptions,
    hookForPrompt: SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined> | undefined
  ) {
    super(form, prompt, option, hookForPrompt);
    // listener on prompt
    const _: AutoCompleteComponent = this;
    this.prompt = new Proxy(prompt, {
      set(target: Record<string, () => void>, prop: string, newValue: string | (() => void)) {
        switch (prop) {
          case 'default':
            // eslint-disable-next-line no-void
            void _.setDefaultValue();
            break;
          default:
            break;
        }
        return true;
      }
    });

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

    sourceList.on('focus', () => {
      this.label.style.fg = COLORS.green5;
      this.form.screen.render();
    });
    sourceList.on('blur', async () => {
      this.label.style.fg = COLORS.black;
      await this.validateResult();
      this.form.screen.render();
    });

    sourceList.on('select', (el: Widgets.BoxElement, selected: number) => {
      if (sourceList._.rendering) return;
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
      this.label.setContent(this._messageState.value);
      this.form.screen.render();
      this.form.emit(CUSTOM_EMIT_EVENTS.UPDATE_LAYOUT);
    });
    // store current select index,
    let currentSelectedItemIndex: number = 0;
    sourceList.on('select item', (el: Widgets.BoxElement, selected: number) => {
      nextTick(() => {
        currentSelectedItemIndex = selected;
      });
    });

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
      this.label.setContent(this._messageState.value);
      this.placeholder.setContent('');
    } else {
      const warningStr: string = this.isValidate ? this.isValidate : 'error';
      this.label.setContent(`{${COLORS.red6}-fg}*{/${COLORS.red6}-fg}${this._messageState.value}`);
      this.placeholder.setContent(`{${COLORS.red6}-fg}[${warningStr}]{/${COLORS.red6}-fg}`);
    }
  }
  public async setMessage(): Promise<void> {
    if (this._messageState.state) {
      return;
    }
    this._messageState.state = true;
    try {
      const message: string = await this.message();
      this._messageState.value = `${message}${SELECT_TEXT_LABEL}`;
      this.label.setContent(`${this._messageState.value}`);
    } catch (e) {
      this.form.screen.log('autocomplete set message error', e);
    }
    this._messageState.state = false;
  }
  public async setDefaultValue(): Promise<void> {
    if (this._defaultState.state) {
      return;
    }
    this._defaultState.state = true;
    try {
      if (this.input.getValue()) {
        return;
      }
      const defaultValue: string = (await this.default()) as string;
      if (defaultValue === this._defaultState.value) {
        this._defaultState.state = false;
        return;
      }
      await this.setItems();
      this._defaultState.value = defaultValue;
      const tempIndex: number = this._choices.indexOf(defaultValue);
      const selectedIndex: number = tempIndex >= 0 ? tempIndex : 0;
      this.sourceList.emit('select', this.sourceList.getItem(selectedIndex), selectedIndex);
    } catch (e) {
      this.form.screen.log('autocomplete set default error', e);
    }
    this._defaultState.state = false;
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
