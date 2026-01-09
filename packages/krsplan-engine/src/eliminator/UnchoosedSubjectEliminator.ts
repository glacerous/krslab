import { SubjectElminator } from "./SubjectEliminator";
import { SubjectSchedule } from "./../parser/SubjectSchedule";

export class UnchoosedSubjectEliminator extends SubjectElminator {
  choosedSubject: string[] = [];

  choose(subject: string): void {
    this.choosedSubject.push(subject);
  }

  chooseMany(subjects: string[]): void {
    this.choosedSubject = [...this.choosedSubject, ...subjects];
  }

  execute(targetSchedule: SubjectSchedule, reason: string[]): string[] {
    if (
      !this.choosedSubject.find((schedule) => schedule === targetSchedule.name)
    ) {
      reason.push(this.message);
    }

    return super.execute(targetSchedule, reason);
  }
}
