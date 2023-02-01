import { box, Widgets } from 'blessed';
import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';

export interface IComponentOptions {
  height: number;
  top: number;
}
export type BaseValueType = number | string | boolean | Array<string | boolean | number>;
export interface IExtendedAnswers extends Answers {
  authorName: string;
  description: string;
  template: string;
  packageName: string;
  unscopedPackageName: string;
  projectFolder: string;
  shouldRunRushUpdate: boolean;
}

/**
 * This is a basic Field component based on inquirer
 * Any new component based on inquirer should extend this class
 */
export class BaseFieldComponent {
  /**
   * Each Field need a label
   */
  public label: Widgets.BoxElement;
  public option: IComponentOptions;
  public form: Widgets.FormElement<Answers>;
  public prompt: PromptQuestion;
  /**
   * control the active of the this field, if this field is active, its value is active and it's visible
   */
  public isActived: boolean = true;
  /**
   * validation of the field
   */
  public isValidate: boolean | string = true;
  /**
   * all elements involved in field
   */
  public elements: Array<Widgets.BoxElement | Widgets.BoxElement[]> = [];
  private _hookForPrompt: SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined> | undefined;
  public constructor(
    form: Widgets.FormElement<Answers>,
    prompt: PromptQuestion,
    option: IComponentOptions,
    hookForPrompt: SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined> | undefined
  ) {
    this.form = form;
    this.prompt = prompt;
    this.option = option;
    this._hookForPrompt = hookForPrompt;
    this.label = box({
      tags: true,
      parent: this.form,
      height: 1,
      content: this.prompt.name,
      alwaysScroll: true,
      shrink: true
    });
  }
  /**
   * validate result based on blessed widget implemented by every component
   */
  public async validateResult(): Promise<void> {}
  /**
   * set default value on the blessed widget  implemented by every component
   */
  public async setDefaultValue(): Promise<void> {}
  /**
   * set content on the blessed widget implemented by every component
   */
  public async setMessage(): Promise<void> {}
  /**
   * used for blessed to focus on field implemented by every component
   */
  public focus(): void {}
  /**
   * used for blessed to focus on next field
   */
  public focusNext(): void {
    this.form.focusNext();
  }
  /**
   * get really field object
   */
  public getFieldComponent(): Widgets.Node | undefined {
    return;
  }
  public reset(): void {}
  public render(): void {
    this.form.screen.render();
  }
  public async invokeHooks(): Promise<void> {
    if (this._hookForPrompt) {
      await this._hookForPrompt.call(this.prompt, this.form.submission);
    }
  }
  /**
   * get current total height of  all elements and it's top
   */
  public getLayout(): IComponentOptions {
    return this.elements.reduce(
      (prev, cur) => {
        let height: number = 0;
        if (this.isActived) {
          if (cur instanceof Array) {
            height = Number(cur[0]?.height ?? 0);
          } else {
            height = Number(cur?.height ?? 0);
          }
        }
        return {
          height: Number(prev.height) + height,
          top: prev.top
        };
      },
      { height: 0, top: this.option.top }
    );
  }
  /**
   * update and top of all elements
   */
  public updateLayout(updateOption: IComponentOptions): IComponentOptions {
    this.option = { ...this.option, ...updateOption };
    const top: number = Number(this.option.top) ?? 0;
    let totalHeight: number = 0;
    this.elements.forEach((ele: Widgets.BoxElement | Widgets.BoxElement[], index: number) => {
      if (ele instanceof Array) {
        ele.forEach((item: Widgets.BoxElement) => {
          item.top = top + totalHeight;
        });
        if (this.isActived) {
          totalHeight += Number(ele[0]?.height ?? 0);
        }
      } else {
        ele.top = top + totalHeight;
        if (this.isActived) {
          totalHeight += Number(ele?.height ?? 0);
        }
      }
    });
    return {
      top,
      height: totalHeight
    };
  }
  /**
   * The default value of the question.
   * implement of default param in inquirer
   */
  public async default(): Promise<BaseValueType> {
    let defaultValue: BaseValueType = '';
    switch (typeof this.prompt.default) {
      case 'function':
        defaultValue = (await this.prompt.default(this.form.submission)) ?? '';
        break;
      case 'boolean':
        defaultValue = this.prompt.default;
        break;
      case 'number':
        defaultValue = this.prompt.default;
        break;
      default:
        defaultValue = this.prompt.default ?? '';
        break;
    }
    return defaultValue;
  }
  /**
   * The message value of the question.
   * implement of message param in inquirer
   */
  public async message(): Promise<string> {
    let message: string = '';
    if (typeof this.prompt.message === 'function') {
      message = (await this.prompt.message(this.form.submission)) ?? '';
    } else if (typeof this.prompt.message === 'string') {
      message = this.prompt.message ?? '';
    }
    return message;
  }
  /**
   * Validates the integrity of the answer.
   * implement of validate param in inquirer
   *
   * @param input
   * The answer provided by the user.
   *
   * @returns
   * If this field is inactive, it will always return true
   * Either a value indicating whether the answer is valid or a `string` which describes the error.
   */
  public async validate(value: BaseValueType | { value: BaseValueType }): Promise<boolean | string> {
    if (!this.isActived) {
      return true;
    }
    const { validate } = this.prompt;
    if (typeof validate === 'function') {
      this.form.submit();
      return await validate(value, this.form.submission);
    }
    return true;
  }
  /**
   * A value indicating whether the question should be prompted.
   * implement of when param in inquirer
   */
  public async when(): Promise<void> {
    switch (typeof this.prompt.when) {
      case 'function':
        this.isActived = await this.prompt.when(this.form.submission);
        break;
      default:
        this.isActived = true;
        break;
    }
    this.elements.forEach((ele: Widgets.BoxElement | Widgets.BoxElement[], index: number) => {
      if (ele instanceof Array) {
        ele.forEach((item: Widgets.BoxElement) => {
          if (this.isActived) {
            item.show();
          } else {
            item.hide();
          }
        });
      } else {
        if (this.isActived) {
          ele.show();
        } else {
          ele.hide();
        }
      }
    });
  }
  /**
   * init state include default and message config
   */
  public async initState(): Promise<void> {
    await this.setMessage();
    await this.setDefaultValue();
  }
}
