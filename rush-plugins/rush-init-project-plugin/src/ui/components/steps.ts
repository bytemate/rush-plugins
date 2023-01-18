import { box, Widgets } from 'blessed';
import { COLORS } from '../COLOR';
import { PROCESS_STATUS } from '../events';
export const Steps = (): {
  stepBox: Widgets.BoxElement;
  setStep: (step: number) => void;
} => {
  const stepBox: Widgets.BoxElement = box({
    top: 0,
    height: 1,
    left: 0,
    width: '100%',
    style: {
      transparent: true,
      bg: COLORS.red3
    }
  });
  const stepsKey: number[] = [PROCESS_STATUS.TEMPLATE_SELECTING, PROCESS_STATUS.FORM_FILLING];
  const steps: string[] = ['template', 'fill form'];
  const setStep: (step: number) => void = (step: number) => {
    while (stepBox.children.length > 0) {
      stepBox.children.pop();
    }
    stepsKey.forEach((stepKey, index) => {
      const stepEle: Widgets.BoxElement = box({
        content: steps[index],
        top: 0,
        left: `${index * 50}%`,
        bg: stepKey === step ? COLORS.red3 : COLORS.blue3
      });
      stepBox.append(stepEle);
    });
  };

  return { stepBox, setStep };
};
