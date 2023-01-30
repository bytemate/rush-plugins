import { list, Widgets } from 'blessed';
import { COLORS } from '../COLORS';

export const TemplateList = (
  choices: { name: string; value: string }[]
): {
  templateList: Widgets.ListElement;
} => {
  const templateList: Widgets.ListElement = list({
    keys: true,
    width: '100%',
    mouse: true,
    style: {
      item: {
        hover: {
          bg: COLORS.grey0
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
