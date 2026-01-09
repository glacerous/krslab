import { Time } from "./Time";

export class IntervalTime {
  start: Time;
  end: Time;

  constructor(start: Time, end: Time) {
    this.start = start;
    this.end = end;
  }

  isInRange(intervalTime: IntervalTime): boolean {
    let low, high;
    if (this.start.inMinute() < intervalTime.start.inMinute()) {
      low = intervalTime.start.inMinute() - this.start.inMinute();
      high = this.end.inMinute() - this.start.inMinute();
    } else {
      low = this.start.inMinute() - intervalTime.start.inMinute();
      high = intervalTime.end.inMinute() - intervalTime.start.inMinute();
    }

    if (low < high) {
      return true;
    }

    return false;
  }
}
