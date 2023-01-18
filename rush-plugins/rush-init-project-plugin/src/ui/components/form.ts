import blessed, { Widgets } from 'blessed';
import { InputComponent } from './InputComponent';
import { ConfirmComponent } from './ConfirmComponent';
import { CheckboxComponent } from './CheckboxComponent';
import { AutoCompleteComponent } from './AutoCompleteComponent';
import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import { IHooks, getHooks } from '../../hooks';
import { IComponentOptions, IExtendedAnswers } from './BaseFieldComponent';
import { ListComponent } from './ListComponent';

type FieldComponent =
  | InputComponent
  | ConfirmComponent
  | CheckboxComponent
  | AutoCompleteComponent
  | ListComponent;

export const Form = async (
  promptQueue: Array<PromptQuestion>
): Promise<{
  form: Widgets.FormElement<Answers>;
  formSubmit: () => Answers | boolean;
}> => {
  const hooks: IHooks = getHooks();
  const form: Widgets.FormElement<Answers> = blessed.form({
    keys: true,
    shrink: true,
    height: '100%',
    mouse: true,
    scrollable: true,
    scrollbar: {
      ch: ' ',
      style: {
        inverse: true
      }
    },
    alwaysScroll: true
  }) as Widgets.FormElement<Answers>;
  const promoteField: Array<FieldComponent> = [];
  for (let i: number = 0; i < promptQueue.length; i++) {
    let prompt: PromptQuestion = promptQueue[i];
    let fieldRender: FieldComponent;

    const option: IComponentOptions = {
      top: 4 * i,
      height: 0
    };
    const hookForCurrentPrompt:
      | SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined>
      | undefined = hooks.promptQuestion.get(prompt.name);

    if (hookForCurrentPrompt) {
      await form.submit();
      await hookForCurrentPrompt.call(prompt, form.submission);
      prompt = promptQueue[i];
    }

    switch (prompt.type) {
      case 'confirm':
        fieldRender = new ConfirmComponent(form, prompt, option, hookForCurrentPrompt);
        break;
      case 'checkbox':
        fieldRender = new CheckboxComponent(form, prompt, option, hookForCurrentPrompt);
        break;
      case 'list':
        fieldRender = new ListComponent(form, prompt, option, hookForCurrentPrompt);
        break;
      case 'autocomplete':
        fieldRender = new AutoCompleteComponent(form, prompt, option, hookForCurrentPrompt);
        break;
      default:
        fieldRender = new InputComponent(form, prompt, option, hookForCurrentPrompt);
    }
    await fieldRender.initState();
    promoteField.push(fieldRender);
  }
  const updateForm = async (): Promise<void> => {
    try {
      form.submit.bind(form)();
    } catch (e) {
      form.screen.log('updateForm', e);
    }
    let top: number = 0;
    for (let index: number = 0; index < promoteField.length; index++) {
      const pro: FieldComponent = promoteField[index];
      await pro.invokeHooks();
      await pro.when();
      pro.updateLayout({
        top: top,
        height: 0
      });
      const layout: IComponentOptions = pro.getLayout();
      top = layout.top + layout?.height;
    }
  };
  await updateForm();
  form.on('update', async () => {
    await updateForm();
    form.screen.cursorReset();
    form.screen.render();
  });
  form.on('scroll', () => {
    for (let index: number = 0; index < promoteField.length; index++) {
      const pro: FieldComponent = promoteField[index];
      pro.reset();
      form.screen.cursorReset();
      form.screen.render();
    }
  });
  const formSubmit = async (): Promise<Answers | boolean> => {
    form.submit();
    let isValidate: boolean = true;
    for (let index: number = 0; index < promoteField.length; index++) {
      try {
        await promoteField[index].validateResult();
        if (promoteField[index].isValidate !== true) {
          isValidate = false;
        }
      } catch (e) {
        form.screen.log('submit vaildate error', e);
        isValidate = false;
      }
    }

    if (isValidate) {
      return form.submission;
    } else {
      return false;
    }
  };
  return { form, formSubmit };
};
