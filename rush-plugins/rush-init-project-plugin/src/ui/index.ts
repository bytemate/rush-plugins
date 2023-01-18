import blessed, { box, Widgets } from 'blessed';
import { goNext, start, getCurrentState, PROCESS_STATUS } from './events';
import { Steps } from './components/steps';
import { Form } from './components/form';
import { TemplateList } from './components/templateList';
import type { Answers } from 'inquirer';
import type { IPluginContext } from '../logic/TemplateConfiguration';
import type { NodePlopAPI, PlopCfg, PromptQuestion } from 'node-plop';
import { ICliParams } from '../init-project';
import { COLORS } from './COLOR';

export const initBlessedForm = async (
  promptQueue: Array<PromptQuestion>,
  pluginContext: IPluginContext,
  plop: NodePlopAPI,
  plopCfg: PlopCfg & ICliParams,
  loadTemplateConfiguration: (promptQueue: PromptQuestion[], template: string) => Promise<void>,
  templateChoices: { name: string; value: string }[]
): Promise<Answers> => {
  const screen: Widgets.Screen = blessed.screen({
    debug: plopCfg.verbose,
    dump: plopCfg.verbose,
    log: plopCfg.verbose ? './blessed.log' : undefined,
    dockBorders: true,
    transparent: true,
    smartCSR: true,
    useBCE: true
  });
  const { stepBox, setStep } = Steps();
  screen.append(stepBox);
  screen.render();
  screen.key(['C-c'], () => {
    return process.exit(0);
  });
  screen.append(
    blessed.box({
      bottom: 0,
      height: 1,
      transparent: true,
      index: 2,
      content: 'press ctrl-c to exit or ESC to submit',
      style: {
        fg: COLORS.amber6
      }
    })
  );
  const downBtn: Widgets.BoxElement = blessed.box({
    bottom: 1,
    right: 1,
    height: 1,
    mouse: true,
    width: 2,
    content: '⬇',
    style: {
      fg: COLORS.green4
    }
  });
  const upBtn: Widgets.BoxElement = blessed.box({
    bottom: 2,
    right: 1,
    height: 1,
    mouse: true,
    width: 2,
    content: '⬆',
    style: {
      fg: COLORS.red4
    }
  });
  screen.on('resize', () => {
    screen.render();
  });
  start();
  let answers: Answers = {};
  let template: string = '';
  if (getCurrentState() === PROCESS_STATUS.TEMPLATE_SELECTING) {
    setStep(PROCESS_STATUS.TEMPLATE_SELECTING);
    const templateBox: Widgets.BoxElement = box({
      parent: screen,
      top: 2,
      height: '100%-3'
    });
    const { templateList } = TemplateList(templateChoices);
    templateBox.append(templateList);
    templateList.focus();
    screen.render();
    template = await new Promise<string>((resolve, reject) => {
      let selectedItem: string = templateChoices[0].value;
      templateList.on('select', function (el: Widgets.Node, selected: number) {
        selectedItem = templateChoices[selected].value;
        if (templateList._.rendering) return;
      });
      templateList.children.forEach(function (item: Widgets.Node, index: number) {
        item.on('click', () => {
          selectedItem = templateChoices[index].value;
          screen.remove(templateBox);
          resolve(selectedItem);
        });
      });

      templateList.key(['return'], function () {
        screen.remove(templateBox);
        resolve(selectedItem);
      });
    });
    await loadTemplateConfiguration(promptQueue, template);
    goNext();
  }
  if (getCurrentState() === PROCESS_STATUS.FORM_FILLING) {
    setStep(PROCESS_STATUS.FORM_FILLING);
    const formBox: Widgets.BoxElement = box({
      parent: screen,
      top: 2,
      height: '100%-3'
    });
    const formInputMouseEmit = (key: Widgets.Events.IMouseEventArg): void => {
      if (key.action === 'mousedown') {
        if (screen.focused?.type === 'textarea') {
          screen.focused.emit('keypress', '\x1b', { name: 'escape' });
          screen.focusPop();
        }
      }
    };
    // used to emit input focus problem
    screen.program.on('mouse', formInputMouseEmit);
    try {
      const { form, formSubmit } = await Form(promptQueue);
      formBox.append(form);
      screen.append(downBtn);
      screen.append(upBtn);
      downBtn.on('click', () => {
        form.scroll(Number(form.height));
        screen.render();
        return false;
      });

      upBtn.on('click', () => {
        form.scroll(-Number(form.height));
        screen.render();
        return false;
      });
      form.focusNext();
      screen.render();
      answers = await new Promise<Answers>((resolve, reject) => {
        screen.key(['escape'], async () => {
          try {
            const res: Answers | boolean = await formSubmit();

            if (res) {
              screen.remove(formBox);
              resolve(form.submission);
            }
          } catch (e) {
            screen.log('error', e);
            // reject(e)
          }
          screen.alloc();
          screen.render();
          screen.cursorReset();
        });
      });
    } catch (e) {
      screen.log(e);
    }
    screen.program.off('mouse', formInputMouseEmit);
    goNext();
  }
  // if(getCurrentState() === PROCESS_STATUS.ACTIONS_INVOKING){
  //   goNext();
  // }
  // if(getCurrentState() === PROCESS_STATUS.FINISHED){

  // }

  screen.destroy();
  return {
    template,
    ...answers
  };
};
