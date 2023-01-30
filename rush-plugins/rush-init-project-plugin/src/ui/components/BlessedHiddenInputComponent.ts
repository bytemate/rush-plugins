import { Widgets } from 'blessed';
import { BaseValueType } from './BaseFieldComponent';
import Box from 'blessed/lib/widgets/box';

export class BlessedHiddenInputComponent extends Box {
  public value: BaseValueType;
  public type: string = 'hiddeninput';
  public constructor(opts: Widgets.InputOptions) {
    super(opts);
    this.value = '';
  }
  public setValue(value: BaseValueType): void {
    if (!value) {
      return;
    }
    this.value = value;
  }
  public getValue(): BaseValueType {
    return this.value;
  }
}
