import { SubjectElminator } from "./SubjectEliminator";
import { SubjectSchedule } from "./../parser/SubjectSchedule";

export class ChoosedSubjectEliminator extends SubjectElminator {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  execute(targetSchedule: SubjectSchedule, reason: string[]): string[] {
    if (targetSchedule.name == this.name) {
      reason.push(this.message);
    }

    return super.execute(targetSchedule, reason);
  }
}
