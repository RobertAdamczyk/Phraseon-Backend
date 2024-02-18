import {FieldValue} from "firebase-admin/firestore";
import {Language} from "./Language";
import {Technology} from "./technology";

export interface Project {
    name: string;
    technologies: Technology[];
    languages: Language[];
    baseLanguage: Language;
    members: string[];
    owner: string;
    securedAlgoliaApiKey: string;
    createdAt: FieldValue;
}
