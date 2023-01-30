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
import { COLORS } from '../COLORS';
import { CUSTOM_EMIT_EVENTS } from '../EMIT_EVENTS';

type FieldComponent =
  | InputComponent
  | ConfirmComponent
  | CheckboxComponent
  | AutoCompleteComponent
  | ListComponent;

const createSubmit = (
  form: Widgets.FormElement<Answers>,
  formValidateAndSubmit: () => {}
): Widgets.ButtonElement => {
  const DEFAULT_TEXT: string = '{center}{bold}SUBMIT{bold}{/center}';
  const SUBMINTING_TEXT: string = '{center}submiting, please wait patiently{/center}';
  const submitBtn: Widgets.ButtonElement = blessed.button({
    parent: form,
    name: '_submit',
    tags: true,
    height: 3,
    border: 'line',
    content: DEFAULT_TEXT,
    style: {
      fg: COLORS.blue2,
      border: {
        fg: COLORS.blue2
      },
      hover: {
        fg: COLORS.blue4,
        border: {
          fg: COLORS.blue4
        }
      },
      focus: {
        fg: COLORS.green5,
        border: {
          fg: COLORS.green5
        }
      }
    }
  });
  let isSubmitting: boolean = false;
  const submitAnswer = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }
    submitBtn.setContent(SUBMINTING_TEXT);
    submitBtn.screen.render();
    isSubmitting = !isSubmitting;
    try {
      const res: Answers | boolean = await formValidateAndSubmit();
      if (res) {
        form.emit(CUSTOM_EMIT_EVENTS.SUBMIT_ANSWERS, res);
      }
    } catch (e) {
      form.screen.log('error', e);
    }
    submitBtn.setContent(DEFAULT_TEXT);
    submitBtn.screen.render();
    isSubmitting = !isSubmitting;
  };
  submitBtn.on(
    'element keypress',
    (el: ListComponent, ch: string, key: Widgets.Events.IKeyEventArg): boolean => {
      if (key.name === 'down') {
        return false;
      }
      return true;
    }
  );
  submitBtn.on(
    'element keypress',
    async (el: ListComponent, ch: string, key: Widgets.Events.IKeyEventArg): Promise<boolean> => {
      if (key.name === 'return' || key.name === 'space') {
        await submitAnswer();
      }
      return true;
    }
  );
  submitBtn.on('click', submitAnswer);
  return submitBtn;
};

const createValidateMessage = (screen: Widgets.Screen): Widgets.MessageElement => {
  // elements
  const message: Widgets.MessageElement = blessed.message({
    parent: screen,
    border: 'line',
    height: 'shrink',
    width: 'shrink',
    top: 'center',
    left: 'center',
    index: 100,
    label: ' {blue-fg}Validate Error{/blue-fg} ',
    tags: true,
    keys: true,
    hidden: true
  });
  return message;
};

export const Form = async (
  promptQueue: Array<PromptQuestion>
): Promise<{
  form: Widgets.FormElement<Answers>;
}> => {
  const hooks: IHooks = getHooks();
  const form: Widgets.FormElement<Answers> = blessed.form({
    keys: true,
    shrink: true,
    height: '100%-2',
    width: '100%',
    top: 2,
    scrollable: true,
    alwaysScroll: true
  }) as Widgets.FormElement<Answers>;

  // process promte fields and append to form
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

  const message: Widgets.MessageElement = createValidateMessage(form.screen);
  const formValidateAndSubmit = async (): Promise<Answers | boolean> => {
    form.submit();
    let isValidate: boolean = true;
    const failedFields: Array<string> = [];
    const result: Record<string, any> = {};
    for (let index: number = 0; index < promoteField.length; index++) {
      try {
        if (promoteField[index].isActived) {
          await promoteField[index].validateResult();
          if (promoteField[index].isValidate !== true) {
            isValidate = false;
            failedFields.push(promoteField[index].label.getContent());
            continue;
          }
          const fieldName: string | undefined = promoteField[index].prompt?.name;
          if (fieldName) {
            result[fieldName] = form.submission[fieldName];
          }
        }
      } catch (e) {
        form.screen.log('submit vaildate error', e);
        isValidate = false;
      }
    }

    if (isValidate) {
      return result;
    } else {
      message.once('element keypress', () => {
        form.focus();
        message.hide();
        return false;
      });
      message.focus();
      message.error(
        `please fix following fields: \n${failedFields.join('\n')} \n \n press any button to continue`,
        -1,
        () => {}
      );
      return false;
    }
  };
  const submitBtn: Widgets.ButtonElement = createSubmit(form, formValidateAndSubmit);
  const updateFormLayout = async (): Promise<void> => {
    form.submit();
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
    submitBtn.top = top;
  };
  // forbidden first rotate
  const firstField: Widgets.Node | undefined = promoteField[0].getFieldComponent();
  if (firstField) {
    firstField.on('element keypress', (el: Widgets.Node, ch: string, key: Widgets.Events.IKeyEventArg) => {
      if (key.name === 'up') {
        return false;
      }
    });
  }
  await updateFormLayout();
  form.on(CUSTOM_EMIT_EVENTS.UPDATE_LAYOUT, async () => {
    await updateFormLayout();
    form.screen.render();
  });
  return { form };
};
