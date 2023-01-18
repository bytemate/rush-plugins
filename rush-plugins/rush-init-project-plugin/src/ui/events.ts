export const PROCESS_STATUS: Record<string, number> = {
  NULL: -1,
  START: 0,
  TEMPLATE_SELECTING: 1,
  FORM_FILLING: 2,
  ACTIONS_INVOKING: 3,
  FINISHED: 4
};

let currentState: number = PROCESS_STATUS.NULL;

export const getCurrentState = (): number => {
  return currentState;
};
export const start = (): void => {
  currentState = PROCESS_STATUS.TEMPLATE_SELECTING;
};
export const goNext = (): void => {
  switch (currentState) {
    case PROCESS_STATUS.NULL:
      currentState = PROCESS_STATUS.START;
      break;
    case PROCESS_STATUS.START:
      currentState = PROCESS_STATUS.TEMPLATE_SELECTING;
      break;
    case PROCESS_STATUS.TEMPLATE_SELECTING:
      currentState = PROCESS_STATUS.FORM_FILLING;
      break;
    case PROCESS_STATUS.FORM_FILLING:
      currentState = PROCESS_STATUS.ACTIONS_INVOKING;
      break;
    case PROCESS_STATUS.ACTIONS_INVOKING:
      currentState = PROCESS_STATUS.FINISHED;
      break;
    default:
      currentState = PROCESS_STATUS.NULL;
      break;
  }
};

// const goPrev = () => {
//   switch(currentState){
//     case PROCESS_STATUS.FORM_FILLING:
//       currentState = PROCESS_STATUS.TEMPLATE_SELECTING;
//       break;
//     default
//       break;
//   }
// }
