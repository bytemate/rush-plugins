import blessed, { box, Widgets } from 'blessed';
import { goNext, start, getCurrentState, PROCESS_STATUS } from './EventManager';
import { Steps } from './components/steps';
import { Form } from './components/form';
import { TemplateList } from './components/templateList';
import type { Answers } from 'inquirer';
import type { IPluginContext } from '../logic/TemplateConfiguration';
import type { NodePlopAPI, PlopCfg, PromptQuestion } from 'node-plop';
import { ICliParams } from '../init-project';
import { COLORS } from './COLORS';
import { Warning } from './components/Warning';
import { CUSTOM_EMIT_EVENTS } from './EMIT_EVENTS';
import { TerminalSingleton } from '../terminal';

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
    useBCE: true,
    terminal: 'xterm-256color',
    fullUnicode: true
  });
  const { stepBox, setStep } = Steps();
  const { WarningBox, setWarningContent } = Warning();
  screen.append(stepBox);
  screen.append(WarningBox);
  // exits the process
  screen.program.key(['C-c'], () => {
    return process.exit(0);
  });
  screen.on('resize', () => {
    screen.render();
  });
  start();
  let answers: Answers = {};
  let template: string = '';
  if (getCurrentState() === PROCESS_STATUS.TEMPLATE_SELECTING) {
    setWarningContent('move with ⬇/⬆  press space or enter to next stage. Exit with Ctrl+c.');
    setStep(PROCESS_STATUS.TEMPLATE_SELECTING);
    const templateBox: Widgets.BoxElement = box({
      parent: screen,
      top: 4,
      width: '100%',
      height: '100%-5'
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
      templateList.key(['space'], function () {
        templateList.emit('keypress', '\r', { name: 'enter' });
      });
    });
    await loadTemplateConfiguration(promptQueue, template);
    goNext();
  }
  if (getCurrentState() === PROCESS_STATUS.FORM_FILLING) {
    setWarningContent('move with ⬇/⬆ or tab. Exit with Ctrl+c.');
    setStep(PROCESS_STATUS.FORM_FILLING);
    const formBox: Widgets.BoxElement = box({
      parent: screen,
      top: 4,
      tags: true,
      width: '100%',
      height: '100%-5',
      content: `Selected Template: {${COLORS.blue4}}${template}{/${COLORS.blue4}}`
    });
    try {
      const { form } = await Form(promptQueue);
      formBox.append(form);

      form.focusNext();
      screen.render();
      answers = await new Promise<Answers>((resolve) => {
        form.on(CUSTOM_EMIT_EVENTS.SUBMIT_ANSWERS, (res) => {
          if (res) {
            resolve(res);
          }
        });
      });
    } catch (error: any) {
      screen.log(error);
      TerminalSingleton.getInstance().writeErrorLine((error ?? 'error')?.toString());
      process.exit(1);
    }
    goNext();
  }
  // if(getCurrentState() === PROCESS_STATUS.ACTIONS_INVOKING){
  //   goNext();
  // }
  // if(getCurrentState() === PROCESS_STATUS.FINISHED){

  // }
  TerminalSingleton.getInstance().writeVerboseLine(`answers:  `);
  screen.destroy();
  return {
    template,
    ...answers
  };
};
