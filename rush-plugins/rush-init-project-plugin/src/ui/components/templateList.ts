import { list, Widgets } from 'blessed';
import { COLORS } from '../COLOR';

export const TemplateList = (
  choices: { name: string; value: string }[]
): {
  templateList: Widgets.ListElement;
} => {
  const templateList: Widgets.ListElement = list({
    keys: true,
    mouse: true,
    scrollbar: {
      ch: ' ',
      track: {
        bg: COLORS.red3
      },
      style: {
        inverse: true
      }
    },
    style: {
      item: {
        hover: {
          bg: COLORS.blue3
        }
      },
      selected: {
        bg: COLORS.blue4,
        bold: true
      }
    },
    items: choices.map((choice) => choice.name)
  });

  // list.focus();
  return { templateList };
};
