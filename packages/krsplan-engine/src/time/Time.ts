export class Time {
  hour: number;
  minute: number;

  constructor(hour: number, minute: number) {
    this.hour = hour;
    this.minute = minute;
  }

  inMinute(): number {
    return this.hour * 60 + this.minute;
  }

  static buildFromString(time: string) {
    const res = time.split(":");
    return new Time(parseInt(res[0]), parseInt(res[1]));
  }
}
