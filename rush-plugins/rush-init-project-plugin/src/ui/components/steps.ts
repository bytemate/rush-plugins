import { box, layout, Widgets } from 'blessed';
import { COLORS } from '../COLORS';
import { PROCESS_STATUS } from '../EventManager';
export const Steps = (): {
  stepBox: Widgets.LayoutElement;
  setStep: (step: number) => void;
} => {
  const stepBox: Widgets.LayoutElement = layout({
    layout: 'grid',
    top: 0,
    shrink: true,
    left: 0,
    height: 3,
    width: '100%'
  });
  const stepsKey: number[] = [PROCESS_STATUS.TEMPLATE_SELECTING, PROCESS_STATUS.FORM_FILLING];
  const steps: string[] = ['Template Selection', 'Form Filling'];
  const setStep: (step: number) => void = (step: number) => {
    while (stepBox.children.length > 0) {
      stepBox.children.pop();
    }
    stepsKey.forEach((stepKey: number, index) => {
      const stepEle: Widgets.BoxElement = box({
        tags: true,
        padding: {
          top: 1,
          right: 2,
          left: 2,
          bottom: 1
        },
        content: `{center}step ${index + 1}: ${steps[index]}{/center}`,
        width: '50%',
        style: {
          bold: stepKey === step,
          bg: stepKey === step ? COLORS.blue4 : COLORS.grey0
        }
      });
      stepBox.append(stepEle);
    });
    stepBox.screen.render();
  };

  return { stepBox, setStep };
};
