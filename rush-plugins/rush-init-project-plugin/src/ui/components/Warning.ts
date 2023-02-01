import { box, Widgets } from 'blessed';
import { COLORS } from '../COLORS';

export const Warning = (): {
  WarningBox: Widgets.BoxElement;
  setWarningContent: (content: string) => void;
} => {
  const WarningBox: Widgets.BoxElement = box({
    bottom: 0,
    height: 1,
    transparent: true,
    index: 10,
    style: {
      fg: COLORS.amber6
    }
  });
  const setWarningContent = (content: string): void => {
    WarningBox.setContent(content);
  };
  // list.focus();
  return { WarningBox, setWarningContent };
};
