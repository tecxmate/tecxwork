import { readFile } from "node:fs/promises";
import path from "node:path";

import type { TaiwanSchoolOption } from "@/lib/student-profile";

const SCHOOL_NAME_EN_BY_CODE: Record<string, string> = {
  "0001": "National Chengchi University",
  "0002": "National Tsing Hua University",
  "0003": "National Taiwan University",
  "0004": "National Taiwan Normal University",
  "0005": "National Cheng Kung University",
  "0006": "National Chung Hsing University",
  "0007": "National Yang-Ming Chiao Tung University",
  "0008": "National Central University",
  "0009": "National Sun Yat-sen University",
  "0012": "National Taiwan Ocean University",
  "0013": "National Chung Cheng University",
  "0014": "National Kaohsiung Normal University",
  "0015": "National Changhua University of Education",
  "0017": "National Taipei University",
  "0018": "National Chiayi University",
  "0019": "National University of Kaohsiung",
  "0020": "National Dong Hwa University",
  "0021": "National Chi Nan University",
  "0022": "National Taiwan University of Science and Technology",
  "0023": "National Yunlin University of Science and Technology",
  "0024": "National Pingtung University of Science and Technology",
  "0025": "National Taipei University of Technology",
  "0028": "Taipei National University of the Arts",
  "0029": "National Taiwan University of Arts",
  "0030": "National Taitung University",
  "0031": "National Ilan University",
  "0032": "National United University",
  "0033": "National Formosa University",
  "0035": "Tainan National University of the Arts",
  "0036": "National University of Tainan",
  "0037": "National Taipei University of Education",
  "0039": "National Taichung University of Education",
  "0042": "National Penghu University of Science and Technology",
  "0043": "National Chin-Yi University of Technology",
  "0044": "National Taiwan Sport University",
  "0046": "National Taipei University of Nursing and Health Science",
  "0047": "National Kaohsiung University of Hospitality and Tourism",
  "0048": "National Quemoy University",
  "0049": "National Taiwan University of Sport",
  "0050": "National Taichung University of Science and Technology",
  "0051": "National Taipei University of Business",
  "0052": "National Pingtung University",
  "0053": "National Kaohsiung University of Science and Technology",
  "0144": "National Taiwan College of Performing Arts",
  "0221": "National Tainan Institute of Nursing",
  "0222": "National Taitung Junior College",
  "0A01": "National Open University",
  "1001": "Tunghai University",
  "1002": "Fu Jen Catholic University",
  "1003": "Soochow University",
  "1004": "Chung Yuan Christian University",
  "1005": "Tamkang University",
  "1006": "Chinese Culture University",
  "1007": "Feng Chia University",
  "1008": "Providence University",
  "1009": "Chang Gung University",
  "1010": "Yuan Ze University",
  "1011": "Chung Hua University",
  "1012": "Dayeh University",
  "1013": "Huafan University",
  "1014": "I-Shou University",
  "1015": "Shih Hsin University",
  "1016": "Ming Chuan University",
  "1017": "Shih Chien University",
  "1018": "Chaoyang University of Technology",
  "1019": "Kaohsiung Medical University",
  "1020": "Nanhua University",
  "1021": "Aletheia University",
  "1022": "Tatung University",
  "1023": "Southern Taiwan University of Science and Technology",
  "1024": "Kun Shan University",
  "1025": "Chia Nan University of Pharmacy & Science",
  "1026": "Shu-Te University",
  "1027": "Tzu Chi University",
  "1028": "Taipei Medical University",
  "1029": "Chung Shan Medical University",
  "1030": "Lunghwa University of Science and Technology",
  "1031": "Fooyin University",
  "1032": "Minghsin University of Science and Technology",
  "1033": "Chang Jung Christian University",
  "1034": "Hungkuang University",
  "1035": "China Medical University",
  "1036": "Chien Hsin University of Science and Technology",
  "1037": "Cheng Shiu University",
  "1038": "Vanung University",
  "1039": "Hsuan Chuang University",
  "1040": "Chienkuo Technology University",
  "1041": "Ming Chi University of Technology",
  "1042": "Taiwan Steel University ofScience and Technology",
  "1043": "Tajen University",
  "1044": "St. John's University",
  "1045": "Ling Tung University",
  "1046": "China University of Technology",
  "1047": "Central Taiwan University of Science and Technology",
  "1048": "Asia University",
  "1049": "Kainan University",
  "1050": "Fo Guang University",
  "1051": "Tainan University of Technology",
  "1052": "CTBC University of Technology",
  "1053": "Yuanpei University of Medical Technology",
  "1054": "Jinwen University of Science and Technology",
  "1055": "Chung Hwa University of Medical Technology",
  "1056": "Tungnan University",
  "1057": "Takming University of Science and Technology",
  "1060": "Nan Kai University of Technology",
  "1061": "China University of Science and Technology",
  "1062": "Overseas Chinese University",
  "1063": "Yu Da University of Science and Technology",
  "1064": "Meiho University",
  "1065": "Wufeng University",
  "1069": "Hsiuping University of Science and Technology",
  "1070": "Chang Gung University of Science and Technology",
  "1071": "Taipei City University of Science and Technology",
  "1072": "Minth University of Science and Technology",
  "1073": "Hsing Wu University of Science and Technology",
  "1075": "Wenzao Ursuline University of Languages",
  "1076": "Hwa Hsia University of Technology",
  "1078": "Chihlee University of Technology",
  "1079": "University of Kang Ning",
  "1080": "Hungkuo Delin University of Technology",
  "1082": "Chungyu University of Film and Arts Technology",
  "1083": "Taipei University of Marine Technology",
  "1084": "Asia Eastern University of Science and Technology",
  "1085": "Mackay Medical University",
  "1125": "CTBC Financial Management College",
  "1168": "Nanya Institute of Technology",
  "1183": "Lee-Ming Institute of Technology",
  "1185": "Deh Yu College of Nursing and Health",
  "1196": "Dharma Drum Institute of Liberal Arts",
  "1282": "Mackay Junior College of Medicine , Nursing and Management",
  "1283": "Jen-Teh Junior College of Medicine, Nursing and Management",
  "1284": "Shu-Zen Junior College of Medicine and Management",
  "1285": "Tzu Hui Institute of Technology",
  "1286": "Cardinal Tien Junior College of Healthcare & Management",
  "1287": "Min-Hwei Junior College of Health Care Management",
  "1289": "Yuh-Ing Junior College of Health Care & Management",
  "1291": "St. Mary's Junior College of Medicine, Nursing and Management College",
  "1292": "Hsin Sheng Junior College of Medical Care and Management",
  "1293": "Chung-Jen Junior College of Nursing, Health Sciences and Management",
  "1R02": "Taiwan Baptist Christian Seminary",
  "1R03": "Christ's College Taipei",
  "1R05": "Taiwan Graduate School of Theology",
  "1R06": "I-Kuan Tao Chong-De School",
  "1R07": "Tainan Theological College and Seminary",
  "1R08": "China Evangelical Graduate School of Theology",
  "1R09": "Weixin Shengjiao College",
  "1R10": "Bliss and Wisdom Buddhist College",
  "3002": "University of Taipei",
  "3A01": "Open University of Kaohsiung",
};

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((value) => value.trim());
}

function parseSchoolRows(raw: string) {
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const rows: string[] = [];
  let buffer = "";

  for (const line of lines.slice(1)) {
    buffer = buffer ? `${buffer}${line}` : line;
    const parsed = parseCsvLine(buffer);

    if (parsed.length >= 9) {
      rows.push(buffer);
      buffer = "";
    }
  }

  if (buffer) {
    rows.push(buffer);
  }

  return rows;
}

function cleanCity(city?: string) {
  return (city ?? "").replace(/^\[[^\]]+\]/, "").trim();
}

function cleanSchoolType(value?: string) {
  return (value ?? "").replace(/^\[[^\]]+\]/, "").trim();
}

function normalizeEnglishName(code: string, nameZh: string) {
  return SCHOOL_NAME_EN_BY_CODE[code] ?? nameZh;
}

export async function loadTaiwanSchoolDataset(): Promise<TaiwanSchoolOption[]> {
  const filePath = path.join(process.cwd(), "public/dataset/u1_new.csv");
  const raw = await readFile(filePath, "utf8");
  const rows = parseSchoolRows(raw);

  return rows.flatMap((line) => {
    const [, code, nameZh, , city, , , , schoolType] = parseCsvLine(line);
    if (!code || !nameZh) {
      return [];
    }

    const nameEn = normalizeEnglishName(code, nameZh);

    return [
      {
        code,
        nameZh,
        nameEn,
        label: `${nameZh} / ${nameEn}`,
        city: cleanCity(city),
        schoolType: cleanSchoolType(schoolType),
      },
    ];
  });
}
