import { BaseFieldComponent, IComponentOptions, IExtendedAnswers } from './BaseFieldComponent';
import blessed, { Widgets, list } from 'blessed';

import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';
import { nextTick } from 'process';
import { COLORS } from '../COLOR';
import { HiddenInputBlessedComponent } from './HiddenInputBlessedComponent';

export class AutoCompleteComponent extends BaseFieldComponent {
  public label: Widgets.BoxElement;
  public placeholder: Widgets.BoxElement;
  public input: Widgets.TextareaElement;
  public hiddenInput: HiddenInputBlessedComponent;
  public sourceList: Widgets.ListElement;
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
      content: prompt.name,
      alwaysScroll: true,
      shrink: true
    });
    this.input = blessed.textarea({
      parent: this.form,
      inputOnFocus: true,
      border: 'line',
      width: '100%',
      mouse: true,
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

    this.hiddenInput = new HiddenInputBlessedComponent({
      name: prompt.name,
      parent: this.form,
      hidden: true
    });

    this.input.on('focus', () => {
      this.label.style.fg = COLORS.green5;
      this.form.scrollTo(Number(this.input.top) - 1);

      this.showList();
    });
    this.input.on('blur', async () => {
      this.label.style.fg = COLORS.black;
      this.form.screen.render();
    });
    this.input.on('keypress', () => {
      // to get on time input
      nextTick(async () => {
        await this.setItems(this.input.value);
      });
    });
    // focus on list
    this.input.on('element keypress', (el, ch, key) => {
      if (key.name === 'down') {
        this.input.submit();
        this.sourceList.focus();
        return false;
      }
    });
    this.placeholder = blessed.box({
      tags: true,
      parent: this.form,
      height: 1,
      alwaysScroll: true,
      shrink: true,
      width: '100%'
    });
    this.sourceList = this.createList();
    this.elements.push(this.label, this.input, this.placeholder);
  }
  public showList(): void {
    this.sourceList.top = Number(this.input.top) - this.form.childBase + Number(this.input.height) - 1;
    this.sourceList.left = Number(this.input.left);
    this.sourceList.show();
    if (!this.sourceList.parent) {
      this.form.parent.append(this.sourceList);
    }
    this.form.screen.render();
  }
  public createList(): Widgets.ListElement {
    const sourceList: Widgets.ListElement = list({
      mouse: true,
      keys: true,
      width: '100%',
      index: 2,
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
      },
      hidden: true
    } as Widgets.ListOptions<Widgets.ListElementStyle>);
    sourceList.on('select', async (el: Widgets.Node, selected: number) => {
      if (sourceList._.rendering) return;
      this.hiddenInput.setValue((el as Widgets.BoxElement).getText());
      this.label.setContent(`${this._message}(${this.hiddenInput.value})`);
      this.sourceList.hide();
      await this.validateResult();
      this.form.screen.render();
    });
    sourceList.on('hide', () => {
      this.form.screen.render();
    });
    sourceList.on('show', () => {
      this.form.screen.render();
    });

    return sourceList;
  }
  public reset(): void {
    this.sourceList.hide();
  }
  public async validateResult(): Promise<void> {
    this.isValidate = await this.validate({ value: this.hiddenInput.value });
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
      await this.setItems();
      const defualtValue: string = await this.default();
      this.hiddenInput.setValue(defualtValue);
      this.label.setContent(`${this._message}(${this.hiddenInput.value})`);
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
    items.forEach((str: string) => {
      this.sourceList.add(str);
    });
    this.form.screen.render();
  }
}
