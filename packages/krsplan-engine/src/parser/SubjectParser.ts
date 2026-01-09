import { SubjectSchedule } from "./SubjectSchedule";

export interface SubjectParser {
  parse(): SubjectSchedule[];
}
