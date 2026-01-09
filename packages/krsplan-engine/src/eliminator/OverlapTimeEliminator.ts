import { SubjectElminator } from "./SubjectEliminator";
import { SubjectSchedule } from "./../parser/SubjectSchedule";

export class OverlapTimeEliminator extends SubjectElminator {
  subjectSchedule: SubjectSchedule;

  constructor(subjectSchedule: SubjectSchedule) {
    super();
    this.subjectSchedule = subjectSchedule;
  }

  execute(targetSchedule: SubjectSchedule, reason: string[]): string[] {
    if (this.subjectSchedule.schedule.isOverlap(targetSchedule.schedule)) {
      reason.push(this.message);
    }

    return super.execute(targetSchedule, reason);
  }
}
