import type { PromptQuestion } from "node-plop";

export class TemplateConfiguration {
  private constructor() {}
  public static async loadFromTemplate(
    template: string
  ): Promise<TemplateConfiguration> {
    // TODO: load logic
    if (!template) {
      throw new Error(
        "template is required when loading template configuration"
      );
    }
    return new TemplateConfiguration();
  }

  // TODO: add prompts
  public get prompts(): PromptQuestion[] {
    return [];
  }

  // TODO: add plugins
  public get plugins(): any[] {
    return [];
  }
}
