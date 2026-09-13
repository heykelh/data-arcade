export type Field = "nom" | "email" | "tel" | "naissance" | "iban" | "ville";
export const FIELDS_ORDER: Field[] = ["nom", "email", "tel", "naissance", "iban", "ville"];

export type Fiche = {
  nom: string; email: string; tel: string; naissance: string; iban: string; ville: string;
  clean: boolean; flag: Field | null; reasonKey: string | null;
};

const FIRST = ["Camille","Lucas","Fatou","Mehdi","Chloé","Rigobert","Amadou","Léa","Youssef","Inès","Théo","Awa","Nathan","Salma","Hugo","Maëlys","Karim","Jade"];
const LAST = ["Martin","Diallo","Nguyen","Dubois","Traoré","Bernard","Sow","Petit","Faye","Moreau","Lefebvre","Ba","Rousseau","Ndiaye","Girard","Cissé"];
const CITY = ["Paris","Lyon","Lagny-sur-Marne","Dakar","Marseille","Lille","Nantes","Toulouse","Rennes","Bordeaux","Thiès"];

const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const pad = (n: number) => String(n).padStart(2, "0");
const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

function base(): Fiche {
  const first = rnd(FIRST), last = rnd(LAST);
  const email = `${strip(first)}.${strip(last)}@${rnd(["gmail.com","outlook.fr","proton.me","laposte.net"])}`;
  const tel = `+33 6 ${pad(10 + Math.floor(Math.random() * 80))} ${pad(Math.floor(Math.random() * 100))} ${pad(Math.floor(Math.random() * 100))}`;
  const y = 1962 + Math.floor(Math.random() * 44);
  const naissance = `${pad(1 + Math.floor(Math.random() * 28))}/${pad(1 + Math.floor(Math.random() * 12))}/${y}`;
  const iban = `FR76 ${rnd(["3000","1027","1720","1444"])} ${pad(Math.floor(Math.random() * 100))}${pad(Math.floor(Math.random() * 100))} ${pad(Math.floor(Math.random() * 100))}${pad(Math.floor(Math.random() * 100))} 088`;
  return { nom: `${first} ${last}`, email, tel, naissance, iban, ville: rnd(CITY), clean: true, flag: null, reasonKey: null };
}

const ERRORS: Array<(r: Fiche) => void> = [
  (r) => { r.email = r.email.replace("@", ""); r.flag = "email"; r.reasonKey = "emailNoAt"; },
  (r) => { r.email = r.email.replace(".", " ").replace("@", " @ "); r.flag = "email"; r.reasonKey = "emailSpace"; },
  (r) => { r.tel = r.tel.replace("6", "O"); r.flag = "tel"; r.reasonKey = "telLetter"; },
  (r) => { r.tel = "06 12 34"; r.flag = "tel"; r.reasonKey = "telShort"; },
  (r) => { const y = 2027 + Math.floor(Math.random() * 8); r.naissance = r.naissance.slice(0, 6) + y; r.flag = "naissance"; r.reasonKey = "dobFuture"; },
  (r) => { r.naissance = "32/13/" + r.naissance.slice(6); r.flag = "naissance"; r.reasonKey = "dateInvalid"; },
  (r) => { r.iban = r.iban.slice(0, 14); r.flag = "iban"; r.reasonKey = "ibanLen"; },
  (r) => { const e = r.email, t = r.tel; r.email = t; r.tel = e; r.flag = "email"; r.reasonKey = "swapped"; },
  (r) => { const f = rnd<Field>(["email","tel","ville"]); r[f] = "—"; r.flag = f; r.reasonKey = "missing"; },
];

export function newFiche(): Fiche {
  const r = base();
  if (Math.random() < 0.52) { rnd(ERRORS)(r); r.clean = false; }
  return r;
}
