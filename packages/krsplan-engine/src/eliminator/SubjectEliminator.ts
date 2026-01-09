import { SubjectSchedule } from "./../parser/SubjectSchedule";

export abstract class SubjectElminator {
  next: SubjectElminator | null = null;
  message: string = "Eliminated";

  setMessage(message: string): void {
    this.message = message;
  }

  setNext(next: SubjectElminator): SubjectElminator {
    this.next = next;
    return next;
  }

  execute(targetSchedule: SubjectSchedule, reason: string[]): string[] {
    if (this.next !== null) {
      return this.next.execute(targetSchedule, reason);
    }

    return reason;
  }
}
