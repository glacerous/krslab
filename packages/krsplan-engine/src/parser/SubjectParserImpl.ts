import { SubjectSchedule } from "./SubjectSchedule";
import { SubjectParser } from "./SubjectParser";
import { Schedule } from "./../time/Schedule";

function isIntegerString(str: string): boolean {
  return /^-?\d+$/.test(str);
}

export class SubjectParserImpl implements SubjectParser {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  parse(): SubjectSchedule[] {
    const results: SubjectSchedule[] = [];

    const lines = this.text.split("\n");

    let key: string = "";

    let subjectItemTemp: SubjectSchedule = {
      id: 0,
      studyProgram: "temp",
      code: "temp",
      name: "temp",
      credits: 0,
      className: "temp",
      numberOfStudent: 0,
      schedule: Schedule.buildFromString("Senin 07:00-10:00"),
      classRoom: "temp",
      lecturers: [],
    };

    let counter = 1;

    for (const line of lines) {
      if (line.length === 0) {
        continue;
      }
      const parsedLine = line.split("\t");

      if (key === "") {
        key = parsedLine[0];
      }

      if (parsedLine[0] == key) {
        let creditIndex = 3;
        let classNameIndex = 4;

        if(!isIntegerString(parsedLine[creditIndex])) {
          console.log("haii");
          [creditIndex, classNameIndex] = [classNameIndex, creditIndex];
        }

        subjectItemTemp = {
          id: counter,
          studyProgram: key,
          code: parsedLine[1],
          name: parsedLine[2].trim(),
          credits: parseInt(parsedLine[creditIndex]),
          className: parsedLine[classNameIndex],
          numberOfStudent: parseInt(parsedLine[5]),
          schedule: Schedule.buildFromString(parsedLine[6]),
          classRoom: parsedLine[7],
          lecturers: [],
        };

        if (subjectItemTemp !== null) {
          results.push(subjectItemTemp);
        }

        counter += 1;
      } else {
        subjectItemTemp.lecturers.push(parsedLine[0]);
      }
    }

    return results;
  }
}
