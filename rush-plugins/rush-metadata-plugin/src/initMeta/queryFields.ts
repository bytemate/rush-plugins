import inquirer from "inquirer";
import { IMetadataField } from "../types/metadataField";

export const queryFields = async (fields: IMetadataField[]): Promise<Record<string, string>> => {

  const inquirerQuestions: any = [];

  for (const field of fields) {
    const question: any = {
      name: field.name,
      message: field.prompt,
      type: "input"
    };
    switch(field.fieldType) {
      case "string":
      case "number":
        question.type = "input";
        break;
      case "list":
        question.type = "list";
        question.choices = field.choices || [];
        break;
    }
    inquirerQuestions.push(question);
  }

  const answers: any = await inquirer.prompt(inquirerQuestions);
  console.log('The answers entered are: ', answers);
  const {confirmAnswers}: any = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmAnswers',
      message: 'Do you want to save the above answers to the metadata file?'
    }
  ])

  if (!confirmAnswers) {
    return {};
  }

  return answers;

}