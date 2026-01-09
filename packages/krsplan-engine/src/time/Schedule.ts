import { IntervalTime } from "./IntervalTime";
import { Time } from "./Time";

export class Schedule {
  day: string;
  intervalTime: IntervalTime;

  constructor(day: string, intervalTime: IntervalTime) {
    this.day = day;
    this.intervalTime = intervalTime;
  }

  isOverlap(schedule: Schedule): boolean {
    if (schedule.day != this.day) {
      return false;
    }

    return this.intervalTime.isInRange(schedule.intervalTime);
  }

  static buildFromString(schedule: string): Schedule {
    const [day, time] = schedule.split(" ");
    const [start, end] = time.split("-");
    return new Schedule(
      day,
      new IntervalTime(Time.buildFromString(start), Time.buildFromString(end)),
    );
  }
}
